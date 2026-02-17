"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebaseClient";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

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

      try {
        // Fetch first event
        const evSnap = await getDocs(query(collection(db, "events"), limit(1)));
        if (evSnap.empty) return setErr("No event found in database.");
        const evDoc = evSnap.docs[0];
        setEvent({ id: evDoc.id, ...evDoc.data() } as EventRow);

        // Fetch sessions ordered by sort_order
        const ssSnap = await getDocs(
          query(collection(db, "sessions"), orderBy("sort_order", "asc"))
        );
        setSessions(
          ssSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as SessionRow)
        );
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Failed to load data.");
      }
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
