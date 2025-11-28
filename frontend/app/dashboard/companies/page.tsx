'use client'

import { useCompanies } from '@/lib/hooks/useCompanies'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Building2, Plus } from 'lucide-react'

export default function CompaniesPage() {
  const { data: companies, isLoading, error } = useCompanies()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading companies...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
            <p className="text-gray-600 mt-1">Manage your company accounts</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600 mb-2">Error loading companies</p>
            <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
            <p className="text-xs text-muted-foreground">
              Please check your Supabase connection and ensure the database tables are set up correctly.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600 mt-1">Manage your company accounts</p>
        </div>
        <Link href="/dashboard/companies/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Company
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies?.map((company) => (
          <Card key={company.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {company.name}
                </CardTitle>
                {company.icp_qualified && (
                  <Badge variant="success">ICP Qualified</Badge>
                )}
              </div>
              <CardDescription>
                {company.industry_type} • {company.location_count || 0} locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ICP Score:</span>
                  <span className="font-medium">{company.icp_score}/100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Employees:</span>
                  <span className="font-medium">{company.employee_count?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Revenue:</span>
                  <span className="font-medium">{company.revenue_range || 'N/A'}</span>
                </div>
                <Link href={`/dashboard/companies/${company.id}`}>
                  <Button variant="outline" className="w-full mt-4">
                    View Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {companies?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No companies found. Create your first company to get started.</p>
            <Link href="/dashboard/companies/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Company
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

