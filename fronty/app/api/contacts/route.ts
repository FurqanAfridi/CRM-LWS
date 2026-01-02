import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use a function to get the client to ensure env vars are read at runtime
function getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables')
    }

    return createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false // No session needed for server-side
        }
    })
}

export async function GET(request: Request) {
    try {
        const supabase = getSupabaseClient()
        const { searchParams } = new URL(request.url)

        const company_id = searchParams.get('company_id')
        const is_decision_maker = searchParams.get('is_decision_maker')

        let query = supabase
            .from('contacts')
            .select('*, companies(name)')
            .order('created_at', { ascending: false })
            .limit(1000)

        if (company_id) {
            query = query.eq('company_id', company_id)
        }

        if (is_decision_maker !== null && is_decision_maker !== undefined) {
            // Handle various string representations of boolean
            const isTrue = is_decision_maker === 'true'
            query = query.eq('is_decision_maker', isTrue)
        }

        const { data, error } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Transform data to include company_name flattened (matching client-side expectation)
        const transformed = (data || []).map((contact: any) => ({
            ...contact,
            company_name: contact.companies?.name || null
        }))

        return NextResponse.json(transformed)

    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const supabase = getSupabaseClient()
        const body = await request.json()

        // Remove company_name from payload as it's not a column in contacts table
        const { company_name, ...dbContact } = body

        const { data, error } = await supabase
            .from('contacts')
            .insert(dbContact)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
