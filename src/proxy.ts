import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const GUARDED_SEGMENTS = ["driver", "employer", "admin"];

export default function proxy(request: NextRequest) {
  const response = intlMiddleware(request);

  const pathname = request.nextUrl.pathname;
  const segments = pathname.split("/").filter(Boolean);
  const [, section] = segments; // segments[0] is the locale prefix

  if (section && GUARDED_SEGMENTS.includes(section)) {
    const hasSession = request.cookies.has("session_token");
    if (!hasSession) {
      const locale = segments[0];
      const loginUrl = new URL(`/${locale}/auth/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
