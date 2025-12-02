'use client'

import { useState } from 'react'
import { useCompanies } from '@/lib/hooks/useCompanies'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import Link from 'next/link'
import { Building2, Plus, MapPin, Users, DollarSign, Globe, Linkedin, Facebook, Twitter, FileText } from 'lucide-react'
import { Database } from '@/lib/supabase/types'

type Company = Database['public']['Tables']['companies']['Row']

export default function CompaniesPage() {
  const { data: companies, isLoading, error } = useCompanies()
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleViewDetails = (company: Company) => {
    setSelectedCompany(company)
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#004565]/20 border-t-[#004565] mx-auto mb-4"></div>
          <p className="text-sm text-[#004565] font-medium">Loading companies...</p>
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
        <div className="relative">
          <h1 className="text-4xl font-bold text-[#004565]">
            Companies
          </h1>
          <p className="text-[#004565]/80 mt-2 font-medium">Manage your company accounts</p>
          <div className="absolute -top-2 -left-2 w-24 h-24 bg-[#376EE1]/20 rounded-full blur-2xl -z-10"></div>
        </div>
        <Link href="/dashboard/companies/new">
          <Button className="bg-[#004565] hover:bg-[#004565]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <Plus className="h-4 w-4 mr-2" />
            New Company
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies?.map((company) => (
          <Card key={company.id} className="border-[#004565]/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/90 backdrop-blur-sm">
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
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => handleViewDetails(company)}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {companies?.length === 0 && (
        <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-[#004565]/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-[#004565]" />
            </div>
            <p className="text-[#004565] font-medium mb-2">No companies found</p>
            <p className="text-[#004565]/70 text-sm mb-4">Create your first company to get started.</p>
            <Link href="/dashboard/companies/new">
              <Button className="mt-4 bg-[#004565] hover:bg-[#004565]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                <Plus className="h-4 w-4 mr-2" />
                Create Company
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Company Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={() => setIsDialogOpen(false)} className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#004565]" />
              {selectedCompany?.name || 'Company Details'}
            </DialogTitle>
            <DialogDescription>
              {selectedCompany?.industry_type && (
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {selectedCompany.industry_type}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedCompany && (
            <div className="space-y-6 mt-4">
              {/* Location Count */}
              <div className="border-b border-[#004565]/10 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-[#004565]" />
                  <h3 className="text-lg font-semibold text-[#004565]">Location Count</h3>
                </div>
                <p className="text-sm text-[#000000]">
                  {selectedCompany.location_count !== null && selectedCompany.location_count !== undefined
                    ? selectedCompany.location_count.toLocaleString()
                    : 'N/A'}
                </p>
              </div>

              {/* Employee Count */}
              <div className="border-b border-[#004565]/10 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-[#004565]" />
                  <h3 className="text-lg font-semibold text-[#004565]">Employee Count</h3>
                </div>
                <p className="text-sm text-[#000000]">
                  {selectedCompany.employee_count !== null && selectedCompany.employee_count !== undefined
                    ? selectedCompany.employee_count.toLocaleString()
                    : 'N/A'}
                </p>
              </div>

              {/* Revenue Range */}
              <div className="border-b border-[#004565]/10 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-[#004565]" />
                  <h3 className="text-lg font-semibold text-[#004565]">Revenue Range</h3>
                </div>
                <p className="text-sm text-[#000000]">
                  {selectedCompany.revenue_range || 'N/A'}
                </p>
              </div>

              {/* Website */}
              <div className="border-b border-[#004565]/10 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-5 w-5 text-[#004565]" />
                  <h3 className="text-lg font-semibold text-[#004565]">Website</h3>
                </div>
                {selectedCompany.website ? (
                  <a
                    href={selectedCompany.website.startsWith('http') ? selectedCompany.website : `https://${selectedCompany.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#376EE1] hover:text-[#004565] hover:underline"
                  >
                    {selectedCompany.website}
                  </a>
                ) : (
                  <p className="text-sm text-[#004565]/60 italic">N/A</p>
                )}
              </div>

              {/* LinkedIn URL */}
              <div className="border-b border-[#004565]/10 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Linkedin className="h-5 w-5 text-[#004565]" />
                  <h3 className="text-lg font-semibold text-[#004565]">LinkedIn</h3>
                </div>
                {(selectedCompany as any).linkedin_url ? (
                  <a
                    href={(selectedCompany as any).linkedin_url.startsWith('http') ? (selectedCompany as any).linkedin_url : `https://${(selectedCompany as any).linkedin_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#376EE1] hover:text-[#004565] hover:underline"
                  >
                    {(selectedCompany as any).linkedin_url}
                  </a>
                ) : (
                  <p className="text-sm text-[#004565]/60 italic">N/A</p>
                )}
              </div>

              {/* Facebook URL */}
              <div className="border-b border-[#004565]/10 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Facebook className="h-5 w-5 text-[#004565]" />
                  <h3 className="text-lg font-semibold text-[#004565]">Facebook</h3>
                </div>
                {(selectedCompany as any).facebook_url ? (
                  <a
                    href={(selectedCompany as any).facebook_url.startsWith('http') ? (selectedCompany as any).facebook_url : `https://${(selectedCompany as any).facebook_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#376EE1] hover:text-[#004565] hover:underline"
                  >
                    {(selectedCompany as any).facebook_url}
                  </a>
                ) : (
                  <p className="text-sm text-[#004565]/60 italic">N/A</p>
                )}
              </div>

              {/* Twitter URL */}
              <div className="border-b border-[#004565]/10 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Twitter className="h-5 w-5 text-[#004565]" />
                  <h3 className="text-lg font-semibold text-[#004565]">Twitter</h3>
                </div>
                {(selectedCompany as any).twitter_url ? (
                  <a
                    href={(selectedCompany as any).twitter_url.startsWith('http') ? (selectedCompany as any).twitter_url : `https://${(selectedCompany as any).twitter_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#376EE1] hover:text-[#004565] hover:underline"
                  >
                    {(selectedCompany as any).twitter_url}
                  </a>
                ) : (
                  <p className="text-sm text-[#004565]/60 italic">N/A</p>
                )}
              </div>

              {/* Address */}
              <div className="border-b border-[#004565]/10 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-[#004565]" />
                  <h3 className="text-lg font-semibold text-[#004565]">Address</h3>
                </div>
                <p className="text-sm text-[#000000] whitespace-pre-wrap">
                  {(selectedCompany as any).address || 'N/A'}
                </p>
              </div>

              {/* Short Description */}
              <div className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-[#004565]" />
                  <h3 className="text-lg font-semibold text-[#004565]">Short Description</h3>
                </div>
                <p className="text-sm text-[#000000] whitespace-pre-wrap">
                  {(selectedCompany as any).short_description || 'N/A'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

