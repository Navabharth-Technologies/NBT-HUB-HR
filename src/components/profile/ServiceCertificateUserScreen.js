import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config';
import {
    ArrowLeft, FileText, CheckCircle, Clock,
    Download, Plus, Search, Filter, AlertCircle, X, XCircle,
    ExternalLink, Calendar, Info, Package, ShieldCheck, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ServiceCertificateUserScreen() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = String(user?.role || '').toLowerCase() === 'admin' || String(user?.role || '').toLowerCase().includes('hr');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [purpose, setPurpose] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [showAssetsModal, setShowAssetsModal] = useState(false);
    const [assetData, setAssetData] = useState(null);
    const [assetsLoading, setAssetsLoading] = useState(false);
    const [employeeNames, setEmployeeNames] = useState({});
    const [adminRemark, setAdminRemark] = useState('');
    const [certificateUrl, setCertificateUrl] = useState('');
    const [winWidth, setWinWidth] = useState(window.innerWidth);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');

    useEffect(() => {
        if (selectedDetail) {
            setAdminRemark(selectedDetail.admin_remark || '');
            setCertificateUrl(selectedDetail.certificate_url || '');
        }
    }, [selectedDetail]);

    useEffect(() => {
        const handleResize = () => setWinWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (showSuccessPopup) {
            const timer = setTimeout(() => {
                setShowSuccessPopup(false);
                setSelectedDetail(null);
                fetchMyRequests();
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [showSuccessPopup]);


    useEffect(() => {
        fetchMyRequests();
        fetchAllEmployees();
    }, [user]);

    const fetchMyRequests = async () => {
        if (!user?.token) return;
        try {
            setLoading(true);
            const employeeId = user.id || user.employee_id;
            // In the HR portal, we want this screen to act as a global view for HR approval
            const endpoint = API_ENDPOINTS.SERVICE_CERTIFICATES_ADMIN || `${API_ENDPOINTS.BASE_URL || 'http://localhost:5000'}/api/service-certificates`;

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

                // HR portal shows all requests by default

                setRequests(actualData);
            }
        } catch (error) {
            console.error('Fetch requests error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllEmployees = async () => {
        if (!user?.token) return;
        try {
            const res = await fetch(API_ENDPOINTS.EMPLOYEES, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const mapping = {};
                (Array.isArray(data) ? data : (data.data || [])).forEach(emp => {
                    mapping[emp.employee_id || emp.id] = emp.name || emp.employee_name;
                });
                setEmployeeNames(mapping);
            }
        } catch (error) {
            console.error('Fetch employees error:', error);
        }
    };

    const fetchAssetData = async (employeeId = null) => {
        if (!user?.token) return;
        try {
            setAssetsLoading(true);
            const targetEmpId = employeeId || user.id || user.employee_id;
            
            // Fetch from the global assets endpoint
            const res = await fetch(API_ENDPOINTS.ASSETS || `${API_ENDPOINTS.BASE_URL || 'http://localhost:5000'}/api/assets`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            if (res.ok) {
                const allAssets = await res.json();
                const list = Array.isArray(allAssets) ? allAssets : (allAssets.data || []);
                
                // Find the asset record for this specific employee
                const myAsset = list.find(a => 
                    String(a.employee_id || a.EmpID || a.employeeId || a.id) === String(targetEmpId)
                );

                if (myAsset) {
                    setAssetData(myAsset);
                } else {
                    console.warn('No asset record found for employee:', targetEmpId);
                }
            }
        } catch (error) {
            console.error('Fetch assets error:', error);
        } finally {
            setAssetsLoading(false);
        }
    };

    useEffect(() => {
        if (showAssetsModal && !assetData?.id) {
            fetchAssetData();
        }
    }, [showAssetsModal]);

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
                body: JSON.stringify({ 
                    status: newStatus,
                    admin_remark: adminRemark,
                    certificate_url: certificateUrl
                })
            });
            if (res.ok) {
                setPopupMessage(newStatus === 'Approved' ? 'Certificate Approved Successfully!' : 'Certificate Rejected Successfully!');
                setShowSuccessPopup(true);
            }
        } catch (error) {
            console.error('Quick update error:', error);
        }
    };

    const pendingRequests = requests.filter(r => r.status === 'Pending');
    const historyRequests = requests.filter(r => r.status !== 'Pending');

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#eaeff2', display: 'flex', flexDirection: 'column' }}>
            <AppHeader />

            <main style={{
                flex: 1,
                padding: winWidth < 768 ? '90px 15px 40px' : '100px 40px 40px',
                maxWidth: '100%',
                margin: '0',
                width: '100%',
                fontFamily: "'Outfit', sans-serif"
            }}>
                <header style={{
                    marginBottom: '40px',
                    display: 'flex',
                    flexDirection: winWidth < 768 ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: winWidth < 768 ? 'flex-start' : 'center',
                    gap: winWidth < 768 ? '20px' : '0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: winWidth < 768 ? '12px' : '20px' }}>

                        <button
                            onClick={() => navigate(-1)}
                            style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <ArrowLeft size={18} color="#64748b" />
                        </button>
                        <div>
                            <h1 style={{ fontSize: winWidth < 768 ? '22px' : '28px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Service Certificates</h1>
                            <p style={{ color: '#64748b', fontSize: winWidth < 768 ? '12px' : '14px', margin: '4px 0 0', fontWeight: '500' }}>Request and track your employment verification</p>
                        </div>

                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        width: winWidth < 768 ? '100%' : 'auto',
                        overflowX: winWidth < 768 ? 'auto' : 'visible',
                        paddingBottom: winWidth < 768 ? '5px' : '0'
                    }}>



                        {!isAdmin && (
                            <button
                                onClick={() => setShowRequestModal(true)}
                                style={{
                                    background: '#0f172a',
                                    color: 'white',
                                    border: 'none',
                                    padding: winWidth < 768 ? '10px 16px' : '12px 24px',
                                    borderRadius: '14px',
                                    fontWeight: '800',
                                    fontSize: winWidth < 768 ? '12px' : '14px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.1)',
                                    whiteSpace: 'nowrap',
                                    flex: winWidth < 768 ? 1 : 'none',
                                    justifyContent: 'center'
                                }}
                            >
                                <Plus size={winWidth < 768 ? 16 : 18} /> New Request
                            </button>

                        )}
                    </div>
                </header>

                {/* Section: Active & History Requests */}
                <section style={{
                    display: 'grid',
                    gridTemplateColumns: winWidth < 768 ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
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
                                                background: status === 'Pending Audit' ? '#fef2f2' : isPending ? '#fffbeb' : isApproved ? '#f0fdf4' : '#fef2f2',
                                                color: status === 'Pending Audit' ? '#ef4444' : isPending ? '#d97706' : isApproved ? '#16a34a' : '#dc2626',
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
                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', marginTop: '2px' }}>
                                                    {req.employee_name || req.name || employeeNames[req.employee_id] || 'Employee'} (ID: {req.employee_id})
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', marginTop: '2px' }}>{new Date(req.created_at).toLocaleDateString()}</div>
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
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' }}>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            style={{
                                background: 'white',
                                borderRadius: '24px',
                                width: '100%',
                                maxWidth: '450px',
                                padding: winWidth < 768 ? '20px' : '30px',
                                position: 'relative'
                            }}
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
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3100,
                        padding: winWidth < 768 ? '10px' : '20px'
                    }}>


                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            style={{
                                background: 'white',
                                borderRadius: winWidth < 768 ? '24px' : '32px',
                                width: '100%',
                                maxWidth: '550px',
                                position: 'relative',
                                overflowX: 'hidden',
                                overflowY: 'auto',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                                maxHeight: winWidth < 768 ? '80vh' : '90vh'
                            }}



                        >

                            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: winWidth < 768 ? '20px 15px' : '40px', color: 'white', textAlign: 'center' }}>


                                <button onClick={() => setSelectedDetail(null)} style={{ position: 'absolute', top: winWidth < 768 ? '10px' : '25px', right: winWidth < 768 ? '10px' : '25px', background: 'rgba(255,255,255,0.1)', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                                <div style={{ width: winWidth < 768 ? '40px' : '70px', height: winWidth < 768 ? '40px' : '70px', background: 'rgba(255,255,255,0.1)', borderRadius: winWidth < 768 ? '12px' : '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', backdropFilter: 'blur(10px)' }}>
                                    <FileText size={winWidth < 768 ? 20 : 32} />
                                </div>
                                <h2 style={{ fontSize: winWidth < 768 ? '18px' : '24px', fontWeight: '950', margin: '0 0 2px 0', letterSpacing: '-0.5px' }}>Service Certificate</h2>
                                <p style={{ margin: 0, opacity: 0.7, fontSize: winWidth < 768 ? '11px' : '14px', fontWeight: '600' }}>Request ID: #{selectedDetail.id}</p>


                            </div>

                            <div style={{ padding: winWidth < 768 ? '15px' : '40px' }}>


                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: winWidth < 480 ? '1fr' : '1fr 1fr',
                                    gap: winWidth < 768 ? '10px' : '30px',
                                    marginBottom: winWidth < 768 ? '15px' : '35px'
                                }}>


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


                                <div style={{ marginBottom: winWidth < 768 ? '15px' : '35px' }}>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: winWidth < 768 ? '6px' : '12px', letterSpacing: '0.5px' }}>Purpose of Verification</label>
                                    <div style={{ background: '#f8fafc', padding: winWidth < 768 ? '10px 12px' : '20px', borderRadius: '14px', border: '1px solid #f1f5f9', fontSize: '13px', fontWeight: '700', color: '#334155', lineHeight: '1.4' }}>
                                        {selectedDetail.purpose}
                                    </div>
                                </div>



                                    <div style={{ marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>HR Admin Remarks</label>
                                            <textarea 
                                                value={adminRemark}
                                                onChange={(e) => setAdminRemark(e.target.value)}
                                                placeholder="Enter internal notes or feedback..."
                                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #f1f5f9', outline: 'none', fontSize: '13px', fontWeight: '600', minHeight: '80px', background: '#f8fafc' }}
                                            />
                                        </div>
                                    </div>

                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {(selectedDetail.status === 'Pending' || selectedDetail.status === 'Pending Audit') ? (
                                        <>
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: winWidth < 500 ? 'column' : 'row',
                                                gap: winWidth < 768 ? '8px' : '10px',
                                                width: '100%',
                                                marginBottom: winWidth < 768 ? '8px' : '10px'
                                            }}>


                                                <button
                                                    onClick={() => quickStatusUpdate(selectedDetail.id, 'Approved')}
                                                    style={{
                                                        flex: 1,
                                                        padding: winWidth < 768 ? '10px' : '14px',
                                                        borderRadius: '14px',
                                                        border: 'none',
                                                        background: '#22c55e',
                                                        color: 'white',
                                                        fontWeight: '800',
                                                        fontSize: winWidth < 768 ? '13px' : '14px',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)',
                                                        width: winWidth < 500 ? '90%' : 'auto',
                                                        margin: winWidth < 500 ? '0 auto' : '0'
                                                    }}
                                                >
                                                    Approve
                                                </button>

                                                <button
                                                    onClick={() => quickStatusUpdate(selectedDetail.id, 'Rejected')}
                                                    style={{
                                                        flex: 1,
                                                        padding: winWidth < 768 ? '10px' : '14px',
                                                        borderRadius: '14px',
                                                        border: 'none',
                                                        background: '#ef4444',
                                                        color: 'white',
                                                        fontWeight: '800',
                                                        fontSize: winWidth < 768 ? '13px' : '14px',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                                                        width: winWidth < 500 ? '90%' : 'auto',
                                                        margin: winWidth < 500 ? '0 auto' : '0'
                                                    }}
                                                >
                                                    Reject
                                                </button>

                                            </div>
                                            <button
                                                onClick={() => {
                                                    // Pass the employee_id from the request to fetch their specific assets
                                                    const empId = selectedDetail.employee_id || selectedDetail.id;
                                                    setAssetData(selectedDetail); 
                                                    setShowAssetsModal(true);
                                                    fetchAssetData(empId);
                                                }}
                                                style={{
                                                    width: winWidth < 500 ? '90%' : '100%',
                                                    margin: winWidth < 500 ? '0 auto' : '0',
                                                    padding: winWidth < 768 ? '10px' : '14px',
                                                    borderRadius: '14px',
                                                    border: '1.5px solid #e2e8f0',
                                                    background: 'white',
                                                    color: '#0f172a',
                                                    fontWeight: '800',
                                                    fontSize: winWidth < 768 ? '13px' : '14px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                <Package size={18} color="#3b82f6" /> Their Asset Submissions
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

            {/* AVAILABLE ASSETS MODAL */}
            <AnimatePresence>
                {showAssetsModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3200, padding: '20px' }}>

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            style={{
                                background: 'white',
                                borderRadius: winWidth < 768 ? '24px' : '32px',
                                width: '100%',
                                maxWidth: '850px',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                                border: '1px solid #f1f5f9',
                                maxHeight: '95vh',
                                overflowY: 'auto'
                            }}
                        >

                            <div style={{ padding: winWidth < 768 ? '20px' : '40px' }}>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                        <div style={{ width: '56px', height: '56px', background: '#eef2ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Package size={28} color="#4f46e5" />
                                        </div>
                                        <div>
                                            <h2 style={{ fontSize: '24px', fontWeight: '950', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Professional Asset Declaration</h2>
                                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: '700' }}>
                                                    {assetData?.employee_name || assetData?.name || employeeNames[assetData?.employee_id] || 'Employee'} (ID: {assetData?.employee_id})
                                                </p>
                                                <div style={{ width: '1px', height: '12px', background: '#cbd5e1' }} />
                                                <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: '700' }}>Request ID: #{assetData?.id}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowAssetsModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                                </div>

                                <div style={{ marginBottom: '32px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Laptop Details & Serial Number</label>
                                    <div style={{ background: '#f8fafc', padding: '20px 24px', borderRadius: '18px', border: '1.5px solid #f1f5f9', fontSize: '15px', fontWeight: '700', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div>{assetData?.laptop_details || 'N/A'}</div>
                                        {assetData?.serial_number && (
                                            <div style={{ fontSize: '13px', color: '#64748b' }}>S/N: {assetData.serial_number}</div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ background: '#f8fafc', padding: '30px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                                        <ShieldCheck size={20} color="#059669" />
                                        <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Hardware Peripherals Verified</h3>
                                    </div>

                                    {assetsLoading ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: '800' }}>Fetching verified assets...</div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
                                            {[
                                                { label: 'Optical Mouse', checked: assetData?.mouse === 'Yes' || assetData?.mouse_status === 'Yes' || Number(assetData?.mouse_unit) === 1 },
                                                { label: 'External Keyboard', checked: assetData?.keyboard === 'Yes' || assetData?.keyboard_status === 'Yes' || Number(assetData?.keyboard_unit) === 1 },
                                                { label: 'Laptop Stand', checked: assetData?.laptop_stand === 'Yes' || assetData?.stand === 'Yes' || Number(assetData?.stand_unit) === 1 || Number(assetData?.laptop_stand_unit) === 1 },
                                                { label: 'Company Mobile', checked: assetData?.mobile === 'Yes' || assetData?.mobile_handset === 'Yes' || Number(assetData?.mobile_unit) === 1 },
                                                { label: 'Earphones', checked: assetData?.earphone === 'Yes' || assetData?.headphone === 'Yes' || assetData?.earphone_headphone === 'Yes' || Number(assetData?.earphone_unit) === 1 || Number(assetData?.headphone_unit) === 1 },
                                                { label: 'External Camera', checked: assetData?.camera === 'Yes' || assetData?.webcam === 'Yes' || Number(assetData?.camera_unit) === 1 },
                                                { label: 'Tablet', checked: assetData?.tablet === 'Yes' || Number(assetData?.tablet_unit) === 1 },
                                                { label: 'Pendrive / Storage', checked: assetData?.pendrive === 'Yes' || Number(assetData?.pendrive_unit) === 1 },
                                                { label: 'Ref Pad / Notebook', checked: assetData?.ruf_pad === 'Yes' || assetData?.rufpad === 'Yes' || Number(assetData?.ruf_pad_unit) === 1 || Number(assetData?.ref_pad_unit) === 1 },
                                            ].map((asset, idx) => (
                                                <div key={idx} style={{
                                                    background: asset.checked ? '#f0fdf4' : 'white',
                                                    border: asset.checked ? '1.5px solid #bbf7d0' : '1.5px solid #e2e8f0',
                                                    borderRadius: '16px',
                                                    padding: '16px 10px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '10px',
                                                    textAlign: 'center',
                                                    transition: '0.2s'
                                                }}>
                                                    <div style={{
                                                        width: '24px', height: '24px', borderRadius: '50%',
                                                        background: asset.checked ? '#22c55e' : '#f1f5f9',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                        {asset.checked ? <CheckCircle size={14} color="white" /> : <Package size={14} color="#94a3b8" />}
                                                    </div>
                                                    <span style={{ fontSize: '11px', fontWeight: '800', color: asset.checked ? '#166534' : '#64748b' }}>{asset.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    style={{
                                        width: '100%', padding: '18px', borderRadius: '18px', border: 'none',
                                        background: '#10b981', color: 'white', fontWeight: '900', fontSize: '15px',
                                        cursor: 'pointer', marginTop: '32px', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', gap: '10px', boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.3)'
                                    }}
                                >
                                    <Sparkles size={18} /> Update Hardware Declaration
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Custom Center Pop-Up Modal */}
            {showSuccessPopup && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999,
                    animation: 'fadeIn 0.25s ease'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '24px', padding: '32px', width: '90%', maxWidth: '420px',
                        boxShadow: '0 20px 50px rgba(15, 23, 42, 0.15)', border: '1.5px solid #e2e8f0', textAlign: 'center',
                        animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%',
                            background: popupMessage.includes('Approved') ? '#ecfdf5' : '#fef2f2',
                            color: popupMessage.includes('Approved') ? '#10b981' : '#ef4444',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                            boxShadow: popupMessage.includes('Approved') ? '0 8px 20px rgba(16, 185, 129, 0.15)' : '0 8px 20px rgba(239, 68, 68, 0.15)'
                        }}>
                            {popupMessage.includes('Approved') ? <CheckCircle size={28} strokeWidth={3} /> : <XCircle size={28} strokeWidth={3} />}
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '950', color: '#0f172a' }}>
                            {popupMessage.includes('Approved') ? 'Approved!' : 'Rejected!'}
                        </h3>
                        <p style={{ margin: '0', fontSize: '13px', fontWeight: '750', color: '#475569', lineHeight: '1.5' }}>
                            {popupMessage}
                        </p>
                    </div>
                </div>
            )}

            <AppFooter />
        </div>
    );
}
