import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Zap, ArrowLeft, CheckCircle, Info, ChevronRight, Check as CheckIcon, X as XIcon, Loader2, Edit, Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL, API_ENDPOINTS } from '../../config';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
// import CartmanGif from '../../assets/images/cartman_no.gif';

const FunQuiz = ({ onBack }) => {
  const { user } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState({ show: false, points: 0 });
  const [winWidth, setWinWidth] = useState(window.innerWidth);
  const [quizActive, setQuizActive] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    question: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_answer: '', points_reward: 10
  });
  const [feedback, setFeedback] = useState({ show: false, msg: '', type: 'success' });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const showSuccessState = (pts) => {
    setSubmissionFeedback({ show: true, points: pts });
    setTimeout(() => setSubmissionFeedback({ show: false, points: 0 }), 3000);
  };

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = winWidth < 768;
  const isTablet = winWidth < 1024;
  const isHR = user?.role?.toUpperCase() === 'HR' || user?.role?.toUpperCase() === 'HUMAN RESOURCE';

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const employeeId = user?.employee_id || user?.id || user?.userId;
      const res = await fetch(`${BASE_URL}/api/fun-quizzes?employee_id=${employeeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || []);

        const mapped = list.filter(i => i !== null).map(item => ({
          id: item.id,
          question: item.question,
          options: [
            { letter: 'A', text: item.option_a },
            { letter: 'B', text: item.option_b },
            { letter: 'C', text: item.option_c },
            { letter: 'D', text: item.option_d }
          ],
          points_reward: item.points_reward,
          has_answered: item.has_answered || false,
          previous_result: item.previous_result ? (item.previous_result === true || item.previous_result === 'correct' ? 'correct' : 'wrong') : null,
          correct_answer: item.correct_answer || null,
          user_selected_letter: null
        }));
        setQuestions(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsQuestionsLoading(false);
    }
  };

  const fetchScores = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const uid = user?.employee_id || user?.userId || user?.id;
      const headers = { 'Authorization': `Bearer ${token}` };
      const [reRes, subRes, scoreRes] = await Promise.all([
        fetch(API_ENDPOINTS.REWARDS_LEADERBOARD || `${BASE_URL}/api/rewards/leaderboard`, { headers }),
        fetch(typeof API_ENDPOINTS.SUBORDINATES === 'function' ? API_ENDPOINTS.SUBORDINATES(uid) : `${BASE_URL}/api/subordinates/${uid}`, { headers }),
        fetch(`${BASE_URL}/api/fun-quizzes/leaderboard?employee_id=${uid}`, { headers })
      ]);

      const reData = reRes.ok ? await reRes.json() : [];
      const subData = subRes.ok ? await subRes.json() : [];
      const scoreData = scoreRes.ok ? await scoreRes.json() : [];

      const userList = [
        ...(Array.isArray(reData) ? reData : (reData.data || [])).map(u => ({ id: u.employee_id || u.id, name: u.employee_name || u.name })),
        ...(Array.isArray(subData) ? subData : (subData.data || [])).map(u => ({ id: u.employee_id || u.id, name: u.employee_name || u.name }))
      ];

      const scoreList = Array.isArray(scoreData) ? scoreData : (scoreData.data || []);

      // 2. Map and Deduplicate precise quiz scores to exact employee name strings
      const deduplicatedMap = new Map();

      scoreList.forEach(s => {
        const targetId = s.employee_id || s.user_id || s.id;
        const userInfo = userList.find(u => String(u.id) === String(targetId));

        const name = userInfo?.name || s.employee_name || s.name || `Employee ${targetId || 'Resource'}`;
        const score = Number(s.total_score || s.points || s.quiz_score || s.score || 0);

        if (deduplicatedMap.has(name)) {
          deduplicatedMap.set(name, Math.max(deduplicatedMap.get(name), score));
        } else {
          deduplicatedMap.set(name, score);
        }
      });

      const merged = Array.from(deduplicatedMap, ([name, score]) => ({ name, score }));
      const sorted = merged.sort((a, b) => b.score - a.score);

      const list = sorted.slice(0, 5).map((u, i) => ({
        name: u.name,
        score: u.score,
        rank: i + 1,
        color: ['#FBBC05', '#EA4335', '#34A853', '#4285F4', '#FBBC05'][i % 5],
        initial: u.name ? u.name.charAt(0).toUpperCase() : 'U'
      }));

      if (list.length > 0) setLeaderboard(list);
    } catch (err) {
      console.error("Leaderboard Sync failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchScores();
  }, []);

  useEffect(() => {
    setSelectedOption(null);
  }, [currentIdx]);

  const handleSubmit = async () => {
    if (!selectedOption) return;
    const currentQ = questions[currentIdx];
    if (currentQ.has_answered) return;

    // LOCAL ASSESSMENT (Checking correct answer locally as per user instruction)
    const optObj = currentQ.options.find(o => o.letter === selectedOption);
    const isCorrect = optObj?.text === currentQ.correct_answer;

    setQuestions(prev => prev.map((q, i) => i === currentIdx ? {
      ...q,
      has_answered: true,
      previous_result: isCorrect ? 'correct' : 'wrong',
      user_selected_letter: selectedOption
    } : q));
  };

  const handleSendTotalResults = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      // Calculate final summary locally
      const totalQuestions = questions.length;
      const correctCount = questions.filter(q => q.previous_result === 'correct').length;
      const totalPoints = questions.filter(q => q.previous_result === 'correct').reduce((sum, q) => sum + (q.points_reward || 0), 0);

      const response = await fetch(API_ENDPOINTS.QUIZ_SUBMIT_TOTAL || `${BASE_URL}/api/fun-quizzes/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token?.trim()}`
        },
        body: JSON.stringify({
          total_questions: totalQuestions,
          correct_count: correctCount,
          total_score: totalPoints,
          quiz_id: questions[0]?.quiz_id || questions[0]?.id // Using first q's quiz context
        })
      });

      if (response.ok) {
        // Refresh EVERYTHING to reflect on dashboard
        await Promise.all([fetchScores(), fetchQuestions()]);

        // Brief visual confirmation then redirect
        showSuccessState(totalPoints);
        setTimeout(() => setQuizActive(false), 1500);
      }
    } catch (err) {
      console.error("Batch submit failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!qId || !window.confirm('Are you sure you want to delete this quiz question?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/fun-quizzes/${qId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFeedback({ show: true, msg: 'Question deleted! ✅', type: 'success' });
        setTimeout(() => setFeedback({ show: false, msg: '', type: 'success' }), 3000);
        fetchQuestions();
        if (questions.length === 1) {
          setQuizActive(false);
          setShowManagementModal(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMultipleQuestions = async () => {
    if (selectedQuestionIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedQuestionIds.length} question(s)? This action cannot be undone.`)) return;
    
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const deletePromises = selectedQuestionIds.map(qId => 
        fetch(`${BASE_URL}/api/fun-quizzes/${qId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      );
      
      await Promise.all(deletePromises);
      
      setFeedback({ show: true, msg: `${selectedQuestionIds.length} questions deleted! ✅`, type: 'success' });
      setTimeout(() => setFeedback({ show: false, msg: '', type: 'success' }), 3000);
      setSelectedQuestionIds([]);
      fetchQuestions();
      
      if (questions.length <= selectedQuestionIds.length) {
        setQuizActive(false);
        setShowManagementModal(false);
      }
    } catch (err) {
      console.error("Batch delete error:", err);
      setFeedback({ show: true, msg: 'Error deleting questions! ❌', type: 'error' });
      setTimeout(() => setFeedback({ show: false, msg: '', type: 'success' }), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedQuestionIds.length === questions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(questions.map(q => q.id));
    }
  };

  const handleEditClick = (q) => {
    if (!q) return;
    setNewQuiz({
      question: q.question,
      option_a: q.options[0].text,
      option_b: q.options[1].text,
      option_c: q.options[2].text,
      option_d: q.options[3].text,
      correct_answer: q.correct_answer,
      points_reward: q.points_reward
    });
    setEditId(q.id);
    setIsEditing(true);
    setShowManagementModal(false);
    setShowAddModal(true);
  };

  const currentQ = questions[currentIdx];

  const s = {
    container: { minHeight: '100vh', backgroundColor: '#F8F9FA', padding: isMobile ? '15px' : '30px', fontFamily: '"Nunito", "Segoe UI", sans-serif' },
    layout: { display: 'flex', gap: '25px', flexDirection: isTablet ? 'column' : 'row', marginBottom: '25px' },
    hero: {
      flex: 2, background: 'linear-gradient(135deg, #B2DCE2 0%, #a7d6da 100%)', borderRadius: '32px', padding: isMobile ? '25px 20px' : '50px 60px',
      display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'center' : 'center', position: 'relative', overflow: 'hidden', textAlign: isMobile ? 'center' : 'left',
      boxShadow: '0 20px 40px -10px rgba(13,103,108,0.1)'
    },
    heroTitle: { fontSize: isMobile ? '36px' : '48px', fontWeight: '1000', color: '#0B1E3F', lineHeight: 1.05, marginBottom: '20px', letterSpacing: '-1.5px' },
    heroDesc: { fontSize: isMobile ? '12px' : '14px', fontWeight: '700', color: '#0B1E3F', opacity: 0.7, maxWidth: '380px', marginBottom: '35px', lineHeight: 1.6, marginLeft: isMobile ? 'auto' : '0', marginRight: isMobile ? 'auto' : '0' },
    heroBtn: {
      backgroundColor: '#0d676c', color: 'white', border: 'none', padding: '16px 36px', borderRadius: '14px',
      fontWeight: '900', fontSize: '15px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 10px 20px -5px rgba(13,103,108,0.3)', display: 'flex', alignItems: 'center', gap: '10px', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'center' : 'center'
    },
    leaderboard: {
      flex: 1, backgroundColor: 'white', borderRadius: '24px', padding: '25px', border: '1px solid #eef2f3',
      display: 'flex', flexDirection: 'column'
    },
    bottomSection: { backgroundColor: 'white', borderRadius: '24px', padding: isMobile ? '20px' : '30px', border: '1px solid #eef2f3' },
    option: (optObj, isAnswered) => {
      const isSelectedLocally = selectedOption === optObj.letter;
      const isUserPicked = currentQ?.user_selected_letter === optObj.letter;
      const isCorrectText = currentQ?.correct_answer === optObj.text;

      let borderColor = '#eef2f3';
      let bgColor = 'white';
      let textColor = '#64748b';

      if (isAnswered) {
        if (isCorrectText) {
          borderColor = '#22c55e'; bgColor = '#f0fdf4'; textColor = '#15803d';
        } else if (isUserPicked) {
          borderColor = '#ef4444'; bgColor = '#fef2f2'; textColor = '#b91c1c';
        }
      } else if (isSelectedLocally) {
        borderColor = '#0d676c'; bgColor = '#f0f9fa'; textColor = '#0d676c';
      }

      return {
        padding: '16px 20px', borderRadius: '14px', border: `1.5px solid ${borderColor}`, backgroundColor: bgColor,
        color: textColor, fontSize: '14px', fontWeight: '800', cursor: isAnswered ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', gap: '15px', transition: 'all 0.2s',
        borderColor: borderColor // Export border color for the letter box
      };
    }
  };

  const LandingMonster = (
    <div style={{ display: 'flex', alignItems: 'flex-end', position: 'relative', zIndex: 1, minWidth: isMobile ? '100px' : '150px', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'center' : 'flex-end', marginTop: isMobile ? '25px' : '0' }}>
      <img src="https://gifdb.com/images/high/quiz-question-eric-cartman-south-park-hrlfxd5qudqyw7n0.gif" alt="South Park Guide" style={{ height: isMobile ? '180px' : '250px', objectFit: 'contain', borderRadius: '24px' }} />
    </div>
  );

  const ReactiveMonster = (
    <div style={{ display: 'flex', alignItems: 'flex-end', position: 'relative', zIndex: 1, minWidth: isMobile ? '100px' : '150px', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'center' : 'flex-end', marginTop: isMobile ? '25px' : '0' }}>
      <img
        src={
          currentQ?.previous_result === 'wrong'
            ? "https://gifdb.com/images/high/sad-goodbye-crying-pikachu-emotional-anime-pokemon-s6o9gycbmkwj7xvy.gif"
            : currentQ?.previous_result === 'correct'
              ? "https://media1.tenor.com/m/yTtKMYMZ6agAAAAC/bunny-happy.gif"
              : "https://ugokawaii.com/wp-content/uploads/2022/12/QA-1024x1024.gif"
        }
        alt="Reaction"
        style={{ height: isMobile ? '160px' : '250px', objectFit: 'contain', borderRadius: '24px' }}
      />
    </div>
  );

  return (
    <div className="hr-dashboard-container" style={{ minHeight: '100vh', backgroundColor: '#eaeff2', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      <main className="dashboard-content" style={{ flex: 1, padding: isMobile ? '100px 16px 40px' : '120px 26px 40px', width: '100%', boxSizing: 'border-box', margin: '0', fontFamily: '"Nunito", "Segoe UI", sans-serif' }}>
        <AnimatePresence>
          {submissionFeedback.show && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
                zIndex: 10000, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '20px'
              }}
            >
              <div style={{ padding: '30px', borderRadius: '40px', backgroundColor: '#dcfce7', border: '2px solid #22c55e' }}>
                <CheckCircle size={80} color="#15803d" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '1000', color: '#0B1E3F', margin: '0 0 8px 0' }}>Success!</h1>
                <p style={{ fontSize: '18px', fontWeight: '800', color: '#15803d', margin: 0 }}>+{submissionFeedback.points} REP Points Stored</p>
                <div style={{ marginTop: '20px', fontSize: '14px', color: '#64748b', fontWeight: '700' }}>Returning to dashboard...</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!quizActive && (
          <div style={s.layout}>
            {/* LEFT COLUMN: HERO + PAST QUIZZES */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              {/* Back Navigation Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '5px' }}>
                <button 
                  onClick={() => window.history.back()} 
                  style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ArrowLeft size={18} color="#64748b" />
                </button>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0B1E3F' }}>Quiz Hub</h3>
                </div>
              </div>

              {/* HERO SECTION */}
              <div style={{ ...s.hero, flex: 'none' }}>
                <div style={{ position: 'relative', zIndex: 10 }}>
                  <h2 style={s.heroTitle}>Get Ready for<br />a Fun Quiz!</h2>
                  <p style={s.heroDesc}>Train your brain with smart, scientifically backed games that enhance various cognitive functions.</p>

                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.7)', padding: '8px 12px', borderRadius: '10px', border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '900', color: '#15803d', textTransform: 'uppercase' }}>Session Score</div>
                      <div style={{ fontSize: '14px', fontWeight: '1000', color: '#0B1E3F' }}>{questions.filter(q => q.previous_result === 'correct').reduce((sum, q) => sum + (q.points_reward || 0), 0)}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '15px', marginTop: '25px', alignItems: 'center' }}>
                    <button
                      onClick={() => setShowAddModal(true)}
                      style={{
                        ...s.heroBtn,
                        backgroundColor: 'white',
                        color: '#0d676c',
                        border: '2px solid #0d676c',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                        marginTop: 0
                      }}
                    >
                      Add Quiz
                    </button>
                    <button onClick={() => setQuizActive(true)} style={{ ...s.heroBtn, marginTop: 0 }}>{isHR ? 'Monitor Quiz' : 'View all'}</button>
                  </div>
                </div>

                {/* Default Monster Graphic for Landing */}
                {LandingMonster}
              </div>

              {/* QUIZ SESSIONS CARDS */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#0B1E3F', margin: 0 }}>Available Quiz</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateRows: '1fr', gap: '15px' }}>
                  {[
                    { id: 'today', title: 'Quiz Questions', questions: questions.length || 0, date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), color: '#0d676c', icon: '📝' }
                  ].map((card, idx) => {
                    const isToday = card.id === 'today';
                    const isDone = isToday && questions.length > 0 && questions.every(q => q.has_answered);
                    const inProgress = isToday && questions.length > 0 && questions.some(q => q.has_answered) && !isDone;

                    return (
                      <div key={idx} style={{
                        backgroundColor: 'white', padding: '40px 35px', borderRadius: '30px', minHeight: '160px',
                        border: '1.5px solid #eef2f3', display: 'flex', alignItems: 'center', gap: '20px',
                        cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(0,0,0,0.03)',
                        position: 'relative'
                      }}
                        onClick={() => setQuizActive(true)}
                      >
                        <div style={{ width: '60px', height: '60px', borderRadius: '28px', backgroundColor: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                          {card.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '900', color: '#0B1E3F' }}>{card.title}</div>
                            {isDone && (
                              <div style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '8px', fontWeight: '900', padding: '2px 6px', borderRadius: '20px', textTransform: 'uppercase' }}>Done</div>
                            )}
                          </div>
                          <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', marginTop: '4px' }}>
                            {card.questions} Questions • {card.date}
                          </div>
                        </div>

                        <button
                          style={{
                            backgroundColor: (isDone || isHR) ? '#f8fafc' : '#0d676c',
                            color: (isDone || isHR) ? '#64748b' : 'white',
                            border: (isDone || isHR) ? '1.5px solid #e2e8f0' : 'none',
                            padding: '8px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: '900',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                          }}
                        >
                          {isHR ? 'Monitor' : (isDone ? 'Review' : (inProgress ? 'Continue' : 'View all'))}
                          { (isDone || isHR) ? <Info size={12} /> : <ChevronRight size={12} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* LEADERBOARD */}
            <div style={s.leaderboard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Trophy size={18} color="#0d676c" />
                  <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#0B1E3F', margin: 0 }}>Daily Scores</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b' }}>Attended Users: {leaderboard.length}</div>
                  <div style={{ fontSize: '9px', fontWeight: '800', background: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '20px', textTransform: 'uppercase' }}>LIVE</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {leaderboard.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '10px', borderBottom: i === leaderboard.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '900' }}>
                      {p.initial}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '900', color: '#0B1E3F' }}>{p.name}</div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8' }}>Rank #{p.rank}</div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '900', color: '#0d676c' }}>{p.score}</div>
                  </div>
                ))}
              </div>

              <button style={{ marginTop: '15px', width: '100%', border: '1.5px solid #e2e8f0', backgroundColor: 'transparent', padding: '10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', color: '#64748b', cursor: 'pointer' }}>
                View Full List
              </button>
            </div>
          </div>
        )}

        {/* BRAIN TEASER / QUIZ AREA (NEW SCREEN) */}
        {quizActive && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={s.layout}>
            {/* LEFT COLUMN: QUIZ AREA */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderRadius: '24px', padding: isMobile ? '20px' : '30px', border: '1px solid #eef2f3' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <button onClick={() => setQuizActive(false)} style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'white', border: '1.5px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <ArrowLeft size={16} color="#0B1E3F" />
                  </button>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0B1E3F', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Zap size={20} color="#0d676c" fill="#0d676c" /> Daily Brain Teaser
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowManagementModal(true)}
                    disabled={questions.length === 0}
                    style={{ opacity: questions.length === 0 ? 0.5 : 1, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px', cursor: questions.length === 0 ? 'not-allowed' : 'pointer', color: '#1e293b', fontSize: '12px', fontWeight: '800' }}
                  >
                    <Edit size={16} color="#3863a8" /> Manage Quizzes
                  </button>
                </div>
              </div>

              {/* INNER PAGE MONSTER HERO */}
              <div style={{ backgroundColor: '#B2DCE2', borderRadius: '20px', padding: isMobile ? '25px 20px' : '30px 40px', marginBottom: '30px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'center' : 'center', overflow: 'hidden', textAlign: isMobile ? 'center' : 'left' }}>
                <div>
                  <h2 style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: '900', color: '#0B1E3F', margin: '0 0 10px 0' }}>{isHR ? 'Quiz Monitor' : 'Thinking Cap On!'}</h2>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#0B1E3F', opacity: 0.8, maxWidth: '300px', margin: isMobile ? '0 auto' : 0 }}>{isHR ? 'Review the questions and answers for the active quiz session.' : 'Answer these questions carefully. You only get one shot to earn those points!'}</p>
                </div>
                <div>
                  {ReactiveMonster}
                </div>
              </div>

              {isHR ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {questions.map((q, idx) => (
                    <div key={idx} style={{ padding: '20px', borderRadius: '16px', border: '1.5px solid #eef2f3', background: '#f8fafc' }}>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#0B1E3F', marginBottom: '10px' }}>
                        Q{idx + 1}. "{q.question}"
                      </div>
                      <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#dcfce7', border: '1px solid #22c55e', color: '#15803d', fontSize: '14px', fontWeight: '800' }}>
                        Answer: {q.correct_answer}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8' }}>
                        Q {questions.length > 0 ? currentIdx + 1 : 0}/{questions.length}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setCurrentIdx(p => Math.max(0, p - 1))}
                          disabled={currentIdx === 0}
                          style={{ backgroundColor: 'white', border: '1.5px solid #eef2f3', borderRadius: '10px', padding: '8px 12px', cursor: currentIdx === 0 ? 'not-allowed' : 'pointer', opacity: currentIdx === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px', fontWeight: '800' }}
                        >
                          <ArrowLeft size={14} />
                        </button>
                        <button
                          onClick={() => setCurrentIdx(p => Math.min(questions.length - 1, p + 1))}
                          disabled={currentIdx === questions.length - 1}
                          style={{ backgroundColor: 'white', border: '1.5px solid #eef2f3', borderRadius: '10px', padding: '8px 16px', cursor: currentIdx === questions.length - 1 ? 'not-allowed' : 'pointer', opacity: currentIdx === questions.length - 1 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '6px', color: '#0B1E3F', fontSize: '12px', fontWeight: '800' }}
                        >
                          Next <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {isQuestionsLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                      <Loader2 className="animate-spin" size={30} color="#0d676c" />
                    </div>
                  ) : questions.length > 0 && currentQ ? (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentIdx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        {/* Question Status Banner */}
                        {currentQ.has_answered && (
                          <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: currentQ.previous_result === 'correct' ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${currentQ.previous_result === 'correct' ? '#bbf7d0' : '#fecaca'}` }}>
                            {currentQ.previous_result === 'correct' ? <CheckIcon size={18} color="#15803d" /> : <XIcon size={18} color="#b91c1c" />}
                            <span style={{ fontSize: '14px', fontWeight: '800', color: currentQ.previous_result === 'correct' ? '#15803d' : '#b91c1c' }}>
                              {currentQ.previous_result === 'correct' ? 'You answered this correctly!' : 'You answered this incorrectly.'}
                            </span>
                          </div>
                        )}
                        <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '900', color: '#0B1E3F', marginBottom: '25px' }}>
                          Q{currentIdx + 1}. "{currentQ.question}"
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '15px' }}>
                          {currentQ.options.map((optObj, i) => {
                            const st = s.option(optObj, currentQ.has_answered);
                            return (
                              <div
                                key={i}
                                style={st}
                                onClick={() => {
                                  if (!currentQ.has_answered) setSelectedOption(optObj.letter);
                                }}
                              >
                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: st.borderColor === '#22c55e' ? '#22c55e' : (st.borderColor === '#ef4444' ? '#ef4444' : '#0d676c'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: '900' }}>
                                  {optObj.letter}
                                </div>
                                {optObj.text}
                                {currentQ.has_answered && currentQ.correct_answer === optObj.text && (
                                  <div style={{ marginLeft: 'auto', backgroundColor: '#22c55e', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '900' }}>CORRECT</div>
                                )}
                                {currentQ.has_answered && currentQ.user_selected_letter === optObj.letter && currentQ.correct_answer !== optObj.text && (
                                  <div style={{ marginLeft: 'auto', backgroundColor: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '900' }}>WRONG</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          {currentQ.has_answered && currentIdx < questions.length - 1 ? (
                            <button
                              onClick={() => setCurrentIdx(prev => prev + 1)}
                              style={{
                                backgroundColor: '#0d676c', color: 'white', border: 'none', padding: '12px 30px',
                                borderRadius: '12px', fontWeight: '900', fontSize: '14px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(13,103,108,0.2)'
                              }}
                            >
                              Next Question <ChevronRight size={18} />
                            </button>
                          ) : currentQ.has_answered && currentIdx === questions.length - 1 ? (
                            <button
                              disabled={isSubmitting}
                              onClick={handleSendTotalResults}
                              style={{
                                backgroundColor: '#34A853', color: 'white', border: 'none', padding: '12px 30px',
                                borderRadius: '12px', fontWeight: '900', fontSize: '14px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(52,168,83,0.2)'
                              }}
                            >
                              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Trophy size={18} />}
                              Submit Final Score ({questions.filter(q => q.previous_result === 'correct').reduce((sum, q) => sum + (q.points_reward || 0), 0)} pts)
                            </button>
                          ) : (
                            <button
                              disabled={currentQ.has_answered || !selectedOption || isSubmitting}
                              onClick={handleSubmit}
                              style={{
                                backgroundColor: currentQ.has_answered || !selectedOption ? '#e2e8f0' : '#0d676c',
                                color: currentQ.has_answered || !selectedOption ? '#94a3b8' : 'white',
                                border: 'none', padding: '12px 30px', borderRadius: '12px',
                                fontWeight: '900', fontSize: '14px',
                                cursor: currentQ.has_answered || !selectedOption || isSubmitting ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: currentQ.has_answered || !selectedOption ? 'none' : '0 4px 12px rgba(13,103,108,0.2)'
                              }}
                            >
                              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                              Check Answer
                            </button>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontWeight: '800' }}>
                      No quizzes available for today.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* RIGHT COLUMN: LEADERBOARD IN INNER SCREEN */}
            <div style={s.leaderboard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Trophy size={18} color="#0d676c" />
                  <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#0B1E3F', margin: 0 }}>Daily Scores</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b' }}>Attended Users: {leaderboard.length}</div>
                  <div style={{ fontSize: '9px', fontWeight: '800', background: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '20px', textTransform: 'uppercase' }}>LIVE</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {leaderboard.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '10px', borderBottom: i === leaderboard.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '900' }}>
                      {p.initial}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '900', color: '#0B1E3F' }}>{p.name}</div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8' }}>Rank #{p.rank}</div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '900', color: '#0d676c' }}>{p.score}</div>
                  </div>
                ))}
              </div>

              <button style={{ marginTop: '15px', width: '100%', border: '1.5px solid #e2e8f0', backgroundColor: 'transparent', padding: '10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', color: '#64748b', cursor: 'pointer' }}>
                View Full List
              </button>
            </div>

          </motion.div>
        )}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
                zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px'
              }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(16px)', borderRadius: '40px', padding: '45px',
                  width: '100%', maxWidth: '550px', position: 'relative',
                  boxShadow: '0 40px 80px -20px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.5)'
                }}
              >
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setIsEditing(false);
                    setEditId(null);
                    setNewQuiz({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: '', points_reward: 10 });
                  }}
                  style={{ position: 'absolute', top: '25px', right: '25px', background: '#f8fafc', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer' }}
                >✕</button>

                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '24px', backgroundColor: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>📝</div>
                  <h2 style={{ fontSize: '28px', fontWeight: '1000', color: '#0B1E3F', letterSpacing: '-0.5px' }}>{isEditing ? 'Edit Quiz Question' : 'Add New Quiz Question'}</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Question Text</label>
                    <textarea
                      value={newQuiz.question}
                      onChange={(e) => setNewQuiz({ ...newQuiz, question: e.target.value })}
                      placeholder="Enter the quiz question..."
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none', minHeight: '80px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {['a', 'b', 'c', 'd'].map(opt => (
                      <div key={opt}>
                        <label style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Option {opt.toUpperCase()}</label>
                        <input
                          type="text"
                          value={newQuiz[`option_${opt}`]}
                          onChange={(e) => setNewQuiz({ ...newQuiz, [`option_${opt}`]: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Correct Answer (Must match exactly)</label>
                    <input
                      type="text"
                      value={newQuiz.correct_answer}
                      onChange={(e) => setNewQuiz({ ...newQuiz, correct_answer: e.target.value })}
                      placeholder="Paste the correct option text here"
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Point Reward</label>
                    <input
                      type="number"
                      value={newQuiz.points_reward}
                      onChange={(e) => setNewQuiz({ ...newQuiz, points_reward: parseInt(e.target.value) })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setIsEditing(false);
                      setEditId(null);
                      setNewQuiz({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: '', points_reward: 10 });
                    }}
                    style={{ flex: 1, padding: '16px', borderRadius: '50px', border: '1.5px solid #0d676c15', background: 'white', color: '#64748b', fontWeight: '1000', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}
                  >Cancel</button>
                  <button
                    disabled={isAdding}
                    onClick={async () => {
                      setIsAdding(true);
                      try {
                        // Validation
                        if (!newQuiz.question || !newQuiz.option_a || !newQuiz.option_b || !newQuiz.option_c || !newQuiz.option_d || !newQuiz.correct_answer) {
                          setFeedback({ show: true, msg: 'Please fill all fields! ⚠️', type: 'error' });
                          setTimeout(() => setFeedback({ show: false, msg: '', type: 'success' }), 3000);
                          setIsAdding(false);
                          return;
                        }

                        const token = localStorage.getItem('token');
                        const uid = user?.employee_id || user?.userId || user?.id;

                        const payload = {
                          ...newQuiz,
                          created_by: uid,
                          points_reward: Number(newQuiz.points_reward)
                        };

                        const url = isEditing ? `${BASE_URL}/api/fun-quizzes/${editId}` : `${BASE_URL}/api/fun-quizzes`;
                        const method = isEditing ? 'PUT' : 'POST';

                        const res = await fetch(url, {
                          method,
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token?.trim()}`
                          },
                          body: JSON.stringify(payload)
                        });
                        if (res.ok) {
                          setShowAddModal(false);
                          setIsEditing(false);
                          setEditId(null);
                          fetchQuestions();
                          setNewQuiz({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: '', points_reward: 10 });
                          setFeedback({ show: true, msg: isEditing ? 'Question updated! ✅' : 'Added Quiz successfully ✅', type: 'success' });
                          setTimeout(() => setFeedback({ show: false, msg: '', type: 'success' }), 3000);
                        }
                      } catch (err) { } finally { setIsAdding(false); }
                    }}
                    style={{ flex: 2, padding: '16px', borderRadius: '50px', border: 'none', background: '#0d676c', color: 'white', fontWeight: '1000', fontSize: '15px', cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(13,103,108,0.3)', transition: 'all 0.2s' }}
                  >
                    {isAdding ? 'Saving...' : (isEditing ? 'Update Question' : 'Publish Quiz')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <AppFooter />

      {/* MANAGEMENT MODAL */}
      <AnimatePresence>
        {showManagementModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
              zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              style={{
                backgroundColor: 'white', borderRadius: '32px', padding: '35px',
                width: '100%', maxWidth: '700px', maxHeight: '85vh', overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 40px 80px -20px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.5)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: '1000', color: '#0B1E3F', margin: 0 }}>Quiz Repository</h2>
                  <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', marginTop: '4px' }}>Manage all active questions in the hub</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {questions.length > 0 && (
                    <button
                      onClick={toggleSelectAll}
                      style={{
                        padding: '10px 20px', borderRadius: '14px', border: '1.5px solid #e2e8f0',
                        background: selectedQuestionIds.length === questions.length ? '#0d676c' : 'white',
                        color: selectedQuestionIds.length === questions.length ? 'white' : '#0B1E3F',
                        fontSize: '12px', fontWeight: '1000', cursor: 'pointer', transition: '0.2s',
                        boxShadow: selectedQuestionIds.length === questions.length ? '0 4px 12px rgba(13,103,108,0.2)' : 'none'
                      }}
                    >
                      {selectedQuestionIds.length === questions.length ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowManagementModal(false);
                      setSelectedQuestionIds([]);
                    }}
                    style={{ background: '#f8fafc', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                  >✕</button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {questions.length > 0 ? (
                  <>
                    {selectedQuestionIds.length > 0 && (
                      <div style={{ padding: '20px', borderRadius: '20px', background: '#fef2f2', border: '1.5px solid #fecaca', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '900', color: '#b91c1c' }}>{selectedQuestionIds.length} Questions Selected</div>
                          <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700' }}>Are you sure you want to delete these?</div>
                        </div>
                        <button
                          onClick={handleDeleteMultipleQuestions}
                          disabled={isDeleting}
                          style={{
                            background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px',
                            padding: '12px 24px', fontWeight: '1000', fontSize: '13px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(239,68,68,0.2)'
                          }}
                        >
                          {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          Delete All
                        </button>
                      </div>
                    )}

                    {!selectedQuestionIds.length && (
                      <>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Select Question</label>
                          <select 
                            onChange={(e) => {
                              const val = e.target.value;
                              if(val) {
                                 const found = questions.find(q => String(q.id) === String(val));
                                 if(found) setEditId(found.id);
                              } else {
                                 setEditId(null);
                              }
                            }}
                            value={editId || ''}
                            style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', fontWeight: '700', color: '#1e293b', outline: 'none', backgroundColor: '#f8fafc', appearance: 'none', cursor: 'pointer' }}
                          >
                            <option value="">-- Click to Select a Question --</option>
                            {questions.map((q, idx) => (
                              <option key={q.id || idx} value={q.id}>
                                Q{idx + 1}: {q.question.substring(0, 50)}{q.question.length > 50 ? '...' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {editId && questions.find(q => String(q.id) === String(editId)) && (() => {
                          const selectedQ = questions.find(q => String(q.id) === String(editId));
                          return (
                            <div style={{ padding: '25px', borderRadius: '20px', background: '#f8fafc', border: '1.5px solid #eef2f3' }}>
                               <h4 style={{ fontSize: '15px', fontWeight: '900', color: '#0B1E3F', marginTop: 0, marginBottom: '15px', lineHeight: 1.4 }}>{selectedQ.question}</h4>
                               
                               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                                 {selectedQ.options.map((opt, i) => (
                                   <div key={i} style={{ padding: '10px 14px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: '700', color: '#475569' }}>
                                     <span style={{ fontWeight: '900', color: '#0d676c', marginRight: '8px' }}>{opt.letter}</span> {opt.text}
                                   </div>
                                 ))}
                               </div>

                               <div style={{ display: 'flex', gap: '15px' }}>
                                  <button
                                    onClick={() => handleEditClick(selectedQ)}
                                    style={{ flex: 1, background: '#0d676c', color: 'white', border: 'none', borderRadius: '12px', padding: '12px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s', boxShadow: '0 4px 10px rgba(13,103,108,0.2)' }}
                                  >
                                    <Edit size={16} /> Edit Question
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDeleteQuestion(selectedQ.id);
                                      setEditId(null);
                                    }}
                                    style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '12px', padding: '12px 20px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s' }}
                                  >
                                    <Trash2 size={16} /> Delete
                                  </button>
                               </div>
                            </div>
                          )
                        })()}
                      </>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No questions found in repository.</div>
                )}
              </div>

              <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowManagementModal(false)}
                  style={{ padding: '12px 30px', borderRadius: '50px', background: '#0B1E3F', color: 'white', border: 'none', fontWeight: '900', fontSize: '14px', cursor: 'pointer' }}
                >Done</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {feedback.show && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
              backgroundColor: feedback.type === 'success' ? '#0d676c' : '#ef4444',
              color: 'white', padding: '16px 32px', borderRadius: '16px',
              fontSize: '14px', fontWeight: '800', zIndex: 20000,
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px'
            }}
          >
            {feedback.type === 'success' ? <CheckCircle size={18} /> : <XIcon size={18} />}
            {feedback.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FunQuiz;
