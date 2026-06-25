"use client";

import { useEffect, useState, useRef } from "react";

const C = {
  navy: "#201868",
  orange: "#F07800",
  white: "#FFFFFF",
  gray: "#7A8A9E",
  grayDark: "#4A5563",
  grayLight: "#E3E7ED",
  navyDark: "#160F4A",
  orangeDark: "#C46300",
};
const FONT_SERIF = 'Georgia, "Times New Roman", serif';
const FONT_SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const API_BASE = "https://focms-api.onrender.com";
const MAX_FILE_MB = 25;

interface CatalogRow {
  code: string;
  title: string;
  description: string | null;
  age_band: string;
  typical_age_min: number | null;
  typical_age_max: number | null;
  pillar: string;
  category: string | null;
  source_kind: "platform" | "tenant_custom";
  status: "achieved" | "now" | "upcoming" | "backfill_candidate" | "available";
  first_hit: string | null;
  event_count: number;
  milestone_id: string | null;
  artifact_count: number;
}

interface CustomEvent {
  id: string;
  custom_title: string;
  custom_category: string | null;
  event_date: string;
  event_notes: string | null;
  artifact_count: number;
}

interface PickerResponse {
  student_id: string;
  student_age_years: number | null;
  catalog_count: number;
  custom_count: number;
  catalog: CatalogRow[];
  custom_events: CustomEvent[];
}

interface ArtifactRow {
  attachment_id: string;
  artifact_id: string;
  kind: "image" | "video" | "document" | "other";
  mime_type: string;
  original_filename: string;
  byte_size: number;
  caption: string | null;
  visibility: string;
  uploaded_at: string | null;
}

const AGE_BAND_LABELS: Record<string, string> = {
  early_childhood: "Early Childhood (0-5)",
  early_elementary: "Early Elementary (5-8)",
  upper_elementary: "Upper Elementary (8-11)",
  middle_school: "Middle School (10-14)",
  high_school: "High School (14-18)",
};

const STATUS_LABELS: Record<string, { label: string; bg: string; fg: string }> = {
  achieved: { label: "ACHIEVED", bg: C.navy, fg: C.white },
  now: { label: "LIKELY NOW", bg: C.orange, fg: C.white },
  upcoming: { label: "UPCOMING", bg: C.grayLight, fg: C.navy },
  backfill_candidate: { label: "BACKFILL", bg: C.grayLight, fg: C.grayDark },
  available: { label: "AVAILABLE", bg: C.grayLight, fg: C.grayDark },
};

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function kindIcon(kind: string) {
  if (kind === "image") return "🖼";
  if (kind === "video") return "🎬";
  if (kind === "document") return "📄";
  return "📎";
}

