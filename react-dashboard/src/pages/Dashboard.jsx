import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Hand, BookOpen, CheckCircle, Trophy, Bot, Flame,
  Star, Target, ChevronRight, Clock, Monitor, Code2,
  Cpu, Smartphone, Globe, Database, Shield, Gamepad2,
  Layers, Server, BarChart2, PenTool, Zap
} from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

/* ── helpers ─────────────────────────────────────────── */
function getSession() {
  try {
    const raw = localStorage.getItem('learnai_session') || localStorage.getItem('session');
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d.user || d;
  } catch { return null; }
}

function getCourseIcon(title = '') {
  const t = title.toLowerCase();
  if (t.includes('web') || t.includes('full stack'))  return { icon: Globe,    color: 'icon-indigo' };
  if (t.includes('python'))                            return { icon: Code2,    color: 'icon-green'  };
  if (t.includes('ai') || t.includes('machine'))      return { icon: Cpu,      color: 'icon-purple' };
  if (t.includes('mobile') || t.includes('app'))      return { icon: Smartphone,color: 'icon-blue'  };
  if (t.includes('react'))                             return { icon: Layers,   color: 'icon-blue'   };
  if (t.includes('node'))                              return { icon: Server,   color: 'icon-green'  };
  if (t.includes('database') || t.includes('sql'))    return { icon: Database, color: 'icon-orange' };
  if (t.includes('design') || t.includes('ui'))       return { icon: PenTool,  color: 'icon-red'    };
  if (t.includes('javascript') || t.includes('js'))   return { icon: Zap,      color: 'icon-orange' };
  if (t.includes('data'))                              return { icon: BarChart2,color: 'icon-orange' };
  if (t.includes('security') || t.includes('cyber'))  return { icon: Shield,   color: 'icon-red'    };
  if (t.includes('game'))                              return { icon: Gamepad2, color: 'icon-purple' };
  return { icon: BookOpen, color: 'icon-blue' };
}

