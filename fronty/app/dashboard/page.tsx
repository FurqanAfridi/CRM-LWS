'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Building2, TrendingUp, DollarSign } from 'lucide-react'
import { useDashboardMetrics } from '@/lib/hooks/useAnalytics'

export default function DashboardPage() {
  const { data: metrics, isLoading, error } = useDashboardMetrics()

  return (
    <div className="space-y-6">
      <div className="relative">
        <h1 className="text-4xl font-bold text-[#004565]">
          Dashboard
        </h1>
        <p className="text-[#004565]/80 mt-2 font-medium">Welcome to your CRM dashboard</p>
        <div className="absolute -top-2 -left-2 w-32 h-32 bg-[#376EE1]/20 rounded-full blur-2xl -z-10"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[#004565]/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/90 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#000000]">Total Leads</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-[#376EE1]/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-[#376EE1]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#004565]">
              {isLoading ? '...' : error ? 'Error' : metrics?.totalLeads || 0}
            </div>
            <p className="text-xs text-[#004565]/70 mt-1">
              {error ? 'Failed to load' : 'Total leads'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#004565]/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/90 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#000000]">Qualified Leads</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-[#00CD50]/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-[#00CD50]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#004565]">
              {isLoading ? '...' : error ? 'Error' : metrics?.qualifiedLeads || 0}
            </div>
            <p className="text-xs text-[#004565]/70 mt-1">
              {error ? 'Failed to load' : 'ICP qualified'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#004565]/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/90 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#000000]">Companies</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-[#376EE1]/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-[#376EE1]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#004565]">
              {isLoading ? '...' : error ? 'Error' : metrics?.totalCompanies || 0}
            </div>
            <p className="text-xs text-[#004565]/70 mt-1">
              {error ? 'Failed to load' : 'Active companies'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#004565]/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/90 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#000000]">Pipeline Value</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-[#00FF00]/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-[#00CD50]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#004565]">
              {isLoading ? '...' : error ? 'Error' : `$${Number(metrics?.pipelineValue || 0).toLocaleString()}`}
            </div>
            <p className="text-xs text-[#004565]/70 mt-1">
              {error ? 'Failed to load' : 'Total estimated value'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader className="border-b border-[#004565]/10">
          <CardTitle className="text-[#004565]">Recent Activity</CardTitle>
          <CardDescription className="text-[#004565]/70">Latest interactions and updates</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-[#004565]/70">No recent activity</p>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200/50 bg-red-50/90 backdrop-blur-sm shadow-lg">
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

