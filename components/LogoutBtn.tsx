"use client"
import { signOut } from 'next-auth/react'
import { ChevronDown, LogOut } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu'

export default function LogoutBtn({ username, credit }: { username: string | undefined, credit: number | undefined }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                    nativeButton={false}
                render={
                    <div className='pr-2 cursor-pointer flex items-center gap-1'>
                        <div className='flex flex-col text-sm'>
                            {username ?
                                <span>{username ?? 'نام دریافت نشد'}</span>
                                :
                                <span className='text-red-500'>{'نام دریافت نشد'}</span>
                            }
                            <span>
                                <span>موجودی </span>

                                {credit !== undefined ? <span>
                                    {credit.toLocaleString() + " "}
                                    <span className='text-emerald-500 text-xs font-semibold'>تومان</span>
                                </span>
                                    :
                                    <span className='text-red-500'>
                                        دریافت نشد
                                    </span>
                                }
                            </span>
                        </div>
                        <ChevronDown className='size-4 text-muted-foreground' />
                    </div>
                }
            />
            <DropdownMenuContent align='end'>
                <DropdownMenuItem
                    onClick={() => signOut({
                        redirect: true,
                        redirectTo: '/login'
                    })}
                >
                    <LogOut />
                    <span>
                    خروج از حساب
                    </span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}