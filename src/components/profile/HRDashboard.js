import React, { useState, useEffect } from 'react';
import logo from '../../assets/logo.png';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, TEAM_OFFICE_AUTH_TOKEN } from '../../config';
import { 
  Users, UserPlus, FileText, BarChart2, 
  MessageSquare, Briefcase, TrendingUp, AlertCircle,
  ChevronRight, ArrowRight, User, CheckSquare, Hourglass, Sparkles,
  Clock, Calendar, CheckCircle, Trophy, PartyPopper, Star, Package, ClipboardList
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
      // Fetch New Joinees
      const joineeRes = await fetch(API_ENDPOINTS.NEW_JOINEES, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (joineeRes.ok) {
        const data = await joineeRes.json();
        setJoineeCount(Array.isArray(data) ? data.length : 0);
      }

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
          setAttendanceStats(prev => ({ ...prev, present: uniquePresentToday }));
        }
      }

      // Fetch Leave Requests
      setLeavesLoading(true);
      const leavesRes = await fetch(API_ENDPOINTS.LEAVES_GET, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (leavesRes.ok) {
        const lData = await leavesRes.json();
        const lList = Array.isArray(lData) ? lData : (lData?.all || lData?.data || lData?.requests || []);
        setLeaveRequests(Array.isArray(lList) ? lList : []);
        
        // If attendance stats didn't have leave count, derive it
        if (attendanceStats.onLeave === 0) {
           const onLeave = lList.filter(r => String(r.status || '').toUpperCase().includes('APPROVED')).length;
           setAttendanceStats(prev => ({ ...prev, onLeave }));
        }
      }

      // Fetch Rewards History
      const rewardsRes = await fetch(API_ENDPOINTS.REWARDS_HISTORY, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (rewardsRes.ok) {
        const rData = await rewardsRes.json();
        setRewardsCount(Array.isArray(rData) ? rData.length : (rData?.data?.length || 0));
      }

      // Fetch Total Users
      const usersRes = await fetch(API_ENDPOINTS.USERS, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setEmployeesCount(Array.isArray(uData) ? uData.length : (uData?.data?.length || 0));
      }

      // Fetch Total Teams
      const teamsRes = await fetch(API_ENDPOINTS.TEAMS, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (teamsRes.ok) {
        const tData = await teamsRes.json();
        setTeamsCount(Array.isArray(tData) ? tData.length : (tData?.data?.length || 0));
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
      
      <main className="dashboard-content" style={{ padding: winWidth < 768 ? '15px' : '20px 40px', marginTop: winWidth < 768 ? '70px' : '85px' }}>
        <header className="section-header animate-fade-in" style={{ 
          marginBottom: winWidth < 768 ? '20px' : '40px', 
          flexDirection: winWidth < 640 ? 'column' : 'row', 
          alignItems: winWidth < 640 ? 'flex-start' : 'center', 
          gap: winWidth < 640 ? '15px' : '0',
          padding: winWidth < 768 ? '15px' : '20px',
          background: 'rgba(255, 255, 255, 0.4)',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <h1 style={{ fontSize: winWidth < 768 ? '24px' : '32px', fontWeight: '850', color: '#0f172a', marginBottom: '4px', letterSpacing: '-1px' }}>
                Titan Dashboard
              </h1>
              <p style={{ color: '#64748b', fontSize: winWidth < 768 ? '12px' : '14px', fontWeight: '500' }}>
                Strength and scale • 6 Active Teams
              </p>
            </div>
            <button
              onClick={() => navigate('/my-leaves')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: 'white',
                border: 'none',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.3s'
              }}
            >
              My Leaves
            </button>
          </div>

        </header>

        {/* Stats Grid */}
        <section className="stats-grid-container" style={{ position: 'relative', marginBottom: winWidth < 768 ? '25px' : '35px' }}>
          {winWidth < 768 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 5px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Quick Stats</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setCurrentStatIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentStatIndex === 0}
                  style={{ 
                    width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #e2e8f0', 
                    background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: 'pointer', opacity: currentStatIndex === 0 ? 0.3 : 1 
                  }}
                >
                  ←
                </button>
                <button 
                  onClick={() => setCurrentStatIndex(prev => Math.min(hrStats.length - 1, prev + 1))}
                  disabled={currentStatIndex === hrStats.length - 1}
                  style={{ 
                    width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #e2e8f0', 
                    background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: 'pointer', opacity: currentStatIndex === hrStats.length - 1 ? 0.3 : 1 
                  }}
                >
                  →
                </button>
              </div>
            </div>
          )}

          <div style={{ 
            display: winWidth < 768 ? 'flex' : 'grid', 
            gridTemplateColumns: winWidth < 480 ? '1fr' : (winWidth < 768 ? '1fr 1fr' : (winWidth < 1200 ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)')), 
            gap: winWidth < 768 ? '0' : '20px',
            overflow: winWidth < 768 ? 'hidden' : 'visible',
            width: '100%',
            padding: winWidth < 768 ? '10px 0' : '0' // Space for shadows
          }}>
            {winWidth < 768 ? (
              <div style={{ 
                display: 'flex', 
                gap: '15px',
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: `translateX(calc(-${currentStatIndex} * (100% + 15px)))`,
                width: '100%'
              }}>
                {hrStats.map((stat, i) => (
                  <div 
                    key={i} 
                    className="stat-card animate-fade-in" 
                    style={{ 
                      padding: '24px', 
                      cursor: stat.path ? 'pointer' : 'default',
                      borderRadius: '24px',
                      background: '#ffffff',
                      border: '1px solid #f1f5f9',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '160px',
                      flex: '0 0 100%',
                      boxSizing: 'border-box'
                    }}
                    onClick={() => stat.path && navigate(stat.path)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <div style={{ 
                        background: stat.iconBg, width: '44px', height: '44px', borderRadius: '14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                      }}>
                        {stat.icon}
                      </div>
                      <div className={`stat-badge ${stat.badgeClass}`} style={{ fontSize: '10px', fontWeight: '800' }}>{stat.badge}</div>
                    </div>
                    <div>
                      <div className="stat-label" style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', marginBottom: '6px' }}>{stat.label}</div>
                      <div className="stat-value" style={{ 
                        fontSize: (typeof stat.value === 'string' && isNaN(stat.value)) ? '22px' : '32px', 
                        fontWeight: '900', 
                        color: '#0f172a',
                        lineHeight: 1
                      }}>{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              hrStats.map((stat, i) => (
                <div 
                  key={i} 
                  className="stat-card animate-fade-in" 
                  style={{ 
                    padding: '24px', 
                    cursor: stat.path ? 'pointer' : 'default',
                    borderRadius: '24px',
                    background: '#ffffff',
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '160px'
                  }}
                  onClick={() => stat.path && navigate(stat.path)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ 
                      background: stat.iconBg, width: '44px', height: '44px', borderRadius: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {stat.icon}
                    </div>
                    <div className={`stat-badge ${stat.badgeClass}`} style={{ fontSize: '10px', fontWeight: '800' }}>{stat.badge}</div>
                  </div>
                  <div>
                    <div className="stat-label" style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>{stat.label}</div>
                    <div className="stat-value" style={{ 
                      fontSize: (typeof stat.value === 'string' && isNaN(stat.value)) ? '22px' : '32px', 
                      fontWeight: '900', 
                      color: '#0f172a',
                      lineHeight: 1
                    }}>{stat.value}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '20px' }}>
          {/* Leave/Attendance Management */}
          <section className="dashboard-section animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="section-title"><Calendar size={20} color="#3863a8" /> Leave/Attendance Management</h2>
              <button 
                className="btn-ghost" 
                style={{ fontSize: '14px', padding: '8px 12px' }}
                onClick={() => navigate('/attendance')}
              >
                View All
              </button>
            </div>

            {/* Attendance Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: winWidth < 480 ? '1fr' : 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
              <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '20px', border: '1px solid #dcfce7', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#15803d', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>Present</div>
                <div style={{ fontSize: '24px', fontWeight: '950', color: '#166534' }}>{attendanceStats.present}</div>
              </div>
              <div style={{ background: '#fffbeb', padding: '15px', borderRadius: '20px', border: '1px solid #fef3c7', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#b45309', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>On Leave</div>
                <div style={{ fontSize: '24px', fontWeight: '950', color: '#92400e' }}>{attendanceStats.onLeave}</div>
              </div>
              <div style={{ background: '#fef2f2', padding: '15px', borderRadius: '20px', border: '1px solid #fee2e2', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#b91c1c', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>Late</div>
                <div style={{ fontSize: '24px', fontWeight: '950', color: '#991b1b' }}>{attendanceStats.late}</div>
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
                    borderRadius: '16px', background: '#ffffff', border: '1px solid #f1f5f9',
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
                        {request.leave_type || 'Leave'} • {request.start_date}
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
                <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.5px' }}>Tech Trivia Champions 🏆</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px', maxWidth: '200px' }}>42 employees are currently competing for the top spot!</p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', marginLeft: '5px' }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #1e293b', background: '#3863a8', marginLeft: '-8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800' }}>
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#3863a8' }}>+39 more</span>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
               <div onClick={() => navigate('/awards')} style={{ background: '#f8fafc', padding: '15px', borderRadius: '15px', border: '1.5px solid #f1f5f9', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <PartyPopper size={18} color="#ef4444" />
                     <div style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b' }}>Upcoming Recognition</div>
                  </div>
               </div>
               <div onClick={() => navigate('/awards')} style={{ background: '#f8fafc', padding: '15px', borderRadius: '15px', border: '1.5px solid #f1f5f9', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <Star size={18} color="#f59e0b" />
                     <div style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b' }}>Total Badges</div>
                  </div>
               </div>
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
