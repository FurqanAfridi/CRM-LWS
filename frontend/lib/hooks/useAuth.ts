'use client'

import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

export interface Profile {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    role: 'admin' | 'manager' | 'user' | 'sdr'
    phone: string | null
    department: string | null
    position: string | null
    is_active: boolean
    last_login_at: string | null
    created_at: string
    updated_at: string
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setLoading(false)
            }
        }).catch(() => {
            setLoading(false)
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                await fetchProfile(session.user.id)
            } else {
                setProfile(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    async function fetchProfile(userId: string) {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser()

            const { data, error } = await (supabase
                .from('profiles') as any)
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                // If profile doesn't exist, try to create it
                if (error.code === 'PGRST116' && authUser) {
                    const { data: newProfile } = await (supabase
                        .from('profiles') as any)
                        .insert({
                            id: userId,
                            email: authUser.email || '',
                            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || null,
                            role: 'user',
                            is_active: true,
                        })
                        .select()
                        .single()

                    if (newProfile) {
                        setProfile(newProfile as Profile)
                    } else {
                        setProfile(null)
                    }
                } else {
                    setProfile(null)
                }
            } else {
                setProfile(data as Profile)
            }
        } catch {
            setProfile(null)
        } finally {
            setLoading(false)
        }
    }

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            return { data: null, error }
        }

        if (data.user) {
            // Fetch profile and update login time (non-blocking)
            void fetchProfile(data.user.id).catch(() => { })
                // Update last login time (non-blocking, fire and forget)
                ; (async () => {
                    try {
                        await (supabase
                            .from('profiles') as any)
                            .update({ last_login_at: new Date().toISOString() })
                            .eq('id', data.user.id)
                    } catch {
                        // Silently fail - not critical
                    }
                })()
        }

        return { data, error: null }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setSession(null)
        setProfile(null)
    }

    const signUp = async (email: string, password: string, fullName?: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName || email,
                },
            },
        })

        return { data, error }
    }

    const updateProfile = async (updates: Partial<Profile>) => {
        if (!user) {
            return { data: null, error: new Error('User not authenticated') }
        }

        const { data, error } = await (supabase
            .from('profiles') as any)
            .update(updates)
            .eq('id', user.id)
            .select()
            .single()

        if (error) return { data: null, error }
        if (data) {
            setProfile(data as Profile)
        }
        return { data, error: null }
    }

    const updatePassword = async (newPassword: string) => {
        if (!user) {
            return { error: new Error('User not authenticated') }
        }

        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        })

        return { error }
    }

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id)
        }
    }

    return {
        user,
        session,
        profile,
        loading,
        signIn,
        signOut,
        signUp,
        updateProfile,
        updatePassword,
        refreshProfile,
        isAuthenticated: !!user,
    }
}
