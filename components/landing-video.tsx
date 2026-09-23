"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type LandingVideoProps = {
  /** Element ID without '#'. Omit to keep the five-second continuation. */
  trackElementId?: string;
  /** Crossing line below the viewport top; use the sticky header height if needed. */
  topOffset?: number;
};

export default function LandingVideo({
  trackElementId,
  topOffset = 0,
}: LandingVideoProps) {
  const first = useRef<HTMLVideoElement>(null);
  const second = useRef<HTMLVideoElement>(null);
  const queued = useRef(false);
  const starting = useRef(false);
  const frame = useRef<number | null>(null);
  const reverseFrame = useRef<number | null>(null);
  const reversing = useRef(false);
  const [part, setPart] = useState<1 | 2>(1);
  const [requested, setRequested] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState("");

  async function startSecond() {
    const video = second.current;
    if (!video || starting.current) return;
    stopReverse();
    starting.current = true;
    setError("");
    // Retain the final frame of part 1 until part 2 has a frame to display.
    if (typeof video.requestVideoFrameCallback === "function") {
      frame.current = video.requestVideoFrameCallback(() => {
        frame.current = null;
        setPart(2);
      });
    }
    try {
      await video.play();
    } catch {
      if (frame.current !== null) {
        video.cancelVideoFrameCallback(frame.current);
        frame.current = null;
      }
      starting.current = false;
      queued.current = false;
      setRequested(false);
      setError("پخش شروع نشد. دوباره تلاش کنید.");
    }
  }

  // Speed applies to part 2, including when it is queued behind part 1.
  function continueVideo(speed = 1.5) {
    if (reversing.current || !Number.isFinite(speed) || speed <= 0) return;
    const video = second.current;
    if (!video) return;
    try {
      video.playbackRate = speed;
    } catch {
      setError("این سرعت پخش در مرورگر پشتیبانی نمی‌شود.");
      return;
    }
    queued.current = true;
    setRequested(true);
    if (first.current?.ended) {
      void startSecond();
    } else {
      void first.current?.play().catch(() => {
        queued.current = false;
        setRequested(false);
        setError("برای شروع، دکمه پخش را بزنید.");
      });
    }
  }

  function stopReverse() {
    reversing.current = false;
    if (reverseFrame.current !== null) {
      cancelAnimationFrame(reverseFrame.current);
      reverseFrame.current = null;
    }
  }

  // Call playSecondReverse() from a handler; optionally pass a positive speed.
  // Rewinds from the current position, or from the end if still at time zero.
  function playSecondReverse(speed = 1.5) {
    const video = second.current;
    if (!video || !Number.isFinite(speed) || speed <= 0) return;
    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      setError("ویدیو هنوز آماده نیست. کمی صبر کنید.");
      return;
    }

    stopReverse();
    first.current?.pause();
    video.pause();
    if (frame.current !== null) {
      video.cancelVideoFrameCallback(frame.current);
      frame.current = null;
    }
    queued.current = false;
    starting.current = false;
    reversing.current = true;
    setPart(2);
    setRequested(false);
    setFinished(false);
    setPlaying(true);
    setError("");

    const startTime =
      video.currentTime > 0 ? video.currentTime : video.duration;
    video.currentTime = startTime;
    let previousTime = performance.now();
    let position = startTime;

    // Negative playbackRate is not widely supported. Seek backwards instead,
    // allowing each seek to finish before asking the decoder for another frame.
    function step(now: number) {
      if (!reversing.current || !video) return;
      const elapsed = Math.min((now - previousTime) / 1000, 0.1);
      previousTime = now;
      if (video.error) {
        stopReverse();
        setPlaying(false);
        return;
      }
      position = Math.max(0, position - elapsed * speed);
      if (!video.seeking) {
        video.currentTime = position;
        if (position === 0) {
          stopReverse();
          setPlaying(false);
          return;
        }
      }
      reverseFrame.current = requestAnimationFrame(step);
    }
    reverseFrame.current = requestAnimationFrame(step);
  }

  async function togglePlayback() {
    if (reversing.current) {
      stopReverse();
      setPlaying(false);
      return;
    }
    const video = part === 1 ? first.current : second.current;
    if (!video) return;
    if (!video.paused) {
      video.pause();
      return;
    }
    setError("");
    try {
      await video.play();
    } catch {
      setError("پخش ویدیو ممکن نیست. دوباره تلاش کنید.");
    }
  }

  // Customize these two handlers to change what each crossing does.
  const handlePassDown = useEffectEvent(() => {
    stopReverse();
    continueVideo();
  });

  const handlePassUp = useEffectEvent(() => {
    queued.current = false;
    setRequested(false);
    if (second.current && second.current.currentTime > 0) {
      playSecondReverse();
    }
  });

  useEffect(() => {
    if (!trackElementId) return;

    let target = document.getElementById(trackElementId);
    let wasPast = target
      ? target.getBoundingClientRect().top <= topOffset
      : null;
    let previousScrollY = window.scrollY;
    let pendingFrame: number | null = null;
    // Initial placement (including restored scroll position) is only a baseline.
    // An upward callback is armed only after an actual downward crossing.
    let crossedDown = false;

    function checkCrossing() {
      pendingFrame = null;
      const scrollY = window.scrollY;
      const direction = scrollY - previousScrollY;
      previousScrollY = scrollY;
      const currentTarget = document.getElementById(trackElementId!);
      if (currentTarget !== target) {
        target = currentTarget;
        wasPast = null;
        crossedDown = false;
      }
      if (!target) return;

      const isPast = target.getBoundingClientRect().top <= topOffset;
      const previous = wasPast;
      wasPast = isPast;
      if (previous === null) return;

      if (!previous && isPast && direction > 0) {
        crossedDown = true;
        handlePassDown();
      } else if (previous && !isPast && direction < 0 && crossedDown) {
        crossedDown = false;
        handlePassUp();
      }
    }

    function scheduleCheck() {
      if (pendingFrame === null) {
        pendingFrame = requestAnimationFrame(checkCrossing);
      }
    }

    window.addEventListener("scroll", scheduleCheck, { passive: true });
    window.addEventListener("resize", scheduleCheck);
    return () => {
      window.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);
      if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
    };
  }, [trackElementId, topOffset]);

  const continueAfterDelay = useEffectEvent(() => continueVideo());

  useEffect(() => {
    const video = first.current;
    const next = second.current;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      void video?.play().catch(() => {
        // Browsers may block autoplay; the play button remains available.
      });
    }

    return () => {
      reversing.current = false;
      if (reverseFrame.current !== null)
        cancelAnimationFrame(reverseFrame.current);
      video?.pause();
      next?.pause();
      if (frame.current !== null) next?.cancelVideoFrameCallback(frame.current);
    };
  }, []);

  useEffect(() => {
    if (trackElementId) return;
    const timeout = setTimeout(() => continueAfterDelay(), 5000);
    return () => clearTimeout(timeout);
  }, [trackElementId]);

  const widthFormula = `min(calc(100svh - 74px), 100vw)`;

  return (
    <>
      {/* video */}
      <div
        className="sticky top-0 origin-top z-[-1] pointer-events-none w-full aspect-square"
        style={{ width: widthFormula }}
      >
        <div className="relative aspect-square w-full">
          <video
            ref={first}
            src="/landing-shots/lens-p1.mp4"
            width={1024}
            height={1024}
            muted
            playsInline
            preload="auto"
            aria-label="نمایش عدسی، بخش اول"
            aria-hidden={part !== 1}
            className="absolute inset-0 h-full w-full object-contain"
            onPlay={() => setPlaying(true)}
            onPause={() => {
              if (!reversing.current) setPlaying(false);
            }}
            onEnded={() => {
              setPlaying(false);
              if (queued.current) void startSecond();
            }}
            onError={() => setError("بارگذاری بخش اول ویدیو ناموفق بود.")}
          />
          <video
            ref={second}
            src="/landing-shots/lens-p2.mp4"
            width={1024}
            height={1024}
            muted
            playsInline
            preload="auto"
            aria-label="نمایش عدسی، بخش دوم"
            aria-hidden={part !== 2}
            className={`absolute inset-0 h-full w-full object-contain ${part === 2 ? "opacity-100" : "pointer-events-none opacity-0"}`}
            onPlaying={() => {
              setPlaying(true);
              if (
                typeof second.current?.requestVideoFrameCallback !== "function"
              ) {
                setPart(2);
              }
            }}
            onPause={() => {
              if (!reversing.current) setPlaying(false);
            }}
            onEnded={() => {
              if (reversing.current) return;
              setPlaying(false);
              setFinished(true);
            }}
            onError={() => setError("بارگذاری بخش دوم ویدیو ناموفق بود.")}
          />
        </div>
      </div>

      {/* actual dom */}
      {/* <div
        className="grid place-items-center text-xl md:text-4xl font-semibold text-shadow-2xs text-shadow-black"
        style={{ height: "calc(100svh - 74px)" }}
      ></div> */}

      {/* <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={() => playSecondReverse()}>
          پخش معکوس بخش دوم
        </Button>
        <Button type="button" variant="outline" onClick={togglePlayback}>
          {playing ? "توقف" : finished ? "پخش دوباره بخش دوم" : "پخش"}
        </Button>
        <Button
          type="button"
          onClick={() => continueVideo()}
          disabled={requested || part === 2}
        >
          {part === 2
            ? "بخش دوم"
            : requested
              ? "ادامه پس از پایان بخش اول"
              : "ادامه ویدیو"}
        </Button>
      </div> */}
    </>
  );
}
