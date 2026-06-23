"use server";

/**
 * app/admin/actions.ts — Server Actions for the OutcomeStar admin UI.
 *
 * All mutations the customer's admin console performs go through these
 * functions. They hold the FOCMS_API_TOKEN (never sent to browser) and
 * make server-side calls to focms-api.
 */

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const API = process.env.FOCMS_API_URL ?? "https://focms-api.onrender.com";
const API_TOKEN = process.env.FOCMS_API_TOKEN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const COOKIE_NAME = "outcomestar_admin";

async function apiCall(method: string, path: string, body?: any) {
  if (!API_TOKEN) throw new Error("FOCMS_API_TOKEN env var not set");
  const r = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`${method} ${path} → ${r.status}: ${text.slice(0, 200)}`);
  }
  if (r.status === 204) return null;
  return r.json();
}

export async function loginAction(_prev: any, formData: FormData) {
  const submitted = formData.get("password")?.toString() ?? "";
  if (!ADMIN_PASSWORD) {
    return { ok: false, error: "ADMIN_PASSWORD env var not set on outcomestar service" };
  }
  if (submitted !== ADMIN_PASSWORD) {
    return { ok: false, error: "Wrong password" };
  }
  const c = await cookies();
  c.set(COOKIE_NAME, "ok", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/admin");
}

export async function logoutAction() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
  redirect("/admin");
}

export async function createStudentAction(_prev: any, formData: FormData) {
  const payload: any = {
    first_name: formData.get("first_name")?.toString() ?? "",
    last_name: formData.get("last_name")?.toString() ?? "",
    display_name: formData.get("display_name")?.toString() ?? "",
    birth_date: formData.get("birth_date")?.toString() ?? "",
  };
  for (const opt of ["current_grade", "residence_state", "headline", "preferred_name"]) {
    const v = formData.get(opt)?.toString();
    if (v) payload[opt] = v;
  }
  const gradYear = formData.get("expected_hs_graduation_year")?.toString();
  if (gradYear) payload.expected_hs_graduation_year = parseInt(gradYear, 10);

  try {
    const student = await apiCall("POST", "/focms/v1/students", payload);
    // Auto-create a private showcase scaffold
    const slugSeed = (payload.first_name + payload.last_name)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (slugSeed) {
      try {
        await apiCall("POST", "/focms/v1/public_showcases", {
          student_id: student.id,
          slug: slugSeed,
          display_name: payload.display_name,
          visibility: "private",
        });
      } catch {
        // slug collision is acceptable; admin can rename later
      }
    }
    revalidatePath("/admin");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}

export async function updateShowcaseAction(_prev: any, formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) return { ok: false, error: "Missing showcase id" };
  const payload: any = {};
  for (const f of ["slug", "display_name", "tagline", "photo_url", "visibility", "theme_key"]) {
    const v = formData.get(f)?.toString();
    if (v !== undefined && v !== "") payload[f] = v;
  }
  try {
    await apiCall("PATCH", `/focms/v1/public_showcases/${id}`, payload);
    revalidatePath("/admin");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}

export async function deleteShowcaseAction(formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) return;
  try {
    await apiCall("DELETE", `/focms/v1/public_showcases/${id}`);
  } catch {}
  revalidatePath("/admin");
}

export async function deleteStudentAction(formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) return;
  try {
    await apiCall("DELETE", `/focms/v1/students/${id}`);
  } catch {}
  revalidatePath("/admin");
}

/**
 * Upload a photo. Called by the AdminClient with base64-encoded file bytes.
 * Returns the public URL the showcase can reference.
 */
export async function uploadPhotoAction(payload: {
  filename: string;
  mimeType: string;
  contentBase64: string;
  studentId?: string;
}): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const result = await apiCall("POST", "/focms/v1/media", {
      filename: payload.filename,
      mime_type: payload.mimeType,
      content_base64: payload.contentBase64,
      kind: "image",
      visibility: "public",
      student_id: payload.studentId,
    });
    const fullUrl = result.url.startsWith("http")
      ? result.url
      : `${API}${result.url}`;
    return { ok: true, url: fullUrl };
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}
