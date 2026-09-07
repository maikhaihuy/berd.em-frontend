"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

// Deliberately not using dateTimeHelpers' getTime() here - that helper reads
// getUTCHours()/getUTCMinutes() because it's built for shift-time strings
// that encode local wall-clock time under a UTC label. A live "now" clock
// needs the browser's actual local time, so it uses the Date object's local
// getters directly instead.
function formatLocalTime(date: Date) {
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
      <Clock className="h-4 w-4" />
      {formatLocalTime(now)}
    </div>
  );
}
