"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

type SessionRow = {
  id: string;
  name: string;
  points_available: number;
  sort_order: number;
};

type EventRow = {
  id: string;
  name: string;
  team_a_name: string;
  team_b_name: string;
};

export default function LeaderboardPage() {
  const router = useRouter();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [err, setErr] = useState("");

  // Simple gate: must have passed PIN
  useEffect(() => {
    const ok = localStorage.getItem("rc26_pin_ok") === "1";
    if (!ok) router.replace("/");
  }, [router]);

  useEffect(() => {
    async function load() {
      setErr("");

      const ev = await supabase
        .from("events")
        .select("id,name,team_a_name,team_b_name")
        .limit(1)
        .maybeSingle();

      if (ev.error) return setErr(ev.error.message);
      if (!ev.data) return setErr("No event found in database.");
      setEvent(ev.data);

      const ss = await supabase
        .from("sessions")
        .select("id,name,points_available,sort_order")
        .order("sort_order", { ascending: true });

      if (ss.error) return setErr(ss.error.message);
      setSessions(ss.data ?? []);
    }

    load();
  }, []);

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ margin: 0 }}>
        {event?.name ?? "Leaderboard"}
      </h1>
      <p style={{ marginTop: 6, color: "#555" }}>
        {event ? `${event.team_a_name} vs. ${event.team_b_name}` : ""}
      </p>

      {err ? (
        <div style={{ marginTop: 12, color: "crimson" }}>{err}</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
            <div style={{ flex: 1, border: "1px solid #ddd", borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 12, color: "#666" }}>{event?.team_a_name ?? "Team A"}</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>0.0</div>
            </div>
            <div style={{ flex: 1, border: "1px solid #ddd", borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 12, color: "#666" }}>{event?.team_b_name ?? "Team B"}</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>0.0</div>
            </div>
          </div>

          <h2 style={{ marginTop: 22, fontSize: 16 }}>Sessions</h2>

          <div style={{ display: "grid", gap: 10 }}>
            {sessions.map((s) => (
              <div key={s.id} style={{ border: "1px solid #eee", borderRadius: 14, padding: 14 }}>
                <div style={{ fontWeight: 650 }}>{s.name}</div>
                <div style={{ marginTop: 4, color: "#666", fontSize: 13 }}>
                  Points available: {s.points_available}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
