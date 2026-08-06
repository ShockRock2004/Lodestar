# Seed scripts

## Placement DSA · Aug–Sep 2026

A day-by-day placement-prep plan built from **Striver's A2Z sheet** (Recursion, DP,
Graphs, Binary Trees, BST, Greedy, Sliding Window & Two Pointer — 219 items, 100%
coverage) scheduled across **3 Aug – 30 Sep 2026** honoring real calendar
constraints (no Wednesdays, rest days 31 Aug & 2 Sep, light quiz days 1/3 Sep,
heavier holidays, weekends as full study days), capped to ~20 h/week (one holiday
week with 7 working days runs to ~21 h).

- **Data (source of truth):** `placement-dsa-source.json` — the verified problem
  lists with difficulty + canonical URLs (LeetCode where the problem exists there,
  else GeeksforGeeks). Edit this to change the problem set.
- **Seed:** `seed-placement-dsa.mjs` — builds the schedule from the data and writes it
  to Supabase (`dsa_problems`, plan = `Placement DSA · Aug–Sep 2026`).

### Run

```bash
node web/scripts/seed-placement-dsa.mjs
```

Reads Supabase credentials from `web/.env.local`. **Idempotent** — it deletes every
row of this plan then re-inserts, so re-running never duplicates and only ever
touches this plan's rows (your other problems/plans are left alone). After writing it
reads the rows back and verifies per-topic coverage, that no item lands on a
Wednesday/rest day, and that every item has a URL.

The web + mobile apps both read `dsa_problems` from Supabase, so the plan appears in
the DSA section automatically after seeding.
