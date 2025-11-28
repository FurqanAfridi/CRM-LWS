'use client'

import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, checkSupabaseConfig } from '@/lib/supabase/client'

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
    // Check if Supabase is configured
    const configCheck = checkSupabaseConfig()
    if (!configCheck.configured) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error)
        setLoading(false)
        return
      }
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }).catch((error) => {
      console.error('Error in getSession:', error)
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
      console.log('🔍 Fetching profile for user:', userId)
      
      // Get user email from auth
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // If profile doesn't exist (PGRST116), try to create it
        if (error.code === 'PGRST116' && authUser) {
          console.log('⚠️ Profile not found, creating new profile...')
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: authUser.email || '',
              full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || null,
              role: 'user',
              is_active: true,
            })
            .select()
            .single()

          if (createError) {
            console.error('❌ Error creating profile:', createError)
            setProfile(null)
          } else {
            console.log('✅ Profile created successfully:', newProfile)
            setProfile(newProfile as Profile)
          }
        } else {
          console.error('❌ Error fetching profile:', error)
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          })
          setProfile(null)
        }
      } else {
        console.log('✅ Profile fetched successfully:', data)
        setProfile(data as Profile)
      }
    } catch (error) {
      console.error('❌ Exception fetching profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const configCheck = checkSupabaseConfig()
      if (!configCheck.configured) {
        throw configCheck.error || new Error('Supabase is not configured')
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data.user) {
        try {
          await fetchProfile(data.user.id)
          // Update last_login_at (don't fail if this errors)
          try {
            await supabase
              .from('profiles')
              .update({ last_login_at: new Date().toISOString() })
              .eq('id', data.user.id)
          } catch (profileError) {
            console.warn('Failed to update last_login_at:', profileError)
          }
        } catch (profileError) {
          console.warn('Failed to fetch profile after login:', profileError)
        }
      }

      return { data, error: null }
    } catch (error: unknown) {
      const err = error as Error
      console.error('Sign in error:', err)
      throw err
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
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

    if (error) throw error
    return { data, error }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    if (data) {
      setProfile(data as Profile)
    }
    return { data, error: null }
  }

  const updatePassword = async (newPassword: string) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
    return { error: null }
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
