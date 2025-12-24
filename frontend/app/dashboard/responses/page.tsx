'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePendingResponses, useAIResponderConfig, useLeadMessages, useUpdatePendingResponse } from '@/lib/hooks/useOutreach'
import { MessageSquare, User, Building2, Clock, CheckCircle2, XCircle, Eye, Filter, Search, Loader2, Bot, Info } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
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
      className="px-6 py-3 text-left text-xs font-medium text-[#004565] uppercase tracking-wider cursor-move bg-[#004565]/5 relative group touch-none"
    >
      {children}
    </th>
  )
}

type ResponseStatus = 'pending' | 'approved' | 'rejected' | 'sent'

function getStatusBadge(status: ResponseStatus | null) {
  if (!status) return null
  
  switch (status) {
    case 'pending':
      return <Badge className="bg-yellow-500 text-white flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>
    case 'approved':
      return <Badge className="bg-green-500 text-white flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Approved</Badge>
    case 'rejected':
      return <Badge className="bg-red-500 text-white flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>
    case 'sent':
      return <Badge className="bg-blue-500 text-white flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Sent</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function ResponsesPage() {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'sent'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedResponse, setSelectedResponse] = useState<any>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [editedSubject, setEditedSubject] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [userChanges, setUserChanges] = useState('')
  
  // Column definitions
  const allColumns = {
    hash: { label: '#' },
    lead: { label: 'Lead' },
    subject: { label: 'Subject' },
    status: { label: 'Status' },
    generated: { label: 'Generated' },
    actions: { label: 'Actions' },
  }

  const [columnOrder, setColumnOrder] = useState<string[]>([
    'hash', 'lead', 'subject', 'status', 'generated', 'actions'
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
  
  const { data: aiResponderConfig } = useAIResponderConfig()
  const { data: allResponses, isLoading, error } = usePendingResponses(
    undefined,
    filterStatus !== 'all' ? filterStatus : undefined
  )
  
  // Fetch conversation messages for selected response
  const { data: conversationMessages } = useLeadMessages(
    selectedResponse?.lead_id || ''
  )
  
  const updatePendingResponse = useUpdatePendingResponse()

  // Sort messages chronologically (oldest first)
  const sortedMessages = conversationMessages
    ? [...conversationMessages].sort((a, b) => {
        const dateA = new Date(a.sent_at || a.created_at).getTime()
        const dateB = new Date(b.sent_at || b.created_at).getTime()
        return dateA - dateB
      })
    : []

  // Memoize filtered responses
  const filteredResponses = useMemo(() => {
    if (!allResponses) return []
    if (!searchTerm) return allResponses
    
    const searchLower = searchTerm.toLowerCase()
    return allResponses.filter((response: any) => {
      const lead = response.leads || {}
      return (
        (lead.name?.toLowerCase().includes(searchLower) || false) ||
        (lead.email?.toLowerCase().includes(searchLower) || false) ||
        (lead.company_name?.toLowerCase().includes(searchLower) || false) ||
        (response.subject?.toLowerCase().includes(searchLower) || false)
      )
    })
  }, [allResponses, searchTerm])

  // Memoize counts
  const { pendingCount, approvedCount, rejectedCount, sentCount } = useMemo(() => {
    if (!allResponses) return { pendingCount: 0, approvedCount: 0, rejectedCount: 0, sentCount: 0 }
    return {
      pendingCount: allResponses.filter((r: any) => r.status === 'pending').length,
      approvedCount: allResponses.filter((r: any) => r.status === 'approved').length,
      rejectedCount: allResponses.filter((r: any) => r.status === 'rejected').length,
      sentCount: allResponses.filter((r: any) => r.status === 'sent').length,
    }
  }, [allResponses])

  const handleViewDetails = (response: any) => {
    setSelectedResponse(response)
    setShowDetailsDialog(true)
  }

  const handleApprove = (response: any) => {
    setSelectedResponse(response)
    setEditedSubject(response.subject)
    setEditedContent(response.content)
    setUserChanges(response.user_changes || '')
    setShowApproveDialog(true)
  }

  const handleApproveResponse = async () => {
    if (!selectedResponse) return
    
    try {
      await updatePendingResponse.mutateAsync({
        id: selectedResponse.id,
        updates: {
          subject: editedSubject,
          content: editedContent,
          user_changes: userChanges || null,
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        },
      })
      
      alert('Response approved! n8n will automatically send the email.')
      setShowApproveDialog(false)
      setSelectedResponse(null)
      setEditedSubject('')
      setEditedContent('')
      setUserChanges('')
    } catch (error: any) {
      alert(error.message || 'Failed to approve response')
    }
  }

  const handleReject = async (response: any) => {
    if (!confirm('Are you sure you want to reject this response?')) return
    
    try {
      await updatePendingResponse.mutateAsync({
        id: response.id,
        updates: {
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        },
      })
      
      alert('Response rejected.')
    } catch (error: any) {
      alert(error.message || 'Failed to reject response')
    }
  }

  const isAutoReplyEnabled = aiResponderConfig?.enabled && aiResponderConfig?.auto_send
  const autoSendEnabled = aiResponderConfig?.auto_send || false

  const renderCell = (response: any, columnId: string, index: number) => {
    const lead = response.leads || {}
    const canApprove = !autoSendEnabled && response.status === 'pending'

    switch (columnId) {
      case 'hash':
        return <div className="text-sm text-[#004565]/70 font-mono">{index + 1}</div>
      case 'lead':
        return (
          <div>
            <div className="font-medium text-[#004565] flex items-center gap-2">
              <User className="h-4 w-4" />
              {lead.name || lead.email || 'Unknown'}
            </div>
            <div className="text-sm text-[#004565]/70">{lead.email || '—'}</div>
            {lead.company_name && (
              <div className="text-xs text-[#004565]/60 flex items-center gap-1 mt-1">
                <Building2 className="h-3 w-3" />
                {lead.company_name}
              </div>
            )}
          </div>
        )
      case 'subject':
        return (
          <>
            <div className="text-sm font-medium text-[#004565]">{response.subject}</div>
            <div className="text-xs text-[#004565]/60 mt-1 line-clamp-2">
              {response.content.substring(0, 100)}...
            </div>
          </>
        )
      case 'status':
        return getStatusBadge(response.status)
      case 'generated':
        return (
          <>
            <div className="text-sm text-[#004565]">
              {format(new Date(response.generated_at), 'MMM d, yyyy')}
            </div>
            <div className="text-xs text-[#004565]/60">
              {format(new Date(response.generated_at), 'h:mm a')}
            </div>
          </>
        )
      case 'actions':
        return (
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewDetails(response)}
              className="border-[#004565]/30 text-[#004565]"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            {canApprove && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleApprove(response)}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleReject(response)}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
            {autoSendEnabled && response.status === 'pending' && (
              <span className="text-xs text-[#004565]/60 italic">
                Auto-send enabled
              </span>
            )}
          </div>
        )
      default:
        return null
    }
  }

  if (isLoading) {
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
          {error instanceof Error ? error.message : 'Failed to load pending responses'}
        </p>
      </div>
    )
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#004565]">Responses</h1>
          <p className="text-[#004565]/80 mt-2 font-medium">Review and manage AI-generated responses</p>
        </div>
        <div className="flex gap-4">
          <Card className="border-yellow-200 bg-yellow-50 w-32">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-xs text-yellow-700">Pending</div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50 w-32">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-green-600">{approvedCount}</div>
              <div className="text-xs text-green-700">Approved</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50 w-32">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-red-600">{rejectedCount}</div>
              <div className="text-xs text-red-700">Rejected</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50 w-32">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-blue-600">{sentCount}</div>
              <div className="text-xs text-blue-700">Sent</div>
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
                <h3 className="text-sm font-semibold text-blue-900 mb-1">AI Auto-Responder is Enabled</h3>
                <p className="text-xs text-blue-800 ">
                  The AI auto-responder is currently handling responses automatically. Manual replies are disabled to prevent conflicts. 
                  You can manage the AI responder settings in the <strong>Pipeline</strong> page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card className="border-[#004565]/20">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#004565]/50" />
                <Input
                  placeholder="Search by lead name, email, company, or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-[#004565]/30"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setFilterStatus('all')}
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                className={filterStatus === 'all' ? 'bg-[#004565] text-white' : 'border-[#004565]/30 text-[#004565]'}
              >
                All
              </Button>
              <Button
                onClick={() => setFilterStatus('pending')}
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                className={filterStatus === 'pending' ? 'bg-yellow-500 text-white' : 'border-yellow-300 text-yellow-700'}
              >
                Pending
              </Button>
              <Button
                onClick={() => setFilterStatus('approved')}
                variant={filterStatus === 'approved' ? 'default' : 'outline'}
                size="sm"
                className={filterStatus === 'approved' ? 'bg-green-500 text-white' : 'border-green-300 text-green-700'}
              >
                Approved
              </Button>
              <Button
                onClick={() => setFilterStatus('rejected')}
                variant={filterStatus === 'rejected' ? 'default' : 'outline'}
                size="sm"
                className={filterStatus === 'rejected' ? 'bg-red-500 text-white' : 'border-red-300 text-red-700'}
              >
                Rejected
              </Button>
              <Button
                onClick={() => setFilterStatus('sent')}
                variant={filterStatus === 'sent' ? 'default' : 'outline'}
                size="sm"
                className={filterStatus === 'sent' ? 'bg-blue-500 text-white' : 'border-blue-300 text-blue-700'}
              >
                Sent
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responses Table */}
      <Card className="border-[#004565]/20 shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="w-full">
                <thead className="bg-[#004565]/10">
                  <tr>
                    <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                      {columnOrder.map((columnId) => (
                        <SortableHeader key={columnId} id={columnId}>
                          {allColumns[columnId as keyof typeof allColumns].label}
                        </SortableHeader>
                      ))}
                    </SortableContext>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#004565]/10">
                  {filteredResponses.length === 0 ? (
                    <tr>
                      <td colSpan={columnOrder.length} className="px-6 py-12 text-center">
                        <MessageSquare className="h-12 w-12 text-[#004565]/30 mx-auto mb-4" />
                        <p className="text-[#004565]/70 font-medium">No responses found</p>
                        <p className="text-sm text-[#004565]/50 mt-1">
                          {searchTerm ? 'Try adjusting your search filters' : 'No pending responses available'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredResponses.map((response: any, index: number) => (
                      <tr key={response.id} className="border-b hover:bg-[#004565]/5">
                        {columnOrder.map((columnId) => (
                          <td 
                            key={columnId} 
                            className={`px-6 py-4 ${columnId === 'actions' ? 'text-center' : ''}`}
                          >
                            {renderCell(response, columnId, index)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </DndContext>
          </div>
        </CardContent>
      </Card>

      {/* View Details Dialog - Conversation History */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#004565]">
              Conversation History
              {selectedResponse?.leads && (
                <span className="text-[#004565]/70 font-normal ml-2">
                  - {selectedResponse.leads.name || selectedResponse.leads.email || 'Unknown'}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Complete conversation thread with this lead
            </DialogDescription>
          </DialogHeader>
          {selectedResponse && (
            <div className="space-y-6">
              {/* Response Details */}
              <Card className="border-[#004565]/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-[#004565] mb-3">AI-Generated Response</h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-[#004565]/70 text-sm">Subject</Label>
                      <div className="text-[#004565] font-medium">{selectedResponse.subject}</div>
                    </div>
                    <div>
                      <Label className="text-[#004565]/70 text-sm">Content</Label>
                      <div className="text-[#004565] whitespace-pre-wrap bg-[#004565]/5 p-3 rounded-lg">
                        {selectedResponse.content}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[#004565]/70 text-sm">Status:</Label>
                      {getStatusBadge(selectedResponse.status)}
                    </div>
                    {selectedResponse.user_changes && (
                      <div>
                        <Label className="text-[#004565]/70 text-sm">User Changes</Label>
                        <div className="text-[#004565] text-sm bg-blue-50 p-2 rounded">
                          {selectedResponse.user_changes}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Conversation History */}
              <Card className="border-[#004565]/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-[#004565] mb-3">Conversation History</h3>
                  {sortedMessages.length > 0 ? (
                    <div className="space-y-4">
                      {sortedMessages.map((message: any, idx: number) => (
                        <div
                          key={message.id || idx}
                          className={`p-3 rounded-lg ${
                            message.status === 'replied'
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-[#004565]/5 border border-[#004565]/10'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-[#004565]">
                                {message.subject || 'No Subject'}
                              </div>
                              <div className="text-xs text-[#004565]/60 mt-1">
                                {format(new Date(message.sent_at || message.created_at), 'PPpp')}
                              </div>
                            </div>
                            <Badge
                              className={
                                message.status === 'replied'
                                  ? 'bg-green-500 text-white'
                                  : message.status === 'sent'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-500 text-white'
                              }
                            >
                              {message.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-[#004565] whitespace-pre-wrap mt-2">
                            {message.content || 'No content'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#004565]/70 text-center py-4">
                      No conversation history available
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#004565]">Approve Response</DialogTitle>
            <DialogDescription>
              Review and customize the AI-generated response before approving
            </DialogDescription>
          </DialogHeader>
          {selectedResponse && (
            <div className="space-y-6">
              {/* Editable Response */}
              <Card className="border-[#004565]/20">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-[#004565] font-semibold">Subject</Label>
                    <Input
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      className="mt-1 border-[#004565]/30"
                    />
                  </div>
                  <div>
                    <Label className="text-[#004565] font-semibold">Response Content</Label>
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="mt-1 min-h-[200px] border-[#004565]/30"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* User Changes */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-[#004565] font-semibold">Your Changes (Optional)</Label>
                    <p className="text-xs text-[#004565]/70 mb-2">
                      Add any notes about changes you made to the response
                    </p>
                    <Textarea
                      value={userChanges}
                      onChange={(e) => setUserChanges(e.target.value)}
                      placeholder="Add any notes about changes you made..."
                      className="mt-1 min-h-[100px] border-blue-300"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#004565]/10">
                <Button
                  onClick={() => {
                    setShowApproveDialog(false)
                    setEditedSubject('')
                    setEditedContent('')
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

