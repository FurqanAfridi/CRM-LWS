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

export async function POST(request: Request) {
    try {
        const supabase = getSupabaseClient()
        const { type, value, reason } = await request.json()

        if (!type || !value) {
            return NextResponse.json(
                { error: 'Type and value are required' },
                { status: 400 }
            )
        }

        if (type === 'company') {
            // For companies, search by website domain
            // Extract domain from value (e.g., "example.com" or "https://example.com")
            let domain = value.toLowerCase().trim()
            domain = domain.replace(/^https?:\/\//, '') // Remove protocol
            domain = domain.replace(/^www\./, '') // Remove www
            domain = domain.split('/')[0] // Remove path

            // Find companies with matching website
            const { data: companies, error: searchError } = await supabase
                .from('companies')
                .select('id, name, website')
                .or(`website.ilike.%${domain}%`)
                .limit(10)

            if (searchError) {
                return NextResponse.json({ error: searchError.message }, { status: 500 })
            }

            if (!companies || companies.length === 0) {
                return NextResponse.json(
                    { error: `No companies found with domain: ${domain}` },
                    { status: 404 }
                )
            }

            // Mark all matching companies as DNC
            const { error: updateError } = await supabase
                .from('companies')
                .update({
                    is_dnc: true,
                    dnc_reason: reason || 'Added manually from DNC list',
                    dnc_date: new Date().toISOString()
                })
                .in('id', companies.map(c => c.id))

            if (updateError) {
                return NextResponse.json({ error: updateError.message }, { status: 500 })
            }

            return NextResponse.json({
                success: true,
                count: companies.length,
                companies: companies.map(c => c.name)
            })

        } else if (type === 'contact') {
            // For contacts, search by email
            const email = value.toLowerCase().trim()

            // Find contacts with matching email
            const { data: contacts, error: searchError } = await supabase
                .from('contacts')
                .select('id, email, first_name, last_name')
                .ilike('email', email)
                .limit(10)

            if (searchError) {
                return NextResponse.json({ error: searchError.message }, { status: 500 })
            }

            if (!contacts || contacts.length === 0) {
                return NextResponse.json(
                    { error: `No contacts found with email: ${email}` },
                    { status: 404 }
                )
            }

            // Mark all matching contacts as DNC
            const { error: updateError } = await supabase
                .from('contacts')
                .update({
                    is_dnc: true,
                    dnc_reason: reason || 'Added manually from DNC list',
                    dnc_date: new Date().toISOString()
                })
                .in('id', contacts.map(c => c.id))

            if (updateError) {
                return NextResponse.json({ error: updateError.message }, { status: 500 })
            }

            return NextResponse.json({
                success: true,
                count: contacts.length,
                contacts: contacts.map(c => `${c.first_name} ${c.last_name} (${c.email})`)
            })

        } else {
            return NextResponse.json(
                { error: 'Invalid type. Must be "company" or "contact"' },
                { status: 400 }
            )
        }

    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
