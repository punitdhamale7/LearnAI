import React, { useState, useEffect } from 'react';
import { Trophy, Unlock, Lock, BookOpen, FileText, Flame, MessageSquare, Star, Award, Medal, Target, Lightbulb, Rocket, Zap, Monitor, Brain, CheckCircle2 } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({ total_points: 0, total_achievements_unlocked: 0, total_achievements: 0 });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const sessionData = localStorage.getItem('learnai_session');
    if (!sessionData) return;
    let session;
    try { session = JSON.parse(sessionData); } catch(e) { return; }
    if (!session?.id) return;
    const userId = session.id;

    try {
      const [achieveRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/achievements/${userId}`),
        fetch(`${API_BASE}/achievements/stats/${userId}`)
      ]);

      const achieveData = await achieveRes.json();
      const statsData = await statsRes.json();

      if (achieveData.success) {
        setAchievements(achieveData.achievements);
      }

      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconChar) => {
    const iconMap = {
      '🎓': <Award />,
      '🏆': <Trophy />,
      '🎯': <Target />,
      '💡': <Lightbulb />,
      '🔥': <Flame />,
      '🚀': <Rocket />,
      '⭐': <Star />,
      '📚': <BookOpen />,
      '📖': <BookOpen />,
      '📝': <FileText />,
      '💬': <MessageSquare />,
      '⚡': <Zap />,
      '💻': <Monitor />,
      '🧠': <Brain />,
      '🥇': <Medal />,
      '🥈': <Medal />,
      '🥉': <Medal />
    };
    return iconMap[iconChar] || <Award />;
  };

  const getRarityConfig = (rarity) => {
    const configs = {
      'common': { color: '#9ca3af', label: 'Common' },
      'rare': { color: '#3b82f6', label: 'Rare' },
      'epic': { color: '#8b5cf6', label: 'Epic' },
      'legendary': { color: '#f59e0b', label: 'Legendary' }
    };
    return configs[rarity] || configs.common;
  };

  const filteredAchievements = achievements.filter(a => {     
    if (filter === 'unlocked') return a.is_unlocked;
    if (filter === 'locked') return !a.is_unlocked;
    return true;
  });

  const categories = [
    { id: 'courses', name: 'Course Achievements', icon: <BookOpen />, color: 'blue' },
    { id: 'lessons', name: 'Lesson Achievements', icon: <FileText />, color: 'indigo' },
    { id: 'streak', name: 'Streak Achievements', icon: <Flame />, color: 'orange' },
    { id: 'social', name: 'Social Achievements', icon: <MessageSquare />, color: 'purple' },
    { id: 'special', name: 'Special Achievements', icon: <Star />, color: 'orange' }
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><div className="spinner" style={{ margin: '0 auto' }}></div><p>Loading achievements...</p></div>;

  const unlockedPercentage = stats.total_achievements ? (stats.total_achievements_unlocked / stats.total_achievements) * 100 : 0;

  return (
    <div className="dashboard-container">
      <div className="section-header">
        <h1>Achievements</h1>
      </div>

      <div className="achievement-header" style={{ background: '#fff', padding: '2.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <div className="total-points">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <span className="icon-3d-wrapper icon-sm icon-orange"><Trophy size={16} /></span> Total Points
          </h2>
          <p style={{ fontSize: '48px', fontWeight: '800', color: '#1e293b', lineHeight: 1 }}>{stats.total_points || 0}</p>
        </div>
        <div style={{ display: 'flex', gap: '2.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{stats.total_achievements_unlocked}/{stats.total_achievements}</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Unlocked</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{stats.total_courses_completed || 0}</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Courses</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{stats.current_streak_days || 0}</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Streak</div>
          </div>
        </div>
      </div>

      <div style={{ margin: '0 0 2.5rem', padding: '1.5rem 2rem', background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
          <span style={{ fontWeight: '800', color: '#1e293b' }}>Overall Progress</span>
          <span style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '18px' }}>{Math.round(unlockedPercentage)}%</span>
        </div>
        <div className="progress-bar-wrap" style={{ height: '14px' }}>
          <div className="progress-bar-fill" style={{ width: `${unlockedPercentage}%`, background: 'linear-gradient(90deg, #6366f1, #a855f7)' }}></div>
        </div>
      </div>

      <div className="filter-tabs" style={{ marginBottom: '2rem' }}>
        <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Badges</button>
        <button className={`filter-tab ${filter === 'unlocked' ? 'active' : ''}`} onClick={() => setFilter('unlocked')}>
           <Unlock size={14} /> Unlocked
        </button>
        <button className={`filter-tab ${filter === 'locked' ? 'active' : ''}`} onClick={() => setFilter('locked')}>
           <Lock size={14} /> Locked
        </button>
      </div>

      {categories.map(cat => {
        const catAchievements = filteredAchievements.filter(a => a.category === cat.id);
        if (catAchievements.length === 0) return null;

        return (
          <div key={cat.id} style={{ marginBottom: '3rem' }}>
            <div className="section-header">
              <h2><span className={`icon-3d-wrapper icon-sm icon-${cat.color}`}>{cat.icon}</span> {cat.name}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {catAchievements.map(a => {
                const rarity = getRarityConfig(a.rarity);
                return (
                  <div key={a.id} style={{ 
                    background: '#fff', 
                    padding: '1.5rem', 
                    borderRadius: '20px', 
                    border: '1px solid #e2e8f0',
                    opacity: a.is_unlocked ? 1 : 0.6,
                    filter: a.is_unlocked ? 'none' : 'grayscale(0.5)',
                    transition: 'all 0.3s ease',
                    boxShadow: a.is_unlocked ? 'var(--shadow-md)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <span className={`icon-3d-wrapper icon-lg icon-blue`}>{getIconComponent(a.icon)}</span>
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '6px', color: '#1e293b' }}>{a.name}</h4>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '1.25rem', minHeight: '40px', lineHeight: '1.4' }}>{a.description}</p>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '20px', background: `${rarity.color}15`, color: rarity.color, border: `1px solid ${rarity.color}30` }}>{rarity.label}</span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>{a.points} pts</span>
                    </div>
                    {a.is_unlocked && (
                      <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--success)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> UNLOCKED
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Achievements;
