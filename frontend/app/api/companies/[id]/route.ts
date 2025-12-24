import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { calculateICPScore } from '@/lib/utils/icp-scoring'

function getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables')
    }

    return createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
    })
}

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getSupabaseClient()
        const { id } = params

        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 404 })
        }

        return NextResponse.json(data)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getSupabaseClient()
        const { id } = params
        const updates = await request.json()

        const { data, error } = await supabase
            .from('companies')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const companyData = data as any

        // Recalculate ICP score if relevant fields changed
        if (companyData && (updates.location_count !== undefined ||
            updates.employee_count !== undefined ||
            updates.revenue_range !== undefined ||
            updates.industry_type !== undefined)) {

            const score = calculateICPScore(companyData)
            await supabase
                .from('companies')
                .update({
                    icp_score: score.totalScore,
                    icp_qualified: score.isQualified,
                    qualification_reason: score.reasons.join('; '),
                })
                .eq('id', id)
        }

        return NextResponse.json(companyData)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getSupabaseClient()
        const { id } = params

        const { error } = await supabase
            .from('companies')
            .delete()
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
