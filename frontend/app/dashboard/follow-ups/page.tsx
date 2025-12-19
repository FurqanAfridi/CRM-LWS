'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useFollowupQueue, useLeadConversation, usePauseSequence, useResumeSequence, useGenerateResponse, useSendManualEmail } from '@/lib/hooks/useOutreach'
import { MessageSquare, Mail, Clock, Calendar, User, Building2, ArrowRight, Reply, Pause, Play, CheckCircle2, Filter, Search, Loader2, RefreshCw, Send } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

type FollowupStatus = 'pending' | 'sent' | 'cancelled' | 'skipped'

export default function FollowUpsPage() {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'sent' | 'cancelled' | 'skipped'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { data: followupQueue, isLoading: leadsLoading, error } = useFollowupQueue(
    filterStatus !== 'all' ? { status: filterStatus } : undefined
  )
  const pauseSequence = usePauseSequence()
  const resumeSequence = useResumeSequence()
  const generateResponse = useGenerateResponse()
  const sendEmail = useSendManualEmail()
  const [selectedFollowup, setSelectedFollowup] = useState<any>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showRespondDialog, setShowRespondDialog] = useState(false)
  const [suggestedResponse, setSuggestedResponse] = useState<{ subject: string; content: string } | null>(null)
  const [userChanges, setUserChanges] = useState<string>('')
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false)

  const filteredFollowups = (followupQueue || []).filter((item) => {
    const matchesSearch = 
      (item.lead?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (item.lead?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (item.lead?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (item.sequence?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    
    return matchesSearch
  })

  const pendingCount = (followupQueue || []).filter((item) => item.status === 'pending').length
  const sentCount = (followupQueue || []).filter((item) => item.status === 'sent').length
  const cancelledCount = (followupQueue || []).filter((item) => item.status === 'cancelled').length
  const skippedCount = (followupQueue || []).filter((item) => item.status === 'skipped').length

  const handleViewDetails = (item: any) => {
    setSelectedFollowup(item)
    setShowDetailsDialog(true)
  }

  const getDaysSinceScheduled = (scheduledFor: string): number => {
    const scheduled = new Date(scheduledFor)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - scheduled.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleFollowUp = async (item: any) => {
    // TODO: Implement follow-up action
    // This could trigger sending the follow-up email or opening a dialog
    alert(`Follow-up action for ${item.lead?.name || item.lead?.email} - Follow-up #${item.followup_number}`)
  }

  const handleRespond = async (item: any) => {
    setSelectedFollowup(item)
    setShowRespondDialog(true)
    setUserChanges('')
    setIsGeneratingResponse(true)
    
    try {
      // Generate initial response - API will fetch conversation history
      const result = await generateResponse.mutateAsync({
        lead_id: item.lead_id,
        conversation_history: undefined, // Let API fetch it
        user_changes: null,
      })
      
      setSuggestedResponse({
        subject: result.subject || 'Re: Your inquiry',
        content: result.content || '',
      })
    } catch (error: any) {
      alert(error.message || 'Failed to generate response')
      setShowRespondDialog(false)
    } finally {
      setIsGeneratingResponse(false)
    }
  }

  const handleRegenerateResponse = async () => {
    if (!selectedFollowup || !suggestedResponse) return
    
    setIsGeneratingResponse(true)
    try {
      // Regenerate response with user changes - API will fetch conversation history
      const result = await generateResponse.mutateAsync({
        lead_id: selectedFollowup.lead_id,
        conversation_history: undefined, // Let API fetch it
        user_changes: userChanges || null,
      })
      
      setSuggestedResponse({
        subject: result.subject || suggestedResponse.subject,
        content: result.content || suggestedResponse.content,
      })
      // Clear changes after regeneration
      setUserChanges('')
    } catch (error: any) {
      alert(error.message || 'Failed to regenerate response')
    } finally {
      setIsGeneratingResponse(false)
    }
  }

  const handleSendResponse = async () => {
    if (!selectedFollowup || !suggestedResponse) return
    
    try {
      await sendEmail.mutateAsync({
        lead_id: selectedFollowup.lead_id,
        subject: suggestedResponse.subject,
        content: suggestedResponse.content,
      })
      
      alert('Response sent successfully!')
      setShowRespondDialog(false)
      setSuggestedResponse(null)
      setUserChanges('')
    } catch (error: any) {
      alert(error.message || 'Failed to send response')
    }
  }

  const getStatusBadge = (status: FollowupStatus) => {
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
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#004565]">Follow-ups</h1>
          <p className="text-[#004565]/80 mt-2 font-medium">Manage responses and continue sequences</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-yellow-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-sm text-yellow-600/70">Pending</div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{sentCount}</div>
            <div className="text-sm text-green-600/70">Sent</div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{cancelledCount}</div>
            <div className="text-sm text-red-600/70">Cancelled</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{skippedCount}</div>
            <div className="text-sm text-gray-600/70">Skipped</div>
          </CardContent>
        </Card>
      </div>

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
            <table className="w-full">
              <thead>
                <tr className="border-b bg-[#004565]/5">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase">Lead</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase">Sequence</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase">Follow-up #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-[#004565] uppercase">Follow-up</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-[#004565] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFollowups.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
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
                  filteredFollowups.map((item) => {
                    const daysSince = getDaysSinceScheduled(item.scheduled_for)
                    return (
                      <tr key={item.id} className="border-b hover:bg-[#004565]/5">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-[#004565] flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {item.lead?.name || item.lead?.email || 'Unknown'}
                            </div>
                            <div className="text-sm text-[#004565]/70">{item.lead?.email || '—'}</div>
                            {item.lead?.company_name && (
                              <div className="text-xs text-[#004565]/60 flex items-center gap-1 mt-1">
                                <Building2 className="h-3 w-3" />
                                {item.lead.company_name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {item.sequence?.name ? (
                            <div>
                              <div className="font-medium text-[#004565]">{item.sequence.name}</div>
                              {item.campaign && (
                                <div className="text-xs text-[#004565]/60">Campaign: {item.campaign.status}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#004565]/50">No sequence</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-[#004565]">#{item.followup_number}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-[#004565]">
                            {daysSince === 0 ? 'Today' : `${daysSince} day${daysSince !== 1 ? 's' : ''}`}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.responded ? (
                            <Button
                              size="sm"
                              onClick={() => handleRespond(item)}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              <Reply className="h-4 w-4 mr-1" />
                              Respond
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleFollowUp(item)}
                              className="bg-[#004565] hover:bg-[#004565]/90 text-white"
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Follow-up
                            </Button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(item)}
                              className="border-[#004565]/30 text-[#004565]"
                            >
                              View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
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
          
          {isGeneratingResponse ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#004565]" />
              <span className="ml-3 text-[#004565]">Generating response...</span>
            </div>
          ) : suggestedResponse ? (
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

              {/* Changes Box */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-[#004565] font-semibold">Suggested Changes (Optional)</Label>
                    <p className="text-xs text-[#004565]/70 mb-2">
                      Enter any changes or instructions to modify the response (e.g., "Make it more friendly", "Add pricing information", "Be more direct")
                    </p>
                    <Textarea
                      value={userChanges}
                      onChange={(e) => setUserChanges(e.target.value)}
                      placeholder="e.g., Make it more casual and friendly..."
                      className="mt-1 min-h-[100px] border-blue-300"
                    />
                  </div>
                  <Button
                    onClick={handleRegenerateResponse}
                    disabled={isGeneratingResponse}
                    variant="outline"
                    className="w-full border-blue-400 text-blue-700 hover:bg-blue-100"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingResponse ? 'animate-spin' : ''}`} />
                    Regenerate Response
                  </Button>
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
                  onClick={handleSendResponse}
                  disabled={sendEmail.isPending}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendEmail.isPending ? 'Sending...' : 'Send Response'}
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

