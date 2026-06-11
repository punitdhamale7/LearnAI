import React, { useState, useEffect } from 'react';
import { BarChart3, BookOpen, CheckCircle2, Clock, Flame, Layers, Activity } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const API_BASE = 'http://localhost:3001/api';

const Progress = () => {
  const [stats, setStats] = useState({ total_enrollments: 0, total_lessons_completed: 0, current_streak_days: 0, total_hours: 0 });
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    setLoading(true);
    const sessionData = localStorage.getItem('learnai_session');
    if (!sessionData) return;
    let session;
    try { session = JSON.parse(sessionData); } catch(e) { return; }
    if (!session?.id) return;
    const userId = session.id;

    try {
      const [enrollRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/courses/enrollments/${userId}`),
        fetch(`${API_BASE}/achievements/stats/${userId}`)
      ]);

      const enrollData = await enrollRes.json();
      const statsData = await statsRes.json();

      if (statsData.success) {
        setStats(prev => ({ ...prev, ...statsData.stats }));
      }

      if (enrollData.success) {
        setEnrollments(enrollData.enrollments);
        let totalH = 0;
        enrollData.enrollments.forEach(e => totalH += parseFloat(e.duration_hours || 0));
        setStats(prev => ({ ...prev, total_hours: Math.round(totalH) }));
      }
    } catch (err) {
      setError('Failed to load progress data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><div className="spinner" style={{ margin: '0 auto' }}></div><p>Loading your progress...</p></div>;

  return (
    <div className="dashboard-container">
      <div className="section-header">
        <h1>Learning Progress</h1>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="stat-card" style={{ background: '#fff' }}>
          <span className="icon-3d-wrapper icon-lg icon-blue"><BookOpen size={28} /></span>
          <div>
            <h3>{stats.total_enrollments}</h3>
            <p>Enrolled Courses</p>
          </div>
        </div>
        <div className="stat-card" style={{ background: '#fff' }}>
          <span className="icon-3d-wrapper icon-lg icon-green"><CheckCircle2 size={28} /></span>
          <div>
            <h3>{stats.total_lessons_completed}</h3>
            <p>Lessons Done</p>
          </div>
        </div>
        <div className="stat-card" style={{ background: '#fff' }}>
          <span className="icon-3d-wrapper icon-lg icon-indigo"><Clock size={28} /></span>
          <div>
            <h3>{stats.total_hours}</h3>
            <p>Hours Spent</p>
          </div>
        </div>
        <div className="stat-card" style={{ background: '#fff' }}>
          <span className="icon-3d-wrapper icon-lg icon-red"><Flame size={28} /></span>
          <div>
            <h3>{stats.current_streak_days}</h3>
            <p>Active Streak</p>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="section-header">
          <h2><span className="icon-3d-wrapper icon-sm icon-indigo"><Layers size={16} /></span> Detailed Course Progress</h2>
        </div>
        <div className="progress-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {enrollments.length > 0 ? (
            enrollments.map(course => {
              const pct = Math.round(parseFloat(course.progress_percentage) || 0);
              return (
                <div key={course.enrollment_id} style={{ background: '#fff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>{course.title}</h4>
                    <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '18px' }}>{pct}%</span>
                  </div>
                  <div className="progress-bar-wrap" style={{ height: '12px' }}>
                    <div className="progress-bar-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6366f1, #a855f7)' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginTop: '12px', fontWeight: '500' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><CheckCircle2 size={14} /> {course.completed_lessons || 0} / {course.total_lessons || 0} Lessons</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={14} /> {course.duration_hours || 0}h Total</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <div className="icon-3d-wrapper icon-xl icon-blue" style={{ marginBottom: '1.5rem' }}><BookOpen size={32} /></div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>No courses enrolled yet</h3>
              <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Start your journey by enrolling in our expert-led courses.</p>
              <NavLink to="/browse-courses" className="btn-continue">Browse Courses</NavLink>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2><span className="icon-3d-wrapper icon-sm icon-purple"><Activity size={16} /></span> Learning Activity</h2>
        </div>
        <div style={{ background: '#fff', padding: '3rem', borderRadius: '20px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div className="icon-3d-wrapper icon-lg icon-indigo" style={{ marginBottom: '1rem' }}><BarChart3 size={24} /></div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Your activity heatmap is being generated</h3>
          <p style={{ color: '#64748b' }}>Complete more lessons to see your weekly learning patterns here.</p>
        </div>
      </section>
    </div>
  );
};

export default Progress;
