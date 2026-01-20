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
        const { is_dnc, reason } = await request.json()

        // 1. Get lead details
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('company_id, contact_id, email, company_name')
            .eq('id', id)
            .single()

        if (leadError) throw leadError

        // 2. Mark Company as DNC if exists
        if (lead.company_id) {
            await supabase
                .from('companies')
                .update({
                    is_dnc,
                    dnc_reason: is_dnc ? (reason || 'Marked from lead') : null,
                    dnc_date: is_dnc ? new Date().toISOString() : null
                })
                .eq('id', lead.company_id)
        }

        // 3. Mark Contact as DNC if exists
        if (lead.contact_id) {
            await supabase
                .from('contacts')
                .update({
                    is_dnc,
                    dnc_reason: is_dnc ? (reason || 'Marked from lead') : null,
                    dnc_date: is_dnc ? new Date().toISOString() : null
                })
                .eq('id', lead.contact_id)
        }

        // 4. Update dnc_list Source of Truth
        if (is_dnc) {
            // Add email to dnc_list
            if (lead.email) {
                await supabase
                    .from('dnc_list')
                    .upsert({
                        type: 'contact',
                        value: lead.email.toLowerCase().trim(),
                        reason: reason || 'Marked from lead',
                        company_name: lead.company_name
                    }, { onConflict: 'type,value' })
            }

            // Attempt to add company to dnc_list if we have a website/domain
            if (lead.company_id) {
                const { data: company } = await supabase
                    .from('companies')
                    .select('website')
                    .eq('id', lead.company_id)
                    .single()

                if (company?.website) {
                    let domain = company.website.toLowerCase().trim()
                    domain = domain.replace(/^https?:\/\//, '')
                    domain = domain.replace(/^www\./, '')
                    domain = domain.split('/')[0]

                    await supabase
                        .from('dnc_list')
                        .upsert({
                            type: 'company',
                            value: domain,
                            reason: reason || 'Marked from lead',
                            company_name: lead.company_name
                        }, { onConflict: 'type,value' })
                }
            }
        } else {
            // Remove from dnc_list if we are unmarking (optional, but good for consistency)
            if (lead.email) {
                await supabase
                    .from('dnc_list')
                    .delete()
                    .eq('type', 'contact')
                    .eq('value', lead.email.toLowerCase().trim())
            }
            // Note: removing company from dnc_list is riskier as others might be blocked by it
        }

        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error('Error in lead DNC endpoint:', err)
        return NextResponse.json(
            { error: err.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
