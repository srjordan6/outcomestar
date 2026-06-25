"use client";

import { useEffect, useState } from "react";

// SRJ brand tokens — inline until globals.css/fonts.ts are set up next session
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
}

interface CustomEvent {
  id: string;
  custom_title: string;
  custom_category: string | null;
  event_date: string;
  event_notes: string | null;
}

interface PickerResponse {
  student_id: string;
  student_age_years: number | null;
  catalog_count: number;
  custom_count: number;
  catalog: CatalogRow[];
  custom_events: CustomEvent[];
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

const API_BASE = "https://focms-api.onrender.com";

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
  const [saving, setSaving] = useState(false);

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

  // Group catalog by age_band, preserving the order they come back in
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
        {/* Header */}
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
          <div
            style={{
              width: 80,
              height: 3,
              background: C.orange,
              marginTop: 8,
              marginBottom: 16,
            }}
          />
          <p style={{ color: C.gray, fontSize: 15, margin: 0 }}>
            {achievedCount} of {data.catalog_count} catalog milestones logged
            {data.custom_count > 0 ? `, ${data.custom_count} custom event${data.custom_count === 1 ? "" : "s"}` : ""}
            {data.student_age_years ? ` · age ${data.student_age_years.toFixed(1)}` : ""}
          </p>
        </header>

        {/* Add custom event CTA */}
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

        {/* Custom events already logged */}
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
                <div style={{ fontWeight: 600, color: C.navy }}>{evt.custom_title}</div>
                <div style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>
                  {evt.event_date}
                  {evt.custom_category ? ` · ${evt.custom_category}` : ""}
                </div>
                {evt.event_notes && (
                  <div style={{ color: C.grayDark, fontSize: 14, marginTop: 8 }}>{evt.event_notes}</div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Catalog groups by age_band */}
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
      </div>
    </div>
  );
}

function MilestoneCard({
  row,
  onCapture,
}: {
  row: CatalogRow;
  onCapture: () => void;
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
          <div style={{ color: C.navy, fontSize: 12, marginTop: 4 }}>Logged: {row.first_hit}</div>
        )}
      </div>
      {row.status !== "achieved" && (
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
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setErr(null);
    try {
      const r = await fetch(
        `${API_BASE}/focms/v1/parent/students/${studentId}/milestones/capture?t=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            milestone_code: row.code,
            event_date: date,
            event_notes: notes || null,
            visibility: "family",
          }),
        },
      );
      if (!r.ok) {
        const b = await r.text();
        throw new Error(`HTTP ${r.status}: ${b.slice(0, 200)}`);
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
          maxWidth: 480,
          width: "100%",
          fontFamily: FONT_SANS,
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
        <div
          style={{ width: 60, height: 3, background: C.orange, marginBottom: 20 }}
        />

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
            Date
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

        <label style={{ display: "block", marginBottom: 20 }}>
          <span
            style={{
              color: C.navy,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Notes (optional)
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
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
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!title.trim()) {
      setErr("Title is required");
      return;
    }
    setSaving(true);
    setErr(null);
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
            event_notes: notes || null,
            visibility: "family",
            add_to_catalog: false,
          }),
        },
      );
      if (!r.ok) {
        const b = await r.text();
        throw new Error(`HTTP ${r.status}: ${b.slice(0, 200)}`);
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
          Date
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

      <label style={{ display: "block", marginBottom: 20 }}>
        <span
          style={{
            color: C.navy,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Notes (optional)
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
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
