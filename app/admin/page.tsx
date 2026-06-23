/**
 * app/admin/page.tsx — OutcomeStar tenant admin console.
 *
 * Server component. Gates on cookie auth; if not authed, renders login
 * form. If authed, fetches all showcases + students for the tenant and
 * passes to the client component which handles interactivity.
 *
 * v1.0.1: loginAction is a void server action that redirects on failure,
 * with the failure mode communicated via ?error= query param.
 */

import { cookies } from "next/headers";
import { loginAction } from "./actions";
import AdminClient from "./AdminClient";

const API = process.env.FOCMS_API_URL ?? "https://focms-api.onrender.com";
const API_TOKEN = process.env.FOCMS_API_TOKEN;
const COOKIE_NAME = "outcomestar_admin";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

async function apiFetch(path: string) {
  if (!API_TOKEN) return null;
  try {
    const r = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: "no-store",
    });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

export default async function AdminPage({ searchParams }: PageProps) {
  const c = await cookies();
  const authed = c.get(COOKIE_NAME)?.value === "ok";
  const { error } = await searchParams;

  if (!authed) {
    const errorMessage =
      error === "wrong"
        ? "Wrong password."
        : error === "noenv"
        ? "ADMIN_PASSWORD env var not set on outcomestar service."
        : null;

    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <form
          action={loginAction}
          className="bg-white rounded-lg shadow-md p-8 w-full max-w-sm border border-stone-200"
        >
          <h1 className="font-serif text-2xl font-semibold text-stone-900 mb-1">
            OutcomeStar Admin
          </h1>
          <p className="text-sm text-stone-600 mb-6">
            Enter your admin password to manage students.
          </p>
          <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            required
            autoFocus
            className="w-full px-3 py-2 border border-stone-300 rounded mb-2 font-mono text-sm focus:outline-none focus:border-orange-600"
          />
          {errorMessage && (
            <p className="text-xs text-red-600 mb-3">{errorMessage}</p>
          )}
          <button
            type="submit"
            className="w-full bg-stone-900 text-white py-2 rounded font-medium hover:bg-stone-800 transition mt-2"
          >
            Sign in
          </button>
        </form>
      </div>
    );
  }

  const [showcasesData, studentsData] = await Promise.all([
    apiFetch("/focms/v1/public_showcases"),
    apiFetch("/focms/v1/students"),
  ]);

  return (
    <AdminClient
      showcases={showcasesData?.showcases ?? []}
      students={studentsData?.students ?? []}
    />
  );
}

export const metadata = {
  title: "OutcomeStar Admin",
  robots: "noindex,nofollow",
};
