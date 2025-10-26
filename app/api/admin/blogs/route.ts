import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

export async function GET() {
  try {
    const notesDir = path.join(process.cwd(), 'content/notes');
    const draftsDir = path.join(notesDir, 'draft_folder');
    // Read published
    const files = await fs.readdir(notesDir);
    const mdxFiles = files.filter(f => f.endsWith('.mdx'));
    // Read drafts
    let draftFiles: string[] = [];
    try {
      draftFiles = await fs.readdir(draftsDir);
    } catch {}
    const draftMdxFiles = draftFiles.filter(f => f.endsWith('.mdx'));
    // Parse published
    const publishedBlogs = await Promise.all(
      mdxFiles.map(async (file) => {
        const filePath = path.join(notesDir, file);
        const raw = await fs.readFile(filePath, 'utf8');
        const { data, content } = matter(raw);
        return {
          id: file,
          title: data.title || file.replace(/\.mdx$/, ''),
          slug: file.replace(/\.mdx$/, ''),
          date: data.date || '',
          author: data.author || '',
          excerpt: data.excerpt || '',
          status: data.status || 'Published',
          content,
        };
      })
    );
    // Parse drafts
    const draftBlogs = await Promise.all(
      draftMdxFiles.map(async (file) => {
        const filePath = path.join(draftsDir, file);
        const raw = await fs.readFile(filePath, 'utf8');
        const { data, content } = matter(raw);
        return {
          id: file,
          title: data.title || file.replace(/\.mdx$/, ''),
          slug: file.replace(/\.mdx$/, ''),
          date: data.date || '',
          author: data.author || '',
          excerpt: data.excerpt || '',
          status: data.status || 'Draft',
          content,
        };
      })
    );
    const blogs = [...publishedBlogs, ...draftBlogs];
    blogs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return NextResponse.json({ blogs });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch blogs.' }, { status: 500 });
  }
}
