import { useEffect, useRef, useState } from "react";
import type { DayKey, Entry } from "../types";
import { formatHeroDate } from "../lib/format";
import AnimatedNumber from "./AnimatedNumber";
import AddEntryForm from "./AddEntryForm";
import EntryList from "./EntryList";

interface Props {
  today: DayKey;
  total: number;
  entries: Entry[];
  onAdd: (calories: number, description: string) => void;
  onDelete: (id: string) => void;
}

export default function TodayScreen({
  today,
  total,
  entries,
  onAdd,
  onDelete,
}: Props) {
  // Gentle scale pulse on the hero number whenever the total changes.
  const [pulsing, setPulsing] = useState(false);
  const prevTotal = useRef(total);
  useEffect(() => {
    if (prevTotal.current !== total) {
      prevTotal.current = total;
      setPulsing(true);
      const t = window.setTimeout(() => setPulsing(false), 500);
      return () => window.clearTimeout(t);
    }
  }, [total]);

  return (
    <div className="screen">
      <header className="hero">
        <p className="hero-date">{formatHeroDate(today)}</p>
        <h1 className={`hero-total${pulsing ? " pulse" : ""}`}>
          <AnimatedNumber value={total} />
        </h1>
        <p className="hero-caption">calories today</p>
      </header>

      <AddEntryForm onAdd={onAdd} />

      <h2 className="section-label">
        Today’s entries
        {entries.length > 0 && <span className="count">{entries.length}</span>}
      </h2>
      <EntryList entries={entries} onDelete={onDelete} />
    </div>
  );
}
