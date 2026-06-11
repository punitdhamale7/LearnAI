import React, { useState, useEffect, useRef } from "react";
import { User, Edit3, Camera, Share2, Briefcase, Code, ExternalLink, Plus, Trash2, Loader, X, Save } from "lucide-react";

const API_BASE = "http://localhost:3001/api";

function getSession() {
  try { return JSON.parse(localStorage.getItem("learnai_session")); } catch { return null; }
}

// Compress + resize image using canvas before upload
function compressImage(file, maxWidth, maxHeight, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      // Scale down if needed
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/* ── ALL HELPERS OUTSIDE COMPONENT — prevents focus loss on re-render ── */

const inputStyle = { padding:"9px 12px", border:"1px solid #D1D5DB", fontSize:14, color:"#1F2937", outline:"none", width:"100%", fontFamily:"inherit" };
const labelStyle = { fontSize:12, fontWeight:700, color:"#6B7280", textTransform:"uppercase", letterSpacing:"0.4px", display:"block", marginBottom:5 };

function FormField({ label, name, type, options, value, onChange }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={labelStyle}>{label}</label>
      {options ? (
        <select value={value} onChange={e => onChange(name, e.target.value)}
          style={{ ...inputStyle, background:"#fff" }}>
          <option value="">Select...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type || "text"}
          value={value}
          onChange={e => onChange(name, e.target.value)}
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = "#6B7280"; }}
          onBlur={e => { e.target.style.borderColor = "#D1D5DB"; }}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid #F3F4F6" }}>
      <span style={{ fontSize:12, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.4px" }}>{label}</span>
      <span style={{ fontSize:14, fontWeight:600, color: value ? "#1F2937" : "#D1D5DB" }}>{value || "Not set"}</span>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background:"#fff", border:"1px solid #E5E7EB", padding:"1.5rem", marginBottom:"1.5rem", boxShadow:"0 1px 4px rgba(0,0,0,0.05)", ...style }}>
      {children}
    </div>
  );
}

