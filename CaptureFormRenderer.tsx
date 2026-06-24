"use client";

import { useEffect, useReducer, useState } from "react";
import type { FormResponse, ParentContext, FieldUpdate } from "@/lib/types";
import { fetchForm, saveFields, ApiError } from "@/lib/api";
import FieldRouter from "./FieldRouter";
import SectionNav from "./SectionNav";
import SaveStatusIndicator, { type SaveStatus } from "./SaveStatusIndicator";

type State = {
  form: FormResponse | null;
  values: Record<string, unknown>;
  dirty: Set<string>;
  activeSectionId: string;
  loading: boolean;
  loadError: string | null;
  saveStatus: SaveStatus;
  saveError: string | null;
};

type Action =
  | { type: "load_start" }
  | { type: "load_ok"; form: FormResponse }
  | { type: "load_fail"; error: string }
  | { type: "set_active"; sectionId: string }
  | { type: "set_value"; field_code: string; value: unknown }
  | { type: "save_start" }
  | { type: "save_ok" }
  | { type: "save_fail"; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "load_start":
      return { ...state, loading: true, loadError: null };
    case "load_ok":
      return {
        ...state,
        loading: false,
        form: action.form,
        values: { ...action.form.current_values },
        dirty: new Set(),
        activeSectionId: action.form.sections[0]?.section_id || "",
      };
    case "load_fail":
      return { ...state, loading: false, loadError: action.error };
    case "set_active":
      return { ...state, activeSectionId: action.sectionId };
    case "set_value": {
      const nextDirty = new Set(state.dirty);
      nextDirty.add(action.field_code);
      return {
        ...state,
        values: { ...state.values, [action.field_code]: action.value },
        dirty: nextDirty,
        saveStatus: "idle",
      };
    }
    case "save_start":
      return { ...state, saveStatus: "saving", saveError: null };
    case "save_ok":
      return { ...state, saveStatus: "saved", dirty: new Set(), saveError: null };
    case "save_fail":
      return { ...state, saveStatus: "error", saveError: action.error };
  }
}

const initial: State = {
  form: null,
  values: {},
  dirty: new Set(),
  activeSectionId: "",
  loading: true,
  loadError: null,
  saveStatus: "idle",
  saveError: null,
};

type Props = { ctx: ParentContext; token: string; locale: string };

export default function CaptureFormRenderer({ ctx, token, locale }: Props) {
  const [state, dispatch] = useReducer(reducer, initial);
  const [savingNow, setSavingNow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "load_start" });
    fetchForm(token, ctx.student_id, locale)
      .then((form) => { if (!cancelled) dispatch({ type: "load_ok", form }); })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof ApiError ? err.detail : String(err);
        dispatch({ type: "load_fail", error: msg });
      });
    return () => { cancelled = true; };
  }, [token, ctx.student_id, locale]);

  async function handleSave() {
    if (!state.form || state.dirty.size === 0 || savingNow) return;
    setSavingNow(true);
    dispatch({ type: "save_start" });
    const updates: FieldUpdate[] = Array.from(state.dirty).map((field_code) => ({
      field_code,
      value: (state.values[field_code] ?? null) as FieldUpdate["value"],
    }));
    try {
      const res = await saveFields(token, ctx.student_id, updates, locale);
      if (res.successful === res.total_updates) {
        dispatch({ type: "save_ok" });
      } else {
        const firstErr = res.results.find((r) => !r.ok)?.error || "partial save";
        dispatch({ type: "save_fail", error: firstErr });
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : String(err);
      dispatch({ type: "save_fail", error: msg });
    } finally {
      setSavingNow(false);
    }
  }

  if (state.loading) {
    return <div className="p-8 text-slate-500">Loading {ctx.student_name}&apos;s form...</div>;
  }
  if (state.loadError) {
    return (
      <div className="p-8 text-rose-700 bg-rose-50 rounded-md border border-rose-200">
        Failed to load form: {state.loadError}
      </div>
    );
  }
  if (!state.form) return null;

  const activeSection = state.form.sections.find((s) => s.section_id === state.activeSectionId)
    || state.form.sections[0];

  return (
    <div className="grid md:grid-cols-[240px_1fr] gap-6">
      <aside className="md:sticky md:top-4 md:self-start">
        <SectionNav
          sections={state.form.sections}
          activeId={state.activeSectionId}
          onSelect={(id) => dispatch({ type: "set_active", sectionId: id })}
        />
      </aside>
      <main className="flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">{activeSection.section_label}</h2>
          <div className="flex items-center gap-3">
            <SaveStatusIndicator status={state.saveStatus} errorMessage={state.saveError} />
            <button
              type="button"
              onClick={handleSave}
              disabled={state.dirty.size === 0 || savingNow}
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:bg-slate-300 disabled:text-slate-500"
            >
              {savingNow ? "Saving..." : `Save${state.dirty.size > 0 ? ` (${state.dirty.size})` : ""}`}
            </button>
          </div>
        </header>
        <div className="flex flex-col gap-5">
          {activeSection.fields.map((f) => (
            <FieldRouter
              key={f.field_code}
              field={f}
              value={state.values[f.field_code] ?? null}
              onChange={(v) => dispatch({ type: "set_value", field_code: f.field_code, value: v })}
            />
          ))}
        </div>
      </main>
    </div>
  );
}