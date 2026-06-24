// FOCMS Parent Portal — localStorage token + context management

const TOKEN_KEY = "focms.parent.token";
const CONTEXT_KEY = "focms.parent.context";

export function saveToken(token: string): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
}

export function loadToken(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CONTEXT_KEY);
  } catch { /* ignore */ }
}

export function saveContext<T>(ctx: T): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx)); } catch { /* ignore */ }
}

export function loadContext<T>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONTEXT_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}