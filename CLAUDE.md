# Week 1: Break the Peg

Part of [Hemera](https://www.hemera.one), one project a week. This week's question:

> Why did a stable coin worth $18 billion fall to zero in a week, and could anything have saved it?

It ships by Sunday 15 November, 23:59 Paris time. The week is done only when the question has an
answer, a number or a demo, written at the top of README.md and on the site.

## How we work

Kaloyan is here to learn. By Sunday he should understand the concept well enough to explain it on X
and TikTok without notes. That comes before speed: when doing it all and letting him learn conflict,
let him learn.

- Claude does the hard development: the engine, the data, the tests, the deployment.
- Kaloyan builds the page. Don't write the visible UI for him unless he asks. Prepare what he needs
  (data, well-named functions, a running skeleton), then guide him one small step at a time.
- He studies the concept on his own, with other tools. Don't lecture or quiz him. When he asks,
  answer briefly, and always make clear how the code maps to the concept.
- No number goes on the site, X or TikTok without a source. Say so when a figure isn't verified.
- `NOTES.md` is his private notebook, in French, and git ignores it. Keep its sections current with
  him: the concept, what's understood, what's still unclear, figures with sources, progress, and
  what to tell on X and TikTok.
- End every session with where things stand: what moved, what he can now explain, what comes next.

## Rules

- Talk to Kaloyan in French, with "tu". Code, commits, README and the site are in English, for an
  American audience: this repo is public.
- Zero running cost. The site is a static export (`output: "export"`): no server functions, no API
  routes, no Vercel crons, no image optimisation, no paid API at runtime. AI runs in the browser or
  is computed ahead of time and committed as data.
- Keep data lean (compressed, under 20 MB in all): the bandwidth is shared with every other week.
- Commit small with clear messages, and push at the end of every session: each night a job writes
  the public journal on hemera.one from the day's pushed commits.
- Pushing to `main` deploys to https://w01.hemera.one.
- Next.js 16 changed a lot: read `node_modules/next/dist/docs/` before writing Next code.
- The week's facts (title, question, deadline) are in `src/week.ts`.
