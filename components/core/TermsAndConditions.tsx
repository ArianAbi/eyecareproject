import { cn } from "@/lib/utils";
import { buttonVariants } from "../ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";

export function TermsAndConditions() {
    return (
        <Dialog>
            <DialogTrigger className={cn(buttonVariants({ variant: "link" }),"mx-0 px-1 text-xs text-cyan-500")}>
                قوانین و مقررات
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        قوانین و مقررات
                    </DialogTitle>
                    <DialogDescription>
                        <ScrollArea className={"max-h-48"}>
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quo vel, veritatis porro debitis est modi, voluptas pariatur illum et aut molestias. Saepe a praesentium ex inventore tempore similique quod harum!
                        </ScrollArea>
                    </DialogDescription>

                </DialogHeader>
                <DialogFooter>
                    <DialogClose className={buttonVariants({ variant: "outline" })}>بستن</DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}