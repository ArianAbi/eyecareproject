import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface User {
        username?: string
        phone?: string
        credit?: number
    }
    interface Session {
        user: {
            username?: string
            phone?: string
            credit?: number
        } & DefaultSession["user"]
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        username?: string
        phone?: string
        credit?: number
    }
}

declare module "next-auth/adapters" {
    interface AdapterUser {
        username?: string
        phone?: string
        credit?: number
    }
}