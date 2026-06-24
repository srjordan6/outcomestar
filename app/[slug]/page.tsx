"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ParentContext } from "@/lib/types";
import { verifyToken, ApiError } from "@/lib/api";
import { saveToken, loadToken, saveContext, clearToken } from "@/lib/parentAuth";
import CaptureFormRenderer from "@/components/parent/CaptureFormRenderer";
import LocaleSwitcher from "@/components/parent/LocaleSwitcher";

export default function ParentPage({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [ctx, setCtx] = useState<ParentContext | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [locale, setLocale] = useState<string>("en-US");

  useEffect(() => {
    const fromQuery = searchParams.get("t");
    const fromStorage = loadToken();
    const t = fromQuery || fromStorage;
    if (!t) {
      setAuthError("No access token. Open this page from the magic link in your email.");
      return;
    }
    if (fromQuery && fromQuery !== fromStorage) {
      saveToken(fromQuery);
    }
    setToken(t);
    verifyToken(t)
      .then((c) => {
        setCtx(c);
        saveContext(c);
        if (c.preferred_ui_locale) setLocale(c.preferred_ui_locale);
      })
      .catch((err) => {
        clearToken();
        const msg = err instanceof ApiError ? err.detail : String(err);
        setAuthError(`Invalid or expired token: ${msg}`);
      });
  }, [searchParams]);

  if (authError) {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 p-6 text-rose-800">
        {authError}
      </div>
    );
  }
  if (!ctx || !token) {
    return <div className="p-8 text-slate-500">Verifying access...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{ctx.student_name}</h1>
          <p className="text-sm text-slate-500">
            Age {ctx.student_age} &middot; tenant {params.slug}
          </p>
        </div>
        <LocaleSwitcher current={locale} onChange={setLocale} />
      </div>
      <CaptureFormRenderer ctx={ctx} token={token} locale={locale} />
    </div>
  );
}