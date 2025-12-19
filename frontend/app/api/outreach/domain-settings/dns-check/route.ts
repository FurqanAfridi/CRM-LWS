import { NextRequest, NextResponse } from 'next/server'

// n8n webhook URL for DNS check
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_DNS_CHECK || 'http://auto.lincolnwaste.co/webhook/DNSResolve'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain } = body

    if (!domain) {
      return NextResponse.json(
        { error: 'domain is required in request body' },
        { status: 400 }
      )
    }

    // Call n8n webhook for DNS validation
    const webhookPayload = { domain }
    const dnsResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    })

    if (!dnsResponse.ok) {
      let errorData: any = {}
      try {
        errorData = await dnsResponse.json()
      } catch (e) {
        const text = await dnsResponse.text()
        errorData = { error: text || 'Failed to check DNS records' }
      }
      return NextResponse.json(
        { error: errorData?.error || errorData?.message || 'Failed to check DNS records' },
        { status: dnsResponse.status }
      )
    }

    const dnsData = await dnsResponse.json()

    return NextResponse.json({
      success: true,
      domain,
      dns_records: {
        spf: dnsData?.spf_status || null,
        dkim: dnsData?.dkim_status || null,
        dmarc: dnsData?.dmarc_status || null,
        mx: dnsData?.mx_records || null,
      },
      last_checked: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error checking DNS:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

