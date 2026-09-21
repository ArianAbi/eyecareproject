export default function Footer() {

    const phoneNumber = process.env.NEXT_SUPPORT_NUMBER

    return <footer className="w-full border-t bg-background min-h-10 mt-auto text-sm">
        <div className="flex flex-col gap-1 items-center justify-center">

            <div className="text-center mt-2 ">
                <span>
                    شماره تماس
                </span>
                <span>
                    {" " + phoneNumber}
                </span>
            </div>

            <span>ساعات پاسخ گویی 10 صبح الی 6 عصر میباشد</span>

        </div>
    </footer>
}