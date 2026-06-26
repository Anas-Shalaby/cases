import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isStaleAuthSessionError } from "@/lib/supabase/auth-errors";

function applyCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie.name, cookie.value);
  });
}

function redirectToLogin(request: NextRequest, sourceResponse?: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  const response = NextResponse.redirect(url);
  if (sourceResponse) {
    applyCookies(response, sourceResponse);
  }
  return response;
}

async function clearStaleSession(
  supabase: ReturnType<typeof createServerClient>,
  authError: { code?: string; message?: string } | null
) {
  if (isStaleAuthSessionError(authError)) {
    await supabase.auth.signOut();
  }
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname.startsWith("/login");
  const isOnboardingRoute = pathname.startsWith("/onboarding");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // بدون env vars: اسمح بـ /login فقط، وباقي المسارات → login
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isLoginRoute) {
      return NextResponse.next();
    }
    return redirectToLogin(request);
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      await clearStaleSession(supabase, authError);
      if (isLoginRoute) {
        return supabaseResponse;
      }
      return redirectToLogin(request, supabaseResponse);
    }

    if (!user) {
      if (isLoginRoute || isOnboardingRoute) {
        if (isOnboardingRoute) {
          return redirectToLogin(request, supabaseResponse);
        }
        return supabaseResponse;
      }
      return redirectToLogin(request, supabaseResponse);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    const needsOnboarding = !profile?.onboarding_completed;

    if (isLoginRoute) {
      const url = request.nextUrl.clone();
      url.pathname = needsOnboarding ? "/onboarding" : "/";
      return NextResponse.redirect(url);
    }

    if (needsOnboarding && !isOnboardingRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if (!needsOnboarding && isOnboardingRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch {
    if (isLoginRoute) {
      return NextResponse.next();
    }
    return redirectToLogin(request);
  }
}
