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
        const { type, value, reason, company_name } = await request.json()

        if (!type || !value) {
            return NextResponse.json(
                { error: 'Type and value are required' },
                { status: 400 }
            )
        }

        if (type === 'company') {
            // Extract domain from value
            let domain = value.toLowerCase().trim()
            domain = domain.replace(/^https?:\/\//, '') // Remove protocol
            domain = domain.replace(/^www\./, '') // Remove www
            domain = domain.split('/')[0] // Remove path

            // Insert into dnc_list table (this will always succeed)
            const { error: insertError } = await supabase
                .from('dnc_list')
                .upsert({
                    type: 'company',
                    value: domain,
                    reason: reason || 'Added manually from DNC list',
                    company_name: company_name || null
                }, {
                    onConflict: 'type,value',
                    ignoreDuplicates: false
                })

            if (insertError) {
                return NextResponse.json({ error: insertError.message }, { status: 500 })
            }

            // Also try to find and update matching companies in the companies table
            const { data: companies } = await supabase
                .from('companies')
                .select('id, name, website')
                .or(`website.ilike.%${domain}%`)
                .limit(10)

            let updatedCompanies: string[] = []
            if (companies && companies.length > 0) {
                // Mark matching companies as DNC
                await supabase
                    .from('companies')
                    .update({
                        is_dnc: true,
                        dnc_reason: reason || 'Added manually from DNC list',
                        dnc_date: new Date().toISOString()
                    })
                    .in('id', companies.map(c => c.id))

                updatedCompanies = companies.map(c => c.name)
            }

            return NextResponse.json({
                success: true,
                count: 1,
                companies: updatedCompanies.length > 0
                    ? updatedCompanies
                    : [`${domain} (added to DNC list, no matching companies found)`]
            })

        } else if (type === 'contact') {
            const email = value.toLowerCase().trim()

            // Insert into dnc_list table (this will always succeed)
            const { error: insertError } = await supabase
                .from('dnc_list')
                .upsert({
                    type: 'contact',
                    value: email,
                    reason: reason || 'Added manually from DNC list',
                    company_name: company_name || null
                }, {
                    onConflict: 'type,value',
                    ignoreDuplicates: false
                })

            if (insertError) {
                return NextResponse.json({ error: insertError.message }, { status: 500 })
            }

            // Also try to find and update matching contacts in the contacts table
            const { data: contacts } = await supabase
                .from('contacts')
                .select('id, email, first_name, last_name')
                .ilike('email', email)
                .limit(10)

            let updatedContacts: string[] = []
            if (contacts && contacts.length > 0) {
                // Mark matching contacts as DNC
                await supabase
                    .from('contacts')
                    .update({
                        is_dnc: true,
                        dnc_reason: reason || 'Added manually from DNC list',
                        dnc_date: new Date().toISOString()
                    })
                    .in('id', contacts.map(c => c.id))

                updatedContacts = contacts.map(c => `${c.first_name} ${c.last_name} (${c.email})`)
            }

            return NextResponse.json({
                success: true,
                count: 1,
                contacts: updatedContacts.length > 0
                    ? updatedContacts
                    : [`${email} (added to DNC list, no matching contacts found)`]
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
