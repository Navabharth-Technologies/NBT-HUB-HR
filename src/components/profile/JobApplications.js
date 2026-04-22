import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config';
import {
  Briefcase, Search, Plus, X, Save, Eye, CheckCircle,
  XCircle, Clock, User, Mail, Phone, FileText, Calendar,
  MapPin, ChevronDown, Filter, Download, ClipboardList
} from 'lucide-react';

const STATUS_CONFIG = {
  Pending: { color: '#f59e0b', bg: '#fffbeb', border: '#fef3c7', icon: <Clock size={14} /> },
  Shortlisted: { color: '#3b82f6', bg: '#eff6ff', border: '#dbeafe', icon: <Eye size={14} /> },
  Interview: { color: '#8b5cf6', bg: '#f5f3ff', border: '#ede9fe', icon: <User size={14} /> },
  Selected: { color: '#10b981', bg: '#ecfdf5', border: '#d1fae5', icon: <CheckCircle size={14} /> },
  Rejected: { color: '#ef4444', bg: '#fef2f2', border: '#fee2e2', icon: <XCircle size={14} /> },
};

export default function JobApplications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState({ show: false, app: null });
  const [saving, setSaving] = useState(false);
  const [winWidth, setWinWidth] = useState(window.innerWidth);

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

  const handleStatusUpdate = async (appId, newStatus) => {
    try {
      const res = await fetch(API_ENDPOINTS.JOB_APPLICATION_UPDATE(appId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setShowDetailModal({ show: false, app: null });
        setTimeout(() => fetchApplications(), 300);
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const filteredApps = applications.filter(app => {
    const name = (app.applicant_name || app.name || '').toLowerCase();
    const pos = (app.position || app.role || '').toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || pos.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || (app.status || 'Pending') === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    All: applications.length,
    Pending: applications.filter(a => (a.status || 'Pending') === 'Pending').length,
    Shortlisted: applications.filter(a => a.status === 'Shortlisted').length,
    Interview: applications.filter(a => a.status === 'Interview').length,
    Selected: applications.filter(a => a.status === 'Selected').length,
    Rejected: applications.filter(a => a.status === 'Rejected').length,
  };

  const formatDate = (d) => {
    if (!d) return '--';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return d; }
  };

  // Input field component for modal
  const FormField = ({ label, icon, type = 'text', name, placeholder, value, onChange, required, fullWidth }) => (
    <div style={{ gridColumn: fullWidth ? 'span 2' : 'auto' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', paddingLeft: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {icon} {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          style={{ width: '100%', padding: '13px 16px', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontWeight: '600', fontSize: '14px', minHeight: '80px', resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
        />
      ) : type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          style={{ width: '100%', padding: '13px 16px', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontWeight: '600', fontSize: '14px', outline: 'none', cursor: 'pointer', boxSizing: 'border-box', appearance: 'none' }}
        >
          <option value="">Select Department</option>
          <option value="Technical Support">Technical Support</option>
          <option value="Development">Development</option>
          <option value="Marketing">Marketing</option>
          <option value="HR">HR</option>
          <option value="Design">Design</option>
          <option value="Operations">Operations</option>
        </select>
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          style={{ width: '100%', padding: '13px 16px', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontWeight: '600', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
        />
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <AppHeader />

      <main style={{
        paddingTop: winWidth < 768 ? '80px' : '100px',
        paddingLeft: winWidth < 768 ? '15px' : '30px',
        paddingRight: winWidth < 768 ? '15px' : '30px',
        paddingBottom: '100px',
        boxSizing: 'border-box'
      }}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', width: '100%', flexWrap: 'wrap', marginBottom: '25px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: 'white', padding: '12px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <Briefcase size={24} color="#0d9488" />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: 0 }}>New Hirings</h1>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '2px 0 0 0' }}>Track and manage incoming candidate applications</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            style={{ background: '#0d9488', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 15px rgba(13, 148, 136, 0.2)', transition: '0.2s' }}
          >
            <Plus size={18} />
            Add Application
          </button>
          <button
            onClick={() => navigate('/job-postings')}
            style={{ background: '#334155', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 15px rgba(51, 65, 85, 0.2)', transition: '0.2s' }}
          >
            <ClipboardList size={18} />
            Post Vacancy
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '8px 16px', borderRadius: '12px', border: 'none',
                background: filterStatus === status ? (status === 'All' ? '#0d9488' : (STATUS_CONFIG[status]?.color || '#0d9488')) : 'white',
                color: filterStatus === status ? 'white' : '#64748b',
                fontWeight: '800', fontSize: '12px', cursor: 'pointer',
                boxShadow: filterStatus === status ? `0 4px 12px ${STATUS_CONFIG[status]?.color || '#0d9488'}33` : '0 1px 3px rgba(0,0,0,0.05)',
                transition: '0.2s', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              {status}
              <span style={{
                background: filterStatus === status ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                padding: '1px 7px', borderRadius: '8px', fontSize: '11px', fontWeight: '900'
              }}>{count}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
          <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by name or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px 15px 12px 45px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Applications Cards Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <div style={{ fontSize: '14px', fontWeight: '700' }}>Loading applications...</div>
          </div>
        ) : filteredApps.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: winWidth < 640 ? '1fr' : (winWidth < 1024 ? '1fr 1fr' : 'repeat(3, 1fr)'),
            gap: '18px'
          }}>
            {filteredApps.map((app, i) => {
              const status = app.status || 'Pending';
              const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
              return (
                <div
                  key={app.id || i}
                  onClick={() => setShowDetailModal({ show: true, app })}
                  style={{
                    background: 'white', borderRadius: '20px', padding: '22px',
                    border: '1px solid #f1f5f9', cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    position: 'relative', overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 20px -4px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.04)'; }}
                >
                  {/* Top Section */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '46px', height: '46px', borderRadius: '14px',
                        background: `${config.color}12`, color: config.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '900', fontSize: '18px'
                      }}>
                        {(app.applicant_name || app.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '15px', color: '#1e293b' }}>{app.applicant_name || app.name || 'Unknown'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>{app.position || app.role || 'No position'}</div>
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800',
                      background: config.bg, color: config.color, border: `1px solid ${config.border}`,
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      {config.icon} {status}
                    </div>
                  </div>

                  {/* Info Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(app.email || app.email_id) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                        <Mail size={13} color="#94a3b8" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.email || app.email_id}</span>
                      </div>
                    )}
                    {(app.department || app.team) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                        <Briefcase size={13} color="#94a3b8" />
                        <span>{app.department || app.team}</span>
                      </div>
                    )}
                    {(app.experience || app.experience_years) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                        <FileText size={13} color="#94a3b8" />
                        <span>{app.experience || app.experience_years} years exp.</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Date */}
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>
                      <Calendar size={12} />
                      {formatDate(app.applied_date || app.application_date || app.created_at)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '800', cursor: 'pointer' }}>View Details →</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            padding: '60px', background: 'white', borderRadius: '24px',
            border: '2px dashed #cbd5e1', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
          }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={24} color="#0d9488" />
            </div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#475569' }}>No Applications Found</div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
              {searchTerm || filterStatus !== 'All' ? 'Try adjusting your search or filter' : 'Click "Add Application" to start tracking candidates'}
            </div>
          </div>
        )}
      </main>

      {/* ========== ADD APPLICATION MODAL ========== */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '720px', borderRadius: '28px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            {/* Modal Header */}
            <div style={{ padding: '22px 30px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '13px', background: '#0d9488', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Add New Application</h2>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Record a candidate's job application</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '28px 30px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: winWidth < 550 ? '1fr' : '1fr 1fr', gap: '18px' }}>
                <FormField label="Applicant Name" icon={<User size={12} />} name="applicant_name" placeholder="e.g. Priya Sharma" value={form.applicant_name} onChange={(n, v) => setForm({...form, [n]: v})} required />
                <FormField label="Email Address" icon={<Mail size={12} />} type="email" name="email" placeholder="priya@example.com" value={form.email} onChange={(n, v) => setForm({...form, [n]: v})} />
                <FormField label="Phone Number" icon={<Phone size={12} />} name="phone" placeholder="+91 98765 43210" value={form.phone} onChange={(n, v) => setForm({...form, [n]: v})} />
                <FormField label="Position Applied" icon={<Briefcase size={12} />} name="position" placeholder="e.g. Frontend Developer" value={form.position} onChange={(n, v) => setForm({...form, [n]: v})} required />
                <FormField label="Department" icon={<Filter size={12} />} type="select" name="department" value={form.department} onChange={(n, v) => setForm({...form, [n]: v})} />
                <FormField label="Experience (Years)" icon={<FileText size={12} />} name="experience" placeholder="e.g. 3" value={form.experience} onChange={(n, v) => setForm({...form, [n]: v})} />
                <FormField label="Location" icon={<MapPin size={12} />} name="location" placeholder="e.g. Bangalore" value={form.location} onChange={(n, v) => setForm({...form, [n]: v})} />
                <FormField label="Applied Date" icon={<Calendar size={12} />} type="date" name="applied_date" value={form.applied_date} onChange={(n, v) => setForm({...form, [n]: v})} />
                <FormField label="Resume Link" icon={<Download size={12} />} name="resume_link" placeholder="https://drive.google.com/..." value={form.resume_link} onChange={(n, v) => setForm({...form, [n]: v})} fullWidth />
                <FormField label="Notes / Remarks" icon={<FileText size={12} />} type="textarea" name="notes" placeholder="Any additional notes about the candidate..." value={form.notes} onChange={(n, v) => setForm({...form, [n]: v})} fullWidth />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '20px 30px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ flex: 1, padding: '13px', borderRadius: '50px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{ flex: 2, padding: '13px', borderRadius: '50px', border: 'none', background: '#0d9488', color: 'white', fontSize: '14px', fontWeight: '800', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.2)' }}
              >
                {saving ? 'Saving...' : <><Save size={16} /> Submit Application</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== DETAIL / STATUS MODAL ========== */}
      {showDetailModal.show && showDetailModal.app && (() => {
        const app = showDetailModal.app;
        const status = app.status || 'Pending';
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'white', width: '100%', maxWidth: '560px', borderRadius: '28px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              {/* Detail Header */}
              <div style={{ padding: '25px 30px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '15px',
                    background: `${config.color}15`, color: config.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '900', fontSize: '20px'
                  }}>
                    {(app.applicant_name || app.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', margin: 0 }}>{app.applicant_name || app.name}</h2>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{app.position || app.role || 'No position'}</p>
                  </div>
                </div>
                <button onClick={() => setShowDetailModal({ show: false, app: null })} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
              </div>

              {/* Detail Body */}
              <div style={{ padding: '25px 30px', overflowY: 'auto', flex: 1 }}>
                {/* Current Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px', padding: '12px 16px', borderRadius: '14px', background: config.bg, border: `1px solid ${config.border}` }}>
                  {config.icon}
                  <span style={{ fontSize: '13px', fontWeight: '800', color: config.color }}>Current Status: {status}</span>
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  {[
                    { label: 'Email', value: app.email || app.email_id || '--', icon: <Mail size={13} color="#94a3b8" /> },
                    { label: 'Phone', value: app.phone || app.phone_number || '--', icon: <Phone size={13} color="#94a3b8" /> },
                    { label: 'Department', value: app.department || app.team || '--', icon: <Briefcase size={13} color="#94a3b8" /> },
                    { label: 'Experience', value: (app.experience || app.experience_years) ? `${app.experience || app.experience_years} years` : '--', icon: <FileText size={13} color="#94a3b8" /> },
                    { label: 'Location', value: app.location || app.city || '--', icon: <MapPin size={13} color="#94a3b8" /> },
                    { label: 'Applied', value: formatDate(app.applied_date || app.application_date || app.created_at), icon: <Calendar size={13} color="#94a3b8" /> },
                  ].map((item, idx) => (
                    <div key={idx} style={{ padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>{item.icon} {item.label}</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', wordBreak: 'break-word' }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {(app.notes || app.remarks) && (
                  <div style={{ padding: '14px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #f1f5f9', marginBottom: '24px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Notes</div>
                    <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>{app.notes || app.remarks}</div>
                  </div>
                )}

                {/* Resume Link */}
                {(app.resume_link || app.resume_url) && (
                  <a href={app.resume_link || app.resume_url} target="_blank" rel="noreferrer" style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '12px',
                    background: '#eff6ff', border: '1px solid #dbeafe', color: '#2563eb', textDecoration: 'none',
                    fontWeight: '700', fontSize: '13px', marginBottom: '24px'
                  }}>
                    <Download size={16} /> View Resume
                  </a>
                )}

                {/* Status Update Actions */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Update Status</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {Object.entries(STATUS_CONFIG).map(([sName, sConfig]) => (
                      <button
                        key={sName}
                        disabled={status === sName}
                        onClick={() => handleStatusUpdate(app.id || app._id, sName)}
                        style={{
                          padding: '8px 14px', borderRadius: '10px', border: `1.5px solid ${sConfig.border}`,
                          background: status === sName ? sConfig.color : sConfig.bg,
                          color: status === sName ? 'white' : sConfig.color,
                          fontWeight: '800', fontSize: '12px', cursor: status === sName ? 'default' : 'pointer',
                          opacity: status === sName ? 0.7 : 1,
                          display: 'flex', alignItems: 'center', gap: '5px', transition: '0.2s'
                        }}
                      >
                        {sConfig.icon} {sName}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detail Footer */}
              <div style={{ padding: '18px 30px', borderTop: '1px solid #f1f5f9' }}>
                <button
                  onClick={() => setShowDetailModal({ show: false, app: null })}
                  style={{ width: '100%', padding: '13px', borderRadius: '50px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Close
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
