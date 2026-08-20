// data/storyChapters.ts
//
// "Story" section on advith.exe's Home tab, below the profile/bio dossier
// (see HomeClient.tsx's Home branch) — a handful of scrollytelling
// "chapters" that continue the same sticky-image scroll mechanic the
// profile photo already uses (sm:sticky sm:top-4 inside an items-start
// flex row): each chapter's image pins in place while that chapter's text
// scrolls past it, then releases once the row ends and the next chapter's
// own sticky image takes over — a natural "stop, then move to the next
// phase" beat as you scroll, without any scroll-snap/IntersectionObserver
// machinery, just the same CSS trick reused per row.
//
// Everything here is a placeholder: lorem ipsum copy and no `image` (see
// StoryChapter['image'] below — undefined renders a plain white-bordered
// rectangle, see HomeClient.tsx). Swap in real titles/paragraphs and an
// `image` path per chapter later; nothing else about the layout needs to
// change to pick that up.

export type StoryChapter = {
  id: string
  title: string
  paragraphs: string[]
  /** Which column the image sits in on wide screens (stacks image-above-text
   *  on narrow/mobile regardless, same as the profile photo row). Alternating
   *  left/right is what gives this its "zig-zag" scrollytelling read. */
  side: 'left' | 'right'
  /** Public path to the chapter's real image, once there is one. Left
   *  undefined for now — HomeClient renders a white-bordered placeholder
   *  rectangle instead (see its `chapter.image` check). */
  image?: string
}

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 'chapter-01',
    title: '[2003 - 2011] ',
    side: 'left',
    paragraphs: [
      'Before I became a 6\'4 giant who struggles to fit his legs within a flight\'s seat allocated legroom, I was a tiny gremlin.',
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
    ],
  },
  {
    id: 'chapter-02',
    title: '[2011 - 2019]',
    side: 'right',
    paragraphs: [
      'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.',
      'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae.',
      'Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est.',
    ],
  },
  {
    id: 'chapter-03',
    title: '[2020 - Present]',
    side: 'left',
    paragraphs: [
      'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus.',
      'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.',
      'Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio, nam libero tempore cum soluta nobis est eligendi optio.',
    ],
  },
]
