// proxy.ts  (project root, or src/proxy.ts if you use a src folder)
import { NextRequest, NextResponse } from "next/server"
import { isAdmin, isLoggedIn } from "./lib/actions/isAdmin.action"

// routes that get blocked whenever shouldBlock() says so
const BLOCKED_ROUTES = [
    "/glasslens-order",
    "/invoices",
    "/orders",
    "/tickets",
    "/api/legacy",
    "/profile",
]

async function canAccessAdmin(): Promise<boolean> {
    const access = await isAdmin()

    return access
}

async function shouldBlock(): Promise<boolean> {
    const access = !(await isLoggedIn())

    // your condition for the blocked-routes array
    return access
}

function reject(request: NextRequest, mode: "login" | "notFound" | "forbidden" = "login") {
    const { pathname } = request.nextUrl

    // API routes should get a status code, not an HTML redirect
    if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (mode === "notFound") {
        // renders your not-found page with a 404 status
        return NextResponse.rewrite(new URL("/not-found", request.url), { status: 404 })
    }
    if (mode === "forbidden") {
        return new NextResponse("Forbidden", { status: 403 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    if (pathname === "/invoices/verify") return NextResponse.next()

    // matches /admin, /admin/anything, and /admin-anything
    if (pathname.startsWith("/admin") && !(await canAccessAdmin())) {
        return reject(request, "notFound") // or "notFound" to hide that the route exists
    }

    if (BLOCKED_ROUTES.some(route => pathname.startsWith(route)) && (await shouldBlock())) {
        return reject(request, "forbidden")
    }

    return NextResponse.next() // pass
}

export const config = {
    // run on everything except static assets, since the blocked list can contain any route
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}