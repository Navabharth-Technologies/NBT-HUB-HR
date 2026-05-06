import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config';
import {
  Briefcase, Search, Plus, X, Save, Eye, CheckCircle,
  XCircle, Clock, FileText, Calendar, MapPin, 
  Trash2, Edit3, Filter, ClipboardList, ArrowLeft
} from 'lucide-react';

const FormField = ({ label, icon, type = 'text', name, placeholder, value, onChange, required, fullWidth }) => (
  <div style={{ gridColumn: fullWidth ? 'span 2' : 'auto' }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
      {icon} {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    {type === 'textarea' ? (
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        style={{ width: '100%', padding: '13px 16px', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontWeight: '600', fontSize: '14px', minHeight: '100px', resize: 'vertical', outline: 'none' }}
      />
    ) : (
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        style={{ width: '100%', padding: '13px 16px', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontWeight: '600', fontSize: '14px', outline: 'none' }}
      />
    )}
  </div>
);

export default function JobPostings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [saving, setSaving] = useState(false);
  const [winWidth, setWinWidth] = useState(window.innerWidth);

  const [form, setForm] = useState({
    title: '',
    department: '',
    team: '',
    experience: '',
    location: '',
    requirements: '',
    description: '',
    status: 'Open',
    type: 'Full-time'
  });

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchPostings = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.JOB_POSTINGS, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPostings(Array.isArray(data) ? data : (data?.data || []));
      }
    } catch (err) {
      console.error('Fetch job postings error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostings();
  }, [user]);

  const resetForm = () => {
    setForm({
      title: '',
      department: '',
      team: '',
      experience: '',
      location: '',
      requirements: '',
      description: '',
      status: 'Open',
      type: 'Full-time'
    });
    setEditingPost(null);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.department) {
      alert('Please fill in Job Title and Department');
      return;
    }
    setSaving(true);
    try {
      const url = editingPost 
        ? API_ENDPOINTS.JOB_POSTING_PUT(editingPost.id) 
        : API_ENDPOINTS.JOB_POSTINGS;
      
      const method = editingPost ? 'PUT' : 'POST';

      // Robust UUID generator fallback for non-secure contexts
      const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const finalWebsiteId = editingPost?.website_id || editingPost?.websiteId || generateUUID();

      // Ensure team is sent for backend sync and generate website_id for external portal
      const payload = {
        ...form,
        team: form.department,
        job_type: form.type, // Map type to job_type for backend/external sync
        website_id: finalWebsiteId,
        websiteId: finalWebsiteId
      };
      
      console.log('🚀 [FRONTEND] Sending job payload to backend:', payload);

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(editingPost ? 'Vacancy updated successfully ✅' : 'Vacancy posted successfully ✅');
        setShowAddModal(false);
        resetForm();
        fetchPostings();
      } else {
        alert('Failed to save vacancy');
      }
    } catch (err) {
      console.error('Save posting error:', err);
      alert('Network error.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vacancy?')) return;
    try {
      const res = await fetch(API_ENDPOINTS.JOB_POSTING_DELETE(id), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        fetchPostings();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const filteredPostings = postings.filter(post => 
    post.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    post.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#eaeff2' }}>
      <AppHeader />

      <main style={{ paddingTop: winWidth < 768 ? '100px' : '120px', paddingLeft: winWidth < 768 ? '16px' : '26px', paddingRight: winWidth < 768 ? '16px' : '26px', paddingBottom: '100px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={() => navigate(-1)} 
              style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowLeft size={18} color="#64748b" />
            </button>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Job Vacancies</h1>
              <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Manage internal and external job openings</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
          >
            <Plus size={20} /> Create Vacancy
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '30px', maxWidth: '500px' }}>
          <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search vacancies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '14px 15px 14px 45px', borderRadius: '16px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', fontWeight: '600' }}
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
        ) : filteredPostings.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {filteredPostings.map((post) => (
              <div key={post.id} style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px' }}>
                    <Briefcase size={22} color="#3b82f6" />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setEditingPost(post); setForm(post); setShowAddModal(true); }} style={{ padding: '8px', borderRadius: '10px', border: 'none', background: '#f8fafc', color: '#64748b', cursor: 'pointer' }}><Edit3 size={16} /></button>
                    <button onClick={() => handleDelete(post.id)} style={{ padding: '8px', borderRadius: '10px', border: 'none', background: '#fff1f2', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', marginBottom: '4px' }}>{post.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', fontWeight: '700', marginBottom: '16px' }}>
                  <span>{post.department}</span>
                  <span>•</span>
                  <span>{post.location}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
                    <Clock size={14} color="#94a3b8" />
                    <span>{post.experience} experience</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
                    <ClipboardList size={14} color="#94a3b8" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.requirements}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: post.status === 'Open' ? '#10b981' : '#64748b' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: post.status === 'Open' ? '#10b981' : '#64748b' }} />
                    {post.status?.toUpperCase()}
                  </div>
                  <button onClick={() => { setEditingPost(post); setForm(post); setShowAddModal(true); }} style={{ border: 'none', background: 'none', color: '#3b82f6', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>View Details</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '100px', background: 'white', borderRadius: '30px', border: '2px dashed #e2e8f0' }}>
            <Briefcase size={40} color="#cbd5e1" style={{ marginBottom: '16px' }} />
            <p style={{ color: '#64748b', fontWeight: '700' }}>No job vacancies posted yet.</p>
          </div>
        )}

      </main>

      {/* Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '700px', borderRadius: '30px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '25px 30px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', margin: 0 }}>{editingPost ? 'Edit Vacancy' : 'Post New Vacancy'}</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '30px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <FormField label="Job Title" name="title" value={form.title} onChange={(n, v) => setForm({...form, [n]: v})} placeholder="e.g. Senior Frontend Developer" required />
                <FormField label="Department" name="department" value={form.department} onChange={(n, v) => setForm({...form, [n]: v})} placeholder="e.g. Engineering" required />
                <FormField label="Experience Required" name="experience" value={form.experience} onChange={(n, v) => setForm({...form, [n]: v})} placeholder="e.g. 5+ years" />
                <FormField label="Location" name="location" value={form.location} onChange={(n, v) => setForm({...form, [n]: v})} placeholder="e.g. Remote / Bangalore" />
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Job Type</label>
                  <select 
                    value={form.type} 
                    onChange={(e) => setForm({...form, type: e.target.value})}
                    style={{ width: '100%', padding: '13px 16px', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontWeight: '600', fontSize: '14px', outline: 'none' }}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Status</label>
                  <select 
                    value={form.status} 
                    onChange={(e) => setForm({...form, status: e.target.value})}
                    style={{ width: '100%', padding: '13px 16px', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontWeight: '600', fontSize: '14px', outline: 'none' }}
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <FormField label="Requirements" name="requirements" type="textarea" value={form.requirements} onChange={(n, v) => setForm({...form, [n]: v})} placeholder="Key skills and requirements..." fullWidth />
                <FormField label="Job Description (JD)" name="description" type="textarea" value={form.description} onChange={(n, v) => setForm({...form, [n]: v})} placeholder="Detailed job description..." fullWidth />
              </div>
            </div>
            <div style={{ padding: '20px 30px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '15px' }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '50px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '800', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: '14px', borderRadius: '50px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}>
                {saving ? 'Saving...' : (editingPost ? 'Update Vacancy' : 'Post Vacancy')}
              </button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
