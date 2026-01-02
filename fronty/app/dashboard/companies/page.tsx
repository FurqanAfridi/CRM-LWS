'use client'

import { useState, useEffect, useRef } from 'react'
import { useCompanies } from '@/lib/hooks/useCompanies'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import {
  Building2, Plus, MapPin, Users, DollarSign, Globe, Linkedin, Facebook, Twitter,
  FileText, Loader2, LayoutGrid, List, Upload, Ban, CheckCircle2, MoreHorizontal
} from 'lucide-react'
import { Database } from '@/lib/supabase/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Company = Database['public']['Tables']['companies']['Row']

// Sortable Header Component
function SortableHeader({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'move',
    zIndex: transform ? 1 : 0,
  }

  return (
    <th
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider cursor-move bg-white relative group touch-none border-b border-[#004565]/10 whitespace-nowrap select-none"
    >
      <div className="flex items-center gap-2">
        {children}
      </div>
    </th>
  )
}

export default function CompaniesPage() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useCompanies()

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDncDialogOpen, setIsDncDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const scrollTriggerRef = useRef<HTMLDivElement>(null)
  const scrollTriggerRowRef = useRef<HTMLTableRowElement>(null)
  const bottomSentinelRef = useRef<HTMLDivElement>(null)

  // Flatten pages into a single array
  const companies = data?.pages.flat() || []

  // Column definitions for List View
  const allColumns = {
    hash: { label: '#' },
    name: { label: 'Company Name' },
    location_count: { label: 'Location Count' },
    address: { label: 'Address' },
    icp_score: { label: 'ICP Score' },
    employee_count: { label: 'Employees' },
    revenue_range: { label: 'Revenue' },
    website: { label: 'Website' },
    linkedin_url: { label: 'LinkedIn' },
    facebook_url: { label: 'Facebook' },
    twitter_url: { label: 'Twitter' },
    short_description: { label: 'Description' },
    actions: { label: 'Actions' },
  }

  const [columnOrder, setColumnOrder] = useState<string[]>([
    'hash', 'name', 'location_count', 'address', 'icp_score',
    'employee_count', 'revenue_range', 'website', 'linkedin_url',
    'facebook_url', 'twitter_url', 'short_description', 'actions'
  ])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(entry => entry.isIntersecting) && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    if (scrollTriggerRef.current) observer.observe(scrollTriggerRef.current)
    if (scrollTriggerRowRef.current) observer.observe(scrollTriggerRowRef.current)
    if (bottomSentinelRef.current) observer.observe(bottomSentinelRef.current)

    return () => observer.disconnect()
  }, [hasNextPage, fetchNextPage, isFetchingNextPage, companies.length, viewMode])

  const handleViewDetails = (company: Company) => {
    setSelectedCompany(company)
    setIsDialogOpen(true)
  }

  const handleMarkDNC = (company: Company | null) => {
    // This would be replaced by actual API call
    if (company) {
      alert(`Marked ${company.name} as DNC (Do Not Contact)`)
    } else {
      alert('DNC List uploaded successfully (Simulation)')
      setIsDncDialogOpen(false)
    }
  }

  const renderCell = (columnId: string, company: Company, index: number) => {
    switch (columnId) {
      case 'hash':
        return <span className="text-[#004565]/70 font-mono text-xs">{index + 1}</span>
      case 'name':
        return (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#004565]/50" />
            <span className="font-medium text-[#004565]">{company.name}</span>
            {company.icp_qualified && (
              <Badge variant="outline" className="ml-2 text-[10px] h-5 border-green-500 text-green-700 bg-green-50">ICP</Badge>
            )}
          </div>
        )
      case 'location_count':
        return <span className="text-sm">{company.location_count || 0}</span>
      case 'address':
        return <span className="text-sm truncate max-w-[200px] block" title={company.address || ''}>{company.address || '—'}</span>
      case 'icp_score':
        return <Badge variant={company.icp_score > 70 ? 'success' : 'secondary'}>{company.icp_score}</Badge>
      case 'employee_count':
        return <span className="text-sm">{company.employee_count?.toLocaleString() || '—'}</span>
      case 'revenue_range':
        return <span className="text-sm">{company.revenue_range || '—'}</span>
      case 'website':
        return company.website ? (
          <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            <Globe className="h-4 w-4" />
          </a>
        ) : <span className="text-gray-300">-</span>
      case 'linkedin_url':
        return company.linkedin_url ? (
          <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800">
            <Linkedin className="h-4 w-4" />
          </a>
        ) : <span className="text-gray-300">-</span>
      case 'facebook_url':
        return company.facebook_url ? (
          <a href={company.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
            <Facebook className="h-4 w-4" />
          </a>
        ) : <span className="text-gray-300">-</span>
      case 'twitter_url':
        return company.twitter_url ? (
          <a href={company.twitter_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-500">
            <Twitter className="h-4 w-4" />
          </a>
        ) : <span className="text-gray-300">-</span>
      case 'short_description':
        return <span className="text-sm truncate max-w-[200px] block text-gray-500" title={company.short_description || ''}>{company.short_description || '—'}</span>
      case 'actions':
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleViewDetails(company)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMarkDNC(company)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                <Ban className="h-4 w-4 mr-2" />
                Mark as DNC
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      default:
        return null
    }
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
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div className="relative">
          <h1 className="text-4xl font-bold text-[#004565] flex items-baseline gap-3">
            Companies
            <div className="flex items-center">
              <span className="text-2xl text-[#004565]/60 font-medium">
                ({companies.length})
              </span>
              <span className="ml-2 text-sm text-[#004565]/40 font-normal">
                Total Companies
              </span>
            </div>
          </h1>
          <p className="text-[#004565]/80 mt-2 font-medium">Manage your company accounts</p>
          <div className="absolute -top-2 -left-2 w-24 h-24 bg-[#376EE1]/20 rounded-full blur-2xl -z-10"></div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="bg-white/50 p-1 rounded-lg border border-[#004565]/10 flex items-center mr-2">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-[#004565] text-white hover:bg-[#004565]/90' : 'text-[#004565]'}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-[#004565] text-white hover:bg-[#004565]/90' : 'text-[#004565]'}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => setIsDncDialogOpen(true)}
            className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          >
            <Ban className="h-4 w-4 mr-2" />
            DNC List
          </Button>

          <Link href="/dashboard/companies/new">
            <Button className="bg-[#004565] hover:bg-[#004565]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus className="h-4 w-4 mr-2" />
              New Company
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0">
        {viewMode === 'grid' ? (
          /* Grid View */
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 -mx-1 px-1">
              {companies.map((company, index) => {
                const isTriggerItem = index === companies.length - 10
                return (
                  <div key={company.id} ref={isTriggerItem ? scrollTriggerRef : null} className="contents">
                    <Card className="border-[#004565]/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/90 backdrop-blur-sm">
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
                          <div className="flex gap-2 mt-4">
                            <Button variant="outline" className="flex-1" onClick={() => handleViewDetails(company)}>
                              View
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleMarkDNC(company)} className="text-red-400 hover:text-red-600 hover:bg-red-50" title="Mark as DNC">
                              <Ban className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>

            {/* Loading sentinel / Footer for Grid View */}
            <div ref={bottomSentinelRef} className="py-4 flex justify-center w-full flex-shrink-0">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-[#004565]/60">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm font-medium">Loading more companies...</span>
                </div>
              )}
              {!hasNextPage && companies.length > 0 && (
                <p className="text-[#004565]/50 text-sm font-medium italic">
                  No more companies to load
                </p>
              )}
            </div>
          </>
        ) : (
          /* List View */
          <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden flex flex-col h-full max-h-[calc(100vh-250px)]">
            <div className="overflow-x-auto overflow-y-auto flex-1 relative" id="list-scroll-container">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <table className="w-full relative border-collapse">
                  <thead className="sticky top-0 z-20 shadow-sm">
                    <tr className="bg-white border-b border-[#004565]/20">
                      <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                        {columnOrder.map((columnId) => (
                          <SortableHeader key={columnId} id={columnId}>
                            {allColumns[columnId as keyof typeof allColumns].label}
                          </SortableHeader>
                        ))}
                      </SortableContext>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#004565]/10 bg-white/50">
                    {companies.map((company, index) => {
                      const isTriggerItem = index === companies.length - 10
                      return (
                        <tr
                          key={company.id}
                          ref={isTriggerItem && viewMode === 'list' ? scrollTriggerRowRef : null}
                          className="hover:bg-[#004565]/5 transition-colors"
                        >
                          {columnOrder.map(columnId => (
                            <td key={columnId} className="px-6 py-4 whitespace-nowrap">
                              {renderCell(columnId, company, index)}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </DndContext>

              {/* Loading sentinel / Footer for List View */}
              <div ref={bottomSentinelRef} className="py-4 flex justify-center w-full">
                {isFetchingNextPage && (
                  <div className="flex items-center gap-2 text-[#004565]/60">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm font-medium">Loading more companies...</span>
                  </div>
                )}
                {!hasNextPage && companies.length > 0 && (
                  <p className="text-[#004565]/50 text-sm font-medium italic">
                    No more companies to load
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Company Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#004565]" />
              {selectedCompany?.name}
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
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-[#004565]">Location Count</Label>
                  <div className="text-sm">{selectedCompany.location_count || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-[#004565]">Employee Count</Label>
                  <div className="text-sm">{selectedCompany.employee_count?.toLocaleString() || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-[#004565]">Revenue</Label>
                  <div className="text-sm">{selectedCompany.revenue_range || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-[#004565]">Website</Label>
                  <div className="text-sm text-blue-600 truncate">{selectedCompany.website || 'N/A'}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-[#004565]">Address</Label>
                  <div className="text-sm">{selectedCompany.address || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-[#004565]">Social Media</Label>
                  <div className="flex gap-2 mt-1">
                    {selectedCompany.linkedin_url && <Linkedin className="h-4 w-4 text-blue-700" />}
                    {selectedCompany.facebook_url && <Facebook className="h-4 w-4 text-blue-600" />}
                    {selectedCompany.twitter_url && <Twitter className="h-4 w-4 text-blue-400" />}
                  </div>
                </div>
                <div>
                  <Label className="text-[#004565]">ICP Score</Label>
                  <Badge>{selectedCompany.icp_score}</Badge>
                </div>
              </div>
              <div className="col-span-2">
                <Label className="text-[#004565]">Description</Label>
                <p className="text-sm text-gray-600 mt-1">{selectedCompany.short_description || 'No description available.'}</p>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="destructive" onClick={() => handleMarkDNC(selectedCompany)}>
              <Ban className="h-4 w-4 mr-2" />
              Mark as DNC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload DNC List Dialog */}
      <Dialog open={isDncDialogOpen} onOpenChange={setIsDncDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload DNC List</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file containing companies or contacts to exclude from outreach.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer">
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-400 mt-1">CSV, XLS, XLSX up to 10MB</p>
              <Input type="file" className="hidden" />
            </div>
            <div className="space-y-2">
              <Label>Or add manually</Label>
              <Input placeholder="Enter email or domain to block..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDncDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => handleMarkDNC(null)}>Process List</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
