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
    <div>
      <h1>{event?.name ?? "Leaderboard"}</h1>
      <p>{event ? `${event.team_a_name} vs. ${event.team_b_name}` : ""}</p>

      {err ? (
        <p>{err}</p>
      ) : (
        <>
          <div>
            <strong>{event?.team_a_name ?? "Team A"}</strong> 0.0
          </div>
          <div>
            <strong>{event?.team_b_name ?? "Team B"}</strong> 0.0
          </div>

          <h2>Sessions</h2>
          <ul>
            {sessions.map((s) => (
              <li key={s.id}>
                {s.name} — Points available: {s.points_available}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
