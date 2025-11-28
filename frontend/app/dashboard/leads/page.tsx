'use client'

import { useLeads } from '@/lib/hooks/useLeads'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Target, Plus } from 'lucide-react'

export default function LeadsPage() {
  const { data: leads, isLoading, error } = useLeads()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading leads...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
            <p className="text-gray-600 mt-1">Manage your sales leads</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600 mb-2">Error loading leads</p>
            <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
            <p className="text-xs text-muted-foreground">
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-1">Manage your sales leads</p>
        </div>
        <Link href="/dashboard/leads/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {leads?.map((lead) => (
          <Card key={lead.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Lead #{lead.id.slice(0, 8)}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant={getStatusColor(lead.status)}>{lead.status}</Badge>
                  {lead.qualification_status === 'qualified' && (
                    <Badge variant="success">Qualified</Badge>
                  )}
                </div>
              </div>
              <CardDescription>
                {lead.source} • {lead.timeline_category || 'No timeline'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Value:</span>
                  <span className="font-medium">
                    {lead.estimated_value ? `$${Number(lead.estimated_value).toLocaleString()}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Probability:</span>
                  <span className="font-medium">{lead.probability}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ICP Score:</span>
                  <span className="font-medium">{lead.icp_score}/100</span>
                </div>
                <Link href={`/dashboard/leads/${lead.id}`}>
                  <Button variant="outline" className="w-full mt-4">
                    View Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {leads?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No leads found. Create your first lead to get started.</p>
            <Link href="/dashboard/leads/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Lead
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

