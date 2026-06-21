import React, { useState, useMemo, useEffect } from "react";

function fmt(n) {
  const v = Number(n) || 0;
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysUntil(dateStr) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days) {
  if (days <= 3) return "#FF6B4A";
  if (days <= 10) return "#FFB84D";
  return "#5EEAD4";
}

function monthlyEquivalent(price, cycle) {
  const p = Number(price) || 0;
  if (cycle === "yearly") return p / 12;
  if (cycle === "weekly") return p * 4.33;
  return p;
}

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const SEED = [
  { id: 1, name: "Netflix", price: 15.49, cycle: "monthly", renewal: addDays(4) },
  { id: 2, name: "Spotify", price: 11.99, cycle: "monthly", renewal: addDays(12) },
  { id: 3, name: "iCloud+", price: 2.99, cycle: "monthly", renewal: addDays(1) },
  { id: 4, name: "Adobe Creative Cloud", price: 239.88, cycle: "yearly", renewal: addDays(58) },
  { id: 5, name: "Gym membership", price: 39.99, cycle: "monthly", renewal: addDays(20) },
];

const CYCLES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

function loadSubs() {
  // Check if window is defined to prevent Server-Side Rendering (SSR) build errors
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem("subtrack_subs");
    return raw ? JSON.parse(raw) : SEED;
  } catch {
    return SEED;
  }
}

