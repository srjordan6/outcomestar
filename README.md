# outcomestar

Public showcase site for OutcomeStar — one URL per student under `/[slug]`.
Reads canonical data from the FOCMS database via the public WP feed (v0.1),
moving to direct `focms-api` endpoints in v0.2.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS with a project-specific token system
- Inter / Inter Tight / JetBrains Mono via Google Fonts
- Hosted on Render (`outcomestar` Web Service), domain `outcomestar.app`

## Routes

| Path | What it is |
|------|------------|
| `/` | Marketing homepage + portfolio index |
| `/john` | John Ray Jordan's portfolio |
| `/[slug]` | Any future student. Add a record to `STUDENTS` in `lib/focms.ts`. |

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000/john>.

## Render deployment

The repo is wired to deploy automatically on push to `main`.

| Setting | Value |
|---------|-------|
| Service type | Web Service |
| Runtime | Node |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Plan | Starter |
| Env vars | `FOCMS_FEED_URL` (optional override) |

After first deploy succeeds, point `outcomestar.app` and `www.outcomestar.app`
at the Render service via custom-domain DNS records.

## Adding a new student

1. Open `lib/focms.ts`.
2. Add an entry to `STUDENTS` with the slug, display name, class year, birth
   date, and the map of first-ever event times (used to compute Drop and %).
3. Make sure the student's swim bests are available in the FOCMS feed.
4. Visit `/{slug}` — the page is generated.

## Roadmap

- v0.1 (now): swim record from WP feed
- v0.2: direct `focms-api` endpoints replace WP feed dependency
- v0.3: reading log, awards, biometrics — one section at a time
- v0.4: parent portal under `/portal` (separate route group, auth-gated)
- v0.5: capture app under `/capture`
