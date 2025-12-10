import { NextRequest, NextResponse } from 'next/server'
import { getBookingTemplates, createBookingTemplate, updateBookingTemplate, deleteBookingTemplate } from '@/lib/supabase/queries/outreach'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')

    const templates = await getBookingTemplates(provider || undefined)

    return NextResponse.json({
      success: true,
      templates,
    })
  } catch (error: any) {
    console.error('Error fetching booking templates:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      provider,
      template_url,
      variables,
      is_default = false,
    } = body

    if (!name || !provider || !template_url) {
      return NextResponse.json(
        { error: 'name, provider, and template_url are required' },
        { status: 400 }
      )
    }

    if (!['calendly', 'google', 'outlook'].includes(provider)) {
      return NextResponse.json(
        { error: 'provider must be one of: calendly, google, outlook' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults for this provider
    if (is_default) {
      const existingTemplates = await getBookingTemplates(provider)
      for (const template of existingTemplates) {
        if (template.is_default) {
          await updateBookingTemplate(template.id, { is_default: false })
        }
      }
    }

    const template = await createBookingTemplate({
      name,
      provider,
      template_url,
      variables: variables || {},
      is_default,
    })

    return NextResponse.json({
      success: true,
      template,
      message: 'Booking template created successfully',
    })
  } catch (error: any) {
    console.error('Error creating booking template:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      name,
      provider,
      template_url,
      variables,
      is_default,
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults for this provider
    if (is_default) {
      const template = await getBookingTemplates(provider)
      for (const t of template) {
        if (t.is_default && t.id !== id) {
          await updateBookingTemplate(t.id, { is_default: false })
        }
      }
    }

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (template_url !== undefined) updates.template_url = template_url
    if (variables !== undefined) updates.variables = variables
    if (is_default !== undefined) updates.is_default = is_default

    const template = await updateBookingTemplate(id, updates)

    return NextResponse.json({
      success: true,
      template,
      message: 'Booking template updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating booking template:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      )
    }

    await deleteBookingTemplate(id)

    return NextResponse.json({
      success: true,
      message: 'Booking template deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting booking template:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

