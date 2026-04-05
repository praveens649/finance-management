import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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


  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname;
  const isAuthRoute = path === '/' || path.startsWith('/auth') || path === '/signup' || path.endsWith('/login');
  const isAnalystPath = path.startsWith('/analyst') || path.startsWith('/dashboard/analyst');
  const isAnalystApiPath = path.startsWith('/api/analyst');
  const isAdminPath = path.startsWith('/admin');
  const isUserPath = path.startsWith('/user');

  if (!user && !isAuthRoute) {
    if (isAnalystApiPath) {
      return NextResponse.json({ success: false, error: 'Unauthorized security context.' }, { status: 401 });
    }

    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    const role = profile?.role;
    const isActive = profile?.is_active !== false; // handle null gracefully

    if (!isActive && !isAuthRoute) {
      await supabase.auth.signOut();
      if (isAnalystApiPath) {
        return NextResponse.json({ success: false, error: 'Account is deactivated' }, { status: 403 });
      }

      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('error', 'Account is deactivated');
      return NextResponse.redirect(url);
    }

    if (isActive && !!role) {
      if (isAdminPath && role !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = role === 'user' ? '/user' : `/${role}`;
        return NextResponse.redirect(url);
      }

      if ((isAnalystPath || isAnalystApiPath) && role !== 'analyst') {
        if (isAnalystApiPath) {
          return NextResponse.json({ success: false, error: 'Forbidden: analyst access required.' }, { status: 403 });
        }

        const url = request.nextUrl.clone();
        url.pathname = role === 'user' ? '/user' : '/admin';
        return NextResponse.redirect(url);
      }

      if (isUserPath && role !== 'user' && role !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = role === 'user' ? '/user' : `/${role}`;
        return NextResponse.redirect(url);
      }

      if (isAuthRoute) {
        const url = request.nextUrl.clone();
        url.pathname = role === 'user' ? '/user' : `/${role}`;
        return NextResponse.redirect(url);
      }
    }
  }


  return supabaseResponse
}
