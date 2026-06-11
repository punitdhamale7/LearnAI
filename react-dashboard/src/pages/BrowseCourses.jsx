import React, { useState, useEffect } from 'react';
import { Search, User, Clock, BookOpen, Star, Users, CheckCircle, X, Loader, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:3001/api';

const BrowseCourses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [level, setLevel] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, category, level]);

  const loadData = async () => {
    setLoading(true);
    const sessionData = localStorage.getItem('learnai_session');
    let userId = null;
    if (sessionData) {
      try { userId = JSON.parse(sessionData)?.id; } catch(e) {}
    }

    try {
      const [coursesRes, enrollRes] = await Promise.all([
        fetch(`${API_BASE}/courses`),
        userId ? fetch(`${API_BASE}/courses/enrollments/${userId}`) : Promise.resolve({ json: () => ({ success: false }) })
      ]);

      const coursesData = await coursesRes.json();
      const enrollData = await enrollRes.json();

      if (coursesData.success) {
        setCourses(coursesData.courses.map(c => ({
          ...c,
          category: getCategoryFromTitle(c.title)
        })));
      }

      if (enrollData.success) {
        setEnrolledCourseIds(new Set(enrollData.enrollments.map(e => e.course_id)));
      }
    } catch (err) {
      setError('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryFromTitle = (title) => {
    if (title.includes('Web') || title.includes('React') || title.includes('Node')) return 'web';
    if (title.includes('Data') || title.includes('Python')) return 'data';
    if (title.includes('AI') || title.includes('Machine Learning')) return 'ai';
    if (title.includes('Mobile') || title.includes('App')) return 'mobile';
    return 'web';
  };

  const filterCourses = () => {
    let list = [...courses];
    const s = searchTerm.toLowerCase();

    list = list.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(s) || 
                          c.instructor_name.toLowerCase().includes(s) ||
                          c.description.toLowerCase().includes(s);
      const matchesCategory = category === 'all' || c.category === category;
      const matchesLevel = level === 'all' || c.difficulty_level.toLowerCase() === level;
      return matchesSearch && matchesCategory && matchesLevel;
    });

    setFilteredCourses(list);
  };

  const handleEnrollClick = (course) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  const confirmEnrollment = async () => {
    const sessionData = localStorage.getItem('learnai_session');
    if (!sessionData) {
      navigate('/');
      return;
    }
    let session;
    try { session = JSON.parse(sessionData); } catch(e) { navigate('/'); return; }
    if (!session?.id) {
      navigate('/');
      return;
    }

    setEnrolling(true);
    try {
      const res = await fetch(`${API_BASE}/courses/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: session.id, course_id: selectedCourse.id })
      });
      const data = await res.json();
      if (data.success) {
        setEnrolledCourseIds(new Set([...enrolledCourseIds, selectedCourse.id]));
        setShowModal(false);
        alert('Successfully enrolled!');
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Error enrolling in course');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><div className="spinner" style={{ margin: '0 auto' }}></div><p>Loading courses...</p></div>;

  return (
    <div className="dashboard-container">
        <div className="section-header">
          <h1>Browse Courses</h1>
        </div>

        <div className="filter-section" style={{ background: '#fff', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ flex: 2, minWidth: '300px' }}>
              <input 
                type="text" 
                placeholder="Search for anything you want to learn..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'none', width: '100%' }}
              />
              <Search size={18} color="#64748b" />
            </div>
            
            <div style={{ flex: 1, display: 'flex', gap: '1rem', minWidth: '300px' }}>
              <select className="sort-select" value={category} onChange={(e) => setCategory(e.target.value)} style={{ flex: 1 }}>
                <option value="all">All Categories</option>
                <option value="web">Web Development</option>
                <option value="data">Data Science</option>
                <option value="ai">AI & ML</option>
                <option value="mobile">Mobile Development</option>
              </select>
              
              <select className="sort-select" value={level} onChange={(e) => setLevel(e.target.value)} style={{ flex: 1 }}>
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        <div className="courses-grid">
          {filteredCourses.length > 0 ? (
            filteredCourses.map(course => {
              const formattedPrice = `₹${parseFloat(course.price).toLocaleString('en-IN')}`;
              const isEnrolled = enrolledCourseIds.has(course.id);
              const avgRating = parseFloat(course.average_rating) || parseFloat(course.rating) || 0;
              
              return (
                <div key={course.id} className="course-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="course-card-header" style={{ background: '#f8fafc', padding: '2.5rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
                    <span className="icon-3d-wrapper icon-lg icon-indigo">
                      <BookOpen size={40} />
                    </span>
                  </div>
                  <div className="course-card-body" style={{ padding: '1.5rem', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                       <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>{course.title}</h3>
                       <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', padding: '4px 10px', background: 'var(--primary-soft)', color: 'var(--primary)', borderRadius: '20px', border: '1px solid var(--primary-light)20' }}>{course.difficulty_level}</span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '500', marginBottom: '1.25rem' }}>By {course.instructor_name}</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                      <span style={{ color: '#f59e0b', display: 'flex' }}>
                        {[1,2,3,4,5].map(star => (
                          <Star key={star} size={14} fill={star <= Math.round(avgRating) ? "#f59e0b" : "none"} />
                        ))}
                      </span>
                      <span style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b' }}>{avgRating > 0 ? avgRating.toFixed(1) : 'New'}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={16} /> {course.total_students?.toLocaleString()}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> {course.duration_hours}h</span>
                    </div>
                  </div>
                  <div className="course-card-footer" style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)' }}>{formattedPrice}</div>
                    {isEnrolled ? (
                      <button disabled style={{ padding: '10px 20px', background: '#f1f5f9', color: '#94a3b8', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={16} /> Enrolled
                      </button>
                    ) : (
                      <button 
                        className="btn-continue" 
                        onClick={() => handleEnrollClick(course)}
                        style={{ padding: '10px 20px', fontSize: '14px' }}
                      >
                        Enroll Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
              <div className="icon-3d-wrapper icon-xl icon-blue" style={{ margin: '0 auto 1.5rem' }}><Search size={40} /></div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>No courses match your search</h3>
              <p style={{ color: '#64748b' }}>Try adjusting your keywords or category filters to find what you're looking for.</p>
            </div>
          )}
        </div>

        {showModal && selectedCourse && (
          <div className="enrollment-modal" style={{ display: 'flex', backdropFilter: 'blur(8px)', background: 'rgba(15, 23, 42, 0.6)' }}>
            <div className="modal-content" style={{ borderRadius: '24px', padding: '2.5rem' }}>
              <div className="modal-header">
                <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Confirm Enrollment</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}><X /></button>
              </div>
              <div className="modal-body" style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '2rem' }}>
                  <span className="icon-3d-wrapper icon-xl icon-blue" style={{ width: '100px', height: '100px' }}><BookOpen size={48} /></span>
                </div>
                <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '10px' }}>You are about to start your journey in:</p>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '2rem' }}>{selectedCourse.title}</h3>
                <div className="modal-price" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <span style={{ fontWeight: '700', color: '#64748b' }}>Course Price</span>
                  <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)' }}>₹{parseFloat(selectedCourse.price).toLocaleString('en-IN')}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>* One-time payment for lifetime access</p>
              </div>
              <div className="modal-footer" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button className="modal-cancel-btn" style={{ flex: 1, borderRadius: '12px' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button 
                  className="modal-confirm-btn" 
                  style={{ flex: 1, borderRadius: '12px', background: 'var(--primary)' }}
                  onClick={confirmEnrollment}
                  disabled={enrolling}
                >
                  {enrolling ? 'Enrolling...' : 'Confirm & Pay'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default BrowseCourses;
