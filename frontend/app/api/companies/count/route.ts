import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/env'

function getSupabaseClient() {
    const supabaseUrl = SUPABASE_URL
    const supabaseKey = SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables')
    }

    return createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
    })
}

export async function GET() {
    try {
        const supabase = getSupabaseClient()
        const { count, error } = await supabase
            .from('companies')
            .select('*', { count: 'exact', head: true })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ count })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
