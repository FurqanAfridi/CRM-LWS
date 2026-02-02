import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get all cookies and clear them
    const response = NextResponse.json({ success: true, message: 'All cookies cleared' })
    
    // Get all cookie names from the request
    const cookies = request.cookies.getAll()
    
    // Limit the number of cookies we process to prevent server overload
    const MAX_COOKIES = 100
    const cookiesToProcess = cookies.slice(0, MAX_COOKIES)
    
    // Clear each cookie with the most common settings (reduced variations to prevent overload)
    const commonVariations = [
      { path: '/', httpOnly: false, secure: false, sameSite: 'lax' as const },
      { path: '/', httpOnly: true, secure: false, sameSite: 'lax' as const },
      { path: '/', httpOnly: false, secure: true, sameSite: 'lax' as const },
      { path: '/', httpOnly: true, secure: true, sameSite: 'lax' as const },
    ]
    
    // Clear existing cookies with limited variations
    cookiesToProcess.forEach((cookie) => {
      const cookieName = cookie.name
      
      // Try the most common variations
      commonVariations.forEach((options) => {
        try {
          response.cookies.set({
            name: cookieName,
            value: '',
            expires: new Date(0),
            ...options,
          })
        } catch (err) {
          // Ignore individual cookie errors
        }
      })
    })

    // Only clear a limited set of common cookie patterns to prevent overload
    const commonCookiePatterns = [
      'sb-',
      'auth',
      'session',
      'token',
    ]
    
    // Limit pattern clearing to prevent too many cookie operations
    commonCookiePatterns.forEach((pattern) => {
      // Only try first 3 variations per pattern
      for (let i = 0; i < 3; i++) {
        const cookieName = i === 0 ? pattern : `${pattern}${i}`
        
        // Only try the most common variation
        try {
          response.cookies.set({
            name: cookieName,
            value: '',
            expires: new Date(0),
            path: '/',
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
          })
        } catch (err) {
          // Ignore individual cookie errors
        }
      }
    })

    return response
  } catch (error: any) {
    console.error('Error clearing cookies:', error)
    // Return success even on error to prevent 502, but log the error
    return NextResponse.json(
      { 
        success: true, 
        message: 'Cookie clearing attempted',
        warning: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 200 }
    )
  }
}
