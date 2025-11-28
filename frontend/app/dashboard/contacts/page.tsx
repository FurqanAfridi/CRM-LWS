'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users, Plus } from 'lucide-react'

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">Manage your contacts</p>
        </div>
        <Link href="/dashboard/contacts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Contact
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Contacts page coming soon</p>
        </CardContent>
      </Card>
    </div>
  )
}

