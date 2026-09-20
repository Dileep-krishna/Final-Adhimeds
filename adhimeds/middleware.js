// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;
  const publicRoutes = ['/login', '/register', '/'];
  if (publicRoutes.includes(pathname)) return NextResponse.next();
  if (token) return NextResponse.next();
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = { matcher: ['/super-admin/:path*'] };