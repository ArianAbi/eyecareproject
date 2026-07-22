import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface User {
        username?: string
        phone?: string
    }
    interface Session {
        user: {
            username?: string
            phone?: string
        } & DefaultSession["user"]
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        username?: string
        phone?: string
    }
}

declare module "next-auth/adapters" {
    interface AdapterUser {
        username?: string
        phone?: string
    }
}