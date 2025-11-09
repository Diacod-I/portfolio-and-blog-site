import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// Initialize Resend with API key (use dummy key if not set during build)
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build')

// Simple in-memory rate limiting (resets on server restart)
// For production, use Redis or a proper rate limiting service
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(identifier: string, maxRequests = 3, windowMs = 60000): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

export async function POST(request: Request) {
  // Check if API key is actually set at runtime
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_dummy_key_for_build') {
    console.error('RESEND_API_KEY is not set')
    return NextResponse.json(
      { error: 'Email service is not configured. Please contact the site administrator.' },
      { status: 500 }
    )
  }
  try {
    const { name, email, subject, message } = await request.json()

    // Rate limiting: max 3 submissions per email per minute
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: 'Too many requests. Try again tomorrow.' },
        { status: 429 }
      )
    }

    // Basic validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400 }
      )
    }

    // Send confirmation email to the user
    await resend.emails.send({
      from: 'Advith Krishnan <onboarding@resend.dev>',
      to: email,
      subject: 'Thanks for contacting me!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #000080;">Thanks for reaching out, ${name}!</h2>
          <p>I've received your message and will get back to you as soon as possible.</p>
          
          <div style="background-color: #f0f0f0; padding: 15px; margin: 20px 0; border-left: 4px solid #000080;">
            <p><strong>Your message:</strong></p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p>${message}</p>
          </div>
          
          <p>Best regards,<br/>Advith Krishnan</p>
          
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #ccc;" />
          <p style="font-size: 12px; color: #666;">
            This is an automated confirmation email. Please do not reply to this message.
          </p>
        </div>
      `,
    })

    // Send notification email to yourself
    await resend.emails.send({
      from: 'Contact Form <onboarding@resend.dev>',
      to: 'advithkrishnan@gmail.com', // Your email
      replyTo: email, // Allow direct reply to the sender
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #000080;">New Contact Form Submission</h2>
          
          <div style="background-color: #f0f0f0; padding: 15px; margin: 20px 0;">
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="background-color: #fff; padding: 15px; border: 1px solid #ddd;">
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          
          <p style="margin-top: 20px;">
            <a href="mailto:${email}" style="background-color: #000080; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              Reply to ${name}
            </a>
          </p>
        </div>
      `,
    })

    return NextResponse.json(
      { success: true, message: 'Message sent successfully!' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    )
  }
}
