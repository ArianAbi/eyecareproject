"use client"
import { signOut } from 'next-auth/react'
import { Button } from './ui/button'

export default function LogoutBtn() {
    return (
        <Button variant={"outline"}
        onClick={() => signOut({
            redirect: true,
            redirectTo: '/login'
        })}>
            خروج از حساب
        </Button>
    )
}