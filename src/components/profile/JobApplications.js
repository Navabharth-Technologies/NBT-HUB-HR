import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config';
import {
  Briefcase, Search, Plus, X, Save, Eye, CheckCircle,
  XCircle, Clock, User, Mail, Phone, FileText, Calendar,
  MapPin, ChevronDown, Filter, Download, ClipboardList, Edit3
} from 'lucide-react';

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
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(13, 148, 136, 0.1)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
        >
          <option value="">Select Department</option>
          <option value="Technical Support">Technical Support</option>
          <option value="Development">Development</option>
          <option value="Marketing">Marketing</option>
          <option value="HR">HR</option>
          <option value="Design">Design</option>
          <option value="Operations">Operations</option>
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

  const handleSubmit = async () => {
    if (!form.applicant_name || !form.position) {
      alert('Please fill in Applicant Name and Position');
      return;
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
        alert('Application added successfully ✅');
        setShowAddModal(false);
        resetForm();
        fetchApplications();
      } else {
        const result = await res.json().catch(() => ({}));
        alert(`Failed to add: ${result.message || result.error || 'Server error'}`);
      }
    } catch (err) {
      console.error('Add application error:', err);
      alert('Network error. Could not connect to server.');
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
        alert('Candidate status updated and synced to portal! ✅');
        setShowDetailModal({ show: false, app: null });
        setStatusNote('');
        setTimeout(() => fetchApplications(), 300);
      } else {
        alert(result.error || result.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Update failed:', error);
      alert('Network error while updating status');
    }
  };

  const filteredApps = applications.filter(app => {
    const name = (app.applicant_name || app.name || app.candidateName || app.candidate_name || app.full_name || '').toLowerCase();
    const pos = (app.position || app.role || app.jobTitle || app.job_title || '').toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || pos.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || (app.status || 'Pending') === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    All: applications.length,
    APPLIED: applications.filter(a => (a.status || 'Pending') === 'APPLIED' || a.status === 'Pending').length,
    SCREENING: applications.filter(a => a.status === 'SCREENING').length,
    HIRED: applications.filter(a => a.status === 'HIRED').length,
    REJECTED: applications.filter(a => a.status === 'REJECTED').length,
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
        paddingTop: winWidth < 768 ? '80px' : '100px',
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
            <div style={{ 
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', 
              padding: winWidth < 768 ? '10px' : '14px', 
              borderRadius: '16px', 
              boxShadow: '0 8px 16px rgba(13, 148, 136, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Briefcase size={winWidth < 768 ? 22 : 28} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: winWidth < 768 ? '20px' : '28px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>New Hirings</h1>
              <p style={{ fontSize: winWidth < 768 ? '11px' : '14px', color: '#64748b', margin: '2px 0 0 0', fontWeight: '500' }}>Manage talent pipeline and flow</p>
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
            <button
              onClick={() => navigate('/job-postings')}
              style={{ 
                flex: winWidth < 640 ? 1 : 'none',
                background: '#ffffff', 
                color: '#1e293b', 
                border: '1.5px solid #e2e8f0', 
                padding: winWidth < 768 ? '10px 16px' : '14px 28px', 
                borderRadius: '14px', 
                fontWeight: '800', 
                fontSize: winWidth < 768 ? '12px' : '14px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '6px', 
                transition: '0.3s all' 
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <ClipboardList size={winWidth < 768 ? 16 : 20} />
              Vacancy
            </button>
          </div>
        </div>

        <div className="custom-scroll" style={{ 
          display: 'flex', 
          background: 'rgba(255, 255, 255, 0.5)',
          padding: '4px',
          borderRadius: '20px',
          marginBottom: '25px', 
          width: '100%',
          maxWidth: 'fit-content',
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
                background: filterStatus === status ? '#ffffff' : 'transparent',
                color: filterStatus === status ? '#0d9488' : '#64748b',
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
                background: filterStatus === status ? '#0d948815' : '#f1f5f9',
                color: filterStatus === status ? '#0d9488' : '#64748b',
                padding: '1px 6px', 
                borderRadius: '8px', 
                fontSize: '10px', 
                fontWeight: '900'
              }}>{count}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '30px' }}>
          <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by name, position or department..."
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
              onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
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
                      e.currentTarget.style.borderColor = '#e2e8f0';
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
                    <div style={{
                      padding: '4px 8px', borderRadius: '8px', fontSize: '9px', fontWeight: '900',
                      background: config.bg, color: config.color, border: `1px solid ${config.border}`,
                      display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap'
                    }}>
                      {status}
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
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#0d9488', 
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
                <FormField label="Name" icon={<User size={14} />} name="applicant_name" placeholder="Priya Sharma" value={form.applicant_name} onChange={(n, v) => setForm({...form, [n]: v})} required />
                <FormField label="Email" icon={<Mail size={14} />} type="email" name="email" placeholder="priya@example.com" value={form.email} onChange={(n, v) => setForm({...form, [n]: v})} />
                <FormField label="Phone" icon={<Phone size={14} />} name="phone" placeholder="+91 98765 43210" value={form.phone} onChange={(n, v) => setForm({...form, [n]: v})} />
                <FormField label="Position" icon={<Briefcase size={14} />} name="position" placeholder="Frontend Dev" value={form.position} onChange={(n, v) => setForm({...form, [n]: v})} required />
                <FormField label="Dept" icon={<Filter size={14} />} type="select" name="department" value={form.department} onChange={(n, v) => setForm({...form, [n]: v})} />
                <FormField label="Exp" icon={<FileText size={14} />} name="experience" placeholder="e.g. 3" value={form.experience} onChange={(n, v) => setForm({...form, [n]: v})} />
                <FormField label="Location" icon={<MapPin size={14} />} name="location" placeholder="e.g. Bangalore" value={form.location} onChange={(n, v) => setForm({...form, [n]: v})} />
                <FormField label="Date" icon={<Calendar size={14} />} type="date" name="applied_date" value={form.applied_date} onChange={(n, v) => setForm({...form, [n]: v})} />
                <FormField label="Resume" icon={<Download size={14} />} name="resume_link" placeholder="https://..." value={form.resume_link} onChange={(n, v) => setForm({...form, [n]: v})} fullWidth />
                <FormField label="Notes" icon={<FileText size={14} />} type="textarea" name="notes" placeholder="Feedback..." value={form.notes} onChange={(n, v) => setForm({...form, [n]: v})} fullWidth />
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

                {(app.resume_link || app.resume_url || app.resumeUrl) && (
                  <a href={app.resume_link || app.resume_url || app.resumeUrl} target="_blank" rel="noreferrer" style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '18px', borderRadius: '18px',
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe', color: '#1d4ed8', textDecoration: 'none',
                    fontWeight: '800', fontSize: '14px', marginBottom: '30px', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.1)', transition: '0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <Download size={20} strokeWidth={2.5} /> Download / View Resume (CV)
                  </a>
                )}

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
                          <option key={opt.value} value={opt.value}>
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

      <AppFooter />
    </div>
  );
}
