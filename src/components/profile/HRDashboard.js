import React, { useState, useEffect } from 'react';
import logo from '../../assets/logo.png';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, TEAM_OFFICE_AUTH_TOKEN, BASE_URL } from '../../config';
import { 
  Users, MessageSquare, Briefcase, 
  ChevronRight, ArrowRight, User, CheckSquare, Hourglass, Sparkles,
  Clock, Calendar, CheckCircle, Trophy, PartyPopper, Star, Package, ClipboardList, Gift, Cake
} from 'lucide-react';
import './Dashboard.css';
import TaskNotification from './TaskNotification';

export default function HRDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [joineeCount, setJoineeCount] = useState(0);
  const [jobAppCount, setJobAppCount] = useState(0);
  const [currentStatIndex, setCurrentStatIndex] = useState(0);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    onLeave: 0,
    late: 0
  });
  const [rewardsCount, setRewardsCount] = useState(0);
  const [employeesCount, setEmployeesCount] = useState(0);
  const [teamsCount, setTeamsCount] = useState(0);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [challengeData, setChallengeData] = useState({
    title: 'Loading...',
    participants: 0,
    topParticipants: []
  });
  const [winWidth, setWinWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!user?.token) return;
    try {
      // 1. Fetch Total Users and create lookup for name resolution (DO THIS FIRST)
      const usersRes = await fetch(API_ENDPOINTS.USERS, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const userLookup = {};
      if (usersRes.ok) {
        const uData = await usersRes.json();
        const uList = Array.isArray(uData) ? uData : (uData?.data || []);
        setEmployeesCount(uList.length);
        uList.forEach(u => {
          const uid = String(u.id || u.empId || u.employee_id || '').trim();
          if (uid) userLookup[uid] = u.name;
        });
      }

      // Fetch New Joinees & Interns (Combined & Filtered)
      const [joineeRes, internRes] = await Promise.all([
        fetch(API_ENDPOINTS.NEW_JOINEES, { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null),
        fetch(API_ENDPOINTS.INTERNS, { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null)
      ]);
      
      let totalActiveJoinees = 0;
      if (joineeRes && joineeRes.ok) {
        const jData = await joineeRes.json();
        const activeJoinees = (Array.isArray(jData) ? jData : []).filter(j => Number(j.is_blocked) !== 1);
        totalActiveJoinees += activeJoinees.length;
      }
      if (internRes && internRes.ok) {
        const iData = await internRes.json();
        const internsList = Array.isArray(iData) ? iData : (iData.data || []);
        const activeInterns = internsList.filter(i => Number(i.is_blocked) !== 1);
        totalActiveJoinees += activeInterns.length;
      }
      setJoineeCount(totalActiveJoinees);

      // Fetch Job Applications count
      try {
        const jobAppRes = await fetch(API_ENDPOINTS.JOB_APPLICATIONS, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (jobAppRes.ok) {
          const jobData = await jobAppRes.json();
          const jobList = Array.isArray(jobData) ? jobData : (jobData?.data || jobData?.applications || []);
          setJobAppCount(jobList.length);
        }
      } catch (e) {
        console.log('Job applications endpoint not available yet');
      }
      // Fetch Real-time Attendance Logs for Dashboard Metrics
      const attLogsRes = await fetch(API_ENDPOINTS.ATTENDANCE_LOGS_GET, {
        headers: { 'Authorization': `Bearer ${user.token || TEAM_OFFICE_AUTH_TOKEN}` }
      });
      if (attLogsRes.ok) {
        const logData = await attLogsRes.json();
        const masterLogs = logData.data || logData.attendance || logData.logs || (Array.isArray(logData) ? logData : []);
        
        if (Array.isArray(masterLogs)) {
          const todayStr = new Date().toISOString().split('T')[0];
          const todayLogs = masterLogs.filter(l => {
            const lDate = (l?.punch_date || l?.date || l?.created_at || '').split('T')[0];
            return lDate === todayStr;
          });
          const uniquePresentToday = new Set(todayLogs.map(l => String(l?.user_id || l?.Empcode || l?.EmpID || ''))).size;
          const lateToday = todayLogs.filter(l => String(l?.status || '').toUpperCase().includes('LATE')).length;
          setAttendanceStats(prev => ({ ...prev, present: uniquePresentToday, late: lateToday }));
        }
      }

      // Fetch Leave Requests
      setLeavesLoading(true);
      const leavesRes = await fetch(API_ENDPOINTS.LEAVES_GET, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (leavesRes.ok) {
        const lData = await leavesRes.json();
        const lList = Array.isArray(lData) ? lData : (lData?.leaves || lData?.all || lData?.data || lData?.requests || []);
        
        // RESOLVE: Resolve employee names using our lookup
        const resolvedLeaves = (Array.isArray(lList) ? lList : []).map(r => {
          if (!r.employee_name && !r.name) {
            const uid = String(r.userId || r.user_id || r.employee_id || r.empId || '').trim();
            if (uid && userLookup[uid]) {
              r.employee_name = userLookup[uid];
            }
          }
          return r;
        });

        setLeaveRequests(resolvedLeaves);
        
        // Count all active leaves (Pending + Approved)
        const totalActiveLeaves = resolvedLeaves.filter(r => 
          ['PENDING', 'APPROVED'].includes(String(r.status || '').toUpperCase())
        ).length;
        setAttendanceStats(prev => ({ ...prev, onLeave: totalActiveLeaves }));
      }

      // Fetch Rewards History
      const rewardsRes = await fetch(API_ENDPOINTS.REWARDS_HISTORY, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (rewardsRes.ok) {
        const rData = await rewardsRes.json();
        setRewardsCount(Array.isArray(rData) ? rData.length : (rData?.data?.length || 0));
      }

      // Fetch Total Teams
      const teamsRes = await fetch(API_ENDPOINTS.TEAMS, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (teamsRes.ok) {
        const tData = await teamsRes.json();
        setTeamsCount(Array.isArray(tData) ? tData.length : (tData?.data?.length || 0));
      }

      // Fetch Upcoming Birthdays for Dashboard Preview
      try {
        const bRes = await fetch(API_ENDPOINTS.BIRTHDAYS, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (bRes.ok) {
          const bData = await bRes.json();
          const bList = Array.isArray(bData) ? bData : (bData.data || []);
          
          const today = new Date();
          const currentMonth = today.getMonth();
          const currentDay = today.getDate();

          const parseDate = (dateStr) => {
            if (!dateStr) return new Date(NaN);
            if (dateStr instanceof Date) return dateStr;
            const s = String(dateStr).trim();
            // Handle ISO YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s);
            // Handle DD-MM-YYYY or DD/MM/YYYY
            if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(s)) {
              const [d, m, y] = s.split(/[-/]/);
              return new Date(y, m - 1, d);
            }
            // Handle DD-MM or DD/MM
            if (/^\d{1,2}[-/]\d{1,2}$/.test(s)) {
              const [d, m] = s.split(/[-/]/);
              return new Date(new Date().getFullYear(), m - 1, d);
            }
            return new Date(s);
          };

          const processed = bList.map(emp => {
            const dob = parseDate(emp.dob || emp.birthday || emp.date || emp.date_of_birth || emp.birthday_date);
            let displayDate = 'N/A';
            if (!isNaN(dob.getTime())) {
              displayDate = dob.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            }
            return { ...emp, month: dob.getMonth(), day: dob.getDate(), dobDate: dob, displayDate };
          }).filter(emp => !isNaN(emp.dobDate.getTime()))
            .filter(emp => emp.month > currentMonth || (emp.month === currentMonth && emp.day >= currentDay));

          const sorted = processed.sort((a, b) => {
            if (a.month !== b.month) return a.month - b.month;
            return a.day - b.day;
          });
          setUpcomingBirthdays(sorted.slice(0, 5));
        }
      } catch (e) {
        console.log('Birthdays sync error');
      }

      // Fetch Holidays
      try {
        const hRes = await fetch(API_ENDPOINTS.HOLIDAYS, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        }).catch(() => null);
        if (hRes && hRes.ok) {
          const hData = await hRes.json();
          const hList = Array.isArray(hData) ? hData : (hData.data || []);
          const today = new Date();
          const currentMonth = today.getMonth();
          const currentDay = today.getDate();
          
          const processedH = hList.map(h => {
            const d = new Date(h.date || h.holiday_date);
            return { ...h, d, month: d.getMonth(), day: d.getDate() };
          }).filter(h => !isNaN(h.d.getTime()))
            .filter(h => h.month > currentMonth || (h.month === currentMonth && h.day >= currentDay))
            .sort((a, b) => a.d - b.d)
            .slice(0, 5);
          setHolidays(processedH);
        }
      } catch (e) {
        console.log('Holidays sync error');
      }

      // Fetch Quiz Challenge Data
      try {
        const quizRes = await fetch(`${BASE_URL}/api/fun-quizzes`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const leaderboardRes = await fetch(`${BASE_URL}/api/fun-quizzes/leaderboard`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });

        let title = 'Tech Trivia Champions';
        let participants = 0;
        let topParticipants = [];

        if (quizRes.ok) {
          const quizzes = await quizRes.json();
          const quizList = Array.isArray(quizzes) ? quizzes : (quizzes.data || []);
          if (quizList.length > 0) {
            title = quizList[0].question || title;
            // Shorten title if too long
            if (title.length > 30) title = title.substring(0, 27) + '...';
          }
        }

        if (leaderboardRes.ok) {
          const lbData = await leaderboardRes.json();
          const list = Array.isArray(lbData) ? lbData : (lbData.data || []);
          participants = list.length;
          topParticipants = list.slice(0, 3).map(p => ({
            name: p.name || 'User',
            pic: p.profile_pic || p.profile_picture || null
          }));
        }

        setChallengeData({
          title: title.includes('?') ? title.replace('?', '') : title,
          participants: participants > 0 ? participants : 42,
          topParticipants: topParticipants.length > 0 ? topParticipants : [
            { name: 'A', pic: null }, { name: 'B', pic: null }, { name: 'C', pic: null }
          ]
        });
      } catch (e) {
        console.log('Challenge data sync error');
      }
    } catch (err) {
      console.error('Fetch dashboard data error:', err);
    } finally {
      setLeavesLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const hrStats = [
    { label: 'Total Teams', value: teamsCount || 'View', icon: <Users size={20} color="#6366f1" />, badge: 'Live', badgeClass: 'badge-blue', iconBg: '#eff6ff', path: '/teams' },
    { label: 'Total Employees', value: employeesCount || 'View', icon: <User size={20} color="#8b5cf6" />, badge: 'Live', badgeClass: 'badge-blue', iconBg: '#f5f3ff', path: '/employees' },
    { label: 'Personal Information', value: 'Manage', icon: <User size={20} color="#3b82f6" />, badge: 'Active', badgeClass: 'badge-blue', iconBg: '#eef2ff', path: '/personal-info' },
    { label: 'Awards and Recognition', value: rewardsCount || 'View', icon: <Trophy size={20} color="#f59e0b" />, badge: 'Live', badgeClass: 'badge-yellow', iconBg: '#fffbeb', path: '/awards' },
    { label: 'Assets Management', value: 'Manage', icon: <Package size={20} color="#ec4899" />, badge: 'New', badgeClass: 'badge-pink', iconBg: '#fdf2f8', path: '/assets' },
    { label: 'New Joinee', value: joineeCount || 'View', icon: <Sparkles size={20} color="#06b6d4" />, badge: 'This Month', badgeClass: 'badge-green', iconBg: '#ecfeff', path: '/new-joinees' },
    { label: 'New Hirings', value: jobAppCount || 'View', icon: <Briefcase size={20} color="#0d9488" />, badge: 'Applications', badgeClass: 'badge-green', iconBg: '#f0fdfa', path: '/job-applications' },
    { label: 'Post Vacancy', value: 'Create', icon: <ClipboardList size={20} color="#3b82f6" />, badge: 'Hiring', badgeClass: 'badge-blue', iconBg: '#eff6ff', path: '/job-postings' },
  ];

  return (
    <div className="hr-dashboard-container" style={{ minHeight: '100vh', backgroundColor: '#eaeff2', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      <main style={{ 
        flex: 1, 
        padding: winWidth < 768 ? '20px 16px 40px' : '40px 26px 40px', 
        maxWidth: '100%', 
        margin: '0 auto', 
        width: '100%', 
        boxSizing: 'border-box',
        marginTop: winWidth < 768 ? '85px' : '100px'
      }}>
        <header className="section-header" style={{
          marginBottom: winWidth < 768 ? '24px' : '32px',
          display: 'flex',
          flexDirection: winWidth < 1024 ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: winWidth < 1024 ? 'stretch' : 'center',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div>
              <h1 style={{ fontSize: winWidth < 768 ? '24px' : '32px', fontWeight: '950', color: '#0f172a', margin: '0', letterSpacing: '-1px' }}>HR Dashboard</h1>
              <p style={{ color: '#64748b', fontSize: winWidth < 768 ? '12px' : '14px', fontWeight: '700', margin: '4px 0 0 0' }}>Strength and scale • {teamsCount} Active Teams</p>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <section style={{ marginBottom: winWidth < 768 ? '32px' : '40px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: winWidth < 640 ? 'repeat(2, 1fr)' : winWidth < 1024 ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
            gap: winWidth < 768 ? '12px' : '20px'
          }}>
            {hrStats.map((stat, i) => (
              <div 
                key={i} 
                className="stat-card animate-fade-in" 
                style={{ 
                  padding: winWidth < 768 ? '16px' : '24px', 
                  cursor: stat.path ? 'pointer' : 'default',
                  borderRadius: '24px',
                  background: 'white',
                  border: '1.5px solid #f1f5f9',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: '0.2s transform, 0.2s box-shadow'
                }}
                onClick={() => stat.path && navigate(stat.path)}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ 
                    background: stat.iconBg, width: winWidth < 768 ? '36px' : '44px', height: winWidth < 768 ? '36px' : '44px', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {stat.icon}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: winWidth < 768 ? '11px' : '13px', color: '#64748b', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                  <div style={{ 
                    fontSize: winWidth < 768 ? '20px' : '28px', 
                    fontWeight: '950', 
                    color: '#0f172a',
                    lineHeight: 1
                  }}>{stat.value}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: winWidth < 768 ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
          {/* Leave/Attendance Management */}
          <section className="dashboard-section animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: winWidth < 640 ? 'column' : 'row',
              justifyContent: 'space-between', 
              alignItems: winWidth < 640 ? 'stretch' : 'center', 
              marginBottom: '20px',
              gap: '12px'
            }}>
              <h2 className="section-title" style={{ margin: 0 }}><Calendar size={20} color="#3863a8" /> Leave/Attendance Management</h2>

            </div>

            {/* Attendance Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: winWidth < 480 ? '1fr' : 'repeat(2, 1fr)', gap: '10px', marginBottom: '24px' }}>
              <div 
                onClick={(e) => { e.stopPropagation(); navigate('/attendance'); }}
                style={{ background: '#f0fdf4', padding: '15px', borderRadius: '20px', border: '1px solid #dcfce7', textAlign: 'center', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '11px', color: '#15803d', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>Present</div>
                <div style={{ fontSize: '24px', fontWeight: '950', color: '#166534' }}>{attendanceStats.present}</div>
              </div>
              <div 
                onClick={(e) => { e.stopPropagation(); navigate('/leaves'); }}
                style={{ background: '#fffbeb', padding: '15px', borderRadius: '20px', border: '1px solid #fef3c7', textAlign: 'center', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '11px', color: '#b45309', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>Total Leaves</div>
                <div style={{ fontSize: '24px', fontWeight: '950', color: '#92400e' }}>{attendanceStats.onLeave}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Requests</div>
              {leavesLoading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>Syncing requests...</div>
              ) : leaveRequests.filter(r => String(r.status || '').toUpperCase().includes('PENDING')).length > 0 ? (
                leaveRequests.filter(r => String(r.status || '').toUpperCase().includes('PENDING')).slice(0, 3).map(request => (
                  <div key={request.id} onClick={() => navigate(`/attendance/leave/${request.id}`)} style={{ 
                    display: 'flex', alignItems: 'center', gap: '15px', padding: '14px', 
                    borderRadius: '16px', background: '#ffffff', border: '3px solid #cbd5e1',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: 'pointer'
                  }}>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px' }}>
                      <Clock size={18} color="#64748b" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{request.employee_name || request.name}</div>
                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#3863a8', background: '#eff6ff', padding: '2px 8px', borderRadius: '8px' }}>{String(request.status || 'PENDING').split(',')[0]}</div>
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                        {request.leave_type || 'Leave'} • {(request.start_date || '').split('T')[0].split('-').reverse().join('-') || 'N/A'}
                      </div>
                    </div>
                    <ChevronRight size={16} color="#94a3b8" />
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', border: '1px dashed #e2e8f0', borderRadius: '16px' }}>
                  No pending requests found
                </div>
              )}
            </div>
          </section>

          {/* Fun & Engagement Hub */}
          <section className="dashboard-section animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="section-title"><Sparkles size={20} color="#3863a8" /> Fun and Quiz</h2>
              <button 
                className="btn-ghost" 
                style={{ fontSize: '14px', padding: '8px 12px' }}
                onClick={() => navigate('/fun-quiz')}
              >
                Join the Hub
              </button>
            </div>
            
            <div 
              onClick={() => navigate('/fun-quiz')}
              style={{ 
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
                borderRadius: '24px', padding: '30px', color: 'white', cursor: 'pointer',
                position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '10px' }}>
                    <Trophy size={20} color="#f59e0b" />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8' }}>Weekly Challenge</span>
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.5px' }}>{challengeData.title} 🏆</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px', maxWidth: '200px' }}>{challengeData.participants} employees are currently competing for the top spot!</p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', marginLeft: '5px' }}>
                    {challengeData.topParticipants.map((p, i) => (
                      <div key={i} style={{ 
                        width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #1e293b', 
                        background: '#3863a8', marginLeft: i === 0 ? '0' : '-8px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontSize: '10px', fontWeight: '800', overflow: 'hidden' 
                      }}>
                        {p.pic ? (
                          <img src={p.pic.startsWith('http') ? p.pic : `${BASE_URL}${p.pic.startsWith('/') ? '' : '/'}${p.pic}`} alt="p" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : p.name[0]}
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#3863a8' }}>
                    {challengeData.participants > 3 ? `+${challengeData.participants - 3} more` : ''}
                  </span>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
                <Sparkles size={150} color="white" />
              </div>
              <div style={{ position: 'absolute', bottom: '20px', right: '30px' }}>
                <ChevronRight size={32} color="#3863a8" />
              </div>
            </div>
          </section>


          {/* List of Holidays Section */}
          <section className="dashboard-section animate-fade-in" style={{ animationDelay: '0.5s', cursor: 'pointer' }} onClick={() => navigate('/holidays')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="section-title"><Calendar size={20} color="#0d9488" /> List of Holidays</h2>
              <button className="btn-ghost" style={{ fontSize: '12px' }}>View All</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {holidays.length > 0 ? holidays.map((holiday, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', alignItems: 'center', gap: '15px', padding: '14px', 
                  borderRadius: '16px', background: '#f0fdfa', border: '3px solid #cbd5e1',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ background: '#ffffff', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ccfbf1' }}>
                    <Calendar size={20} color="#0d9488" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#115e59' }}>{holiday.name || holiday.title}</div>
                    <div style={{ fontSize: '12px', color: '#5b7c7a' }}>{holiday.day || holiday.d?.toLocaleDateString('en-US', { weekday: 'long' }) || 'Holiday'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#0d9488' }}>{holiday.date || holiday.d?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>2026</div>
                  </div>
                </div>
              )) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', border: '1px dashed #e2e8f0', borderRadius: '16px' }}>
                  No upcoming holidays found
                </div>
              )}
            </div>
          </section>

          {/* Upcoming Birthdays Section */}
          <section className="dashboard-section animate-fade-in" style={{ animationDelay: '0.6s', cursor: 'pointer' }} onClick={() => navigate('/birthdays')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="section-title"><Gift size={20} color="#ec4899" /> Upcoming Birthdays</h2>
              <button className="btn-ghost" style={{ fontSize: '12px' }}>View All</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingBirthdays.length > 0 ? upcomingBirthdays.map((bday, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', alignItems: 'center', gap: '15px', padding: '14px', 
                  borderRadius: '16px', background: '#ffffff', border: '3px solid #cbd5e1',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ background: '#fdf2f8', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Cake size={20} color="#ec4899" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{bday.name || bday.employee_name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>{bday.role || bday.designation || 'Member'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#ec4899' }}>
                      {bday.displayDate}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800' }}>WISH</div>
                  </div>
                </div>
              )) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', border: '1px dashed #e2e8f0', borderRadius: '16px' }}>
                  No upcoming birthdays found
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <AppFooter />
      <TaskNotification onOpenTask={() => navigate('/performance')} />
      
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="animate-slide-up" style={{ background: '#ffffff', borderRadius: '30px', padding: '40px', width: '90%', maxWidth: '420px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <button 
              onClick={() => setShowAddModal(false)} 
              style={{ position: 'absolute', top: '20px', right: '20px', background: '#f8fafc', border: '1px solid #f1f5f9', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontSize: '14px', transition: '0.2s' }}
            >
              ✕
            </button>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '35px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                 <img src={logo} alt="Logo" style={{ width: '35px', height: 'auto', objectFit: 'contain' }} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#1e293b', marginBottom: '6px' }}>New Employee Alignment</h2>
              <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center' }}>Configure the unit for immediate deployment.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#1e293b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee Name</label>
                <input type="text" placeholder="e.g. Anish V N" style={{ width: '100%', padding: '16px 20px', borderRadius: '18px', border: '1px solid #e2e8f0', fontSize: '14px', fontWeight: '700', color: '#1e293b', outline: 'none', background: '#ffffff', transition: '0.2s' }} />
              </div>


              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#1e293b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Designation</label>
                <input type="text" placeholder="e.g. Lead Software Engineer" style={{ width: '100%', padding: '16px 20px', borderRadius: '18px', border: '1px solid #e2e8f0', fontSize: '14px', fontWeight: '700', color: '#1e293b', outline: 'none', background: '#ffffff', transition: '0.2s' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '35px' }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '50px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: '800', fontSize: '14px', cursor: 'pointer', transition: '0.2s' }}>Cancel</button>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '50px', border: 'none', background: '#a7d6da', color: '#0f172a', fontWeight: '800', fontSize: '14px', cursor: 'pointer', transition: '0.2s' }}>Confirm Enrollment</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .btn-primary:active {
          transform: scale(0.98);
        }
        input:focus {
          border-color: #a7d6da !important;
          box-shadow: 0 0 0 3px rgba(167, 214, 218, 0.2) !important;
        }
      `}</style>
    </div>
  );
}
