# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:


```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

### Submission Credit Integrity

The submission credit system now decrements credits server-side atomically when a submission is created. Frontend no longer pre-deducts. This prevents users from exploiting username/profile changes to reset or regain credits.

Key points:
- Credits are stored in `Subscription` documents keyed by stable `userId` (Mongo ObjectId string) plus `month` and `year`.
- Unique compound index enforces one record per (user, month, year).
- Endpoint `POST /api/submissions` performs an atomic `$inc: { remaining_submissions: -1 }` if credits are available.
- Legacy endpoint `POST /api/subscription/deduct` remains for compatibility but should not be called by the submission form anymore.

#### Manual Test Steps
1. Create/sign in as a free tier user (should auto-provision 2 credits).
2. Submit artwork twice – second submission should bring remaining to 0.
3. Attempt a third submission – UI should prompt upgrade (no server decrement occurs).
4. Change username via profile update.
5. Refresh subscription data – remaining submissions should still be 0 (no reset).
6. Upgrade tier or manually reset via PUT `/api/subscription` and confirm new monthly allowances function.

#### Migration / Backfill Guidance
If duplicate monthly `Subscription` docs exist per user due to prior absence of a unique index:
1. Run an aggregation to group by `{ userId, month, year }` summing `remaining_submissions`.
2. Keep the earliest created document, set its `remaining_submissions` to the minimum of the plan cap and summed value, delete the extras.
3. Ensure the index (added in model) is built: in Mongo shell: `db.subscriptions.createIndex({ userId:1, month:1, year:1 }, { unique:true })`.

Example cleanup script (pseudo):
```
db.subscriptions.aggregate([
  { $group: { _id: { userId:"$userId", month:"$month", year:"$year" }, ids: { $push:"$_id" }, count: { $sum:1 } } },
  { $match: { count: { $gt:1 } } }
]).forEach(g => {
  const keep = g.ids[0];
  g.ids.slice(1).forEach(id => db.subscriptions.deleteOne({ _id: id }));
});
```

No further action required for standard deployments.

### Date & Leaderboard Timing (UTC Standard)

All submission time-based leaderboards (today, weekly, monthly) use UTC boundaries on the server:

- Today: `created_at >= 00:00:00 UTC` of current day and `<= now`.
- Week: Sunday 00:00:00 UTC through current time.
- Month: First day 00:00:00 UTC through current time.

`Submission.created_at` was migrated from a string to a native `Date` type for reliable range queries (previously comparisons were unreliable).

#### Migration Script

If legacy documents store `created_at` as strings, run:

```bash
cd api
npm run migrate:created-at -- --dry    # Dry run
npm run migrate:created-at             # Execute conversion
```

Optional limits:

```bash
npm run migrate:created-at -- --limit 5000
```

The script parses ISO-like strings; unparseable dates are skipped with a warning.

After migration new submissions automatically use `Date` via Mongoose default.

Frontend retains a defensive same-day filter in `src/components/Leaderboard.tsx`; you may remove it once confident the backend set is correct.

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
