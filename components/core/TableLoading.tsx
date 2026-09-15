export default function TableLoading() {
    return (
        <div className="overflow-hidden rounded-lg border w-full">
            {
                Array(10).fill('f').map((_,_i) => {
                    return <div 
                    key={_i}
                    style={{animationDelay:100*_i+'ms'}}
                    className="animate-pulse h-10 dark:even:bg-stone-600/50 dark:odd:bg-stone-800/70"></div>
                })
            }
        </div>
    )
}