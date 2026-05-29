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
  MessageSquare, Trash2, Clock, MapPin, Info, LifeBuoy, RefreshCw
} from 'lucide-react';
import UpdatePasswordModal from './UpdatePasswordModal';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';
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
  const [fetchedRole, setFetchedRole] = useState('');
  const [joiningDate, setJoiningDate] = useState('N/A');
  const [toast, setToast] = useState({ show: false, message: '' });
  
  // Crop States
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropUploading, setCropUploading] = useState(false);

  const fileInputRef = useRef(null);
  const dobInputRef = useRef(null);

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
          const isHr = String(data.role || user?.role || '').toLowerCase().includes('hr') ||
                       String(data.designation || user?.designation || '').toLowerCase().includes('human resource') ||
                       String(data.designation || user?.designation || '').toLowerCase().includes('hr') ||
                       String(data.name || user?.name || '').toLowerCase().includes('ravikumar');

          if (isHr) {
            setReportingManager({
              name: 'Dinesh',
              id: '20250'
            });
            try {
              const mRes = await fetch(`${API_ENDPOINTS.PROFILE}/20250`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
              });
              if (mRes.ok) {
                const mData = await mRes.json();
                setReportingManager({
                  name: mData.name || 'Dinesh',
                  id: '20250',
                  profile_pic: mData.profile_pic || mData.profile_picture
                });
              }
            } catch (err) {
              console.error('Manager details fetch error for Dinesh:', err);
            }
          } else {
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
        }
      } catch (err) { console.error('Profile fetch error:', err); }
    };

    const loadManager = async () => {
      if (!user?.token || !user?.email) return;
      const isHr = String(user?.role || '').toLowerCase().includes('hr') ||
                   String(user?.designation || '').toLowerCase().includes('human resource') ||
                   String(user?.designation || '').toLowerCase().includes('hr') ||
                   String(user?.name || '').toLowerCase().includes('ravikumar');
      if (isHr) {
        try {
          const mRes = await fetch(`${API_ENDPOINTS.PROFILE}/20250`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          });
          if (mRes.ok) {
            const mData = await mRes.json();
            setReportingManager({
              name: mData.name || 'Dinesh',
              id: '20250',
              profile_pic: mData.profile_pic || mData.profile_picture
            });
          } else {
            setReportingManager({
              name: 'Dinesh',
              id: '20250'
            });
          }
        } catch (err) {
          setReportingManager({
            name: 'Dinesh',
            id: '20250'
          });
        }
        return;
      }
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

    const loadUserRole = async () => {
      if (!user?.token) return;
      try {
        const res = await fetch(`${BASE_URL}/api/users`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          const users = await res.json();
          const currentId = user?.employee_id || user?.id || user?.empId;
          const target = users.find(u => String(u.employee_id || u.id || u.empId) === String(currentId));
          if (target) {
            setFetchedRole(target.Role || target.role || '');
            if (target.joining_date) {
              try {
                const dateObj = new Date(target.joining_date);
                if (!isNaN(dateObj)) {
                  setJoiningDate(dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
                } else {
                  setJoiningDate(target.joining_date);
                }
              } catch (e) {
                setJoiningDate(target.joining_date);
              }
            }
          }
        }
      } catch (err) {
        console.error("Fetch Role Error:", err);
      }
    };

    loadProfile();
    loadManager();
    loadUserRole();
    return () => window.removeEventListener('resize', handleResize);
  }, [user?.email, user?.token]);

  const handleLogout = () => { logout(); navigate('/'); };

  // Calculate total tenurity from joining date
  const calcTenure = () => {
    const raw = user?.date_of_joining || user?.joining_date || user?.doj || '2026-01-16';
    let joinDate;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      joinDate = new Date(raw);
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      const [d, m, y] = raw.split('/');
      joinDate = new Date(`${y}-${m}-${d}`);
    } else {
      joinDate = new Date('2026-01-16');
    }
    const now = new Date();
    let months = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());
    let days = now.getDate() - joinDate.getDate();
    if (days < 0) { months -= 1; const prev = new Date(now.getFullYear(), now.getMonth(), 0); days += prev.getDate(); }
    if (months < 0) months = 0;
    if (months === 0 && days < 0) days = 0;
    return { months, days };
  };
  const tenure = calcTenure();

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImageSrc(reader.result);
      setShowCropModal(true);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropConfirm = async () => {
    if (!selectedImageSrc || !croppedAreaPixels) return;
    setCropUploading(true);

    try {
      const croppedBlob = await getCroppedImg(selectedImageSrc, croppedAreaPixels);
      if (!croppedBlob) throw new Error('Failed to crop image');

      // 1. Local preview instantly
      const previewUrl = URL.createObjectURL(croppedBlob);
      setProfileImage(previewUrl);
      
      // Update global context immediately so header syncs instantly
      const reader = new FileReader();
      reader.readAsDataURL(croppedBlob);
      reader.onloadend = () => {
        updateUser({ profile_pic: reader.result, profile_picture: reader.result });
      };

      const formData = new FormData();
      formData.append('image', croppedBlob, 'profile_pic.jpg');
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
          // Persist in DB via PROFILE_UPDATE
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

          // Final update with the actual remote URL
          updateUser({ profile_pic: url, profile_picture: url });
          setToast({ show: true, message: 'profile pic updated successfully ✅', type: 'success' });
          setTimeout(() => setToast({ show: false, message: '' }), 3000);
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setToast({ show: true, message: 'Upload failed', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
    } finally {
      setCropUploading(false);
      setShowCropModal(false);
      setSelectedImageSrc(null);
    }
  };

  const validateDob = (dobStr) => {
    if (!dobStr) return 'Date of Birth is required';
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dobStr)) {
      return 'Date of Birth must be in DD/MM/YYYY format';
    }
    const [dStr, mStr, yStr] = dobStr.split('/');
    const day = parseInt(dStr, 10);
    const month = parseInt(mStr, 10);
    const year = parseInt(yStr, 10);
    
    if (day < 1 || day > 31) {
      return 'Day must be between 01 and 31';
    }
    if (month < 1 || month > 12) {
      return 'Month must be between 01 and 12';
    }
    if (year > 2090) {
      return 'Year cannot be above 2090';
    }
    const dateObj = new Date(year, month - 1, day);
    if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
      return 'Please enter a valid calendar date';
    }
    return null;
  };

  const handleDobChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setTempDob('');
      return;
    }

    // Allow only digits and slashes
    const cleanVal = val.replace(/[^0-9/]/g, '');

    const parts = cleanVal.split('/');
    if (parts.length > 3) return;

    const dayStr = parts[0] || '';
    const monthStr = parts[1] || '';
    const yearStr = parts[2] || '';

    if (dayStr) {
      if (dayStr.length > 2) return;
      const day = parseInt(dayStr, 10);
      if (day > 31) return;
    }

    if (monthStr) {
      if (monthStr.length > 2) return;
      const month = parseInt(monthStr, 10);
      if (month > 12) return;
    }

    if (yearStr) {
      if (yearStr.length > 4) return;
      if (yearStr.length === 4) {
        const year = parseInt(yearStr, 10);
        if (year > 2090) return;
      }
    }

    let formatted = cleanVal;
    if (dayStr.length === 2 && parts.length === 1 && val.length > (tempDob || '').length) {
      formatted = dayStr + '/';
    }
    if (monthStr.length === 2 && parts.length === 2 && val.length > (tempDob || '').length) {
      formatted = dayStr + '/' + monthStr + '/';
    }

    setTempDob(formatted);
  };

  const updateProfileField = async (field, value) => {
    if (!user?.token || !user?.email) return;
    if (field === 'date_of_birth') {
      const error = validateDob(value);
      if (error) {
        setToast({ show: true, message: error, type: 'error' });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
        return;
      }
    }
    try {
      // Prepare full payload with current values to prevent "erasing" on backend
      // We use user context values as final fallback to ensure we never send empty strings if data exists
      const nextPhone = field === 'phone_number' ? value : (phone !== 'Add Phone Number' ? phone : (user.phone_number || ''));
      let nextDob = field === 'date_of_birth' ? value : (dob !== 'Add Date of Birth' ? dob : (user.date_of_birth || ''));
      
      // Handle formatting for both input types (date picker YYYY-MM-DD and manual DD-MM-YYYY)
      if (field === 'date_of_birth' && nextDob) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(nextDob)) {
          // It's YYYY-MM-DD from a date picker
          const [y, m, d] = nextDob.split('-');
          nextDob = `${d}/${m}/${y}`;
        } else if (/^\d{2}-\d{2}-\d{4}$/.test(nextDob)) {
          // It's already DD-MM-YYYY, change to DD/MM/YYYY for internal consistency
          nextDob = nextDob.replace(/-/g, '/');
        }
      }

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
          let formattedDob = value;
          if (value.includes('-')) {
            const [y, m, d] = value.split('-');
            formattedDob = `${d}/${m}/${y}`;
          }
          setDob(formattedDob);
          setIsEditingDob(false);
          updateUser({ date_of_birth: formattedDob });
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
                <div
                  style={{ ...dashboardStyles.avatar, cursor: 'pointer' }}
                  onClick={() => navigate('/personal-info?self=true')}
                >
                  {profileImage ? <img src={profileImage.startsWith('http') || profileImage.startsWith('data:') ? profileImage : `${BASE_URL}${profileImage.startsWith('/') ? '' : '/'}${profileImage}`} alt="Me" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: winWidth < 768 ? '18px' : '24px' }} /> : user?.name?.[0] || 'U'}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
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
                      <Briefcase size={16} /> {fetchedRole || user?.role || user?.Role || profileData.designation || 'Employee'}
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
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={tempDob}
                              onChange={handleDobChange}
                              onKeyDown={e => e.key === 'Enter' && updateProfileField('date_of_birth', tempDob)}
                              placeholder="DD/MM/YYYY"
                              autoFocus
                              style={{ border: '1.5px solid #3b82f6', borderRadius: '8px', padding: '6px 35px 6px 12px', fontSize: '13px', outline: 'none', background: 'white', width: '130px' }}
                            />
                            <Calendar 
                              size={14} 
                              color="#64748b" 
                              style={{ position: 'absolute', right: '10px', cursor: 'pointer' }} 
                              onClick={() => dobInputRef.current?.showPicker()}
                            />
                            <input
                              type="date"
                              ref={dobInputRef}
                              style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                              max="2090-12-31"
                              onChange={e => {
                                const val = e.target.value; // YYYY-MM-DD
                                if (val) {
                                  const [y, m, d] = val.split('-');
                                  setTempDob(`${d}/${m}/${y}`);
                                }
                              }}
                            />
                          </div>
                          <button
                            onClick={() => updateProfileField('date_of_birth', tempDob)}
                            style={{ background: '#22c55e', color: 'white', padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)', transition: 'transform 0.1s active' }}
                            title="Save Changes"
                          >
                            <Check size={16} strokeWidth={3} />
                          </button>
                          <button
                            onClick={() => setIsEditingDob(false)}
                            style={{ background: '#f1f5f9', color: '#64748b', padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                            title="Cancel"
                          >
                            <X size={16} strokeWidth={3} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => { setTempDob(formatDateDisplay(dob)); setIsEditingDob(true); }}>
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
              <p style={{ margin: 0, fontSize: winWidth < 768 ? '14px' : '16px', color: '#0f172a', fontWeight: '900' }}>{joiningDate}</p>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto 40px' }}>
          <h3 style={{ fontSize: winWidth < 768 ? '18px' : '22px', fontWeight: '950', color: '#0f172a', marginBottom: '24px' }}>Services &amp; Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: winWidth < 600 ? '1fr' : winWidth < 900 ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '24px' }}>

            {/* Card 1 – Security Settings */}
            <div onClick={() => setShowSecurityModal(true)} style={{ ...dashboardStyles.serviceCard, background: '#dbeafe' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield color="#3b82f6" size={20} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Security Settings</p>
                  <p style={{ margin: 0, fontSize: winWidth < 768 ? '14px' : '16px', fontWeight: '900', color: '#0f172a' }}>Update Security Passkey</p>
                </div>
              </div>
              <ChevronRight size={winWidth < 768 ? 16 : 20} color="#1e40af" />
            </div>

            {/* Card 2 – Support & Maintenance */}
            <div onClick={() => navigate('/tickets')} style={{ ...dashboardStyles.serviceCard, background: '#ffedd5' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LifeBuoy color="#f97316" size={20} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Support &amp; Maintenance</p>
                  <p style={{ margin: 0, fontSize: winWidth < 768 ? '14px' : '16px', fontWeight: '900', color: '#0f172a' }}>Raise Technical Ticket</p>
                </div>
              </div>
              <ChevronRight size={winWidth < 768 ? 16 : 20} color="#9a3412" />
            </div>

            {/* Card 3 – Total Tenurity */}
            <div style={{ ...dashboardStyles.serviceCard, background: '#dcfce7', cursor: 'default' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RefreshCw color="#16a34a" size={20} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Tenurity</p>
                  <p style={{ margin: 0, fontSize: winWidth < 768 ? '14px' : '16px', fontWeight: '900', color: '#0f172a' }}>
                    {tenure.months}M {tenure.days}D Experience
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Documents Section */}
        <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto 40px' }}>
          <h3 style={{ fontSize: winWidth < 768 ? '18px' : '22px', fontWeight: '950', color: '#0f172a', marginBottom: '24px' }}>HR Documents</h3>
          <div style={{ display: 'grid', gridTemplateColumns: winWidth < 1024 ? (winWidth < 600 ? '1fr' : '1fr 1fr') : 'repeat(3, 1fr)', gap: '24px' }}>
            <div style={{ ...dashboardStyles.docCard, cursor: 'pointer' }} onClick={() => navigate('/salary-statements')}>
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
      {showCropModal && selectedImageSrc && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '90%', maxWidth: '500px', height: '400px', background: '#333', borderRadius: '16px', overflow: 'hidden' }}>
            <Cropper
              image={selectedImageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '16px' }}>
            <button
              onClick={() => { setShowCropModal(false); setSelectedImageSrc(null); }}
              disabled={cropUploading}
              style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid white', background: 'transparent', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleCropConfirm}
              disabled={cropUploading}
              style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#3863a8', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {cropUploading ? <RefreshCw size={16} className="spin" /> : <Check size={16} />}
              {cropUploading ? 'Uploading...' : 'Apply & Upload'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}