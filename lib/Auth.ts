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


                const user = await prisma.user.findFirst({
                    where: {
                        username: credentials.username as string,
                        password: credentials.password
                    }
                })
                console.log(user);

                if (!user) {
                    return null
                }

                return {
                    id: String(user.id),
                    username: user.username,
                    phone: user.number
                }
            }
        })
    ],
    callbacks: {
        async jwt({ user, token }) {
            if (user) {
                token.id = user.id,
                    token.username = user.username,
                    token.phone = user.phone
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.username = token.username as string
                session.user.phone = token.phone as string
            }
            return session
        },
    },
    pages: {
        signIn: '/login'
    }
})