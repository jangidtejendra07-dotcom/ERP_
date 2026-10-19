export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Local (user ki) date "yyyy-mm-dd"
export function dateStr(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export const todayStr = () => dateStr(new Date());

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + n);
  return dateStr(d);
}

// Date picker ki date se bikri ka time: aaj ho to abhi ka time, purani ho to dopahar 12 baje
export function soldAtFor(day: string): string {
  return day === todayStr() ? new Date().toISOString() : new Date(`${day}T12:00:00`).toISOString();
}