export function MilestoneTracker({
  token,
  studentId,
}: {
  token: string;
  studentId: string;
}) {
  const [data, setData] = useState<PickerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openBands, setOpenBands] = useState<Record<string, boolean>>({
    early_childhood: true,
    early_elementary: true,
    upper_elementary: true,
    middle_school: true,
    high_school: true,
  });
  const [captureFor, setCaptureFor] = useState<CatalogRow | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [viewingArtifactsFor, setViewingArtifactsFor] = useState<{
    milestone_id: string;
    title: string;
  } | null>(null);

  async function loadPicker() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(
        `${API_BASE}/focms/v1/parent/students/${studentId}/milestones/picker?t=${encodeURIComponent(token)}`,
      );
      if (!r.ok) {
        const body = await r.text();
        throw new Error(`HTTP ${r.status}: ${body.slice(0, 200)}`);
      }
      setData(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPicker();
  }, [token, studentId]);

  if (loading && !data) {
    return (
      <div style={{ padding: 40, fontFamily: FONT_SANS, color: C.gray }}>
        Loading life events...
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: 40, fontFamily: FONT_SANS, color: C.orangeDark }}>
        Failed to load: {error}
      </div>
    );
  }
  if (!data) return null;

  const groups: Record<string, CatalogRow[]> = {};
  for (const row of data.catalog) {
    if (!groups[row.age_band]) groups[row.age_band] = [];
    groups[row.age_band].push(row);
  }
  const groupOrder = Object.keys(AGE_BAND_LABELS).filter((k) => groups[k]);
  const achievedCount = data.catalog.filter((r) => r.status === "achieved").length;

  return (
    <div
      style={{
        fontFamily: FONT_SANS,
        color: C.grayDark,
        background: C.white,
        minHeight: "100vh",
        padding: "32px 24px 80px",
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <header style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: FONT_SERIF,
              color: C.navy,
              fontSize: 36,
              fontWeight: 600,
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Millstones &amp; Milestones
          </h1>
          <div style={{ width: 80, height: 3, background: C.orange, marginTop: 8, marginBottom: 16 }} />
          <p style={{ color: C.gray, fontSize: 15, margin: 0 }}>
            {achievedCount} of {data.catalog_count} catalog milestones logged
            {data.custom_count > 0 ? `, ${data.custom_count} custom event${data.custom_count === 1 ? "" : "s"}` : ""}
            {data.student_age_years ? ` · age ${data.student_age_years.toFixed(1)}` : ""}
          </p>
        </header>

        <button
          onClick={() => setShowCustomForm(true)}
          style={{
            background: C.orange,
            color: C.white,
            border: "none",
            borderRadius: 6,
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            cursor: "pointer",
            marginBottom: 32,
            fontFamily: FONT_SANS,
          }}
        >
          + Add a custom life event
        </button>

        {showCustomForm && (
          <CustomEventForm
            token={token}
            studentId={studentId}
            onCancel={() => setShowCustomForm(false)}
            onSaved={() => {
              setShowCustomForm(false);
              loadPicker();
            }}
          />
        )}

        {data.custom_events.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontFamily: FONT_SERIF,
                color: C.navy,
                fontSize: 22,
                fontWeight: 500,
                margin: "0 0 16px",
              }}
            >
              Your custom events
            </h2>
            {data.custom_events.map((evt) => (
              <div
                key={evt.id}
                style={{
                  background: C.grayLight,
                  borderRadius: 6,
                  padding: 16,
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: C.navy }}>{evt.custom_title}</div>
                    <div style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>
                      {evt.event_date}
                      {evt.custom_category ? ` · ${evt.custom_category}` : ""}
                      {evt.artifact_count > 0 ? ` · ${evt.artifact_count} attached` : ""}
                    </div>
                    {evt.event_notes && (
                      <div style={{ color: C.grayDark, fontSize: 14, marginTop: 8 }}>
                        {evt.event_notes}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setViewingArtifactsFor({ milestone_id: evt.id, title: evt.custom_title })
                    }
                    style={{
                      background: "transparent",
                      color: C.navy,
                      border: `1.5px solid ${C.navy}`,
                      borderRadius: 4,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: FONT_SANS,
                      whiteSpace: "nowrap",
                      height: "fit-content",
                    }}
                  >
                    {evt.artifact_count > 0 ? `Files (${evt.artifact_count})` : "+ Add file"}
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        {groupOrder.map((band) => {
          const rows = groups[band];
          const bandAchieved = rows.filter((r) => r.status === "achieved").length;
          return (
            <section key={band} style={{ marginBottom: 24 }}>
              <button
                onClick={() => setOpenBands((o) => ({ ...o, [band]: !o[band] }))}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  borderBottom: `2px solid ${C.grayLight}`,
                  padding: "12px 0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  fontFamily: FONT_SERIF,
                  color: C.navy,
                  fontSize: 20,
                  fontWeight: 500,
                  textAlign: "left",
                }}
              >
                <span>
                  {AGE_BAND_LABELS[band] ?? band}
                  <span
                    style={{
                      fontFamily: FONT_SANS,
                      fontSize: 13,
                      color: C.gray,
                      fontWeight: 400,
                      marginLeft: 12,
                    }}
                  >
                    {bandAchieved} / {rows.length}
                  </span>
                </span>
                <span style={{ color: C.gray, fontSize: 18 }}>
                  {openBands[band] ? "−" : "+"}
                </span>
              </button>

              {openBands[band] && (
                <div style={{ paddingTop: 12 }}>
                  {rows.map((row) => (
                    <MilestoneCard
                      key={row.code}
                      row={row}
                      onCapture={() => setCaptureFor(row)}
                      onViewFiles={() =>
                        row.milestone_id &&
                        setViewingArtifactsFor({
                          milestone_id: row.milestone_id,
                          title: row.title,
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {captureFor && (
          <CaptureFormOverlay
            row={captureFor}
            token={token}
            studentId={studentId}
            onCancel={() => setCaptureFor(null)}
            onSaved={() => {
              setCaptureFor(null);
              loadPicker();
            }}
          />
        )}

        {viewingArtifactsFor && (
          <ArtifactsModal
            milestoneId={viewingArtifactsFor.milestone_id}
            title={viewingArtifactsFor.title}
            token={token}
            studentId={studentId}
            onClose={() => {
              setViewingArtifactsFor(null);
              loadPicker();
            }}
          />
        )}
      </div>
    </div>
  );
}

function MilestoneCard({
  row,
  onCapture,
  onViewFiles,
}: {
  row: CatalogRow;
  onCapture: () => void;
  onViewFiles: () => void;
}) {
  const s = STATUS_LABELS[row.status];
  return (
    <div
      style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${C.grayLight}`,
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
      }}
    >
      <span
        style={{
          background: s.bg,
          color: s.fg,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.05em",
          padding: "4px 8px",
          borderRadius: 3,
          flexShrink: 0,
          minWidth: 80,
          textAlign: "center",
        }}
      >
        {s.label}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: C.navy, fontSize: 15 }}>{row.title}</div>
        {row.description && (
          <div style={{ color: C.gray, fontSize: 13, marginTop: 2 }}>{row.description}</div>
        )}
        {row.first_hit && (
          <div style={{ color: C.navy, fontSize: 12, marginTop: 4 }}>
            Happened: {row.first_hit}
            {row.artifact_count > 0 ? ` · ${row.artifact_count} file${row.artifact_count === 1 ? "" : "s"}` : ""}
          </div>
        )}
      </div>
      {row.status === "achieved" ? (
        <button
          onClick={onViewFiles}
          style={{
            background: "transparent",
            color: C.navy,
            border: `1.5px solid ${C.navy}`,
            borderRadius: 4,
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: FONT_SANS,
            whiteSpace: "nowrap",
          }}
        >
          {row.artifact_count > 0 ? `Files (${row.artifact_count})` : "+ Add file"}
        </button>
      ) : (
        <button
          onClick={onCapture}
          style={{
            background: "transparent",
            color: C.navy,
            border: `1.5px solid ${C.navy}`,
            borderRadius: 4,
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: FONT_SANS,
            whiteSpace: "nowrap",
          }}
        >
          Mark as happened
        </button>
      )}
    </div>
  );
}

function VisibilityToggle({
  value,
  onChange,
}: {
  value: "public" | "family";
  onChange: (v: "public" | "family") => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <span
        style={{
          color: C.navy,
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          display: "block",
          marginBottom: 8,
        }}
      >
        Who can see this?
      </span>
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "10px 12px",
          border: `1.5px solid ${value === "public" ? C.orange : C.grayLight}`,
          borderRadius: 4,
          marginBottom: 6,
          cursor: "pointer",
          background: value === "public" ? "#FFF7EE" : C.white,
        }}
      >
        <input
          type="radio"
          checked={value === "public"}
          onChange={() => onChange("public")}
          style={{ marginTop: 3 }}
        />
        <span>
          <span style={{ fontWeight: 600, color: C.navy, fontSize: 14 }}>
            Show on outcomestar.app/north-star
          </span>
          <span style={{ display: "block", color: C.gray, fontSize: 12, marginTop: 2 }}>
            Public — anyone with the URL can see this milestone, date, comment, and any files.
          </span>
        </span>
      </label>
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "10px 12px",
          border: `1.5px solid ${value === "family" ? C.navy : C.grayLight}`,
          borderRadius: 4,
          cursor: "pointer",
          background: value === "family" ? "#F4F4F8" : C.white,
        }}
      >
        <input
          type="radio"
          checked={value === "family"}
          onChange={() => onChange("family")}
          style={{ marginTop: 3 }}
        />
        <span>
          <span style={{ fontWeight: 600, color: C.navy, fontSize: 14 }}>
            Family only
          </span>
          <span style={{ display: "block", color: C.gray, fontSize: 12, marginTop: 2 }}>
            Private — only visible inside the parent portal.
          </span>
        </span>
      </label>
    </div>
  );
}

function FileInput({
  files,
  onChange,
}: {
  files: File[];
  onChange: (next: File[]) => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  return (
    <div style={{ marginBottom: 16 }}>
      <span
        style={{
          color: C.navy,
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          display: "block",
          marginBottom: 6,
        }}
      >
        Attach files (optional)
      </span>
      <input
        ref={ref}
        type="file"
        multiple
        accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.eml,.msg"
        onChange={(e) => {
          const list = Array.from(e.target.files ?? []);
          const ok = list.filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024);
          const tooBig = list.length - ok.length;
          onChange([...files, ...ok]);
          if (tooBig > 0) {
            alert(`${tooBig} file(s) exceeded ${MAX_FILE_MB} MB and were skipped.`);
          }
          if (ref.current) ref.current.value = "";
        }}
        style={{
          display: "block",
          fontSize: 13,
          fontFamily: FONT_SANS,
          color: C.grayDark,
        }}
      />
      <div style={{ fontSize: 11, color: C.gray, marginTop: 4 }}>
        Photo, video, PDF, document, spreadsheet, or email. Max {MAX_FILE_MB} MB per file.
      </div>
      {files.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: C.grayLight,
                padding: "6px 10px",
                borderRadius: 4,
                marginBottom: 4,
                fontSize: 13,
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {kindIcon(
                  f.type.startsWith("image/")
                    ? "image"
                    : f.type.startsWith("video/")
                    ? "video"
                    : "document",
                )}{" "}
                {f.name} <span style={{ color: C.gray }}>({humanSize(f.size)})</span>
              </span>
              <button
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                style={{
                  background: "transparent",
                  border: "none",
                  color: C.orangeDark,
                  cursor: "pointer",
                  fontSize: 18,
                  lineHeight: 1,
                  padding: "0 4px",
                }}
                aria-label="Remove"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

async function uploadArtifacts(
  files: File[],
  milestoneId: string,
  studentId: string,
  token: string,
  caption: string | null,
): Promise<{ ok: number; failed: number }> {
  let ok = 0;
  let failed = 0;
  for (const file of files) {
    const fd = new FormData();
    fd.append("file", file);
    if (caption) fd.append("caption", caption);
    fd.append("attachment_role", "primary_artifact");
    try {
      const r = await fetch(
        `${API_BASE}/focms/v1/parent/students/${studentId}/milestones/${milestoneId}/artifacts?t=${encodeURIComponent(token)}`,
        { method: "POST", body: fd },
      );
      if (!r.ok) {
        failed += 1;
      } else {
        ok += 1;
      }
    } catch {
      failed += 1;
    }
  }
  return { ok, failed };
}

function CaptureFormOverlay({
  row,
  token,
  studentId,
  onCancel,
  onSaved,
}: {
  row: CatalogRow;
  token: string;
  studentId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [comment, setComment] = useState("");
  const [visibility, setVisibility] = useState<"public" | "family">("public");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  async function submit() {
    setSaving(true);
    setErr(null);
    setStatus("Saving milestone...");
    try {
      const r = await fetch(
        `${API_BASE}/focms/v1/parent/students/${studentId}/milestones/capture?t=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            milestone_code: row.code,
            event_date: date,
            event_notes: comment || null,
            visibility,
          }),
        },
      );
      if (!r.ok) {
        const b = await r.text();
        throw new Error(`HTTP ${r.status}: ${b.slice(0, 200)}`);
      }
      const result = await r.json();
      if (files.length > 0) {
        setStatus(`Uploading ${files.length} file${files.length === 1 ? "" : "s"}...`);
        const up = await uploadArtifacts(files, result.milestone_id, studentId, token, null);
        if (up.failed > 0) {
          setErr(`${up.failed} file(s) failed to upload, but the milestone was saved.`);
          setSaving(false);
          return;
        }
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(32, 24, 104, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 24,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.white,
          borderRadius: 8,
          padding: 32,
          maxWidth: 560,
          width: "100%",
          fontFamily: FONT_SANS,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h3
          style={{
            fontFamily: FONT_SERIF,
            color: C.navy,
            fontSize: 22,
            fontWeight: 600,
            margin: "0 0 4px",
          }}
        >
          {row.title}
        </h3>
        <div style={{ width: 60, height: 3, background: C.orange, marginBottom: 20 }} />

        <label style={{ display: "block", marginBottom: 16 }}>
          <span
            style={{
              color: C.navy,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Date it happened
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: "10px 12px",
              marginTop: 4,
              border: `1px solid ${C.grayLight}`,
              borderRadius: 4,
              fontSize: 14,
              fontFamily: FONT_SANS,
            }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 16 }}>
          <span
            style={{
              color: C.navy,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Public comment (optional)
          </span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="A short note about what happened, who was there, what it meant…"
            style={{
              display: "block",
              width: "100%",
              padding: "10px 12px",
              marginTop: 4,
              border: `1px solid ${C.grayLight}`,
              borderRadius: 4,
              fontSize: 14,
              fontFamily: FONT_SANS,
              resize: "vertical",
            }}
          />
        </label>

        <FileInput files={files} onChange={setFiles} />

        <VisibilityToggle value={visibility} onChange={setVisibility} />

        {status && !err && (
          <div style={{ color: C.navy, fontSize: 13, marginBottom: 12 }}>{status}</div>
        )}
        {err && (
          <div style={{ color: C.orangeDark, fontSize: 13, marginBottom: 16 }}>{err}</div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            disabled={saving}
            style={{
              background: "transparent",
              color: C.gray,
              border: "none",
              padding: "10px 18px",
              cursor: "pointer",
              fontFamily: FONT_SANS,
              fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            style={{
              background: C.orange,
              color: C.white,
              border: "none",
              borderRadius: 4,
              padding: "10px 18px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontSize: 13,
              cursor: saving ? "wait" : "pointer",
              fontFamily: FONT_SANS,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomEventForm({
  token,
  studentId,
  onCancel,
  onSaved,
}: {
  token: string;
  studentId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [comment, setComment] = useState("");
  const [visibility, setVisibility] = useState<"public" | "family">("public");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  async function submit() {
    if (!title.trim()) {
      setErr("Title is required");
      return;
    }
    setSaving(true);
    setErr(null);
    setStatus("Saving event...");
    try {
      const r = await fetch(
        `${API_BASE}/focms/v1/parent/students/${studentId}/milestones/custom?t=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            custom_title: title.trim(),
            custom_category: category.trim() || null,
            event_date: date,
            event_notes: comment || null,
            visibility,
            add_to_catalog: false,
          }),
        },
      );
      if (!r.ok) {
        const b = await r.text();
        throw new Error(`HTTP ${r.status}: ${b.slice(0, 200)}`);
      }
      const result = await r.json();
      if (files.length > 0) {
        setStatus(`Uploading ${files.length} file${files.length === 1 ? "" : "s"}...`);
        const up = await uploadArtifacts(files, result.milestone_id, studentId, token, null);
        if (up.failed > 0) {
          setErr(`${up.failed} file(s) failed to upload, but the event was saved.`);
          setSaving(false);
          return;
        }
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        background: C.grayLight,
        borderRadius: 8,
        padding: 24,
        marginBottom: 32,
        fontFamily: FONT_SANS,
      }}
    >
      <h3
        style={{
          fontFamily: FONT_SERIF,
          color: C.navy,
          fontSize: 20,
          fontWeight: 600,
          margin: "0 0 16px",
        }}
      >
        New custom life event
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <label>
          <span
            style={{
              color: C.navy,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Title *
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., First time scuba diving"
            style={{
              display: "block",
              width: "100%",
              padding: "10px 12px",
              marginTop: 4,
              border: `1px solid ${C.gray}`,
              borderRadius: 4,
              fontSize: 14,
              fontFamily: FONT_SANS,
              background: C.white,
            }}
          />
        </label>
        <label>
          <span
            style={{
              color: C.navy,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Category (optional)
          </span>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., adventure, faith, family"
            style={{
              display: "block",
              width: "100%",
              padding: "10px 12px",
              marginTop: 4,
              border: `1px solid ${C.gray}`,
              borderRadius: 4,
              fontSize: 14,
              fontFamily: FONT_SANS,
              background: C.white,
            }}
          />
        </label>
      </div>

      <label style={{ display: "block", marginBottom: 16 }}>
        <span
          style={{
            color: C.navy,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Date it happened
        </span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            padding: "10px 12px",
            marginTop: 4,
            border: `1px solid ${C.gray}`,
            borderRadius: 4,
            fontSize: 14,
            fontFamily: FONT_SANS,
            background: C.white,
          }}
        />
      </label>

      <label style={{ display: "block", marginBottom: 16 }}>
        <span
          style={{
            color: C.navy,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Public comment (optional)
        </span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="A short note about what happened, who was there, what it meant…"
          style={{
            display: "block",
            width: "100%",
            padding: "10px 12px",
            marginTop: 4,
            border: `1px solid ${C.gray}`,
            borderRadius: 4,
            fontSize: 14,
            fontFamily: FONT_SANS,
            background: C.white,
            resize: "vertical",
          }}
        />
      </label>

      <FileInput files={files} onChange={setFiles} />

      <VisibilityToggle value={visibility} onChange={setVisibility} />

      {status && !err && (
        <div style={{ color: C.navy, fontSize: 13, marginBottom: 12 }}>{status}</div>
      )}
      {err && (
        <div style={{ color: C.orangeDark, fontSize: 13, marginBottom: 16 }}>{err}</div>
      )}

      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
          disabled={saving}
          style={{
            background: "transparent",
            color: C.gray,
            border: "none",
            padding: "10px 18px",
            cursor: "pointer",
            fontFamily: FONT_SANS,
            fontSize: 14,
          }}
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={saving}
          style={{
            background: C.orange,
            color: C.white,
            border: "none",
            borderRadius: 4,
            padding: "10px 18px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontSize: 13,
            cursor: saving ? "wait" : "pointer",
            fontFamily: FONT_SANS,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving..." : "Save event"}
        </button>
      </div>
    </div>
  );
}

function ArtifactsModal({
  milestoneId,
  title,
  token,
  studentId,
  onClose,
}: {
  milestoneId: string;
  title: string;
  token: string;
  studentId: string;
  onClose: () => void;
}) {
  const [artifacts, setArtifacts] = useState<ArtifactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(
        `${API_BASE}/focms/v1/parent/students/${studentId}/milestones/${milestoneId}/artifacts?t=${encodeURIComponent(token)}`,
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setArtifacts(data.artifacts ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [milestoneId]);

  async function uploadNow() {
    if (files.length === 0) return;
    setUploading(true);
    setErr(null);
    const up = await uploadArtifacts(files, milestoneId, studentId, token, null);
    setUploading(false);
    setFiles([]);
    if (up.failed > 0) {
      setErr(`${up.failed} file(s) failed.`);
    }
    await load();
  }

  async function remove(attachmentId: string) {
    if (!confirm("Remove this file?")) return;
    try {
      const r = await fetch(
        `${API_BASE}/focms/v1/parent/students/${studentId}/milestones/${milestoneId}/artifacts/${attachmentId}?t=${encodeURIComponent(token)}`,
        { method: "DELETE" },
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(32, 24, 104, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.white,
          borderRadius: 8,
          padding: 32,
          maxWidth: 640,
          width: "100%",
          fontFamily: FONT_SANS,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h3
          style={{
            fontFamily: FONT_SERIF,
            color: C.navy,
            fontSize: 22,
            fontWeight: 600,
            margin: "0 0 4px",
          }}
        >
          {title}
        </h3>
        <div style={{ width: 60, height: 3, background: C.orange, marginBottom: 20 }} />

        {loading ? (
          <div style={{ color: C.gray, fontSize: 14 }}>Loading files…</div>
        ) : artifacts.length === 0 ? (
          <div style={{ color: C.gray, fontSize: 14, marginBottom: 16 }}>
            No files attached yet.
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px" }}>
            {artifacts.map((a) => (
              <li
                key={a.attachment_id}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: `1px solid ${C.grayLight}`,
                }}
              >
                {a.kind === "image" ? (
                  <img
                    src={`${API_BASE}/focms/v1/parent/artifacts/${a.artifact_id}/content?t=${encodeURIComponent(token)}`}
                    alt={a.original_filename}
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: "cover",
                      borderRadius: 4,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 4,
                      background: C.grayLight,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                      flexShrink: 0,
                    }}
                  >
                    {kindIcon(a.kind)}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  
                    href={`${API_BASE}/focms/v1/parent/artifacts/${a.artifact_id}/content?t=${encodeURIComponent(token)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: C.navy,
                      fontWeight: 600,
                      fontSize: 14,
                      textDecoration: "none",
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.original_filename}
                  </a>
                  <div style={{ color: C.gray, fontSize: 12 }}>
                    {humanSize(a.byte_size)} · {a.visibility}
                  </div>
                </div>
                <button
                  onClick={() => remove(a.attachment_id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: C.orangeDark,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: FONT_SANS,
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div
          style={{
            borderTop: `2px solid ${C.grayLight}`,
            paddingTop: 20,
          }}
        >
          <FileInput files={files} onChange={setFiles} />
          {err && (
            <div style={{ color: C.orangeDark, fontSize: 13, marginBottom: 12 }}>{err}</div>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              disabled={uploading}
              style={{
                background: "transparent",
                color: C.gray,
                border: "none",
                padding: "10px 18px",
                cursor: "pointer",
                fontFamily: FONT_SANS,
                fontSize: 14,
              }}
            >
              Close
            </button>
            {files.length > 0 && (
              <button
                onClick={uploadNow}
                disabled={uploading}
                style={{
                  background: C.orange,
                  color: C.white,
                  border: "none",
                  borderRadius: 4,
                  padding: "10px 18px",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  fontSize: 13,
                  cursor: uploading ? "wait" : "pointer",
                  fontFamily: FONT_SANS,
                  opacity: uploading ? 0.6 : 1,
                }}
              >
                {uploading ? "Uploading..." : `Upload ${files.length}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
