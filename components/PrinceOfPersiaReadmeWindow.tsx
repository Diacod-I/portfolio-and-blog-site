'use client'

// A Notepad-flavored "readme" for the Prince of Persia app (see its
// Controls button) — plain monospace text on white, like actually opening
// a .txt file in Notepad. Controls per StrategyWiki's Prince of Persia
// controls page, cross-checked against the original manual.

const README = `POP.TXT

Pause ............... Esc
Show time left ...... Space
Restart level ....... Ctrl + A
Restart game ........ Ctrl + R

MOVEMENT
Walk / run ......... Left / Right arrow
Climb up / jump ..... Up arrow
Crouch / climb down . Down arrow
Careful walk ........ Shift + Left / Right arrow

SHIFT
Hang on ledge ....... Shift (release to fall)
Pick up item ........ Shift
Drink potion ........ Shift
Draw sword / strike . Shift

SWORD FIGHTING
Block ............... Up arrow
Strike .............. Shift
Sheathe sword ....... Down arrow
`

export default function PrinceOfPersiaReadmeWindow() {
  return (
    <div className="win98-window-content bg-white flex-1 min-h-0 overflow-y-auto p-3">
      <pre className="font-mono text-xs font-semibold text-black whitespace-pre-wrap leading-relaxed m-0">
        {README}
      </pre>
    </div>
  )
}
