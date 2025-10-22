const { createClient } = require('@supabase/supabase-js')
const { Resend } = require('resend')
const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendNotifications() {
  try {
    // Get new blog post files from environment
    const newFiles = process.env.NEW_FILES || ''
    
    if (!newFiles.trim()) {
      console.log('No new blog posts detected')
      return
    }

    const files = newFiles.split('\n').filter(f => f.trim())
    console.log(`Processing ${files.length} new blog post(s)`)

    // Process each new blog post
    for (const filePath of files) {
      console.log(`\nProcessing: ${filePath}`)
      
      // Read the blog post file
      const fullPath = path.join(process.cwd(), filePath)
      
      if (!fs.existsSync(fullPath)) {
        console.error(`File not found: ${fullPath}`)
        continue
      }

      const fileContent = fs.readFileSync(fullPath, 'utf-8')
      
      // Parse frontmatter using gray-matter
      const { data: frontmatter } = matter(fileContent)
      
      const title = frontmatter.title || 'New Blog Post'
      const description = frontmatter.description || frontmatter.excerpt || 'Check out my latest blog post!'
      const date = frontmatter.date || new Date().toISOString()
      const slug = path.basename(filePath, '.mdx')
      const blogUrl = `${process.env.SITE_URL}/blogs/${slug}`

      console.log(`Title: ${title}`)
      console.log(`Slug: ${slug}`)
      console.log(`URL: ${blogUrl}`)

      // Get all active subscribers
      const { data: subscribers, error } = await supabase
        .from('subscribers')
        .select('email')
        .eq('is_active', true)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      if (!subscribers || subscribers.length === 0) {
        console.log('No active subscribers found')
        continue
      }

      console.log(`Found ${subscribers.length} active subscriber(s)`)

      // Send emails (batch of 50 at a time to avoid rate limits)
      const batchSize = 50
      let sentCount = 0

      for (let i = 0; i < subscribers.length; i += batchSize) {
        const batch = subscribers.slice(i, i + batchSize)
        
        const results = await Promise.allSettled(
          batch.map((subscriber) =>
            resend.emails.send({
              from: 'Advith\'s Blog <onboarding@resend.dev>', // Change to your verified domain
              to: subscriber.email,
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
                      .button:hover {
                        background: #000066;
                      }
                      .footer { 
                        background: #f5f5f5;
                        text-align: center; 
                        padding: 20px; 
                        font-size: 12px; 
                        color: #666;
                        border-top: 1px solid #ddd;
                      }
                      .footer a {
                        color: #000080;
                        text-decoration: none;
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
                        <p>
                          <a href="${process.env.SITE_URL}">Visit Website</a> • 
                          <a href="${blogUrl}">View Post</a>
                        </p>
                        <p style="margin-top: 15px; color: #999;">
                          To unsubscribe, please reply to this email.
                        </p>
                      </div>
                    </div>
                  </body>
                </html>
              `,
              text: `
New Blog Post: ${title}

${description}

Read the full post: ${blogUrl}

---
You're receiving this because you subscribed to Advith's blog updates.
              `.trim()
            })
          )
        )

        // Count successful sends
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            sentCount++
          } else {
            console.error(`Failed to send to ${batch[index].email}:`, result.reason)
          }
        })

        console.log(`Sent batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(subscribers.length / batchSize)}`)
      }

      console.log(`✅ Successfully sent ${sentCount}/${subscribers.length} emails for "${title}"`)
    }

    console.log('\n🎉 All notifications sent successfully!')

  } catch (error) {
    console.error('❌ Error sending notifications:', error)
    process.exit(1)
  }
}

sendNotifications()
