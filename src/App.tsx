import { useState } from "react";
import SettingsSheet from "./components/SettingsSheet";
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
    entries,
    todayEntries,
    todayTotal,
    todayProtein,
    history,
    quickAdds,
    menu,
    streak,
    importBackup,
    dailyGoal,
    setDailyGoal,
    theme,
    setTheme,
    addEntry,
    updateEntry,
    deleteEntry,
    restoreEntry,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    togglePinned,
  } = useEntries();

  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="app">
      <div className="top-bar">
        <span className="wordmark">Tally</span>
        <button
          className="settings-btn"
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M10 1.9l.9 2.1a6.2 6.2 0 011.9.8l2.2-.7 1.6 2.7-1.6 1.6a6.4 6.4 0 010 2.1l1.6 1.6-1.6 2.7-2.2-.7a6.2 6.2 0 01-1.9.8l-.9 2.2H8.4l-.9-2.2a6.2 6.2 0 01-1.9-.8l-2.2.7-1.6-2.7 1.6-1.6a6.4 6.4 0 010-2.1L1.8 6.8l1.6-2.7 2.2.7a6.2 6.2 0 011.9-.8l.9-2.1H10z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {tab === "today" && (
        <TodayScreen
          key={today}
          today={today}
          total={todayTotal}
          protein={todayProtein}
          streak={streak}
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
      {tab === "history" && (
        <HistoryScreen
          today={today}
          history={history}
          entries={entries}
          menu={menu}
          dailyGoal={dailyGoal}
          onImport={importBackup}
        />
      )}

      <SettingsSheet
        open={settingsOpen}
        theme={theme}
        onSetTheme={setTheme}
        onClose={() => setSettingsOpen(false)}
      />

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
