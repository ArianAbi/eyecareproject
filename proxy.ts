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
]

async function canAccessAdmin(request: NextRequest): Promise<boolean> {
    const access = await isAdmin()

    return access
}

async function shouldBlock(request: NextRequest): Promise<boolean> {
    const access = !(await isLoggedIn())

    console.log('should block : ',access);

    // your condition for the blocked-routes array
    return access
}

const matches = (pathname: string, route: string) =>
    pathname === route || pathname.startsWith(route + "/")

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

    // matches /admin, /admin/anything, and /admin-anything
    if (pathname.startsWith("/admin") && !(await canAccessAdmin(request))) {
        return reject(request, "notFound") // or "notFound" to hide that the route exists
    }

    if (BLOCKED_ROUTES.some(route => pathname.startsWith(route)) && (await shouldBlock(request))) {
        return reject(request, "forbidden")
    }

    return NextResponse.next() // pass
}

export const config = {
    // run on everything except static assets, since the blocked list can contain any route
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}