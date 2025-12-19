'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, ExternalLink } from 'lucide-react'

interface CalendarIntegrationProps {
  // No props needed - uses permanent Calendly URL from environment
}

// Permanent Calendly URL from environment variable
const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com/11626-ourresource/30min'

export function CalendarIntegration() {
  // Extract display info from the permanent Calendly URL
  const calendlyInfo = useMemo(() => {
    if (!CALENDLY_URL) return null

    // Remove query parameters for display
    const urlWithoutParams = CALENDLY_URL.split('?')[0]
    
    // Extract username/event from URL
    // Format: https://calendly.com/username/event-type
    const match = urlWithoutParams.match(/calendly\.com\/([^\/]+)(?:\/([^\/]+))?/i)
    if (match) {
      const username = match[1]
      const eventType = match[2] || ''
      return {
        username,
        eventType,
        displayName: eventType ? `${username}/${eventType}` : username,
        embedUrl: urlWithoutParams, // Use URL without query params for iframe
        fullUrl: CALENDLY_URL, // Use full URL for external link
      }
    }
    
    return {
      username: 'calendly',
      eventType: '',
      displayName: 'Calendly Schedule',
      embedUrl: urlWithoutParams,
      fullUrl: CALENDLY_URL,
    }
  }, [])

  if (!calendlyInfo) {
    return (
      <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#004565]">
            <Calendar className="h-5 w-5" />
            Calendly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#004565]/70">
            Calendly URL is not configured. Please set NEXT_PUBLIC_CALENDLY_URL environment variable.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#004565]">
          <Calendar className="h-5 w-5" />
          Calendly Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#004565]">
              Viewing: <span className="font-semibold">{calendlyInfo.displayName}</span>
            </p>
            <a
              href={calendlyInfo.fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
            >
              Open in Calendly <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        
        {/* Calendly Embed Widget */}
        <div className="w-full" style={{ minHeight: '700px' }}>
          <iframe
            src={calendlyInfo.embedUrl}
            width="100%"
            height="700"
            frameBorder="0"
            title="Calendly Scheduling Page"
            className="rounded-lg border border-[#004565]/20"
          />
        </div>
      </CardContent>
    </Card>
  )
}
