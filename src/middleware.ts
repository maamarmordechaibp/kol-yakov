import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    // We only want to protect the dashboard routes, NOT the IVR API routes!
    // SignalWire needs free access to /api/ivr
    if (req.nextUrl.pathname.startsWith('/api/') || req.nextUrl.pathname.startsWith('/_next/')) {
        return NextResponse.next();
    }

    const basicAuth = req.headers.get('authorization');

    if (basicAuth) {
        const authValue = basicAuth.split(' ')[1];
        const [user, pwd] = atob(authValue).split(':');

        // Super simple basic auth for the admin dashboard
        // You can change 'admin' and 'kol123' to whatever you prefer!
        const ADMIN_USER = 'admin';
        const ADMIN_PASS = 'kol123';

        if (user === ADMIN_USER && pwd === ADMIN_PASS) {
            return NextResponse.next();
        }
    }

    // If auth fails or is missing, prompt them to log in
    return new NextResponse('Unauthorized', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Secure Dashboard"',
        },
    });
}

export const config = {
    // Apply middleware to everything except API webhooks and static files
    matcher: ['/((?!api/ivr|_next/static|_next/image|favicon.ico).*)'],
};
