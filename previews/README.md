# Showcase previews — what survived, and the rule going forward

## The Drop
`the-drop/jrj-the-drop-3d_v2.html` is the signature hero built in the
2026-08-23/24 session: John's swim events as 3D towers standing at his first
recorded time, falling to his current best while the time on each one counts
down and the headline counts up the seconds gained. Camera sweeps the row as
the towers land. `_v1` is the earlier pass without per-tower labels.

Open it directly in a browser. Self-contained, Three.js from CDN, data
hardcoded from the API as it stood that night (19 events, 356.9 s total).

This file is the source for `app/[slug]/TheDrop.tsx`, which renders the same
scene from live section data.

## What did not survive
The 30 full-page templates (`templates/index.html` and one page per theme),
the "Start here" review notes, and the avatar gallery were written to the
session sandbox's outputs folder and never copied anywhere durable. The
sandbox is destroyed between sessions. They are gone. What they encoded now
lives in code: `lib/heroForm.ts` (which form each theme gets),
`lib/showcaseKit.ts` (archetype treatments), `app/[slug]/HeroStage.tsx`
(column / tower / orbit / paper), `lib/avatarTokens.ts`.

## Rule
Anything built for review — mockups, previews, generated pages — is written
to `C:\NorthStar\outcomestar-git\previews\<name>\` and committed in the same
session, before the session ends. Chat attachments and sandbox output folders
are not storage.
