import Image from "next/image";
import Japan from "../public/flags/japan.png";
import SouthKorea from "../public/flags/south-korea.jpg";
import Care from "../public/category-img/see-care.webp";
import Max from "../public/category-img/see-max.webp";
import More from "../public/category-img/see-more.webp";
import Fine from "../public/category-img/see-fine.webp";

export default function LandingProductsSummery() {
  return (
    <>
      <div className="w-full py-6 px-5 space-y-2">
        {/* see care */}
        <div className="flex shadow-md shadow-black/30 z-10 flex-col sm:flex-row gap-2 p-3 border bg-card/20 rounded-lg">
          {/* image container */}
          <div className="relative flex sm:block gap-2 w-full sm:max-w-[200px]">
            <div className="relative overflow-hidden aspect-[1.1/1] w-full max-w-[120px] sm:max-w-[200px] shrink-0 rounded-lg border-2 border-emerald-800">
              <Image
                src={Care}
                alt="eye care - premium glass lens"
                placeholder="blur"
                fill
                sizes="250px"
                className="object-cover"
              />
            </div>

            {/* flag container */}
            <div className="w-fit rounded-lg overflow-hidden absolute -right-2 -top-2">
              <Image
                src={Japan}
                alt="japan flag - see care glasses are made in japan"
                width={25}
                height={25}
              />
            </div>

            {/* small screen content */}
            <div className="sm:hidden">
              {/* title */}
              <h2 className="mt-1 mb-2 text-2xl text-wrap font-semibold">
                عدسی های See Care
              </h2>

              {/* tags */}
              <div className="w-full flex flex-wrap gap-1 text-[8px]">
                <span className="bg-fuchsia-500/40 border-fuchsia-500/60 px-1 py-0.5 rounded-full border-2">
                  Anti Glare
                </span>
                <span className="bg-blue-500/40 border-blue-500/60 px-1 py-0.5 rounded-full border-2">
                  بلو کنترل
                </span>
                <span className="bg-emerald-500/40 border-emerald-500/60 px-1 py-0.5 rounded-full border-2">
                  فشرده 1.74
                </span>
                <span className="bg-rose-500/40 border-rose-500/60 px-1 py-0.5 rounded-full border-2">
                  IR کنترل
                </span>
                <span className="bg-yellow-500/40 border-yellow-500/60 px-1 py-0.5 rounded-full border-2">
                  Yellow کنترل
                </span>
                <span className="bg-linear-to-r from-gray-600 from-30% to-55% to-taupe-800 border-gray-400/40 px-1 py-0.5 rounded-full border-2">
                  فتو Transiton
                </span>
              </div>
            </div>
          </div>

          <div className="h-full min-w-0 flex-1">
            {/* large screen content */}
            <div className="hidden sm:block">
              {/* title */}
              <h2 className="mt-1 mb-2 text-3xl font-semibold">
                عدسی های See Care
              </h2>

              {/* tags */}
              <div className="w-full flex flex-wrap gap-1 text-[10px]">
                <span className="bg-fuchsia-500/40 border-fuchsia-500/60 px-1 py-0.5 rounded-full border-2">
                  Anti Glare
                </span>
                <span className="bg-blue-500/40 border-blue-500/60 px-1 py-0.5 rounded-full border-2">
                  بلو کنترل
                </span>
                <span className="bg-emerald-500/40 border-emerald-500/60 px-1 py-0.5 rounded-full border-2">
                  فشرده 1.74
                </span>
                <span className="bg-rose-500/40 border-rose-500/60 px-1 py-0.5 rounded-full border-2">
                  IR کنترل
                </span>
                <span className="bg-yellow-500/40 border-yellow-500/60 px-1 py-0.5 rounded-full border-2">
                  Yellow کنترل
                </span>
                <span className="bg-linear-to-r from-gray-600 from-30% to-55% to-taupe-800 border-gray-400/40 px-1 py-0.5 rounded-full border-2">
                  فتو Transiton
                </span>
              </div>
            </div>

            <p className="text-wrap mt-2">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur
              ex dolores incidunt praesentium, itaque aut doloribus repellat
              animi deleniti! Sint nesciunt reprehenderit, eligendi magni natus
              qui deleniti ullam amet? Earum?
            </p>
          </div>
        </div>

        {/* see max */}
        <div className="flex shadow-md shadow-black/30 z-10 flex-col sm:flex-row gap-2 p-3 border bg-card/20 rounded-lg">
          {/* image container */}
          <div className="relative flex sm:block gap-2 w-full sm:max-w-[200px]">
            <div className="relative overflow-hidden aspect-[1.1/1] w-full max-w-[120px] sm:max-w-[200px] shrink-0 rounded-lg border-2 border-blue-800">
              <Image
                src={Max}
                alt="see max - premium but affordable glass lens"
                placeholder="blur"
                fill
                sizes="250px"
                className="object-cover"
              />
            </div>

            {/* flag container */}
            <div className="w-fit rounded-lg overflow-hidden absolute -right-2 -top-2">
              <Image
                src={Japan}
                alt="japan flag - see max glasses are made in japan"
                width={25}
                height={25}
              />
            </div>

            {/* small screen content */}
            <div className="sm:hidden">
              {/* title */}
              <h2 className="mt-1 mb-2 text-2xl text-wrap font-semibold">
                عدسی های See Max
              </h2>

              {/* tags */}
              <div className="w-full flex flex-wrap gap-1 text-[8px]">
                <span className="bg-white/40 border-white/60 px-1 py-0.5 rounded-full border-2">
                  شفاف 1.50
                </span>

                <span className="bg-teal-500/40 border-teal-500/60 px-1 py-0.5 rounded-full border-2">
                  نشکن 1.60
                </span>

                <span className="bg-blue-600/40 border-blue-600/60 px-1 py-0.5 rounded-full border-2">
                  فشرده 1.70
                </span>

                <span className="bg-cyan-500/40 border-cyan-500/60 px-1 py-0.5 rounded-full border-2">
                  بلو کنترل 1.67
                </span>
                <span className="bg-linear-to-r from-gray-600 from-30% to-55% to-taupe-800 border-gray-400/40 px-1 py-0.5 rounded-full border-2">
                  فتو Spin
                </span>
              </div>
            </div>
          </div>

          <div className="h-full min-w-0 flex-1">
            {/* large screen content */}
            <div className="hidden sm:block">
              {/* title */}
              <h2 className="mt-1 mb-2 text-3xl text-wrap font-semibold">
                عدسی های See Max
              </h2>

              {/* tags */}
              <div className="w-full flex flex-wrap gap-1 text-[10px]">
                <span className="bg-white/40 border-white/60 px-1 py-0.5 rounded-full border-2">
                  شفاف 1.50
                </span>

                <span className="bg-teal-500/40 border-teal-500/60 px-1 py-0.5 rounded-full border-2">
                  نشکن 1.60
                </span>

                <span className="bg-blue-600/40 border-blue-600/60 px-1 py-0.5 rounded-full border-2">
                  فشرده 1.70
                </span>

                <span className="bg-cyan-500/40 border-cyan-500/60 px-1 py-0.5 rounded-full border-2">
                  بلو کنترل 1.67
                </span>
                <span className="bg-linear-to-r from-gray-600 from-30% to-55% to-taupe-800 border-gray-400/40 px-1 py-0.5 rounded-full border-2">
                  فتو Spin
                </span>
              </div>
            </div>

            <p className="text-wrap mt-2">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur
              ex dolores incidunt praesentium, itaque aut doloribus repellat
              animi deleniti! Sint nesciunt reprehenderit, eligendi magni natus
              qui deleniti ullam amet? Earum?
            </p>
          </div>
        </div>

        {/* see more */}
        <div className="flex shadow-md shadow-black/30 z-10 flex-col sm:flex-row gap-2 p-3 border bg-card/20 rounded-lg">
          {/* image container */}
          <div className="relative flex sm:block gap-2 w-full sm:max-w-[200px]">
            <div className="relative overflow-hidden aspect-[1.1/1] w-full max-w-[120px] sm:max-w-[200px] shrink-0 rounded-lg border-2 border-taupe-600">
              <Image
                src={More}
                alt="see more - balance between price and quality"
                placeholder="blur"
                fill
                sizes="250px"
                className="object-cover"
              />
            </div>

            {/* flag container */}
            <div className="w-fit rounded-lg overflow-hidden absolute -right-2 -top-2">
              <Image
                src={SouthKorea}
                alt="south korea flag - see more glasses are made in south korea"
                width={25}
                height={25}
              />
            </div>

            {/* small screen content */}
            <div className="sm:hidden">
              {/* title */}
              <h2 className="mt-1 mb-2 text-2xl text-wrap font-semibold">
                عدسی های See More
              </h2>

              {/* tags */}
              <div className="w-full flex flex-wrap gap-1 text-[8px]">
                <span className="bg-white/40 border-white/60 px-1 py-0.5 rounded-full border-2">
                  شفاف 1.55
                </span>

                <span className="bg-mauve-600 border-mauve-700/60 px-1 py-0.5 rounded-full border-2">
                  دیرشکن 1.57
                </span>

                <span className="bg-blue-600/40 border-blue-600/60 px-1 py-0.5 rounded-full border-2">
                  بلو کنترل 1.57
                </span>

                <span className="bg-yellow-500/40 border-yellow-500/60 px-1 py-0.5 rounded-full border-2">
                  نازک 1.56
                </span>

                <span className="bg-linear-to-r from-gray-600 from-30% to-55% to-taupe-800 border-gray-400/40 px-1 py-0.5 rounded-full border-2">
                  فتو کرومیک
                </span>
              </div>
            </div>
          </div>

          <div className="h-full min-w-0 flex-1">
            {/* large screen content */}
            <div className="hidden sm:block">
              {/* title */}
              <h2 className="mt-1 mb-2 text-3xl text-wrap font-semibold">
                عدسی های See More
              </h2>

              {/* tags */}
              <div className="w-full flex flex-wrap gap-1 text-[10px]">
                <span className="bg-white/40 border-white/60 px-1 py-0.5 rounded-full border-2">
                  شفاف 1.55
                </span>

                <span className="bg-mauve-600 border-mauve-700/60 px-1 py-0.5 rounded-full border-2">
                  دیرشکن 1.57
                </span>

                <span className="bg-blue-600/40 border-blue-600/60 px-1 py-0.5 rounded-full border-2">
                  بلو کنترل 1.57
                </span>

                <span className="bg-yellow-500/40 border-yellow-500/60 px-1 py-0.5 rounded-full border-2">
                  نازک 1.56
                </span>

                <span className="bg-linear-to-r from-gray-600 from-30% to-55% to-taupe-800 border-gray-400/40 px-1 py-0.5 rounded-full border-2">
                  فتو کرومیک
                </span>
              </div>
            </div>

            <p className="text-wrap mt-2">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur
              ex dolores incidunt praesentium, itaque aut doloribus repellat
              animi deleniti! Sint nesciunt reprehenderit, eligendi magni natus
              qui deleniti ullam amet? Earum?
            </p>
          </div>
        </div>

        {/* see fine */}
        <div className="flex shadow-md shadow-black/30 z-10 flex-col sm:flex-row gap-2 p-3 border bg-card/20 rounded-lg">
          {/* image container */}
          <div className="relative flex sm:block gap-2 w-full sm:max-w-[200px]">
            <div className="relative overflow-hidden aspect-[1.1/1] w-full max-w-[120px] sm:max-w-[200px] shrink-0 rounded-lg border-2 border-yellow-600">
              <Image
                src={Fine}
                alt="see fine - affordable glass lenses"
                placeholder="blur"
                fill
                sizes="250px"
                className="object-cover"
              />
            </div>

            {/* flag container */}
            <div className="w-fit rounded-lg overflow-hidden absolute -right-2 -top-2">
              <Image
                src={SouthKorea}
                alt="south korea flag - see fine glasses are made in south korea"
                width={25}
                height={25}
              />
            </div>

            {/* small screen content */}
            <div className="sm:hidden">
              {/* title */}
              <h2 className="mt-1 mb-2 text-2xl text-wrap font-semibold">
                عدسی های See Fine
              </h2>

              {/* tags */}
              <div className="w-full flex flex-wrap gap-1 text-[8px]">
                <span className="bg-amber-500/60 border-amber-500/80 px-1 py-0.5 rounded-full border-2">
                  سوپرهیدرو
                </span>

                <span className="bg-yellow-400/60 border-yellow-500/60 px-1 py-0.5 rounded-full border-2">
                  هیدرو ساده
                </span>

                <span className="bg-linear-240 from-blue-700/40 to-rose-600/50 border-gray-600/60 px-1 py-0.5 rounded-full border-2">
                  قابل رنگ
                </span>

                <span className="bg-gray-300/40 border-gray-400/40 px-1 py-0.5 rounded-full border-2">
                  فتو طوسی
                </span>
              </div>
            </div>
          </div>

          <div className="h-full min-w-0 flex-1">
            {/* large screen content */}
            <div className="hidden sm:block">
              {/* title */}
              <h2 className="mt-1 mb-2 text-3xl text-wrap font-semibold">
                عدسی های See Fine
              </h2>

              {/* tags */}
              <div className="w-full flex flex-wrap gap-1 text-[10px]">
                <span className="bg-amber-500/60 border-amber-500/80 px-1 py-0.5 rounded-full border-2">
                  سوپرهیدرو
                </span>

                <span className="bg-yellow-400/60 border-yellow-500/60 px-1 py-0.5 rounded-full border-2">
                  هیدرو ساده
                </span>

                <span className="bg-linear-240 from-blue-700/40 to-rose-600/50 border-gray-600/60 px-1 py-0.5 rounded-full border-2">
                  قابل رنگ
                </span>

                <span className="bg-gray-300/40 border-gray-400/40 px-1 py-0.5 rounded-full border-2">
                  فتو طوسی
                </span>
              </div>
            </div>

            <p className="text-wrap mt-2">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur
              ex dolores incidunt praesentium, itaque aut doloribus repellat
              animi deleniti! Sint nesciunt reprehenderit, eligendi magni natus
              qui deleniti ullam amet? Earum?
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
