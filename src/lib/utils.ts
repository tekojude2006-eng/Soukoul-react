export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysISO(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatLongDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function formatShortDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function jsDayToSchool(day: number) {
  // JS: 0 Sunday ... 6 Saturday → school 1 Monday ... 6 Saturday, 0 Sunday
  if (day === 0) return 0;
  return day;
}

export function currentTimeHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function isOngoing(start: string, end: string) {
  const now = timeToMinutes(currentTimeHHMM());
  return now >= timeToMinutes(start) && now < timeToMinutes(end);
}

export function average(scores: Array<{ score: number | null; coefficient: number }>) {
  const valid = scores.filter((s) => s.score !== null && s.score !== undefined);
  if (!valid.length) return null;
  const totalCoef = valid.reduce((a, s) => a + (s.coefficient || 1), 0);
  const total = valid.reduce((a, s) => a + Number(s.score) * (s.coefficient || 1), 0);
  if (!totalCoef) return null;
  return Math.round((total / totalCoef) * 10) / 10;
}

export function homeworkUrgency(dueDate: string) {
  const today = todayISO();
  if (dueDate < today) return "late" as const;
  if (dueDate === today) return "today" as const;
  const tomorrow = addDaysISO(1);
  if (dueDate === tomorrow) return "tomorrow" as const;
  return "later" as const;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export function firstName(name: string) {
  return name.split(" ")[0] ?? name;
}

export function waLink(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}`;
}

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Une erreur est survenue.");
  }
  return data;
}
