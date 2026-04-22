import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config';
import { 
  ChevronLeft, FileText, CheckCircle, Clock, 
  Download, Plus, Search, Filter, AlertCircle, X,
  ExternalLink, Calendar, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ServiceCertificateUserScreen() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [purpose, setPurpose] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);

    useEffect(() => {
        fetchMyRequests();
    }, [user]);

    const fetchMyRequests = async () => {
        if (!user?.token) return;
        try {
            setLoading(true);
            const employeeId = user.id || user.employee_id;
            const isAdmin = String(user?.role || '').toLowerCase() === 'admin' || String(user?.role || '').toLowerCase() === 'hr';
            
            // If admin/hr, we fetch all via the admin endpoint, otherwise we fetch user-specific
            const endpoint = isAdmin 
                ? API_ENDPOINTS.SERVICE_CERTIFICATES_GET 
                : `${API_ENDPOINTS.SERVICE_CERTIFICATE_REQUEST}?employee_id=${employeeId}`;

            const res = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            if (res.ok) {
                const result = await res.json();
                console.log('Certificate fetch result:', result);
                
                let actualData = [];
                if (Array.isArray(result)) {
                    actualData = result;
                } else if (result.data && Array.isArray(result.data)) {
                    actualData = result.data;
                } else if (result.certificate_requests && Array.isArray(result.certificate_requests)) {
                    actualData = result.certificate_requests;
                } else if (result.requests && Array.isArray(result.requests)) {
                    actualData = result.requests;
                }

                // If not admin, ensure we filter (client-side safety)
                if (!isAdmin) {
                    actualData = actualData.filter(r => String(r.employee_id) === String(employeeId));
                }

                setRequests(actualData);
            }
        } catch (error) {
            console.error('Fetch requests error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequest = async () => {
        if (!purpose.trim() || !user?.token) return;
        try {
            setSubmitting(true);
            const res = await fetch(API_ENDPOINTS.SERVICE_CERTIFICATE_REQUEST, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ 
                    employee_id: user.id || user.employee_id,
                    employee_name: user.name,
                    purpose: purpose
                })
            });
            if (res.ok) {
                setShowRequestModal(false);
                setPurpose('');
                fetchMyRequests();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const quickStatusUpdate = async (id, newStatus) => {
        if (!user?.token) return;
        try {
            const res = await fetch(API_ENDPOINTS.SERVICE_CERTIFICATE_UPDATE(id), {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setSelectedDetail(null);
                fetchMyRequests();
            }
        } catch (error) {
            console.error('Quick update error:', error);
        }
    };

    const pendingRequests = requests.filter(r => r.status === 'Pending');
    const historyRequests = requests.filter(r => r.status !== 'Pending');

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
            <AppHeader />
            
            <main style={{ flex: 1, padding: '100px 40px 40px', maxWidth: '100%', margin: '0', width: '100%', fontFamily: "'Outfit', sans-serif" }}>
                <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button 
                            onClick={() => navigate(-1)} 
                            style={{ background: 'white', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex' }}
                        >
                            <ChevronLeft size={20} color="#64748b" />
                        </button>
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Service Certificates</h1>
                            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0', fontWeight: '500' }}>Request and track your employment verification</p>
                        </div>
                    </div>

                    {!(String(user?.role || '').toLowerCase() === 'admin' || String(user?.role || '').toLowerCase() === 'hr') && (
                        <button 
                            onClick={() => setShowRequestModal(true)}
                            style={{ background: '#0f172a', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.1)' }}
                        >
                            <Plus size={18} /> New Request
                        </button>
                    )}
                </header>

                {/* Section: Active & History Requests */}
                <section style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: '20px' 
                }}>
                    {loading ? (
                        <div style={{ background: 'white', padding: '60px', borderRadius: '24px', textAlign: 'center', color: '#94a3b8', fontWeight: '800', border: '1px solid #f1f5f9', gridColumn: '1 / -1' }}>Syncing certificates...</div>
                    ) : requests.length === 0 ? (
                        <div style={{ background: 'white', padding: '80px 40px', borderRadius: '24px', textAlign: 'center', border: '2px dashed #e2e8f0', gridColumn: '1 / -1' }}>
                            <div style={{ width: '64px', height: '64px', background: '#f8fafc', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <FileText size={30} color="#cbd5e1" />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '0 0 8px 0' }}>No Records</h3>
                            <p style={{ color: '#94a3b8', fontWeight: '600', margin: 0, fontSize: '14px' }}>No verification requests found.</p>
                        </div>
                    ) : (
                        requests.map(req => {
                            const status = req.status || 'Pending';
                            const isPending = status === 'Pending';
                            const isApproved = status === 'Approved';
                            const isRejected = status === 'Rejected';
                            
                            return (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    key={req.id} 
                                    onClick={() => setSelectedDetail(req)}
                                    style={{ 
                                        background: 'white', 
                                        borderRadius: '24px', 
                                        border: '1.5px solid #f1f5f9', 
                                        overflow: 'hidden', 
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                                        transition: '0.2s',
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}
                                    onMouseOver={e => {
                                        e.currentTarget.style.transform = 'translateY(-5px)';
                                        e.currentTarget.style.borderColor = '#3b82f640';
                                    }}
                                    onMouseOut={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = '#f1f5f9';
                                    }}
                                >
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: isPending ? '#fbbf24' : isApproved ? '#22c55e' : '#ef4444' }} />
                                    <div style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <span style={{ 
                                                background: isPending ? '#fffbeb' : isApproved ? '#f0fdf4' : '#fef2f2', 
                                                color: isPending ? '#d97706' : isApproved ? '#16a34a' : '#dc2626', 
                                                padding: '4px 10px', borderRadius: '8px', fontSize: '9px', fontWeight: '950', textTransform: 'uppercase'
                                            }}>
                                                {status}
                                            </span>
                                            <ExternalLink size={14} color="#94a3b8" />
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <FileText size={16} color="#64748b" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: '950', color: '#0f172a' }}>#{req.id} Certificate</div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>{new Date(req.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>

                                        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {req.purpose}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </section>
            </main>

            {/* NEW REQUEST MODAL */}
            <AnimatePresence>
                {showRequestModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '450px', padding: '30px', position: 'relative' }}
                        >
                            <button onClick={() => setShowRequestModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer' }}>✕</button>
                            <h2 style={{ fontSize: '22px', fontWeight: '950', color: '#0f172a', marginBottom: '20px' }}>New Certificate Request</h2>
                            
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Reason for Request</label>
                                <textarea 
                                    placeholder="e.g. For Bank Loan application..."
                                    value={purpose} onChange={(e) => setPurpose(e.target.value)}
                                    style={{ width: '100%', padding: '15px', borderRadius: '14px', border: '1.5px solid #f1f5f9', outline: 'none', fontSize: '14px', fontWeight: '600', minHeight: '100px', background: '#f8fafc' }}
                                />
                            </div>

                            <button 
                                onClick={handleCreateRequest}
                                disabled={submitting || !purpose.trim()}
                                style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: '#0f172a', color: 'white', fontWeight: '800', fontSize: '15px', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
                            >
                                {submitting ? 'Submitting...' : 'Send Request'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* DETAIL VIEW MODAL */}
            <AnimatePresence>
                {selectedDetail && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            style={{ background: 'white', borderRadius: '32px', width: '100%', maxWidth: '550px', position: 'relative', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                        >
                            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '40px', color: 'white', textAlign: 'center' }}>
                                <button onClick={() => setSelectedDetail(null)} style={{ position: 'absolute', top: '25px', right: '25px', background: 'rgba(255,255,255,0.1)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                                <div style={{ width: '70px', height: '70px', background: 'rgba(255,255,255,0.1)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', backdropFilter: 'blur(10px)' }}>
                                    <FileText size={32} />
                                </div>
                                <h2 style={{ fontSize: '24px', fontWeight: '950', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Service Certificate</h2>
                                <p style={{ margin: 0, opacity: 0.7, fontSize: '14px', fontWeight: '600' }}>Request ID: #{selectedDetail.id}</p>
                            </div>

                            <div style={{ padding: '40px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '35px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Request Date</label>
                                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{new Date(selectedDetail.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Status</label>
                                        <div style={{ display: 'inline-flex', background: selectedDetail.status === 'Approved' ? '#f0fdf4' : '#fffbeb', color: selectedDetail.status === 'Approved' ? '#16a34a' : '#d97706', padding: '4px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '950' }}>
                                            {selectedDetail.status || 'Pending'}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '35px' }}>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Purpose of Verification</label>
                                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '18px', border: '1px solid #f1f5f9', fontSize: '14px', fontWeight: '700', color: '#334155', lineHeight: '1.6' }}>
                                        {selectedDetail.purpose}
                                    </div>
                                </div>

                                {selectedDetail.admin_remark && (
                                    <div style={{ marginBottom: '35px' }}>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#0369a1', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>HR Response</label>
                                        <div style={{ background: '#f0faff', padding: '20px', borderRadius: '18px', border: '1px solid #bae6fd', fontSize: '14px', fontWeight: '700', color: '#0c4a6e', fontStyle: 'italic' }}>
                                            "{selectedDetail.admin_remark}"
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    {(String(user?.role || '').toLowerCase() === 'admin' || String(user?.role || '').toLowerCase() === 'hr') && selectedDetail.status === 'Pending' ? (
                                        <>
                                            <button 
                                                onClick={() => quickStatusUpdate(selectedDetail.id, 'Approved')}
                                                style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#22c55e', color: 'white', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => quickStatusUpdate(selectedDetail.id, 'Rejected')}
                                                style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}
                                            >
                                                Reject
                                            </button>
                                        </>
                                    ) : selectedDetail.status === 'Approved' && selectedDetail.certificate_url ? (
                                        <a 
                                            href={selectedDetail.certificate_url} target="_blank" rel="noopener noreferrer"
                                            style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#0f172a', color: 'white', fontWeight: '800', fontSize: '15px', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                        >
                                            <Download size={18} /> Download official PDF
                                        </a>
                                    ) : (
                                        <button 
                                            onClick={() => setSelectedDetail(null)}
                                            style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '2px solid #f1f5f9', background: 'white', color: '#0f172a', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}
                                        >
                                            Close View
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AppFooter />
        </div>
    );
}
