'use client'

import { useState, useMemo } from 'react'
import { useContacts, useCreateContact, useUpdateContact } from '@/lib/hooks/useContacts'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQueryClient } from '@tanstack/react-query'
import { Database } from '@/lib/supabase/types'
import { Users, Plus, Mail, Phone, Building2, ArrowRight, Edit, ArrowUp, ArrowDown } from 'lucide-react'

type Contact = Database['public']['Tables']['contacts']['Row']
type ContactInsert = Database['public']['Tables']['contacts']['Insert']
type ContactUpdate = Database['public']['Tables']['contacts']['Update']

export default function ContactsPage() {
  const { data: contacts, isLoading, error } = useContacts()
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const queryClient = useQueryClient()
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<Partial<ContactInsert & { company_name?: string | null }>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
    department: '',
    company_name: '',
    is_decision_maker: false,
  })

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === 'asc' ? { key, direction: 'desc' } : null
      }
      return { key, direction: 'asc' }
    })
  }

  const sortedContacts = useMemo(() => {
    if (!contacts || !sortConfig) return contacts || []

    return [...contacts].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key]
      const bValue = (b as any)[sortConfig.key]

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      // Handle booleans
      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        return sortConfig.direction === 'asc' ? (aValue === bValue ? 0 : aValue ? 1 : -1) : (aValue === bValue ? 0 : aValue ? -1 : 1)
      }

      // Handle strings
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()
      const comparison = aStr.localeCompare(bStr)
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [contacts, sortConfig])

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
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      job_title: '',
      department: '',
      company_name: '',
      is_decision_maker: false,
    })
    setIsFormDialogOpen(true)
  }

  const handleOpenEditDialog = (contact: Contact) => {
    setIsEditing(true)
    setSelectedContact(contact)
    const contactWithCompany = contact as Contact & { company_name?: string | null }
    setFormData({
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      job_title: contact.job_title || '',
      department: contact.department || '',
      company_name: contactWithCompany.company_name || '',
      is_decision_maker: contact.is_decision_maker || false,
    })
    setIsFormDialogOpen(true)
  }

  const handleSaveContact = async () => {
    try {
      if (isEditing && selectedContact) {
        await updateContact.mutateAsync({
          id: selectedContact.id,
          updates: formData as ContactUpdate & { company_name?: string | null },
        })
      } else {
        await createContact.mutateAsync(formData as ContactInsert & { company_name?: string | null })
      }
      setIsFormDialogOpen(false)
      setSelectedContact(null)
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    } catch (error: any) {
      alert(error.message || 'Failed to save contact')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#004565]/20 border-t-[#004565] mx-auto mb-4"></div>
          <p className="text-sm text-[#004565] font-medium">Loading contacts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between sticky top-0 z-40 bg-white shadow-sm pb-4">
          <div className="relative">
            <h1 className="text-4xl font-bold text-[#004565]">
              Contacts
            </h1>
          </div>
        </div>
        <Card className="border-red-200/50 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <p className="text-red-600 mb-2 font-semibold">Error loading contacts</p>
            <p className="text-sm text-[#000000]/80 mb-4">{error.message}</p>
            <p className="text-xs text-[#000000]/70">
              Please check your Supabase connection and ensure the database tables are set up correctly.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-40 bg-white shadow-sm pb-4">
        <div className="flex items-center justify-between">
          <div className="relative">
            <h1 className="text-4xl font-bold text-[#004565]">
              Contacts
            </h1>
            <div className="absolute -top-2 -left-2 w-24 h-24 bg-[#376EE1]/20 rounded-full blur-2xl -z-10"></div>
          </div>
          <Button 
            onClick={handleOpenCreateDialog}
            className="bg-[#004565] hover:bg-[#004565]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Contact
          </Button>
        </div>
      </div>

      {contacts && contacts.length > 0 ? (
        <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="flex flex-col h-[calc(100vh-280px)]">
              <div className="overflow-x-scroll overflow-y-auto flex-1">
                <table className="w-full">
                  <thead className="sticky top-0 z-30 bg-[#004565]/5">
                    <tr className="border-b bg-[#004565]/5">
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider cursor-pointer hover:bg-[#004565]/10 transition-colors"
                        onClick={() => handleSort('first_name')}
                      >
                        <div className="flex items-center">
                          Name
                          <SortIcon columnKey="first_name" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider cursor-pointer hover:bg-[#004565]/10 transition-colors"
                        onClick={() => handleSort('job_title')}
                      >
                        <div className="flex items-center">
                          Job Title
                          <SortIcon columnKey="job_title" />
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
                        onClick={() => handleSort('phone')}
                      >
                        <div className="flex items-center">
                          Phone
                          <SortIcon columnKey="phone" />
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
                        onClick={() => handleSort('is_decision_maker')}
                      >
                        <div className="flex items-center">
                          Status
                          <SortIcon columnKey="is_decision_maker" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-[#004565] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#004565]/10">
                    {sortedContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-[#004565]/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {contact.first_name || contact.last_name
                                ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                                : 'Unnamed Contact'}
                            </div>
                            {contact.department && (
                              <div className="text-sm text-gray-500">{contact.department}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contact.job_title || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contact.email ? (
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            <a
                              href={`mailto:${contact.email}`}
                              className="text-[#376EE1] hover:text-[#004565] hover:underline"
                            >
                              {contact.email}
                            </a>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contact.phone ? (
                          <div className="flex items-center text-sm text-gray-900">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            <a
                              href={`tel:${contact.phone}`}
                              className="text-[#376EE1] hover:text-[#004565] hover:underline"
                            >
                              {contact.phone}
                            </a>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(contact as Contact & { company_name?: string | null }).company_name ? (
                          <div className="flex items-center text-sm text-[#000000]">
                            <Building2 className="h-4 w-4 mr-2 text-[#004565]/60" />
                            {(contact as Contact & { company_name?: string | null }).company_name}
                          </div>
                        ) : (
                          <span className="text-sm text-[#004565]/50">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contact.is_decision_maker && (
                          <Badge variant="default">Decision Maker</Badge>
                        )}
                        {!contact.is_decision_maker && (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#004565] hover:text-[#004565]/80 hover:bg-[#004565]/10"
                            onClick={() => handleOpenEditDialog(contact)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )                )}
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
              <Users className="h-8 w-8 text-[#004565]" />
            </div>
            <p className="text-[#004565] font-medium mb-2">No contacts found</p>
            <p className="text-[#004565]/70 text-sm mb-4">Create your first contact to get started.</p>
            <Button 
              onClick={handleOpenCreateDialog}
              className="mt-4 bg-[#004565] hover:bg-[#004565]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Contact
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Contact Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Edit className="h-5 w-5 text-[#004565]" />
                  Edit Contact
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-[#004565]" />
                  New Contact
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update contact information' : 'Enter the details for the new contact'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name" className="text-[#004565]">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name || ''}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="John"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="last_name" className="text-[#004565]">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name || ''}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Doe"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-[#004565]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-[#004565]">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job_title" className="text-[#004565]">Job Title</Label>
                <Input
                  id="job_title"
                  value={formData.job_title || ''}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  placeholder="CEO"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="department" className="text-[#004565]">Department</Label>
                <Input
                  id="department"
                  value={formData.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Sales"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="company_name" className="text-[#004565]">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name || ''}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Acme Corp"
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_decision_maker"
                checked={formData.is_decision_maker || false}
                onChange={(e) => setFormData({ ...formData, is_decision_maker: e.target.checked })}
                className="h-4 w-4 text-[#004565]"
              />
              <Label htmlFor="is_decision_maker" className="text-[#004565] cursor-pointer">
                Decision Maker
              </Label>
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
                onClick={handleSaveContact}
                disabled={createContact.isPending || updateContact.isPending || (!formData.first_name && !formData.last_name)}
                className="bg-[#004565] hover:bg-[#004565]/90 text-white"
              >
                {createContact.isPending || updateContact.isPending ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    {isEditing ? 'Update Contact' : 'Create Contact'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

