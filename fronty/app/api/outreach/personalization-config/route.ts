import { NextRequest, NextResponse } from 'next/server'
import { getPersonalizationConfig, createPersonalizationConfig, updatePersonalizationConfig } from '@/lib/supabase/queries/outreach'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sequence_id = searchParams.get('sequence_id')
    const step_index = searchParams.get('step_index')

    if (!sequence_id) {
      return NextResponse.json(
        { error: 'sequence_id query parameter is required' },
        { status: 400 }
      )
    }

    const config = await getPersonalizationConfig(
      sequence_id,
      step_index ? parseInt(step_index) : undefined
    )

    return NextResponse.json({
      success: true,
      config: config || null,
    })
  } catch (error: any) {
    console.error('Error fetching personalization config:', error)
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
      sequence_id,
      step_index,
      prompt_template,
      strategy,
      variables,
      enabled = true,
    } = body

    if (!sequence_id || step_index === undefined) {
      return NextResponse.json(
        { error: 'sequence_id and step_index are required' },
        { status: 400 }
      )
    }

    // Check if config exists
    const existing = await getPersonalizationConfig(sequence_id, step_index)

    let config
    if (existing) {
      config = await updatePersonalizationConfig(existing.id, {
        prompt_template: prompt_template !== undefined ? prompt_template : existing.prompt_template,
        strategy: strategy !== undefined ? strategy : existing.strategy,
        variables: variables !== undefined ? variables : existing.variables,
        enabled: enabled !== undefined ? enabled : existing.enabled,
      })
    } else {
      config = await createPersonalizationConfig({
        sequence_id,
        step_index,
        prompt_template: prompt_template || '',
        strategy: strategy || 'moderate',
        variables: variables || {},
        enabled,
      })
    }

    return NextResponse.json({
      success: true,
      config,
      message: 'Personalization config saved successfully',
    })
  } catch (error: any) {
    console.error('Error saving personalization config:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

