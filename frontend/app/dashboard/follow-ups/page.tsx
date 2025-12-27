'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useFollowupQueue, useLeadConversation, usePauseSequence, useResumeSequence, useAIResponderConfig, useLeadMessages, usePendingResponses, useUpdatePendingResponse } from '@/lib/hooks/useOutreach'
import { MessageSquare, Mail, Clock, Calendar, User, Building2, ArrowRight, Reply, Pause, Play, CheckCircle2, Filter, Search, Loader2, Bot, Info, Bell, Crown, Star, Briefcase } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Sortable Header Component
function SortableHeader({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'move',
    zIndex: transform ? 1 : 0,
  }

  return (
    <th
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider cursor-move bg-[#004565]/5 relative group touch-none"
    >
      {children}
    </th>
  )
}

type FollowupStatus = 'pending' | 'sent' | 'cancelled' | 'skipped'

// Component for each follow-up row
// Helper to determine lead priority based on title
function getLeadPriority(title?: string | null): number {
  if (!title) return 0
  const t = title.toLowerCase()
  
  // C-Level / Founder / Owner
  if (
    t.includes('chief') || 
    t.includes('ceo') || 
    t.includes('coo') || 
    t.includes('cfo') || 
    t.includes('cto') || 
    t.includes('cmo') || 
    t.includes('president') || 
    t.includes('founder') || 
    t.includes('owner') ||
    t.includes('partner') ||
    t.includes('chairman') ||
    t.includes('executive')
  ) return 3
  
  // VP / SVP / EVP
  if (t.includes('vp') || t.includes('vice president')) return 2
  
  // Director / Head
  if (t.includes('director') || t.includes('head of')) return 1
  
  return 0
}

function FollowUpRow({
  item,
  index,
  columnOrder,
  daysSince,
  isAutoReplyEnabled,
  autoSendEnabled,
  pendingResponse,
  notificationQueue,
  setNotificationQueue,
  onViewDetails,
  onRespond,
  onFollowUp,
  getStatusBadge,
}: {
  item: any
  index: number
  columnOrder: string[]
  daysSince: number
  isAutoReplyEnabled: boolean
  autoSendEnabled: boolean
  pendingResponse: any | null
  notificationQueue: Set<string>
  setNotificationQueue: (fn: (prev: Set<string>) => Set<string>) => void
  onViewDetails: (item: any) => void
  onRespond: (item: any) => void
  onFollowUp: (item: any) => void
  getStatusBadge: (status: FollowupStatus) => JSX.Element
}) {
  const hasPendingResponse = pendingResponse && pendingResponse.status === 'pending'
  const showNotification = hasPendingResponse && !autoSendEnabled && !notificationQueue.has(item.lead_id)

  // Add to notification queue when pending response is detected
  useEffect(() => {
    if (hasPendingResponse && !autoSendEnabled && !notificationQueue.has(item.lead_id)) {
      setNotificationQueue(prev => new Set(prev).add(item.lead_id))
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New AI Response Ready', {
          body: `AI has generated a response for ${item.lead?.name || item.lead?.email}. Click to review.`,
          icon: '/Lincoln.png',
        })
      }
    }
  }, [hasPendingResponse, autoSendEnabled, item.lead_id, item.lead?.name, item.lead?.email, notificationQueue, setNotificationQueue])

  // Enable respond button when:
  // 1. Lead has responded
  // 2. There's a pending response
  // 3. Auto-send (without manual review) is OFF
  const canRespond = item.responded && hasPendingResponse && !autoSendEnabled

  const renderCell = (columnId: string) => {
    switch (columnId) {
      case 'hash':
        return <div className="text-sm text-[#004565]/70 font-mono">{index + 1}</div>
      case 'lead':
        return (
          <div>
            <div className="font-medium text-[#004565] flex items-center gap-2">
              <User className="h-4 w-4" />
              {item.lead?.name || item.lead?.email || 'Unknown'}
              {getLeadPriority(item.lead?.title) === 3 && (
                <Badge className="bg-amber-500 text-white border-none py-0 h-5 text-[10px] flex gap-1">
                  <Crown className="h-3 w-3" /> C-Level
                </Badge>
              )}
              {getLeadPriority(item.lead?.title) === 2 && (
                <Badge className="bg-blue-600 text-white border-none py-0 h-5 text-[10px] flex gap-1">
                  <Star className="h-3 w-3" /> VP
                </Badge>
              )}
            </div>
            {item.lead?.title && (
              <div className="text-xs font-medium text-[#004565]/80 flex items-center gap-1 mt-0.5 ml-6">
                <Briefcase className="h-3 w-3" />
                {item.lead.title}
              </div>
            )}
            <div className="text-sm text-[#004565]/70 ml-6">{item.lead?.email || '—'}</div>
            {item.lead?.company_name && (
              <div className="text-xs text-[#004565]/60 flex items-center gap-1 mt-1 ml-6">
                <Building2 className="h-3 w-3" />
                {item.lead.company_name}
              </div>
            )}
          </div>
        )
      case 'sequence':
        return item.sequence?.name ? (
          <div>
            <div className="font-medium text-[#004565]">{item.sequence.name}</div>
            {item.campaign && (
              <div className="text-xs text-[#004565]/60">Campaign: {item.campaign.status}</div>
            )}
          </div>
        ) : (
          <span className="text-[#004565]/50">No sequence</span>
        )
      case 'followup_number':
        return <div className="font-medium text-[#004565]">#{item.followup_number}</div>
      case 'days':
        return (
          <div className="text-sm font-medium text-[#004565]">
            {daysSince === 0 ? 'Today' : `${daysSince} day${daysSince !== 1 ? 's' : ''}`}
          </div>
        )
      case 'status':
        return getStatusBadge(item.status)
      case 'followup_action':
        return item.responded ? (
          <div className="flex items-center justify-center gap-2">
            {hasPendingResponse && !autoSendEnabled && (
              <Badge className="bg-yellow-500 text-white animate-pulse">
                <Bell className="h-3 w-3 mr-1" />
                New
              </Badge>
            )}
            <Button
              size="sm"
              onClick={() => onRespond(item)}
              disabled={!canRespond}
              className="bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                autoSendEnabled
                  ? 'Auto-send is enabled. Responses are sent automatically without manual review.'
                  : hasPendingResponse
                    ? 'AI has generated a response. Click to review and approve.'
                    : 'No AI-generated response available yet. Please wait for the AI to generate a response.'
              }
            >
              <Reply className="h-4 w-4 mr-1" />
              Respond
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={() => onFollowUp(item)}
            disabled={isAutoReplyEnabled}
            className="bg-[#004565] hover:bg-[#004565]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            title={isAutoReplyEnabled ? 'AI auto-responder is enabled. Follow-ups are handled automatically.' : ''}
          >
            <Mail className="h-4 w-4 mr-1" />
            Follow-up
          </Button>
        )
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails(item)}
              className="border-[#004565]/30 text-[#004565]"
            >
              View
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <tr className={`border-b hover:bg-[#004565]/5 ${showNotification ? 'bg-yellow-50' : ''}`}>
      {columnOrder.map(columnId => (
        <td
          key={columnId}
          className={`px-6 py-4 ${columnId === 'followup_action' ? 'text-center' : columnId === 'actions' ? 'text-right' : ''}`}
        >
          {renderCell(columnId)}
        </td>
      ))}
    </tr>
  )
}

