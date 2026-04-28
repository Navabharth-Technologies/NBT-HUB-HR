import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, BASE_URL } from '../../config';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { 
  Calendar, Clock, CheckCircle, XCircle, 
  ChevronLeft, Plus, Info, AlertCircle,
  FileText, Briefcase, User, Send,
  ArrowRight, Filter, Download
} from 'lucide-react';

export default function MyLeaves() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [winWidth, setWinWidth] = useState(window.innerWidth);

  const [formData, setFormData] = useState({
    leave_type: 'Casual Leave',
    start_date: '',
    end_date: '',
    reason: '',
    is_half_day: false
  });

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchMyLeaves = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.LEAVES_GET, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || data.all || []);
        // Filter for current user by ID or EmpCode
        const myData = list.filter(l => 
          String(l.user_id) === String(user.id) || 
          String(l.Empcode) === String(user.emp_id) ||
          String(l.employee_id) === String(user.id)
        );
        setLeaves(myData.sort((a, b) => new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date)));
      }
    } catch (err) {
      console.error('Fetch leaves error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.start_date || !formData.reason) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(API_ENDPOINTS.LEAVES_GET.replace('/all', ''), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          ...formData,
          user_id: user.id,
          employee_name: user.name,
          status: 'PENDING'
        })
      });

      if (res.ok) {
        setShowModal(false);
        setFormData({
          leave_type: 'Casual Leave',
          start_date: '',
          end_date: '',
          reason: '',
          is_half_day: false
        });
        fetchMyLeaves();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to submit leave request');
      }
    } catch (err) {
      console.error('Submit leave error:', err);
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status) => {
    const s = String(status || 'PENDING').toUpperCase();
    if (s.includes('APPROVED')) return { bg: '#f0fdf4', color: '#166534', icon: <CheckCircle size={14} /> };
    if (s.includes('REJECTED')) return { bg: '#fef2f2', color: '#991b1b', icon: <XCircle size={14} /> };
    return { bg: '#fffbeb', color: '#92400e', icon: <Clock size={14} /> };
  };

  const stats = [
    { label: 'Total Requests', value: leaves.length, icon: <FileText size={20} color="#6366f1" />, bg: '#eef2ff' },
    { label: 'Approved', value: leaves.filter(l => String(l.status).toUpperCase().includes('APPROVED')).length, icon: <CheckCircle size={20} color="#22c55e" />, bg: '#f0fdf4' },
    { label: 'Pending', value: leaves.filter(l => String(l.status).toUpperCase().includes('PENDING')).length, icon: <Clock size={20} color="#f59e0b" />, bg: '#fffbeb' },
    { label: 'Rejected', value: leaves.filter(l => String(l.status).toUpperCase().includes('REJECTED')).length, icon: <XCircle size={20} color="#ef4444" />, bg: '#fef2f2' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      
      <main style={{ flex: 1, padding: winWidth < 768 ? '15px' : '30px 40px', marginTop: winWidth < 768 ? '80px' : '100px' }}>
        {/* Breadcrumb & Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <button 
              onClick={() => navigate(-1)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginBottom: '8px', padding: 0 }}
            >
              <ChevronLeft size={16} /> Back
            </button>
            <h1 style={{ fontSize: winWidth < 768 ? '24px' : '32px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>My Leaves</h1>
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', 
              borderRadius: '14px', background: '#0f172a', color: 'white', border: 'none', 
              fontWeight: '800', fontSize: '14px', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.2)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={18} /> Request Leave
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: winWidth < 600 ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ background: stat.bg, padding: '10px', borderRadius: '12px' }}>{stat.icon}</div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Leaves Table/List */}
        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Leave History</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ padding: '8px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer' }}><Filter size={18} /></button>
              <button style={{ padding: '8px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer' }}><Download size={18} /></button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #0f172a', borderRadius: '50%', margin: '0 auto 15px', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Fetching your leaves...</p>
            </div>
          ) : leaves.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Leave Type</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Duration</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Reason</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((l, i) => {
                    const style = getStatusStyle(l.status);
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ padding: '8px', background: '#f1f5f9', borderRadius: '10px' }}><Briefcase size={16} color="#64748b" /></div>
                            <span style={{ fontWeight: '700', color: '#1e293b' }}>{l.leave_type}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '13px' }}>{l.start_date} {l.end_date ? `to ${l.end_date}` : ''}</span>
                            {l.is_half_day && <span style={{ fontSize: '11px', color: '#0ea5e9', fontWeight: '800' }}>Half Day</span>}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.reason}</p>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
                            borderRadius: '10px', background: style.bg, color: style.color, fontSize: '11px', fontWeight: '900' 
                          }}>
                            {style.icon}
                            {String(l.status).split(',')[0]}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>
                          {l.created_at ? new Date(l.created_at).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
              <div style={{ background: '#f8fafc', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Calendar size={30} color="#94a3b8" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>No leave requests yet</h3>
              <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '300px', margin: '0 auto 20px' }}>You haven't submitted any leave requests. Your leave history will appear here.</p>
              <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', borderRadius: '12px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#1e293b', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>Apply for Leave</button>
            </div>
          )}
        </div>
      </main>

      <AppFooter />

      {/* Leave Request Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '30px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Request New Leave</h2>
              <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Leave Type</label>
                <select 
                  value={formData.leave_type}
                  onChange={e => setFormData({...formData, leave_type: e.target.value})}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontWeight: '700', fontSize: '14px', outline: 'none' }}
                >
                  <option>Casual Leave</option>
                  <option>Sick Leave</option>
                  <option>Earned Leave</option>
                  <option>LOP (Loss of Pay)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>From Date</label>
                  <input 
                    type="date" 
                    value={formData.start_date}
                    onChange={e => setFormData({...formData, start_date: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontWeight: '700', fontSize: '14px', outline: 'none' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>To Date (Optional)</label>
                  <input 
                    type="date" 
                    value={formData.end_date}
                    onChange={e => setFormData({...formData, end_date: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontWeight: '700', fontSize: '14px', outline: 'none' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="halfday" 
                  checked={formData.is_half_day}
                  onChange={e => setFormData({...formData, is_half_day: e.target.checked})}
                />
                <label htmlFor="halfday" style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', cursor: 'pointer' }}>Apply as Half Day</label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Reason for Leave</label>
                <textarea 
                  rows="3" 
                  placeholder="Explain why you need leave..."
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontWeight: '600', fontSize: '14px', outline: 'none', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '800', cursor: 'pointer' }}>Cancel</button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  style={{ 
                    flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#0f172a', 
                    color: 'white', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', gap: '8px' 
                  }}
                >
                  {submitting ? 'Sending...' : <><Send size={18} /> Submit Request</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
