import React, { useState, useEffect } from 'react';
import { BookOpen, User, Clock, Book, Star, CheckCircle, Loader, RotateCcw, Play, Award, Search, LayoutDashboard, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:3001/api';

const MyCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const navigate = useNavigate();

  useEffect(() => {
    loadMyCourses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [enrollments, filter, search, sort]);

  const loadMyCourses = async () => {
    setLoading(true);
    const sessionData = localStorage.getItem('learnai_session');
    if (!sessionData) {
      navigate('/');
      return;
    }
    let session;
    try { session = JSON.parse(sessionData); } catch(e) { navigate('/'); return; }
    if (!session || !session.id) {
      navigate('/');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/courses/enrollments/${session.id}`);
      const data = await response.json();
      if (data.success) {
        setEnrollments(data.enrollments || []);
      } else {
        setError(data.message || 'Failed to load courses.');
      }
    } catch (err) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let list = [...enrollments];

    if (filter === 'in-progress') {
      list = list.filter(e => parseFloat(e.progress_percentage) < 100);
    } else if (filter === 'completed') {
      list = list.filter(e => parseFloat(e.progress_percentage) >= 100);
    }

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(e => 
        e.title.toLowerCase().includes(s) || 
        (e.instructor_name || '').toLowerCase().includes(s)
      );
    }

    if (sort === 'progress') {
      list.sort((a, b) => parseFloat(b.progress_percentage) - parseFloat(a.progress_percentage));
    } else if (sort === 'name') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    setFilteredEnrollments(list);
  };

  const openCourse = (courseId) => {
    window.location.href = `course-player.html?courseId=${courseId}&from=dashboard`;
  };

  const downloadCertificate = (e, courseId) => {
    e.stopPropagation();
    const sessionData = localStorage.getItem('learnai_session');
    if (!sessionData) return;
    const session = JSON.parse(sessionData);
    const url = `${API_BASE}/certificates/generate/${session.id}/${courseId}`;
    window.open(url, '_blank');
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><div className="spinner" style={{ margin: '0 auto' }}></div><p>Loading your courses...</p></div>;

  return (
    <div className="dashboard-container">
        <div className="section-header">
          <h1>My Courses</h1>
        </div>

        <div className="filter-section">
          <div className="filter-tabs">
            <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Courses</button>
            <button className={`filter-tab ${filter === 'in-progress' ? 'active' : ''}`} onClick={() => setFilter('in-progress')}>In Progress</button>
            <button className={`filter-tab ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>Completed</button>
          </div>
          <div className="filter-controls" style={{ marginTop: '1rem' }}>
            <div className="search-bar" style={{ flex: 1 }}>
              <input 
                type="text" 
                placeholder="Search your courses..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: 'none', background: 'none', width: '100%' }}
              />
              <Search size={18} color="#64748b" />
            </div>
            <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="recent">Recently Accessed</option>
              <option value="progress">Progress</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        <div className="courses-grid">
          {filteredEnrollments.length > 0 ? (
            filteredEnrollments.map((e) => {
              const pct = Math.round(parseFloat(e.progress_percentage) || 0);
              const isCompleted = pct >= 100;
              return (
                <div key={e.enrollment_id} className="course-card" onClick={() => openCourse(e.course_id)} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="course-card-header" style={{ background: '#f8fafc', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="icon-3d-wrapper icon-md icon-indigo">
                      <BookOpen size={20} />
                    </span>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '800', 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      background: isCompleted ? 'var(--success-soft)' : 'var(--primary-soft)',
                      color: isCompleted ? 'var(--success)' : 'var(--primary)'
                    }}>
                      {isCompleted ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                  <div className="course-card-body" style={{ padding: '1.5rem', flex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>{e.title}</h3>
                    <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '1.5rem' }}>By {e.instructor_name}</p>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>
                        <span style={{ color: '#64748b' }}>Course Progress</span>
                        <span style={{ color: 'var(--primary)' }}>{pct}%</span>
                      </div>
                      <div className="progress-bar-wrap">
                        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: isCompleted ? 'var(--success)' : 'var(--primary)' }}></div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {e.duration_hours || 0}h</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Book size={14} /> {e.total_lessons || 0} Lessons</span>
                    </div>
                  </div>
                  <div className="course-card-footer" style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px' }}>
                    <button className="btn-continue" style={{ flex: 1, padding: '10px', fontSize: '13px' }} onClick={(event) => { event.stopPropagation(); openCourse(e.course_id); }}>
                      {isCompleted ? <RotateCcw size={14} /> : <Play size={14} />} {isCompleted ? 'Review' : 'Continue'}
                    </button>
                    {isCompleted && (
                      <button className="btn-certificate" style={{ flex: 1, padding: '10px', fontSize: '13px' }} onClick={(event) => downloadCertificate(event, e.course_id)}>
                        <Award size={14} /> Certificate
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <div className="icon-3d-wrapper icon-xl icon-blue" style={{ marginBottom: '1.5rem' }}><BookOpen size={32} /></div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>No courses found</h3>
              <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{enrollments.length === 0 ? "You haven't enrolled in any courses yet." : "No courses match your current filters."}</p>
              {enrollments.length === 0 && (
                <button onClick={() => navigate('/browse-courses')} className="btn-continue">Explore Courses</button>
              )}
            </div>
          )}
        </div>
    </div>
  );
};

export default MyCourses;
