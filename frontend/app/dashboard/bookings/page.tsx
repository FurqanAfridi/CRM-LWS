'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCalendarBookings } from '@/lib/hooks/useOutreach'
import { Calendar, ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle, AlertCircle, User, Mail, ExternalLink } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

type BookingStatus = 'link_sent' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'

function getStatusBadge(status: BookingStatus | null) {
  if (!status) return null
  
  switch (status) {
    case 'confirmed':
      return <Badge className="bg-green-500 text-white flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Confirmed</Badge>
    case 'link_sent':
      return <Badge className="bg-yellow-500 text-white flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>
    case 'cancelled':
      return <Badge className="bg-red-500 text-white flex items-center gap-1"><XCircle className="h-3 w-3" />Cancelled</Badge>
    case 'no_show':
      return <Badge className="bg-orange-500 text-white flex items-center gap-1"><AlertCircle className="h-3 w-3" />No Show</Badge>
    case 'completed':
      return <Badge className="bg-blue-500 text-white flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Completed</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function BookingsPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  
  // Get bookings for the current month
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  
  const { data: bookings, isLoading } = useCalendarBookings({
    date_from: monthStart.toISOString(),
    date_to: monthEnd.toISOString(),
  })

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    bookings?.forEach((booking: any) => {
      if (booking.scheduled_time) {
        const dateKey = format(new Date(booking.scheduled_time), 'yyyy-MM-dd')
        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push(booking)
      }
    })
    return grouped
  }, [bookings])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStartDate = startOfMonth(currentDate)
    const monthEndDate = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStartDate)
    const calendarEnd = endOfWeek(monthEndDate)
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentDate])

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleBookingClick = (booking: any) => {
    setSelectedBooking(booking)
    setShowBookingDialog(true)
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Get stats
  const stats = useMemo(() => {
    if (!bookings) return { total: 0, confirmed: 0, pending: 0, cancelled: 0 }
    
    return {
      total: bookings.length,
      confirmed: bookings.filter((b: any) => b.booking_status === 'confirmed').length,
      pending: bookings.filter((b: any) => b.booking_status === 'link_sent').length,
      cancelled: bookings.filter((b: any) => b.booking_status === 'cancelled').length,
    }
  }, [bookings])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#004565]">Bookings</h1>
          <p className="text-[#004565]/80 mt-2 font-medium">View and manage all calendar bookings</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-[#004565]/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-[#004565]">{stats.total}</div>
            <div className="text-sm text-[#004565]/70">Total Bookings</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            <div className="text-sm text-green-700">Confirmed</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-yellow-700">Pending</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <div className="text-sm text-red-700">Cancelled</div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card className="border-[#004565]/20 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-[#004565]">
              <Calendar className="h-5 w-5" />
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePreviousMonth}
                variant="outline"
                size="sm"
                className="border-[#004565]/30 text-[#004565]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleToday}
                variant="outline"
                size="sm"
                className="border-[#004565]/30 text-[#004565]"
              >
                Today
              </Button>
              <Button
                onClick={handleNextMonth}
                variant="outline"
                size="sm"
                className="border-[#004565]/30 text-[#004565]"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#004565]/20 border-t-[#004565]"></div>
            </div>
          ) : (
            <div className="w-full">
              {/* Week day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-semibold text-[#004565]/70 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  const dateKey = format(day, 'yyyy-MM-dd')
                  const dayBookings = bookingsByDate[dateKey] || []
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isToday = isSameDay(day, new Date())

                  return (
                    <div
                      key={idx}
                      className={`
                        min-h-[100px] border border-[#004565]/10 rounded-lg p-2
                        ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                        ${isToday ? 'ring-2 ring-[#004565] ring-offset-2' : ''}
                        hover:bg-[#004565]/5 transition-colors
                      `}
                    >
                      <div className={`
                        text-sm font-medium mb-1
                        ${isCurrentMonth ? 'text-[#004565]' : 'text-[#004565]/40'}
                        ${isToday ? 'text-[#004565] font-bold' : ''}
                      `}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayBookings.slice(0, 3).map((booking: any) => (
                          <div
                            key={booking.id}
                            onClick={() => handleBookingClick(booking)}
                            className="text-xs p-1 rounded bg-[#004565]/10 hover:bg-[#004565]/20 cursor-pointer transition-colors truncate"
                            title={`${booking.leads?.name || booking.leads?.email || 'Unknown'} - ${booking.booking_status}`}
                          >
                            <div className="flex items-center gap-1">
                              <div className={`
                                w-2 h-2 rounded-full
                                ${booking.booking_status === 'confirmed' ? 'bg-green-500' : ''}
                                ${booking.booking_status === 'link_sent' ? 'bg-yellow-500' : ''}
                                ${booking.booking_status === 'cancelled' ? 'bg-red-500' : ''}
                                ${booking.booking_status === 'completed' ? 'bg-blue-500' : ''}
                                ${booking.booking_status === 'no_show' ? 'bg-orange-500' : ''}
                              `}></div>
                              <span className="truncate text-[#004565]">
                                {booking.scheduled_time 
                                  ? format(new Date(booking.scheduled_time), 'HH:mm')
                                  : ''}
                              </span>
                            </div>
                          </div>
                        ))}
                        {dayBookings.length > 3 && (
                          <div className="text-xs text-[#004565]/60 px-1">
                            +{dayBookings.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#004565]">Booking Details</DialogTitle>
            <DialogDescription>
              Detailed information about the calendar booking
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="text-sm font-semibold text-[#004565]/70">Status</label>
                <div className="mt-1">
                  {getStatusBadge(selectedBooking.booking_status)}
                </div>
              </div>

              {/* Lead Information */}
              {selectedBooking.leads && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#004565]/70">Lead Information</label>
                  <div className="bg-[#004565]/5 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-[#004565]/70" />
                      <span className="text-[#004565] font-medium">
                        {selectedBooking.leads.name || selectedBooking.leads.email || 'Unknown'}
                      </span>
                    </div>
                    {selectedBooking.leads.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[#004565]/70" />
                        <span className="text-[#004565]">{selectedBooking.leads.email}</span>
                      </div>
                    )}
                    {selectedBooking.leads.company_name && (
                      <div className="text-sm text-[#004565]/70">
                        Company: {selectedBooking.leads.company_name}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Scheduled Time */}
              {selectedBooking.scheduled_time && (
                <div>
                  <label className="text-sm font-semibold text-[#004565]/70">Scheduled Time</label>
                  <div className="mt-1 text-[#004565]">
                    {format(new Date(selectedBooking.scheduled_time), 'PPpp')}
                  </div>
                </div>
              )}

              {/* Calendar Provider */}
              {selectedBooking.calendar_provider && (
                <div>
                  <label className="text-sm font-semibold text-[#004565]/70">Calendar Provider</label>
                  <div className="mt-1 text-[#004565] capitalize">
                    {selectedBooking.calendar_provider}
                  </div>
                </div>
              )}

              {/* Calendar Link */}
              {selectedBooking.calendar_link && (
                <div>
                  <label className="text-sm font-semibold text-[#004565]/70">Calendar Link</label>
                  <div className="mt-1">
                    <a
                      href={selectedBooking.calendar_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Calendar Link
                    </a>
                  </div>
                </div>
              )}

              {/* Meeting ID */}
              {selectedBooking.meeting_id && (
                <div>
                  <label className="text-sm font-semibold text-[#004565]/70">Meeting ID</label>
                  <div className="mt-1 text-[#004565] font-mono text-sm">
                    {selectedBooking.meeting_id}
                  </div>
                </div>
              )}

              {/* Created At */}
              {selectedBooking.created_at && (
                <div>
                  <label className="text-sm font-semibold text-[#004565]/70">Created</label>
                  <div className="mt-1 text-[#004565] text-sm">
                    {format(new Date(selectedBooking.created_at), 'PPpp')}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

