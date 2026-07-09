export const WEEK_CAPACITY = 168;
export const MONTH_CAPACITY = 720;

export function capacity(view: 'week'|'month'): number {
  return view === 'month' ? MONTH_CAPACITY : WEEK_CAPACITY;
}
