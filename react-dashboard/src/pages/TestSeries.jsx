import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, Calendar, Trophy, Play, CheckCircle, XCircle,
  AlertCircle, Award, Users, Target, TrendingUp, ChevronRight
} from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

function getSession() {
  try { return JSON.parse(localStorage.getItem('learnai_session')); } catch { return null; }
}

const TestSeries = () => {
  const session = getSession();
  const userId = session?.id;

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTest, setActiveTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showResult, setShowResult] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    loadTests();
  }, []);

  useEffect(() => {
    if (testStarted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [testStarted, timeLeft]);

  const loadTests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/test-series/list`);
      const data = await res.json();
      if (data.success) setTests(data.tests || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const startTest = async (test) => {
    const now = new Date();
    const start = new Date(test.start_datetime);
    const end = new Date(start.getTime() + test.duration_minutes * 60000);

    if (now < start) {
      alert('This test has not started yet!');
      return;
    }
    if (now > end) {
      alert('This test has ended. Check the leaderboard!');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/test-series/${test.id}/questions`, {
        headers: { 'user-id': userId }
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Cannot start test');
        return;
      }
      setActiveTest(test);
      setQuestions(data.questions || []);
      setAnswers({});
      setTimeLeft(test.duration_minutes * 60);
      setTestStarted(true);
      setTestSubmitted(false);
      startTimeRef.current = Date.now();
    } catch (e) {
      alert('Error loading test: ' + e.message);
    }
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !confirm('Submit your test? You cannot change answers after submission.')) return;

    clearInterval(timerRef.current);
    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      const res = await fetch(`${API_BASE}/test-series/${activeTest.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          answers,
          time_taken_seconds: timeTaken
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestSubmitted(true);
        setResult({ score: data.score, total: data.total });
        loadLeaderboard(activeTest.id);
      } else {
        alert(data.message || 'Error submitting test');
      }
    } catch (e) {
      alert('Error submitting: ' + e.message);
    }
  };

  const loadLeaderboard = async (testId) => {
    try {
      const res = await fetch(`${API_BASE}/test-series/${testId}/leaderboard`);
      const data = await res.json();
      if (data.success) setLeaderboard(data.leaderboard || []);
    } catch (e) { console.error(e); }
  };

  const viewDetailedResult = async () => {
    try {
      const res = await fetch(`${API_BASE}/test-series/${activeTest.id}/result/${userId}`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions);
        setShowResult(true);
      } else {
        alert(data.message || 'Results not available yet');
      }
    } catch (e) {
      alert('Error loading results: ' + e.message);
    }
  };

  const closeTest = () => {
    setActiveTest(null);
    setTestStarted(false);
    setTestSubmitted(false);
    setShowResult(false);
    setResult(null);
    setLeaderboard([]);
    loadTests();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getTestStatus = (test) => {
    const now = new Date();
    const start = new Date(test.start_datetime);
    const end = new Date(start.getTime() + test.duration_minutes * 60000);

    if (now < start) return { label: 'Upcoming', color: '#3b82f6', icon: Calendar };
    if (now >= start && now <= end) return { label: 'Live Now', color: '#ef4444', icon: Play };
    return { label: 'Ended', color: '#6b7280', icon: CheckCircle };
  };

  // Test List View
  if (!activeTest) {
    return (
      <div style={styles.root}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Test Series</h1>
            <p style={styles.subtitle}>Challenge yourself with timed tests and compete on the leaderboard</p>
          </div>
        </div>

        {loading ? (
          <div style={styles.loading}>
            <div className="spinner" />
            <p>Loading tests...</p>
          </div>
        ) : tests.length === 0 ? (
          <div style={styles.empty}>
            <AlertCircle size={48} color="#d1d5db" />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#374151', marginTop: 16 }}>No Tests Available</h3>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>Check back later for new test series</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {tests.map(test => {
              const status = getTestStatus(test);
              const StatusIcon = status.icon;
              return (
                <div key={test.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div style={{ ...styles.statusBadge, background: status.color }}>
                      <StatusIcon size={14} />
                      <span>{status.label}</span>
                    </div>
                  </div>
                  <h3 style={styles.cardTitle}>{test.title}</h3>
                  <p style={styles.cardDesc}>{test.description || 'Test your knowledge and skills'}</p>
                  <div style={styles.cardMeta}>
                    <div style={styles.metaItem}>
                      <Calendar size={16} color="#6b7280" />
                      <span>{new Date(test.start_datetime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div style={styles.metaItem}>
                      <Clock size={16} color="#6b7280" />
                      <span>{test.duration_minutes} min</span>
                    </div>
                    <div style={styles.metaItem}>
                      <Target size={16} color="#6b7280" />
                      <span>{test.total_questions} questions</span>
                    </div>
                  </div>
                  <div style={styles.cardFooter}>
                    {status.label === 'Live Now' ? (
                      <button style={styles.btnPrimary} onClick={() => startTest(test)}>
                        <Play size={16} /> Start Test
                      </button>
                    ) : status.label === 'Ended' ? (
                      <button style={styles.btnSecondary} onClick={() => { setActiveTest(test); loadLeaderboard(test.id); setTestSubmitted(true); }}>
                        <Trophy size={16} /> View Leaderboard
                      </button>
                    ) : (
                      <button style={styles.btnDisabled} disabled>
                        <Clock size={16} /> Starts Soon
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Test Submitted - Results View
  if (testSubmitted && !showResult) {
    const percentage = result ? Math.round((result.score / result.total) * 100) : 0;
    const myRank = leaderboard.findIndex(r => r.full_name === session?.name || r.full_name === session?.full_name) + 1;

    return (
      <div style={styles.root}>
        <div style={styles.resultContainer}>
          <div style={styles.resultCard}>
            <div style={styles.resultIcon}>
              {percentage >= 80 ? <Award size={64} color="#10b981" /> : percentage >= 50 ? <Trophy size={64} color="#f59e0b" /> : <Target size={64} color="#6b7280" />}
            </div>
            <h2 style={styles.resultTitle}>Test Submitted!</h2>
            <div style={styles.scoreDisplay}>
              <div style={styles.scoreCircle}>
                <span style={styles.scoreNumber}>{result?.score || 0}</span>
                <span style={styles.scoreTotal}>/ {result?.total || 0}</span>
              </div>
              <p style={styles.scorePercentage}>{percentage}% Score</p>
            </div>
            <div style={styles.resultActions}>
              <button style={styles.btnPrimary} onClick={viewDetailedResult}>
                <CheckCircle size={16} /> View Detailed Results
              </button>
              <button style={styles.btnSecondary} onClick={closeTest}>
                <ChevronRight size={16} /> Back to Tests
              </button>
            </div>
          </div>

          {leaderboard.length > 0 && (
            <div style={styles.leaderboardCard}>
              <h3 style={styles.leaderboardTitle}>
                <Trophy size={20} color="#f59e0b" /> Leaderboard
              </h3>
              <div style={styles.leaderboardList}>
                {leaderboard.slice(0, 10).map((entry, idx) => (
                  <div key={idx} style={{ ...styles.leaderboardItem, background: entry.full_name === (session?.name || session?.full_name) ? '#fef3c7' : 'white' }}>
                    <span style={styles.rank}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                    <img src={entry.avatar_url || 'assets/default-avatar.png'} alt={entry.full_name} style={styles.avatar} />
                    <span style={styles.leaderName}>{entry.full_name}</span>
                    <span style={styles.leaderScore}>{entry.score}/{entry.total_questions}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Detailed Results View
  if (showResult) {
    return (
      <div style={styles.root}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Test Results: {activeTest.title}</h1>
            <p style={styles.subtitle}>Review your answers and explanations</p>
          </div>
          <button style={styles.btnSecondary} onClick={closeTest}>
            <ChevronRight size={16} /> Back to Tests
          </button>
        </div>

        <div style={styles.questionsContainer}>
          {questions.map((q, idx) => (
            <div key={q.id} style={styles.questionCard}>
              <div style={styles.questionHeader}>
                <span style={styles.questionNum}>Question {idx + 1}</span>
                {q.is_correct ? (
                  <span style={{ ...styles.resultBadge, background: '#d1fae5', color: '#065f46' }}>
                    <CheckCircle size={14} /> Correct
                  </span>
                ) : (
                  <span style={{ ...styles.resultBadge, background: '#fee2e2', color: '#991b1b' }}>
                    <XCircle size={14} /> Incorrect
                  </span>
                )}
              </div>
              <p style={styles.questionText}>{q.question_text}</p>
              <div style={styles.optionsList}>
                {['A', 'B', 'C', 'D'].map(opt => {
                  const optionText = q[`option_${opt.toLowerCase()}`];
                  if (!optionText) return null;
                  const isCorrect = q.correct_answer === opt;
                  const isSelected = q.selected_answer === opt;
                  return (
                    <div
                      key={opt}
                      style={{
                        ...styles.option,
                        background: isCorrect ? '#d1fae5' : isSelected ? '#fee2e2' : '#f9fafb',
                        border: isCorrect ? '2px solid #10b981' : isSelected ? '2px solid #ef4444' : '2px solid #e5e7eb'
                      }}
                    >
                      <span style={styles.optionLabel}>{opt}</span>
                      <span style={styles.optionText}>{optionText}</span>
                      {isCorrect && <CheckCircle size={18} color="#10b981" />}
                      {isSelected && !isCorrect && <XCircle size={18} color="#ef4444" />}
                    </div>
                  );
                })}
              </div>
              {q.explanation && (
                <div style={styles.explanation}>
                  <strong>Explanation:</strong> {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Test Taking View
  return (
    <div style={styles.root}>
      <div style={styles.testHeader}>
        <div>
          <h2 style={styles.testTitle}>{activeTest.title}</h2>
          <p style={styles.testMeta}>{questions.length} Questions · {activeTest.duration_minutes} Minutes</p>
        </div>
        <div style={styles.timerContainer}>
          <Clock size={20} color={timeLeft < 60 ? '#ef4444' : '#6b7280'} />
          <span style={{ ...styles.timer, color: timeLeft < 60 ? '#ef4444' : '#111827' }}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${(Object.keys(answers).length / questions.length) * 100}%` }} />
      </div>
      <p style={styles.progressText}>
        {Object.keys(answers).length} of {questions.length} answered
      </p>

      <div style={styles.questionsContainer}>
        {questions.map((q, idx) => (
          <div key={q.id} style={styles.questionCard}>
            <div style={styles.questionHeader}>
              <span style={styles.questionNum}>Question {idx + 1}</span>
              {answers[q.id] && <CheckCircle size={16} color="#10b981" />}
            </div>
            <p style={styles.questionText}>{q.question_text}</p>
            <div style={styles.optionsList}>
              {['A', 'B', 'C', 'D'].map(opt => {
                const optionText = q[`option_${opt.toLowerCase()}`];
                if (!optionText) return null;
                const isSelected = answers[q.id] === opt;
                return (
                  <div
                    key={opt}
                    style={{
                      ...styles.option,
                      background: isSelected ? '#eff6ff' : '#f9fafb',
                      border: isSelected ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                      cursor: 'pointer'
                    }}
                    onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                  >
                    <div style={styles.radio}>
                      <div style={{ ...styles.radioDot, background: isSelected ? '#3b82f6' : 'transparent' }} />
                    </div>
                    <span style={styles.optionLabel}>{opt}</span>
                    <span style={styles.optionText}>{optionText}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.submitContainer}>
        <button style={styles.btnPrimary} onClick={() => handleSubmit(false)}>
          <CheckCircle size={18} /> Submit Test
        </button>
      </div>
    </div>
  );
};

const styles = {
  root: { padding: '24px', maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 800, color: '#111827', margin: 0 },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  loading: { textAlign: 'center', padding: 60, color: '#9ca3af' },
  empty: { textAlign: 'center', padding: 60 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 },
  card: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' },
  cardHeader: { marginBottom: 12 },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, color: 'white', fontSize: 12, fontWeight: 600 },
  cardTitle: { fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#6b7280', marginBottom: 16, lineHeight: 1.5 },
  cardMeta: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 },
  metaItem: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280' },
  cardFooter: { display: 'flex', gap: 8 },
  btnPrimary: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', background: '#4b5563', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' },
  btnSecondary: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', background: 'white', color: '#4b5563', border: '2px solid #e5e7eb', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' },
  btnDisabled: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', background: '#f3f4f6', color: '#9ca3af', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'not-allowed' },
  testHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: 20, background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  testTitle: { fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 },
  testMeta: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  timerContainer: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#f9fafb', borderRadius: 8 },
  timer: { fontSize: 20, fontWeight: 700 },
  progressBar: { height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', background: '#10b981', transition: 'width 0.3s' },
  progressText: { fontSize: 13, color: '#6b7280', marginBottom: 20 },
  questionsContainer: { display: 'flex', flexDirection: 'column', gap: 20 },
  questionCard: { background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' },
  questionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  questionNum: { fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
  questionText: { fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16, lineHeight: 1.6 },
  optionsList: { display: 'flex', flexDirection: 'column', gap: 10 },
  option: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, transition: 'all 0.2s' },
  radio: { width: 20, height: 20, borderRadius: '50%', border: '2px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  radioDot: { width: 10, height: 10, borderRadius: '50%' },
  optionLabel: { fontSize: 14, fontWeight: 700, color: '#6b7280', width: 24, flexShrink: 0 },
  optionText: { flex: 1, fontSize: 14, color: '#374151' },
  explanation: { marginTop: 16, padding: 12, background: '#eff6ff', borderRadius: 8, fontSize: 13, color: '#1e40af', lineHeight: 1.5 },
  submitContainer: { position: 'sticky', bottom: 20, padding: 20, background: 'white', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', marginTop: 20 },
  resultContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 1000, margin: '0 auto' },
  resultCard: { background: 'white', borderRadius: 16, padding: 40, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center' },
  resultIcon: { marginBottom: 20 },
  resultTitle: { fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 24 },
  scoreDisplay: { marginBottom: 32 },
  scoreCircle: { width: 160, height: 160, borderRadius: '50%', background: 'linear-gradient(135deg, #4b5563, #374151)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' },
  scoreNumber: { fontSize: 48, fontWeight: 800, color: 'white' },
  scoreTotal: { fontSize: 20, color: 'rgba(255,255,255,0.8)' },
  scorePercentage: { fontSize: 18, fontWeight: 700, color: '#6b7280' },
  resultActions: { display: 'flex', flexDirection: 'column', gap: 12 },
  leaderboardCard: { background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  leaderboardTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 },
  leaderboardList: { display: 'flex', flexDirection: 'column', gap: 8 },
  leaderboardItem: { display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' },
  rank: { fontSize: 16, fontWeight: 700, width: 32, textAlign: 'center' },
  avatar: { width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' },
  leaderName: { flex: 1, fontSize: 14, fontWeight: 600, color: '#374151' },
  leaderScore: { fontSize: 14, fontWeight: 700, color: '#6b7280' },
  resultBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }
};

export default TestSeries;
