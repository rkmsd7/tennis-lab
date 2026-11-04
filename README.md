# Tennis Lab

A static, JSON-driven tennis encyclopedia: rackets, grips, accessories, every Open Era Grand Slam champion, a head-to-head rivalry cross-table that opens categorised YouTube archives, animated signature shots, 2026 tournaments and ATP/WTA rankings.

- Spec: [TENNIS_SITE_SPEC.md](TENNIS_SITE_SPEC.md)
- Run locally: `node serve.js` → http://localhost:4177
- Content lives in `data/*.json`; pages are plain HTML + vanilla JS, no build step.
- Deployed on Vercel with clean URLs (`vercel.json`).

## Updating content
- Rankings: edit `data/rankings.json` (`asOf` + the two arrays).
- Tournaments / results: `data/tournaments.json`.
- Players: `data/players.json` (featured players carry `shots`, which reference animation types in `data/shots.json`).
- Rivalries: `data/rivalries.json` — add meetings as `{year, event, round, winner, score}`; the site derives the category from the event name.
