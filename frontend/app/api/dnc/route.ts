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
        auth: {
            persistSession: false
        }
    })
}

export async function GET(request: Request) {
    try {
        const supabase = getSupabaseClient()
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') // 'company', 'contact', or 'all'

        // Build query for dnc_list table
        let query = supabase
            .from('dnc_list')
            .select('id, type, value, reason, created_at')
            .order('created_at', { ascending: false })

        // Filter by type if specified
        if (type && type !== 'all') {
            query = query.eq('type', type)
        }

        const { data: dncEntries, error } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Format the response
        const formattedEntries = (dncEntries || []).map(entry => ({
            id: entry.id,
            type: entry.type,
            value: entry.value,
            reason: entry.reason || 'No reason provided',
            added_at: entry.created_at ? new Date(entry.created_at).toISOString().split('T')[0] : 'Unknown'
        }))

        return NextResponse.json(formattedEntries)
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
