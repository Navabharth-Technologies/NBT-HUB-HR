import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, BASE_URL } from '../../config';
import {
  Briefcase, Search, Plus, X, Save, Eye, CheckCircle,
  XCircle, Clock, User, Mail, Phone, FileText, Calendar,
  MapPin, ChevronDown, ChevronLeft, ChevronRight, Filter, Download, ClipboardList, Edit3, ArrowLeft,
  Upload, Trash2
} from 'lucide-react';

const getGoogleDriveFileId = (url) => {
  if (!url) return null;
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch) return fileDMatch[1];

  const docDMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docDMatch) return docDMatch[1];

  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];

  if (/^[a-zA-Z0-9_-]{25,50}$/.test(url)) {
    return url;
  }

  return null;
};

const resolveResumeUrl = (link) => {
  if (!link) return '';
  const base = (BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

  if (link.startsWith('http://') || link.startsWith('https://')) {
    return link;
  }

  if (link.includes('api/drive/stream/') || link.startsWith('/')) {
    const cleanLink = link.startsWith('/') ? link : `/${link}`;
    return `${base}${cleanLink}`;
  }

  const fileId = getGoogleDriveFileId(link);
  if (fileId) {
    return `${base}/api/drive/stream/${fileId}`;
  }
  const cleanLink = link.startsWith('/') ? link : `/${link}`;
  return `${base}${cleanLink}`;
};



const STATUS_CONFIG = {
  APPLIED: { label: 'New Application', color: '#3b82f6', bg: '#eff6ff', border: '#dbeafe', icon: <Clock size={14} /> },
  SCREENING: { label: 'Screening', color: '#6366f1', bg: '#eef2ff', border: '#e0e7ff', icon: <Search size={14} /> },
  INTERVIEW_SCHEDULED: { label: 'Interview Scheduled', color: '#f59e0b', bg: '#fffbeb', border: '#fef3c7', icon: <Calendar size={14} /> },
  INTERVIEW_COMPLETED: { label: 'Interview Completed', color: '#10b981', bg: '#ecfdf5', border: '#d1fae5', icon: <CheckCircle size={14} /> },
  OFFER_EXTENDED: { label: 'Offer Extended', color: '#8b5cf6', bg: '#f5f3ff', border: '#ede9fe', icon: <Mail size={14} /> },
  HIRED: { label: 'Hired', color: '#059669', bg: '#f0fdf4', border: '#dcfce7', icon: <CheckCircle size={14} /> },
  REJECTED: { label: 'Rejected', color: '#ef4444', bg: '#fef2f2', border: '#fee2e2', icon: <XCircle size={14} /> },
  WITHDRAWN: { label: 'Withdrawn', color: '#6b7280', bg: '#f9fafb', border: '#f3f4f6', icon: <X size={14} /> },
  Pending: { label: 'Pending', color: '#f59e0b', bg: '#fffbeb', border: '#fef3c7', icon: <Clock size={14} /> },
};

const JOB_STATUS_OPTIONS = [
  { value: 'APPLIED', label: 'New Application', color: '#3b82f6' },
  { value: 'SCREENING', label: 'Screening', color: '#6366f1' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled', color: '#f59e0b' },
  { value: 'INTERVIEW_COMPLETED', label: 'Interview Completed', color: '#10b981' },
  { value: 'OFFER_EXTENDED', label: 'Offer Extended', color: '#8b5cf6' },
  { value: 'HIRED', label: 'Hired', color: '#059669' },
  { value: 'REJECTED', label: 'Rejected', color: '#ef4444' },
  { value: 'WITHDRAWN', label: 'Withdrawn', color: '#6b7280' },
];

const FormField = ({ label, icon, type = 'text', name, placeholder, value, onChange, required, fullWidth }) => (
  <div style={{ gridColumn: fullWidth ? 'span 2' : 'auto' }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '900', color: '#1e293b', marginBottom: '10px', paddingLeft: '4px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
      <span style={{ color: '#0d9488' }}>{icon}</span> {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    {type === 'textarea' ? (
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        style={{
          width: '100%',
          padding: '16px 20px',
          borderRadius: '18px',
          border: '1.5px solid #e2e8f0',
          background: '#ffffff',
          fontWeight: '600',
          fontSize: '15px',
          minHeight: '110px',
          resize: 'none',
          outline: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          transition: 'all 0.3s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(13, 148, 136, 0.1)'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
      />
    ) : type === 'select' ? (
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          style={{
            width: '100%',
            padding: '16px 20px',
            borderRadius: '18px',
            border: '1.5px solid #e2e8f0',
            background: '#ffffff',
            fontWeight: '600',
            fontSize: '15px',
            outline: 'none',
            cursor: 'pointer',
            boxSizing: 'border-box',
            appearance: 'none',
            transition: 'all 0.3s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            color: '#1e293b',
            fontFamily: 'inherit'
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(13, 148, 136, 0.1)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
        >
          <option value="" style={{ color: '#64748b' }}>Select Department</option>
          <option value="Technical Support" style={{ color: '#1e293b' }}>Technical Support</option>
          <option value="Development" style={{ color: '#1e293b' }}>Development</option>
          <option value="Marketing" style={{ color: '#1e293b' }}>Marketing</option>
          <option value="HR" style={{ color: '#1e293b' }}>HR</option>
          <option value="Design" style={{ color: '#1e293b' }}>Design</option>
          <option value="Operations" style={{ color: '#1e293b' }}>Operations</option>
          <option value="Internship" style={{ color: '#1e293b' }}>Internship</option>
        </select>
        <ChevronDown size={18} color="#94a3b8" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      </div>
    ) : (
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        style={{
          width: '100%',
          padding: '16px 20px',
          borderRadius: '18px',
          border: '1.5px solid #e2e8f0',
          background: '#ffffff',
          fontWeight: '600',
          fontSize: '15px',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'all 0.3s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(13, 148, 136, 0.1)'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
      />
    )}
  </div>
);

export default function JobApplications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState({ show: false, app: null });
  const [statusNote, setStatusNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [winWidth, setWinWidth] = useState(window.innerWidth);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [previewResumeUrl, setPreviewResumeUrl] = useState(null);
  const [deleteConfirmAppId, setDeleteConfirmAppId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      showNotification('Only PDF, DOC, or DOCX files are allowed.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showNotification('File size must be less than 5MB.', 'error');
      return;
    }

    setUploadingResume(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, resume_link: reader.result }));
      showNotification(`Resume "${file.name}" uploaded successfully ✅`, 'success');
      setUploadingResume(false);
    };
    reader.onerror = () => {
      showNotification('Error reading file. Please try again.', 'error');
      setUploadingResume(false);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [form, setForm] = useState({
    applicant_name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    experience: '',
    location: '',
    resume_link: '',
    notes: '',
    status: 'Pending',
    applied_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollContainerRef = React.useRef(null);
  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const fetchApplications = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.JOB_APPLICATIONS, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Raw Job Applications Data:', data);
        const list = Array.isArray(data) ? data : (data?.data || data?.applications || []);
        setApplications(list);
      }
    } catch (err) {
      console.error('Fetch job applications error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const resetForm = () => {
    setForm({
      applicant_name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      experience: '',
      location: '',
      resume_link: '',
      notes: '',
      status: 'Pending',
      applied_date: new Date().toISOString().split('T')[0]
    });
  };

  const handleFormChange = (name, value) => {
    let val = value;
    if (name === 'applicant_name') {
      val = value.replace(/[^a-zA-Z\s]/g, '');
    } else if (name === 'email') {
      const atIndex = value.indexOf('@');
      if (atIndex !== -1) {
        const domainPart = value.substring(atIndex + 1);
        const comIndex = domainPart.toLowerCase().indexOf('.com');
        if (comIndex !== -1) {
          val = value.substring(0, atIndex + 1 + comIndex + 4);
        }
      }
    } else if (name === 'phone') {
      let digits = value.replace(/\D/g, '');
      if (digits.length > 0) {
        if (!['9', '8', '7', '6'].includes(digits[0])) {
          digits = '';
        }
      }
      val = digits.substring(0, 10);
    } else if (name === 'position') {
      val = value.replace(/[^a-zA-Z0-9\s]/g, '');
    } else if (name === 'experience') {
      let digits = value.replace(/\D/g, '');
      if (digits !== '') {
        const num = parseInt(digits, 10);
        if (num > 50) {
          val = '50';
        } else {
          val = String(num);
        }
      } else {
        val = '';
      }
    } else if (name === 'location') {
      val = value.replace(/[^a-zA-Z\s]/g, '');
    }
    setForm(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async () => {
    if (!form.applicant_name || !form.position) {
      showNotification('Please fill in Applicant Name and Position', 'error');
      return;
    }

    if (!form.resume_link) {
      showNotification('Please upload or enter a resume link (this field is mandatory)', 'error');
      return;
    }

    // Name validation: alphabets and spaces
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(form.applicant_name)) {
      showNotification('Applicant Name must contain only alphabets and spaces', 'error');
      return;
    }

    // Email validation
    if (form.email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
      if (!emailRegex.test(form.email)) {
        showNotification('Please enter a valid email address ending with .com (e.g. abc@gmail.com)', 'error');
        return;
      }
    }

    // Phone validation: 10 digits starting with 9, 8, 7, or 6
    if (form.phone) {
      const phoneRegex = /^[9876]\d{9}$/;
      if (!phoneRegex.test(form.phone)) {
        showNotification('Phone number must be exactly 10 digits and start with 9, 8, 7, or 6', 'error');
        return;
      }
    }

    // Position validation: alphanumeric and spaces
    const positionRegex = /^[a-zA-Z0-9\s]+$/;
    if (!positionRegex.test(form.position)) {
      showNotification('Position must contain only letters, numbers, and spaces', 'error');
      return;
    }

    // Experience validation: positive numbers, 0-50 years
    if (form.experience !== '') {
      const expVal = parseInt(form.experience, 10);
      if (isNaN(expVal) || expVal < 0 || expVal > 50) {
        showNotification('Experience must be a positive number between 0 and 50', 'error');
        return;
      }
    }

    // Location validation: alphabets and spaces
    if (form.location) {
      const locationRegex = /^[a-zA-Z\s]+$/;
      if (!locationRegex.test(form.location)) {
        showNotification('Location must contain only alphabets and spaces', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        applicant_name: form.applicant_name,
        name: form.applicant_name,
        email: form.email,
        email_id: form.email,
        phone: form.phone,
        phone_number: form.phone,
        position: form.position,
        role: form.position,
        department: form.department,
        team: form.department,
        experience: form.experience,
        experience_years: form.experience,
        location: form.location,
        city: form.location,
        resume_link: form.resume_link,
        resume_url: form.resume_link,
        notes: form.notes,
        remarks: form.notes,
        status: form.status,
        applied_date: form.applied_date,
        application_date: form.applied_date,
        created_at: new Date().toISOString()
      };

      const res = await fetch(API_ENDPOINTS.JOB_APPLICATIONS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showNotification('Application added successfully ✅', 'success');
        setShowAddModal(false);
        resetForm();
        fetchApplications();
      } else {
        const result = await res.json().catch(() => ({}));
        showNotification(`Failed to add: ${result.message || result.error || 'Server error'}`, 'error');
      }
    } catch (err) {
      console.error('Add application error:', err);
      showNotification('Network error. Could not connect to server.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus, note = '') => {
    try {
      const response = await fetch(API_ENDPOINTS.JOB_APPLICATION_UPDATE(applicationId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          statusNote: note || `Status updated to ${newStatus}`,
          remarks: note
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showNotification('Candidate status updated and synced to portal! ✅', 'success');
        setShowDetailModal({ show: false, app: null });
        setStatusNote('');
        setTimeout(() => fetchApplications(), 300);
      } else {
        showNotification(result.error || result.message || 'Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Update failed:', error);
      showNotification('Network error while updating status', 'error');
    }
  };

  const handleDeleteApplication = (applicationId) => {
    setDeleteConfirmAppId(applicationId);
  };

  const executeDeleteApplication = async (applicationId) => {
    try {
      const res = await fetch(API_ENDPOINTS.JOB_APPLICATION_DELETE(applicationId), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      if (res.ok) {
        showNotification('Application deleted successfully ✅', 'success');
        fetchApplications();
      } else {
        const result = await res.json().catch(() => ({}));
        showNotification(`Failed to delete: ${result.message || result.error || 'Server error'}`, 'error');
      }
    } catch (err) {
      console.error('Delete application error:', err);
      showNotification('Network error. Could not connect to server.', 'error');
    }
  };

  const filteredApps = applications
    .filter(app => {
      const name = (app.applicant_name || app.name || app.candidateName || app.candidate_name || app.full_name || '').toLowerCase();
      const pos = (app.position || app.role || app.jobTitle || app.job_title || '').toLowerCase();
      const dept = (app.department || app.team || '').toLowerCase();
      const term = searchTerm.toLowerCase().trim();
      // When searching: name must START WITH the term, or position/dept contains it
      const matchesSearch = !term || name.startsWith(term) || pos.includes(term) || dept.includes(term);
      const matchesStatus = filterStatus === 'All' || (app.status || 'Pending') === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (!searchTerm.trim()) return 0; // preserve original order when no search
      const nameA = (a.applicant_name || a.name || a.candidateName || a.candidate_name || a.full_name || '').toLowerCase();
      const nameB = (b.applicant_name || b.name || b.candidateName || b.candidate_name || b.full_name || '').toLowerCase();
      // Sort alphabetically within filtered results
      return nameA.localeCompare(nameB);
    });

  const statusCounts = {
    All: applications.length,
    APPLIED: applications.filter(a => (a.status || 'Pending') === 'APPLIED' || a.status === 'Pending').length,
    SCREENING: applications.filter(a => a.status === 'SCREENING').length,
    INTERVIEW_SCHEDULED: applications.filter(a => a.status === 'INTERVIEW_SCHEDULED').length,
    INTERVIEW_COMPLETED: applications.filter(a => a.status === 'INTERVIEW_COMPLETED').length,
    OFFER_EXTENDED: applications.filter(a => a.status === 'OFFER_EXTENDED').length,
    HIRED: applications.filter(a => a.status === 'HIRED').length,
    REJECTED: applications.filter(a => a.status === 'REJECTED').length,
    WITHDRAWN: applications.filter(a => a.status === 'WITHDRAWN').length,
  };

  const formatDate = (d) => {
    if (!d) return '--';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return d; }
  };


  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#eaeff2', fontFamily: "'Outfit', sans-serif" }}>
      <AppHeader />

      <main style={{
        paddingTop: winWidth < 768 ? '100px' : '120px',
        paddingLeft: winWidth < 768 ? '16px' : '26px',
        paddingRight: winWidth < 768 ? '16px' : '26px',
        paddingBottom: '100px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: winWidth < 640 ? '15px' : '20px',
          width: '100%',
          flexDirection: winWidth < 640 ? 'column' : 'row',
          textAlign: winWidth < 640 ? 'center' : 'left',
          marginBottom: winWidth < 768 ? '20px' : '35px',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          padding: winWidth < 768 ? '15px' : '25px',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', flexDirection: winWidth < 480 ? 'column' : 'row', gap: winWidth < 480 ? '10px' : '18px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowLeft size={18} color="#64748b" />
            </button>
            <div>
              <h1 style={{ fontSize: winWidth < 768 ? '20px' : '28px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>New Hirings</h1>
              <p style={{ fontSize: winWidth < 768 ? '11px' : '14px', color: '#64748b', margin: '2px 0 0 0', fontWeight: '500' }}></p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', width: winWidth < 640 ? '100%' : 'auto' }}>
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              style={{
                flex: winWidth < 640 ? 1 : 'none',
                background: '#0d9488',
                color: 'white',
                border: 'none',
                padding: winWidth < 768 ? '10px 16px' : '14px 28px',
                borderRadius: '14px',
                fontWeight: '800',
                fontSize: winWidth < 768 ? '12px' : '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 10px 20px rgba(13, 148, 136, 0.2)',
                transition: '0.3s transform, 0.3s box-shadow'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 25px rgba(13, 148, 136, 0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(13, 148, 136, 0.2)'; }}
            >
              <Plus size={winWidth < 768 ? 16 : 20} strokeWidth={3} />
              Add
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', width: '100%', marginBottom: '25px' }}>
          {winWidth < 768 && (
            <div
              onClick={() => handleScroll('left')}
              style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: '35px',
                background: 'linear-gradient(to right, #eaeff2 40%, transparent)',
                zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
                cursor: 'pointer', borderRadius: '20px 0 0 20px'
              }}>
              <ChevronLeft size={18} color="#475569" style={{ marginLeft: '4px' }} />
            </div>
          )}
          <div ref={scrollContainerRef} className="custom-scroll" style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.5)',
            padding: '4px',
            borderRadius: '20px',
            width: '100%',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
            overflowX: 'auto',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            whiteSpace: 'nowrap'
          }}>
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  padding: winWidth < 768 ? '8px 14px' : '10px 20px',
                  borderRadius: '16px',
                  border: 'none',
                  background: filterStatus === status ? '#514e4eff' : 'transparent',
                  color: filterStatus === status ? '#f2fbfaff' : '#64748b',
                  fontWeight: '800',
                  fontSize: winWidth < 768 ? '12px' : '13px',
                  cursor: 'pointer',
                  boxShadow: filterStatus === status ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                  transition: '0.3s all',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0
                }}
              >
                {status}
                <span style={{
                  background: filterStatus === status ? '#2f7b7615' : '#f1f5f9',
                  color: filterStatus === status ? '#f2e6e6ff' : '#64748b',
                  padding: '1px 6px',
                  borderRadius: '8px',
                  fontSize: '10px',
                  fontWeight: '900'
                }}>{count}</span>
              </button>
            ))}
          </div>
          {winWidth < 768 && (
            <div
              onClick={() => handleScroll('right')}
              style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: '35px',
                background: 'linear-gradient(to left, #eaeff2 40%, transparent)',
                zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                cursor: 'pointer', borderRadius: '0 20px 20px 0'
              }}>
              <ChevronRight size={18} color="#475569" style={{ marginRight: '4px' }} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '30px' }}>
          <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px 16px 52px',
                borderRadius: '18px',
                border: '1.5px solid #e2e8f0',
                outline: 'none',
                background: 'white',
                fontSize: '15px',
                fontWeight: '600',
                boxSizing: 'border-box',
                transition: '0.3s all',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(13, 148, 136, 0.1)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#1e1f1fff'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <div style={{ fontSize: '14px', fontWeight: '700' }}>Loading applications...</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: winWidth < 640 ? '1fr' : (winWidth < 1024 ? '1fr 1fr' : 'repeat(3, 1fr)'), gap: winWidth < 768 ? '20px' : '30px', width: '100%' }}>
            {filteredApps.map((app, i) => {
              const status = app.status || 'Pending';
              const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
              return (
                <div
                  key={app.id || i}
                  onClick={() => setShowDetailModal({ show: true, app })}
                  style={{
                    background: '#ffffff',
                    borderRadius: '24px',
                    padding: winWidth < 768 ? '18px' : '25px',
                    border: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px -5px rgba(0,0,0,0.03)',
                    transition: '0.3s all',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: winWidth < 768 ? '12px' : '20px'
                  }}
                  onMouseEnter={(e) => {
                    if (winWidth >= 1024) {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 25px 35px -10px rgba(0,0,0,0.08)';
                      e.currentTarget.style.borderColor = '#252543ff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(0,0,0,0.03)';
                    e.currentTarget.style.borderColor = '#f1f5f9';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: winWidth < 768 ? '10px' : '14px' }}>
                      <div style={{
                        width: winWidth < 768 ? '44px' : '54px', height: winWidth < 768 ? '44px' : '54px', borderRadius: '14px',
                        background: `linear-gradient(135deg, ${config.color}20 0%, ${config.color}10 100%)`,
                        color: config.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '950', fontSize: winWidth < 768 ? '16px' : '20px',
                        boxShadow: `0 4px 10px ${config.color}15`,
                        flexShrink: 0
                      }}>
                        {(app.applicant_name || app.name || app.candidateName || app.candidate_name || app.full_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '900', fontSize: winWidth < 768 ? '15px' : '17px', color: '#1e293b', letterSpacing: '-0.3px', lineHeight: '1.2' }}>{app.applicant_name || app.name || app.candidateName || app.candidate_name || app.full_name || 'Unknown'}</div>
                        <div style={{ fontSize: winWidth < 768 ? '11px' : '13px', color: '#64748b', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: config.color }}>●</span> {app.position || app.role || app.jobTitle || app.job_title || 'No position'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        padding: '4px 8px', borderRadius: '8px', fontSize: '9px', fontWeight: '900',
                        background: config.bg, color: config.color, border: `1px solid ${config.border}`,
                        display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap'
                      }}>
                        {status}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteApplication(app.id || app._id);
                        }}
                        style={{
                          background: '#fef2f2',
                          border: 'none',
                          color: '#ef4444',
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 4px rgba(239, 68, 68, 0.05)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
                        title="Delete application"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', background: '#f8fafc', padding: winWidth < 768 ? '12px' : '16px', borderRadius: '16px' }}>
                    {(app.email || app.email_id) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: winWidth < 768 ? '12px' : '13px', color: '#475569', fontWeight: '600' }}>
                        <Mail size={14} color="#94a3b8" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.email || app.email_id}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: winWidth < 768 ? '12px' : '13px', color: '#475569', fontWeight: '600' }}>
                      <Clock size={14} color="#94a3b8" />
                      <span>{app.experience || app.experience_years || '0'} years exp.</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#94a3b8', fontWeight: '800' }}>
                      <Calendar size={13} />
                      {formatDate(app.applied_date || app.application_date || app.created_at || app.appliedAt)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {(app.resume_link || app.resume_url || app.resumeUrl) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = resolveResumeUrl(app.resume_link || app.resume_url || app.resumeUrl);
                            setPreviewResumeUrl(url);
                          }}
                          style={{
                            background: 'rgba(13, 148, 136, 0.1)',
                            border: 'none',
                            color: '#0d9488',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '900',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(13, 148, 136, 0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(13, 148, 136, 0.1)'}
                        >
                          <Eye size={12} /> Resume
                        </button>
                      )}
                      <div style={{
                        fontSize: '12px',
                        color: '#787c7bff',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        View <ChevronDown size={12} style={{ transform: 'rotate(-90deg)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="animate-slide-up" style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: winWidth < 768 ? '100%' : '750px',
            borderRadius: winWidth < 768 ? '24px' : '32px',
            maxHeight: winWidth < 768 ? '95vh' : '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 30px 60px -12px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            <div style={{ padding: winWidth < 768 ? '20px 25px' : '30px 40px', background: '#ffffff', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: winWidth < 768 ? '40px' : '50px', height: winWidth < 768 ? '40px' : '50px', borderRadius: '14px', background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(13, 148, 136, 0.2)' }}>
                  <Plus size={winWidth < 768 ? 20 : 24} strokeWidth={3} />
                </div>
                <div>
                  <h2 style={{ fontSize: winWidth < 768 ? '17px' : '20px', fontWeight: '950', color: '#0f172a', margin: 0 }}>Add Application</h2>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0', fontWeight: '500' }}>New talent entry</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
              >
                <X size={18} strokeWidth={3} />
              </button>
            </div>

            <div style={{ padding: winWidth < 768 ? '25px' : '40px', overflowY: 'auto', flex: 1, background: '#f8fafc' }} className="custom-scroll">
              <div style={{ display: 'grid', gridTemplateColumns: winWidth < 768 ? '1fr' : '1fr 1fr', gap: winWidth < 768 ? '16px' : '24px' }}>
                <FormField label="Name" icon={<User size={14} />} name="applicant_name" placeholder="Priya Sharma" value={form.applicant_name} onChange={handleFormChange} required />
                <FormField label="Email" icon={<Mail size={14} />} type="email" name="email" placeholder="priya@example.com" value={form.email} onChange={handleFormChange} />
                <FormField label="Phone" icon={<Phone size={14} />} name="phone" placeholder="+91 98765 43210" value={form.phone} onChange={handleFormChange} />
                <FormField label="Position" icon={<Briefcase size={14} />} name="position" placeholder="Frontend Dev" value={form.position} onChange={handleFormChange} required />
                <FormField label="Dept" icon={<Filter size={14} />} type="select" name="department" value={form.department} onChange={handleFormChange} />
                <FormField label="Exp" icon={<FileText size={14} />} name="experience" placeholder="e.g. 3" value={form.experience} onChange={handleFormChange} />
                <FormField label="Location" icon={<MapPin size={14} />} name="location" placeholder="e.g. Bangalore" value={form.location} onChange={handleFormChange} />
                <FormField label="Date" icon={<Calendar size={14} />} type="date" name="applied_date" value={form.applied_date} onChange={handleFormChange} />
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '900', color: '#1e293b', marginBottom: '10px', paddingLeft: '4px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    <span style={{ color: '#0d9488' }}><Download size={14} /></span> Resume <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="https://... or uploaded file path"
                        value={form.resume_link}
                        onChange={(e) => handleFormChange('resume_link', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          borderRadius: '18px',
                          border: '1.5px solid #e2e8f0',
                          background: '#ffffff',
                          fontWeight: '600',
                          fontSize: '15px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          transition: 'all 0.3s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(13, 148, 136, 0.1)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                      />
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        id="resume-upload-input"
                        style={{ display: 'none' }}
                      />
                      <label
                        htmlFor="resume-upload-input"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '16px 24px',
                          borderRadius: '18px',
                          background: uploadingResume ? '#e2e8f0' : '#0d9488',
                          color: uploadingResume ? '#94a3b8' : 'white',
                          fontWeight: '800',
                          fontSize: '14px',
                          cursor: uploadingResume ? 'not-allowed' : 'pointer',
                          border: 'none',
                          transition: 'all 0.2s',
                          boxShadow: uploadingResume ? 'none' : '0 4px 10px rgba(13, 148, 136, 0.25)',
                          whiteSpace: 'nowrap',
                          boxSizing: 'border-box'
                        }}
                        onMouseEnter={(e) => { if (!uploadingResume) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={(e) => { if (!uploadingResume) e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        {uploadingResume ? (
                          <span>Uploading...</span>
                        ) : (
                          <>
                            <Upload size={16} />
                            <span>Upload PDF</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
                <FormField label="Notes" icon={<FileText size={14} />} type="textarea" name="notes" placeholder="Feedback..." value={form.notes} onChange={handleFormChange} fullWidth />
              </div>
            </div>

            <div style={{ padding: winWidth < 768 ? '20px 25px' : '30px 40px', background: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ flex: 1, padding: winWidth < 768 ? '12px' : '16px', borderRadius: '50px', border: '2px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: winWidth < 768 ? '13px' : '15px', fontWeight: '900', cursor: 'pointer', transition: '0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{
                  flex: 2,
                  padding: winWidth < 768 ? '12px' : '16px',
                  borderRadius: '50px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                  color: 'white',
                  fontSize: winWidth < 768 ? '13px' : '15px',
                  fontWeight: '950',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 10px 20px rgba(13, 148, 136, 0.25)',
                  transition: '0.3s transform'
                }}
                onMouseEnter={(e) => !saving && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => !saving && (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {saving ? '...' : <><Save size={18} strokeWidth={3} /> Submit</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal.show && showDetailModal.app && (() => {
        const app = showDetailModal.app;
        const status = app.status || 'Pending';
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="animate-slide-up" style={{
              background: 'white',
              width: '100%',
              maxWidth: winWidth < 768 ? '100%' : '600px',
              borderRadius: winWidth < 768 ? '24px' : '32px',
              maxHeight: winWidth < 768 ? '95vh' : '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 30px 60px -12px rgba(0,0,0,0.3)',
              position: 'relative'
            }}>
              <div style={{ padding: winWidth < 768 ? '20px 25px' : '30px 40px', background: '#ffffff', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    width: winWidth < 768 ? '44px' : '56px', height: winWidth < 768 ? '44px' : '56px', borderRadius: '16px',
                    background: `linear-gradient(135deg, ${config.color}20 0%, ${config.color}10 100%)`,
                    color: config.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '950', fontSize: winWidth < 768 ? '18px' : '22px',
                    boxShadow: `0 4px 10px ${config.color}15`
                  }}>
                    {(app.applicant_name || app.name || app.candidateName || app.candidate_name || app.full_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ fontSize: winWidth < 768 ? '17px' : '20px', fontWeight: '950', color: '#0f172a', margin: 0 }}>{app.applicant_name || app.name || app.candidateName || app.candidate_name || app.full_name}</h2>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0', fontWeight: '600' }}>{app.position || app.role || app.jobTitle || app.job_title || 'No position'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal({ show: false, app: null })}
                  style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={18} strokeWidth={3} />
                </button>
              </div>

              <div style={{ padding: winWidth < 768 ? '25px' : '40px', overflowY: 'auto', flex: 1, background: '#f8fafc' }} className="custom-scroll">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', padding: '14px 18px', borderRadius: '18px', background: '#ffffff', border: `1.5px solid ${config.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <div style={{ color: config.color }}>{config.icon}</div>
                  <span style={{ fontSize: '13px', fontWeight: '900', color: config.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{status}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: winWidth < 480 ? '1fr' : '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                  {[
                    { label: 'Email', value: app.email || app.email_id || '--', icon: <Mail size={14} color="#94a3b8" /> },
                    { label: 'Phone', value: app.phone || app.phone_number || '--', icon: <Phone size={14} color="#94a3b8" /> },
                    { label: 'Dept', value: app.department || app.team || '--', icon: <Briefcase size={14} color="#94a3b8" /> },
                    { label: 'Exp', value: (app.experience || app.experience_years) ? `${app.experience || app.experience_years}y` : '--', icon: <FileText size={14} color="#94a3b8" /> },
                    { label: 'Loc', value: app.location || app.city || '--', icon: <MapPin size={14} color="#94a3b8" /> },
                    { label: 'Date', value: formatDate(app.applied_date || app.application_date || app.created_at || app.appliedAt), icon: <Calendar size={14} color="#94a3b8" /> },
                  ].map((item, idx) => (
                    <div key={idx} style={{ padding: '14px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>{item.icon} {item.label}</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', wordBreak: 'break-word' }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {(app.resume_link || app.resume_url || app.resumeUrl) && (() => {
                  const resolvedUrl = resolveResumeUrl(app.resume_link || app.resume_url || app.resumeUrl);
                  return (
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '30px' }}>
                      <button
                        onClick={() => setPreviewResumeUrl(resolvedUrl)}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '18px',
                          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe', color: '#1d4ed8',
                          fontWeight: '800', fontSize: '14px', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.05)', cursor: 'pointer', transition: '0.2s',
                          outline: 'none'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <Eye size={18} strokeWidth={2.5} /> Preview Resume PDF
                      </button>
                      <a
                        href={resolvedUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '18px',
                          background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', textDecoration: 'none',
                          fontWeight: '800', fontSize: '14px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', transition: '0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <Download size={18} strokeWidth={2.5} /> Download Resume
                      </a>
                    </div>
                  );
                })()}


                <div style={{ padding: '25px', background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Edit3 size={14} color="#0d9488" /> Update Status & Feedback
                  </div>
                  <textarea
                    placeholder="Add a detailed note or interview feedback..."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', fontWeight: '600', minHeight: '100px', marginBottom: '20px', outline: 'none', resize: 'none', transition: '0.3s all' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#0d9488'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                  />
                  <div style={{ position: 'relative' }}>
                    <select
                      value={status}
                      onChange={(e) => handleStatusUpdate(app.id || app._id, e.target.value, statusNote)}
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        borderRadius: '16px',
                        border: `2px solid ${config.border}`,
                        background: 'white',
                        fontWeight: '800',
                        fontSize: '15px',
                        outline: 'none',
                        cursor: 'pointer',
                        color: config.color,
                        appearance: 'none',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
                      }}
                    >
                      {JOB_STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value} style={{ color: '#000' }}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={20} color={config.color} style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                </div>
              </div>

              <div style={{ padding: '25px 40px', background: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
                <button
                  onClick={() => setShowDetailModal({ show: false, app: null })}
                  style={{ width: '100%', padding: '16px', borderRadius: '50px', border: '2px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '15px', fontWeight: '900', cursor: 'pointer', transition: '0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {previewResumeUrl && (
        <div
          onClick={() => setPreviewResumeUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(12px)',
            zIndex: 20000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '12px',
              width: '100%',
              maxWidth: '850px',
              height: '90vh',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#0d9488" />
                <span style={{ fontWeight: '850', color: '#1e293b', fontSize: '15px' }}>Resume Document Viewer</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <a
                  href={previewResumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    marginRight: '15px',
                    fontSize: '13px',
                    fontWeight: '800',
                    color: '#0d9488',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Download size={14} /> Open in New Tab
                </a>
                <button
                  onClick={() => setPreviewResumeUrl(null)}
                  style={{
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b',
                    transition: '0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
              <iframe
                src={previewResumeUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Resume Preview"
              />
            </div>
          </div>
        </div>
      )}

      {deleteConfirmAppId && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          zIndex: 20000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '30px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.15)',
            border: '1px solid #f1f5f9',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(239, 68, 68, 0.1)'
            }}>
              <Trash2 size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '950', color: '#0f172a', margin: '0 0 8px 0' }}>Delete Application</h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0, fontWeight: '500', lineHeight: '1.5' }}>Are you sure you want to delete this job application? This action cannot be undone.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '10px' }}>
              <button
                onClick={() => setDeleteConfirmAppId(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '50px',
                  border: '2px solid #e2e8f0',
                  background: 'white',
                  color: '#64748b',
                  fontSize: '14px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const id = deleteConfirmAppId;
                  setDeleteConfirmAppId(null);
                  await executeDeleteApplication(id);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '50px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '955',
                  cursor: 'pointer',
                  boxShadow: '0 8px 16px rgba(239, 68, 68, 0.2)',
                  transition: '0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Centered Notification Modal ── */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{
            pointerEvents: 'auto',
            background: notification.type === 'success'
              ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
              : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: `2px solid ${notification.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
            borderRadius: '24px',
            padding: '28px 36px',
            maxWidth: '420px',
            width: '90%',
            boxShadow: notification.type === 'success'
              ? '0 20px 60px rgba(16, 185, 129, 0.25)'
              : '0 20px 60px rgba(239, 68, 68, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            textAlign: 'center',
            animation: 'notifPop 0.3s ease'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: notification.type === 'success'
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #ef4444, #dc2626)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: notification.type === 'success'
                ? '0 8px 20px rgba(16,185,129,0.4)'
                : '0 8px 20px rgba(239,68,68,0.4)'
            }}>
              <span style={{ color: 'white', fontSize: '24px', lineHeight: 1 }}>
                {notification.type === 'success' ? '✓' : '✕'}
              </span>
            </div>
            <p style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: '800',
              color: notification.type === 'success' ? '#065f46' : '#991b1b',
              lineHeight: '1.5'
            }}>
              {notification.message}
            </p>

          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
