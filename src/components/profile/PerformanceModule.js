import React, { useState, useRef, useEffect } from 'react';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { useThread } from '../../context/ThreadContext';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, BASE_URL } from '../../config';
import './Dashboard.css';
import {
  Building2, Mail, User, Phone, Check, X,
  ChevronRight, Calendar, Shield, LogOut,
  History, Users, FileText, Briefcase, Heart, Edit3, Fingerprint, Camera,
  MessageSquare, Trash2, Clock, MapPin, Info, LifeBuoy
} from 'lucide-react';
import UpdatePasswordModal from './UpdatePasswordModal';

export default function PerformanceModule() {
  const { user, logout } = useAuth();
  const { fetchUserThreads, toggleReaction, deleteThread } = useThread();
  const navigate = useNavigate();

  const [winWidth, setWinWidth] = useState(window.innerWidth);
  const [phone, setPhone] = useState(user?.phone_number || 'Add Phone Number');
  const [aboutMe, setAboutMe] = useState(user?.about_me || 'Write a short introduction about yourself');
  const [dob, setDob] = useState(user?.date_of_birth || 'Add Date of Birth');
  const [profileImage, setProfileImage] = useState(user?.profile_picture || null);
  const [reportingManager, setReportingManager] = useState({ name: 'Anish V N', id: '' });
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingDob, setIsEditingDob] = useState(false);
  const [tempPhone, setTempPhone] = useState('');
  const [tempDob, setTempDob] = useState('');
  const [profileData, setProfileData] = useState({ name: '', employee_id: '', designation: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    const loadProfile = async () => {
      if (!user?.email || !user?.token) return;
      try {
        const res = await fetch(`${API_ENDPOINTS.PROFILE}/${user.email}`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setPhone(data.phone_number || 'Add Phone Number');
          setAboutMe(data.about_me || 'Write a short introduction about yourself');
          setDob(data.date_of_birth || 'Add Date of Birth');
          setProfileData({
            name: data.name || user?.name || 'Employee',
            employee_id: data.employee_id || user?.employee_id || '—',
            designation: data.designation || user?.designation || 'Lead Software Engineer'
          });
          setReportingManager({ name: data.reportingManagerName || 'Anish V N', id: data.reportingManagerId });
        }
      } catch (err) { console.error('Profile fetch error:', err); }
    };

    const loadManager = async () => {
      if (!user?.token) return;
      try {
        const res = await fetch(API_ENDPOINTS.PROFILE_MANAGER, {
          headers: { 'Authorization': `Bearer ${user?.token}` }
        });
        const data = await res.json();
        if (res.ok) setReportingManager({ name: data.name || 'Anish V N', id: data.id });
      } catch (err) { console.error('Manager fetch error:', err); }
    };

    loadProfile();
    loadManager();
    return () => window.removeEventListener('resize', handleResize);
  }, [user]);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfileImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const updateProfileField = async (field, value) => {
    if (!user?.token) return;
    try {
        const payload = { [field]: value };
        const res = await fetch(API_ENDPOINTS.PROFILE_UPDATE, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({ email: user.email, ...payload })
        });
        if (res.ok) {
            if (field === 'phone_number') { setPhone(value); setIsEditingPhone(false); }
            if (field === 'date_of_birth') { setDob(value); setIsEditingDob(false); }
        }
    } catch (err) { console.error('Update profile error:', err); }
  };

  const dashboardStyles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      paddingTop: winWidth < 768 ? '80px' : '100px',
      paddingBottom: '100px',
      fontFamily: "'Outfit', sans-serif"
    },
    banner: {
      height: winWidth < 768 ? '120px' : '180px',
      background: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: winWidth < 768 ? '20px' : '32px',
      fontWeight: '900',
      letterSpacing: '-0.5px',
      textAlign: 'center',
      padding: '0 20px'
    },
    profileCard: {
      width: '100%',
      maxWidth: '100%',
      margin: winWidth < 768 ? '-40px 0 20px' : '-60px 0 30px',
      background: 'white',
      borderRadius: winWidth < 768 ? '24px' : '40px',
      padding: winWidth < 768 ? '25px' : '40px',
      boxShadow: '0 4px 30px rgba(0,0,0,0.03)',
      position: 'relative',
      zIndex: 10
    },
    avatar: {
      width: winWidth < 768 ? '100px' : '130px',
      height: winWidth < 768 ? '100px' : '130px',
      borderRadius: winWidth < 768 ? '22px' : '30px',
      background: '#e2e8f0',
      border: winWidth < 768 ? '4px solid white' : '6px solid white',
      boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: winWidth < 768 ? '36px' : '48px',
      fontWeight: '950',
      color: '#0f172a',
      position: 'relative'
    },
    statBox: {
      background: 'white',
      borderRadius: '24px',
      padding: '24px',
      border: '1px solid #f1f5f9',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
    },
    serviceCard: {
      borderRadius: '24px',
      padding: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      transition: '0.2s transform'
    },
    docCard: {
      background: 'white',
      borderRadius: '24px',
      padding: '24px',
      border: '1px solid #f1f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
    }
  };

  return (
    <div style={dashboardStyles.container}>
      <AppHeader />

      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />

      {/* Banner */}
      <div style={dashboardStyles.banner}>
        Smarter Solutions for Better Future
      </div>

      <main style={{ padding: '0 10px' }}>

        {/* Profile Header Card */}
        <div style={dashboardStyles.profileCard}>
          <div style={{ display: 'flex', flexDirection: winWidth < 1024 ? 'column' : 'row', justifyContent: 'space-between', alignItems: winWidth < 1024 ? 'center' : 'flex-start', gap: winWidth < 1024 ? '30px' : '0', textAlign: winWidth < 1024 ? 'center' : 'left' }}>
            <div style={{ display: 'flex', flexDirection: winWidth < 600 ? 'column' : 'row', gap: '24px', alignItems: 'center' }}>
              <div style={dashboardStyles.avatar}>
                {profileImage ? <img src={profileImage} alt="Me" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: winWidth < 768 ? '18px' : '24px' }} /> : user?.name?.[0] || 'U'}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: winWidth < 768 ? '32px' : '36px', height: winWidth < 768 ? '32px' : '36px', background: 'white', border: '1px solid #f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                >
                  <Camera size={winWidth < 768 ? 16 : 18} color="#0f172a" />
                </button>
              </div>
              <div>
                <div style={{ display: 'flex', flexDirection: winWidth < 480 ? 'column' : 'row', alignItems: 'center', gap: '12px' }}>
                  <h1 style={{ fontSize: winWidth < 768 ? '22px' : '28px', fontWeight: '950', color: '#0f172a', margin: 0 }}>{user?.name || 'Sahana Nv'}</h1>
                  <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Fingerprint size={12} /> ID: {user?.employee_id || '202516'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: winWidth < 768 ? 'column' : 'row', alignItems: winWidth < 768 ? 'center' : 'flex-start', gap: winWidth < 768 ? '12px' : '40px', marginTop: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', fontSize: winWidth < 768 ? '12px' : '13px', fontWeight: '950', textTransform: 'uppercase' }}>
                    <Briefcase size={16} /> {profileData.designation}
                  </div>
                  
                  {/* Phone Editable */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: winWidth < 768 ? '12px' : '13px', fontWeight: '800' }}>
                    <Phone size={16} /> 
                    {isEditingPhone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input 
                                value={tempPhone} 
                                onChange={e => setTempPhone(e.target.value)}
                                onBlur={() => updateProfileField('phone_number', tempPhone)}
                                onKeyDown={e => e.key === 'Enter' && updateProfileField('phone_number', tempPhone)}
                                autoFocus
                                style={{ border: '1px solid #3b82f6', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', outline: 'none' }}
                            />
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => { setTempPhone(phone === 'Add Phone Number' ? '' : phone); setIsEditingPhone(true); }}>
                            <span>{phone}</span>
                            <Edit3 size={14} color="#94a3b8" />
                        </div>
                    )}
                  </div>

                  {/* DOB Editable */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: winWidth < 768 ? '12px' : '13px', fontWeight: '800' }}>
                    <Calendar size={16} /> 
                    {isEditingDob ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input 
                                type="date"
                                value={tempDob} 
                                onChange={e => setTempDob(e.target.value)}
                                onBlur={() => updateProfileField('date_of_birth', tempDob)}
                                onKeyDown={e => e.key === 'Enter' && updateProfileField('date_of_birth', tempDob)}
                                autoFocus
                                style={{ border: '1px solid #3b82f6', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', outline: 'none' }}
                            />
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => { setTempDob(dob === 'Add Date of Birth' ? '' : dob); setIsEditingDob(true); }}>
                            <span>{dob}</span>
                            <Edit3 size={14} color="#94a3b8" />
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px 20px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1e40af', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>
                {reportingManager.name?.[0]}
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reporting Manager</p>
                <p style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '900' }}>{reportingManager.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Stats Row */}
        <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto 40px', display: 'grid', gridTemplateColumns: winWidth < 1024 ? (winWidth < 600 ? '1fr' : '1fr 1fr') : 'repeat(3, 1fr)', gap: '24px' }}>
          <div style={dashboardStyles.statBox}>
            <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: '#f0f9ff', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={20} /></div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Team</p>
              <p style={{ margin: 0, fontSize: winWidth < 768 ? '14px' : '16px', color: '#0f172a', fontWeight: '900' }}>Navabharatha Team</p>
            </div>
          </div>
          <div style={dashboardStyles.statBox}>
            <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: '#f0f9ff', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mail size={20} /></div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</p>
              <p style={{ margin: 0, fontSize: winWidth < 768 ? '14px' : '16px', color: '#0f172a', fontWeight: '900', wordBreak: 'break-all' }}>{user?.email || 'sahana@navabharathtechnologies.com'}</p>
            </div>
          </div>
          <div style={{ ...dashboardStyles.statBox, gridColumn: winWidth < 1024 && winWidth >= 600 ? 'span 2' : 'auto' }}>
            <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: '#f0f9ff', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={20} /></div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date of Joining</p>
              <p style={{ margin: 0, fontSize: winWidth < 768 ? '14px' : '16px', color: '#0f172a', fontWeight: '900' }}>16 January 2026</p>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto 40px' }}>
          <h3 style={{ fontSize: winWidth < 768 ? '18px' : '22px', fontWeight: '950', color: '#0f172a', marginBottom: '24px' }}>Services & Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: winWidth < 768 ? '1fr' : '1fr 1fr', gap: '24px' }}>
            {[
              { title: 'Manage Leave', sub: 'Request or track off-time', color: '#fee2e2', text: '#b91c1c', icon: <Calendar color="#ef4444" size={20} />, path: '/attendance' },
              { title: 'Attendance Logs', sub: 'Review check-in history', color: '#dcfce7', text: '#15803d', icon: <Clock color="#22c55e" size={20} />, path: '/attendance' },
              { title: 'Security Settings', sub: 'Update security passkey', color: '#dbeafe', text: '#1e40af', icon: <Shield color="#3b82f6" size={20} />, onClick: () => setShowSecurityModal(true) },
              { title: 'Support & Maintenance', sub: 'Raise technical ticket', color: '#ffedd5', text: '#9a3412', icon: <LifeBuoy color="#f97316" size={20} />, path: '/tickets' }
            ].map((svc, i) => (
              <div key={i} onClick={svc.onClick || (() => navigate(svc.path))} style={{ ...dashboardStyles.serviceCard, background: svc.color }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {svc.icon}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: svc.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{svc.title}</p>
                    <p style={{ margin: 0, fontSize: winWidth < 768 ? '14px' : '16px', fontWeight: '900', color: '#0f172a' }}>{svc.sub}</p>
                  </div>
                </div>
                <ChevronRight size={winWidth < 768 ? 16 : 20} color={svc.text} />
              </div>
            ))}
          </div>
        </div>

        {/* Documents Section */}
        <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto 40px' }}>
          <h3 style={{ fontSize: winWidth < 768 ? '18px' : '22px', fontWeight: '950', color: '#0f172a', marginBottom: '24px' }}>HR Documents</h3>
          <div style={{ display: 'grid', gridTemplateColumns: winWidth < 1024 ? (winWidth < 600 ? '1fr' : '1fr 1fr') : 'repeat(3, 1fr)', gap: '24px' }}>
            <div style={{ ...dashboardStyles.docCard, cursor: 'pointer' }} onClick={() => navigate('/payslip')}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText color="#22c55e" /></div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payroll Record</p>
                  <p style={{ margin: 0, fontSize: winWidth < 768 ? '14px' : '16px', fontWeight: '900', color: '#0f172a' }}>Salary statement</p>
                </div>
              </div>
              <ChevronRight size={winWidth < 768 ? 16 : 20} color="#94a3b8" />
            </div>

            <div 
              style={{ ...dashboardStyles.docCard, background: '#69696cff', border: 'none', cursor: 'pointer' }}
              onClick={() => navigate(user?.role === 'hr' || user?.role === 'admin' ? '/admin/certificates' : '/service-certificates')}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(217, 212, 212, 0.91)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Fingerprint color="white" /></div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: 'rgba(251, 249, 249, 0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employment Verification</p>
                  <p style={{ margin: 0, fontSize: winWidth < 768 ? '14px' : '16px', fontWeight: '900', color: 'white' }}>View Service certificate requests</p>
                </div>
              </div>
              <ChevronRight size={winWidth < 768 ? 16 : 20} color="white" />
            </div>

            <div 
              style={{ ...dashboardStyles.docCard, gridColumn: winWidth < 1024 && winWidth >= 600 ? 'span 2' : 'auto', cursor: 'pointer' }}
              onClick={() => navigate(user?.role === 'hr' || user?.role === 'admin' ? '/admin/resignations' : '/resignations')}
            >
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LogOut color="#ef4444" size={26} /></div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resignation Letter</p>
                  <p style={{ margin: 0, fontSize: winWidth < 768 ? '14px' : '16px', fontWeight: '900', color: '#0f172a' }}>View Resignation Requests</p>
                </div>
              </div>
              <ChevronRight size={24} color="#94a3b8" />
            </div>
          </div>
        </div>

        {/* About Section */}
        <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto 40px', background: 'white', borderRadius: winWidth < 768 ? '24px' : '32px', padding: winWidth < 768 ? '25px' : '40px', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: winWidth < 768 ? '20px' : '40px' }}>
            <h3 style={{ fontSize: winWidth < 768 ? '18px' : '22px', fontWeight: '950', color: '#0f172a', margin: 0 }}>About Me</h3>
            <div style={{ width: '36px', height: '36px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit3 size={18} color="#0f172a" /></div>
          </div>
          <div style={{ textAlign: 'center', padding: winWidth < 768 ? '20px 0' : '40px 0' }}>
            <div style={{ width: '50px', height: '50px', background: '#f8fafc', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Edit3 size={24} color="#cbd5e1" /></div>
            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', fontWeight: '700' }}>Write a short introduction about yourself</p>
          </div>
        </div>

        {/* Logout */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '60px' }}>
          <button
            onClick={handleLogout}
            style={{ background: 'white', color: '#ef4444', border: '2px solid #ef4444', borderRadius: '16px', padding: winWidth < 768 ? '10px 40px' : '12px 60px', fontSize: winWidth < 768 ? '13px' : '15px', fontWeight: '950', cursor: 'pointer', width: winWidth < 480 ? '100%' : 'auto' }}
          >
            Logout Securely
          </button>
        </div>

      </main>

      <UpdatePasswordModal 
        isOpen={showSecurityModal} 
        onClose={() => setShowSecurityModal(false)} 
        userEmail={user?.email}
      />

      <AppFooter />
    </div>
  );
}
