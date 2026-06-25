"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MilestoneTracker } from "@/components/parent/MilestoneTracker";

const API_BASE = "https://focms-api.onrender.com";

interface VerifyResponse {
  valid: boolean;
  student_id?: string;
  display_name?: string;
}

export default function MilestonesPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("t");
  const [studentId, setStudentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/focms/v1/parent/token/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data: VerifyResponse) => {
        if (!data.valid || !data.student_id) {
          setError("Invalid or expired token.");
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
