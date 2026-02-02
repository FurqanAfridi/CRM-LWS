import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get all cookies and clear them
    const response = NextResponse.json({ success: true, message: 'All cookies cleared' })
    
    // Define cookie clearing variations (used for all cookies)
    const variations = [
      // Standard variations
      { path: '/', httpOnly: false, secure: false, sameSite: 'lax' as const },
      { path: '/', httpOnly: false, secure: true, sameSite: 'lax' as const },
      { path: '/', httpOnly: true, secure: false, sameSite: 'lax' as const },
      { path: '/', httpOnly: true, secure: true, sameSite: 'lax' as const },
      { path: '/', httpOnly: false, secure: false, sameSite: 'strict' as const },
      { path: '/', httpOnly: false, secure: false, sameSite: 'none' as const },
      // Different paths
      { path: '', httpOnly: false, secure: false, sameSite: 'lax' as const },
      { path: '/dashboard', httpOnly: false, secure: false, sameSite: 'lax' as const },
      { path: '/login', httpOnly: false, secure: false, sameSite: 'lax' as const },
    ]
    
    // Get all cookie names from the request
    const cookies = request.cookies.getAll()
    
    // Clear every single cookie with all possible variations
    cookies.forEach((cookie) => {
      const cookieName = cookie.name
      
      variations.forEach((options) => {
        response.cookies.set({
          name: cookieName,
          value: '',
          expires: new Date(0),
          ...options,
        })
      })
    })

    // Also try to clear common cookie name patterns (in case some weren't in the request)
    const commonCookiePatterns = [
      'sb-',
      'auth',
      'session',
      'token',
      'access',
      'refresh',
      'user',
      'supabase',
    ]
    
    commonCookiePatterns.forEach((pattern) => {
      // Try different cookie name variations
      for (let i = 0; i < 10; i++) {
        const cookieName = i === 0 ? pattern : `${pattern}${i}`
        
        variations.forEach((options) => {
          response.cookies.set({
            name: cookieName,
            value: '',
            expires: new Date(0),
            ...options,
          })
        })
      }
    })

    return response
  } catch (error: any) {
    console.error('Error clearing cookies:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to clear cookies' },
      { status: 500 }
    )
  }
}
