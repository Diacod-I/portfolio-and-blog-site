// data/bootLog.ts
// Replaces the old "Story" scrollytelling section (data/storyChapters.ts,
// now deleted) below the profile dossier + Experience section on advith.exe's
// Home tab — see components/HomeClient.tsx's homeQueryDone-gated block.
//
// Instead of a prose life-story (chronological, "birth year to present" —
// explicitly what this was built to avoid), this reads as a fake kernel
// boot log: the same facts a bio paragraph would cover, but as system
// events with no dates attached. Doubles as the "result set" for the
// Home tab's own typed "$ >" query (HOME_QUERY_TEXT: `select about from
// devs where name='Advith Krishnan';`) — this is what that query "returns".
//
// Deliberately generic where the Experience section (data/experience.ts)
// is already specific: no employer names here (NASA/ETH Zurich/etc. are
// already spelled out there, right above this) — this just gestures at
// *kinds* of experience ("prof_experience adapters") so the two sections
// tell the same story from different altitudes instead of repeating each
// other.
//
// `status` drives the trailing tag's color in ImageExhibition.tsx's... no,
// see components/HomeClient.tsx's boot-log render block: 'ok' → green,
// 'warn' → amber, undefined → no tag, line ends as plain text.
export type BootLogLine = {
  time: string
  message: string
  status?: 'ok' | 'warn'
}

export const BOOT_LOG_LINES: BootLogLine[] = [
  { time: '0.000000', message: "advith_krishnan.sys booting..." },
  { time: '0.000041', message: 'Initializing CURIOSITY.drv...', status: 'ok' },
  { time: '0.083211', message: 'Detected 1x sense of humor (integrated, not user-serviceable)' },
  { time: '0.211004', message: 'Loading KERNEL_INTERNALS.ko...', status: 'ok' },
  { time: '0.398650', message: 'Loading COMPILER_THEORY.ko...', status: 'ok' },
  { time: '0.552013', message: 'Loading ML_BACKENDS.ko...', status: 'ok' },
  { time: '1.204221', message: 'Mounting /prof_experience adapters...', status: 'ok' },
  { time: '1.900431', message: "Spawning child process: warthog (no numpy, no pytorch, no fear)" },
  { time: '2.316500', message: 'Publishing research to /var/log/conferences...', status: 'ok' },
  { time: '2.881442', message: 'caffeine buffer underrun', status: 'warn' },
  { time: '3.402009', message: 'Calibrating STUBBORNNESS.drv (target: never give up on a bug)...', status: 'ok' },
  { time: '3.900112', message: 'Swapping WINDOWS.ko for ARCH_LINUX.ko, reason: "why not"...', status: 'ok' },
  { time: '4.550300', message: 'All systems nominal.' },
  { time: '4.550301', message: 'Now accepting visitors.' },
]
