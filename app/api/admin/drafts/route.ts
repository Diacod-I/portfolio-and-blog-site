import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const draftsDir = path.join(process.cwd(), 'content/notes/draft_folder');

export async function POST(req: Request) {
  try {
    const { title, slug, content, excerpt, author } = await req.json();
    const date = new Date().toISOString().slice(0, 10);
    const status = 'Draft';
    // Always overwrite with full frontmatter and body
    const mdx = `---\ntitle: "${title}"\ndate: "${date}"\nauthor: "${author || ''}"\nexcerpt: "${excerpt || ''}"\nstatus: "${status}"\n---\n\n${content}\n`;
    const filePath = path.join(draftsDir, `${slug}.mdx`);
    await fs.writeFile(filePath, mdx, 'utf8');
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save draft.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  // Toggle publish/draft: move file and update frontmatter
  try {
    const { slug } = await req.json();
    const notesDir = path.join(process.cwd(), 'content/notes');
    const draftPath = path.join(draftsDir, `${slug}.mdx`);
    const publishedPath = path.join(notesDir, `${slug}.mdx`);
    // Check if file is in draft_folder (Draft) or notes (Published)
    let srcPath, destPath, newStatus;
    if (await fileExists(draftPath)) {
      // Draft -> Publish
      srcPath = draftPath;
      destPath = publishedPath;
      newStatus = 'Published';
    } else if (await fileExists(publishedPath)) {
      // Published -> Draft
      srcPath = publishedPath;
      destPath = draftPath;
      newStatus = 'Draft';
    } else {
      return NextResponse.json({ error: 'File not found.' }, { status: 404 });
    }
    let content = await fs.readFile(srcPath, 'utf8');
    // Update status in frontmatter
    content = content.replace(/status: "(Draft|Published)"/, `status: "${newStatus}"`);
    await fs.writeFile(destPath, content, 'utf8');
    await fs.unlink(srcPath);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to toggle publish/draft.' }, { status: 500 });
  }
}

async function fileExists(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}
