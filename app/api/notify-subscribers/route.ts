import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { blogSlug } = await request.json()

    if (!blogSlug) {
      return NextResponse.json(
        { error: 'Blog slug is required' },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    // Read the blog post file
    const blogPath = path.join(process.cwd(), 'content', 'notes', `${blogSlug}.mdx`)
    
    if (!fs.existsSync(blogPath)) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    const fileContent = fs.readFileSync(blogPath, 'utf-8')
    const { data: frontmatter } = matter(fileContent)

    const title = frontmatter.title || 'New Blog Post'
    const description = frontmatter.description || frontmatter.excerpt || 'Check out my latest blog post!'
    const date = frontmatter.date || new Date().toISOString()
    const blogUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blogs/${blogSlug}`

    // Get all active subscribers
    const { data: subscribers, error } = await supabase
      .from('subscribers')
      .select('email')
      .eq('is_active', true)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscribers' },
        { status: 500 }
      )
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No active subscribers found' },
        { status: 400 }
      )
    }

    // Send emails in batches
    const batchSize = 50
    let sentCount = 0

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize)
      
      const results = await Promise.allSettled(
        batch.map(({ email }) =>
          resend.emails.send({
            from: 'Advith\'s Blog <onboarding@resend.dev>',
            to: email,
            subject: `📝 New Blog Post: ${title}`,
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body { 
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                      line-height: 1.6; 
                      color: #333;
                      margin: 0;
                      padding: 0;
                      background-color: #f5f5f5;
                    }
                    .container { 
                      max-width: 600px; 
                      margin: 0 auto; 
                      background: white;
                    }
                    .header { 
                      background: #000080; 
                      color: white; 
                      padding: 30px 20px; 
                      text-align: center;
                      border-bottom: 3px solid #000;
                    }
                    .header h1 {
                      margin: 0;
                      font-size: 24px;
                    }
                    .content { 
                      padding: 30px 20px;
                    }
                    .content h2 {
                      color: #000080;
                      margin-top: 0;
                      font-size: 22px;
                    }
                    .content p {
                      margin: 15px 0;
                      color: #555;
                    }
                    .button { 
                      display: inline-block; 
                      background: #000080; 
                      color: white !important; 
                      padding: 14px 28px; 
                      text-decoration: none; 
                      margin: 20px 0;
                      font-weight: bold;
                      border-radius: 4px;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }
                    .footer { 
                      background: #f5f5f5;
                      text-align: center; 
                      padding: 20px; 
                      font-size: 12px; 
                      color: #666;
                      border-top: 1px solid #ddd;
                    }
                    .date {
                      color: #888;
                      font-size: 14px;
                      margin-bottom: 15px;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>📝 New Blog Post!</h1>
                    </div>
                    <div class="content">
                      <h2>${title}</h2>
                      <p class="date">${new Date(date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                      <p>${description}</p>
                      <center>
                        <a href="${blogUrl}" class="button">Read Full Post →</a>
                      </center>
                    </div>
                    <div class="footer">
                      <p>You're receiving this because you subscribed to Advith's blog updates.</p>
                      <p style="margin-top: 15px; color: #999;">
                        To unsubscribe, please reply to this email.
                      </p>
                    </div>
                  </div>
                </body>
              </html>
            `,
          })
        )
      )

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          sentCount++
        }
      })
    }

    return NextResponse.json({ 
      success: true,
      count: sentCount,
      total: subscribers.length
    })

  } catch (error) {
    console.error('Notify API error:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}
