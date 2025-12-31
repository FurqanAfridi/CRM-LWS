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

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getSupabaseClient()
        const { id } = params
        const body = await request.json()
        const { is_dnc, dnc_reason } = body

        const updateData: any = {
            is_dnc,
            updated_at: new Date().toISOString()
        }

        if (is_dnc) {
            updateData.dnc_reason = dnc_reason || 'Marked as DNC'
            updateData.dnc_date = new Date().toISOString()
        } else {
            updateData.dnc_reason = null
            updateData.dnc_date = null
        }

        const { data, error } = await supabase
            .from('companies')
            .update(updateData)
            .eq('id', id)
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
