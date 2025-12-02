import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden relative">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 relative bg-gradient-to-br from-white via-[#004565]/5 to-white">
            {/* Animated background elements */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#376EE1]/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00CD50]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
              <div className="absolute top-1/2 right-0 w-72 h-72 bg-[#004565]/10 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>
            <div className="relative z-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}

