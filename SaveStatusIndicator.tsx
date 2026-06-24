"use client";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

type Props = { status: SaveStatus; errorMessage?: string | null };

export default function SaveStatusIndicator({ status, errorMessage }: Props) {
  if (status === "idle") return null;
  if (status === "saving") return <span className="text-xs text-slate-500">Saving...</span>;
  if (status === "saved") return <span className="text-xs text-emerald-600">Saved</span>;
  return (
    <span className="text-xs text-rose-600" title={errorMessage || undefined}>
      Save failed
    </span>
  );
}