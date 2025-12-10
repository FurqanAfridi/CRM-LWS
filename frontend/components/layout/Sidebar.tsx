'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  Building2,
  Users,
  Target,
  BarChart3,
  MessageSquare,
  TrendingUp,
  Mail,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/dashboard/leads', icon: Target },
  { name: 'Outreach', href: '/dashboard/outreach', icon: Mail },
  { name: 'Companies', href: '/dashboard/companies', icon: Building2 },
  { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
  { name: 'Pipeline', href: '/dashboard/pipeline', icon: TrendingUp },
  { name: 'Interactions', href: '/dashboard/interactions', icon: MessageSquare },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div 
      className="flex w-64 flex-col bg-[#004565] border-r border-[#004565]/80 shadow-2xl relative overflow-hidden"
      style={{
        backgroundImage: 'url(/BACKGROUNDSIDE.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay for better text readability - reduced opacity to show image */}
      <div className="absolute inset-0 bg-[#004565]/60 backdrop-blur-[1px] z-0"></div>
      
      <div className="flex h-20 items-center gap-3 border-b border-white/20 px-6 relative z-10">
        <div className="relative h-12 w-12 flex-shrink-0 bg-white rounded-lg p-2 shadow-md">
          <Image
            src="/Lincoln.png"
            alt="Lincoln Waste Solutions Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="flex flex-col">
          <h1 className="text-sm font-bold text-white tracking-wide">CRM</h1>
          <p className="text-xs text-white/80">Lincoln Waste</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4 relative z-10">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white text-[#004565] shadow-lg shadow-black/20 transform scale-[1.02]'
                  : 'text-white/90 hover:bg-[#004565]/80 hover:text-white'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive ? 'text-[#004565]' : 'text-white/80')} />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

