'use client'

import { useState } from 'react'
import { useLeads } from '@/lib/hooks/useLeads'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import Link from 'next/link'
import { Target, Download, Mail, Building2, ArrowRight, DollarSign, TrendingUp, AlertCircle, MessageSquare, FileText, RefreshCw, CheckCircle2, XCircle, ShieldCheck, Plus } from 'lucide-react'
import { Database } from '@/lib/supabase/types'

type Lead = Database['public']['Tables']['leads']['Row']

export default function LeadsPage() {
  const { data: leads, isLoading, error, refetch } = useLeads()
  const queryClient = useQueryClient()
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)

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
        <div className="flex items-center justify-between">
          <div className="relative">
            <h1 className="text-4xl font-bold text-[#004565]">Leads</h1>
            <p className="text-[#004565]/80 mt-2 font-medium">Manage your sales leads</p>
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
      <div className="flex items-center justify-between">
        <div className="relative">
          <h1 className="text-4xl font-bold text-[#004565]">
            Leads
          </h1>
          <p className="text-[#004565]/80 mt-2 font-medium">Manage your sales leads</p>
          <div className="absolute -top-2 -left-2 w-24 h-24 bg-[#376EE1]/20 rounded-full blur-2xl -z-10"></div>
        </div>
        <div className="flex gap-3">
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-[#004565]/5">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider">
                      Email Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider">
                      Qualification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider">
                      ICP Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider">
                      Probability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider">
                      Lead Tier
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-[#004565] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#004565]/10">
                  {leads.map((lead) => (
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
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-[#004565] hover:text-[#004565]/80 hover:bg-[#004565]/10"
                          onClick={() => handleViewLead(lead)}
                        >
                          View
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

