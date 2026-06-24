// FOCMS Parent Portal — API client (v0.7.5 contract)

import type { ParentContext, FormResponse, FieldUpdate, SaveResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_FOCMS_API_BASE || "https://focms-api.onrender.com";

export class ApiError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(`API ${status}: ${detail}`);
    this.status = status;
    this.detail = detail;
  }
}

async function fetchJson<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer parent_${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || body.error || detail;
    } catch { /* fall through */ }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

export async function verifyToken(token: string): Promise<ParentContext> {
  return fetchJson<ParentContext>("/focms/v1/parent/auth/verify-token", token, {
    method: "POST",
  });
}

export async function fetchForm(
  token: string,
  studentId: string,
  locale: string
): Promise<FormResponse> {
  const qs = new URLSearchParams({ locale });
  return fetchJson<FormResponse>(
    `/focms/v1/parent/students/${studentId}/form?${qs.toString()}`,
    token,
    { method: "GET" }
  );
}

export async function saveFields(
  token: string,
  studentId: string,
  updates: FieldUpdate[],
  localeOfInput: string
): Promise<SaveResponse> {
  return fetchJson<SaveResponse>(
    `/focms/v1/parent/students/${studentId}/save`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ updates, locale_of_input: localeOfInput }),
    }
  );
}