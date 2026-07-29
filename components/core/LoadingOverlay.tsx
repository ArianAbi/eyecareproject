import { cn } from "@/lib/utils";
import { Spinner } from "../ui/spinner";

export default function LoadingOverlay({backdrop=false}:{backdrop?:boolean}){
    return <div className={cn("absolute size-full left-0 top-0 grid place-items-center",backdrop ? "backdrop:bg-black/20 pointer-events-none" : "")}>
        <Spinner />
    </div>
}