import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config';
import {
    ChevronLeft, Send, LogOut, Clock, AlertCircle, Calendar, X, User, ExternalLink
} from 'lucide-react';

export default function ResignationUserScreen() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('submit'); // 'submit' or 'history' (Team notice)
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const isAdmin = String(user?.role || '').toLowerCase() === 'admin' || String(user?.role || '').toLowerCase().includes('hr');

    // Form state
    const [formData, setFormData] = useState({
        resignation_date: new Date().toISOString().split('T')[0],
        last_working_day: '',
        primary_reason: '',
        letter_content: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [winWidth, setWinWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWinWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchMyRequests();
    }, [user]);

    const fetchMyRequests = async () => {
        if (!user?.token) return;
        try {
            setLoading(true);
            const employeeId = user.employee_id || user.id;

            // In HR app, we show all resignations in this screen for HR users
            const endpoint = API_ENDPOINTS.RESIGNATIONS_GET;

            const res = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            if (res.ok) {
                const result = await res.json();
                let actualData = [];
                if (Array.isArray(result)) {
                    actualData = result;
                } else if (result.data && Array.isArray(result.data)) {
                    actualData = result.data;
                } else if (result.resignations && Array.isArray(result.resignations)) {
                    actualData = result.resignations;
                } else if (result.requests && Array.isArray(result.requests)) {
                    actualData = result.requests;
                } else if (result.data && !Array.isArray(result.data) && Array.isArray(result.data.requests)) {
                    actualData = result.data.requests;
                } else if (result.data && !Array.isArray(result.data) && Array.isArray(result.data.resignations)) {
                    actualData = result.data.resignations;
                }

                // No client-side filtering needed in HR app, we show all requests

                // Fetch employees to get names for the global list
                if (actualData.length > 0) {
                    try {
                        const empRes = await fetch(API_ENDPOINTS.EMPLOYEES, { headers: { 'Authorization': `Bearer ${user.token}` } });
                        if (empRes.ok) {
                            const empData = await empRes.json();
                            const empMap = {};
                            const employees = Array.isArray(empData) ? empData : (empData.data || []);
                            if (Array.isArray(employees)) {
                                employees.forEach(e => empMap[String(e.id || e.employee_id)] = e.name);
                            }
                            actualData = actualData.map(r => ({
                                ...r,
                                employee_name: r.employee_name || empMap[String(r.employee_id)] || 'Employee'
                            }));
                        }
                    } catch (e) { console.error('Emp fetch error', e); }
                }

                setRequests(actualData);
            }
        } catch (error) { console.error('Fetch error:', error); }
        finally { setLoading(false); }
    };

    const handleFormSubmit = async () => {
        if (!formData.last_working_day || !formData.primary_reason || !user?.token) {
            alert('Please fill all required fields.');
            return;
        }

        // Built-in deduplication: Check if CURRENT USER already has a pending request
        const currentUserId = String(user.employee_id || user.id);
        const hasMyPending = requests.some(r =>
            String(r.employee_id) === currentUserId &&
            (String(r.status).toLowerCase() === 'pending' || String(r.status).toLowerCase() === 'wait')
        );

        if (hasMyPending) {
            alert('You already have your own pending resignation notice in progress. Please wait for management review.');
            return;
        }

        try {
            setSubmitting(true);
            const res = await fetch(API_ENDPOINTS.RESIGNATION_REQUEST, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    employee_id: user.employee_id || user.id,
                    employee_name: user.name,
                    resignation_date: formData.resignation_date,
                    reason: formData.primary_reason,
                    letter_content: formData.letter_content,
                    last_working_day: formData.last_working_day,
                    status: 'Pending'
                })
            });
            if (res.ok) {
                alert('Resignation letter submitted successfully! ✅');
                setFormData({ resignation_date: new Date().toISOString().split('T')[0], last_working_day: '', primary_reason: '', letter_content: '' });
                fetchMyRequests();
                setActiveTab('history');
            } else {
                const errorData = await res.json();
                alert(errorData.message || 'Submission failed. You might already have a record for this date.');
            }
        } catch (error) { console.error('Submit error:', error); }
        finally { setSubmitting(false); }
    };

    const tabList = [
        { id: 'submit', label: 'Resignation Letter', icon: <Send size={16} /> },
        { id: 'history', label: 'History of Resignations', icon: <Clock size={16} /> }
    ];

    const [updating, setUpdating] = useState(false);
    const handleStatusUpdate = async (reqId, newStatus) => {
        if (!user?.token || !reqId) {
            alert('Error: Request ID not found. Cannot update status.');
            return;
        }

        try {
            setUpdating(true);
            const res = await fetch(API_ENDPOINTS.RESIGNATION_UPDATE(reqId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    status: newStatus,
                    reporting_manager_remark: selectedRequest.reporting_manager_remark || '',
                    project_manager_remark: selectedRequest.project_manager_remark || '',
                    hr_remark: selectedRequest.hr_remark || `Status changed to ${newStatus}`
                })
            });

            if (res.ok) {
                alert(`Resignation marked as ${newStatus} successfully!`);
                setSelectedRequest(null);
                fetchMyRequests();
            } else {
                const errText = await res.text();
                alert(`Failed to update status: ${errText || 'Internal Server Error'}`);
            }
        } catch (error) {
            console.error('Update err', error);
            alert('A network error occurred while updating the status.');
        } finally {
            setUpdating(false);
        }
    };


    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#eaeff2', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', sans-serif" }}>
            <AppHeader />
            <main style={{
                flex: 1,
                padding: winWidth < 768 ? '100px 20px 40px' : '150px 40px 40px',
                maxWidth: '100%',
                width: '100%',
                fontFamily: "'Outfit', sans-serif"
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ background: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
                    >
                        <ChevronLeft size={20} color="#0f172a" />
                    </button>
                    <h1 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Exit Management</h1>
                </div>

                <div style={{
                    display: 'flex',
                    gap: winWidth < 768 ? '4px' : '8px',
                    background: '#d1d9e0',
                    padding: '6px',
                    borderRadius: '14px',
                    width: winWidth < 768 ? '100%' : 'fit-content',
                    marginBottom: '40px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch',
                    msOverflowStyle: 'none'
                }}>
                    {tabList.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: winWidth < 768 ? '10px 10px' : '10px 24px',
                                borderRadius: '10px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: winWidth < 768 ? '12px' : '14px',
                                fontWeight: '800',
                                transition: '0.3s',
                                background: activeTab === tab.id ? 'white' : 'transparent',
                                color: activeTab === tab.id ? '#0f172a' : '#64748b',
                                boxShadow: activeTab === tab.id ? '0 4px 6px rgba(0,0,0,0.05)' : 'none',
                                flex: winWidth < 768 ? 1 : 'none',
                                whiteSpace: 'nowrap',
                                minWidth: winWidth < 768 ? '140px' : 'auto'
                            }}
                        >

                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'submit' ? (
                    <div className="animate-fade-in" style={{
                        backgroundColor: 'white',
                        borderRadius: '30px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                        border: '1px solid #f1f5f9',
                        overflow: 'hidden'
                    }}>
                        <div style={{ height: '7px', background: 'linear-gradient(90deg, #ef4444 0%, #fca5a5 100%)' }} />
                        <div style={{
                            padding: winWidth < 768 ? '25px 20px 0' : '36px 50px 0',
                            display: 'flex',
                            flexDirection: winWidth < 768 ? 'column' : 'row',
                            justifyContent: 'space-between',
                            alignItems: winWidth < 768 ? 'flex-start' : 'center',
                            gap: winWidth < 768 ? '20px' : '0'
                        }}>
                            <div style={{ display: 'flex', gap: winWidth < 768 ? '12px' : '18px', alignItems: 'center' }}>
                                <div style={{ width: winWidth < 768 ? '48px' : '60px', height: winWidth < 768 ? '48px' : '60px', borderRadius: '16px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <LogOut color="#ef4444" size={winWidth < 768 ? 20 : 26} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: '900', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px' }}>Resignation Request</div>
                                    <h2 style={{ fontSize: winWidth < 768 ? '18px' : '22px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-0.4px' }}>Resignation Letter</h2>
                                    <p style={{ color: '#64748b', fontSize: winWidth < 768 ? '12px' : '14px', margin: '3px 0 0', fontWeight: '600' }}>Formal Exit Documentation</p>
                                </div>
                            </div>
                            <div style={{ textAlign: winWidth < 768 ? 'left' : 'right' }}>
                                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Submission Date</div>
                                <div style={{ fontSize: winWidth < 768 ? '14px' : '16px', color: '#0f172a', fontWeight: '900' }}>{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                            </div>
                        </div>
                        <div style={{ padding: winWidth < 768 ? '25px 20px 40px' : '30px 50px 50px' }}>
                            <div style={{ background: '#f8fafc', borderRadius: '20px', border: '1px dashed #e2e8f0', padding: winWidth < 768 ? '20px' : '28px 32px', marginBottom: '24px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: winWidth < 480 ? '1fr' : '120px 1fr', gap: winWidth < 480 ? '8px' : '0', rowGap: '16px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', paddingTop: '4px' }}>FROM</span>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <div style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: '800', color: '#0f172a', minWidth: winWidth < 768 ? '100%' : '160px' }}>
                                            {user?.name || 'Employee'}
                                        </div>
                                        <div style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>
                                            ID: {user?.employee_id || user?.id || '—'}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', paddingTop: '4px' }}>TO</span>
                                    <div style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: '800', color: '#0f172a', display: 'inline-flex', width: 'fit-content' }}>
                                        HR / Management Team
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: winWidth < 500 ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Resignation Date</label>
                                    <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '14px', padding: '14px 18px', fontSize: '13px', fontWeight: '800', color: '#0f172a', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                        {new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Proposed LWD <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input
                                        type="date"
                                        value={formData.last_working_day}
                                        onChange={(e) => setFormData({ ...formData, last_working_day: e.target.value })}
                                        style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1.5px solid #cbd5e1', background: 'white', color: '#0f172a', fontWeight: '700', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Reason to Resign <span style={{ color: '#ef4444' }}>*</span></label>
                                <select
                                    value={formData.primary_reason}
                                    onChange={(e) => setFormData({ ...formData, primary_reason: e.target.value })}
                                    style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1.5px solid #cbd5e1', background: 'white', color: formData.primary_reason ? '#0f172a' : '#94a3b8', fontWeight: '800', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', cursor: 'pointer', appearance: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                                >
                                    <option value="" disabled style={{ color: '#94a3b8' }}>Select a reason</option>
                                    <option value="Better Career Opportunity" style={{ color: '#0f172a' }}>Better Career Opportunity</option>
                                    <option value="Personal Reasons" style={{ color: '#0f172a' }}>Personal Reasons</option>
                                    <option value="Higher Education" style={{ color: '#0f172a' }}>Higher Education</option>
                                    <option value="Other" style={{ color: '#0f172a' }}>Other</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Formal Letter Content</label>
                                <textarea
                                    placeholder="Write your formal letter..."
                                    value={formData.letter_content}
                                    onChange={(e) => setFormData({ ...formData, letter_content: e.target.value })}
                                    style={{
                                        width: '100%', padding: '18px', borderRadius: '14px', border: '1.5px solid #cbd5e1',
                                        background: 'white', color: '#1e293b', fontWeight: '500', fontSize: '14px',
                                        outline: 'none', minHeight: '180px', resize: 'none', fontFamily: 'inherit',
                                        lineHeight: '1.7', boxSizing: 'border-box', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                    }}
                                />
                            </div>
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px', marginBottom: '32px' }}>
                                <p style={{ fontSize: '15px', color: '#334155', fontWeight: '500', margin: 0 }}>
                                    Sincerely,<br />
                                    <span style={{ fontWeight: '900', color: '#0f172a', fontSize: '16px' }}>{user?.name}</span>
                                </p>
                            </div>
                            <button
                                onClick={handleFormSubmit}
                                disabled={submitting}
                                style={{
                                    width: '100%', padding: '20px', borderRadius: '16px', border: 'none',
                                    background: '#0f172a', color: 'white', fontWeight: '950', fontSize: '15px',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 10px 25px rgba(15, 23, 42, 0.25)',
                                    transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                    opacity: submitting ? 0.7 : 1, textTransform: 'uppercase', letterSpacing: '1.5px'
                                }}
                            >
                                <Send size={18} /> {submitting ? 'Processing...' : 'Signature & Submit Letter'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '12px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                                Team Resignation History
                            </h3>
                            <button 
                                onClick={fetchMyRequests}
                                style={{ background: 'white', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                                <Clock size={12} /> Refresh Sync
                            </button>
                        </div>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', background: 'white', borderRadius: '24px' }}>Syncing history...</div>
                        ) : requests.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', border: '2px dashed #f1f5f9', borderRadius: '24px', background: 'white' }}>
                                <AlertCircle size={40} style={{ marginBottom: '15px', opacity: 0.3 }} />
                                <p style={{ margin: 0, fontWeight: '700' }}>No resignation records found.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                {requests.map((req, i) => {
                                    const statusColors = {
                                        Approved: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
                                        Rejected: { bg: '#fef2f2', text: '#dc2626', border: '#fee2e2' },
                                        Pending: { bg: '#fffbeb', text: '#d97706', border: '#fef3c7' }
                                    };
                                    const sc = statusColors[req.status] || statusColors.Pending;
                                    return (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedRequest(req)}
                                            style={{
                                                backgroundColor: 'white',
                                                borderRadius: '24px',
                                                padding: '24px',
                                                boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                                                border: '1px solid #f1f5f9',
                                                cursor: 'pointer',
                                                transition: '0.3s',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '12px',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: req.status === 'Approved' ? '#16a34a' : (req.status === 'Rejected' ? '#dc2626' : '#d97706') }} />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <User size={20} color="#64748b" />
                                                </div>
                                                <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '950', textTransform: 'uppercase', background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                                                    {req.status || 'Pending'}
                                                </span>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginBottom: '2px' }}>{req.employee_name || 'Employee'}</div>
                                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>ID: {req.employee_id}</div>
                                            </div>
                                            <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                                                    <Calendar size={12} />
                                                    <span style={{ fontSize: '11px', fontWeight: '700' }}>{new Date(req.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <ExternalLink size={14} color="#3b82f6" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
                {selectedRequest && (
                    <div
                        className="no-scrollbar"
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: winWidth < 768 ? '10px 10px 100px' : '50px 20px 140px', overflowY: 'auto' }}
                        onClick={() => setSelectedRequest(null)}
                    >
                        <div
                            style={{
                                background: 'white',
                                borderRadius: winWidth < 768 ? '24px' : '32px',
                                width: '100%',
                                maxWidth: '800px',
                                position: 'relative',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                                animation: 'modalSlideUp 0.3s ease-out',
                                maxHeight: '80vh',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedRequest(null)}
                                style={{ position: 'absolute', top: '15px', right: '15px', width: '36px', height: '36px', borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                            >
                                <X size={18} color="#64748b" />
                            </button>
                            <div style={{ height: '4px', background: 'linear-gradient(90deg, #ef4444, #fca5a5)', flexShrink: 0 }} />
                            <div style={{ padding: winWidth < 768 ? '20px' : '30px 40px', display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
                                <div style={{ display: 'flex', flexDirection: winWidth < 500 ? 'column' : 'row', justifyContent: 'space-between', alignItems: winWidth < 500 ? 'flex-start' : 'flex-start', marginBottom: winWidth < 768 ? '20px' : '24px', paddingRight: winWidth < 768 ? '0' : '20px', gap: winWidth < 500 ? '15px' : '0', flexShrink: 0 }}>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <LogOut color="#ef4444" size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: winWidth < 768 ? '16px' : '17px', fontWeight: '950', color: '#0f172a', letterSpacing: '-0.5px' }}>Resignation Letter</div>
                                            <div style={{ fontSize: winWidth < 768 ? '11px' : '12px', color: '#64748b', fontWeight: '600' }}>Formal Exit Documentation</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: winWidth < 500 ? 'left' : 'right' }}>
                                        <span style={{
                                            padding: '6px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: '950', textTransform: 'uppercase',
                                            background: (selectedRequest.status === 'Approved' ? '#f0fdf4' : (selectedRequest.status === 'Rejected' ? '#fef2f2' : '#fffbeb')),
                                            color: (selectedRequest.status === 'Approved' ? '#16a34a' : (selectedRequest.status === 'Rejected' ? '#dc2626' : '#d97706')),
                                            border: `1px solid ${selectedRequest.status === 'Approved' ? '#bbf7d0' : (selectedRequest.status === 'Rejected' ? '#fee2e2' : '#fef3c7')}`
                                        }}>
                                            {selectedRequest.status || 'Pending'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '15px 20px', borderRadius: '20px', border: '1px dashed #e2e8f0' }}>
                                    <div style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '10px', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8' }}>TO:</span>
                                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>HR Department</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '10px', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8' }}>FROM:</span>
                                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>{selectedRequest.employee_name}</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '10px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8' }}>SUBJECT:</span>
                                            <span style={{ fontSize: '11px', fontWeight: '950', color: '#ef4444', textTransform: 'uppercase' }}>Formal Resignation</span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: winWidth < 768 ? '13px' : '15px', color: '#334155', fontWeight: '500', lineHeight: '1.6', margin: '0 0 10px 0' }}>Dear HR Team,</p>
                                    <p style={{ fontSize: winWidth < 768 ? '13px' : '15px', color: '#334155', fontWeight: '500', lineHeight: '1.6', margin: '0 0 10px 0' }}>
                                        Resigning due to&nbsp;<span style={{ fontWeight: '900', color: '#0f172a' }}>{selectedRequest.reason || 'N/A'}</span>.
                                        LWD:&nbsp;<span style={{ fontWeight: '900', color: '#ef4444' }}>{selectedRequest.last_working_day ? new Date(selectedRequest.last_working_day).toLocaleDateString() : 'N/A'}</span>.
                                    </p>
                                    {selectedRequest.letter_content && (
                                        <div style={{ marginTop: '10px' }}>
                                            <div style={{ background: 'white', padding: winWidth < 768 ? '12px' : '16px 20px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: winWidth < 768 ? '13px' : '15px', color: '#334155', fontWeight: '500', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                                {selectedRequest.letter_content}
                                            </div>
                                        </div>
                                    )}
                                    <p style={{ fontSize: winWidth < 768 ? '13px' : '15px', color: '#334155', fontWeight: '500', margin: '15px 0 0 0' }}>
                                        Sincerely,<br />
                                        <span style={{ fontWeight: '900', color: '#0f172a', fontSize: winWidth < 768 ? '14px' : '16px' }}>{selectedRequest.employee_name}</span>
                                    </p>
                                        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f1f5f9' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                                <button
                                                    disabled={updating}
                                                    onClick={() => handleStatusUpdate(selectedRequest.id, 'Pending')}
                                                    style={{ padding: '12px', borderRadius: '10px', border: 'none', background: '#fffbeb', color: '#d97706', fontWeight: '900', cursor: 'pointer', fontSize: '11px', textTransform: 'uppercase' }}
                                                >
                                                    Wait
                                                </button>
                                                <button
                                                    disabled={updating}
                                                    onClick={() => handleStatusUpdate(selectedRequest.id, 'Rejected')}
                                                    style={{ padding: '12px', borderRadius: '10px', border: 'none', background: '#fef2f2', color: '#dc2626', fontWeight: '900', cursor: 'pointer', fontSize: '11px', textTransform: 'uppercase' }}
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    disabled={updating}
                                                    onClick={() => handleStatusUpdate(selectedRequest.id, 'Approved')}
                                                    style={{ padding: '12px', borderRadius: '10px', border: 'none', background: '#f0fdf4', color: '#16a34a', fontWeight: '900', cursor: 'pointer', fontSize: '11px', textTransform: 'uppercase' }}
                                                >
                                                    {updating ? '...' : 'Approved'}
                                                </button>
                                            </div>
                                        </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <AppFooter />
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } @keyframes modalSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
        </div>
    );
}
