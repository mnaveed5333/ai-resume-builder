import { NextResponse } from "next/server";
import { verifyToken } from "./lib/jwt";

export const runtime = "nodejs";

export function middleware(request) {
  const token = request.cookies.get("token")?.value;

  const protectedPaths = ["/dashboard", "/builder", "/preview"];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/builder/:path*", "/preview/:path*"],
};