function EditBar({ onSave, onCancel, saving }) {
  return (
    <div style={{ display:"flex", gap:8, marginTop:16, paddingTop:14, borderTop:"1px solid #F3F4F6" }}>
      <button onClick={onSave} disabled={saving}
        style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 20px", background:"#4B5563", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13, opacity:saving?0.7:1 }}>
        {saving ? <><Loader size={13} style={{ animation:"spin 1s linear infinite" }} /> Saving...</> : <><Save size={13} /> Save Changes</>}
      </button>
      <button onClick={onCancel} disabled={saving}
        style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 20px", background:"#F3F4F6", color:"#374151", border:"1px solid #E5E7EB", cursor:"pointer", fontWeight:700, fontSize:13 }}>
        <X size={13} /> Cancel
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════ */
export default function Profile() {
  const [profile,  setProfile]  = useState(null);
  const [stats,    setStats]    = useState({ courses:0, completed:0, certificates:0 });
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading,  setCoverUploading]  = useState(false);
  const avatarRef = useRef(null);
  const coverRef  = useRef(null);
  const [editSection, setEditSection] = useState(null);
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);

  // delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Always read userId fresh from localStorage
  const getUserId = () => {
    try { return JSON.parse(localStorage.getItem("learnai_session"))?.id; } catch { return null; }
  };

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);

    // Read session fresh — don't rely on stale closure
    let uid = null;
    try {
      const s = localStorage.getItem("learnai_session");
      if (s) uid = JSON.parse(s)?.id;
    } catch { /* ignore */ }

    if (!uid) {
      setLoading(false);
      return;
    }

    try {
      // Load profile first (required), others are optional
      const pr = await fetch(`${API_BASE}/profile/${uid}`);
      const pd = await pr.json();
      if (pd.success) setProfile(pd.profile);

      // Load stats in parallel, ignore failures
      const [er, cr] = await Promise.allSettled([
        fetch(`${API_BASE}/courses/enrollments/${uid}`).then(r => r.json()),
        fetch(`${API_BASE}/certificates/user/${uid}`).then(r => r.json()),
      ]);

      if (er.status === "fulfilled" && er.value?.success) {
        const list = er.value.enrollments || [];
        setStats(prev => ({
          ...prev,
          courses:   list.length,
          completed: list.filter(e => parseFloat(e.progress_percentage) >= 100).length,
        }));
      }
      if (cr.status === "fulfilled" && cr.value?.success) {
        // API returns { success: true, count: N } — not an array
        const certCount = cr.value.count ?? (cr.value.certificates?.length ?? 0);
        setStats(prev => ({ ...prev, certificates: certCount }));
      }
    } catch(e) {
      console.error("Profile load error:", e);
    }
    setLoading(false);
  };

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { flash("X Select an image file"); return; }
    if (file.size > 10*1024*1024) { flash("X Max 10 MB"); return; }
    const uid = getUserId(); if (!uid) { flash("X Not logged in"); return; }
    setAvatarUploading(true);
    try {
      const b64 = await compressImage(file, 400, 400, 0.8);
      const res = await fetch(`${API_BASE}/profile/${uid}/avatar`, {
        method:"PUT", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ avatar_url: b64 })
      });
      const d = await res.json();
      if (d.success) { setProfile(p => ({ ...p, avatar_url:b64 })); flash("OK Profile photo updated!"); }
      else flash("X " + (d.message||"Upload failed"));
    } catch(err) { console.error("Avatar upload error:", err); flash("X Upload failed"); }
    setAvatarUploading(false); e.target.value = "";
  };

  const handleCover = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { flash("X Select an image file"); return; }
    if (file.size > 10*1024*1024) { flash("X Max 10 MB"); return; }
    const uid = getUserId(); if (!uid) { flash("X Not logged in"); return; }
    setCoverUploading(true);
    try {
      const b64 = await compressImage(file, 1200, 400, 0.8);
      const res = await fetch(`${API_BASE}/profile/${uid}/cover`, {
        method:"PUT", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ cover_url: b64 })
      });
      const d = await res.json();
      if (d.success) { setProfile(p => ({ ...p, cover_url:b64 })); flash("OK Cover photo updated!"); }
      else flash("X " + (d.message||"Upload failed"));
    } catch(err) { console.error("Cover upload error:", err); flash("X Upload failed"); }
    setCoverUploading(false); e.target.value = "";
  };

  const openEdit = (section) => {
    if (!profile) return;
    const maps = {
      personal:  { full_name:profile.full_name||"", phone:profile.phone||"", date_of_birth:profile.date_of_birth?profile.date_of_birth.split("T")[0]:"", gender:profile.gender||"" },
      education: { college:profile.college||"", degree:profile.degree||"", branch:profile.branch||"", year_of_study:profile.year_of_study||"", graduation_year:profile.graduation_year||"" },
      social:    { linkedin_url:profile.linkedin_url||"", github_url:profile.github_url||"", twitter_url:profile.twitter_url||"", website_url:profile.website_url||"" },
    };
    setForm(maps[section] || {});
    setEditSection(section);
  };

  const cancelEdit = () => { setEditSection(null); setForm({}); };

  const handleFormChange = (name, value) => setForm(f => ({ ...f, [name]:value }));

  const saveSection = async () => {
    const uid = getUserId(); if (!uid) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/profile/${uid}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      const d = await res.json();
      if (d.success) { setProfile(p => ({ ...p, ...form })); flash("OK Profile updated!"); setEditSection(null); }
      else flash("X " + (d.message||"Save failed"));
    } catch { flash("X Save failed"); }
    setSaving(false);
  };

  const addSkill = async () => {
    if (!newSkill.trim()) return;
    const uid = getUserId(); if (!uid) return;
    setAddingSkill(true);
    try {
      const res = await fetch(`${API_BASE}/profile/${uid}/skills`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ skill_name:newSkill.trim() }) });
      const d = await res.json();
      if (d.success) { setProfile(p => ({ ...p, skills:[...(p.skills||[]), newSkill.trim()] })); setNewSkill(""); flash("OK Skill added!"); }
      else flash("X " + (d.message||"Failed"));
    } catch { flash("X Failed"); }
    setAddingSkill(false);
  };

  const removeSkill = async (skill) => {
    const uid = getUserId(); if (!uid) return;
    try {
      const res = await fetch(`${API_BASE}/profile/${uid}/skills/${encodeURIComponent(skill)}`, { method:"DELETE" });
      const d = await res.json();
      if (d.success) { setProfile(p => ({ ...p, skills:(p.skills||[]).filter(s => s!==skill) })); flash("OK Skill removed"); }
      else flash("X " + (d.message||"Failed"));
    } catch { flash("X Failed"); }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== "DELETE") { flash("X Type DELETE to confirm"); return; }
    const uid = getUserId(); if (!uid) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/profile/${uid}`, {
        method:"DELETE", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ confirmation:"DELETE" }),
      });
      const d = await res.json();
      if (d.success) {
        localStorage.removeItem("learnai_session");
        localStorage.removeItem("learnai_tokens");
        window.location.href = "login.html";
      } else { flash("X " + (d.message||"Failed")); setDeleting(false); }
    } catch { flash("X Server error"); setDeleting(false); }
  };

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh", gap:16 }}>
      <div className="spinner" /><p style={{ color:"#9CA3AF", fontSize:14 }}>Loading profile...</p>
    </div>
  );

  if (!profile) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh", gap:16 }}>
      <p style={{ color:"#EF4444", fontSize:15, fontWeight:600 }}>Could not load profile.</p>
      <p style={{ color:"#9CA3AF", fontSize:13 }}>Make sure you are logged in and the backend is running.</p>
      <button onClick={load} style={{ padding:"10px 24px", background:"#4B5563", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13 }}>
        Retry
      </button>
    </div>
  );

  const avatarSrc = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=6B7280&color=fff&size=200`;
  const coverBg   = profile.cover_url ? `url(${profile.cover_url}) center/cover no-repeat` : "linear-gradient(135deg,#374151 0%,#6B7280 40%,#9CA3AF 70%,#D1D5DB 100%)";
  const skills    = profile.skills?.length ? profile.skills : [];
  const isOk      = (msg) => msg.startsWith("OK");

  return (
    <div className="dashboard-container">
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>

      {toast && (
        <div style={{ position:"fixed", top:20, right:20, zIndex:9999, padding:"12px 20px", fontWeight:700, fontSize:14,
          background:isOk(toast)?"#D1FAE5":"#FEE2E2", color:isOk(toast)?"#065F46":"#991B1B",
          border:`1px solid ${isOk(toast)?"#6EE7B7":"#FCA5A5"}`, boxShadow:"0 4px 16px rgba(0,0,0,0.12)" }}>
          {toast.replace(/^(OK|X) /,"")}
        </div>
      )}

      <input ref={avatarRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleAvatar} />
      <input ref={coverRef}  type="file" accept="image/*" style={{ display:"none" }} onChange={handleCover} />

      <div style={{ marginBottom:"1.5rem" }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:"#1F2937" }}>My Profile</h1>
      </div>

      {/* HEADER */}
      <div style={{ background:"#fff", border:"1px solid #E5E7EB", overflow:"hidden", marginBottom:"2rem", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ height:180, background:coverBg, position:"relative" }}>
          {!profile.cover_url && <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,rgba(255,255,255,0.08) 0%,rgba(0,0,0,0.15) 100%)", pointerEvents:"none" }} />}
          <button onClick={() => !coverUploading && coverRef.current?.click()} disabled={coverUploading}
            style={{ position:"absolute", bottom:14, right:14, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.3)", color:"#fff", padding:"8px 16px", cursor:"pointer", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
            {coverUploading ? <><Loader size={13} style={{ animation:"spin 1s linear infinite" }} /> Uploading...</> : <><Camera size={13} /> Change Cover</>}
          </button>
        </div>

        <div style={{ display:"flex", alignItems:"flex-end", gap:"1.5rem", padding:"0 2rem 1.75rem", marginTop:-56, flexWrap:"wrap" }}>
          <div style={{ position:"relative", flexShrink:0 }}>
            <img src={avatarSrc} alt={profile.full_name}
              onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=6B7280&color=fff&size=200`; }}
              style={{ width:110, height:110, borderRadius:"50%", border:"4px solid #fff", objectFit:"cover", boxShadow:"0 4px 16px rgba(0,0,0,0.18)", display:"block" }} />
            <div onClick={() => !avatarUploading && avatarRef.current?.click()}
              style={{ position:"absolute", inset:0, borderRadius:"50%", background:"rgba(0,0,0,0.45)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", opacity:0, transition:"opacity 0.2s", color:"#fff", fontSize:11, fontWeight:700, gap:4 }}
              onMouseEnter={e => { if (!avatarUploading) e.currentTarget.style.opacity=1; }}
              onMouseLeave={e => { e.currentTarget.style.opacity=0; }}>
              {avatarUploading ? <Loader size={20} style={{ animation:"spin 1s linear infinite" }} /> : <><Camera size={20} /><span>Change</span></>}
            </div>
            <button onClick={() => !avatarUploading && avatarRef.current?.click()} disabled={avatarUploading}
              style={{ position:"absolute", bottom:4, right:4, width:30, height:30, background:avatarUploading?"#9CA3AF":"#4B5563", color:"#fff", border:"3px solid #fff", borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {avatarUploading ? <Loader size={12} style={{ animation:"spin 1s linear infinite" }} /> : <Camera size={13} />}
            </button>
          </div>

          <div style={{ flex:1, minWidth:0, paddingBottom:4 }}>
            <h2 style={{ fontSize:22, fontWeight:800, color:"#1F2937", margin:"0 0 4px" }}>{profile.full_name}</h2>
            <p style={{ fontSize:13, color:"#9CA3AF", margin:"0 0 16px", fontWeight:500 }}>@{profile.username||"user"} · {profile.email}</p>
            <div style={{ display:"flex", gap:"2.5rem" }}>
              {[{ val:stats.courses, label:"Enrolled" }, { val:stats.completed, label:"Completed" }, { val:stats.certificates, label:"Certificates" }].map(({ val, label }) => (
                <div key={label} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:22, fontWeight:800, color:"#1F2937", lineHeight:1 }}>{val}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.5px", marginTop:3 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display:"flex", gap:10, paddingBottom:4, flexShrink:0 }}>
            <button onClick={() => openEdit("personal")}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 20px", background:"#4B5563", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13 }}>
              <Edit3 size={15} /> Edit Profile
            </button>
            <button style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 20px", background:"#F3F4F6", color:"#374151", border:"1px solid #E5E7EB", cursor:"pointer", fontWeight:700, fontSize:13 }}>
              <Share2 size={15} /> Share
            </button>
          </div>
        </div>
      </div>

      {/* TWO COLUMNS */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:"1.5rem" }}>
        <div>
          {/* Personal */}
          <Card>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem", paddingBottom:"1rem", borderBottom:"1px solid #F3F4F6" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}><User size={16} color="#6B7280" /><span style={{ fontSize:15, fontWeight:700, color:"#1F2937" }}>Personal Information</span></div>
              {editSection !== "personal" && <button onClick={() => openEdit("personal")} style={{ background:"#F3F4F6", border:"none", width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#6B7280" }}><Edit3 size={15} /></button>}
            </div>
            {editSection === "personal" ? (
              <div>
                <FormField label="Full Name"     name="full_name"     value={form.full_name||""}     onChange={handleFormChange} />
                <FormField label="Phone"         name="phone"         value={form.phone||""}         onChange={handleFormChange} type="tel" />
                <FormField label="Date of Birth" name="date_of_birth" value={form.date_of_birth||""} onChange={handleFormChange} type="date" />
                <FormField label="Gender"        name="gender"        value={form.gender||""}        onChange={handleFormChange} options={["Male","Female","Other","Prefer not to say"]} />
                <EditBar onSave={saveSection} onCancel={cancelEdit} saving={saving} />
              </div>
            ) : (
              <>
                <InfoRow label="Full Name"     value={profile.full_name} />
                <InfoRow label="Email"         value={profile.email} />
                <InfoRow label="Phone"         value={profile.phone} />
                <InfoRow label="Date of Birth" value={profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : null} />
                <InfoRow label="Gender"        value={profile.gender} />
              </>
            )}
          </Card>

          {/* Education */}
          <Card>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem", paddingBottom:"1rem", borderBottom:"1px solid #F3F4F6" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}><Briefcase size={16} color="#6B7280" /><span style={{ fontSize:15, fontWeight:700, color:"#1F2937" }}>Education</span></div>
              {editSection !== "education" && <button onClick={() => openEdit("education")} style={{ background:"#F3F4F6", border:"none", width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#6B7280" }}><Edit3 size={15} /></button>}
            </div>
            {editSection === "education" ? (
              <div>
                <FormField label="University / College" name="college"         value={form.college||""}         onChange={handleFormChange} />
                <FormField label="Degree"               name="degree"          value={form.degree||""}          onChange={handleFormChange} options={["Bachelor's","Master's","PhD","Diploma","Other"]} />
                <FormField label="Branch / Major"       name="branch"          value={form.branch||""}          onChange={handleFormChange} />
                <FormField label="Year of Study"        name="year_of_study"   value={form.year_of_study||""}   onChange={handleFormChange} options={["1st Year","2nd Year","3rd Year","4th Year","Final Year","Graduated"]} />
                <FormField label="Graduation Year"      name="graduation_year" value={form.graduation_year||""} onChange={handleFormChange} type="number" />
                <EditBar onSave={saveSection} onCancel={cancelEdit} saving={saving} />
              </div>
            ) : (
              <>
                <InfoRow label="University"     value={profile.college} />
                <InfoRow label="Degree"         value={profile.degree} />
                <InfoRow label="Branch / Major" value={profile.branch} />
                <InfoRow label="Year of Study"  value={profile.year_of_study} />
                <InfoRow label="Graduation"     value={profile.graduation_year} />
              </>
            )}
          </Card>
        </div>

        <div>
          {/* Skills */}
          <Card>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem", paddingBottom:"1rem", borderBottom:"1px solid #F3F4F6" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}><Code size={16} color="#6B7280" /><span style={{ fontSize:15, fontWeight:700, color:"#1F2937" }}>Skills & Expertise</span></div>
              <button onClick={() => setEditSection(editSection==="skills" ? null : "skills")} style={{ background:"#F3F4F6", border:"none", width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#6B7280" }}><Plus size={15} /></button>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:editSection==="skills"?14:0 }}>
              {skills.length===0 && editSection!=="skills" && <span style={{ fontSize:13, color:"#D1D5DB" }}>No skills added yet</span>}
              {skills.map((skill,i) => (
                <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#F3F4F6", color:"#374151", padding:"6px 12px", fontSize:12, fontWeight:700, border:"1px solid #E5E7EB" }}>
                  {skill}
                  <button onClick={() => removeSkill(skill)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", display:"flex", alignItems:"center", padding:0 }}><X size={11} /></button>
                </span>
              ))}
            </div>
            {editSection === "skills" && (
              <div style={{ display:"flex", gap:8, marginTop:8 }}>
                <input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => { if (e.key==="Enter") addSkill(); }}
                  placeholder="e.g. TypeScript"
                  style={{ flex:1, padding:"8px 12px", border:"1px solid #D1D5DB", fontSize:13, outline:"none", fontFamily:"inherit" }} />
                <button onClick={addSkill} disabled={addingSkill||!newSkill.trim()}
                  style={{ padding:"8px 16px", background:"#4B5563", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13, opacity:(!newSkill.trim()||addingSkill)?0.5:1 }}>
                  {addingSkill?"...":"Add"}
                </button>
              </div>
            )}
          </Card>

          {/* Social */}
          <Card>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem", paddingBottom:"1rem", borderBottom:"1px solid #F3F4F6" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}><ExternalLink size={16} color="#6B7280" /><span style={{ fontSize:15, fontWeight:700, color:"#1F2937" }}>Social Presence</span></div>
              {editSection !== "social" && <button onClick={() => openEdit("social")} style={{ background:"#F3F4F6", border:"none", width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#6B7280" }}><Edit3 size={15} /></button>}
            </div>
            {editSection === "social" ? (
              <div>
                <FormField label="LinkedIn URL" name="linkedin_url" value={form.linkedin_url||""} onChange={handleFormChange} type="url" />
                <FormField label="GitHub URL"   name="github_url"   value={form.github_url||""}   onChange={handleFormChange} type="url" />
                <FormField label="Twitter URL"  name="twitter_url"  value={form.twitter_url||""}  onChange={handleFormChange} type="url" />
                <FormField label="Website URL"  name="website_url"  value={form.website_url||""}  onChange={handleFormChange} type="url" />
                <EditBar onSave={saveSection} onCancel={cancelEdit} saving={saving} />
              </div>
            ) : (
              [["LinkedIn",profile.linkedin_url],["GitHub",profile.github_url],["Twitter",profile.twitter_url],["Website",profile.website_url]].map(([label,val]) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", background:"#F9FAFB", border:"1px solid #F3F4F6", marginBottom:8 }}>
                  <ExternalLink size={14} color="#9CA3AF" />
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.4px" }}>{label}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:val?"#1F2937":"#D1D5DB" }}>
                      {val ? <a href={val} target="_blank" rel="noreferrer" style={{ color:"#4B5563", textDecoration:"none" }}>{val}</a> : "Not linked"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </Card>

          {/* Danger */}
          <Card style={{ background:"#FEF2F2", border:"1px solid #FECACA" }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:"#DC2626", marginBottom:6 }}>Danger Zone</h3>
            <p style={{ fontSize:12, color:"#EF4444", marginBottom:16, lineHeight:1.5 }}>Once you delete your account, there is no going back. All your data will be permanently removed.</p>
            <button
              onClick={() => { setShowDeleteModal(true); setDeleteConfirm(""); }}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", background:"#DC2626", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13 }}>
              <Trash2 size={14} /> Deactivate Account
            </button>
          </Card>
        </div>
      </div>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {showDeleteModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10000, padding:16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}>
          <div style={{ background:"#fff", width:"100%", maxWidth:440, boxShadow:"0 20px 60px rgba(0,0,0,0.25)", overflow:"hidden" }}>
            {/* Header */}
            <div style={{ background:"#DC2626", padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <Trash2 size={18} color="#fff" />
                <span style={{ fontWeight:800, fontSize:16, color:"#fff" }}>Delete Account</span>
              </div>
              <button onClick={() => setShowDeleteModal(false)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.8)", cursor:"pointer", display:"flex", alignItems:"center" }}>
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding:"24px 24px 20px" }}>
              <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", padding:"14px 16px", marginBottom:20 }}>
                <p style={{ fontSize:13, color:"#991B1B", fontWeight:600, lineHeight:1.6, margin:0 }}>
                  ⚠️ This action is <strong>permanent and irreversible</strong>. All your courses, progress, achievements, and messages will be deleted forever.
                </p>
              </div>

              <p style={{ fontSize:13, color:"#374151", marginBottom:12, fontWeight:500 }}>
                To confirm, type <strong style={{ color:"#DC2626", fontFamily:"monospace" }}>DELETE</strong> in the box below:
              </p>

              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="Type DELETE to confirm"
                autoFocus
                style={{ width:"100%", padding:"10px 14px", border:`2px solid ${deleteConfirm === "DELETE" ? "#DC2626" : "#E5E7EB"}`, fontSize:14, fontFamily:"monospace", fontWeight:700, outline:"none", color:"#1F2937", marginBottom:20, transition:"border-color 0.2s" }}
              />

              <div style={{ display:"flex", gap:10 }}>
                <button
                  onClick={deleteAccount}
                  disabled={deleteConfirm !== "DELETE" || deleting}
                  style={{ flex:1, padding:"11px", background: deleteConfirm === "DELETE" ? "#DC2626" : "#F3F4F6", color: deleteConfirm === "DELETE" ? "#fff" : "#9CA3AF", border:"none", cursor: deleteConfirm === "DELETE" && !deleting ? "pointer" : "not-allowed", fontWeight:700, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all 0.2s" }}>
                  {deleting
                    ? <><Loader size={14} style={{ animation:"spin 1s linear infinite" }} /> Deleting…</>
                    : <><Trash2 size={14} /> Yes, Delete My Account</>}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  style={{ flex:1, padding:"11px", background:"#F3F4F6", color:"#374151", border:"1px solid #E5E7EB", cursor:"pointer", fontWeight:700, fontSize:14 }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
