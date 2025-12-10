import { NextRequest, NextResponse } from 'next/server'

// n8n webhook URL for DNS check
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_DNS_CHECK || 'https://auto.lincolnwaste.co/webhook/[id]'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')

    if (!domain) {
      return NextResponse.json(
        { error: 'domain query parameter is required' },
        { status: 400 }
      )
    }

    // Call n8n webhook for DNS validation
    const dnsResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    })

    if (!dnsResponse.ok) {
      const errorData = await dnsResponse.json()
      return NextResponse.json(
        { error: errorData?.error || 'Failed to check DNS records' },
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

