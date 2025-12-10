'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCalendarBookings } from '@/lib/hooks/useOutreach'
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

export function CalendarBookingCard() {
  const { data: bookings, isLoading } = useCalendarBookings()

  if (isLoading) {
    return (
      <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardContent className="py-12 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#004565]/20 border-t-[#004565] mx-auto"></div>
        </CardContent>
      </Card>
    )
  }

  const confirmed = bookings?.filter(b => b.booking_status === 'confirmed').length || 0
  const pending = bookings?.filter(b => b.booking_status === 'link_sent').length || 0
  const cancelled = bookings?.filter(b => b.booking_status === 'cancelled').length || 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Confirmed</Badge>
      case 'link_sent':
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>
      case 'cancelled':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#004565]">
          <Calendar className="h-5 w-5" />
          Calendar Bookings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#00CD50]">{confirmed}</div>
            <div className="text-xs text-[#004565]/70 mt-1">Confirmed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#FFA500]">{pending}</div>
            <div className="text-xs text-[#004565]/70 mt-1">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#E74C3C]">{cancelled}</div>
            <div className="text-xs text-[#004565]/70 mt-1">Cancelled</div>
          </div>
        </div>

        {bookings && bookings.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {bookings.slice(0, 5).map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-2 rounded-lg bg-[#004565]/5 hover:bg-[#004565]/10 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#004565] truncate">
                    {booking.lead_id ? `Lead ${booking.lead_id.slice(0, 8)}` : 'Unknown Lead'}
                  </div>
                  {booking.scheduled_time && (
                    <div className="text-xs text-[#004565]/70">
                      {new Date(booking.scheduled_time).toLocaleString()}
                    </div>
                  )}
                </div>
                {getStatusBadge(booking.booking_status)}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#004565]/70 text-center py-4">No bookings yet</p>
        )}
      </CardContent>
    </Card>
  )
}

