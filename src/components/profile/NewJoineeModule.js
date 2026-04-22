import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight, FileText, Video, Calendar, User, Mail, Briefcase } from 'lucide-react';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, BASE_URL } from '../../config';
import './Dashboard.css';

export default function NewJoineeModule() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [joinees, setJoinees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email_id: '',
    role: '',
    joining_date: ''
  });
  const [saving, setSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [toastType, setToastType] = useState('success'); 
  const [leads, setLeads] = useState([]);

  // Course Modal state
  const [courses, setCourses] = useState([]);
  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [selectedJoinee, setSelectedJoinee] = useState(null);
  const [coursesLoading, setCoursesLoading] = useState(false);



  const [viewBlocked, setViewBlocked] = useState(false);
  const [unblocking, setUnblocking] = useState(false);

  useEffect(() => {
    if (window.location.hash === '#blocked') {
      setViewBlocked(true);
    }
    fetchJoinees();
  }, [user]);

  const fetchJoinees = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.NEW_JOINEES, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setJoinees(data || []);
      }
    } catch (err) {
      console.error('Joinee fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.EMPLOYEES, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter for "Lead" roles specifically
        const teamLeads = (data || []).filter(emp => 
          emp.role?.toUpperCase().includes('LEAD') || 
          emp.role?.toUpperCase().includes('MANAGER')
        );
        setLeads(teamLeads);
      }
    } catch (err) {
      console.error('Leads fetch error:', err);
    }
  };

  useEffect(() => {
    if (user?.token) fetchLeads();
  }, [user]);

  const handleCardClick = async (joinee) => {
    setSelectedJoinee(joinee);
    setShowCoursesModal(true);
    setCoursesLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.NEWJOINEE_COURSES, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const allCourses = Array.isArray(data) ? data : (data.active || []);
        const applicableCourses = allCourses.filter(c => 
          c.assigned_to === 'All Employees' || 
          c.assigned_to === joinee.name || 
          c.joinee_name === joinee.name
        );
        setCourses(applicableCourses.length > 0 ? applicableCourses : allCourses);
      }
    } catch (err) {
      console.error('Fetch courses error:', err);
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddJoinee = async (e) => {
    e.preventDefault();
    if (!user?.token || !formData.name || !formData.email_id || !formData.role || !formData.joining_date) return;

    console.log('DEBUG: ENROLLING JOINEE ->', { ...formData });

    setSaving(true);

    const payload = {
      // USER REQUESTED FORMAT (Priority)
      name: formData.name,
      role: formData.role,
      emailId: formData.email_id,
      joiningDate: formData.joining_date,
      courseCompletion: 0,
      
      // DATABASE COMPATIBILITY SHOTGUN
      email_id: formData.email_id,
      email: formData.email_id,
      emailid: formData.email_id,
      member_email: formData.email_id,
      email_address: formData.email_id,
      id_email: formData.email_id,
      user_email: formData.email_id,
      memberEmail: formData.email_id,
      
      // LOGISTIC FIELDS
      date: formData.joining_date,
      progress: 0,
      status: 'Active',
      color: ['#312e81', '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b'][Math.floor(Math.random() * 5)],
      hired_by: user?.role || 'Unknown'
    };

    console.log('DEBUG: EXHAUSTIVE ENROLLMENT PAYLOAD:');
    console.table(payload);

    try {
      const response = await fetch(API_ENDPOINTS.NEW_JOINEES, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('DEBUG: SERVER RESPONSE STATUS:', response.status);

      if (response.ok) {
        setToastMessage('New Joinee Successfully Enrolled! 🎉');
        setToastType('success');
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        
        setShowAddModal(false);
        setFormData({ name: '', email_id: '', role: '', joining_date: '' });
        fetchJoinees();
      } else {
        setToastMessage('Failed to enroll new joinee. Error Code: 500');
        setToastType('error');
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      }
    } catch (err) {
      console.error('Enrollment error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async (joinee) => {
    if (!user?.token) return;
    
    setUnblocking(true);
    try {
      // User specified endpoint: PUT /api/new-joinees/:id/unblock
      const response = await fetch(`${API_ENDPOINTS.NEW_JOINEES}/${joinee.id || joinee.employee_id || joinee._id}/unblock`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_blocked: 0 })
      });

      if (response.ok) {
        setToastMessage(`Successfully unblocked ${joinee.name}! 🎉`);
        setToastType('success');
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        fetchJoinees();
      } else {
        // Fallback to alternative endpoint if ID-based PUT fails
        const fallbackResponse = await fetch(`${API_ENDPOINTS.NEW_JOINEES}/unblock`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: joinee.id || joinee.employee_id || joinee._id })
        });
        
        if (fallbackResponse.ok) {
          setToastMessage(`Successfully unblocked ${joinee.name}! 🎉`);
          setToastType('success');
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 3000);
          fetchJoinees();
        } else {
          setToastMessage('Failed to unblock. Please contact system admin.');
          setToastType('error');
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 3000);
        }
      }
    } catch (err) {
      console.error('Unblock error:', err);
    } finally {
      setUnblocking(false);
    }
  };

  const filteredJoinees = joinees.filter(j => {
    const matchesSearch = j.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         j.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Column logic: is_blocked == 1 means blocked
    const isBlocked = Number(j.is_blocked) === 1;
    
    if (viewBlocked) return matchesSearch && isBlocked;
    return matchesSearch && !isBlocked;
  });

  return (
    <div className="hr-dashboard-container">
      <AppHeader />
      
      {!showCoursesModal && (
        <main className="dashboard-content" style={{paddingBottom: '120px'}}>
          <header className="section-header">
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>

            <div>
              <h1 style={{fontSize: '26px', fontWeight: '800', color: '#1e293b'}}>New Joinee Onboarding</h1>
              <p style={{color: '#64748b'}}>Monitor and welcome our newest team members • Cycle Q1</p>
            </div>
          </div>
          <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
             {/* Blocked Toggle Tabs */}
             <div style={{
               background: '#f1f5f9', padding: '4px', borderRadius: '14px', 
               display: 'flex', gap: '4px', border: '1px solid #e2e8f0', marginRight: '8px'
             }}>
                <button 
                  onClick={() => setViewBlocked(false)}
                  style={{
                    padding: '8px 16px', borderRadius: '10px', border: 'none',
                    background: !viewBlocked ? 'white' : 'transparent',
                    color: !viewBlocked ? '#1e293b' : '#64748b',
                    fontWeight: '800', fontSize: '13px', cursor: 'pointer',
                    boxShadow: !viewBlocked ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                    transition: '0.2s'
                  }}
                >
                  Active Hires
                </button>
                <button 
                  onClick={() => setViewBlocked(true)}
                  style={{
                    padding: '8px 16px', borderRadius: '10px', border: 'none',
                    background: viewBlocked ? '#ef4444' : 'transparent',
                    color: viewBlocked ? 'white' : '#64748b',
                    fontWeight: '800', fontSize: '13px', cursor: 'pointer',
                    boxShadow: viewBlocked ? '0 2px 4px rgba(239, 68, 64, 0.2)' : 'none',
                    transition: '0.2s', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  Blocked {joinees.filter(j => Number(j.is_blocked) === 1).length > 0 && 
                    <span style={{background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: '6px', fontSize: '10px'}}>{joinees.filter(j => Number(j.is_blocked) === 1).length}</span>
                  }
                </button>
             </div>
             <div style={{ position: 'relative' }}>
                <button className="btn-primary" onClick={() => setShowAddDropdown(!showAddDropdown)}>+ Add member</button>
                {showAddDropdown && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                    background: 'white', borderRadius: '14px', boxShadow: '0 15px 30px rgba(0,0,0,0.15)',
                    padding: '8px', zIndex: 1000, minWidth: '200px', border: '1px solid #e2e8f0',
                    display: 'flex', flexDirection: 'column', gap: '4px'
                  }}>
                    <button 
                      onClick={() => { setShowAddModal(true); setShowAddDropdown(false); setFormData(prev => ({...prev, role: ''})); }}
                      style={{ 
                        width: '100%', padding: '12px 16px', textAlign: 'left', border: 'none', 
                        background: 'transparent', cursor: 'pointer', borderRadius: '10px', 
                        fontWeight: '700', color: '#1e293b', fontSize: '14px', transition: '0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      👤 Add new employee
                    </button>
                    <button 
                      onClick={() => { setShowAddModal(true); setShowAddDropdown(false); setFormData(prev => ({...prev, role: 'Intern'})); }}
                      style={{ 
                        width: '100%', padding: '12px 16px', textAlign: 'left', border: 'none', 
                        background: 'transparent', cursor: 'pointer', borderRadius: '10px', 
                        fontWeight: '700', color: '#1e293b', fontSize: '14px', transition: '0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      🎓 Add new Intern
                    </button>
                  </div>
                )}
             </div>
          </div>
        </header>

        {/* Search Bar */}
        <div style={{marginBottom: '32px', display: 'flex', gap: '16px', flexWrap: 'wrap'}}>
           <div style={{flex: '1 1 300px', position: 'relative'}}>
              <span style={{position: 'absolute', left: '16px', top: '14px', fontSize: '18px'}}>🔍</span>
              <input 
                type="text" 
                placeholder="Search candidates/new hires..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px', 
                  border: '1px solid #e2e8f0', background: 'white', outline: 'none',
                  fontSize: '15px', boxSizing: 'border-box', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}
              />
           </div>
        </div>

        {/* Joinees Grid */}
        <div className="responsive-card-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: '20px'}}>
          {loading ? (
            <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#64748b'}}>
              <div className="animate-pulse">Fetching latest hire signals...</div>
            </div>
          ) : filteredJoinees.length > 0 ? (
            filteredJoinees.map((joinee, i) => (
              <div key={i} className="team-card animate-fade-in" 
                   onClick={() => handleCardClick(joinee)}
                   style={{background: 'white', padding: '24px', position: 'relative', overflow: 'hidden', border: '1px solid #eef2f6', animationDelay: `${i * 0.1}s`, cursor: 'pointer'}}>
                 <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px'}}>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '18px', background: `${joinee.color || '#3863a8'}15`, color: joinee.color || '#3863a8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '900'
                    }}>
                      {joinee.name.charAt(0)}
                    </div>
                    <div>
                       <h3 style={{fontSize: '17px', fontWeight: '800', color: '#1e293b'}}>{joinee.name}</h3>
                       <div style={{fontSize: '13px', fontWeight: '700', color: '#64748b'}}>{joinee.role}</div>
                       <div style={{fontSize: '11px', fontWeight: '600', color: '#3863a8', marginTop: '2px'}}>{joinee.email_id || joinee.email || 'No Email'}</div>
                    </div>
                    <div style={{marginLeft: 'auto', fontSize: '18px'}}>✨</div>
                 </div>

                 <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px'}}>
                       <span style={{color: '#94a3b8', fontWeight: '600'}}>Joining Date</span>
                       <span style={{color: '#1e293b', fontWeight: '700', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px'}}>
                         { (joinee.joining_date || joinee.date || joinee.joiningDate) ? 
                           new Date(joinee.joining_date || joinee.date || joinee.joiningDate).toLocaleDateString() : 'N/A' }
                       </span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px'}}>
                       <span style={{color: '#94a3b8', fontWeight: '600'}}>Hired By</span>
                       <span style={{color: '#1e293b', fontWeight: '700', background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                         {joinee.hired_by || 'System'}
                       </span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px'}}>
                       <span style={{color: '#94a3b8', fontWeight: '600'}}>Course Completion</span>
                       <span style={{color: '#3863a8', fontWeight: '800'}}>{joinee.progress || 0}% Completed</span>
                    </div>
                 </div>

                 {/* Course Completion Progress Bar */}
                 <div style={{height: '10px', background: '#f1f5f9', borderRadius: '50px', position: 'relative', overflow: 'hidden', marginBottom: '16px'}}>
                    <div style={{
                      height: '100%', width: `${joinee.progress || 0}%`, background: joinee.color || '#3863a8', borderRadius: '50px',
                      transition: 'width 1s ease-in-out'
                    }}></div>
                 </div>

                 {/* SELECT TEAM LEAD SECTION */}
                 <div style={{marginBottom: '10px', marginTop: '4px'}} onClick={(e) => e.stopPropagation()}>
                    <div style={{marginBottom: '8px', fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginLeft: '2px'}}>
                       Select Team Lead
                    </div>
                    <div style={{display: 'flex', gap: '10px', width: '100%', boxSizing: 'border-box'}}>
                       <div style={{flex: 1, position: 'relative'}}>
                          <select 
                            style={{
                              width: '100%', padding: '10px 14px', borderRadius: '12px', 
                              border: '1.5px solid #eef2f6', background: '#f8fafc', color: '#1e293b', 
                              fontWeight: '700', fontSize: '12px', cursor: 'pointer', appearance: 'none',
                              outline: 'none', boxSizing: 'border-box'
                            }}
                          >
                             <option>Choose a Lead...</option>
                             {leads.map((lead, i) => (
                               <option key={i} value={lead.id || lead.employee_id}>
                                 {lead.name} ({lead.role})
                               </option>
                             ))}
                          </select>
                          <div style={{position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b', fontSize: '10px'}}>▼</div>
                       </div>
                       <button style={{width: '42px', height: '42px', borderRadius: '12px', border: 'none', background: '#3863a8', color: 'white', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(56,99,168,0.2)'}}>
                          →
                       </button>
                    </div>
                 </div>

                 {/* UNBLOCK ACTION FOR BLOCKED USERS */}
                 {Number(joinee.is_blocked) === 1 && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleUnblock(joinee); }}
                     disabled={unblocking}
                     style={{
                       width: '100%', padding: '12px', border: 'none', borderRadius: '12px',
                       background: '#10b981', color: 'white', fontWeight: '800', fontSize: '14px',
                       cursor: 'pointer', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)',
                       transition: '0.2s', marginTop: '10px'
                     }}
                   >
                     {unblocking ? 'Processing...' : '🔓 Unblock Employee'}
                   </button>
                 )}

              </div>
            ))
          ) : (
            <div style={{ 
              padding: '60px', background: '#f8fafc', borderRadius: '24px', 
              border: '2px dashed #cbd5e1', textAlign: 'center', display: 'flex', 
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: 0.8,
              gridColumn: '1 / -1'
            }}>
               <div style={{ fontSize: '32px' }}>➕</div>
               <div style={{ fontSize: '14px', fontWeight: '800', color: '#475569' }}>Awaiting Signals</div>
               <div style={{ fontSize: '11px', color: '#94a3b8' }}>Pipeline ready for next hire</div>
            </div>
          )}
        </div>
      </main>
      )}
      
      <AnimatePresence>
        {showAddModal && (
          <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
          }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{
                background: 'white', padding: '32px', borderRadius: '32px', 
                width: '90%', maxWidth: '460px', boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.3)',
                position: 'relative'
              }}
            >
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                  <div style={{ 
                    width: '72px', height: '72px', borderRadius: '24px', 
                    background: '#f8fafc', border: '1.5px solid #eef2f6', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', marginBottom: '24px', boxShadow: '0 10px 20px rgba(0,0,0,0.03)'
                  }}>
                    <Sparkles size={36} color="#f59e0b" fill="#f59e0b" />
                  </div>
                  <h2 style={{ fontSize: '30px', fontWeight: '900', color: '#0B1E3F', margin: '0 0 10px 0', textAlign: 'center', letterSpacing: '-0.5px' }}>
                    {formData.role === 'Intern' ? 'Enroll new Intern' : 'Enroll new employee'}
                  </h2>
                  <p style={{ fontSize: '15px', color: '#64748b', margin: 0, fontWeight: '700', textAlign: 'center' }}>Add candidate details to start onboarding</p>
               </div>

               <form onSubmit={handleAddJoinee} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                     <label style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', letterSpacing: '0.3px' }}>Full Name</label>
                     <input 
                        type="text" name="name" value={formData.name} onChange={handleInputChange} 
                        placeholder="e.g. Aditi Sharma" required 
                        style={{ padding: '14px 20px', borderRadius: '18px', border: '2px solid #e2e8f0', background: '#f8fafc', fontWeight: '800', fontSize: '15px', outline: 'none', transition: 'all 0.2s', color: '#0B1E3F' }} 
                     />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                     <label style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', letterSpacing: '0.3px' }}>Email Address</label>
                     <input 
                        type="email" name="email_id" value={formData.email_id} onChange={handleInputChange} 
                        placeholder="e.g. aditi@example.com" required 
                        style={{ padding: '14px 20px', borderRadius: '18px', border: '2px solid #e2e8f0', background: '#f8fafc', fontWeight: '800', fontSize: '15px', outline: 'none', color: '#0B1E3F' }} 
                     />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                     <label style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', letterSpacing: '0.3px' }}>Designation</label>
                     <input 
                        type="text" name="role" value={formData.role} onChange={handleInputChange} 
                        placeholder={formData.role === 'Intern' ? 'Intern' : 'e.g. Software Engineer'} required 
                        style={{ padding: '14px 20px', borderRadius: '18px', border: '2px solid #e2e8f0', background: '#f8fafc', fontWeight: '800', fontSize: '15px', outline: 'none', color: '#0B1E3F' }} 
                     />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                     <label style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', letterSpacing: '0.3px' }}>Joining Date</label>
                     <div style={{ position: 'relative' }}>
                        <input 
                          type="date" name="joining_date" value={formData.joining_date} onChange={handleInputChange} 
                          required 
                          style={{ width: '100%', padding: '14px 20px', borderRadius: '18px', border: '2px solid #e2e8f0', background: '#f8fafc', fontWeight: '800', fontSize: '15px', outline: 'none', boxSizing: 'border-box', color: '#0B1E3F' }} 
                        />
                     </div>
                  </div>

                  <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
                     <button 
                        type="button" 
                        onClick={() => setShowAddModal(false)}
                        style={{ flex: 1, padding: '18px', background: 'white', color: '#64748b', border: '2px solid #e2e8f0', borderRadius: '20px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s' }}
                     >
                        Cancel
                     </button>
                     <button 
                        type="submit" 
                        disabled={saving}
                        style={{ flex: 1.6, padding: '18px', background: '#315A9E', color: 'white', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '0 12px 30px -5px rgba(49, 90, 158, 0.45)', transition: 'all 0.2s' }}
                     >
                        {saving ? 'Registering...' : 'Confirm Enrollment'}
                     </button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Courses Fullscreen View */}
      {showCoursesModal && (
        <main className="dashboard-content animate-fade-in" style={{
          paddingBottom: '120px', display: 'flex', flexDirection: 'column', minHeight: '80vh'
        }}>
          {/* Header */}
          <div style={{
            padding: '0 0 24px', borderBottom: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'
          }}>
            <div>
              <h1 style={{fontSize: '28px', fontWeight: '900', color: '#1e293b', margin: 0, marginBottom: '4px'}}>Course Modules</h1>
              <p style={{color: '#64748b', fontSize: '15px', marginTop: '4px', margin: 0}}>Assigned to <span style={{fontWeight: '800', color: '#3863a8'}}>{selectedJoinee?.name}</span></p>
            </div>
            <button onClick={() => setShowCoursesModal(false)} className="btn-outline" style={{
               padding: '10px 20px', borderRadius: '12px', fontWeight: '800', fontSize: '14px', 
               display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
               background: 'white', border: '1px solid #e2e8f0', color: '#1e293b'
            }}>
               ← Back to Dashboard
            </button>
          </div>

          <div style={{padding: '40px', maxWidth: '100%', margin: '0 auto', width: '100%', flex: 1, boxSizing: 'border-box'}}>
            {coursesLoading ? (
              <div style={{padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '16px'}} className="animate-pulse">Loading assigned courses...</div>
            ) : courses.length > 0 ? (
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px'}}>
                {courses.map((course, idx) => (
                  <div key={idx} className="team-card animate-fade-in" style={{
                    padding: '24px', border: '1px solid #eef2f6', borderRadius: '20px', background: '#f8fafc',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column',
                    animationDelay: `${idx * 0.1}s`
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px'}}>
                       <span style={{
                         fontSize: '11px', fontWeight: '800', padding: '6px 12px', borderRadius: '12px',
                         background: course.category === 'Policy' ? '#fee2e2' : '#e0e7ff',
                         color: course.category === 'Policy' ? '#ef4444' : '#3863a8',
                         textTransform: 'uppercase', letterSpacing: '0.5px'
                       }}>{course.category || 'General'}</span>
                       {course.deadline && (
                         <span style={{fontSize: '11px', color: '#64748b', fontWeight: '700', padding: '6px 0', display: 'flex', alignItems: 'center', gap: '4px'}}>
                           🗓️ Deadline: {new Date(course.deadline).toLocaleDateString()}
                         </span>
                       )}
                    </div>
                    <h3 style={{fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '10px', lineHeight: '1.3', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap'}}>
                      {course.title}
                      {String(course.completed) === '1' || course.completed === true ? 
                        <span style={{fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase'}}>Completed</span> : 
                        <span style={{fontSize: '11px', background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase'}}>Pending</span>
                      }
                    </h3>
                    <p style={{fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5', flex: 1}}>{course.description || 'No description provided.'}</p>
                    <div style={{display: 'flex', gap: '12px', marginTop: 'auto'}}>
                       {course.pdf_url && (
                          <a href={course.pdf_url.startsWith('http') ? course.pdf_url : `${BASE_URL}${course.pdf_url}`} target="_blank" rel="noopener noreferrer" style={{
                            flex: 1, padding: '12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                            textAlign: 'center', fontSize: '14px', fontWeight: '800', color: '#3863a8', textDecoration: 'none', transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                          }}>📄 View PDF</a>
                       )}
                       {course.video_url && (
                          <a href={course.video_url.startsWith('http') ? course.video_url : `${BASE_URL}${course.video_url}`} target="_blank" rel="noopener noreferrer" style={{
                            flex: 1, padding: '12px', background: '#eef2f6', border: '1px solid #cbd5e1', borderRadius: '12px',
                            textAlign: 'center', fontSize: '14px', fontWeight: '800', color: '#1e293b', textDecoration: 'none', transition: '0.2s'
                          }}>🎥 Watch Video</a>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{padding: '80px', textAlign: 'center', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #cbd5e1', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'}}>
                <div style={{fontSize: '40px'}}>📬</div>
                <div style={{fontSize: '18px', fontWeight: '800', color: '#475569'}}>No Courses Assigned</div>
                <p>This joinee currently has no pending course modules.</p>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div style={{
          position: 'fixed', top: '40px', left: '50%', transform: 'translateX(-50%)',
          background: toastType === 'success' ? '#312e81' : '#be123c', color: 'white',
          padding: '16px 32px', borderRadius: '16px', fontWeight: '800', fontSize: '15px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', zIndex: 3000,
          display: 'flex', alignItems: 'center', gap: '12px', animation: 'slideInTop 0.5s ease-out'
        }}>
           <span>{toastType === 'success' ? '🚀' : '⚠️'}</span>
           {toastMessage}
        </div>
      )}

      <AppFooter />
    </div>
  );
}
