/** ISO-8601 week key, e.g. "2026-W39". Ratings voting resets every Monday (UTC). */
export function weekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function previousWeekKey(weeksBack: number, from = new Date()): string {
  return weekKey(new Date(from.getTime() - weeksBack * 7 * 86400000));
}

/** Milliseconds until the next Monday 00:00 UTC, when the week closes. */
export function msUntilWeekEnds(now = new Date()): number {
  const day = now.getUTCDay() || 7;
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + (8 - day));
  return next - now.getTime();
}
