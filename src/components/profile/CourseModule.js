import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, BASE_URL } from '../../config';
import './Dashboard.css';
import { FileText, Video, Plus, X, Calendar, BookOpen, AlertCircle, Trash2, ArrowLeft, Upload, CheckCircle } from 'lucide-react';

export default function CourseModule() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeCourses, setActiveCourses] = useState([]);
  const [joinees, setJoinees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Policy',
    deadline: '',
    assigned_to: 'All Employees',
    completed: 0
  });

  const [files, setFiles] = useState({
    pdf: null,
    video: null
  });

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const [resCourses, resJoinees] = await Promise.all([
        fetch(API_ENDPOINTS.NEWJOINEE_COURSES, { headers: { 'Authorization': `Bearer ${user.token}` } }),
        fetch(API_ENDPOINTS.NEW_JOINEES, { headers: { 'Authorization': `Bearer ${user.token}` } })
      ]);
      
      if (resCourses.ok) {
        const data = await resCourses.json();
        setActiveCourses(Array.isArray(data) ? data : (data.active || []));
      }
      
      if (resJoinees.ok) {
        const data = await resJoinees.json();
        setJoinees(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Course/Joinee fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.token) return;

    setSubmitting(true);
    setError(null);

    const uploadData = new FormData();
    Object.keys(formData).forEach(key => {
      uploadData.append(key, formData[key]);
    });
    
    // Add uploaded_by field explicitly as 'HR' as requested
    uploadData.append('uploaded_by', user?.role || 'HR');
    
    if (files.pdf) uploadData.append('pdf', files.pdf);
    if (files.video) uploadData.append('video', files.video);

    try {
      const res = await fetch(API_ENDPOINTS.NEWJOINEE_COURSES, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: uploadData
      });
      
      const respData = await res.json();
      
      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchCourses();
        alert('Course created successfully with provided links!');
      } else {
        setError(respData.message || 'Failed to create course');
      }
    } catch (err) {
      setError('Connection refused. Please check if backend is running.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Policy',
      deadline: '',
      assigned_to: 'All Employees',
      completed: 0
    });
    setFiles({ pdf: null, video: null });
    setUploadProgress(0);
  };

  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      const res = await fetch(`${API_ENDPOINTS.NEWJOINEE_COURSES}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        fetchCourses();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (loading && activeCourses.length === 0) {
    return (
      <div className="hr-dashboard-container">
        <AppHeader />
        <main className="dashboard-content" style={{ textAlign: 'center', paddingTop: '150px' }}>
          <div className="animate-pulse">Loading courses...</div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="hr-dashboard-container">
      <AppHeader />

      <main className="dashboard-content" style={{ paddingBottom: '100px' }}>
        <header className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={() => navigate(-1)}
              className="btn-outline"
              style={{ padding: '8px 12px' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--secondary)' }}>Course Compliance</h1>
              <p style={{ color: 'var(--text-muted)' }}>Track and manage professional development certifications </p>
            </div>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Add course to New joinee
          </button>
        </header>

        <section className="dashboard-section animate-fade-in">
          <h2 className="section-title"><BookOpen size={20} color="var(--primary)" /> Active Courses</h2>
          {activeCourses.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg)', borderRadius: 'var(--radius)', marginTop: '20px' }}>
              No active courses found. Click "Add course to New joinee" to get started.
            </div>
          ) : (
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {activeCourses.map(c => (
                <div key={c.id} className="team-card" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '10px',
                      background: c.category === 'Policy' ? '#fee2e2' : 'var(--primary-light)',
                      color: c.category === 'Policy' ? 'var(--error)' : 'var(--primary)',
                      textTransform: 'uppercase'
                    }}>
                      {c.category || 'General'}
                    </span>
                    <button className="btn-ghost" onClick={() => handleDeleteCourse(c.id)} style={{ padding: '5px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px', color: 'var(--secondary)' }}>{c.title}</h3>
                  {c.joinee_name && (
                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', marginBottom: '8px' }}>
                      Assigned to: <span style={{ color: '#1e293b' }}>{c.joinee_name}</span>
                    </div>
                  )}
                  <p className="course-card-description" style={{ color: 'var(--text-muted)' }}>{c.description || 'No description provided.'}</p>

                  <div style={{ marginBottom: '12px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={12} /> Deadline: {c.deadline || 'No deadline'}
                  </div>

                  <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Completion Progress</span>
                    <span style={{ fontWeight: '900', color: 'var(--primary)' }}>
                      {typeof c.completed === 'number' && typeof c.assigned_to === 'number' ?
                        `${Math.round((c.completed / c.assigned_to) * 100)}%` :
                        (c.completed && c.assigned_to ? 'In Progress' : '0%')
                      }
                    </span>
                  </div>
                  <div className="progress-bar-container" style={{ height: '10px', borderRadius: '5px', background: 'var(--border)', overflow: 'hidden' }}>
                    <div className="progress-bar-fill" style={{
                      width: typeof c.completed === 'number' && typeof c.assigned_to === 'number' ? `${(c.completed / c.assigned_to) * 100}%` : '0%',
                      background: c.category === 'Policy' ? 'var(--error)' : 'linear-gradient(90deg, var(--primary), #5c85d6)',
                      height: '100%'
                    }}></div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    {c.pdf_url && (
                      <a href={getFullUrl(c.pdf_url)} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ flex: 1, textDecoration: 'none', justifyContent: 'center', fontSize: '12px', padding: '10px' }}>
                        <FileText size={14} /> PDF
                      </a>
                    )}
                    {c.video_url && (
                      <a href={getFullUrl(c.video_url)} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ flex: 1, textDecoration: 'none', justifyContent: 'center', fontSize: '12px', padding: '10px' }}>
                        <Video size={14} /> Video
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Modal for adding course */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
            <div className="animate-slide-up" style={{ backgroundColor: 'white', width: '100%', maxWidth: '550px', borderRadius: '24px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              
              <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Plus size={20} strokeWidth={2.5} /> Create New Course
                </h2>
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost" style={{ padding: '5px' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {error && (
                    <div style={{ padding: '12px', background: '#fef2f2', color: 'var(--error)', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>COURSE TITLE</label>
                    <input name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Workplace Code of Conduct" required className="form-input" />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>DESCRIPTION</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief summary of the policy guidelines and compliance requirements..." rows="3" className="form-textarea" style={{ fontFamily: 'Outfit, sans-serif' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>CATEGORY</label>
                      <select name="category" value={formData.category} onChange={handleInputChange} className="form-select">
                        <option>Technical</option>
                        <option>Policy</option>
                        <option>Soft Skills</option>
                        <option>Leadership</option>
                        <option>Compliance</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>DEADLINE</label>
                      <input type="date" name="deadline" value={formData.deadline} onChange={handleInputChange} required className="form-input" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>PDF MATERIAL</label>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', border: '2px dashed var(--text-muted)', borderRadius: '12px', cursor: 'pointer', color: 'var(--secondary)', fontWeight: '800', fontSize: '13px' }}>
                        <Upload size={18} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                          {files.pdf ? files.pdf.name : 'CHOOSE PDF'}
                        </span>
                        <input type="file" name="pdf" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                      </label>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>VIDEO TUTORIAL</label>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', border: '2px dashed var(--text-muted)', borderRadius: '12px', cursor: 'pointer', color: 'var(--secondary)', fontWeight: '800', fontSize: '13px' }}>
                        <Video size={18} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                          {files.video ? files.video.name : 'CHOOSE VIDEO'}
                        </span>
                        <input type="file" name="video" accept="video/*" onChange={handleFileChange} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '20px 30px', borderTop: '1px solid var(--border)', display: 'flex', gap: '15px', justifyContent: 'flex-end', backgroundColor: '#fff' }}>
                  <button type="button" onClick={() => setShowModal(false)} disabled={submitting} className="btn-outline">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? 'Please wait...' : 'Create Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
