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

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getSupabaseClient()
        const { id } = params

        if (!id) {
            return NextResponse.json(
                { error: 'ID is required' },
                { status: 400 }
            )
        }

        // Get the entry details before deleting (to optionally update companies/contacts)
        const { data: entry, error: fetchError } = await supabase
            .from('dnc_list')
            .select('type, value')
            .eq('id', id)
            .single()

        if (fetchError) {
            return NextResponse.json({ error: fetchError.message }, { status: 500 })
        }

        if (!entry) {
            return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
        }

        // Delete from dnc_list table
        const { error: deleteError } = await supabase
            .from('dnc_list')
            .delete()
            .eq('id', id)

        if (deleteError) {
            return NextResponse.json({ error: deleteError.message }, { status: 500 })
        }

        // Optionally update companies/contacts to remove DNC flag
        if (entry.type === 'company') {
            // Find companies with matching domain
            const { data: companies } = await supabase
                .from('companies')
                .select('id')
                .or(`website.ilike.%${entry.value}%`)

            if (companies && companies.length > 0) {
                await supabase
                    .from('companies')
                    .update({
                        is_dnc: false,
                        dnc_reason: null,
                        dnc_date: null
                    })
                    .in('id', companies.map(c => c.id))
            }
        } else if (entry.type === 'contact') {
            // Find contacts with matching email
            const { data: contacts } = await supabase
                .from('contacts')
                .select('id')
                .ilike('email', entry.value)

            if (contacts && contacts.length > 0) {
                await supabase
                    .from('contacts')
                    .update({
                        is_dnc: false,
                        dnc_reason: null,
                        dnc_date: null
                    })
                    .in('id', contacts.map(c => c.id))
            }
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
