import Link from 'next/link'
import { format } from 'date-fns'
import { getRecentNotes } from '@/app/actions/getRecentNotes'

export default async function RecentNotes() {
  const notes = await getRecentNotes()

  if (notes.length === 0) {
    return <div className="text-sm">No recent blogs to show. Advith is writing them :)</div>
  }

  return (
    <div className="grid border-2 overflow-y-auto max-h-[235px]">
      {notes.map((note) => (
        <Link
          key={note.slug}
          href={`/notes/${note.slug}`}
          className="win98-button p-2 flex flex-col gap-1 no-underline text-black font-bold"
        >
          <div className="flex items-center gap-2">
            <img src="/win98/notes.png" alt="" className="w-5 h-5" />
            <div className="text-md">{note.title}</div>
          </div>
          {note.excerpt && (
            <div className="text-xs text-[#444]">{note.excerpt}</div>
          )}
          <div className="text-xs text-[#666]">
            {format(new Date(note.date), 'MMM dd, yyyy')}
          </div>
        </Link>
      ))}
    </div>
  )
}
