# Tennis Lab — Website Specification

> A single markdown brief that a developer (or Claude Code) can build from. The site is a static, JSON-driven tennis encyclopedia: rackets, grips, accessories, players, rivalries with video archives, animated signature shots, tournaments and live-ish rankings.

## 1. Goals

- One clean, fast site that covers **equipment** (rackets, grips, accessories), **people** (every Open Era Grand Slam champion, men and women, plus fan favourites like Gaël Monfils), **matches** (a head-to-head cross-table that opens a categorised YouTube archive for any two players) and **technique** (each player's best shots as step-by-step animations that show unit turn, leg load, swing path and the grip used).
- No build step. Plain HTML + CSS + vanilla JS, content in `data/*.json`, deployable on Vercel as a static site.

## 2. Navigation

| Nav item     | Page               | Purpose                                                                |
|--------------|--------------------|------------------------------------------------------------------------|
| Home         | `index.html`       | Hero, what's happening now on tour, entry cards to every section       |
| Rackets      | `rackets.html`     | Racket types, specs explained, what the pros use, how to choose         |
| Grip         | `grip.html`        | Continental, Eastern, Semi-Western, Western, 1HBH, 2HBH with bevel diagrams, shots per grip, pros who use them |
| Accessories  | `accessories.html` | Bag checklist: strings, overgrips, dampeners, shoes, balls, recovery   |
| Players      | `players.html`     | Men/Women toggle, champion cards, the **cross-table** (head-to-head video archive) |
| Player       | `player.html?id=…` | Profile, Slam breakdown, equipment, **signature shots with animations** |
| Tournaments  | `tournaments.html` | 2026 calendar, what is on now, Slam results, Masters/1000 winners       |
| Rankings     | `rankings.html`    | ATP and WTA top 20 snapshot with date stamp and links to official lists |

## 3. Players section

### 3.1 Roster
- **Every Open Era (1968+) Grand Slam singles champion**, men and women, as a card: name, country, Slam count by major, era.
- **Featured players** get a full profile and signature shots: Federer, Nadal, Djokovic, Murray, Wawrinka, Sampras, Agassi, Borg, McEnroe, Connors, Lendl, Becker, Edberg, Wilander, Del Potro, Thiem, Medvedev, Alcaraz, Sinner, Zverev, Monfils (no Slam; included on request); Serena & Venus Williams, Graf, Navratilova, Evert, Seles, Henin, Sharapova, Osaka, Świątek, Sabalenka, Barty, Gauff, Rybakina, Andreeva.
- Filters: tour (ATP / WTA), era (Classic 1968–1999 / Golden 2000–2019 / Modern 2020+), search.

### 3.2 Cross-table (head-to-head archive)
- A grid with the same players on rows and columns. Each cell = one rivalry.
- Cell shows the overall head-to-head where known (e.g. "Nadal 24–16") or "watch" when unknown.
- Clicking a cell opens a panel with the archive **categorised**:
  1. Grand Slams (Australian Open, Roland Garros, Wimbledon, US Open)
  2. Olympics
  3. Davis Cup / Billie Jean King Cup / Laver Cup
  4. Masters 1000 / WTA 1000 and Tour Finals
  5. Other (ATP 500/250, exhibitions, full matches)
- Each category lists **curated meetings** (year, round, winner, score) where we have them, each with a YouTube link, plus a generic "all highlights" YouTube search link so every combination works even without curation.
- Default view shows featured players; a toggle expands to all champions.

### 3.3 Player profile
- Header: name, flag, hand, backhand type, Slam totals by major, Olympics, weeks at No. 1, playing style.
- Equipment: racket, strings, tension, grips (forehand / backhand / serve).
- **Signature shots**: a card per shot with an animated SVG figure stepping through five phases (ready → unit turn → load/drop → contact → finish), a top-down stance footprint (feet + shoulder line), the grip used, footwork cues, and a "replicable for club players" rating. Play / pause / scrub.
- Video rail: YouTube searches for best points, best shots, slow-motion, and full matches.

## 4. Grip section
- Six grips: Continental, Eastern forehand, Semi-Western, Western, Eastern backhand (one-hander), Two-handed backhand (Continental bottom + Semi-Western/Eastern top).
- For each: bevel diagram (octagonal handle, bevels numbered 1–8, index knuckle and heel pad highlighted), shots it is used for, pros/cons, contact height, who uses it.
- A "which grip for which shot" matrix.

## 5. Rackets section
- Categories: power (oversize, light), control (player's frames), tweener/modern, junior.
- Specs explained: head size, weight, balance, swingweight, stiffness (RA), beam, string pattern, grip size.
- What the pros use (from the players data) and how to pick one by level.

## 6. Accessories section
- Must-haves, nice-to-haves, and the pro's bag checklist (strings, overgrips, dampeners, shoes by surface, balls, hydration, sun, recovery, medical).

## 7. Tournaments & rankings
- `tournaments.json`: 2026 Slams with champions and finals, Masters 1000 / WTA 1000 winners, season-ending events with dates. Home page computes "happening now / next up" from today's date.
- `rankings.json`: ATP and WTA top 20 with an `asOf` date; page links to official ATP/WTA ranking pages.

## 8. Data model (`data/`)
- `players.json` — `{ id, name, country, flag, tour, hand, backhand, born, slams:{ao,rg,w,uso}, olympics, weeksNo1, era, featured, style, bio, grip:{fh,bh,serve}, racket, strings, shots:[{type, name, grip, stance, cues[], replicable, why}] }`
- `shots.json` — animation library keyed by shot type: `{ label, summary, phases:[{ name, caption, pose, footprint, ball }], mistakes[] }`
- `rivalries.json` — `{ a, b, h2h, slamH2h, meetings:[{ year, event, category, round, winner, score }] }`
- `grips.json`, `rackets.json`, `accessories.json`, `tournaments.json`, `rankings.json`.

## 9. Design
- Dark court theme: deep navy background, clay-orange and grass-green accents, white chalk lines. Inter / system font. Mobile-first, 16px gutters, no horizontal scroll (cross-table scrolls inside its own container with sticky headers).

## 10. Deployment
- `node serve.js` for local preview; `vercel.json` with clean URLs; GitHub repo `rkmsd7/tennis-lab`; Vercel project `tennis-lab`.
