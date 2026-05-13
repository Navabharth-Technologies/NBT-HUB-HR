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
  const { user, logout, updateUser } = useAuth();
  const { fetchUserThreads, toggleReaction, deleteThread } = useThread();
  const navigate = useNavigate();

  const [winWidth, setWinWidth] = useState(window.innerWidth);
  const [phone, setPhone] = useState(user?.phone_number || 'Add Phone Number');
  const [aboutMe, setAboutMe] = useState(user?.about_me || 'Write a short introduction about yourself');
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [tempAbout, setTempAbout] = useState('');
  const [saving, setSaving] = useState(false);
  const [dob, setDob] = useState(user?.date_of_birth || 'Add Date of Birth');
  const [profileImage, setProfileImage] = useState(user?.profile_picture || null);
  const [reportingManager, setReportingManager] = useState({ name: 'Loading...', id: '' });
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingDob, setIsEditingDob] = useState(false);
  const [tempPhone, setTempPhone] = useState('');
  const [tempDob, setTempDob] = useState('');
  const [profileData, setProfileData] = useState({ name: '', employee_id: '', designation: '' });
  const [toast, setToast] = useState({ show: false, message: '' });
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
          const fetchedPic = data.profile_pic || data.profile_picture;

          setPhone(data.phone_number || user.phone_number || localStorage.getItem(`phone_${user.email}`) || 'Add Phone Number');
          setAboutMe(data.about_me || user.about_me || 'Write a short introduction about yourself');
          setDob(data.date_of_birth || user.date_of_birth || localStorage.getItem(`dob_${user.email}`) || 'Add Date of Birth');

          if (fetchedPic) {
            const isFullUrl = fetchedPic.startsWith('http') || fetchedPic.startsWith('data:');
            const fullUrl = isFullUrl ? fetchedPic : `${BASE_URL}${fetchedPic.startsWith('/') ? '' : '/'}${fetchedPic}`;
            setProfileImage(fullUrl);
            // Sync with AuthContext to ensure persistence across all components (like AppHeader)
            updateUser({ profile_pic: fetchedPic, profile_picture: fetchedPic });
          }

          setProfileData({
            name: data.name || user?.name || 'Employee',
            employee_id: data.employee_id || user?.employee_id || '—',
            designation: data.role || data.designation || user?.role || user?.designation || 'Employee'
          });
          setReportingManager({
            name: data.reporting_manager || 'Anish V N',
            id: data.reporting_manager_id || ''
          });

          // If we have an ID but no name, or just to ensure it's fresh, fetch manager details
          if (data.reporting_manager_id) {
            try {
              const mRes = await fetch(`${API_ENDPOINTS.PROFILE}/${data.reporting_manager_id}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
              });
              if (mRes.ok) {
                const mData = await mRes.json();
                setReportingManager({
                  name: mData.name || data.reporting_manager || 'Anish V N',
                  id: data.reporting_manager_id,
                  profile_pic: mData.profile_pic || mData.profile_picture
                });
              }
            } catch (err) { console.error('Manager details fetch error:', err); }
          }
        }
      } catch (err) { console.error('Profile fetch error:', err); }
    };

    const loadManager = async () => {
      if (!user?.token || !user?.email) return;
      try {
        const res = await fetch(`${API_ENDPOINTS.PROFILE_MANAGER}?email=${user.email}`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Merge with existing reporting manager info from loadProfile if needed
          setReportingManager(prev => ({
            ...prev,
            name: data.name || prev.name || 'Anish V N',
            id: data.id || prev.id,
            profile_pic: data.profile_pic || data.profile_picture || prev.profile_pic
          }));
        }
      } catch (err) { console.error('Manager fetch error:', err); }
    };

    loadProfile();
    loadManager();
    return () => window.removeEventListener('resize', handleResize);
  }, [user?.email, user?.token]);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Local preview
    const reader = new FileReader();
    reader.onloadend = () => setProfileImage(reader.result);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('employee_id', user.employee_id || user.id);

      const res = await fetch(API_ENDPOINTS.PROFILE_UPLOAD_IMAGE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const url = data.url || data.filePath || data.path || data.record?.path;
        if (url) {
          // 3. Persist in DB via PROFILE_UPDATE
          await fetch(API_ENDPOINTS.PROFILE_UPDATE, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
              email: user.email,
              employee_id: user.employee_id,
              id: user.id || user.employee_id,
              profile_pic: url,
              profile_picture: url
            })
          });

          // 4. Update Global State
          updateUser({ profile_pic: url, profile_picture: url });
          setToast({ show: true, message: 'profile pic updated successfully ✅', type: 'success' });
          setTimeout(() => setToast({ show: false, message: '' }), 3000);
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      setToast({ show: true, message: 'Upload failed', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
    }
  };

  const updateProfileField = async (field, value) => {
    if (!user?.token || !user?.email) return;
    try {
      // Prepare full payload with current values to prevent "erasing" on backend
      // We use user context values as final fallback to ensure we never send empty strings if data exists
      const nextPhone = field === 'phone_number' ? value : (phone !== 'Add Phone Number' ? phone : (user.phone_number || ''));
      const nextDob = field === 'date_of_birth' ? value : (dob !== 'Add Date of Birth' ? dob : (user.date_of_birth || ''));

      const payload = {
        email: user.email,
        employee_id: user.employee_id,
        id: user.id || user.employee_id, // Include primary key id
        // Primary fields (users table uses phone_number and date_of_birth)
        phone_number: nextPhone,
        date_of_birth: nextDob,
        about_me: aboutMe,
        // Compatibility aliases for different backend table schemas
        phone: nextPhone,
        mobile: nextPhone,
        contact_no: nextPhone,
        dob: nextDob,
        dateOfBirth: nextDob,
        emp_name: user.name
      };

      // Step 1: Update main Profile (Primary hit to users table via POST)
      const res = await fetch(API_ENDPOINTS.PROFILE_UPDATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });

      // Backup in localStorage to prevent "disappearing within a second" on refresh
      if (nextPhone) localStorage.setItem(`phone_${user.email}`, nextPhone);
      if (nextDob) localStorage.setItem(`dob_${user.email}`, nextDob);

      // Step 2: Also update Employee Profile (hits granular metadata table)
      try {
        await fetch(API_ENDPOINTS.EMPLOYEE_PROFILE_UPDATE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({
            ...payload,
            id: user.employee_id,
            contact_no: nextPhone, // specifically used in employee_profiles
          })
        });
      } catch (err) {
        console.warn("Secondary profile update failed.");
      }

      if (res.ok) {
        // Update local state immediately
        if (field === 'phone_number') {
          setPhone(value);
          setIsEditingPhone(false);
          updateUser({ phone_number: value });
        }
        if (field === 'date_of_birth') {
          setDob(value);
          setIsEditingDob(false);
          updateUser({ date_of_birth: value });
        }

        // Show Success Toast
        setToast({ show: true, message: 'Profile updated successfully ✅', type: 'success' });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
      } else {
        const errData = await res.json();
        setToast({ show: true, message: errData.error || 'Failed to update profile', type: 'error' });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setToast({ show: true, message: 'Server connection failed', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    }
  };

  const updateAboutMe = async () => {
    if (!user?.token || !user?.email) return;
    setSaving(true);
    try {
      const res = await fetch(API_ENDPOINTS.PROFILE_ABOUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          email: user.email,
          about_me: tempAbout,
          employee_id: user.employee_id,
          id: user.id || user.employee_id
        })
      });
      if (res.ok) {
        setAboutMe(tempAbout);
        setIsEditingAbout(false);
        updateUser({ about_me: tempAbout });
        setToast({ show: true, message: 'About me updated successfully ✅', type: 'success' });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
      } else {
        const errData = await res.json().catch(() => ({ error: 'Unknown server error' }));
        console.error('About me update failure:', errData);
        setToast({ show: true, message: errData.error || 'Failed to update about me', type: 'error' });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
      }
    } catch (err) {
      console.error('About me update error:', err);
      setToast({ show: true, message: 'Server connection failed', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    } finally {
      setSaving(false);
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr || dateStr.toLowerCase().includes('add')) return dateStr;
    // If it's already in DD/MM/YYYY format, return it
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
    } catch {
      return dateStr;
    }
  };

  const formatToISODate = (dateStr) => {
    if (!dateStr || dateStr.toLowerCase().includes('add')) return '';
    // If it's already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // If it's DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateStr;
  };

  const dashboardStyles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#eaeff2',
      paddingTop: winWidth < 768 ? '100px' : '120px',
      paddingBottom: '20px',
      fontFamily: "'Outfit', sans-serif"
    },
    combinedCard: {
      margin: '0 0 30px 0',
      borderRadius: winWidth < 768 ? '24px' : '32px',
      boxShadow: '0 15px 35px rgba(15, 23, 42, 0.12)',
      background: 'white',
      overflow: 'hidden',
      border: '1px solid #f1f5f9'
    },
    banner: {
      height: winWidth < 768 ? '100px' : '130px',
      background: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: winWidth < 768 ? '18px' : '26px',
      fontWeight: '900',
      letterSpacing: '-0.5px',
      textAlign: 'center'
    },
    profileCard: {
      width: '100%',
      maxWidth: '100%',
      background: 'white',
      padding: winWidth < 768 ? '25px' : '40px',
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

      <main style={{ padding: winWidth < 768 ? '0 16px' : '0 26px' }}>

        {/* Combined Dual-Color Card */}
        <div style={dashboardStyles.combinedCard}>
          {/* Banner Top Half */}
          <div style={dashboardStyles.banner}>
            Smarter Solutions for Better Future
          </div>

          {/* Profile Header Card */}
          <div style={dashboardStyles.profileCard}>
            <div style={{ display: 'flex', flexDirection: winWidth < 1024 ? 'column' : 'row', justifyContent: 'space-between', alignItems: winWidth < 1024 ? 'center' : 'flex-start', gap: winWidth < 1024 ? '30px' : '0', textAlign: winWidth < 1024 ? 'center' : 'left' }}>
              <div style={{ display: 'flex', flexDirection: winWidth < 600 ? 'column' : 'row', gap: '24px', alignItems: 'center' }}>
                <div style={dashboardStyles.avatar}>
                  {profileImage ? <img src={profileImage.startsWith('http') || profileImage.startsWith('data:') ? profileImage : `${BASE_URL}${profileImage.startsWith('/') ? '' : '/'}${profileImage}`} alt="Me" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: winWidth < 768 ? '18px' : '24px' }} /> : user?.name?.[0] || 'U'}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            value={tempPhone}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, ''); // Numbers only
                              if (val.length <= 10) setTempPhone(val);
                            }}
                            onKeyDown={e => e.key === 'Enter' && tempPhone.length === 10 && updateProfileField('phone_number', tempPhone)}
                            autoFocus
                            style={{ border: '1.5px solid #3b82f6', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', outline: 'none', background: 'white', width: '140px' }}
                            placeholder="10-digit Phone"
                          />
                          <div
                            onClick={() => {
                              if (tempPhone.length === 10) {
                                updateProfileField('phone_number', tempPhone);
                              } else {
                                setToast({ show: true, message: 'Please enter a valid 10-digit number ⚠️' });
                                setTimeout(() => setToast({ show: false, message: '' }), 3000);
                              }
                            }}
                            style={{ background: tempPhone.length === 10 ? '#22c55e' : '#e2e8f0', color: 'white', padding: '6px', borderRadius: '8px', cursor: tempPhone.length === 10 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: tempPhone.length === 10 ? '0 4px 10px rgba(34, 197, 94, 0.3)' : 'none' }}
                          >
                            <Check size={14} strokeWidth={3} />
                          </div>
                          <div
                            onClick={() => setIsEditingPhone(false)}
                            style={{ background: '#f1f5f9', color: '#64748b', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <X size={14} strokeWidth={3} />
                          </div>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="date"
                            value={tempDob}
                            onChange={e => setTempDob(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && updateProfileField('date_of_birth', tempDob)}
                            autoFocus
                            style={{ border: '1.5px solid #3b82f6', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', outline: 'none', background: 'white' }}
                          />
                          <div
                            onClick={() => updateProfileField('date_of_birth', tempDob)}
                            style={{ background: '#22c55e', color: 'white', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(34, 197, 94, 0.3)' }}
                          >
                            <Check size={14} strokeWidth={3} />
                          </div>
                          <div
                            onClick={() => setIsEditingDob(false)}
                            style={{ background: '#f1f5f9', color: '#64748b', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <X size={14} strokeWidth={3} />
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => { setTempDob(formatToISODate(dob)); setIsEditingDob(true); }}>
                          <span>{formatDateDisplay(dob)}</span>
                          <Edit3 size={14} color="#94a3b8" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px 20px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1e40af', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', overflow: 'hidden' }}>
                  {reportingManager.profile_pic ? (
                    <img
                      src={reportingManager.profile_pic.startsWith('http') || reportingManager.profile_pic.startsWith('data:') ? reportingManager.profile_pic : `${BASE_URL}${reportingManager.profile_pic.startsWith('/') ? '' : '/'}${reportingManager.profile_pic}`}
                      alt="Manager"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : reportingManager.name?.[0]}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reporting Manager</p>
                  <p style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '900' }}>{reportingManager.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Stats Row */}
        <div style={{
          width: '100%',
          maxWidth: '100%',
          margin: '0 auto 40px',
          display: 'grid',
          gridTemplateColumns: winWidth < 600 ? '1fr' : '1fr 1fr',
          gap: '24px'
        }}>
          <div style={dashboardStyles.statBox}>
            <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: '#f0f9ff', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mail size={20} /></div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</p>
              <p style={{ margin: 0, fontSize: winWidth < 768 ? '14px' : '16px', color: '#0f172a', fontWeight: '900', wordBreak: 'break-all' }}>{user?.email || 'sahana@navabharathtechnologies.com'}</p>
            </div>
          </div>
          <div style={dashboardStyles.statBox}>
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
              { title: 'Security Settings', sub: 'Update security password', color: '#dbeafe', text: '#1e40af', icon: <Shield color="#3b82f6" size={20} />, onClick: () => setShowSecurityModal(true) },
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
              onClick={() => {
                const role = (user?.role || '').toLowerCase();
                navigate(role === 'hr' || role === 'admin' ? '/admin/certificates' : '/service-certificates');
              }}
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
              onClick={() => {
                const role = (user?.role || '').toLowerCase();
                navigate(role === 'hr' || role === 'admin' ? '/admin/resignations' : '/resignations');
              }}
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
        <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto 40px', background: 'white', borderRadius: winWidth < 768 ? '24px' : '32px', padding: winWidth < 768 ? '20px' : '25px', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: winWidth < 768 ? '15px' : '20px' }}>
            <h3 style={{ fontSize: winWidth < 768 ? '18px' : '22px', fontWeight: '950', color: '#0f172a', margin: 0 }}>About Me</h3>
            {!isEditingAbout && (
              <div
                onClick={() => { setTempAbout(aboutMe === 'Write a short introduction about yourself' ? '' : aboutMe); setIsEditingAbout(true); }}
                style={{ width: '36px', height: '36px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Edit3 size={18} color="#0f172a" />
              </div>
            )}
          </div>
          <div style={{ textAlign: isEditingAbout ? 'left' : 'center', padding: isEditingAbout ? '0' : (winWidth < 768 ? '10px 0' : '15px 0') }}>
            {isEditingAbout ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <textarea
                  value={tempAbout}
                  onChange={e => setTempAbout(e.target.value)}
                  placeholder="Tell us about yourself..."
                  style={{ width: '100%', minHeight: '120px', padding: '16px', borderRadius: '16px', border: '1.5px solid #3b82f6', outline: 'none', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setIsEditingAbout(false)}
                    style={{ padding: '8px 20px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateAboutMe}
                    disabled={saving}
                    style={{ padding: '8px 24px', borderRadius: '10px', border: 'none', background: '#1e40af', color: 'white', fontWeight: '700', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {aboutMe === 'Write a short introduction about yourself' ? (
                  <>
                    <div style={{ width: '50px', height: '50px', background: '#f8fafc', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Edit3 size={24} color="#cbd5e1" /></div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', fontWeight: '700' }}>{aboutMe}</p>
                  </>
                ) : (
                  <p style={{ margin: 0, fontSize: '15px', color: '#475569', fontWeight: '500', lineHeight: '1.6', textAlign: 'left' }}>{aboutMe}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Logout */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '5px' }}>
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

      {/* Success Toast */}
      {toast.show && (
        <div style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: 'white', padding: '12px 24px', borderRadius: '16px', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', zIndex: 9999, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ background: toast.type === 'success' ? '#22c55e' : '#ef4444', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {toast.type === 'success' ? <Check size={12} color="white" strokeWidth={4} /> : <X size={12} color="white" strokeWidth={4} />}
          </div>
          {toast.message}
        </div>
      )}
    </div>
  );
}