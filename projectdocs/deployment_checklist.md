# Deployment Checklist

## Pre-Deployment

- [ ] **Data Integrity check**
    - [ ] Verify `Valmiki_Ramayan_Shlokas.json` is present and valid.
    - [ ] Ensure `lib/data/sarga_titles.json` exists and is up-to-date.
    - [ ] If new data was added, run `npm run generate:titles` (alias for `npx tsx scripts/generate_title_comparison.ts`) and complete the review process.

- [ ] **Build Verification**
    - [ ] Run `npm run build` to ensure no TypeScript or build errors.
    - [ ] Check for linting errors with `npm run lint`.

- [ ] **Environment Configuration**
    - [ ] Verify production environment variables (if any API routes rely on them).

## Post-Deployment

- [ ] **Smoke Test**
    - [ ] Visit Homepage and verify "Explorer" tab exists.
    - [ ] Navigate to a Kanda page (e.g., `/explorer/Bala%20Kanda`).
    - [ ] Verify Sarga cards show short titles and no full summaries.
    - [ ] Verify Pagination works (click Next/Previous).
    - [ ] Click a Sarga card and verify Shlokas load correctly.