export default function FollowUpsPage() {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'sent' | 'cancelled' | 'skipped'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { data: followupQueue, isLoading: leadsLoading, error } = useFollowupQueue(
    filterStatus !== 'all' ? { status: filterStatus } : undefined
  )
  const pauseSequence = usePauseSequence()
  const resumeSequence = useResumeSequence()
  const { data: aiResponderConfig } = useAIResponderConfig()
  // Fetch all pending responses once instead of per-row
  const { data: allPendingResponses } = usePendingResponses(undefined, 'pending')
  const [selectedFollowup, setSelectedFollowup] = useState<any>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showRespondDialog, setShowRespondDialog] = useState(false)
  const [suggestedResponse, setSuggestedResponse] = useState<{ subject: string; content: string } | null>(null)
  const [userChanges, setUserChanges] = useState<string>('')
  const [notificationQueue, setNotificationQueue] = useState<Set<string>>(new Set())
  const updatePendingResponse = useUpdatePendingResponse()

  // Column definitions
  const allColumns = {
    hash: { label: '#' },
    lead: { label: 'Lead' },
    sequence: { label: 'Sequence' },
    followup_number: { label: 'Follow-up #' },
    days: { label: 'Days' },
    status: { label: 'Status' },
    followup_action: { label: 'Follow-up' },
    actions: { label: 'Actions' },
  }

  const [columnOrder, setColumnOrder] = useState<string[]>([
    'hash',
    'lead',
    'sequence',
    'followup_number',
    'days',
    'status',
    'followup_action',
    'actions'
  ])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Memoize filtered followups to avoid re-filtering on every render
  // Deduplicate by lead_id to show each email only once
  const filteredFollowups = useMemo(() => {
    if (!followupQueue) return []

    // First, filter by search term if provided
    let filtered = followupQueue
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = followupQueue.filter((item) => {
        return (
          (item.lead?.name?.toLowerCase().includes(searchLower) || false) ||
          (item.lead?.email?.toLowerCase().includes(searchLower) || false) ||
          (item.lead?.company_name?.toLowerCase().includes(searchLower) || false) ||
          (item.sequence?.name?.toLowerCase().includes(searchLower) || false)
        )
      })
    }

    // Deduplicate by lead_id - keep only one entry per lead
    const leadMap = new Map<string, any>()

    filtered.forEach((item) => {
      const leadId = item.lead_id
      const existing = leadMap.get(leadId)

      if (!existing) {
        // First occurrence of this lead
        leadMap.set(leadId, item)
      } else {
        // Priority logic for duplicates:
        // 1. Prefer 'pending' status over others
        // 2. Prefer responded=true over responded=false
        // 3. Prefer earlier scheduled_for date
        const existingIsPending = existing.status === 'pending'
        const currentIsPending = item.status === 'pending'

        if (currentIsPending && !existingIsPending) {
          // Current is pending, existing is not - prefer current
          leadMap.set(leadId, item)
        } else if (!currentIsPending && existingIsPending) {
          // Existing is pending, current is not - keep existing
          // do nothing
        } else {
          // Both have same pending status, prefer responded=true
          if (item.responded && !existing.responded) {
            leadMap.set(leadId, item)
          } else if (!item.responded && existing.responded) {
            // keep existing
          } else {
            // Both have same responded status, prefer earlier scheduled_for
            const existingDate = new Date(existing.scheduled_for).getTime()
            const currentDate = new Date(item.scheduled_for).getTime()
            if (currentDate < existingDate) {
              leadMap.set(leadId, item)
            }
          }
        }
      }
    })

    // Convert map values back to array
    // Convert map values back to array and sort by Priority then Date
    return Array.from(leadMap.values()).sort((a, b) => {
      // 1. Priority (Higher first)
      const priorityA = getLeadPriority(a.lead?.title)
      const priorityB = getLeadPriority(b.lead?.title)
      if (priorityA !== priorityB) return priorityB - priorityA

      // 2. Responded logic (Responded first)
      if (a.responded !== b.responded) return a.responded ? -1 : 1

      // 3. Status logic (Pending first)
      if (a.status !== b.status) {
        if (a.status === 'pending') return -1
        if (b.status === 'pending') return 1
      }

      // 4. Scheduled Date (Earlier first)
      const dateA = new Date(a.scheduled_for).getTime()
      const dateB = new Date(b.scheduled_for).getTime()
      return dateA - dateB
    })
  }, [followupQueue, searchTerm])

  // Memoize counts to avoid recalculating on every render
  const { pendingCount, sentCount, cancelledCount, skippedCount } = useMemo(() => {
    if (!followupQueue) return { pendingCount: 0, sentCount: 0, cancelledCount: 0, skippedCount: 0 }
    return {
      pendingCount: followupQueue.filter((item) => item.status === 'pending').length,
      sentCount: followupQueue.filter((item) => item.status === 'sent').length,
      cancelledCount: followupQueue.filter((item) => item.status === 'cancelled').length,
      skippedCount: followupQueue.filter((item) => item.status === 'skipped').length,
    }
  }, [followupQueue])

  const handleViewDetails = (item: any) => {
    setSelectedFollowup(item)
    setShowDetailsDialog(true)
  }

  // Fetch conversation messages for selected followup from lead_email_conversations
  const { data: conversationMessages, isLoading: isLoadingMessages } = useLeadMessages(
    selectedFollowup?.lead_id || ''
  )

  // Sort messages chronologically (oldest first)
  const sortedMessages = conversationMessages
    ? [...conversationMessages].sort((a: any, b: any) => {
      const dateA = new Date(a.sent_at || a.created_at).getTime()
      const dateB = new Date(b.sent_at || b.created_at).getTime()
      return dateA - dateB
    })
    : []


  // Memoize the function to avoid recreating it on every render
  const getDaysSinceScheduled = useCallback((scheduledFor: string): number => {
    const scheduled = new Date(scheduledFor)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - scheduled.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }, [])

  const handleFollowUp = async (item: any) => {
    try {
      const response = await fetch('https://auto.lincolnwaste.co/webhook/followup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: item.lead_id,
          campaign_id: item.campaign_id,
          followup_id: item.id,
          followup_number: item.followup_number,
          scheduled_for: item.scheduled_for,
          lead: {
            id: item.lead?.id,
            name: item.lead?.name,
            email: item.lead?.email,
            company_name: item.lead?.company_name,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData?.error || errorData?.message || 'Failed to trigger follow-up')
      }

      const result = await response.json().catch(() => ({ success: true }))
      alert(`Follow-up triggered successfully for ${item.lead?.name || item.lead?.email}`)
    } catch (error: any) {
      console.error('Error triggering follow-up:', error)
      alert(error.message || 'Failed to trigger follow-up. Please try again.')
    }
  }

  const handleRespond = async (item: any) => {
    setSelectedFollowup(item)
    setShowRespondDialog(true)
    setUserChanges('')

    // Only load from pending_responses table - DO NOT call webhook
    try {
      const pendingResponse = await fetch(`/api/outreach/pending-responses?lead_id=${item.lead_id}&status=pending`)
      if (pendingResponse.ok) {
        const data = await pendingResponse.json()
        if (data.response) {
          // Use existing pending response from database
          setSuggestedResponse({
            subject: data.response.subject,
            content: data.response.content,
          })
          setUserChanges(data.response.user_changes || '')
          // Clear notification for this lead
          setNotificationQueue(prev => {
            const next = new Set(prev)
            next.delete(item.lead_id)
            return next
          })
        } else {
          // No pending response available yet
          setSuggestedResponse(null)
          alert('No AI-generated response is available yet. Please wait for the AI to generate a response.')
          setShowRespondDialog(false)
        }
      } else {
        // Error fetching or no response
        setSuggestedResponse(null)
        alert('No AI-generated response is available yet. Please wait for the AI to generate a response.')
        setShowRespondDialog(false)
      }
    } catch (error) {
      console.error('Failed to fetch pending response:', error)
      setSuggestedResponse(null)
      alert('Failed to load pending response. Please try again.')
      setShowRespondDialog(false)
    }
  }


  const handleApproveResponse = async () => {
    if (!selectedFollowup || !suggestedResponse) return

    try {
      // Check if there's a pending response to update
      const pendingCheck = await fetch(`/api/outreach/pending-responses?lead_id=${selectedFollowup.lead_id}&status=pending`)

      if (pendingCheck.ok) {
        const pendingData = await pendingCheck.json()
        if (pendingData.response) {
          // Update existing pending response with user's changes and mark as approved
          // n8n will automatically send the email when status changes to 'approved'
          await updatePendingResponse.mutateAsync({
            id: pendingData.response.id,
            updates: {
              subject: suggestedResponse.subject,
              content: suggestedResponse.content,
              user_changes: userChanges || null,
              status: 'approved',
              approved_at: new Date().toISOString(),
            },
          })

          alert('Response approved! n8n will automatically send the email.')
          setShowRespondDialog(false)
          setSuggestedResponse(null)
          setUserChanges('')
          // Clear notification
          setNotificationQueue(prev => {
            const next = new Set(prev)
            next.delete(selectedFollowup.lead_id)
            return next
          })
        } else {
          alert('No pending response found to approve.')
        }
      } else {
        alert('Failed to fetch pending response.')
      }
    } catch (error: any) {
      alert(error.message || 'Failed to approve response')
    }
  }

  // Memoize status badge function
  const getStatusBadge = useCallback((status: FollowupStatus) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500 text-white"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'sent':
        return <Badge className="bg-green-500 text-white"><CheckCircle2 className="h-3 w-3 mr-1" />Sent</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500 text-white">Cancelled</Badge>
      case 'skipped':
        return <Badge className="bg-gray-500 text-white">Skipped</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }, [])

  if (leadsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#004565]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <MessageSquare className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 font-medium mb-2">Error loading responses</p>
        <p className="text-sm text-[#004565]/70">
          {error instanceof Error ? error.message : 'Failed to load lead responses'}
        </p>
      </div>
    )
  }

  const isAutoReplyEnabled = aiResponderConfig?.enabled && aiResponderConfig?.auto_send
  const autoSendEnabled = aiResponderConfig?.auto_send || false // Auto-send without manual review

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#004565]">Follow-ups</h1>
        </div>
        <div className="flex gap-4">
          <Card className="border-yellow-200 w-32">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-xs text-yellow-600/70">Pending</div>
            </CardContent>
          </Card>
          <Card className="border-green-200 w-32">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-green-600">{sentCount}</div>
              <div className="text-xs text-green-600/70">Sent</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 w-32">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-red-600">{cancelledCount}</div>
              <div className="text-xs text-red-600/70">Cancelled</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200 w-32">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-gray-600">{skippedCount}</div>
              <div className="text-xs text-gray-600/70">Skipped</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Auto-Responder Notice */}
      {isAutoReplyEnabled && (
        <Card className="border-blue-300 bg-blue-50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-blue-900">AI Auto-Responder is Enabled</h3>
                  <Badge className="bg-blue-600 text-white">Active</Badge>
                </div>
                <p className="text-sm text-blue-800">
                  The AI auto-responder is currently handling responses automatically. Manual replies are disabled to prevent conflicts.
                  You can manage the AI responder settings in the <strong>Pipeline</strong> page.
                </p>
                {aiResponderConfig?.response_delay_minutes > 0 && (
                  <p className="text-xs text-blue-700 mt-2">
                    Responses are sent automatically after a {aiResponderConfig.response_delay_minutes} minute delay.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}




      {/* Filters */}
      <Card className="border-[#004565]/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#004565]/50" />
              <Input
                placeholder="Search by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-[#004565]/30"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                className={filterStatus === 'all' ? 'bg-[#004565] text-white' : 'border-[#004565]/30 text-[#004565]'}
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('pending')}
                className={filterStatus === 'pending' ? 'bg-[#004565] text-white' : 'border-[#004565]/30 text-[#004565]'}
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === 'sent' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('sent')}
                className={filterStatus === 'sent' ? 'bg-[#004565] text-white' : 'border-[#004565]/30 text-[#004565]'}
              >
                Sent
              </Button>
              <Button
                variant={filterStatus === 'cancelled' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('cancelled')}
                className={filterStatus === 'cancelled' ? 'bg-[#004565] text-white' : 'border-[#004565]/30 text-[#004565]'}
              >
                Cancelled
              </Button>
              <Button
                variant={filterStatus === 'skipped' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('skipped')}
                className={filterStatus === 'skipped' ? 'bg-[#004565] text-white' : 'border-[#004565]/30 text-[#004565]'}
              >
                Skipped
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow-up Queue List */}
      <Card className="border-[#004565]/20 shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-[#004565]/5">
                    <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                      {columnOrder.map((columnId) => (
                        <SortableHeader key={columnId} id={columnId}>
                          {allColumns[columnId as keyof typeof allColumns].label}
                        </SortableHeader>
                      ))}
                    </SortableContext>
                  </tr>
                </thead>
                <tbody>
                  {filteredFollowups.length === 0 ? (
                    <tr>
                      <td colSpan={columnOrder.length} className="px-6 py-12 text-center">
                        <Clock className="h-12 w-12 mx-auto text-[#004565]/50 mb-4" />
                        <p className="text-[#004565] font-medium mb-2">No follow-ups found</p>
                        <p className="text-sm text-[#004565]/70">
                          {searchTerm || filterStatus !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Scheduled follow-ups will appear here'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredFollowups.map((item, index) => {
                      const daysSince = getDaysSinceScheduled(item.scheduled_for)
                      // Find pending response for this lead from the single query
                      const pendingResponse = allPendingResponses?.find((r: any) => r.lead_id === item.lead_id) || null
                      return (
                        <FollowUpRow
                          key={item.id}
                          item={item}
                          index={index}
                          columnOrder={columnOrder}
                          daysSince={daysSince}
                          isAutoReplyEnabled={isAutoReplyEnabled}
                          autoSendEnabled={autoSendEnabled}
                          pendingResponse={pendingResponse}
                          notificationQueue={notificationQueue}
                          setNotificationQueue={setNotificationQueue}
                          onViewDetails={handleViewDetails}
                          onRespond={handleRespond}
                          onFollowUp={handleFollowUp}
                          getStatusBadge={getStatusBadge}
                        />
                      )
                    })
                  )}
                </tbody>
              </table>
            </DndContext>
          </div>
        </CardContent>
      </Card>

      {/* Respond Dialog */}
      <Dialog open={showRespondDialog} onOpenChange={setShowRespondDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#004565]">Respond to {selectedFollowup?.lead?.name || selectedFollowup?.lead?.email}</DialogTitle>
            <DialogDescription>
              Review and customize the suggested response before sending
            </DialogDescription>
          </DialogHeader>

          {suggestedResponse ? (
            <div className="space-y-6">
              {/* Suggested Response */}
              <Card className="border-[#004565]/20">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-[#004565] font-semibold">Subject</Label>
                    <Input
                      value={suggestedResponse.subject}
                      onChange={(e) => setSuggestedResponse({ ...suggestedResponse, subject: e.target.value })}
                      className="mt-1 border-[#004565]/30"
                    />
                  </div>
                  <div>
                    <Label className="text-[#004565] font-semibold">Response Content</Label>
                    <Textarea
                      value={suggestedResponse.content}
                      onChange={(e) => setSuggestedResponse({ ...suggestedResponse, content: e.target.value })}
                      className="mt-1 min-h-[200px] border-[#004565]/30"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* User Changes Box */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-[#004565] font-semibold">Your Changes (Optional)</Label>
                    <p className="text-xs text-[#004565]/70 mb-2">
                      You can edit the subject and content above, or add notes about changes you made below.
                    </p>
                    <Textarea
                      value={userChanges}
                      onChange={(e) => setUserChanges(e.target.value)}
                      placeholder="Add any notes about changes you made to the response..."
                      className="mt-1 min-h-[100px] border-blue-300"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#004565]/10">
                <Button
                  onClick={() => {
                    setShowRespondDialog(false)
                    setSuggestedResponse(null)
                    setUserChanges('')
                  }}
                  variant="outline"
                  className="border-[#004565]/30 text-[#004565]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApproveResponse}
                  disabled={updatePendingResponse.isPending}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {updatePendingResponse.isPending ? 'Approving...' : 'Approve'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#004565]/70">No response generated</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Follow-up Details</DialogTitle>
            <DialogDescription>
              Detailed information about the scheduled follow-up
            </DialogDescription>
          </DialogHeader>
          {selectedFollowup && (
            <div className="space-y-6">
              {/* Lead Info */}
              <Card className="border-[#004565]/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-[#004565] mb-3">Lead Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#004565]/70">Name:</span>
                      <span className="ml-2 font-medium text-[#004565]">
                        {selectedFollowup.lead?.name || selectedFollowup.lead?.email || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#004565]/70">Email:</span>
                      <span className="ml-2 font-medium text-[#004565]">
                        {selectedFollowup.lead?.email || '—'}
                      </span>
                    </div>
                    {selectedFollowup.lead?.company_name && (
                      <div>
                        <span className="text-[#004565]/70">Company:</span>
                        <span className="ml-2 font-medium text-[#004565]">
                          {selectedFollowup.lead.company_name}
                        </span>
                      </div>
                    )}
                    {selectedFollowup.sequence && (
                      <div>
                        <span className="text-[#004565]/70">Sequence:</span>
                        <span className="ml-2 font-medium text-[#004565]">
                          {selectedFollowup.sequence.name}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Follow-up Info */}
              <Card className="border-[#004565]/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-[#004565] mb-3">Follow-up Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#004565]/70">Follow-up Number:</span>
                      <span className="ml-2 font-medium text-[#004565]">#{selectedFollowup.followup_number}</span>
                    </div>
                    <div>
                      <span className="text-[#004565]/70">Status:</span>
                      <span className="ml-2">{getStatusBadge(selectedFollowup.status)}</span>
                    </div>
                    <div>
                      <span className="text-[#004565]/70">Responded:</span>
                      <span className="ml-2">
                        {selectedFollowup.responded ? (
                          <Badge className="bg-green-500 text-white">Yes</Badge>
                        ) : (
                          <Badge className="bg-gray-500 text-white">No</Badge>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#004565]/70">Scheduled For:</span>
                      <span className="ml-2 font-medium text-[#004565]">
                        {new Date(selectedFollowup.scheduled_for).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#004565]/70">Days Since Scheduled:</span>
                      <span className="ml-2 font-medium text-[#004565]">
                        {getDaysSinceScheduled(selectedFollowup.scheduled_for)} day{getDaysSinceScheduled(selectedFollowup.scheduled_for) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#004565]/70">Created At:</span>
                      <span className="ml-2 font-medium text-[#004565]">
                        {new Date(selectedFollowup.created_at).toLocaleString()}
                      </span>
                    </div>
                    {selectedFollowup.email_template && (
                      <div className="col-span-2">
                        <span className="text-[#004565]/70">Email Template:</span>
                        <div className="mt-2 p-3 bg-[#004565]/5 rounded border border-[#004565]/20">
                          <pre className="text-xs text-[#004565]/70 whitespace-pre-wrap">
                            {selectedFollowup.email_template}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Conversation History */}
              <Card className="border-[#004565]/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-[#004565] mb-3 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Conversation History
                  </h3>

                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-[#004565]" />
                      <span className="ml-2 text-[#004565]/70">Loading conversation...</span>
                    </div>
                  ) : sortedMessages && sortedMessages.length > 0 ? (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                      {sortedMessages.map((message: any, index: number) => {
                        const messageDate = new Date(message.sent_at || message.created_at)
                        // Use direction field from lead_email_conversations table
                        // Direction can be 'inbound' or 'outbound' (lowercase)
                        const direction = message.direction?.toLowerCase() || 'inbound'
                        const isOutbound = direction === 'outbound'

                        return (
                          <div
                            key={message.id || index}
                            className={`p-4 rounded-lg border ${isOutbound
                                ? 'bg-blue-50 border-blue-200 ml-8'
                                : 'bg-green-50 border-green-200 mr-8'
                              }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {isOutbound ? (
                                  <Mail className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <Reply className="h-4 w-4 text-green-600" />
                                )}
                                <Badge className={isOutbound ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}>
                                  {direction === 'outbound' ? 'OUTBOUND' : 'INBOUND'}
                                </Badge>
                                <Badge
                                  className={`${message.status === 'sent' || message.status === 'delivered'
                                      ? 'bg-green-500'
                                      : message.status === 'replied'
                                        ? 'bg-blue-500'
                                        : message.status === 'failed'
                                          ? 'bg-red-500'
                                          : 'bg-gray-500'
                                    } text-white text-xs`}
                                >
                                  {message.status || 'queued'}
                                </Badge>
                              </div>
                              <div className="text-xs text-[#004565]/70">
                                {messageDate.toLocaleString()}
                              </div>
                            </div>

                            {/* Email addresses */}
                            <div className="mb-2 text-xs text-[#004565]/60">
                              {message.from_email && (
                                <div>
                                  <span className="font-semibold">From:</span> {message.from_email}
                                </div>
                              )}
                              {message.to_email && (
                                <div>
                                  <span className="font-semibold">To:</span> {message.to_email}
                                </div>
                              )}
                              {message.cc_email && message.cc_email.length > 0 && (
                                <div>
                                  <span className="font-semibold">CC:</span> {message.cc_email.join(', ')}
                                </div>
                              )}
                            </div>

                            {message.subject && (
                              <div className="mb-2">
                                <span className="text-xs font-semibold text-[#004565]/70">Subject: </span>
                                <span className={`text-sm font-medium ${isOutbound ? 'text-blue-900' : 'text-green-900'
                                  }`}>
                                  {message.subject}
                                </span>
                              </div>
                            )}

                            {/* Message body content from body column */}
                            <div className={`text-sm whitespace-pre-wrap mt-3 ${isOutbound ? 'text-blue-800' : 'text-green-800'
                              }`}>
                              {message.body || '(No content)'}
                            </div>

                            <div className="mt-2 flex items-center gap-4 text-xs text-[#004565]/60">
                              {message.sent_at && (
                                <span>Sent: {new Date(message.sent_at).toLocaleString()}</span>
                              )}
                              {message.delivered_at && (
                                <span>Delivered: {new Date(message.delivered_at).toLocaleString()}</span>
                              )}
                              {message.opened_at && (
                                <span>Opened: {new Date(message.opened_at).toLocaleString()}</span>
                              )}
                              {message.replied_at && (
                                <span>Replied: {new Date(message.replied_at).toLocaleString()}</span>
                              )}
                              {message.sequence_step !== null && message.sequence_step !== undefined && (
                                <span>Step: {message.sequence_step}</span>
                              )}
                              {message.thread_id && (
                                <span>Thread: {message.thread_id.substring(0, 8)}...</span>
                              )}
                            </div>

                            {message.status === 'failed' && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                <strong>Message failed to send</strong>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#004565]/70">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 text-[#004565]/30" />
                      <p>No conversation history found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

