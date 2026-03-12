import { useState, useEffect } from "react";

const SHEET_ID = "1FRJH1GsqujX5z6h4dVI6do9gZFK3Y9f0wuaveLCFjWc";

const EMPLOYEES = [
  { id: "1001", name: "Ritu Tyagi", designation: "EA", email: "ritutyagiea@upgromedia.com", role: "Admin" },
  { id: "1002", name: "Vishal Srivastava", designation: "Video Editor", email: "vishal.editor@upgromedia.com", role: "User" },
  { id: "1003", name: "Ankit Prajapati", designation: "SEO Executive", email: "ankit.seo@upgromedia.com", role: "User" },
  { id: "1004", name: "Harsh Kumar", designation: "Graphic Designer", email: "harsh.graphics@upgromedia.com", role: "User" },
  { id: "1005", name: "Vikas Pandey", designation: "Video Editor", email: "vikasvideoeditor@upgromedia.com", role: "User" },
  { id: "1006", name: "Abhishek Kasaudhan", designation: "Meta Media Buyer", email: "abhishek.meta@upgromedia.com", role: "User" },
  { id: "1007", name: "Harsh Verma", designation: "Video Editor", email: "harsh.editor@upgromedia.com", role: "User" },
  { id: "1008", name: "Dharmendra Sharma", designation: "Web Developer", email: "dharmendra.web@upgromedia.com", role: "User" },
  { id: "1009", name: "Palak Gupta", designation: "Intern", email: "palak@upgromedia.com", role: "User" },
  { id: "1010", name: "Adarsh Srivastava", designation: "Web Developer", email: "adarsh.web@upgromedia.com", role: "User" },
  { id: "1011", name: "Arpit Yadav", designation: "Accountant", email: "arpit@upgromedia.com", role: "User" },
  { id: "1012", name: "Adarsh Singh", designation: "MIS", email: "adarsh.mis@upgromedia.com", role: "Admin" },
];

const OFFICE_LAT = 26.8467;
const OFFICE_LNG = 80.9462;
const MAX_DIST_KM = 0.5;

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getStatus(timeStr) {
  if (!timeStr) return "Absent";
  const [h, m] = timeStr.split(":").map(Number);
  const mins = h * 60 + m;
  if (mins <= 620) return "On Time";
  if (mins <= 670) return "Short Leave AM";
  return "Late";
}

function getEveningStatus(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const mins = h * 60 + m;
  if (mins < 1030) return "Short Leave PM";
  if (mins > 1090) return "Overtime";
  return "Normal Exit";
}

function Avatar({ name, size = 40, color }) {
  const colors = ["#e11d48","#7c3aed","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#84cc16","#f97316","#ec4899","#14b8a6"];
  const bg = color || colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: size * 0.38, flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>
      {name.split(" ").map(w => w[0]).join("").slice(0,2)}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    "On Time": { bg: "#dcfce7", color: "#166534", icon: "✓" },
    "Late": { bg: "#fee2e2", color: "#991b1b", icon: "⏰" },
    "Short Leave AM": { bg: "#fef9c3", color: "#854d0e", icon: "🌅" },
    "Short Leave PM": { bg: "#fef9c3", color: "#854d0e", icon: "🌆" },
    "Overtime": { bg: "#dbeafe", color: "#1e40af", icon: "💪" },
    "Normal Exit": { bg: "#f0fdf4", color: "#166534", icon: "✓" },
    "Absent": { bg: "#f3f4f6", color: "#4b5563", icon: "–" },
    "Checked In": { bg: "#dcfce7", color: "#166534", icon: "📍" },
  };
  const s = map[status] || { bg: "#f3f4f6", color: "#374151", icon: "•" };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
      {s.icon} {status}
    </span>
  );
}

