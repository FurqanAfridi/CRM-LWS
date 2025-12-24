'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { AlertCircle } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const { signIn, loading: authLoading } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isConfigured, setIsConfigured] = useState(false)
    const [checking, setChecking] = useState(true)

    // Check Supabase configuration on mount
    useEffect(() => {
        const checkConfig = async () => {
            try {
                // Check server-side (most reliable)
                const response = await fetch('/api/test-env')
                const serverCheck = await response.json()

                if (serverCheck.configured) {
                    setIsConfigured(true)
                } else {
                    console.error('⚠️ Server does not have environment variables configured')
                    setIsConfigured(false)
                }
            } catch (error) {
                console.error('Failed to check server env vars:', error)
                setIsConfigured(false)
            } finally {
                setChecking(false)
            }
        }

        checkConfig()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const { error } = await signIn(email, password)
            if (error) {
                setError(error.message)
            } else {
                router.push('/dashboard')
                router.refresh()
            }
        } catch (err: unknown) {
            console.error('Login error:', err)
            let errorMessage = 'An error occurred during login'

            if (err instanceof Error) {
                errorMessage = err.message || errorMessage
            }

            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-[#004565] via-[#004565] to-[#004565]">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-[#376EE1]/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#00CD50]/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${5 + Math.random() * 5}s`,
                        }}
                    />
                ))}
            </div>

            <Card className="w-full max-w-md relative z-10 border-[#004565]/30 shadow-2xl bg-white/95 backdrop-blur-md">
                <CardHeader className="space-y-1 pb-6">
                    <div className="flex justify-center mb-4">
                        <div className="relative h-20 w-20">
                            <Image
                                src="/Lincoln.png"
                                alt="Lincoln Waste Solutions Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold text-center text-[#004565]">
                        CRM - LWS
                    </CardTitle>
                    <CardDescription className="text-center text-[#004565]/80 font-medium">
                        Sign in to your account to continue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {checking ? (
                        <div className="rounded-md bg-blue-50 border border-blue-200 p-4 mb-4">
                            <p className="text-sm text-blue-800">Checking configuration...</p>
                        </div>
                    ) : !isConfigured ? (
                        <div className="rounded-md bg-red-50 border border-red-200 p-4 space-y-3 text-sm text-red-900 mb-4">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <span className="font-bold text-base">Environment Variables Not Configured</span>
                            </div>
                            <div className="text-sm space-y-2 ml-7">
                                <p className="font-semibold">Supabase environment variables are not loaded.</p>
                                <div className="bg-red-100 p-3 rounded border border-red-300">
                                    <p className="font-bold mb-2">⚠️ REQUIRED STEPS:</p>
                                    <ol className="list-decimal list-inside space-y-1 font-mono text-xs">
                                        <li>Stop dev server: Press <strong>Ctrl+C</strong> in terminal</li>
                                        <li>Delete cache: <code className="bg-red-200 px-1 rounded">Remove-Item -Recurse -Force .next</code></li>
                                        <li>Restart server: <code className="bg-red-200 px-1 rounded">npm run dev</code></li>
                                        <li>Hard refresh browser: <strong>Ctrl+Shift+R</strong></li>
                                    </ol>
                                </div>
                                <p className="text-xs text-red-700 mt-2">
                                    Check: <a href="/api/test-env" target="_blank" className="underline">http://localhost:3000/api/test-env</a>
                                </p>
                            </div>
                        </div>
                    ) : null}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="rounded-md bg-red-50 p-3 flex items-center gap-2 text-sm text-red-800">
                                <AlertCircle className="h-4 w-4" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading || authLoading || !isConfigured}
                                autoComplete="email"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading || authLoading || !isConfigured}
                                autoComplete="current-password"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-[#004565] hover:bg-[#004565]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                            disabled={loading || authLoading || !isConfigured || checking}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-[#004565]/70 font-medium">Lincoln Waste Solutions CRM Portal</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
