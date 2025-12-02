'use client'

import { useContacts } from '@/lib/hooks/useContacts'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users, Plus, Mail, Phone, Building2, ArrowRight } from 'lucide-react'

export default function ContactsPage() {
  const { data: contacts, isLoading, error } = useContacts()

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
        <div className="flex items-center justify-between">
          <div className="relative">
            <h1 className="text-4xl font-bold text-[#004565]">
              Contacts
            </h1>
            <p className="text-[#004565]/80 mt-2 font-medium">Manage your contacts</p>
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
      <div className="flex items-center justify-between">
        <div className="relative">
          <h1 className="text-4xl font-bold text-[#004565]">
            Contacts
          </h1>
          <p className="text-[#004565]/80 mt-2 font-medium">Manage your contacts</p>
          <div className="absolute -top-2 -left-2 w-24 h-24 bg-[#376EE1]/20 rounded-full blur-2xl -z-10"></div>
        </div>
        <Link href="/dashboard/contacts/new">
          <Button className="bg-[#004565] hover:bg-[#004565]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <Plus className="h-4 w-4 mr-2" />
            New Contact
          </Button>
        </Link>
      </div>

      {contacts && contacts.length > 0 ? (
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
                      Job Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-[#004565] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#004565]/10">
                  {contacts.map((contact) => (
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
                        {contact.company_id ? (
                          <div className="flex items-center text-sm text-[#000000]">
                            <Building2 className="h-4 w-4 mr-2 text-[#004565]/60" />
                            <span className="text-[#004565]">Company ID: {contact.company_id.slice(0, 8)}...</span>
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
                        <Link href={`/dashboard/contacts/${contact.id}`}>
                          <Button variant="ghost" size="sm" className="text-[#004565] hover:text-[#004565]/80 hover:bg-[#004565]/10">
                            View
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
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
              <Users className="h-8 w-8 text-[#004565]" />
            </div>
            <p className="text-[#004565] font-medium mb-2">No contacts found</p>
            <p className="text-[#004565]/70 text-sm mb-4">Create your first contact to get started.</p>
            <Link href="/dashboard/contacts/new">
              <Button className="mt-4 bg-[#004565] hover:bg-[#004565]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                <Plus className="h-4 w-4 mr-2" />
                Create Contact
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

