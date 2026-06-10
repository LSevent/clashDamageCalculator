# Clash Damage Calculator

## Overview

Clash Damage Calculator is an unofficial Clash of Clans planning tool for
checking whether selected hero equipment and Earthquake Spells can destroy a
loaded building target.

The MVP uses local, versioned TypeScript data. It shows direct damage, spell
damage, remaining HP, overkill, source-by-source details, and the minimum number
of Earthquakes needed for a selected setup.

## Features

- Building damage calculator with target HP and level details
- Giant Arrow target multiplier support
- Equipment and spell damage breakdown
- Diminishing repeated Earthquake damage
- Minimum Earthquake calculation
- Other target results showing what else the selected combo can destroy
- Manual progress saved in the browser
- Optional user-provided JSON import with preview before saving
- Patch history, verification status, sources, and data coverage dashboard
- Responsive layouts for desktop and mobile

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Vitest
- `localStorage` for MVP progress persistence

## Getting Started

Requirements:

- Node.js
- npm

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

```bash
npm run dev       # Start the development server
npm run lint      # Run ESLint
npm run typecheck # Run TypeScript without emitting files
npm test          # Run the Vitest suite once
npm run build     # Create a production build
npm start         # Start the production server after building
```

## Project Structure

```text
app/                         Next.js pages and global layout
components/                  Shared app shell components
src/components/calculator/   Calculator inputs and results
src/components/progress/     Manual progress and JSON import UI
src/components/data-manager/ Patch and static-data dashboard
src/components/ui/           Reusable presentation components
src/data/game/               Versioned local game data
src/lib/game/                Pure calculations, import, storage, and audit logic
src/types/game/              Game, calculator, import, and progress types
```

## Completed Development Phases

1. Project setup and responsive base layout
2. Static game data structure and object ID allowlist
3. Pure TypeScript damage calculation engine
4. Calculator UI
5. Manual progress setup with local storage
6. Optional JSON import with preview
7. Data Manager and patch tracking
7.5. Current verified gear, spell, and balance checkpoints
8. MVP polish, tests, and documentation
8.5. Other target results card

## Data Sources And Verification

Game values are stored in `src/data/game` and associated with patch IDs and
source URLs when available. Official Supercell patch and news pages are the
preferred sources.

Definitions and level entries may be marked:

- `verified`: the stored value is backed by the recorded source.
- `partial`: only part of the item or level table is currently stored.
- `needs-review`: a retained seed or value still needs source verification.

The Data Manager shows the current patch, tracked changes, source links, and
coverage counts. Coverage counts describe stored level entries; they do not
claim that every in-game level is present.

## Static Data Limitations

- The dataset is intentionally incomplete.
- Missing levels are not inferred or filled with invented values.
- Newly changed stats may remain partial or needs-review until manually checked.
- Some catalog items are visible in the Data Manager but excluded from the
  calculator because their effects are not supported or their stats are
  incomplete.
- Calculator results depend on the accuracy of the local static data.
- The app does not scrape, inspect, or extract data from Clash of Clans.

## Manual Progress Setup

Manual setup lets users select the Town Hall, Giant Arrow, Rocket Backpack, and
Earthquake levels currently represented by calculator data. Saving manual
progress sets its source to `manual`.

Progress is stored only in the current browser under:

```text
clash-damage-calculator:user-progress:v1
```

The calculator also works without saved progress.

## Optional JSON Import

JSON import is optional. Users may voluntarily paste a village snapshot, preview
recognized values, review ignored IDs and warnings, and then choose whether to
save normalized progress.

- A preview is required before saving.
- Unknown IDs are skipped safely.
- Only allowlisted IDs are mapped.
- Detected levels must exist in calculator-enabled static data.
- Raw pasted JSON is not stored.
- Manual setup remains available before and after an import.
- Saving the manual form after an import changes the source back to `manual`.

## Privacy And Safety

- No Supercell login is required.
- Never enter a Supercell ID email, password, recovery code, or 2FA code.
- No pasted JSON is sent to an external API.
- Progress is saved locally in the browser.
- Clearing browser storage removes saved MVP progress.

## MVP Acceptance Checklist

- [x] Calculator works without saved progress.
- [x] Calculator uses manual saved progress as defaults.
- [x] Calculator uses JSON-imported saved progress as defaults.
- [x] Other target results work for available static building data.
- [x] JSON import requires preview before save.
- [x] Data Manager shows the current patch and partial status.
- [x] About page includes the fan-content disclaimer.
- [x] No Supercell login is requested.
- [x] No scraping or extraction behavior exists.
- [x] Lint passes.
- [x] Production build passes.
- [x] Unit tests pass.

## Known Limitations

- Building HP coverage is small, so many target selections show a friendly
  missing-data state.
- Earthquake level 5 remains marked needs-review until a source is stored.
- Rocket Backpack level 24 remains an MVP compatibility seed marked
  needs-review.
- Storage immunity and other building-specific spell rules are not implemented.
- Fire Heart, Monolith Arrow, and event spells are not calculator sources.
- There is no database, account system, admin editor, or official API import.

## Roadmap

- Phase 9: Move static data to database or dynamic storage
- Phase 10: Add an admin data editor
- Phase 11: Add a controlled patch update workflow
- Future: Consider official Clash API profile import where appropriate

## Disclaimer

This is an unofficial Clash of Clans calculator and is not endorsed by
Supercell.

Clash of Clans, Supercell, and associated names and marks belong to their
respective owners.
