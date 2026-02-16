# Technical Report

A lightweight analytics dashboard for FC Internazionale, providing pre-game SWOT analysis and loaned-player monitoring.

## Data Sources

### CSV files (`public/data/`)

Two CSV files are manually exported from **Redshift** and placed in `public/data/`:

| File | Description |
|---|---|
| `team_z-scores.csv` | Team-level z-scores for SWOT analysis |
| `loaned_players.csv` | Loaned player profiles and KPIs |

### `team_z-scores.csv`

Entirely computed from **Opta** data. For each metric, values are aggregated at **p90** level per season. Z-scores are then computed against all other teams in **Serie A 2025/26**.

Metrics come in two flavours:

- **`_for`** — the team's own production. E.g. if Inter beat Juve 1-0 at home and lost 0-3 to Lecce away, `nb_goals_for = 1` (goals scored by Inter across both matches, at p90 level).
- **`_against`** — what the team concedes to opponents. In the same example, `nb_goals_against = 3`.

The SWOT quadrants are derived from these z-scores:

| Quadrant | Source | Z-score direction | Interpretation |
|---|---|---|---|
| **Strengths** | `_for` metrics | Highest (positive) | Opponent produces more than average — they are strong here |
| **Weaknesses** | `_for` metrics | Lowest (negative) | Opponent produces less than average — they are weak here |
| **Opportunities** | `_against` metrics | Highest (positive) | Opponent concedes more than average — they are vulnerable here |
| **Threats** | `_against` metrics | Lowest (negative) | Opponent concedes less than average — they are solid here, hard to exploit |

### `loaned_players.csv`

Computed by merging **Opta** data with **Transfermarkt** data. Transfermarkt provides player profile pictures and — critically — identifies which players are currently on loan. A [matching algorithm](https://perf-department.notion.site/Matching-players-across-different-providers-294a95fcfc3280638509dfc3b0e8b8b6) is used to reconcile player identities across the two data sources.

### Automatic data refresh

Everything upstream in **Redshift** is automatically refreshed as soon as new Opta or Transfermarkt data arrives:

- Every new game automatically updates the p90 values, z-scores in `team_z-scores.csv`, and KPIs in `loaned_players.csv`.
- When Transfermarkt adds or removes a loaned player, changes are reflected automatically.

The only manual step is re-exporting the two CSVs from Redshift and placing them in `public/data/`. In a production-ready environment, this step would be eliminated entirely: the frontend would query Redshift directly through Next.js API routes (server-side), removing the need for static CSV files and making the dashboard fully real-time.

## Frontend Architecture

### Why a custom frontend

An alternative Tableau-based frontend was considered but discarded. A JavaScript-based approach offers full control over layout, interactivity, and design — and avoids Tableau licensing and learning-curve constraints.

### Pages

**Pre-Game SWOT (`/pre-game`)**
Select an opponent from a dropdown. The page renders a 2x2 SWOT grid where each quadrant shows the top 5 metrics as horizontal bars, scaled by absolute z-score.

**Loaned Players (`/loaned-players`)**
Summary cards (total players, market value, goals, assists) followed by a responsive player grid. Each card shows the player photo (loaded from Transfermarkt via `next/image`), market value, games played, minutes, goals, and assists.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to `/pre-game` by default.