/* ══════════════════════════════════════════════════════ */
const Dashboard = () => {
  const navigate = useNavigate();
  const user = getSession();
  const userId = user?.id;
  const fullName = user?.full_name || user?.name || user?.username || '';
  const firstName = fullName.split(' ')[0] || 'there';

  /* state */
  const [stats,        setStats]        = useState({ enrolled: 0, completed: 0, certificates: 0 });
  const [courses,      setCourses]      = useState([]);  // enrolled courses (up to 3)
  const [recs,         setRecs]         = useState([]);  // AI recommendations (up to 3)
  const [badges,       setBadges]       = useState([]);  // recent achievements (up to 4)
  const [streak,       setStreak]       = useState({ current: 0, longest: 0, activeDays: [] });
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const load = async () => {
      try {
        /* ── 1. enrollments + stats ── */
        const [enrollRes, statsRes, certRes] = await Promise.all([
          fetch(`${API_BASE}/courses/enrollments/${userId}`),
          fetch(`${API_BASE}/achievements/stats/${userId}`),
          fetch(`${API_BASE}/certificates/user/${userId}`),
        ]);

        const enrollData = await enrollRes.json();
        const statsData  = await statsRes.json();
        const certData   = await certRes.json();

        const enrollments = enrollData.success ? (enrollData.enrollments || []) : [];
        const enrolled    = enrollments.length;
        const completed   = enrollments.filter(e =>
          e.status === 'completed' || Number(e.progress_percentage) >= 100
        ).length;
        const certificates = certData.success ? (certData.certificates?.length || 0) : completed;

        setStats({ enrolled, completed, certificates });

        // Show up to 3 in-progress courses
        const inProgress = enrollments
          .filter(e => e.status !== 'completed' && Number(e.progress_percentage) < 100)
          .sort((a, b) => new Date(b.last_accessed || 0) - new Date(a.last_accessed || 0))
          .slice(0, 3);
        setCourses(inProgress.length ? inProgress : enrollments.slice(0, 3));

        /* ── 2. streak ── */
        if (statsData.success) {
          const s = statsData.stats || {};
          const current = s.current_streak || s.current_streak_days || 0;
          const longest = s.longest_streak || s.longest_streak_days || 0;
          // Build active days array from streak count (last N days of week)
          const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
          const today = new Date().getDay(); // 0=Sun
          const todayIdx = today === 0 ? 6 : today - 1; // convert to Mon=0
          const activeDays = days.map((_, i) => {
            const daysAgo = (todayIdx - i + 7) % 7;
            return daysAgo < Math.min(current, 7);
          });
          setStreak({ current, longest, activeDays });
        }

        /* ── 3. AI recommendations ── */
        const recRes = await fetch(`${API_BASE}/recommendations/${userId}`);
        const recData = await recRes.json();
        if (recData.success) {
          setRecs((recData.recommendations || []).slice(0, 3));
        }

        /* ── 4. recent badges/achievements ── */
        const achRes = await fetch(`${API_BASE}/achievements/${userId}`);
        const achData = await achRes.json();
        if (achData.success) {
          const unlocked = (achData.achievements || [])
            .filter(a => a.unlocked_at)
            .sort((a, b) => new Date(b.unlocked_at) - new Date(a.unlocked_at))
            .slice(0, 4);
          setBadges(unlocked);
        }

      } catch (e) {
        console.error('Dashboard load error:', e);
      }
      setLoading(false);
    };

    load();
  }, [userId]);

  /* ── badge rarity color ── */
  const rarityColor = { common: 'icon-blue', rare: 'icon-indigo', epic: 'icon-purple', legendary: 'icon-orange' };

  /* ── loading skeleton ── */
  if (loading) return (
    <main className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div className="spinner" />
    </main>
  );

  return (
    <main className="dashboard-container">

      {/* ── Welcome ── */}
      <section className="welcome-section">
        <div className="welcome-content">
          <h1>Welcome back, {firstName}! <span className="icon-3d-wrapper icon-sm icon-orange"><Hand size={18} /></span></h1>
          <p>
            {stats.enrolled === 0
              ? "You haven't enrolled in any courses yet. Start learning today!"
              : `You're doing great! Keep up the momentum.`}
          </p>
        </div>
        <div className="welcome-stats">
          <div className="stat-card">
            <span className="icon-3d-wrapper icon-md icon-blue"><BookOpen size={24} /></span>
            <div><h3>{stats.enrolled}</h3><p>Enrolled</p></div>
          </div>
          <div className="stat-card">
            <span className="icon-3d-wrapper icon-md icon-green"><CheckCircle size={24} /></span>
            <div><h3>{stats.completed}</h3><p>Completed</p></div>
          </div>
          <div className="stat-card">
            <span className="icon-3d-wrapper icon-md icon-orange"><Trophy size={24} /></span>
            <div><h3>{stats.certificates}</h3><p>Certificates</p></div>
          </div>
        </div>
      </section>

      {/* ── Continue Learning ── */}
      <section className="section">
        <div className="section-header">
          <h2><span className="icon-3d-wrapper icon-sm icon-indigo"><BookOpen size={16} /></span> Continue Learning</h2>
          <NavLink to="/my-courses" className="view-all">View All <ChevronRight size={14} /></NavLink>
        </div>

        {courses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            <BookOpen size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontWeight: 600 }}>No courses yet</p>
            <p style={{ fontSize: 13 }}>Browse courses and start learning!</p>
            <button
              className="btn-continue"
              style={{ marginTop: 16 }}
              onClick={() => navigate('/browse-courses')}
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map(course => {
              const { icon: Icon, color } = getCourseIcon(course.title);
              const pct = Math.round(Number(course.progress_percentage) || 0);
              const completed = course.completed_lessons || 0;
              const total = course.total_lessons || '?';
              return (
                <div
                  key={course.id || course.course_id}
                  className="course-card-dash"
                  onClick={() => navigate('/my-courses')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="course-thumbnail">
                    <span className={`icon-3d-wrapper icon-lg ${color}`}><Icon size={40} /></span>
                  </div>
                  <div className="course-info">
                    <h3>{course.title}</h3>
                    <p className="course-instructor">By {course.instructor_name}</p>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="course-meta-dash">
                      <span>{pct}% Complete</span>
                      <span>{completed}/{total} Lessons</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="two-column-layout">
        <div className="left-column">

          {/* ── AI Recommendations ── */}
          <section className="section">
            <div className="section-header">
              <h2><span className="icon-3d-wrapper icon-sm icon-purple"><Bot size={16} /></span> AI Recommendations</h2>
              <NavLink to="/recommendations" className="view-all">Explore More</NavLink>
            </div>

            {recs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: 13 }}>
                <Bot size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                <p>No recommendations yet. Enrol in a course to get personalised suggestions!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recs.map((rec, i) => {
                  const { icon: Icon, color } = getCourseIcon(rec.title);
                  return (
                    <div key={i} style={{ padding: '1rem', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className={`icon-3d-wrapper icon-md ${color}`}><Icon size={22} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.title}</h4>
                        <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>
                          {rec.reason || rec.instructor_name || 'Recommended for you'}
                        </p>
                      </div>
                      <button
                        className="btn-continue"
                        style={{ padding: '7px 14px', fontSize: '12px', flexShrink: 0 }}
                        onClick={() => navigate('/browse-courses')}
                      >
                        Enrol
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Learning Streak ── */}
          <section className="section">
            <div className="section-header">
              <h2><span className="icon-3d-wrapper icon-sm icon-orange"><Flame size={16} /></span> Learning Streak</h2>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {streak.current} Day{streak.current !== 1 ? 's' : ''} <Flame fill="#f59e0b" size={28} />
                </div>
                <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                  Longest streak: {streak.longest} day{streak.longest !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['M','T','W','T','F','S','S'].map((d, i) => (
                  <div key={i} style={{
                    width: 36, height: 36,
                    background: streak.activeDays[i] ? 'linear-gradient(135deg,#f59e0b,#fbbf24)' : '#f1f5f9',
                    color: streak.activeDays[i] ? '#fff' : '#94a3b8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800,
                    boxShadow: streak.activeDays[i] ? '0 4px 6px rgba(245,158,11,0.2)' : 'none'
                  }}>{d}</div>
                ))}
              </div>
            </div>
          </section>

        </div>

        <div className="right-column">

          {/* ── Recent Badges ── */}
          <section className="section">
            <div className="section-header">
              <h2><span className="icon-3d-wrapper icon-sm icon-orange"><Trophy size={16} /></span> Recent Badges</h2>
              <NavLink to="/achievements" className="view-all">View All</NavLink>
            </div>

            {badges.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: 13 }}>
                <Trophy size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                <p>No badges yet. Complete lessons to earn your first badge!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {badges.map((badge, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '1.25rem 0.75rem', background: '#fff', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{badge.icon || '🏆'}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1f2937' }}>{badge.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, textTransform: 'capitalize' }}>{badge.rarity || 'common'}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Quick Stats ── */}
          <section className="section">
            <div className="section-header">
              <h2><span className="icon-3d-wrapper icon-sm icon-blue"><Star size={16} /></span> Quick Stats</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Courses Enrolled',  value: stats.enrolled,     icon: BookOpen,    color: 'icon-blue'   },
                { label: 'Courses Completed', value: stats.completed,    icon: CheckCircle, color: 'icon-green'  },
                { label: 'Certificates',      value: stats.certificates, icon: Trophy,      color: 'icon-orange' },
                { label: 'Current Streak',    value: `${streak.current}d`,icon: Flame,      color: 'icon-orange' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`icon-3d-wrapper icon-sm ${color}`}><Icon size={14} /></span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#1f2937' }}>{value}</span>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </main>
  );
};

export default Dashboard;
