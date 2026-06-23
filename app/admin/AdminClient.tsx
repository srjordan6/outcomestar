"use client";

/**
 * app/admin/AdminClient.tsx — Interactive admin console.
 *
 * Renders a dashboard with two sections:
 *   - Students: create new, edit existing, delete
 *   - Showcases: edit display config, upload photo, toggle visibility
 *
 * Photo upload: file -> FileReader -> base64 -> server action ->
 * focms-api /media -> URL -> populated into showcase.photo_url field.
 */

import { useState, useTransition, useRef } from "react";
import {
  createStudentAction,
  updateShowcaseAction,
  deleteShowcaseAction,
  deleteStudentAction,
  uploadPhotoAction,
  logoutAction,
} from "./actions";

interface Student {
  id: string;
  display_name: string;
  first_name: string;
  last_name: string;
  current_grade: string | null;
  residence_state: string | null;
  expected_hs_graduation_year: number | null;
  birth_date: string | null;
}

interface Showcase {
  id: string;
  slug: string;
  student_id: string;
  student_name: string | null;
  theme_key: string;
  display_name: string | null;
  tagline: string | null;
  photo_url: string | null;
  visibility: string;
}

interface AdminClientProps {
  students: Student[];
  showcases: Showcase[];
}

export default function AdminClient({ students, showcases }: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<"students" | "showcases">("showcases");

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="font-serif text-xl font-semibold text-stone-900">
              OutcomeStar Admin
            </h1>
            <nav className="flex gap-1 text-sm">
              <button
                onClick={() => setActiveTab("showcases")}
                className={`px-3 py-1.5 rounded ${activeTab === "showcases" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}
              >
                Showcases ({showcases.length})
              </button>
              <button
                onClick={() => setActiveTab("students")}
                className={`px-3 py-1.5 rounded ${activeTab === "students" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}
              >
                Students ({students.length})
              </button>
            </nav>
          </div>
          <form action={logoutAction}>
            <button className="text-sm text-stone-500 hover:text-stone-900">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === "showcases" && (
          <ShowcasesPanel showcases={showcases} students={students} />
        )}
        {activeTab === "students" && (
          <StudentsPanel students={students} showcases={showcases} />
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Showcases panel
// ---------------------------------------------------------------------------

function ShowcasesPanel({
  showcases,
  students,
}: {
  showcases: Showcase[];
  students: Student[];
}) {
  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold text-stone-900 mb-4">
        Public showcases
      </h2>
      <p className="text-sm text-stone-600 mb-6">
        Each showcase corresponds to one URL like{" "}
        <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">outcomestar.app/&lt;slug&gt;</code>.
        Toggle visibility to control whether the URL is public, unlisted, or private.
      </p>
      <div className="space-y-4">
        {showcases.length === 0 && (
          <p className="text-stone-500 italic">No showcases yet. Create a student first, then customize their showcase here.</p>
        )}
        {showcases.map((s) => (
          <ShowcaseRow key={s.id} showcase={s} student={students.find((st) => st.id === s.student_id)} />
        ))}
      </div>
    </div>
  );
}

function ShowcaseRow({
  showcase,
  student,
}: {
  showcase: Showcase;
  student?: Student;
}) {
  const [expanded, setExpanded] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(showcase.photo_url ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const visibilityColor =
    showcase.visibility === "public"
      ? "bg-green-100 text-green-700"
      : showcase.visibility === "unlisted"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-stone-200 text-stone-700";

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const buf = await file.arrayBuffer();
      const b64 = arrayBufferToBase64(buf);
      const result = await uploadPhotoAction({
        filename: file.name,
        mimeType: file.type || "image/jpeg",
        contentBase64: b64,
        studentId: showcase.student_id,
      });
      if (result.ok && result.url) {
        setPhotoUrl(result.url);
      } else {
        setUploadError(result.error ?? "Upload failed");
      }
    } catch (err: any) {
      setUploadError(String(err?.message ?? err));
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-stone-50 transition text-left"
      >
        <div className="flex items-center gap-4">
          {showcase.photo_url && (
            <img
              src={showcase.photo_url}
              alt=""
              className="w-12 h-12 rounded-full object-cover border border-stone-300"
            />
          )}
          <div>
            <div className="font-medium text-stone-900">
              {showcase.display_name ?? showcase.slug}
            </div>
            <div className="text-xs text-stone-500 font-mono mt-0.5">
              outcomestar.app/{showcase.slug}
              {student && <span className="ml-2">· grade {student.current_grade ?? "?"}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-medium ${visibilityColor}`}>
            {showcase.visibility}
          </span>
          <span className="text-stone-400">{expanded ? "−" : "+"}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-stone-200 p-5 bg-stone-50">
          <form
            action={(fd) => {
              fd.set("id", showcase.id);
              fd.set("photo_url", photoUrl);
              startTransition(async () => {
                const r = await updateShowcaseAction(null, fd);
                setFormMsg(r?.ok ? "Saved ✓" : `Error: ${r?.error}`);
                setTimeout(() => setFormMsg(null), 3000);
              });
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Field label="Slug (URL)" name="slug" defaultValue={showcase.slug} prefix="outcomestar.app/" />
            <Field label="Display name" name="display_name" defaultValue={showcase.display_name ?? ""} />
            <Field label="Tagline" name="tagline" defaultValue={showcase.tagline ?? ""} className="md:col-span-2" />

            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">
                Portrait photo
              </label>
              <div className="flex items-center gap-3">
                {photoUrl && (
                  <img src={photoUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-orange-600" />
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={isUploading}
                  className="text-sm"
                />
                {isUploading && <span className="text-sm text-stone-500">Uploading…</span>}
              </div>
              {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
              <input type="hidden" name="photo_url" value={photoUrl} />
              {photoUrl && (
                <p className="text-[10px] text-stone-400 mt-1 break-all font-mono">{photoUrl}</p>
              )}
            </div>

            <Select
              label="Visibility"
              name="visibility"
              defaultValue={showcase.visibility}
              options={[
                { value: "public", label: "Public (search engines + direct URL)" },
                { value: "unlisted", label: "Unlisted (direct URL only)" },
                { value: "private", label: "Private (404 to public)" },
              ]}
            />
            <Select
              label="Theme"
              name="theme_key"
              defaultValue={showcase.theme_key}
              options={[
                { value: "mission-control", label: "Mission Control (dark HUD)" },
                { value: "resume-mode", label: "Resume Mode (print-ready white)" },
              ]}
            />

            <div className="md:col-span-2 flex items-center gap-3 pt-3 border-t border-stone-200">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-stone-900 text-white rounded font-medium hover:bg-stone-800 disabled:opacity-50"
              >
                Save changes
              </button>
              <a
                href={`/${showcase.slug}`}
                target="_blank"
                rel="noopener"
                className="px-4 py-2 bg-white border border-stone-300 text-stone-700 rounded font-medium hover:bg-stone-100"
              >
                View live page →
              </a>
              <form action={deleteShowcaseAction} onSubmit={(e) => !confirm("Delete this showcase?") && e.preventDefault()}>
                <input type="hidden" name="id" value={showcase.id} />
                <button type="submit" className="px-3 py-2 text-red-600 text-sm hover:text-red-800">
                  Delete showcase
                </button>
              </form>
              {formMsg && <span className="text-sm text-stone-600">{formMsg}</span>}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Students panel
// ---------------------------------------------------------------------------

function StudentsPanel({
  students,
  showcases,
}: {
  students: Student[];
  showcases: Showcase[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-2xl font-semibold text-stone-900">Students</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-orange-600 text-white rounded font-medium hover:bg-orange-700 text-sm"
        >
          {showForm ? "Cancel" : "+ Add student"}
        </button>
      </div>

      {showForm && (
        <form
          action={(fd) => {
            startTransition(async () => {
              const r = await createStudentAction(null, fd);
              if (r?.ok) {
                setShowForm(false);
                setFormError(null);
              } else {
                setFormError(r?.error ?? "Failed");
              }
            });
          }}
          className="bg-white border border-stone-200 rounded-lg p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Field label="First name" name="first_name" required />
          <Field label="Last name" name="last_name" required />
          <Field label="Display name" name="display_name" required hint="What appears on the public page" />
          <Field label="Preferred name" name="preferred_name" />
          <Field label="Birth date" name="birth_date" type="date" required />
          <Field label="Current grade" name="current_grade" placeholder="e.g. 10" />
          <Field label="Residence state" name="residence_state" placeholder="e.g. CA" />
          <Field label="HS graduation year" name="expected_hs_graduation_year" type="number" placeholder="e.g. 2028" />
          <Field label="Headline" name="headline" className="md:col-span-2" placeholder="One-line summary" />

          <div className="md:col-span-2 flex items-center gap-3 pt-3 border-t border-stone-200">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-stone-900 text-white rounded font-medium hover:bg-stone-800 disabled:opacity-50"
            >
              Create student
            </button>
            <p className="text-xs text-stone-500">
              A private showcase will be auto-created — edit it in the Showcases tab to make it public.
            </p>
            {formError && <span className="text-sm text-red-600">{formError}</span>}
          </div>
        </form>
      )}

      <div className="space-y-3">
        {students.length === 0 && (
          <p className="text-stone-500 italic">No students yet.</p>
        )}
        {students.map((s) => {
          const sc = showcases.find((x) => x.student_id === s.id);
          return (
            <div key={s.id} className="bg-white border border-stone-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-stone-900">{s.display_name}</div>
                <div className="text-xs text-stone-500 mt-0.5">
                  Grade {s.current_grade ?? "?"} · {s.residence_state ?? "—"} · Class of {s.expected_hs_graduation_year ?? "?"}
                </div>
                {sc && (
                  <div className="text-xs text-stone-400 font-mono mt-1">
                    showcase: outcomestar.app/{sc.slug} ({sc.visibility})
                  </div>
                )}
              </div>
              <form
                action={deleteStudentAction}
                onSubmit={(e) => !confirm(`Delete ${s.display_name} and their showcase?`) && e.preventDefault()}
              >
                <input type="hidden" name="id" value={s.id} />
                <button type="submit" className="text-sm text-red-600 hover:text-red-800">
                  Delete
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------------

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
  className,
  prefix,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  prefix?: string;
  hint?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="flex items-stretch">
        {prefix && (
          <span className="px-3 py-2 bg-stone-100 border border-stone-300 border-r-0 rounded-l text-sm text-stone-500 font-mono">
            {prefix}
          </span>
        )}
        <input
          type={type}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          className={`flex-1 px-3 py-2 border border-stone-300 ${prefix ? "rounded-r" : "rounded"} text-sm focus:outline-none focus:border-orange-600`}
        />
      </div>
      {hint && <p className="text-[10px] text-stone-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">
        {label}
      </label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full px-3 py-2 border border-stone-300 rounded text-sm bg-white focus:outline-none focus:border-orange-600"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
