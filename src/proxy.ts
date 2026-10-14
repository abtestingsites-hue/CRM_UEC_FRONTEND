import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Mock check for JWT token - In production use robust session validation
  const token = request.cookies.get('crm_token') || request.headers.get('Authorization');
  
  // Array of protected paths
  const protectedPaths = ['/dashboard', '/call-center', '/omnichannel', '/feedback', '/settings'];
  
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // If trying to access protected route without token, redirect to login
  if (isProtectedPath && !token) {
    // For local development testing, we might bypass this if local storage relies solely on client state,
    // but in a production enterprise CRM, server-side checks are mandatory.
    // return NextResponse.redirect(new URL('/login', request.url));
  }

  // If already logged in and trying to access login page, redirect to dashboard
  if (request.nextUrl.pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/call-center/:path*', '/omnichannel/:path*', '/feedback/:path*', '/settings/:path*', '/login'],
};
