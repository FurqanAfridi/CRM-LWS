'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useCompanies, useCompaniesCount } from '@/lib/hooks/useCompanies'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import {
  Building2, Plus, MapPin, Users, DollarSign, Globe, Linkedin, Facebook, Twitter,
  FileText, Loader2, LayoutGrid, List, Upload, Ban, CheckCircle2, MoreHorizontal,
  Search, ArrowUp, ArrowDown
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
function SortableHeader({ id, children, onClick }: { id: string; children: React.ReactNode; onClick?: () => void }) {
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
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {children}
      </div>
    </th>
  )
}

export default function CompaniesPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const hasLoadedData = useRef(false)

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [searchTerm])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    error
  } = useCompanies({ search: debouncedSearch, exclude_dnc: true }) // Always exclude DNC companies

  // Track if we've ever loaded data
  useEffect(() => {
    if (data && data.pages.length > 0) {
      hasLoadedData.current = true
    }
  }, [data])

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDncDialogOpen, setIsDncDialogOpen] = useState(false)
  const [isDncConfirmOpen, setIsDncConfirmOpen] = useState(false)
  const [isSubmittingDNC, setIsSubmittingDNC] = useState(false)
  const [dncReasonInput, setDncReasonInput] = useState('')
  const [companyToMarkDNC, setCompanyToMarkDNC] = useState<Company | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const scrollTriggerRef = useRef<HTMLDivElement>(null)
  const scrollTriggerRowRef = useRef<HTMLTableRowElement>(null)
  const bottomSentinelRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const { data: totalCount, isLoading: isCountLoading } = useCompaniesCount()

  // Flatten pages into a single array
  const allCompanies = data?.pages.flat() || []

  // Client-side sorting only (search is now server-side)
  const companies = !sortConfig
    ? allCompanies
    : [...allCompanies].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key]
      const bValue = (b as any)[sortConfig.key]

      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()
      return sortConfig.direction === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr)
    })

  // Handle manual DNC Add
  const [dncInput, setDncInput] = useState('')

  const handleManualDNCSubmit = () => {
    if (!dncInput) return;
    toast.success(`Successfully added ${dncInput} to DNC list`)
    setDncInput('')
    setIsDncDialogOpen(false)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]

      if (validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setUploadedFile(file)
      } else {
        toast.error('Please upload a CSV or Excel file')
      }
    }
  }

  const handleBulkUpload = async () => {
    if (!uploadedFile) {
      toast.error('Please select a file to upload')
      return
    }

    // For now, show a simulation message
    // In a real implementation, you would:
    // 1. Parse the CSV/Excel file
    // 2. Send the data to an API endpoint
    // 3. Process the bulk upload on the backend
    toast.info(`File "${uploadedFile.name}" ready for processing`, {
      description: 'This feature requires backend implementation to parse and process the file.'
    })
    setUploadedFile(null)
    setIsDncDialogOpen(false)
  }

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

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

  // Column definitions for List View
  const allColumns = {
    hash: { label: '#' },
    name: { label: 'Company Name' },
    // location_count: { label: 'Location Count' },
    address: { label: 'Address' },
    icp_score: { label: 'ICP Score' },
    // employee_count: { label: 'Employees' },
    // revenue_range: { label: 'Revenue' },
    website: { label: 'Website' },
    linkedin_url: { label: 'LinkedIn' },
    facebook_url: { label: 'Facebook' },
    twitter_url: { label: 'Twitter' },
    short_description: { label: 'Description' },
    actions: { label: 'Actions' },
  }

  const [columnOrder, setColumnOrder] = useState<string[]>([
    'hash', 'name', 'address', // 'icp_score',
    'website', 'linkedin_url',
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
    if (!company) {
      alert('DNC List uploaded successfully (Simulation)')
      setIsDncDialogOpen(false)
      return
    }

    setCompanyToMarkDNC(company)
    setDncReasonInput('')
    setIsDncConfirmOpen(true)
  }

  const confirmMarkDNC = async () => {
    if (!companyToMarkDNC) return

    const isDNC = !companyToMarkDNC.is_dnc
    const reason = isDNC ? (dncReasonInput || 'Marked as DNC') : null

    setIsSubmittingDNC(true)
    try {
      const response = await fetch(`/api/companies/${companyToMarkDNC.id}/dnc`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_dnc: isDNC,
          dnc_reason: reason
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update DNC status')
      }

      // Invalidate queries to refetch fresh data
      await queryClient.invalidateQueries({ queryKey: ['companies'] })

      // Close dialog
      setIsDncConfirmOpen(false)
      setCompanyToMarkDNC(null)
      setDncReasonInput('')
    } catch (error) {
      console.error('Error updating DNC status:', error)
      toast.error('Failed to update DNC status. Please try again.')
    } finally {
      setIsSubmittingDNC(false)
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
            {company.is_dnc && (
              <Badge variant="outline" className="ml-2 text-[10px] h-5 border-red-500 text-red-700 bg-red-50">DNC</Badge>
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

  // Only show full-page loading on initial load (before any data has been loaded)
  if (isLoading && !hasLoadedData.current) {
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
                ({debouncedSearch ? companies.length : (totalCount || companies.length)})
              </span>
              <span className="ml-2 text-sm text-[#004565]/40 font-normal">
                {debouncedSearch ? 'Search Results' : 'Total Companies'}
              </span>
            </div>
          </h1>
          {/* <p className="text-[#004565]/80 mt-2 font-medium">Manage your company accounts</p> */}
          <div className="absolute -top-2 -left-2 w-24 h-24 bg-[#376EE1]/20 rounded-full blur-2xl -z-10"></div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Bar */}
          <div className="relative mr-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#004565]/50" />
            <Input
              placeholder="Lookup company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-24 w-[250px] bg-white/80 border-[#004565]/20 focus:border-[#004565] focus:ring-[#004565]"
            />
            {searchTerm && searchTerm !== debouncedSearch && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-[#004565]/60 font-medium">
                Loading...
              </span>
            )}
          </div>

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
                          <div className="flex flex-col gap-1">
                            {company.icp_qualified && (
                              <Badge variant="success">ICP Qualified</Badge>
                            )}
                            {company.is_dnc && (
                              <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">DNC</Badge>
                            )}
                          </div>
                        </div>
                        <CardDescription>
                          {company.industry_type}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {/* <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">ICP Score:</span>
                            <span className="font-medium">{company.icp_score}/100</span>
                          </div> */}
                          {/* <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Employees:</span>
                            <span className="font-medium">{company.employee_count?.toLocaleString() || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Revenue:</span>
                            <span className="font-medium">{company.revenue_range || 'N/A'}</span>
                          </div> */}
                          <div className="flex gap-2 mt-4">
                            <Button variant="outline" className="flex-1" onClick={() => handleViewDetails(company)}>
                              View
                            </Button>
                            <Button
                              variant={company.is_dnc ? "destructive" : "ghost"}
                              size="icon"
                              onClick={() => handleMarkDNC(company)}
                              className={company.is_dnc ? "bg-red-600 hover:bg-red-700" : "text-red-400 hover:text-red-600 hover:bg-red-50"}
                              title={company.is_dnc ? "Remove from DNC" : "Mark as DNC"}
                            >
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
                          <SortableHeader key={columnId} id={columnId} onClick={() => handleSort(columnId)}>
                            <div className="flex items-center">
                              {allColumns[columnId as keyof typeof allColumns].label}
                              <SortIcon columnKey={columnId} />
                            </div>
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
                {/* <div>
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
                </div> */}
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
                {/* <div>
                  <Label className="text-[#004565]">ICP Score</Label>
                  <Badge>{selectedCompany.icp_score}</Badge>
                </div> */}
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
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragging
                ? 'border-[#004565] bg-[#004565]/5'
                : uploadedFile
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:bg-gray-50'
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className={`h-10 w-10 mx-auto mb-2 ${uploadedFile ? 'text-green-600' : 'text-gray-400'}`} />
              {uploadedFile ? (
                <>
                  <p className="text-sm text-green-700 font-medium">{uploadedFile.name}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {(uploadedFile.size / 1024).toFixed(2)} KB - Click to change
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">CSV, XLS, XLSX up to 10MB</p>
                </>
              )}
              <Input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileSelect}
              />
            </div>
            <div className="space-y-2">
              <Label>Or add manually</Label>
              <Input
                placeholder="Enter email or domain to block..."
                value={dncInput}
                onChange={(e) => setDncInput(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDncDialogOpen(false)
              setUploadedFile(null)
            }}>Cancel</Button>
            <Button onClick={uploadedFile ? handleBulkUpload : handleManualDNCSubmit}>
              {uploadedFile ? 'Process File' : 'Add Manually'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DNC Confirmation Dialog */}
      <Dialog open={isDncConfirmOpen} onOpenChange={setIsDncConfirmOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-600" />
              {companyToMarkDNC?.is_dnc ? 'Remove from DNC List' : 'Mark as DNC'}
            </DialogTitle>
            <DialogDescription>
              {companyToMarkDNC?.is_dnc
                ? `Are you sure you want to remove "${companyToMarkDNC?.name}" from the Do Not Contact list?`
                : `Are you sure you want to mark "${companyToMarkDNC?.name}" as Do Not Contact?`
              }
            </DialogDescription>
          </DialogHeader>

          {!companyToMarkDNC?.is_dnc && (
            <div className="space-y-2 py-4">
              <Label htmlFor="dnc-reason">Reason (optional)</Label>
              <Input
                id="dnc-reason"
                placeholder="e.g., Requested removal, Competitor, etc."
                value={dncReasonInput}
                onChange={(e) => setDncReasonInput(e.target.value)}
                className="border-[#004565]/20 focus:border-[#004565]"
                disabled={isSubmittingDNC}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDncConfirmOpen(false)
                setCompanyToMarkDNC(null)
                setDncReasonInput('')
              }}
              disabled={isSubmittingDNC}
            >
              Cancel
            </Button>
            <Button
              variant={companyToMarkDNC?.is_dnc ? "default" : "destructive"}
              onClick={confirmMarkDNC}
              className={companyToMarkDNC?.is_dnc ? "" : "bg-red-600 hover:bg-red-700"}
              disabled={isSubmittingDNC}
            >
              {isSubmittingDNC ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {companyToMarkDNC?.is_dnc ? 'Removing...' : 'Marking...'}
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  {companyToMarkDNC?.is_dnc ? 'Remove from DNC' : 'Mark as DNC'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
