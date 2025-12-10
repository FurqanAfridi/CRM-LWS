'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, CheckCircle2, XCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { useCalendarStatus, useConnectCalendar, useDisconnectCalendar } from '@/lib/hooks/useOutreach'

interface CalendarIntegrationProps {
  onConnect?: (provider: string, credentials: any) => void
  onDisconnect?: (provider: string) => void
}

export function CalendarIntegration({ onConnect, onDisconnect }: CalendarIntegrationProps) {
  const { data: status, isLoading } = useCalendarStatus()
  const connect = useConnectCalendar()
  const disconnect = useDisconnectCalendar()

  const [connectingProvider, setConnectingProvider] = useState<string | null>(null)

  const providers = [
    { id: 'calendly', name: 'Calendly', color: 'bg-blue-500' },
    { id: 'google', name: 'Google Calendar', color: 'bg-red-500' },
    { id: 'outlook', name: 'Outlook', color: 'bg-blue-600' },
  ]

  const handleConnect = async (provider: 'calendly' | 'google' | 'outlook') => {
    setConnectingProvider(provider)
    try {
      const result = await connect.mutateAsync(provider)
      if (result.oauth_url) {
        // Open OAuth URL in new window
        window.open(result.oauth_url, 'oauth', 'width=600,height=700')
        // In production, handle OAuth callback properly
      }
      if (onConnect) {
        onConnect(provider, result)
      }
    } catch (error: any) {
      alert(error.message || 'Failed to connect calendar')
    } finally {
      setConnectingProvider(null)
    }
  }

  const handleDisconnect = async (provider: 'calendly' | 'google' | 'outlook') => {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) {
      return
    }

    try {
      await disconnect.mutateAsync(provider)
      if (onDisconnect) {
        onDisconnect(provider)
      }
    } catch (error: any) {
      alert(error.message || 'Failed to disconnect calendar')
    }
  }

  const getProviderStatus = (provider: string) => {
    if (!status) return null
    return status[provider as keyof typeof status]
  }

  if (isLoading) {
    return (
      <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardContent className="py-12 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#004565]/20 border-t-[#004565] mx-auto"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#004565]">
          <Calendar className="h-5 w-5" />
          Calendar Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {providers.map((provider) => {
          const providerStatus = getProviderStatus(provider.id)
          const isConnected = providerStatus?.is_active
          const isConnecting = connectingProvider === provider.id

          return (
            <div
              key={provider.id}
              className="flex items-center justify-between p-4 border border-[#004565]/20 rounded-lg bg-white"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${provider.color} flex items-center justify-center text-white font-semibold`}>
                  {provider.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-[#004565]">{provider.name}</div>
                  {isConnected ? (
                    <div className="text-xs text-[#004565]/70">
                      Connected {providerStatus?.calendar_id && `(${providerStatus.calendar_id})`}
                    </div>
                  ) : (
                    <div className="text-xs text-[#004565]/50">Not connected</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Badge variant="success" className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(provider.id as any)}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => handleConnect(provider.id as any)}
                    disabled={isConnecting}
                    className="bg-[#004565] hover:bg-[#004565]/90 text-white"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Connect
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )
        })}

        <div className="pt-4 border-t border-[#004565]/10">
          <p className="text-xs text-[#004565]/70">
            Connect your calendar provider to enable automatic booking link generation and meeting scheduling.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

