import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser() - If you remove this, you risk 
  // users randomly logging out due to token expiration issues not being caught.
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname;
  const isAuthRoute = path.endsWith('/login') || path.startsWith('/auth');
  const isAnalystPath = path.startsWith('/analyst') || path.startsWith('/dashboard/analyst');
  const isAnalystApiPath = path.startsWith('/api/analyst');
  const isAdminPath = path.startsWith('/admin');
  const isUserPath = path.startsWith('/user');

  if (!user && !isAuthRoute) {
    if (isAnalystApiPath) {
      return NextResponse.json({ success: false, error: 'Unauthorized security context.' }, { status: 401 });
    }

    // no user: redirect unauthenticated traffic to login page
    const url = request.nextUrl.clone();
    url.pathname = isAnalystPath ? '/analyst/login' : '/admin/login';
    return NextResponse.redirect(url);
  }

  // If user is authenticated, retrieve profile for role-based access control
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    const role = profile?.role;
    const isActive = profile?.is_active !== false; // handle null gracefully

    // Deactivated user handling
    if (!isActive && !isAuthRoute) {
      // Deactivated users should be immediately signed out and sent to login screen
      await supabase.auth.signOut();
      if (isAnalystApiPath) {
        return NextResponse.json({ success: false, error: 'Account is deactivated' }, { status: 403 });
      }

      const url = request.nextUrl.clone();
      url.pathname = isAnalystPath ? '/analyst/login' : '/admin/login';
      url.searchParams.set('error', 'Account is deactivated');
      return NextResponse.redirect(url);
    }

    if (isActive && !!role) {
      // Restrict `/admin` endpoints
      if (isAdminPath && role !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = role === 'user' ? '/user' : `/${role}`;
        return NextResponse.redirect(url);
      }

      // Restrict analyst pages and APIs to analyst users only.
      if ((isAnalystPath || isAnalystApiPath) && role !== 'analyst') {
        if (isAnalystApiPath) {
          return NextResponse.json({ success: false, error: 'Forbidden: analyst access required.' }, { status: 403 });
        }

        const url = request.nextUrl.clone();
        url.pathname = role === 'user' ? '/user' : '/admin';
        return NextResponse.redirect(url);
      }

      // Restrict `/user` endpoints
      if (isUserPath && role !== 'user' && role !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = role === 'user' ? '/user' : `/${role}`;
        return NextResponse.redirect(url);
      }

      // If an authenticated user hits the login page, safely redirect them to their respective portal
      if (isAuthRoute) {
        const url = request.nextUrl.clone();
        url.pathname = role === 'user' ? '/user' : `/${role}`;
        return NextResponse.redirect(url);
      }
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}