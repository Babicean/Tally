import { useState } from "react";
import { useEntries } from "./hooks/useEntries";
import TodayScreen from "./components/TodayScreen";
import MenuScreen from "./components/MenuScreen";
import HistoryScreen from "./components/HistoryScreen";

type Tab = "today" | "menu" | "history";

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
    id: "menu",
    label: "Menu",
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <path
          d="M5 2v4.5a2 2 0 01-2 2h0a2 2 0 01-2-2V2M3.5 2v13M12.75 10c-1.5 0-2.5-1.8-2.5-4.25S11.35 2 12.75 2 15 3.8 15 5.75 14.25 10 12.75 10zm0 0v5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
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
  const {
    today,
    todayEntries,
    todayTotal,
    todayProtein,
    history,
    quickAdds,
    menu,
    dailyGoal,
    setDailyGoal,
    addEntry,
    updateEntry,
    deleteEntry,
    restoreEntry,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    togglePinned,
  } = useEntries();

  return (
    <div className="app">
      <span className="wordmark">Tally</span>

      {tab === "today" && (
        <TodayScreen
          key={today}
          today={today}
          total={todayTotal}
          protein={todayProtein}
          entries={todayEntries}
          quickAdds={quickAdds}
          dailyGoal={dailyGoal}
          onSetGoal={setDailyGoal}
          onAdd={addEntry}
          onUpdate={updateEntry}
          onDelete={deleteEntry}
          onRestore={restoreEntry}
        />
      )}
      {tab === "menu" && (
        <MenuScreen
          menu={menu}
          onLog={(item) => addEntry(item.calories, item.name, item.protein)}
          onAdd={addMenuItem}
          onUpdate={updateMenuItem}
          onDelete={deleteMenuItem}
          onTogglePinned={togglePinned}
        />
      )}
      {tab === "history" && <HistoryScreen today={today} history={history} />}

      <nav className="tabbar-wrap" aria-label="Screens">
        <div className="tabbar">
          <span
            className="tab-indicator"
            style={{
              transform: `translateX(${TABS.findIndex((t) => t.id === tab) * 100}%)`,
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
