'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRespondedLeads, useLeadConversation, usePauseSequence, useResumeSequence } from '@/lib/hooks/useOutreach'
import { MessageSquare, Mail, Clock, Calendar, User, Building2, ArrowRight, Reply, Pause, Play, CheckCircle2, Filter, Search, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ResponseLead {
  lead_id: string
  lead_name: string
  lead_email: string
  company_name: string | null
  campaign_id: string | null
  sequence_id: string | null
  sequence_name: string | null
  campaign_status: string
  current_step: number
  total_emails_sent: number
  reply_count: number
  last_replied_at: string | null
  last_email_sent_at: string | null
  started_at: string | null
  replied_messages: Array<{
    id: string
    subject: string
    content: string
    sequence_step: number
    sent_at: string
    replied_at: string
  }>
}

export default function FollowUpsPage() {
  const { data: respondedLeads, isLoading: leadsLoading, error } = useRespondedLeads()
  const pauseSequence = usePauseSequence()
  const resumeSequence = useResumeSequence()
  const [selectedLead, setSelectedLead] = useState<ResponseLead | null>(null)
  const [showReplyDialog, setShowReplyDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'completed'>('all')
  const [replySubject, setReplySubject] = useState('')
  const [replyContent, setReplyContent] = useState('')

  const filteredLeads = (respondedLeads || []).filter((lead: ResponseLead) => {
    const matchesSearch = 
      lead.lead_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lead_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && lead.campaign_status === 'active') ||
      (filterStatus === 'paused' && lead.campaign_status === 'paused') ||
      (filterStatus === 'completed' && lead.campaign_status === 'completed')
    
    return matchesSearch && matchesFilter
  })

  const handlePauseSequence = async (campaignId: string) => {
    try {
      await pauseSequence.mutateAsync({ campaign_id: campaignId })
    } catch (error: any) {
      alert(error.message || 'Failed to pause sequence')
    }
  }

  const handleResumeSequence = async (campaignId: string) => {
    try {
      await resumeSequence.mutateAsync({ campaign_id: campaignId })
    } catch (error: any) {
      alert(error.message || 'Failed to resume sequence')
    }
  }

  const handleReply = async () => {
    if (!selectedLead || !replySubject || !replyContent) {
      alert('Please fill in both subject and message')
      return
    }

    // TODO: Implement send reply API call
    alert('Reply functionality will be implemented when the API is ready')
    setShowReplyDialog(false)
    setReplySubject('')
    setReplyContent('')
  }

  const handleViewDetails = (lead: ResponseLead) => {
    setSelectedLead(lead)
    // Auto-populate reply subject if there's a previous message
    if (lead.replied_messages.length > 0) {
      const lastMessage = lead.replied_messages[lead.replied_messages.length - 1]
      setReplySubject(`Re: ${lastMessage.subject || 'Your inquiry'}`)
    }
    setShowDetailsDialog(true)
  }

  const activeCount = (respondedLeads || []).filter((l: ResponseLead) => l.campaign_status === 'active').length
  const pausedCount = (respondedLeads || []).filter((l: ResponseLead) => l.campaign_status === 'paused').length
  const completedCount = (respondedLeads || []).filter((l: ResponseLead) => l.campaign_status === 'completed').length

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
        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{respondedLeads?.length || 0}</div>
            <div className="text-sm text-green-600/70">Total Responses</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{activeCount}</div>
            <div className="text-sm text-blue-600/70">Active Sequences</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{pausedCount}</div>
            <div className="text-sm text-yellow-600/70">Paused</div>
          </CardContent>
        </Card>
        <Card className="border-purple-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{completedCount}</div>
            <div className="text-sm text-purple-600/70">Completed</div>
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
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('active')}
                className={filterStatus === 'active' ? 'bg-[#004565] text-white' : 'border-[#004565]/30 text-[#004565]'}
              >
                Active
              </Button>
              <Button
                variant={filterStatus === 'paused' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('paused')}
                className={filterStatus === 'paused' ? 'bg-[#004565] text-white' : 'border-[#004565]/30 text-[#004565]'}
              >
                Paused
              </Button>
              <Button
                variant={filterStatus === 'completed' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('completed')}
                className={filterStatus === 'completed' ? 'bg-[#004565] text-white' : 'border-[#004565]/30 text-[#004565]'}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responded Leads List */}
      <Card className="border-[#004565]/20 shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-[#004565]/5">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase">Lead</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase">Sequence</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase">Emails</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase">Last Response</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-[#004565] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <MessageSquare className="h-12 w-12 mx-auto text-[#004565]/50 mb-4" />
                      <p className="text-[#004565] font-medium mb-2">No responses found</p>
                      <p className="text-sm text-[#004565]/70">
                        {searchTerm || filterStatus !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Responses will appear here when leads reply to your emails'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead: ResponseLead) => (
                    <tr key={lead.lead_id} className="border-b hover:bg-[#004565]/5">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-[#004565] flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {lead.lead_name}
                          </div>
                          <div className="text-sm text-[#004565]/70">{lead.lead_email}</div>
                          {lead.company_name && (
                            <div className="text-xs text-[#004565]/60 flex items-center gap-1 mt-1">
                              <Building2 className="h-3 w-3" />
                              {lead.company_name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {lead.sequence_name ? (
                          <div>
                            <div className="font-medium text-[#004565]">{lead.sequence_name}</div>
                            <div className="text-xs text-[#004565]/60">Step {lead.current_step + 1}</div>
                          </div>
                        ) : (
                          <span className="text-[#004565]/50">No sequence</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={
                          lead.campaign_status === 'active' ? 'bg-blue-500 text-white' :
                          lead.campaign_status === 'completed' ? 'bg-purple-500 text-white' :
                          lead.campaign_status === 'paused' ? 'bg-yellow-500 text-white' :
                          'bg-gray-500 text-white'
                        }>
                          {lead.campaign_status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#004565]">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {lead.total_emails_sent} sent
                          </div>
                          <div className="flex items-center gap-2 text-green-600">
                            <MessageSquare className="h-4 w-4" />
                            {lead.reply_count} reply{lead.reply_count !== 1 ? 'ies' : ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#004565]/70">
                        {lead.last_replied_at ? (
                          <div>
                            <div>{new Date(lead.last_replied_at).toLocaleDateString()}</div>
                            <div className="text-xs">{new Date(lead.last_replied_at).toLocaleTimeString()}</div>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(lead)}
                            className="border-[#004565]/30 text-[#004565]"
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedLead(lead)
                              if (lead.replied_messages.length > 0) {
                                const lastMessage = lead.replied_messages[lead.replied_messages.length - 1]
                                setReplySubject(`Re: ${lastMessage.subject || 'Your inquiry'}`)
                              }
                              setShowReplyDialog(true)
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <Reply className="h-4 w-4 mr-1" />
                            Reply
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reply to {selectedLead?.lead_name}</DialogTitle>
            <DialogDescription>
              Send a reply and continue the conversation
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              {/* Conversation Thread */}
              <div className="space-y-3">
                <h3 className="font-semibold text-[#004565]">Conversation Thread</h3>
                {selectedLead.replied_messages.length > 0 ? (
                  selectedLead.replied_messages.map((msg, idx) => (
                    <Card key={msg.id} className="border-[#004565]/20">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium text-[#004565]">Step {msg.sequence_step + 1}</div>
                            <div className="text-xs text-[#004565]/60">
                              Sent: {new Date(msg.sent_at).toLocaleString()}
                            </div>
                            {msg.replied_at && (
                              <div className="text-xs text-green-600">
                                Replied: {new Date(msg.replied_at).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-[#004565] mb-1">{msg.subject}</div>
                        <div className="text-sm text-[#004565]/70 whitespace-pre-wrap">{msg.content}</div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-[#004565]/70">No messages in thread yet</p>
                )}
              </div>

              {/* Reply Form */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label htmlFor="reply-subject">Subject</Label>
                  <Input
                    id="reply-subject"
                    placeholder="Re: Your previous subject"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="reply-content">Message</Label>
                  <Textarea
                    id="reply-content"
                    placeholder="Type your reply..."
                    rows={8}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReplyDialog(false)
                      setReplySubject('')
                      setReplyContent('')
                    }}
                    className="border-[#004565]/30 text-[#004565]"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-green-500 hover:bg-green-600 text-white"
                    onClick={handleReply}
                    disabled={!replySubject || !replyContent}
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Send Reply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lead Details & Conversation</DialogTitle>
            <DialogDescription>
              Full conversation history and sequence information
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6">
              {/* Lead Info */}
              <Card className="border-[#004565]/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-[#004565] mb-3">Lead Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#004565]/70">Name:</span>
                      <span className="ml-2 font-medium text-[#004565]">{selectedLead.lead_name}</span>
                    </div>
                    <div>
                      <span className="text-[#004565]/70">Email:</span>
                      <span className="ml-2 font-medium text-[#004565]">{selectedLead.lead_email}</span>
                    </div>
                    {selectedLead.company_name && (
                      <div>
                        <span className="text-[#004565]/70">Company:</span>
                        <span className="ml-2 font-medium text-[#004565]">{selectedLead.company_name}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[#004565]/70">Sequence:</span>
                      <span className="ml-2 font-medium text-[#004565]">
                        {selectedLead.sequence_name || 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#004565]/70">Current Step:</span>
                      <span className="ml-2 font-medium text-[#004565]">
                        {selectedLead.current_step + 1}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#004565]/70">Status:</span>
                      <Badge className="ml-2 bg-blue-500 text-white">
                        {selectedLead.campaign_status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-[#004565]/30 text-[#004565]"
                  onClick={() => {
                    setShowDetailsDialog(false)
                    if (selectedLead.replied_messages.length > 0) {
                      const lastMessage = selectedLead.replied_messages[selectedLead.replied_messages.length - 1]
                      setReplySubject(`Re: ${lastMessage.subject || 'Your inquiry'}`)
                    }
                    setShowReplyDialog(true)
                  }}
                >
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </Button>
                {selectedLead.campaign_id && (
                  <>
                    {selectedLead.campaign_status === 'active' ? (
                      <Button
                        variant="outline"
                        className="border-yellow-300 text-yellow-600"
                        onClick={() => selectedLead.campaign_id && handlePauseSequence(selectedLead.campaign_id)}
                        disabled={pauseSequence.isPending}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        {pauseSequence.isPending ? 'Pausing...' : 'Pause Sequence'}
                      </Button>
                    ) : selectedLead.campaign_status === 'paused' ? (
                      <Button
                        variant="outline"
                        className="border-green-300 text-green-600"
                        onClick={() => selectedLead.campaign_id && handleResumeSequence(selectedLead.campaign_id)}
                        disabled={resumeSequence.isPending}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {resumeSequence.isPending ? 'Resuming...' : 'Resume Sequence'}
                      </Button>
                    ) : null}
                  </>
                )}
                <Button
                  variant="outline"
                  className="border-purple-300 text-purple-600"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Mark as Booked
                </Button>
              </div>

              {/* Conversation Timeline */}
              <div>
                <h3 className="font-semibold text-[#004565] mb-3">Conversation Timeline</h3>
                <div className="space-y-3">
                  {selectedLead.replied_messages.length > 0 ? (
                    selectedLead.replied_messages.map((msg, idx) => (
                      <Card key={msg.id} className="border-[#004565]/20">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <Badge className="bg-blue-500 text-white">
                              Step {msg.sequence_step + 1}
                            </Badge>
                            <div className="text-xs text-[#004565]/60">
                              {new Date(msg.sent_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="font-medium text-[#004565] mb-2">{msg.subject}</div>
                          <div className="text-sm text-[#004565]/70 whitespace-pre-wrap mb-3">{msg.content}</div>
                          {msg.replied_at && (
                            <div className="pt-3 border-t border-green-200">
                              <Badge className="bg-green-500 text-white mb-2">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Replied {new Date(msg.replied_at).toLocaleString()}
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-sm text-[#004565]/70">No messages found</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

