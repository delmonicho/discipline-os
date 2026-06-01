-- 002_weekly_review_unique.sql
-- One weekly review per user per ISO week, so the weekly-review function can upsert
-- idempotently (re-running within the same week overwrites rather than duplicating).
create unique index if not exists weekly_reviews_user_week_uniq
  on weekly_reviews (user_id, week_start);
