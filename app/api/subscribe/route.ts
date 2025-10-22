import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Subscription service is not configured' },
        { status: 503 }
      )
    }

    // Check if already subscribed
    const { data: existing, error: checkError } = await supabase
      .from('subscribers')
      .select('email')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (checkError) {
      console.error('Supabase check error:', checkError)
      return NextResponse.json(
        { error: 'Failed to check subscription status.' },
        { status: 500 }
      )
    }

    if (existing) {
      return NextResponse.json(
        { 
          success: true,
          alreadySubscribed: true,
          message: 'You\'re already subscribed! 🎉' 
        },
        { status: 200 }
      )
    }

    // Add subscriber
    const { error: insertError } = await supabase
      .from('subscribers')
      .insert({
        email: email.toLowerCase(),
        subscribed_at: new Date().toISOString(),
        is_active: true,
      })

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      
      // Check if it's a duplicate key error (race condition)
      if (insertError.code === '23505') {
        return NextResponse.json(
          { 
            success: true,
            alreadySubscribed: true,
            message: 'You\'re already subscribed! 🎉' 
          },
          { status: 200 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Successfully subscribed!'
    })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
