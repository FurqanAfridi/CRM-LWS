'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Ban, Plus, Trash2, Search, Upload, Building2, Users, Loader2 } from 'lucide-react'

type DNCEntry = {
  id: string
  type: 'company' | 'contact'
  value: string
  reason: string
  added_at: string
}

export default function DNCPage() {
  const [dncList, setDncList] = useState<DNCEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false)
  const [itemToRemove, setItemToRemove] = useState<DNCEntry | null>(null)
  const [addMode, setAddMode] = useState<'single' | 'list'>('single')
  const [newEntry, setNewEntry] = useState({ type: 'company', value: '', reason: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  // Fetch DNC list from API
  useEffect(() => {
    fetchDNCList()
  }, [])

  const fetchDNCList = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/dnc')
      if (!response.ok) {
        throw new Error('Failed to fetch DNC list')
      }
      const data = await response.json()
      setDncList(data)
    } catch (error) {
      console.error('Error fetching DNC list:', error)
      toast.error('Failed to load DNC list. Please refresh the page.')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter logic
  const filteredList = dncList.filter(item =>
    item.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reason.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddSubmit = async () => {
    if (addMode === 'single') {
      if (!newEntry.value) {
        toast.error('Please enter a domain or email')
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch('/api/dnc/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: newEntry.type,
            value: newEntry.value,
            reason: newEntry.reason || 'Added manually from DNC list'
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to add to DNC list')
        }

        // Show success message
        if (newEntry.type === 'company') {
          toast.success(`Successfully added ${data.count} company(ies) to DNC list`, {
            description: data.companies.join(', ')
          })
        } else {
          toast.success(`Successfully added ${data.count} contact(s) to DNC list`, {
            description: data.contacts.join(', ')
          })
        }

        // Reset form and close dialog
        setNewEntry({ type: 'company', value: '', reason: '' })
        setIsAddDialogOpen(false)

        // Refresh the DNC list
        fetchDNCList()
      } catch (error: any) {
        console.error('Error adding to DNC list:', error)
        toast.error(error.message || 'Failed to add to DNC list. Please try again.')
      } finally {
        setIsLoading(false)
      }
    } else {
      // Bulk upload handled by handleBulkUpload
      if (!uploadedFile) {
        toast.error('Please select a file to upload')
        return
      }
      handleBulkUpload()
    }
  }

  const handleRemove = (item: DNCEntry) => {
    setItemToRemove(item)
    setIsRemoveConfirmOpen(true)
  }

  const confirmRemove = async () => {
    if (!itemToRemove) return

    try {
      const endpoint = itemToRemove.type === 'company'
        ? `/api/companies/${itemToRemove.id}/dnc`
        : `/api/contacts/${itemToRemove.id}/dnc`

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_dnc: false,
          dnc_reason: null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to remove from DNC list')
      }

      // Close dialog and refresh the list
      setIsRemoveConfirmOpen(false)
      setItemToRemove(null)
      fetchDNCList()
    } catch (error) {
      console.error('Error removing from DNC list:', error)
      toast.error('Failed to remove from DNC list. Please try again.')
    }
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
    setIsAddDialogOpen(false)
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#004565] mx-auto mb-4" />
          <p className="text-sm text-[#004565] font-medium">Loading DNC list...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[#004565] flex items-center gap-2">
            <Ban className="h-8 w-8 text-red-600" />
            DNC List
          </h1>
          <p className="text-[#004565]/70 mt-1">Manage Do Not Contact entries for companies and contacts. Leads associated with DNC entities are automatically excluded from Qualified Leads and Outreach tabs.</p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add to DNC
        </Button>
      </div>

      <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#004565]/50" />
            <Input
              placeholder="Search DNC list..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-[#004565]/20 focus:border-[#004565]"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Entries</TabsTrigger>
              <TabsTrigger value="company">Companies</TabsTrigger>
              <TabsTrigger value="contact">Contacts</TabsTrigger>
            </TabsList>

            {['all', 'company', 'contact'].map(tabValue => (
              <TabsContent key={tabValue} value={tabValue} className="mt-0">
                <div className="rounded-md border border-[#004565]/10 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#004565]/5 border-b border-[#004565]/10">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-[#004565]">Type</th>
                        <th className="px-4 py-3 text-left font-medium text-[#004565]">Value (Domain/Email)</th>
                        <th className="px-4 py-3 text-left font-medium text-[#004565]">Reason</th>
                        <th className="px-4 py-3 text-left font-medium text-[#004565]">Date Added</th>
                        <th className="px-4 py-3 text-right font-medium text-[#004565]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#004565]/10 bg-white">
                      {filteredList
                        .filter(item => tabValue === 'all' || item.type === tabValue)
                        .map((item) => (
                          <tr key={item.id} className="hover:bg-red-50/30 transition-colors group">
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={item.type === 'company' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-purple-200 text-purple-700 bg-purple-50'}>
                                {item.type === 'company' ? <Building2 className="h-3 w-3 mr-1" /> : <Users className="h-3 w-3 mr-1" />}
                                {item.type === 'company' ? 'Company' : 'Contact'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900">{item.value}</td>
                            <td className="px-4 py-3 text-gray-500">{item.reason}</td>
                            <td className="px-4 py-3 text-gray-500">{item.added_at}</td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemove(item)}
                                className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      {filteredList.filter(item => tabValue === 'all' || item.type === tabValue).length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">
                            No entries found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Add DNC Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add to DNC List</DialogTitle>
            <DialogDescription>
              Block outreach to specific companies or contacts.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={addMode} onValueChange={(v) => setAddMode(v as 'single' | 'list')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="single">Single Entry</TabsTrigger>
              <TabsTrigger value="list">Bulk Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4">
              <div className="grid grid-cols-4 gap-4 items-center">
                <Label className="text-right">Type</Label>
                <div className="col-span-3 flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      checked={newEntry.type === 'company'}
                      onChange={() => setNewEntry({ ...newEntry, type: 'company' })}
                      className="text-[#004565]"
                    />
                    Company
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      checked={newEntry.type === 'contact'}
                      onChange={() => setNewEntry({ ...newEntry, type: 'contact' })}
                      className="text-[#004565]"
                    />
                    Contact
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 items-center">
                <Label className="text-right">Value</Label>
                <Input
                  placeholder={newEntry.type === 'company' ? 'example.com' : 'email@example.com'}
                  className="col-span-3"
                  value={newEntry.value}
                  onChange={(e) => setNewEntry({ ...newEntry, value: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 gap-4 items-center">
                <Label className="text-right">Reason</Label>
                <Input
                  placeholder="Optional reason..."
                  className="col-span-3"
                  value={newEntry.reason}
                  onChange={(e) => setNewEntry({ ...newEntry, reason: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="list" className="py-4">
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
                    <p className="text-xs text-gray-400 mt-1">CSV, XLS, XLSX containing domains or emails</p>
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
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false)
              setUploadedFile(null)
            }} disabled={isLoading}>Cancel</Button>
            <Button
              onClick={uploadedFile ? handleBulkUpload : handleAddSubmit}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadedFile ? 'Processing...' : 'Adding...'}
                </>
              ) : (
                uploadedFile ? 'Process File' : (addMode === 'single' ? 'Add Entry' : 'Upload File')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog open={isRemoveConfirmOpen} onOpenChange={setIsRemoveConfirmOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Remove from DNC List
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{itemToRemove?.value}</strong> from the Do Not Contact list?
              This will allow outreach to this {itemToRemove?.type} again.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRemoveConfirmOpen(false)
                setItemToRemove(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemove}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove from DNC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
