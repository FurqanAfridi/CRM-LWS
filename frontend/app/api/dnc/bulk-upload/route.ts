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

// Helper function to parse CSV
function parseCSV(text: string): string[][] {
    const lines = text.split('\n').filter(line => line.trim())
    return lines.map(line => {
        // Handle quoted fields and commas within quotes
        const result: string[] = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
            const char = line[i]

            if (char === '"') {
                inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim())
                current = ''
            } else {
                current += char
            }
        }
        result.push(current.trim())

        return result.map(field => field.replace(/^["']|["']$/g, '').trim())
    })
}

export async function POST(request: Request) {
    try {
        const supabase = getSupabaseClient()

        // Handle both FormData (file) and JSON (batches)
        const contentType = request.headers.get('content-type') || ''

        let dataRows: string[][] = []
        let type = 'company'
        let valueColIndex = 0
        let reasonColIndex: number | null = null

        if (contentType.includes('application/json')) {
            const body = await request.json()
            dataRows = body.rows
            type = body.type
            valueColIndex = body.valueColumn || 0
            reasonColIndex = body.reasonColumn !== undefined ? body.reasonColumn : null
        } else {
            const formData = await request.formData()
            const file = formData.get('file') as File
            type = formData.get('type') as string // 'company' or 'contact'
            const valueColumn = formData.get('valueColumn') as string // Column index
            const reasonColumn = formData.get('reasonColumn') as string | null

            if (!file) {
                return NextResponse.json({ error: 'No file provided' }, { status: 400 })
            }

            const text = await file.text()
            const rows = parseCSV(text)
            if (rows.length < 2) {
                return NextResponse.json({ error: 'File empty or missing headers' }, { status: 400 })
            }
            dataRows = rows.slice(1) // Skip header
            valueColIndex = parseInt(valueColumn)
            reasonColIndex = reasonColumn ? parseInt(reasonColumn) : null
        }

        const stats = {
            total: dataRows.length,
            added: 0,
            duplicates: 0,
            failed: 0,
            scrubbed: 0,
            details: [] as any[]
        }

        // Process in small batches or individually with robust error handling
        for (const row of dataRows) {
            const rawValue = row[valueColIndex]?.trim()
            if (!rawValue) {
                stats.total--
                continue
            }

            const reason = reasonColIndex !== null && row[reasonColIndex]
                ? row[reasonColIndex].trim()
                : 'Added via bulk upload'

            try {
                let value = rawValue.toLowerCase()
                if (type === 'company') {
                    value = value.replace(/^https?:\/\//, '')
                    value = value.replace(/^www\./, '')
                    value = value.split('/')[0]
                }

                // Check if already exists in dnc_list
                const { data: existing } = await supabase
                    .from('dnc_list')
                    .select('id')
                    .eq('type', type)
                    .eq('value', value)
                    .single()

                if (existing) {
                    stats.duplicates++
                    continue
                }

                // Insert into dnc_list
                const { error: insertError } = await supabase
                    .from('dnc_list')
                    .insert({
                        type,
                        value,
                        reason
                    })

                if (insertError) {
                    if (insertError.code === '23505') {
                        stats.duplicates++
                        continue
                    }
                    throw insertError
                }

                stats.added++

                // SCRUBBING: Mark matching records in main tables
                if (type === 'company') {
                    const { data: companies } = await supabase
                        .from('companies')
                        .select('id')
                        .or(`website.ilike.%${value}%`)

                    if (companies && companies.length > 0) {
                        const { error: updateError } = await supabase
                            .from('companies')
                            .update({
                                is_dnc: true,
                                dnc_reason: reason,
                                dnc_date: new Date().toISOString()
                            })
                            .in('id', companies.map(c => c.id))

                        if (!updateError) stats.scrubbed += companies.length
                    }
                } else {
                    const { data: contacts } = await supabase
                        .from('contacts')
                        .select('id')
                        .ilike('email', value)

                    if (contacts && contacts.length > 0) {
                        const { error: updateError } = await supabase
                            .from('contacts')
                            .update({
                                is_dnc: true,
                                dnc_reason: reason,
                                dnc_date: new Date().toISOString()
                            })
                            .in('id', contacts.map(c => c.id))

                        if (!updateError) stats.scrubbed += contacts.length
                    }
                }

            } catch (err: any) {
                stats.failed++
                stats.details.push({ value: rawValue, error: err.message })
            }
        }

        return NextResponse.json({
            success: true,
            stats
        })

    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
