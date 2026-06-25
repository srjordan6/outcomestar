"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MilestoneTracker } from "@/components/parent/MilestoneTracker";

const API_BASE = "https://focms-api.onrender.com";

interface VerifyResponse {
  valid: boolean;
  student_id?: string;
  display_name?: string;
  student_first_name?: string;
}

export default function MilestonesPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("t");
  const [studentId, setStudentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(
      `${API_BASE}/focms/v1/parent/auth/verify-token?t=${encodeURIComponent(token)}`,
      { method: "POST" },
    )
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.text();
          throw new Error(`HTTP ${r.status}: ${body.slice(0, 200)}`);
        }
        return r.json() as Promise<VerifyResponse>;
      })
      .then((data) => {
        if (!data.valid || !data.student_id) {
          setError("Token verification failed.");
          return;
        }
        setStudentId(data.student_id);
      })
      .catch((e) => setError(String(e)));
  }, [token]);

  if (!token) {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui", color: "#7A8A9E" }}>
        Missing access token. Use the link from your invitation email.
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui", color: "#C46300" }}>
        {error}
      </div>
    );
  }
  if (!studentId) {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui", color: "#7A8A9E" }}>
        Verifying...
      </div>
    );
  }

  return <MilestoneTracker token={token} studentId={studentId} />;
}
