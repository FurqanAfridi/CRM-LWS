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

        const dncEntries: any[] = []

        // Fetch DNC companies
        if (type === 'company' || type === 'all' || !type) {
            const { data: companies, error: companiesError } = await supabase
                .from('companies')
                .select('id, name, is_dnc, dnc_reason, dnc_date')
                .eq('is_dnc', true)
                .order('dnc_date', { ascending: false })

            if (companiesError) {
                return NextResponse.json({ error: companiesError.message }, { status: 500 })
            }

            if (companies) {
                dncEntries.push(...companies.map(c => ({
                    id: c.id,
                    type: 'company',
                    value: c.name,
                    reason: c.dnc_reason || 'No reason provided',
                    added_at: c.dnc_date ? new Date(c.dnc_date).toISOString().split('T')[0] : 'Unknown'
                })))
            }
        }

        // Fetch DNC contacts
        if (type === 'contact' || type === 'all' || !type) {
            const { data: contacts, error: contactsError } = await supabase
                .from('contacts')
                .select('id, first_name, last_name, email, is_dnc, dnc_reason, dnc_date')
                .eq('is_dnc', true)
                .order('dnc_date', { ascending: false })

            if (contactsError) {
                return NextResponse.json({ error: contactsError.message }, { status: 500 })
            }

            if (contacts) {
                dncEntries.push(...contacts.map(c => ({
                    id: c.id,
                    type: 'contact',
                    value: c.email || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown',
                    reason: c.dnc_reason || 'No reason provided',
                    added_at: c.dnc_date ? new Date(c.dnc_date).toISOString().split('T')[0] : 'Unknown'
                })))
            }
        }

        // Sort by date (most recent first)
        dncEntries.sort((a, b) => {
            if (a.added_at === 'Unknown') return 1
            if (b.added_at === 'Unknown') return -1
            return new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
        })

        return NextResponse.json(dncEntries)
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
