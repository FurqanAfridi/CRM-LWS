'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LogOut, User } from 'lucide-react'

export function Header() {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#004565]/20 bg-white/95 backdrop-blur-sm shadow-sm px-6">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 flex-shrink-0">
          <Image
            src="/Lincoln.png"
            alt="Lincoln Waste Solutions Logo"
            fill
            className="object-contain"
          />
        </div>
        <h2 className="text-lg font-semibold text-[#004565]">
          Lincoln Waste Solutions CRM
        </h2>
      </div>
      <div className="flex items-center gap-4">
        {profile && (
          <>
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 hover:opacity-80 transition-all px-3 py-2 rounded-lg hover:bg-[#004565]/5 border border-transparent hover:border-[#004565]/20"
            >
              <div className="h-8 w-8 rounded-full bg-[#004565] flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-[#000000]">
                  {profile.full_name || profile.email}
                </p>
                <p className="text-xs text-[#004565] capitalize font-medium">{profile.role}</p>
              </div>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2 border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10 hover:border-[#004565]/50"
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

