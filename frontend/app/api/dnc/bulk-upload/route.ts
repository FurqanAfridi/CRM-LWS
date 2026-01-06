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
        const formData = await request.formData()

        const file = formData.get('file') as File
        const type = formData.get('type') as string // 'company' or 'contact'
        const valueColumn = formData.get('valueColumn') as string // Column index for domain/email
        const reasonColumn = formData.get('reasonColumn') as string | null // Optional reason column

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        if (!type || !valueColumn) {
            return NextResponse.json(
                { error: 'Type and value column are required' },
                { status: 400 }
            )
        }

        // Read file content
        const text = await file.text()

        // Parse CSV (we'll handle Excel conversion on frontend using a library)
        const rows = parseCSV(text)

        if (rows.length < 2) {
            return NextResponse.json(
                { error: 'File must contain at least a header row and one data row' },
                { status: 400 }
            )
        }

        // Skip header row
        const dataRows = rows.slice(1)
        const valueColIndex = parseInt(valueColumn)
        const reasonColIndex = reasonColumn ? parseInt(reasonColumn) : null

        const results = {
            success: [] as string[],
            failed: [] as { value: string; reason: string }[],
            total: dataRows.length
        }

        // Process each row
        for (const row of dataRows) {
            const value = row[valueColIndex]?.trim()
            if (!value) continue

            const reason = reasonColIndex !== null && row[reasonColIndex]
                ? row[reasonColIndex].trim()
                : 'Added via bulk upload'

            try {
                if (type === 'company') {
                    // Extract domain
                    let domain = value.toLowerCase()
                    domain = domain.replace(/^https?:\/\//, '')
                    domain = domain.replace(/^www\./, '')
                    domain = domain.split('/')[0]

                    // Insert into dnc_list table (this will always succeed)
                    const { error: insertError } = await supabase
                        .from('dnc_list')
                        .upsert({
                            type: 'company',
                            value: domain,
                            reason: reason
                        }, {
                            onConflict: 'type,value',
                            ignoreDuplicates: false
                        })

                    if (insertError) throw insertError

                    // Also try to find and update matching companies
                    const { data: companies } = await supabase
                        .from('companies')
                        .select('id, name, website')
                        .or(`website.ilike.%${domain}%`)
                        .limit(10)

                    if (companies && companies.length > 0) {
                        // Mark as DNC
                        await supabase
                            .from('companies')
                            .update({
                                is_dnc: true,
                                dnc_reason: reason,
                                dnc_date: new Date().toISOString()
                            })
                            .in('id', companies.map(c => c.id))

                        results.success.push(`${domain} (${companies.length} companies updated)`)
                    } else {
                        results.success.push(`${domain} (added to DNC list)`)
                    }

                } else if (type === 'contact') {
                    const email = value.toLowerCase()

                    // Insert into dnc_list table (this will always succeed)
                    const { error: insertError } = await supabase
                        .from('dnc_list')
                        .upsert({
                            type: 'contact',
                            value: email,
                            reason: reason
                        }, {
                            onConflict: 'type,value',
                            ignoreDuplicates: false
                        })

                    if (insertError) throw insertError

                    // Also try to find and update matching contacts
                    const { data: contacts } = await supabase
                        .from('contacts')
                        .select('id, email, first_name, last_name')
                        .ilike('email', email)
                        .limit(10)

                    if (contacts && contacts.length > 0) {
                        // Mark as DNC
                        await supabase
                            .from('contacts')
                            .update({
                                is_dnc: true,
                                dnc_reason: reason,
                                dnc_date: new Date().toISOString()
                            })
                            .in('id', contacts.map(c => c.id))

                        results.success.push(`${email} (${contacts.length} contacts updated)`)
                    } else {
                        results.success.push(`${email} (added to DNC list)`)
                    }
                }
            } catch (err: any) {
                results.failed.push({
                    value,
                    reason: err.message || 'Unknown error'
                })
            }
        }

        return NextResponse.json({
            success: true,
            results
        })

    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
