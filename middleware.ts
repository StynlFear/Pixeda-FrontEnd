import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === '/login'

  // Define protected paths that require authentication
  const isProtectedPath = 
    path === '/' ||
    path.startsWith('/dashboard') ||
    path.startsWith('/clients') ||
    path.startsWith('/companies') ||
    path.startsWith('/employees') ||
    path.startsWith('/products') ||
    path.startsWith('/orders')

  // For now, we'll just redirect to login if accessing protected routes
  // The actual authentication check will be done client-side in the AuthProvider
  if (isProtectedPath && path !== '/login') {
    // Let the request through - the AuthProvider will handle redirects
    return NextResponse.next()
  }

  if (isPublicPath) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