export default function App() {
  const [subs, setSubs] = useState(loadSubs);
  const [formOpen, setFormOpen] = useState(false);
  const [mName, setMName] = useState("");
  const [mPrice, setMPrice] = useState("");
  const [mCycle, setMCycle] = useState("monthly");
  const [mRenewal, setMRenewal] = useState(todayStr());

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("subtrack_subs", JSON.stringify(subs));
    }
  }, [subs]);

  const totalMonthly = useMemo(
    () => subs.reduce((s, sub) => s + monthlyEquivalent(sub.price, sub.cycle), 0),
    [subs]
  );
  const totalYearly = totalMonthly * 12;

  const sortedByUrgency = useMemo(
    () => [...subs].sort((a, b) => daysUntil(a.renewal) - daysUntil(b.renewal)),
    [subs]
  );

  const soonCount = subs.filter((s) => daysUntil(s.renewal) <= 7).length;

  function addSub(sub) {
    setSubs((prev) => [...prev, { id: Date.now() + Math.random(), ...sub }]);
  }

  function deleteSub(id) {
    setSubs((prev) => prev.filter((s) => s.id !== id));
  }

  function handleAdd() {
    const price = parseFloat(mPrice);
    if (!mName.trim() || !price || price <= 0 || !mRenewal) return;
    addSub({ name: mName, price, cycle: mCycle, renewal: mRenewal });
    setMName("");
    setMPrice("");
    setMCycle("monthly");
    setMRenewal(todayStr());
    setFormOpen(false);
  }

  return (
    <div
      style={{
        "--bg": "#16181D",
        "--surface": "#2A2D35",
        "--text": "#F4F2ED",
        "--muted": "#8A8D96",
        "--coral": "#FF6B4A",
        "--teal": "#5EEAD4",
        "--amber": "#FFB84D",
        "--line": "#383B44",
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        background: "var(--bg)",
        color: "var(--text)",
        minHeight: "100vh",
      }}
    >
      {/* Safely inject CSS via dangerouslySetInnerHTML to clear up compile parser issues */}
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; }
        .tabular { font-variant-numeric: tabular-nums; }
        input, button, select { font-family: inherit; }
        button { cursor: pointer; }
        input::placeholder { color: #6B6E76; }
        .row:hover { background: rgba(255,255,255,0.02); }
        .row:hover .del-btn { opacity: 1; }
        .del-btn { opacity: 0; transition: opacity 0.15s ease; }
        .dot { transition: transform 0.15s ease; }
        .dot:hover { transform: scale(1.4); }
        input:focus, select:focus, button:focus-visible {
          outline: 2px solid var(--teal);
          outline-offset: 1px;
        }
      `}} />

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 100px" }}>
        <div style={{ fontSize: 12, letterSpacing: "0.12em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 10 }}>
          Total monthly burn
        </div>
        <div className="tabular" style={{ fontSize: 64, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em" }}>
          ${fmt(totalMonthly)}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 14, color: "var(--muted)" }}>
            <span className="tabular" style={{ color: "var(--text)", fontWeight: 600 }}>${fmt(totalYearly)}</span> per year
          </div>
          <div style={{ fontSize: 14, color: "var(--muted)" }}>
            <span className="tabular" style={{ color: "var(--text)", fontWeight: 600 }}>{subs.length}</span> active subscriptions
          </div>
          {soonCount > 0 && (
            <div style={{ fontSize: 14, color: "var(--coral)", fontWeight: 600 }}>
              {soonCount} renewing within 7 days
            </div>
          )}
        </div>

        {subs.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{ fontSize: 12, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 14 }}>
              Next 30 days
            </div>
            <div style={{ position: "relative", height: 50 }}>
              <div style={{ position: "absolute", top: 24, left: 0, right: 0, height: 2, background: "var(--line)" }} />
              {sortedByUrgency
                .filter((s) => daysUntil(s.renewal) >= 0 && daysUntil(s.renewal) <= 30)
                .map((s) => {
                  const days = daysUntil(s.renewal);
                  const leftPct = Math.min((days / 30) * 100, 100);
                  const color = urgencyColor(days);
                  return (
                    <div
                      key={s.id}
                      className="dot"
                      title={`${s.name} — $${fmt(s.price)} in ${days}d`}
                      style={{
                        position: "absolute",
                        left: `${leftPct}%`,
                        top: 16,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: color,
                        border: "2px solid var(--bg)",
                        transform: "translateX(-50%)",
                        boxShadow: `0 0 0 3px ${color}22`,
                      }}
                    />
                  );
                })}
              <div style={{ position: "absolute", top: 32, left: 0, fontSize: 11, color: "var(--muted)" }}>Today</div>
              <div style={{ position: "absolute", top: 32, right: 0, fontSize: 11, color: "var(--muted)" }}>30 days</div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 36, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", color: "var(--muted)", textTransform: "uppercase" }}>
              Add a subscription
            </div>
            <button
              onClick={() => setFormOpen((v) => !v)}
              style={{ background: formOpen ? "var(--text)" : "var(--teal)", color: "#16181D", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700 }}
            >
              {formOpen ? "Close" : "+ Add"}
            </button>
          </div>

          {formOpen && (
            <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                value={mName}
                onChange={(e) => setMName(e.target.value)}
                placeholder="Service name (e.g. Netflix)"
                style={{ flex: "2 1 160px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "var(--text)" }}
              />
              <input
                value={mPrice}
                onChange={(e) => setMPrice(e.target.value)}
                placeholder="Price"
                type="number"
                className="tabular"
                style={{ flex: "1 1 80px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "var(--text)" }}
              />
              <select
                value={mCycle}
                onChange={(e) => setMCycle(e.target.value)}
                style={{ flex: "1 1 100px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "var(--text)" }}
              >
                {CYCLES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </select>
              <div style={{ flex: "1 1 100%", fontSize: 11, color: "var(--muted)", marginTop: -2 }}>
                Next renewal date
              </div>
              <input
                value={mRenewal}
                onChange={(e) => setMRenewal(e.target.value)}
                type="date"
                style={{ flex: "1 1 160px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "var(--text)" }}
              />
              <button
                onClick={handleAdd}
                style={{ background: "var(--teal)", color: "#16181D", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700 }}
              >
                Save
              </button>
            </div>
          )}
        </div>

        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 12 }}>
            All subscriptions
          </div>
          <div style={{ border: "1px solid var(--line)", borderRadius: 16, background: "var(--surface)", overflow: "hidden" }}>
            {sortedByUrgency.length === 0 && (
              <div style={{ padding: 32, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                Nothing tracked yet. Add your first subscription above.
              </div>
            )}
            {sortedByUrgency.map((s, i) => {
              const days = daysUntil(s.renewal);
              const color = urgencyColor(days);
              return (
                <div key={s.id} className="row" style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderBottom: i < sortedByUrgency.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                      {days < 0 ? "Renewal date passed" : days === 0 ? "Renews today" : `Renews in ${days} day${days === 1 ? "" : "s"}`}
                      {" · "}{s.cycle}
                    </div>
                  </div>
                  <div className="tabular" style={{ fontSize: 16, fontWeight: 600 }}>${fmt(s.price)}</div>
                  <button className="del-btn" onClick={() => deleteSub(s.id)} aria-label={`Remove ${s.name}`} style={{ background: "none", border: "none", color: "var(--coral)", fontSize: 13, padding: "2px 6px" }}>✕</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
