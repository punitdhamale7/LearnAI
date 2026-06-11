import React, { useState, useEffect } from 'react';
import {
  Sparkles, TrendingUp, Target, Award, BookOpen, Clock,
  Star, Users, Zap, Brain, ChevronRight, Play, CheckCircle,
  BarChart3, Lightbulb, ArrowRight, Filter, RefreshCw
} from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

function getSession() {
  try { return JSON.parse(localStorage.getItem('learnai_session')); } catch { return null; }
}

const AIRecommendations = () => {
  const session = getSession();
  const userId = session?.id;

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showInterestSelection, setShowInterestSelection] = useState(false);
  const [interestCategories, setInterestCategories] = useState([
    { id: 1, name: 'Web Development', description: 'Build websites and web applications', icon: 'globe' },
    { id: 2, name: 'Mobile Development', description: 'Create iOS and Android apps', icon: 'smartphone' },
    { id: 3, name: 'Data Science', description: 'Analyze data and build ML models', icon: 'bar-chart' },
    { id: 4, name: 'Artificial Intelligence', description: 'Machine learning and AI systems', icon: 'cpu' },
    { id: 5, name: 'Cloud Computing', description: 'AWS, Azure, Google Cloud', icon: 'cloud' },
    { id: 6, name: 'Cybersecurity', description: 'Protect systems and networks', icon: 'shield' },
    { id: 7, name: 'Game Development', description: 'Create games and experiences', icon: 'gamepad-2' },
    { id: 8, name: 'UI/UX Design', description: 'Design beautiful interfaces', icon: 'palette' },
    { id: 9, name: 'DevOps', description: 'Automation and deployment', icon: 'settings' },
    { id: 10, name: 'Database Management', description: 'SQL, NoSQL, data storage', icon: 'database' },
    { id: 11, name: 'Programming Fundamentals', description: 'Learn to code from scratch', icon: 'code' },
    { id: 12, name: 'Blockchain', description: 'Cryptocurrency and distributed systems', icon: 'link' }
  ]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [savingInterests, setSavingInterests] = useState(false);

  useEffect(() => {
    if (userId) {
      checkUserStatus();
      loadUserStats();
    }
  }, [userId]);

  const checkUserStatus = async () => {
    setLoading(true);
    try {
      console.log('Checking user status for userId:', userId);
      
      // Check if user has any enrollments
      const enrollRes = await fetch(`${API_BASE}/courses/enrolled/${userId}`);
      const enrollData = await enrollRes.json();
      console.log('Enrollment data:', enrollData);
      
      if (enrollData.success && enrollData.courses && enrollData.courses.length === 0) {
        console.log('New user detected - no enrollments');
        
        // New user - check if they have interests set
        const interestRes = await fetch(`${API_BASE}/interests/user/${userId}`);
        const interestData = await interestRes.json();
        console.log('Interest data:', interestData);
        
        if (interestData.success && interestData.interests.length === 0) {
          // No interests set - show interest selection
          console.log('No interests set - showing interest selection screen');
          setIsNewUser(true);
          setShowInterestSelection(true);
          await loadInterestCategories();
        } else {
          // Has interests - load interest-based recommendations
          console.log('Has interests - loading interest-based recommendations');
          setIsNewUser(true);
          await loadInterestBasedRecommendations();
        }
      } else {
        // Existing user with courses - load normal recommendations
        console.log('Existing user with courses - loading AI recommendations');
        setIsNewUser(false);
        await loadRecommendations();
      }
    } catch (e) {
      console.error('Error checking user status:', e);
      await loadRecommendations();
    }
    setLoading(false);
  };

  const loadInterestCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/interests/categories`);
      const data = await res.json();
      if (data.success) {
        setInterestCategories(data.categories || []);
      }
    } catch (e) {
      console.error('Error loading interest categories:', e);
    }
  };

  const loadInterestBasedRecommendations = async () => {
    try {
      const res = await fetch(`${API_BASE}/interests/recommendations/${userId}`);
      const data = await res.json();
      if (data.success) {
        setRecommendations(data.recommendations || []);
      }
    } catch (e) {
      console.error('Error loading interest-based recommendations:', e);
    }
  };

  const handleInterestToggle = (interestId) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        return prev.filter(id => id !== interestId);
      } else {
        return [...prev, interestId];
      }
    });
  };

  const handleSaveInterests = async () => {
    if (selectedInterests.length === 0) {
      alert('Please select at least one interest');
      return;
    }

    console.log('Saving interests:', selectedInterests);
    setSavingInterests(true);
    try {
      const res = await fetch(`${API_BASE}/interests/user/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestIds: selectedInterests })
      });
      const data = await res.json();
      console.log('Save interests response:', data);
      
      if (data.success) {
        console.log('Interests saved successfully, loading recommendations');
        setShowInterestSelection(false);
        await loadInterestBasedRecommendations();
      } else {
        alert(data.message || 'Error saving interests');
      }
    } catch (e) {
      console.error('Error saving interests:', e);
      alert('Error saving interests');
    }
    setSavingInterests(false);
  };

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/recommendations/${userId}`);
      const data = await res.json();
      if (data.success) {
        setRecommendations(data.recommendations || []);
      }
    } catch (e) {
      console.error('Error loading recommendations:', e);
    }
    setLoading(false);
  };

  const loadUserStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/achievements/stats/${userId}`);
      const data = await res.json();
      if (data.success) {
        setUserStats(data.stats);
      }
    } catch (e) {
      console.error('Error loading stats:', e);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (isNewUser) {
      await loadInterestBasedRecommendations();
    } else {
      await loadRecommendations();
    }
    setTimeout(() => setRefreshing(false), 500);
  };

  const enrollCourse = async (courseId) => {
    try {
      const res = await fetch(`${API_BASE}/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Enrolled successfully! Check "My Courses" to start learning.');
        // After first enrollment, user is no longer "new"
        setIsNewUser(false);
        await loadRecommendations();
      } else {
        alert(data.message || 'Already enrolled or error occurred');
      }
    } catch (e) {
      alert('Error enrolling in course');
    }
  };

  const getReasonIcon = (reason) => {
    if (reason.includes('completing') || reason.includes('Next step')) return <Target size={16} />;
    if (reason.includes('learning') || reason.includes('enrolled')) return <BookOpen size={16} />;
    if (reason.includes('rated') || reason.includes('Highly rated')) return <Star size={16} />;
    if (reason.includes('Popular') || reason.includes('students')) return <Users size={16} />;
    if (reason.includes('similar interests')) return <TrendingUp size={16} />;
    return <Sparkles size={16} />;
  };

  const getReasonColor = (reason) => {
    if (reason.includes('completing') || reason.includes('Next step')) return '#10b981';
    if (reason.includes('learning') || reason.includes('enrolled')) return '#3b82f6';
    if (reason.includes('rated') || reason.includes('Highly rated')) return '#f59e0b';
    if (reason.includes('Popular') || reason.includes('students')) return '#8b5cf6';
    if (reason.includes('similar interests')) return '#ec4899';
    return '#6b7280';
  };

  const getDifficultyColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getMatchScore = (score) => {
    if (score >= 8) return { label: 'Perfect Match', color: '#10b981', percentage: 95 };
    if (score >= 6) return { label: 'Great Match', color: '#3b82f6', percentage: 85 };
    if (score >= 4) return { label: 'Good Match', color: '#f59e0b', percentage: 70 };
    return { label: 'Recommended', color: '#6b7280', percentage: 60 };
  };

  const filteredRecommendations = selectedCategory === 'all'
    ? recommendations
    : recommendations.filter(r => r.difficulty_level?.toLowerCase() === selectedCategory);

  if (loading) {
    return (
      <div style={styles.root}>
        <div style={styles.loading}>
          <div className="spinner" />
          <p style={{ marginTop: 16, color: '#6b7280' }}>Analyzing your learning patterns...</p>
        </div>
      </div>
    );
  }

  // Interest Selection Screen for New Users
  if (showInterestSelection) {
    return (
      <div style={styles.root}>
        <div style={styles.interestSelectionContainer}>
          <div style={styles.interestHeader}>
            <div style={styles.iconWrapper}>
              <Sparkles size={32} color="#fff" />
            </div>
            <h1 style={styles.interestTitle}>Welcome! Let's Personalize Your Learning</h1>
            <p style={styles.interestSubtitle}>
              Select your interests to get personalized course recommendations with accurate match scores
            </p>
          </div>

          <div style={styles.interestGrid}>
            {interestCategories.map(category => (
              <div
                key={category.id}
                style={{
                  ...styles.interestCard,
                  background: selectedInterests.includes(category.name) ? '#4b5563' : 'white',
                  color: selectedInterests.includes(category.name) ? 'white' : '#111827',
                  border: selectedInterests.includes(category.name) ? '2px solid #4b5563' : '2px solid #e5e7eb'
                }}
                onClick={() => handleInterestToggle(category.name)}
              >
                <div style={styles.interestCardContent}>
                  <h3 style={styles.interestCardTitle}>{category.name}</h3>
                  <p style={{
                    ...styles.interestCardDesc,
                    color: selectedInterests.includes(category.name) ? '#d1d5db' : '#6b7280'
                  }}>
                    {category.description}
                  </p>
                </div>
                {selectedInterests.includes(category.name) && (
                  <div style={styles.checkMark}>
                    <CheckCircle size={24} color="white" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={styles.interestActions}>
            <p style={styles.selectedCount}>
              {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
            </p>
            <button
              style={{
                ...styles.saveInterestsBtn,
                opacity: selectedInterests.length === 0 || savingInterests ? 0.5 : 1,
                cursor: selectedInterests.length === 0 || savingInterests ? 'not-allowed' : 'pointer'
              }}
              onClick={handleSaveInterests}
              disabled={selectedInterests.length === 0 || savingInterests}
            >
              {savingInterests ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Saving...
                </>
              ) : (
                <>
                  <ArrowRight size={16} />
                  Get My Recommendations
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.titleSection}>
            <div style={styles.iconWrapper}>
              <Brain size={24} color="#fff" />
            </div>
            <h1 style={styles.title}>AI Recommendations</h1>
          </div>
          <button style={styles.refreshBtn} onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
        <p style={styles.subtitle}>
          Personalized course suggestions based on your learning journey and goals
        </p>
      </div>

      {/* Stats Cards */}
      {userStats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{userStats.total_enrollments || 0}</div>
            <div style={styles.statLabel}>Courses Enrolled</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{userStats.total_courses_completed || 0}</div>
            <div style={styles.statLabel}>Completed</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{userStats.current_streak || 0}</div>
            <div style={styles.statLabel}>Day Streak</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{userStats.total_points || 0}</div>
            <div style={styles.statLabel}>Total Points</div>
          </div>
        </div>
      )}

      {/* AI Insights */}
      <div style={styles.insightsCard}>
        <div style={styles.insightsHeader}>
          <Sparkles size={18} color="#4b5563" />
          <span style={styles.insightsTitle}>AI Insights</span>
        </div>
        <div style={styles.insightsContent}>
          {recommendations.length > 0 ? (
            <>
              <p style={styles.insightText}>
                Based on your progress and interests, we've found <strong>{recommendations.length} courses</strong> that match your learning style.
              </p>
              <p style={styles.insightText}>
                You're ready to advance! Consider courses that build on your current skills.
              </p>
              <p style={styles.insightText}>
                Join thousands of learners exploring these popular topics.
              </p>
            </>
          ) : (
            <p style={styles.insightText}>
              Enroll in your first course to receive personalized recommendations!
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterBar}>
        <div style={styles.filterLabel}>
          <Filter size={16} />
          <span>Filter by level:</span>
        </div>
        <div style={styles.filterButtons}>
          {['all', 'beginner', 'intermediate', 'advanced'].map(cat => (
            <button
              key={cat}
              style={{
                ...styles.filterBtn,
                background: selectedCategory === cat ? '#4b5563' : 'white',
                color: selectedCategory === cat ? 'white' : '#6b7280',
                border: selectedCategory === cat ? 'none' : '2px solid #e5e7eb'
              }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations Grid */}
      {filteredRecommendations.length === 0 ? (
        <div style={styles.empty}>
          <Brain size={64} color="#d1d5db" />
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#374151', marginTop: 20 }}>
            {selectedCategory === 'all' ? 'No Recommendations Yet' : `No ${selectedCategory} courses found`}
          </h3>
          <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 8 }}>
            {selectedCategory === 'all'
              ? 'Start enrolling in courses to get personalized recommendations!'
              : 'Try selecting a different difficulty level'}
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredRecommendations.map((course, idx) => {
            const actualMatchPercent = course.match_percentage || 60;
            const matchLabel = actualMatchPercent >= 80 ? 'Perfect Match' : 
                              actualMatchPercent >= 65 ? 'Great Match' : 
                              actualMatchPercent >= 50 ? 'Good Match' : 'Recommended';
            const matchColor = actualMatchPercent >= 80 ? '#10b981' : 
                              actualMatchPercent >= 65 ? '#3b82f6' : 
                              actualMatchPercent >= 50 ? '#f59e0b' : '#6b7280';
            
            return (
              <div key={course.id} style={styles.card}>
                {/* Rank Badge for Top 3 */}
                {idx < 3 && (
                  <div style={{ ...styles.rankBadge, background: idx === 0 ? '#4b5563' : idx === 1 ? '#6b7280' : '#9ca3af' }}>
                    {idx + 1}
                  </div>
                )}

                {/* Match Badge */}
                <div style={{ ...styles.matchBadge, background: matchColor }}>
                  {matchLabel}
                </div>

                {/* Course Header */}
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>{course.title}</h3>
                  <div style={styles.cardMeta}>
                    <span style={{ ...styles.difficultyBadge, background: getDifficultyColor(course.difficulty_level) }}>
                      {course.difficulty_level || 'Beginner'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p style={styles.cardDesc}>
                  {course.description || 'Enhance your skills with this comprehensive course'}
                </p>

                {/* Recommendation Reason */}
                <div style={styles.reasonBadge}>
                  <div style={{ color: '#6b7280', flexShrink: 0 }}>
                    {getReasonIcon(course.recommendation_reason)}
                  </div>
                  <span style={styles.reasonText}>{course.recommendation_reason}</span>
                </div>

                {/* Stats */}
                <div style={styles.statsRow}>
                  <div style={styles.statItem}>
                    <Star size={14} color="#f59e0b" fill="#f59e0b" />
                    <span>{parseFloat(course.average_rating || 0).toFixed(1)}</span>
                  </div>
                  <div style={styles.statItem}>
                    <Users size={14} color="#6b7280" />
                    <span>{course.total_students || 0}</span>
                  </div>
                  <div style={styles.statItem}>
                    <Clock size={14} color="#6b7280" />
                    <span>{course.duration_hours || 0}h</span>
                  </div>
                </div>

                {/* Match Percentage */}
                <div style={styles.matchBar}>
                  <div style={styles.matchBarLabel}>
                    <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Match Score</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{actualMatchPercent}%</span>
                  </div>
                  <div style={styles.matchBarTrack}>
                    <div style={{ ...styles.matchBarFill, width: `${actualMatchPercent}%`, background: matchColor }} />
                  </div>
                </div>

                {/* Actions */}
                <div style={styles.cardActions}>
                  <button style={styles.btnPrimary} onClick={() => enrollCourse(course.id)}>
                    <Play size={14} />
                    Enroll Now
                  </button>
                  <button style={styles.btnSecondary} onClick={() => window.location.hash = '/browse-courses'}>
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Why These Recommendations */}
      {recommendations.length > 0 && (
        <div style={styles.whyCard}>
          <h3 style={styles.whyTitle}>
            <BarChart3 size={20} color="#6b7280" />
            Why These Recommendations?
          </h3>
          <div style={styles.whyGrid}>
            <div style={styles.whyItem}>
              <div style={{ ...styles.whyIcon, background: '#eff6ff' }}>
                <Target size={20} color="#3b82f6" />
              </div>
              <div>
                <div style={styles.whyItemTitle}>Your Learning Path</div>
                <div style={styles.whyItemDesc}>Based on courses you've completed and your progress</div>
              </div>
            </div>
            <div style={styles.whyItem}>
              <div style={{ ...styles.whyIcon, background: '#fef3c7' }}>
                <Star size={20} color="#f59e0b" />
              </div>
              <div>
                <div style={styles.whyItemTitle}>High Ratings</div>
                <div style={styles.whyItemDesc}>Courses with excellent reviews from students like you</div>
              </div>
            </div>
            <div style={styles.whyItem}>
              <div style={{ ...styles.whyIcon, background: '#f3e8ff' }}>
                <Users size={20} color="#8b5cf6" />
              </div>
              <div>
                <div style={styles.whyItemTitle}>Similar Learners</div>
                <div style={styles.whyItemDesc}>Popular among students with similar interests</div>
              </div>
            </div>
            <div style={styles.whyItem}>
              <div style={{ ...styles.whyIcon, background: '#dcfce7' }}>
                <TrendingUp size={20} color="#10b981" />
              </div>
              <div>
                <div style={styles.whyItemTitle}>Skill Progression</div>
                <div style={styles.whyItemDesc}>Next logical step in your learning journey</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  root: { padding: '32px', maxWidth: 1200, margin: '0 auto', background: '#f9fafb', minHeight: '100vh' },
  header: { marginBottom: 32 },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  titleSection: { display: 'flex', alignItems: 'center', gap: 16 },
  iconWrapper: { width: 48, height: 48, background: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 },
  subtitle: { fontSize: 14, color: '#6b7280', marginLeft: 64 },
  refreshBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'white', border: '1px solid #d1d5db', fontWeight: 600, fontSize: 14, color: '#374151', cursor: 'pointer', transition: 'all 0.2s' },
  loading: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, background: 'white' },
  
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  statCard: { background: 'white', padding: 24, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  statValue: { fontSize: 32, fontWeight: 700, color: '#111827', lineHeight: 1, marginBottom: 8 },
  statLabel: { fontSize: 13, color: '#6b7280', fontWeight: 500 },
  
  insightsCard: { background: 'white', padding: 24, marginBottom: 24, border: '1px solid #e5e7eb' },
  insightsHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f3f4f6' },
  insightsTitle: { fontSize: 16, fontWeight: 600, color: '#111827' },
  insightsContent: { display: 'flex', flexDirection: 'column', gap: 12 },
  insightText: { fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6, paddingLeft: 24, position: 'relative' },
  
  filterBar: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 20, background: 'white', border: '1px solid #e5e7eb' },
  filterLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#111827', minWidth: 120 },
  filterButtons: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  filterBtn: { padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  
  empty: { textAlign: 'center', padding: 80, background: 'white', border: '1px solid #e5e7eb' },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20, marginBottom: 32 },
  card: { background: 'white', padding: 24, border: '1px solid #e5e7eb', position: 'relative', transition: 'all 0.2s', display: 'flex', flexDirection: 'column' },
  
  matchBadge: { position: 'absolute', top: 20, right: 20, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', color: 'white', fontSize: 12, fontWeight: 700 },
  
  cardHeader: { marginBottom: 16, paddingRight: 100 },
  cardTitle: { fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 10, lineHeight: 1.4 },
  cardMeta: { display: 'flex', gap: 8, alignItems: 'center' },
  difficultyBadge: { padding: '4px 12px', fontSize: 11, fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' },
  
  cardDesc: { fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 16, flex: 1 },
  
  reasonBadge: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, background: '#f9fafb', marginBottom: 16, border: '1px solid #e5e7eb' },
  reasonText: { fontSize: 13, fontWeight: 500, color: '#374151', flex: 1, lineHeight: 1.5 },
  
  statsRow: { display: 'flex', gap: 20, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f3f4f6' },
  statItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', fontWeight: 500 },
  
  matchBar: { marginBottom: 20 },
  matchBarLabel: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  matchBarTrack: { height: 6, background: '#f3f4f6', overflow: 'hidden' },
  matchBarFill: { height: '100%', transition: 'width 0.5s ease' },
  
  cardActions: { display: 'flex', gap: 10 },
  btnPrimary: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: '#4b5563', color: 'white', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' },
  btnSecondary: { display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', background: 'white', color: '#6b7280', border: '1px solid #d1d5db', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' },
  
  rankBadge: { position: 'absolute', top: -10, left: 20, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 800, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
  
  whyCard: { background: 'white', padding: 32, border: '1px solid #e5e7eb' },
  whyTitle: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #f3f4f6' },
  whyGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 },
  whyItem: { display: 'flex', gap: 16, alignItems: 'flex-start' },
  whyIcon: { width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#f3f4f6' },
  whyItemTitle: { fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 6 },
  whyItemDesc: { fontSize: 13, color: '#6b7280', lineHeight: 1.5 },
  
  // Interest Selection Styles
  interestSelectionContainer: { background: 'white', padding: 48, border: '1px solid #e5e7eb', maxWidth: 1000, margin: '0 auto' },
  interestHeader: { textAlign: 'center', marginBottom: 48 },
  interestTitle: { fontSize: 32, fontWeight: 700, color: '#111827', marginTop: 24, marginBottom: 12 },
  interestSubtitle: { fontSize: 16, color: '#6b7280', lineHeight: 1.6, maxWidth: 600, margin: '0 auto' },
  interestGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 40 },
  interestCard: { padding: 24, border: '2px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', minHeight: 120, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  interestCardContent: { flex: 1 },
  interestCardTitle: { fontSize: 18, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 },
  interestCardDesc: { fontSize: 13, lineHeight: 1.5, margin: 0 },
  checkMark: { position: 'absolute', top: 12, right: 12 },
  interestActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 32, borderTop: '1px solid #e5e7eb' },
  selectedCount: { fontSize: 14, color: '#6b7280', fontWeight: 600, margin: 0 },
  saveInterestsBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 32px', background: '#4b5563', color: 'white', border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }
};

export default AIRecommendations;