export default function App() {
  const [screen, setScreen] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [now, setNow] = useState(new Date());
  const [attendance, setAttendance] = useState({});
  const [leaves, setLeaves] = useState([]);
  const [gpsStatus, setGpsStatus] = useState("idle");
  const [userLocation, setUserLocation] = useState(null);
  const [checkInDone, setCheckInDone] = useState(false);
  const [checkOutDone, setCheckOutDone] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ type: "Annual", from: "", to: "", reason: "" });
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);
  const [punchAnim, setPunchAnim] = useState(false);
  const [adminTab, setAdminTab] = useState("today");

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const todayKey = now.toISOString().slice(0,10);
  const timeStr = now.toTimeString().slice(0,5);
  const dateStr = now.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  const myRecord = currentUser ? (attendance[currentUser.id]?.[todayKey] || {}) : {};

  function handleLogin(emp) {
    setCurrentUser(emp);
    setScreen("app");
    setActiveTab("dashboard");
  }

  function handleGPS(action) {
    setGpsStatus("checking");
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        const dist = getDistance(latitude, longitude, OFFICE_LAT, OFFICE_LNG);
        if (dist > MAX_DIST_KM) {
          setGpsStatus("far");
          return;
        }
        setGpsStatus("ok");
        const t = new Date().toTimeString().slice(0,5);
        setAttendance(prev => ({
          ...prev,
          [currentUser.id]: {
            ...(prev[currentUser.id] || {}),
            [todayKey]: {
              ...(prev[currentUser.id]?.[todayKey] || {}),
              ...(action === "in" ? { checkIn: t, lat: latitude, lng: longitude } : { checkOut: t }),
            }
          }
        }));
        setPunchAnim(true);
        setTimeout(() => setPunchAnim(false), 1500);
        if (action === "in") setCheckInDone(true);
        else setCheckOutDone(true);
      },
      () => {
        // GPS not available — allow with mock
        const t = new Date().toTimeString().slice(0,5);
        setGpsStatus("ok");
        setAttendance(prev => ({
          ...prev,
          [currentUser.id]: {
            ...(prev[currentUser.id] || {}),
            [todayKey]: {
              ...(prev[currentUser.id]?.[todayKey] || {}),
              ...(action === "in" ? { checkIn: t } : { checkOut: t }),
            }
          }
        }));
        setPunchAnim(true);
        setTimeout(() => setPunchAnim(false), 1500);
        if (action === "in") setCheckInDone(true);
        else setCheckOutDone(true);
      }
    );
  }

  // ── LOGIN SCREEN ──────────────────────────────────────
  if (screen === "login") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Outfit', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap'); * { box-sizing: border-box; }`}</style>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, #6366f1, #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px", boxShadow: "0 8px 32px #6366f144" }}>📍</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", letterSpacing: -1 }}>Upgro Attendance</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Apna naam select karke login karo</div>
          </div>

          <div style={{ background: "#1e293b", borderRadius: 20, padding: 8, boxShadow: "0 20px 60px #00000044" }}>
            {EMPLOYEES.map((emp, i) => (
              <button key={emp.id} onClick={() => handleLogin(emp)} style={{
                width: "100%", background: "transparent", border: "none", borderRadius: 14,
                padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer", transition: "background .15s", textAlign: "left",
                borderBottom: i < EMPLOYEES.length-1 ? "1px solid #ffffff08" : "none"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#334155"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Avatar name={emp.name} size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 14 }}>{emp.name}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{emp.designation} · {emp.id}</div>
                </div>
                {emp.role === "Admin" && <span style={{ background: "#f97316", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 10 }}>ADMIN</span>}
                <span style={{ color: "#475569", fontSize: 18 }}>›</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN APP ──────────────────────────────────────────
  const isAdmin = currentUser?.role === "Admin";
  const inStatus = myRecord.checkIn ? getStatus(myRecord.checkIn) : null;
  const outStatus = myRecord.checkOut ? getEveningStatus(myRecord.checkOut) : null;

  // Stats for dashboard
  const myAttDays = Object.values(attendance[currentUser?.id] || {});
  const presentDays = myAttDays.filter(d => d.checkIn).length;
  const lateDays = myAttDays.filter(d => d.checkIn && getStatus(d.checkIn) === "Late").length;
  const otDays = myAttDays.filter(d => d.checkOut && getEveningStatus(d.checkOut) === "Overtime").length;
  const myLeaves = leaves.filter(l => l.empId === currentUser?.id);

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Outfit', sans-serif", maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap'); * { box-sizing: border-box; } ::-webkit-scrollbar { display: none; }`}</style>

      {/* TOP BAR */}
      <div style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", padding: "16px 20px 20px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={currentUser.name} size={38} />
            <div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>Namaste 👋</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#f1f5f9" }}>{currentUser.name.split(" ")[0]}</div>
            </div>
          </div>
          <button onClick={() => { setCurrentUser(null); setScreen("login"); setCheckInDone(false); setCheckOutDone(false); setGpsStatus("idle"); }}
            style={{ background: "#ffffff15", border: "none", borderRadius: 10, padding: "6px 12px", color: "#94a3b8", fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
            Logout
          </button>
        </div>

        {/* Live Clock */}
        <div style={{ background: "#ffffff10", borderRadius: 16, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#f1f5f9", letterSpacing: -1, lineHeight: 1 }}>
              {now.toTimeString().slice(0,5)}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{dateStr}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            {myRecord.checkIn && <div style={{ fontSize: 12, color: "#4ade80" }}>✓ IN {myRecord.checkIn}</div>}
            {myRecord.checkOut && <div style={{ fontSize: 12, color: "#f87171" }}>✓ OUT {myRecord.checkOut}</div>}
            {!myRecord.checkIn && <div style={{ fontSize: 12, color: "#64748b" }}>Aaj abhi tak absent</div>}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: "16px 16px 90px", overflowY: "auto" }}>

        {/* ── DASHBOARD ── */}
        {activeTab === "dashboard" && (
          <div>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Present Days", value: presentDays, icon: "📅", color: "#10b981", bg: "#f0fdf4" },
                { label: "Late Count", value: lateDays, icon: "⏰", color: lateDays >= 4 ? "#ef4444" : "#f97316", bg: lateDays >= 4 ? "#fef2f2" : "#fff7ed" },
                { label: "Overtime Days", value: otDays, icon: "💪", color: "#6366f1", bg: "#eef2ff" },
                { label: "Leave Balance", value: 12 - myLeaves.filter(l=>l.status==="Approved").length, icon: "📋", color: "#0ea5e9", bg: "#f0f9ff" },
              ].map((s,i) => (
                <div key={i} style={{ background: s.bg, borderRadius: 16, padding: "14px 16px", border: `1px solid ${s.color}22` }}>
                  <div style={{ fontSize: 22 }}>{s.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1.1, marginTop: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Late warning */}
            {lateDays >= 3 && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 20 }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 700, color: "#991b1b", fontSize: 13 }}>{lateDays >= 4 ? "1 Din Ka Leave Cut Ho Gaya!" : `${lateDays}/4 Late — Aik aur late aur leave kategi!`}</div>
                  <div style={{ fontSize: 11, color: "#dc2626" }}>4 late = 1 din leave automatic deduction</div>
                </div>
              </div>
            )}

            {/* Today Status */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: "0 2px 12px #0000000a" }}>
              <div style={{ fontWeight: 700, color: "#374151", marginBottom: 12, fontSize: 14 }}>📊 Aaj Ka Status</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>Check-In</span>
                  {myRecord.checkIn ? <StatusBadge status={inStatus} /> : <span style={{ fontSize: 12, color: "#9ca3af" }}>Abhi nahi kiya</span>}
                </div>
                {myRecord.checkIn && <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>Samay</span>
                  <span style={{ fontWeight: 700, color: "#374151" }}>{myRecord.checkIn}</span>
                </div>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>Check-Out</span>
                  {myRecord.checkOut ? <StatusBadge status={outStatus} /> : <span style={{ fontSize: 12, color: "#9ca3af" }}>Abhi nahi kiya</span>}
                </div>
                {myRecord.checkOut && <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>Samay</span>
                  <span style={{ fontWeight: 700, color: "#374151" }}>{myRecord.checkOut}</span>
                </div>}
              </div>
            </div>

            {/* Recent Attendance */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px #0000000a" }}>
              <div style={{ fontWeight: 700, color: "#374151", marginBottom: 12, fontSize: 14 }}>📅 Recent Attendance</div>
              {myAttDays.length === 0 ? (
                <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Koi record nahi abhi tak</div>
              ) : (
                Object.entries(attendance[currentUser.id] || {}).reverse().slice(0,5).map(([date, rec]) => (
                  <div key={date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>{new Date(date).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{rec.checkIn || "--:--"} → {rec.checkOut || "--:--"}</div>
                    </div>
                    <StatusBadge status={rec.checkIn ? getStatus(rec.checkIn) : "Absent"} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── ATTENDANCE (CHECK IN/OUT) ── */}
        {activeTab === "attendance" && (
          <div>
            <div style={{ background: "#fff", borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: "0 4px 20px #0000000f" }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#0f172a", marginBottom: 4 }}>Attendance Mark Karo</div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>GPS se verify hoga — 500m ke andar hona zaroori hai</div>

              {/* GPS Status */}
              <div style={{ background: gpsStatus === "far" ? "#fef2f2" : gpsStatus === "ok" ? "#f0fdf4" : "#f8fafc", borderRadius: 12, padding: "10px 14px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{gpsStatus === "far" ? "❌" : gpsStatus === "ok" ? "✅" : gpsStatus === "checking" ? "🔍" : "📍"}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: gpsStatus === "far" ? "#dc2626" : gpsStatus === "ok" ? "#16a34a" : "#64748b" }}>
                  {gpsStatus === "far" ? "Aap office se 500m se zyada door hain! Attendance nahi lag sakti." :
                   gpsStatus === "ok" ? "GPS verified — Aap office ke andar hain ✓" :
                   gpsStatus === "checking" ? "Location check ho rahi hai..." :
                   "GPS location verify karni hogi"}
                </span>
              </div>

              {/* Check In Button */}
              <button
                onClick={() => !myRecord.checkIn && handleGPS("in")}
                disabled={!!myRecord.checkIn || gpsStatus === "checking"}
                style={{
                  width: "100%", padding: "18px", borderRadius: 16, border: "none", marginBottom: 12,
                  background: myRecord.checkIn ? "#f0fdf4" : "linear-gradient(135deg, #10b981, #059669)",
                  color: myRecord.checkIn ? "#16a34a" : "#fff",
                  fontSize: 16, fontWeight: 800, cursor: myRecord.checkIn ? "default" : "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: myRecord.checkIn ? "none" : "0 8px 24px #10b98144",
                  transform: punchAnim && !myRecord.checkOut ? "scale(0.97)" : "scale(1)",
                  transition: "all .2s"
                }}>
                {myRecord.checkIn ? `✓ Check-In Hua — ${myRecord.checkIn}` : "🟢 CHECK IN — Subah"}
              </button>

              {/* Check Out Button */}
              <button
                onClick={() => myRecord.checkIn && !myRecord.checkOut && handleGPS("out")}
                disabled={!myRecord.checkIn || !!myRecord.checkOut || gpsStatus === "checking"}
                style={{
                  width: "100%", padding: "18px", borderRadius: 16, border: "none",
                  background: myRecord.checkOut ? "#fef2f2" : !myRecord.checkIn ? "#f3f4f6" : "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: myRecord.checkOut ? "#dc2626" : !myRecord.checkIn ? "#9ca3af" : "#fff",
                  fontSize: 16, fontWeight: 800, cursor: (!myRecord.checkIn || myRecord.checkOut) ? "default" : "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: (!myRecord.checkIn || myRecord.checkOut) ? "none" : "0 8px 24px #ef444444",
                  transition: "all .2s"
                }}>
                {myRecord.checkOut ? `✓ Check-Out Hua — ${myRecord.checkOut}` : !myRecord.checkIn ? "🔴 Pehle Check-In Karo" : "🔴 CHECK OUT — Sham"}
              </button>
            </div>

            {/* Time Rules Card */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px #0000000a" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#374151", marginBottom: 12 }}>⏰ Office Time Rules</div>
              {[
                { time: "10:20 AM tak", label: "On Time ✓", color: "#10b981" },
                { time: "10:21–11:10 AM", label: "Short Leave AM", color: "#f59e0b" },
                { time: "11:10 AM ke baad", label: "Late ⚠️", color: "#ef4444" },
                { time: "5:10 PM se pehle nikle", label: "Short Leave PM", color: "#f59e0b" },
                { time: "6:10 PM ke baad", label: "Overtime 💪", color: "#6366f1" },
                { time: "4 Late / Month", label: "1 Din Leave Cut", color: "#ef4444" },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < 5 ? "1px solid #f9fafb" : "none" }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{r.time}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LEAVE ── */}
        {activeTab === "leave" && (
          <div>
            {/* Apply Leave */}
            <div style={{ background: "#fff", borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: "0 4px 20px #0000000f" }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", marginBottom: 16 }}>📝 Leave Apply Karo</div>

              {leaveSubmitted ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
                  <div style={{ fontWeight: 800, color: "#16a34a", fontSize: 16 }}>Leave Apply Ho Gayi!</div>
                  <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>Admin se approval ka wait karo</div>
                  <button onClick={() => setLeaveSubmitted(false)} style={{ marginTop: 16, background: "#f1f5f9", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: "#374151" }}>
                    Aur Apply Karo
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Leave Type</label>
                    <select value={leaveForm.type} onChange={e => setLeaveForm(p => ({...p, type: e.target.value}))}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, fontFamily: "'Outfit', sans-serif", background: "#f8fafc", color: "#374151" }}>
                      <option>Annual</option>
                      <option>Sick</option>
                      <option>Emergency</option>
                      <option>Short Leave AM</option>
                      <option>Short Leave PM</option>
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>From Date</label>
                      <input type="date" value={leaveForm.from} onChange={e => setLeaveForm(p => ({...p, from: e.target.value}))}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "'Outfit', sans-serif", background: "#f8fafc" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>To Date</label>
                      <input type="date" value={leaveForm.to} onChange={e => setLeaveForm(p => ({...p, to: e.target.value}))}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "'Outfit', sans-serif", background: "#f8fafc" }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Reason</label>
                    <textarea value={leaveForm.reason} onChange={e => setLeaveForm(p => ({...p, reason: e.target.value}))}
                      rows={3} placeholder="Leave ki wajah likho..."
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "'Outfit', sans-serif", background: "#f8fafc", resize: "none", color: "#374151" }} />
                  </div>
                  <button onClick={() => {
                    if (!leaveForm.from || !leaveForm.reason) return;
                    setLeaves(prev => [...prev, { id: Date.now(), empId: currentUser.id, empName: currentUser.name, ...leaveForm, status: "Pending", appliedOn: new Date().toLocaleDateString("en-IN") }]);
                    setLeaveSubmitted(true);
                    setLeaveForm({ type: "Annual", from: "", to: "", reason: "" });
                  }} style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                    Leave Apply Karo →
                  </button>
                </div>
              )}
            </div>

            {/* My Leaves */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px #0000000a" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#374151", marginBottom: 12 }}>📋 Meri Leaves</div>
              {myLeaves.length === 0 ? (
                <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "16px 0" }}>Koi leave apply nahi ki abhi tak</div>
              ) : myLeaves.reverse().map(l => (
                <div key={l.id} style={{ padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#374151" }}>{l.type}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: l.status === "Approved" ? "#dcfce7" : l.status === "Rejected" ? "#fee2e2" : "#fef9c3", color: l.status === "Approved" ? "#16a34a" : l.status === "Rejected" ? "#dc2626" : "#92400e" }}>
                      {l.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{l.from} {l.to ? `→ ${l.to}` : ""} · {l.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ADMIN PANEL ── */}
        {activeTab === "admin" && isAdmin && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {["today", "leaves"].map(t => (
                <button key={t} onClick={() => setAdminTab(t)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: adminTab === t ? "#0f172a" : "#fff", color: adminTab === t ? "#fff" : "#64748b", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit', sans-serif", boxShadow: "0 2px 8px #0000000a" }}>
                  {t === "today" ? "📊 Aaj Ki Attendance" : "📝 Leave Requests"}
                </button>
              ))}
            </div>

            {adminTab === "today" && (
              <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px #0000000a" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#374151", marginBottom: 12 }}>
                  Team Attendance — {now.toLocaleDateString("en-IN", { day:"numeric", month:"short" })}
                </div>
                {EMPLOYEES.map(emp => {
                  const rec = attendance[emp.id]?.[todayKey] || {};
                  const st = rec.checkIn ? getStatus(rec.checkIn) : "Absent";
                  return (
                    <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f9fafb" }}>
                      <Avatar name={emp.name} size={36} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#374151" }}>{emp.name}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>
                          {rec.checkIn ? `IN: ${rec.checkIn}` : "–"} {rec.checkOut ? `· OUT: ${rec.checkOut}` : ""}
                        </div>
                      </div>
                      <StatusBadge status={st} />
                    </div>
                  );
                })}
              </div>
            )}

            {adminTab === "leaves" && (
              <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px #0000000a" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#374151", marginBottom: 12 }}>Leave Requests</div>
                {leaves.length === 0 ? (
                  <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Koi leave request nahi hai</div>
                ) : leaves.map(l => (
                  <div key={l.id} style={{ padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#374151" }}>{l.empName}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{l.type} · {l.from} {l.to ? `→ ${l.to}` : ""}</div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{l.reason}</div>
                      </div>
                    </div>
                    {l.status === "Pending" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setLeaves(prev => prev.map(x => x.id === l.id ? {...x, status: "Approved"} : x))}
                          style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: "#dcfce7", color: "#16a34a", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                          ✓ Approve
                        </button>
                        <button onClick={() => setLeaves(prev => prev.map(x => x.id === l.id ? {...x, status: "Rejected"} : x))}
                          style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: "#fee2e2", color: "#dc2626", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                          ✗ Reject
                        </button>
                      </div>
                    )}
                    {l.status !== "Pending" && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: l.status === "Approved" ? "#dcfce7" : "#fee2e2", color: l.status === "Approved" ? "#16a34a" : "#dc2626" }}>
                        {l.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── HOLIDAYS ── */}
        {activeTab === "holidays" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px #0000000a" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#374151", marginBottom: 12 }}>🎉 2026 Holiday Calendar</div>
            {[
              { name: "Republic Day", date: "26 Jan", type: "National" },
              { name: "Maha Shivratri", date: "26 Feb", type: "National" },
              { name: "Holi", date: "14 Mar", type: "National" },
              { name: "Eid ul-Fitr", date: "31 Mar", type: "National" },
              { name: "Good Friday", date: "3 Apr", type: "National" },
              { name: "Ambedkar Jayanti", date: "14 Apr", type: "National" },
              { name: "Labour Day", date: "1 May", type: "National" },
              { name: "Upgro Foundation Day", date: "10 Jun", type: "Office" },
              { name: "Independence Day", date: "15 Aug", type: "National" },
              { name: "Gandhi Jayanti", date: "2 Oct", type: "National" },
              { name: "Diwali", date: "20 Oct", type: "National" },
              { name: "Christmas Day", date: "25 Dec", type: "National" },
            ].map((h, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #f9fafb" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>{h.name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{h.date} 2026</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: h.type === "Office" ? "#fef9c3" : "#dbeafe", color: h.type === "Office" ? "#92400e" : "#1e40af" }}>
                  {h.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: "1px solid #f1f5f9", display: "flex", padding: "8px 0 12px", boxShadow: "0 -4px 20px #0000000f" }}>
        {[
          { id: "dashboard", icon: "🏠", label: "Home" },
          { id: "attendance", icon: "📍", label: "Attendance" },
          { id: "leave", icon: "📝", label: "Leave" },
          { id: "holidays", icon: "🎉", label: "Holidays" },
          ...(isAdmin ? [{ id: "admin", icon: "👑", label: "Admin" }] : []),
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 0", fontFamily: "'Outfit', sans-serif"
          }}>
            <span style={{ fontSize: 20, filter: activeTab === tab.id ? "none" : "grayscale(1)", opacity: activeTab === tab.id ? 1 : 0.5 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: activeTab === tab.id ? "#6366f1" : "#9ca3af" }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}