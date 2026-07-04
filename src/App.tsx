import { useState } from "react";
import { useEntries } from "./hooks/useEntries";
import TodayScreen from "./components/TodayScreen";
import HistoryScreen from "./components/HistoryScreen";

type Tab = "today" | "history";

const TABS: { id: Tab; label: string; icon: JSX.Element }[] = [
  {
    id: "today",
    label: "Today",
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <circle
          cx="8.5"
          cy="8.5"
          r="6.75"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle cx="8.5" cy="8.5" r="2.25" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "history",
    label: "History",
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <path
          d="M2.5 14.5v-4M8.5 14.5v-8M14.5 14.5V2.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("today");
  const { today, todayEntries, todayTotal, history, addEntry, deleteEntry } =
    useEntries();

  return (
    <div className="app">
      <span className="wordmark">Tally</span>

      {tab === "today" ? (
        <TodayScreen
          key={today}
          today={today}
          total={todayTotal}
          entries={todayEntries}
          onAdd={addEntry}
          onDelete={deleteEntry}
        />
      ) : (
        <HistoryScreen today={today} history={history} />
      )}

      <nav className="tabbar-wrap" aria-label="Screens">
        <div className="tabbar">
          <span
            className="tab-indicator"
            style={{
              transform: `translateX(${tab === "today" ? 0 : 100}%)`,
            }}
            aria-hidden="true"
          />
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab${tab === t.id ? " active" : ""}`}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
