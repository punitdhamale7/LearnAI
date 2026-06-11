import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Hand, 
  BookOpen, 
  CheckCircle, 
  Trophy, 
  Monitor, 
  Code2, 
  Bot, 
  Flame, 
  Medal, 
  Star, 
  Target,
  ChevronRight,
  Clock,
  Users
} from 'lucide-react';

const Dashboard = () => {
  const [userName, setUserName] = useState('Punit');
  const navigate = useNavigate();

  useEffect(() => {
    const session = localStorage.getItem('learnai_session');
    if (session) {
      try {
        const userData = JSON.parse(session);
        if (userData.name || userData.full_name) {
          setUserName((userData.name || userData.full_name).split(' ')[0]);
        }
      } catch (e) {}
    }
  }, []);

  return (
    <main className="dashboard-container">
      {/* Welcome Section */}
      <section className="welcome-section">
        <div className="welcome-content">
          <h1>Welcome back, {userName}! <span className="icon-3d-wrapper icon-sm icon-orange"><Hand size={18} /></span></h1>
          <p>You're doing great! You have 3 lessons to complete today.</p>
        </div>
        <div className="welcome-stats">
          <div className="stat-card">
            <span className="icon-3d-wrapper icon-md icon-blue"><BookOpen size={24} /></span>
            <div>
              <h3>5</h3>
              <p>Enrolled</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="icon-3d-wrapper icon-md icon-green"><CheckCircle size={24} /></span>
            <div>
              <h3>12</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="icon-3d-wrapper icon-md icon-orange"><Trophy size={24} /></span>
            <div>
              <h3>8</h3>
              <p>Certificates</p>
            </div>
          </div>
        </div>
      </section>

      {/* Continue Learning */}
      <section className="section">
        <div className="section-header">
          <h2><span className="icon-3d-wrapper icon-sm icon-indigo"><BookOpen size={16} /></span> Continue Learning</h2>
          <NavLink to="/my-courses" className="view-all">View All <ChevronRight size={14} /></NavLink>
        </div>
        
        <div className="courses-grid">
          <div className="course-card-dash" onClick={() => navigate('/my-courses')}>
            <div className="course-thumbnail">
              <span className="icon-3d-wrapper icon-lg icon-indigo"><Monitor size={40} /></span>
            </div>
            <div className="course-info">
              <h3>Full Stack Web Development</h3>
              <p className="course-instructor">By John Smith</p>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: '65%' }}></div>
              </div>
              <div className="course-meta-dash">
                <span>65% Complete</span>
                <span>12/18 Lessons</span>
              </div>
            </div>
          </div>

          <div className="course-card-dash" onClick={() => navigate('/my-courses')}>
            <div className="course-thumbnail">
              <span className="icon-3d-wrapper icon-lg icon-green"><Code2 size={40} /></span>
            </div>
            <div className="course-info">
              <h3>Python for Data Science</h3>
              <p className="course-instructor">By Sarah Johnson</p>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: '40%' }}></div>
              </div>
              <div className="course-meta-dash">
                <span>40% Complete</span>
                <span>8/20 Lessons</span>
              </div>
            </div>
          </div>

          <div className="course-card-dash" onClick={() => navigate('/my-courses')}>
            <div className="course-thumbnail">
              <span className="icon-3d-wrapper icon-lg icon-purple"><Bot size={40} /></span>
            </div>
            <div className="course-info">
              <h3>AI & Machine Learning</h3>
              <p className="course-instructor">By Dr. Michael Chen</p>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: '20%' }}></div>
              </div>
              <div className="course-meta-dash">
                <span>20% Complete</span>
                <span>4/25 Lessons</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="two-column-layout">
        <div className="left-column">
          <section className="section">
            <div className="section-header">
              <h2><span className="icon-3d-wrapper icon-sm icon-purple"><Bot size={16} /></span> AI Recommendations</h2>
              <NavLink to="/recommendations" className="view-all">Explore More</NavLink>
            </div>
            <div className="recommended-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <span className="icon-3d-wrapper icon-md icon-blue"><Bot size={24} /></span>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>React Native for Beginners</h4>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>Based on your interest in Web Development</p>
                  </div>
                  <button className="btn-continue" style={{ padding: '8px 16px', fontSize: '13px' }}>Enrol</button>
               </div>
               <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <span className="icon-3d-wrapper icon-md icon-purple"><Target size={24} /></span>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Advanced SQL Patterns</h4>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>Suggested for Data Science path</p>
                  </div>
                  <button className="btn-continue" style={{ padding: '8px 16px', fontSize: '13px' }}>Enrol</button>
               </div>
            </div>
          </section>

          <section className="section">
            <div className="section-header">
              <h2><span className="icon-3d-wrapper icon-sm icon-orange"><Flame size={16} /></span> Learning Streak</h2>
            </div>
            <div className="streak-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                   7 Days <Flame fill="#f59e0b" size={28} />
                </div>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Highest streak: 12 days</p>
              </div>
              <div className="streak-calendar" style={{ display: 'flex', gap: '8px' }}>
                {['M','T','W','T','F','S','S'].map((d, i) => (
                  <div key={i} style={{ 
                    width: '36px', height: '36px', borderRadius: '10px', 
                    background: i < 5 ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : '#f1f5f9', 
                    color: i < 5 ? '#fff' : '#94a3b8', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: '13px', fontWeight: '800',
                    boxShadow: i < 5 ? '0 4px 6px rgba(245, 158, 11, 0.2)' : 'none'
                  }}>{d}</div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="right-column">
          <section className="section">
            <div className="section-header">
              <h2><span className="icon-3d-wrapper icon-sm icon-blue"><Clock size={16} /></span> Upcoming Events</h2>
            </div>
            <div className="events-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}>
                  <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '12px', textAlign: 'center', minWidth: '54px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: '800', color: '#6366f1', fontSize: '18px' }}>15</div>
                    <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>Mar</div>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>Live Workshop</h4>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>3:00 PM - 5:00 PM</p>
                  </div>
               </div>
               <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '12px', textAlign: 'center', minWidth: '54px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: '800', color: '#6366f1', fontSize: '18px' }}>22</div>
                    <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>Mar</div>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>Q&A Session</h4>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>6:00 PM - 7:00 PM</p>
                  </div>
               </div>
            </div>
          </section>

          <section className="section">
            <div className="section-header">
              <h2><span className="icon-3d-wrapper icon-sm icon-orange"><Trophy size={16} /></span> Recent Badges</h2>
            </div>
            <div className="achievements-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
               <div style={{ textAlign: 'center', padding: '1.25rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <span className="icon-3d-wrapper icon-md icon-orange" style={{ marginBottom: '8px' }}><Trophy size={20} /></span>
                  <div style={{ fontSize: '12px', fontWeight: '700' }}>Fast Learner</div>
               </div>
               <div style={{ textAlign: 'center', padding: '1.25rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <span className="icon-3d-wrapper icon-md icon-blue" style={{ marginBottom: '8px' }}><Star size={20} /></span>
                  <div style={{ fontSize: '12px', fontWeight: '700' }}>Top Student</div>
               </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
