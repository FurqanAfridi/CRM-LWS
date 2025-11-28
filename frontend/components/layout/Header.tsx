'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, User } from 'lucide-react'

export function Header() {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Lincoln Waste Solutions CRM
        </h2>
      </div>
      <div className="flex items-center gap-4">
        {profile && (
          <>
            <Link 
              href="/dashboard/profile" 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity px-3 py-2 rounded-md hover:bg-gray-50"
            >
              <User className="h-4 w-4 text-gray-500" />
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {profile.full_name || profile.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
              </div>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </>
        )}
      </div>
    </header>
  )
}

