CREATE TABLE "TrafficVisit" (
    "sessionId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "referrerDomain" TEXT,
    "utmSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrafficVisit_pkey" PRIMARY KEY ("sessionId")
);

CREATE INDEX "TrafficVisit_createdAt_source_idx" ON "TrafficVisit"("createdAt", "source");
