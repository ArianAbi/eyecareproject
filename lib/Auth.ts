import { writeAudit } from "./audit"
import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth from "next-auth"
import prisma from "./db"
import Credentials from "next-auth/providers/credentials"
import { LoginSchema } from "./schemas/auth.schema"
import { verifyPassword } from "./password"

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
                const parsed = LoginSchema.safeParse(credentials)
                if (!parsed.success) return null

                const user = await prisma.user.findUnique({
                    where: {
                        username: parsed.data.username
                    },
                    select: {
                        id: true,
                        username: true,
                        number: true,
                        credit: true,
                        password: true
                    }
                })

                if (!user) return null
                if (!await verifyPassword(parsed.data.password, user.password)) return null

                return {
                    id: String(user.id),
                    username: user.username,
                    phone: user.number,
                    credit: user.credit
                }
            }
        })
    ],
    events: {
        async signIn({ user }) {
            if (user.id) await writeAudit(prisma, user.id, "SIGNED_IN", "User", user.id)
        },
        async signOut(message) {
            if ('token' in message && typeof message.token?.id === 'string') {
                await writeAudit(prisma, message.token.id, "SIGNED_OUT", "User", message.token.id)
            }
        },
    },
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
