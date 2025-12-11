'use client'

import { useState, useMemo } from 'react'
import { useLeads, useCreateLead, useUpdateLead } from '@/lib/hooks/useLeads'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Target, Download, Mail, Building2, ArrowRight, DollarSign, TrendingUp, AlertCircle, MessageSquare, FileText, RefreshCw, CheckCircle2, XCircle, ShieldCheck, Plus, Play, Edit, ArrowUp, ArrowDown } from 'lucide-react'
import { Database, LeadStatus, QualificationStatus } from '@/lib/supabase/types'
import { StartSequenceDialog } from '@/components/outreach/StartSequenceDialog'

type Lead = Database['public']['Tables']['leads']['Row']
type LeadInsert = Database['public']['Tables']['leads']['Insert']
type LeadUpdate = Database['public']['Tables']['leads']['Update']

export default function LeadsPage() {
  const { data: leads, isLoading, error, refetch } = useLeads()
  const createLead = useCreateLead()
  const updateLead = useUpdateLead()
  const queryClient = useQueryClient()
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isStartSequenceDialogOpen, setIsStartSequenceDialogOpen] = useState(false)
  const [selectedLeadIdsForSequence, setSelectedLeadIdsForSequence] = useState<string[]>([])
  const [selectedLeadNamesForSequence, setSelectedLeadNamesForSequence] = useState<string[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<Partial<LeadInsert>>({
    name: '',
    email: '',
    company_name: '',
    title: '',
    status: 'new',
    qualification_status: 'unqualified',
    source: 'manual',
    icp_score: 0,
    estimated_value: null,
    probability: 0,
    lead_tier: '',
    notes: '',
  })

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === 'asc' ? { key, direction: 'desc' } : null
      }
      return { key, direction: 'asc' }
    })
  }

  const sortedLeads = useMemo(() => {
    if (!leads || !sortConfig) return leads || []

    return [...leads].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key]
      const bValue = (b as any)[sortConfig.key]

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Handle strings
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()
      const comparison = aStr.localeCompare(bStr)
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [leads, sortConfig])

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

  const handleOpenCreateDialog = () => {
    setIsEditing(false)
    setFormData({
      name: '',
      email: '',
      company_name: '',
      title: '',
      status: 'new',
      qualification_status: 'unqualified',
      source: 'manual',
      icp_score: 0,
      estimated_value: null,
      probability: 0,
      lead_tier: '',
      notes: '',
    })
    setIsFormDialogOpen(true)
  }

  const handleOpenEditDialog = (lead: Lead) => {
    setIsEditing(true)
    setSelectedLead(lead)
    setFormData({
      name: lead.name || '',
      email: lead.email || '',
      company_name: lead.company_name || '',
      title: lead.title || '',
      status: lead.status || 'new',
      qualification_status: lead.qualification_status || 'unqualified',
      source: lead.source || 'manual',
      icp_score: lead.icp_score || 0,
      estimated_value: lead.estimated_value || null,
      probability: lead.probability || 0,
      lead_tier: lead.lead_tier || '',
      notes: lead.notes || '',
    })
    setIsFormDialogOpen(true)
  }

  const handleSaveLead = async () => {
    try {
      if (isEditing && selectedLead) {
        await updateLead.mutateAsync({
          id: selectedLead.id,
          updates: formData as LeadUpdate,
        })
      } else {
        await createLead.mutateAsync(formData as LeadInsert)
      }
      setIsFormDialogOpen(false)
      setSelectedLead(null)
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    } catch (error: any) {
      alert(error.message || 'Failed to save lead')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#004565]/20 border-t-[#004565] mx-auto mb-4"></div>
          <p className="text-sm text-[#004565] font-medium">Loading leads...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between sticky top-0 z-40 bg-white shadow-sm pb-4">
          <div className="relative">
            <h1 className="text-4xl font-bold text-[#004565]">Leads</h1>
          </div>
        </div>
        <Card className="border-red-200/50 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <p className="text-red-600 mb-2 font-semibold">Error loading leads</p>
            <p className="text-sm text-[#000000]/80 mb-4">{error.message}</p>
            <p className="text-xs text-[#000000]/70">
              Please check your Supabase connection and ensure the database tables are set up correctly.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'default'
      case 'qualified':
        return 'success'
      case 'contract_review':
        return 'warning'
      case 'proposal':
        return 'secondary'
      case 'closed_won':
        return 'success'
      case 'closed_lost':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getQualificationColor = (status: string) => {
    switch (status) {
      case 'qualified':
        return 'success'
      case 'unqualified':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString()
  }

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead)
    setIsDialogOpen(true)
  }

  const handleStartSequence = (lead: Lead) => {
    setSelectedLeadIdsForSequence([lead.id])
    setSelectedLeadNamesForSequence([lead.name || lead.email || 'Lead'])
    setIsStartSequenceDialogOpen(true)
  }

  const handleSequenceStarted = () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] })
    queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
    setIsStartSequenceDialogOpen(false)
    setSelectedLeadIdsForSequence([])
    setSelectedLeadNamesForSequence([])
  }

  const parseJsonField = (field: unknown): string[] => {
    if (!field) return []
    if (Array.isArray(field)) {
      return field.filter(item => typeof item === 'string')
    }
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field)
        return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : []
      } catch {
        return [field]
      }
    }
    return []
  }

  const handleFetchLeads = async () => {
    setIsFetching(true)
    setFetchError(null)
    
    try {
      // Trigger webhook
      const response = await fetch('https://auto.lincolnwaste.co/webhook/66c0815f-ea55-4f27-a675-de1998b25a62', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Parse response body
      let responseData: any = null
      try {
        responseData = await response.json()
      } catch (e) {
        // If response is not JSON, try to get text
        const text = await response.text()
        responseData = { message: text || 'Unknown error occurred' }
      }

      // Check if response indicates an error (from n8n)
      if (!response.ok) {
        // HTTP error status
        const errorMessage = responseData?.error || responseData?.message || responseData?.errorMessage || `HTTP Error: ${response.status} ${response.statusText}`
        setFetchError(errorMessage)
        return
      }

      // Check if n8n returned an error in the response body (even with 200 status)
      if (responseData?.error || responseData?.success === false || responseData?.status === 'error') {
        const errorMessage = responseData?.error || responseData?.message || responseData?.errorMessage || 'No data available in the database'
        setFetchError(errorMessage)
        return
      }

      // Success - refresh leads data
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      
      // Show success message briefly
      setFetchError(null)
    } catch (error: any) {
      // Network or other errors
      const errorMessage = error?.message || 'Failed to connect to the webhook. Please try again later.'
      setFetchError(errorMessage)
      // eslint-disable-next-line no-console
      if (process.env.NODE_ENV === 'development') console.error('Error fetching leads:', error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleRefreshLeads = async () => {
    setIsRefreshing(true)
    try {
      // Directly refetch leads data from database
      await refetch()
    } catch (error) {
      // eslint-disable-next-line no-console
      if (process.env.NODE_ENV === 'development') console.error('Error refreshing leads:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleVerifyLeads = async () => {
    setIsVerifying(true)
    setVerifyError(null)
    
    try {
      // Trigger verify webhook
      const response = await fetch('https://auto.lincolnwaste.co/webhook/161b34a3-cba7-4e42-81b3-7ed47808be4f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Parse response body
      let responseData: any = null
      try {
        responseData = await response.json()
      } catch (e) {
        // If response is not JSON, try to get text
        const text = await response.text()
        responseData = { message: text || 'Unknown error occurred' }
      }

      // Check if response indicates an error (from n8n)
      if (!response.ok) {
        // HTTP error status
        const errorMessage = responseData?.error || responseData?.message || responseData?.errorMessage || `HTTP Error: ${response.status} ${response.statusText}`
        setVerifyError(errorMessage)
        return
      }

      // Check if n8n returned an error in the response body (even with 200 status)
      if (responseData?.error || responseData?.success === false || responseData?.status === 'error') {
        const errorMessage = responseData?.error || responseData?.message || responseData?.errorMessage || 'Failed to verify leads'
        setVerifyError(errorMessage)
        return
      }

      // Success - refresh leads data to show updated verification status
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      
      // Clear error on success
      setVerifyError(null)
    } catch (error: any) {
      // Network or other errors
      const errorMessage = error?.message || 'Failed to connect to the webhook. Please try again later.'
      setVerifyError(errorMessage)
      // eslint-disable-next-line no-console
      if (process.env.NODE_ENV === 'development') console.error('Error verifying leads:', error)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 z-40 bg-white shadow-sm pb-4">
        <div className="relative">
          <h1 className="text-4xl font-bold text-[#004565]">
            Leads
          </h1>
          <div className="absolute -top-2 -left-2 w-24 h-24 bg-[#376EE1]/20 rounded-full blur-2xl -z-10"></div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleOpenCreateDialog}
            className="bg-[#004565] hover:bg-[#004565]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
          <Button 
            onClick={handleRefreshLeads}
            disabled={isRefreshing || isLoading}
            variant="outline"
            className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10 hover:border-[#004565]/50 transition-all duration-300 disabled:opacity-50"
          >
            {isRefreshing ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-[#004565] border-t-transparent" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Leads
              </>
            )}
          </Button>
          <Button 
            onClick={handleVerifyLeads}
            disabled={isVerifying || isLoading}
            className="bg-[#00CD50] hover:bg-[#00CD50]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Verify Leads
              </>
            )}
          </Button>
          <Button 
            onClick={handleFetchLeads}
            disabled={isFetching}
            className="bg-[#004565] hover:bg-[#004565]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {isFetching ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Fetching...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Fetch Leads
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error message display */}
      {fetchError && (
        <Card className="border-red-200/50 shadow-lg bg-red-50/90 backdrop-blur-sm">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-600 font-semibold mb-1">Error Fetching Leads</p>
                <p className="text-sm text-red-700/80">{fetchError}</p>
              </div>
              <button
                onClick={() => setFetchError(null)}
                className="text-red-600 hover:text-red-800 transition-colors"
                aria-label="Dismiss error"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verify error message display */}
      {verifyError && (
        <Card className="border-red-200/50 shadow-lg bg-red-50/90 backdrop-blur-sm">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-600 font-semibold mb-1">Error Verifying Leads</p>
                <p className="text-sm text-red-700/80">{verifyError}</p>
              </div>
              <button
                onClick={() => setVerifyError(null)}
                className="text-red-600 hover:text-red-800 transition-colors"
                aria-label="Dismiss error"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {leads && leads.length > 0 ? (
        <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="flex flex-col h-[calc(100vh-280px)]">
              <div className="overflow-x-scroll overflow-y-auto flex-1">
                <table className="w-full">
                  <thead className="sticky top-0 z-30 bg-[#004565]/5">
                    <tr className="border-b bg-[#004565]/5">
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider cursor-pointer hover:bg-[#004565]/10 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          Name
                          <SortIcon columnKey="name" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider cursor-pointer hover:bg-[#004565]/10 transition-colors"
                        onClick={() => handleSort('company_name')}
                      >
                        <div className="flex items-center">
                          Company
                          <SortIcon columnKey="company_name" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider cursor-pointer hover:bg-[#004565]/10 transition-colors"
                        onClick={() => handleSort('title')}
                      >
                        <div className="flex items-center">
                          Title
                          <SortIcon columnKey="title" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider cursor-pointer hover:bg-[#004565]/10 transition-colors"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center">
                          Email
                          <SortIcon columnKey="email" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider cursor-pointer hover:bg-[#004565]/10 transition-colors"
                        onClick={() => handleSort('email_verification')}
                      >
                        <div className="flex items-center">
                          Email Status
                          <SortIcon columnKey="email_verification" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider cursor-pointer hover:bg-[#004565]/10 transition-colors"
                        onClick={() => handleSort('source')}
                      >
                        <div className="flex items-center">
                          Source
                          <SortIcon columnKey="source" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider cursor-pointer hover:bg-[#004565]/10 transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center">
                          Status
                          <SortIcon columnKey="status" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider cursor-pointer hover:bg-[#004565]/10 transition-colors"
                        onClick={() => handleSort('qualification_status')}
                      >
                        <div className="flex items-center">
                          Qualification
                          <SortIcon columnKey="qualification_status" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider cursor-pointer hover:bg-[#004565]/10 transition-colors"
                        onClick={() => handleSort('icp_score')}
                      >
                        <div className="flex items-center">
                          ICP Score
                          <SortIcon columnKey="icp_score" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider cursor-pointer hover:bg-[#004565]/10 transition-colors"
                        onClick={() => handleSort('estimated_value')}
                      >
                        <div className="flex items-center">
                          Value
                          <SortIcon columnKey="estimated_value" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider cursor-pointer hover:bg-[#004565]/10 transition-colors"
                        onClick={() => handleSort('probability')}
                      >
                        <div className="flex items-center">
                          Probability
                          <SortIcon columnKey="probability" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider cursor-pointer hover:bg-[#004565]/10 transition-colors"
                        onClick={() => handleSort('lead_tier')}
                      >
                        <div className="flex items-center">
                          Lead Tier
                          <SortIcon columnKey="lead_tier" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-[#004565] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#004565]/10">
                    {sortedLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-[#004565]/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#004565]/10 flex items-center justify-center">
                            <Target className="h-5 w-5 text-[#004565]" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-[#000000]">
                              {lead.name || `Lead #${lead.id.slice(0, 8)}`}
                            </div>
                            {lead.timeline_category && (
                              <div className="text-sm text-[#004565]/70">{lead.timeline_category}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.company_name ? (
                          <div className="flex items-center text-sm text-[#000000]">
                            <Building2 className="h-4 w-4 mr-2 text-[#004565]/60" />
                            {lead.company_name}
                          </div>
                        ) : (
                          <span className="text-sm text-[#004565]/50">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#000000]">{lead.title || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.email ? (
                          <div className="flex items-center text-sm text-[#000000]">
                            <Mail className="h-4 w-4 mr-2 text-[#004565]/60" />
                            <a
                              href={`mailto:${lead.email}`}
                              className="text-[#376EE1] hover:text-[#004565] hover:underline"
                            >
                              {lead.email}
                            </a>
                          </div>
                        ) : (
                          <span className="text-sm text-[#004565]/50">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.email ? (
                          lead.email_verification === true || lead.email_verification === 'verified' ? (
                            <Badge className="bg-[#00CD50] hover:bg-[#00CD50]/90 text-white border-0">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : lead.email_verification === false || lead.email_verification === 'unverified' ? (
                            <Badge variant="outline" className="border-red-300 text-red-600 bg-red-50">
                              <XCircle className="h-3 w-3 mr-1" />
                              Unverified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-gray-300 text-gray-600 bg-gray-50">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Unknown
                            </Badge>
                          )
                        ) : (
                          <span className="text-sm text-[#004565]/50">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#000000]">{lead.source || 'manual'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusColor(lead.status || 'new')}>
                          {lead.status || 'new'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getQualificationColor(lead.qualification_status || 'unqualified')}>
                          {lead.qualification_status || 'unqualified'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-[#000000]">
                          <TrendingUp className="h-4 w-4 mr-1 text-[#00CD50]" />
                          {lead.icp_score || 0}/100
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.estimated_value ? (
                          <div className="flex items-center text-sm font-medium text-[#000000]">
                            <DollarSign className="h-4 w-4 mr-1 text-[#00CD50]" />
                            ${Number(lead.estimated_value).toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-sm text-[#004565]/50">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#000000]">{lead.probability || 0}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.lead_tier ? (
                          <Badge variant="default">{lead.lead_tier}</Badge>
                        ) : (
                          <span className="text-sm text-[#004565]/50">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#004565] hover:text-[#004565]/80 hover:bg-[#004565]/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEditDialog(lead)
                            }}
                            title="Edit lead"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#00CD50] hover:text-[#00CD50]/80 hover:bg-[#00CD50]/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartSequence(lead)
                            }}
                            disabled={!lead.email}
                            title={!lead.email ? 'Email required to start sequence' : 'Start email sequence'}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-[#004565] hover:text-[#004565]/80 hover:bg-[#004565]/10"
                          onClick={() => handleViewLead(lead)}
                        >
                          View
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-[#004565]/10 flex items-center justify-center">
              <Target className="h-8 w-8 text-[#004565]" />
            </div>
            <p className="text-[#004565] font-medium mb-2">No leads found</p>
            <p className="text-[#004565]/70 text-sm mb-4">Create your first lead to get started.</p>
            <Link href="/dashboard/leads/new">
              <Button className="mt-4 bg-[#004565] hover:bg-[#004565]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                <Plus className="h-4 w-4 mr-2" />
                Create Lead
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Lead Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={() => setIsDialogOpen(false)} className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[#004565]" />
              {selectedLead?.name || `Lead #${selectedLead?.id.slice(0, 8)}`}
            </DialogTitle>
            <DialogDescription>
              {selectedLead?.company_name && (
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {selectedLead.company_name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-6 mt-4">
              {/* Pain Points */}
              <div className="border-b border-[#004565]/10 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-[#004565]" />
                  <h3 className="text-lg font-semibold text-[#004565]">Pain Points</h3>
                </div>
                {parseJsonField(selectedLead.pain_points).length > 0 ? (
                  <ul className="space-y-2">
                    {parseJsonField(selectedLead.pain_points).map((point, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-[#000000]">
                        <span className="text-[#004565] mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[#004565]/60 italic">No pain points recorded</p>
                )}
              </div>

              {/* Objections */}
              <div className="border-b border-[#004565]/10 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-5 w-5 text-[#004565]" />
                  <h3 className="text-lg font-semibold text-[#004565]">Objections</h3>
                </div>
                {parseJsonField(selectedLead.objections).length > 0 ? (
                  <ul className="space-y-2">
                    {parseJsonField(selectedLead.objections).map((objection, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-[#000000]">
                        <span className="text-[#004565] mt-1">•</span>
                        <span>{objection}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[#004565]/60 italic">No objections recorded</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-[#004565]" />
                  <h3 className="text-lg font-semibold text-[#004565]">Notes</h3>
                </div>
                {selectedLead.notes ? (
                  <div className="bg-[#004565]/5 rounded-lg p-4">
                    <p className="text-sm text-[#000000] whitespace-pre-wrap">{selectedLead.notes}</p>
                  </div>
                ) : (
                  <p className="text-sm text-[#004565]/60 italic">No notes recorded</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#004565]/10">
                <Button
                  onClick={() => {
                    setIsDialogOpen(false)
                    if (selectedLead) handleOpenEditDialog(selectedLead)
                  }}
                  variant="outline"
                  className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={() => handleStartSequence(selectedLead)}
                  disabled={!selectedLead.email}
                  className="bg-[#00CD50] hover:bg-[#00CD50]/90 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Email Sequence
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Lead Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Edit className="h-5 w-5 text-[#004565]" />
                  Edit Lead
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-[#004565]" />
                  Add New Lead
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update lead information' : 'Enter the details for the new lead'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-[#004565]">Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-[#004565]">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_name" className="text-[#004565]">Company</Label>
                <Input
                  id="company_name"
                  value={formData.company_name || ''}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Acme Corp"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="title" className="text-[#004565]">Title</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="CEO"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status" className="text-[#004565]">Status</Label>
                <select
                  id="status"
                  value={formData.status || 'new'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="new">New</option>
                  <option value="qualified">Qualified</option>
                  <option value="contract_review">Contract Review</option>
                  <option value="proposal">Proposal</option>
                  <option value="closed_won">Closed Won</option>
                  <option value="closed_lost">Closed Lost</option>
                </select>
              </div>
              <div>
                <Label htmlFor="qualification_status" className="text-[#004565]">Qualification</Label>
                <select
                  id="qualification_status"
                  value={formData.qualification_status || 'unqualified'}
                  onChange={(e) => setFormData({ ...formData, qualification_status: e.target.value as QualificationStatus })}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="unqualified">Unqualified</option>
                  <option value="qualified">Qualified</option>
                  <option value="disqualified">Disqualified</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="source" className="text-[#004565]">Source</Label>
                <Input
                  id="source"
                  value={formData.source || 'manual'}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="manual"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lead_tier" className="text-[#004565]">Lead Tier</Label>
                <Input
                  id="lead_tier"
                  value={formData.lead_tier || ''}
                  onChange={(e) => setFormData({ ...formData, lead_tier: e.target.value })}
                  placeholder="A, B, C"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="icp_score" className="text-[#004565]">ICP Score (0-100)</Label>
                <Input
                  id="icp_score"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.icp_score || 0}
                  onChange={(e) => setFormData({ ...formData, icp_score: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="estimated_value" className="text-[#004565]">Estimated Value</Label>
                <Input
                  id="estimated_value"
                  type="number"
                  min="0"
                  value={formData.estimated_value || ''}
                  onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="probability" className="text-[#004565]">Probability (0-100%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability || 0}
                  onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="text-[#004565]">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this lead..."
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#004565]/10">
              <Button
                variant="outline"
                onClick={() => setIsFormDialogOpen(false)}
                className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveLead}
                disabled={createLead.isPending || updateLead.isPending || !formData.name || !formData.email}
                className="bg-[#004565] hover:bg-[#004565]/90 text-white"
              >
                {createLead.isPending || updateLead.isPending ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    {isEditing ? 'Update Lead' : 'Create Lead'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Start Sequence Dialog */}
      {selectedLeadIdsForSequence.length > 0 && (
        <StartSequenceDialog
          leadIds={selectedLeadIdsForSequence}
          leadNames={selectedLeadNamesForSequence}
          open={isStartSequenceDialogOpen}
          onOpenChange={(open) => {
            setIsStartSequenceDialogOpen(open)
            if (!open) {
              setSelectedLeadIdsForSequence([])
              setSelectedLeadNamesForSequence([])
            }
          }}
          onSuccess={handleSequenceStarted}
        />
      )}
    </div>
  )
}

