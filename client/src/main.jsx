import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
  CheckCircle2,
  Flame,
  ListChecks,
  RefreshCw,
  Search,
  Settings,
  ExternalLink,
} from "lucide-react";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_URL || "";
const STATUS_LABELS = {
  "not-started": "Not started",
  "in-progress": "In progress",
  solved: "Solved",
};

async function api(path, options) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Request failed");
  }

  return response.json();
}

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [problems, setProblems] = useState([]);
  const [meta, setMeta] = useState({
    topics: [],
    difficulties: [],
    statuses: [],
  });
  const [settings, setSettings] = useState(null);
  const [filters, setFilters] = useState({
    topic: "",
    difficulty: "",
    status: "",
    search: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value),
        ),
      );
      const [dashboardData, problemData, metaData, settingsData] =
        await Promise.all([
          api("/api/dashboard"),
          api(`/api/problems?${query.toString()}`),
          api("/api/problems/meta"),
          api("/api/settings"),
        ]);
      setDashboard(dashboardData);
      setProblems(problemData);
      setMeta(metaData);
      setSettings(settingsData);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [filters.topic, filters.difficulty, filters.status]);

  useEffect(() => {
    const handle = setTimeout(loadAll, 250);
    return () => clearTimeout(handle);
  }, [filters.search]);

  async function updateProblem(problem, status) {
    const updated = await api(`/api/problems/${problem._id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setProblems((current) =>
      current.map((item) => (item._id === updated._id ? updated : item)),
    );
    const dashboardData = await api("/api/dashboard");
    setDashboard(dashboardData);
  }

  async function saveSettings(nextSettings) {
    const updated = await api("/api/settings", {
      method: "PUT",
      body: JSON.stringify(nextSettings),
    });
    setSettings(updated);
    setDashboard(await api("/api/dashboard"));
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "problems", label: "Problem List", icon: ListChecks },
    { id: "settings", label: "Daily Target", icon: Settings },
  ];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">DSA Practice</p>
          <h1>Progress Tracker</h1>
        </div>
        <nav>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={activeTab === tab.id ? "active" : ""}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Love Babbar Sheet</p>
            <h2>
              {activeTab === "dashboard"
                ? "Dashboard"
                : activeTab === "problems"
                  ? "Problem List"
                  : "Daily Target"}
            </h2>
          </div>
          <button className="icon-button" onClick={loadAll} title="Refresh">
            <RefreshCw size={18} />
          </button>
        </header>

        {error && <div className="notice">{error}</div>}
        {loading && <div className="notice">Loading tracker data...</div>}

        {!loading && activeTab === "dashboard" && dashboard && (
          <Dashboard data={dashboard} />
        )}
        {!loading && activeTab === "problems" && (
          <ProblemList
            problems={problems}
            meta={meta}
            filters={filters}
            setFilters={setFilters}
            updateProblem={updateProblem}
          />
        )}
        {!loading && activeTab === "settings" && settings && (
          <TargetSettings settings={settings} saveSettings={saveSettings} />
        )}
      </section>
    </main>
  );
}

function Dashboard({ data }) {
  const topicMax = Math.max(
    ...data.topicBreakdown.map((item) => item.total),
    1,
  );

  return (
    <div className="dashboard-grid">
      <section className="metric-row">
        <Metric
          title="Solved"
          value={`${data.solved}/${data.total}`}
          detail={`${data.completionPercent}% complete`}
        />
        <Metric
          title="Remaining"
          value={data.remaining}
          detail="Problems left"
        />
        <Metric
          title="Streak"
          value={`${data.streak} day${data.streak === 1 ? "" : "s"}`}
          detail="Consecutive practice days"
          icon={Flame}
        />
        <Metric
          title="Today"
          value={`${data.todaySolved}/${data.dailyTarget}`}
          detail="Daily target progress"
          icon={CheckCircle2}
        />
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <h3>Overall Progress</h3>
          <span>{data.completionPercent}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${data.completionPercent}%` }}
          />
        </div>
      </section>

      <section className="panel">
        <h3>By Difficulty</h3>
        <div className="difficulty-grid">
          {data.difficultyBreakdown.map((item) => (
            <div
              key={item.difficulty}
              className={`difficulty-card ${item.difficulty}`}
            >
              <span>{item.difficulty}</span>
              <strong>
                {item.solved}/{item.total}
              </strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>By Topic</h3>
        <div className="topic-bars">
          {data.topicBreakdown.map((item) => (
            <div className="topic-bar" key={item.topic}>
              <div className="bar-label">
                <span>{item.topic}</span>
                <span>
                  {item.solved}/{item.total}
                </span>
              </div>
              <div className="mini-track">
                <div style={{ width: `${(item.total / topicMax) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ title, value, detail, icon: Icon }) {
  return (
    <article className="metric">
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
      {Icon && <Icon size={22} />}
    </article>
  );
}

function ProblemList({ problems, meta, filters, setFilters, updateProblem }) {
  const visibleTopics = useMemo(() => meta.topics || [], [meta]);

  return (
    <section className="panel table-panel">
      <div className="filters">
        <label className="search-field">
          <Search size={18} />
          <input
            value={filters.search}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                search: event.target.value,
              }))
            }
            placeholder="Search problems"
          />
        </label>
        <select
          value={filters.topic}
          onChange={(event) =>
            setFilters((current) => ({ ...current, topic: event.target.value }))
          }
        >
          <option value="">All topics</option>
          {visibleTopics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
        <select
          value={filters.difficulty}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              difficulty: event.target.value,
            }))
          }
        >
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select
          value={filters.status}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              status: event.target.value,
            }))
          }
        >
          <option value="">All statuses</option>
          <option value="not-started">Not started</option>
          <option value="in-progress">In progress</option>
          <option value="solved">Solved</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Question</th>
              <th>Topic</th>
              <th>Difficulty</th>
              <th>Status</th>
              <th>Solved</th>
              <th>Practice</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem) => (
              <tr key={problem._id}>
                <td>{problem.sheetNumber}</td>
                <td>{problem.name}</td>
                <td>{problem.topic}</td>
                <td>
                  <span className={`pill ${problem.difficulty}`}>
                    {problem.difficulty}
                  </span>
                </td>
                <td>
                  <select
                    value={problem.status}
                    onChange={(event) =>
                      updateProblem(problem, event.target.value)
                    }
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={problem.status === "solved"}
                    onChange={(event) =>
                      updateProblem(
                        problem,
                        event.target.checked ? "solved" : "not-started",
                      )
                    }
                    aria-label={`Mark ${problem.name} solved`}
                  />
                </td>

                {/* <td className="practice-links">
                  {problem.platforms?.leetcode && (
                    <a
                      href={problem.platforms.leetcode}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      LeetCode <ExternalLink size={14} />
                    </a>
                  )}

                  {problem.platforms?.geeksforgeeks && (
                    <a
                      href={problem.platforms.geeksforgeeks}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GeeksforGeeks <ExternalLink size={14} />
                    </a>
                  )}

                  {!problem.platforms?.leetcode &&
                    !problem.platforms?.geeksforgeeks && <span>No links</span>}
                </td> */}

                <td className="practice-links">
                  <a
                    href={
                      problem.platforms?.leetcode?.trim() ||
                      `https://leetcode.com/problemset/?search=${encodeURIComponent(problem.name)}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open on LeetCode"
                  >
                    LeetCode <ExternalLink size={14} />
                  </a>

                  <a
                    href={
                      problem.platforms?.geeksforgeeks?.trim() ||
                      `https://www.geeksforgeeks.org/?s=${encodeURIComponent(problem.name)}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open on GeeksforGeeks"
                  >
                    GeeksforGeeks <ExternalLink size={14} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TargetSettings({ settings, saveSettings }) {
  const [form, setForm] = useState(settings);

  return (
    <section className="panel settings-panel">
      <label>
        Daily target
        <input
          type="number"
          min="1"
          value={form.dailyTarget}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              dailyTarget: event.target.value,
            }))
          }
        />
      </label>
      <label>
        Reminder email
        <input
          type="email"
          value={form.reminderEmail || ""}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              reminderEmail: event.target.value,
            }))
          }
          placeholder="you@example.com"
        />
      </label>
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={form.remindersEnabled}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              remindersEnabled: event.target.checked,
            }))
          }
        />
        Reminders enabled
      </label>
      <button className="primary-button" onClick={() => saveSettings(form)}>
        Save target
      </button>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
