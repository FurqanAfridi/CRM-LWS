import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { calculateICPScore } from '@/lib/utils/icp-scoring'

// Use a function to get the client to ensure env vars are read at runtime
function getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

        const offset = parseInt(searchParams.get('offset') || '0')
        const limit = parseInt(searchParams.get('limit') || '50')
        const industry_type = searchParams.get('industry_type')
        const icp_qualified = searchParams.get('icp_qualified')

        const from = offset
        const to = from + limit - 1

        let query = supabase
            .from('companies')
            .select('*')
            .order('created_at', { ascending: false })
            .range(from, to)

        if (industry_type) {
            query = query.eq('industry_type', industry_type)
        }

        if (icp_qualified !== null && icp_qualified !== undefined) {
            const isTrue = icp_qualified === 'true'
            query = query.eq('icp_qualified', isTrue)
        }

        const { data, error } = await query

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

export async function POST(request: Request) {
    try {
        const supabase = getSupabaseClient()
        const company = await request.json()

        const { data, error } = await supabase
            .from('companies')
            .insert(company)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const companyData = data as any

        // Calculate ICP score after creation
        if (companyData) {
            const score = calculateICPScore(companyData)
            await supabase
                .from('companies')
                .update({
                    icp_score: score.totalScore,
                    icp_qualified: score.isQualified,
                    qualification_reason: score.reasons.join('; '),
                })
                .eq('id', companyData.id)
        }

        return NextResponse.json(companyData)
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
