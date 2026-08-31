import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // 1. Allow SignalWire to hit IVR endpoints unhindered
    if (pathname.startsWith('/api/ivr') || pathname.startsWith('/_next/') || pathname === '/login') {
        return NextResponse.next();
    }

    // 2. Check for our secure custom cookie
    const authCookie = req.cookies.get('ky_admin_auth');

    // If no cookie, redirect them to the beautiful custom login page
    if (!authCookie || authCookie.value !== 'authenticated') {
        const loginUrl = new URL('/login', req.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api/ivr|_next/static|_next/image|favicon.ico).*)'],
};
