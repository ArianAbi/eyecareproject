import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth from "next-auth"
import prisma from "./db"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    providers: [
        Credentials({
            name: 'Credentials',
            credentials: {
                username: {},
                phone: {},
                password: {}
            },
            authorize: async (credentials) => {
                if (!credentials.username || !credentials.password) return null

                // TODO: plaintext comparison for testing only — replace with bcrypt.compare before shipping
                const user = await prisma.user.findFirst({
                    where: {
                        username: credentials.username as string,
                        password: credentials.password as string
                    },
                    select: {
                        id: true,
                        username: true,
                        number: true,
                        credit: true
                    }
                })

                if (!user) return null

                return {
                    id: String(user.id),
                    username: user.username,
                    phone: user.number,
                    credit: user.credit
                }
            }
        })
    ],
    callbacks: {
        async jwt({ user, token }) {
            if (user) {
                token.id = user.id
                token.username = user.username
                token.phone = user.phone
                token.credit = user.credit
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.username = token.username as string
                session.user.phone = token.phone as string
                session.user.credit = token.credit as number
            }
            return session
        },
    },
    pages: {
        signIn: '/login'
    }
})