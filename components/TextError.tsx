export default function TextError({ children }: { children: React.ReactNode }) {
    return <p role="alert" className="text-xs md:text-sm p-3 w-fit bg-red-500/50 border-red-500 rounded-lg border-2">
        {children}
    </p>
}