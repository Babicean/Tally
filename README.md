# Tally

A calm, minimal daily calorie tracker. Log what you eat in two taps, watch the
day's total tick up, and let history collect itself.

## Running it

```sh
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
npm test         # unit tests (day-boundary logic, validation, grouping)
```

## How days work — the 2 AM boundary

A "day" in Tally starts at **2:00 AM local time**, not midnight. A snack at
1:15 AM counts toward the evening before, which is how most people actually
think about late nights. The rule lives in one place —
`src/lib/day.ts` (`trackingDayFor`) — and is covered by unit tests in
`src/lib/day.test.ts`, including month/year/leap-day rollovers. The UI also
rolls itself over automatically if it's open when 2 AM passes.

## Architecture

- **React + TypeScript + Vite**, no UI framework — the design system is
  ~600 lines of hand-written CSS (`src/styles.css`) with light/dark themes
  via `prefers-color-scheme`.
- **Persistence** is localStorage behind a small repository
  (`src/lib/store.ts`). The payload is versioned (`{ version, entries }`) so
  the engine can be swapped for IndexedDB or a synced backend, and new fields
  (protein, weight, goals) can be added without breaking old data.
- **Entries** are flat records: `id`, `calories`, `description`, `timestamp`,
  and the precomputed tracking `day` — so history grouping is a pure
  aggregation and never re-derives boundaries from raw timestamps.
- **State** flows through one hook (`src/hooks/useEntries.ts`): load, persist,
  cross-tab sync, and the 2 AM rollover timer.

```
src/
  lib/        day boundary, storage, validation, formatting  (+ tests)
  hooks/      useEntries — single source of truth
  components/ Today screen, History screen, chart, list, form
```

## Validation

Calorie input accepts `500`, `+500`, or `1,200`; rejects zero, negatives,
non-numbers, and anything over 20,000 with an inline error and a gentle shake.
Decimals are rounded to whole calories.
