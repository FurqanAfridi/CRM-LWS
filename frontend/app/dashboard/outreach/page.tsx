'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLeads } from '@/lib/hooks/useLeads'
import { useEmailCampaigns, useStartSequence } from '@/lib/hooks/useOutreach'
import { Mail, CheckCircle2, Clock, Calendar, MessageSquare, Send, Play, Pause, Building2, ArrowUp, ArrowDown } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StartSequenceDialog } from '@/components/outreach/StartSequenceDialog'
import { useQueryClient } from '@tanstack/react-query'

type OutreachStatus = 'not_started' | 'sent' | 'responded' | 'booked'

export default function OutreachPage() {
  const { data: leads, isLoading: leadsLoading } = useLeads()
  const { data: campaigns } = useEmailCampaigns()
  const queryClient = useQueryClient()
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [showStartDialog, setShowStartDialog] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  // Group leads by outreach status
  const getLeadStatus = (lead: any): OutreachStatus => {
    // After outreach starts, leads go to followup_queue, so we don't show "sent" status here
    if (lead.outreach_status === 'booked') return 'booked'
    if (lead.outreach_status === 'responded') return 'responded'
    // If there's a campaign, it means outreach has started, but we don't show it here
    // It will be shown in the follow-ups page instead
    return 'not_started'
  }

  const leadsByStatus = {
    not_started: leads?.filter(l => l.email && getLeadStatus(l) === 'not_started') || [],
    responded: leads?.filter(l => l.email && getLeadStatus(l) === 'responded') || [],
    booked: leads?.filter(l => l.email && getLeadStatus(l) === 'booked') || [],
  }

  const getStatusBadge = (status: OutreachStatus) => {
    switch (status) {
      case 'not_started':
        return <Badge variant="outline" className="border-gray-300 text-gray-600">Not Started</Badge>
      case 'sent':
        return <Badge className="bg-blue-500 text-white"><Clock className="h-3 w-3 mr-1" />Waiting</Badge>
      case 'responded':
        return <Badge className="bg-green-500 text-white"><MessageSquare className="h-3 w-3 mr-1" />Responded</Badge>
      case 'booked':
        return <Badge className="bg-purple-500 text-white"><Calendar className="h-3 w-3 mr-1" />Booked</Badge>
    }
  }

  const handleSequenceStarted = () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] })
    queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
    setShowStartDialog(false)
    setSelectedLeadIds([])
  }

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId]
    )
  }

  const handleStartOutreach = () => {
    if (selectedLeadIds.length === 0) {
      alert('Please select at least one lead to start outreach')
      return
    }
    setShowStartDialog(true)
  }

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === 'asc' ? { key, direction: 'desc' } : null
      }
      return { key, direction: 'asc' }
    })
  }

  const filteredLeads = useMemo(() => {
    // Only show leads that are not_started, responded, or booked
    // Leads with "sent" status will be shown in the follow-ups page instead
    if (!leads) return []
    return leads.filter(l => {
      if (!l.email) return false
      // Check status directly without using getLeadStatus to avoid dependency issues
      if (l.outreach_status === 'booked') return true
      if (l.outreach_status === 'responded') return true
      // If there's an active campaign, it means outreach started - don't show here
      const campaign = campaigns?.find((c: any) => c.lead_id === l.id && (c.status === 'active' || c.status === 'pending'))
      if (campaign || l.outreach_status === 'in_sequence') return false
      return true // not_started
    })
  }, [leads, campaigns])

  const sortedLeads = useMemo(() => {
    if (!filteredLeads || !sortConfig) return filteredLeads

    return [...filteredLeads].sort((a, b) => {
      let aValue: any
      let bValue: any

      // Handle different sort keys
      switch (sortConfig.key) {
        case 'name':
          aValue = a.name || a.email || ''
          bValue = b.name || b.email || ''
          break
        case 'email':
          aValue = a.email || ''
          bValue = b.email || ''
          break
        case 'company_name':
          aValue = a.company_name || ''
          bValue = b.company_name || ''
          break
        case 'title':
          aValue = a.title || ''
          bValue = b.title || ''
          break
        case 'status': {
          const campaignA = campaigns?.find((c: any) => c.lead_id === a.id && (c.status === 'active' || c.status === 'pending'))
          const campaignB = campaigns?.find((c: any) => c.lead_id === b.id && (c.status === 'active' || c.status === 'pending'))
          
          if (a.outreach_status === 'booked') aValue = 'booked'
          else if (a.outreach_status === 'responded') aValue = 'responded'
          else if (campaignA || a.outreach_status === 'in_sequence') aValue = 'sent'
          else aValue = 'not_started'
          
          if (b.outreach_status === 'booked') bValue = 'booked'
          else if (b.outreach_status === 'responded') bValue = 'responded'
          else if (campaignB || b.outreach_status === 'in_sequence') bValue = 'sent'
          else bValue = 'not_started'
          break
        }
        case 'last_contact': {
          const campaignA = campaigns?.find((c: any) => c.lead_id === a.id)
          const campaignB = campaigns?.find((c: any) => c.lead_id === b.id)
          aValue = campaignA?.started_at || ''
          bValue = campaignB?.started_at || ''
          break
        }
        default:
          return 0
      }

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      // Handle dates
      if (sortConfig.key === 'last_contact') {
        const dateA = aValue ? new Date(aValue).getTime() : 0
        const dateB = bValue ? new Date(bValue).getTime() : 0
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA
      }

      // Handle strings
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()
      const comparison = aStr.localeCompare(bStr)
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [filteredLeads, sortConfig, campaigns])

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) {
      return <ArrowUp className="h-3 w-3 ml-1 opacity-30" />
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    )
  }

  if (leadsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#004565]/20 border-t-[#004565]"></div>
      </div>
    )
  }

  const totalLeadsWithEmail = leads?.filter(l => l.email).length || 0

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-40 bg-white shadow-sm pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <h1 className="text-4xl font-bold text-[#004565]">Outreach</h1>
            {/* Status Summary - Moved up beside title */}
            <div className="flex items-center gap-3">
              <Card className="border-[#004565]/20">
                <CardContent className="p-3">
                  <div className="text-xl font-bold text-[#004565]">{leadsByStatus.not_started.length}</div>
                  <div className="text-xs text-[#004565]/70">Not Started</div>
                </CardContent>
              </Card>
              <Card className="border-green-200">
                <CardContent className="p-3">
                  <div className="text-xl font-bold text-green-600">{leadsByStatus.responded.length}</div>
                  <div className="text-xs text-green-600/70">Responded</div>
                </CardContent>
              </Card>
              <Card className="border-purple-200">
                <CardContent className="p-3">
                  <div className="text-xl font-bold text-purple-600">{leadsByStatus.booked.length}</div>
                  <div className="text-xs text-purple-600/70">Booked</div>
                </CardContent>
              </Card>
            </div>
          </div>
          {selectedLeadIds.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#004565]/70">
                {selectedLeadIds.length} lead{selectedLeadIds.length > 1 ? 's' : ''} selected
              </span>
              <Button
                onClick={handleStartOutreach}
                className="bg-[#004565] hover:bg-[#004565]/90 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Start Outreach ({selectedLeadIds.length})
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedLeadIds([])}
                className="border-[#004565]/30 text-[#004565]"
              >
                Clear Selection
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Leads List */}
      <Card className="border-[#004565]/20 shadow-lg">
        <CardContent className="p-0">
          <div className="flex flex-col h-[calc(100vh-280px)]">
            <div className="overflow-x-scroll overflow-y-auto flex-1">
              <table className="w-full">
                <thead className="sticky top-0 z-30 bg-[#004565]/5">
                  <tr className="border-b bg-[#004565]/5">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase w-12">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.length > 0 && selectedLeadIds.length === leads?.filter(l => l.email && getLeadStatus(l) === 'not_started').length}
                        onChange={(e) => {
                          const notStartedLeads = leads?.filter(l => l.email && getLeadStatus(l) === 'not_started') || []
                          if (e.target.checked) {
                            setSelectedLeadIds(notStartedLeads.map(l => l.id))
                          } else {
                            setSelectedLeadIds([])
                          }
                        }}
                        className="h-4 w-4 text-[#004565] cursor-pointer"
                      />
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase cursor-pointer hover:bg-[#004565]/10 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Lead
                        <SortIcon columnKey="name" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase cursor-pointer hover:bg-[#004565]/10 transition-colors"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center">
                        Email
                        <SortIcon columnKey="email" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase cursor-pointer hover:bg-[#004565]/10 transition-colors"
                      onClick={() => handleSort('company_name')}
                    >
                      <div className="flex items-center">
                        Company
                        <SortIcon columnKey="company_name" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase cursor-pointer hover:bg-[#004565]/10 transition-colors"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center">
                        Title
                        <SortIcon columnKey="title" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase cursor-pointer hover:bg-[#004565]/10 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        <SortIcon columnKey="status" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase cursor-pointer hover:bg-[#004565]/10 transition-colors"
                      onClick={() => handleSort('last_contact')}
                    >
                      <div className="flex items-center">
                        Last Contact
                        <SortIcon columnKey="last_contact" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-[#004565] uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLeads.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                      <Mail className="h-12 w-12 mx-auto text-[#004565]/50 mb-4" />
                      <p className="text-[#004565] font-medium mb-2">No leads with email addresses</p>
                      <p className="text-sm text-[#004565]/70">Add email addresses to leads to start outreach.</p>
                    </td>
                  </tr>
                ) : (
                  sortedLeads.map((lead) => {
                    const status = getLeadStatus(lead)
                    const campaign = campaigns?.find((c: any) => c.lead_id === lead.id)
                    const isSelected = selectedLeadIds.includes(lead.id)
                    const canSelect = status === 'not_started'
                    
                    return (
                      <tr 
                        key={lead.id} 
                        className={`border-b hover:bg-[#004565]/5 ${isSelected ? 'bg-[#004565]/5' : ''}`}
                      >
                        <td className="px-6 py-4">
                          {canSelect && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleLeadSelection(lead.id)}
                              className="h-4 w-4 text-[#004565] cursor-pointer"
                            />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-[#004565]">{lead.name || lead.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#004565]/70">{lead.email}</td>
                        <td className="px-6 py-4 text-sm text-[#004565]/70">
                          {lead.company_name ? (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {lead.company_name}
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#004565]/70">
                          {lead.title || '—'}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#004565]/70">
                          {campaign?.started_at 
                            ? new Date(campaign.started_at).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {status === 'not_started' && (
                            <Button
                              size="sm"
                              className="bg-[#004565] hover:bg-[#004565]/90 text-white"
                              onClick={() => {
                                setSelectedLeadIds([lead.id])
                                setShowStartDialog(true)
                              }}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Start Outreach
                            </Button>
                          )}
                          {status === 'responded' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-300 text-green-600"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              View Reply
                            </Button>
                          )}
                          {status === 'booked' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-purple-300 text-purple-600"
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              View Booking
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Start Sequence Dialog */}
      {selectedLeadIds.length > 0 && (
        <StartSequenceDialog
          leadIds={selectedLeadIds}
          leadNames={selectedLeadIds.map(id => leads?.find(l => l.id === id)?.name).filter(Boolean) as string[]}
          open={showStartDialog}
          onOpenChange={setShowStartDialog}
          onSuccess={handleSequenceStarted}
        />
      )}
    </div>
  )
}

