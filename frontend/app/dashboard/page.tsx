'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Building2, TrendingUp, DollarSign, AlertCircle } from 'lucide-react'
import { useDashboardMetrics } from '@/lib/hooks/useAnalytics'
import { checkSupabaseConfig } from '@/lib/supabase/client'

export default function DashboardPage() {
  const { data: metrics, isLoading, error } = useDashboardMetrics()
  const configCheck = checkSupabaseConfig()

  // Handle error state gracefully
  if (error) {
    console.error('Dashboard metrics error:', error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to your CRM dashboard</p>
      </div>

      {/* Configuration Warning */}
      {!configCheck.configured && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Supabase Not Configured
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Please configure your Supabase connection to enable full functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-yellow-800">
                {configCheck.error?.message || 'Missing Supabase environment variables'}
              </p>
              <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1">
                <li>Create a <code className="bg-yellow-100 px-1 rounded">.env.local</code> file in the frontend directory</li>
                <li>Add <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
                <li>Restart your development server after adding the variables</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : error ? 'Error' : metrics?.totalLeads || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {error ? 'Failed to load' : 'Total leads'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : error ? 'Error' : metrics?.qualifiedLeads || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {error ? 'Failed to load' : 'ICP qualified'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : error ? 'Error' : metrics?.totalCompanies || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {error ? 'Failed to load' : 'Active companies'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : error ? 'Error' : `$${Number(metrics?.pipelineValue || 0).toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {error ? 'Failed to load' : 'Total estimated value'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest interactions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Connection Error</CardTitle>
            <CardDescription className="text-red-700">
              Unable to connect to Supabase database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-red-800">
                {error.message || 'Please check your Supabase configuration'}
              </p>
              <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
                <li>Verify your .env.local file has correct Supabase credentials</li>
                <li>Ensure database tables are created (run supabase-schema.sql)</li>
                <li>Check Supabase project is active and accessible</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

