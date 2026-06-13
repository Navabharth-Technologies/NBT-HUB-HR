import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config';
import { cleanEmpId } from '../../utils/cleanId';
import {
    ArrowLeft, FileText, CheckCircle, Clock,
    ExternalLink, Search, Filter, MoreHorizontal,
    Mail, User, Briefcase, Calendar, AlertCircle, X, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ServiceCertificateManagement() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // Modal states
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [updatePayload, setUpdatePayload] = useState({
        status: '',
        admin_remark: '',
        certificate_url: ''
    });
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (user?.role !== 'admin' && user?.role !== 'hr') {
            navigate('/performance');
            return;
        }
        fetchRequests();
    }, [user]);

    const fetchRequests = async () => {
        if (!user?.token) return;
        try {
            setLoading(true);
            const res = await fetch(API_ENDPOINTS.SERVICE_CERTIFICATES_ADMIN, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                const result = await res.json();
                console.log('Fetched admin requests:', result);

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

                // Ensure all records from service_certificate_requests are uniquely identified
                setRequests(actualData);
            }
        } catch (error) {
            console.error('Fetch requests error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenReview = (request) => {
        setSelectedRequest(request);
        setUpdatePayload({
            status: request.status || 'Pending',
            admin_remark: request.admin_remark || '',
            certificate_url: request.certificate_url || '',
            laptop_details: request.laptop_details || '',
            mouse: request.mouse || false,
            keyboard: request.keyboard || false,
            laptop_stand: request.laptop_stand || false,
            mobile: request.mobile || false,
            earphones: request.earphones || false,
            camera: request.camera || false,
            tablet: request.tablet || false,
            storage: request.storage || false,
            notebook: request.notebook || false
        });
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
            if (res.ok) fetchRequests();
        } catch (error) {
            console.error('Quick update error:', error);
        }
    };

    const handleRequestUpdate = async () => {
        if (!selectedRequest || !user?.token) return;

        try {
            setUpdating(true);
            const res = await fetch(API_ENDPOINTS.SERVICE_CERTIFICATE_UPDATE(selectedRequest.id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(updatePayload)
            });

            if (res.ok) {
                setSelectedRequest(null);
                fetchRequests();
            }
        } catch (error) {
            console.error('Update Request Error:', error);
        } finally {
            setUpdating(false);
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch = (req.employee_name || req.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (req.purpose || req.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'All' || req.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' };
            case 'pending': return { bg: '#fffbeb', text: '#d97706', border: '#fef3c7' };
            case 'rejected': return { bg: '#fef2f2', text: '#dc2626', border: '#fee2e2' };
            default: return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#eaeff2', display: 'flex', flexDirection: 'column' }}>
            <AppHeader />

            <main style={{ flex: 1, padding: '100px 30px 40px', maxWidth: '100%', margin: '0 auto', width: '100%', fontFamily: "'Outfit', sans-serif" }}>
                <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button
                            onClick={() => navigate(-1)}
                            style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <ArrowLeft size={18} color="#64748b" />
                        </button>
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Service Certificates</h1>
                            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0', fontWeight: '500' }}>Manage employment verification requests</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ background: '#f0f9ff', padding: '8px 16px', borderRadius: '12px', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={16} color="#0369a1" />
                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#0369a1' }}>
                                {requests.filter(r => r.status === 'Pending').length} Pending
                            </span>
                        </div>
                    </div>
                </header>

                <section style={{ background: 'white', borderRadius: '24px', padding: '30px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, position: 'relative', minWidth: '300px' }}>
                            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                placeholder="Search by name or reason..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '14px', border: '1.5px solid #f1f5f9', outline: 'none', transition: '0.2s', fontSize: '14px', fontWeight: '600' }}
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{ padding: '0 20px', borderRadius: '14px', border: '1.5px solid #f1f5f9', outline: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', background: 'white' }}
                        >
                            <option>All</option>
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Rejected</option>
                        </select>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b', fontSize: '15px', fontWeight: '600', background: 'white', borderRadius: '24px' }}>Loading certificate requests...</div>
                    ) : filteredRequests.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8', fontSize: '15px', fontWeight: '600', background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9' }}>No requests found.</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                            {filteredRequests.map(req => {
                                const statusStyle = getStatusColor(req.status);

                                return (
                                    <div
                                        key={req.id}
                                        onClick={() => handleOpenReview(req)}
                                        style={{
                                            borderRadius: '24px',
                                            border: '1.5px solid #f1f5f9',
                                            background: 'white',
                                            padding: '24px',
                                            cursor: 'pointer',
                                            transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                                        }}
                                        onMouseOver={e => {
                                            e.currentTarget.style.transform = 'translateY(-5px)';
                                            e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)';
                                            e.currentTarget.style.borderColor = '#3b82f640';
                                        }}
                                        onMouseOut={e => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.02)';
                                            e.currentTarget.style.borderColor = '#f1f5f9';
                                        }}
                                    >
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: statusStyle.text }} />

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <User color="#64748b" size={20} />
                                            </div>
                                            <span style={{
                                                background: statusStyle.bg, color: statusStyle.text,
                                                border: `1px solid ${statusStyle.border}`,
                                                padding: '4px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '950', textTransform: 'uppercase'
                                            }}>
                                                {req.status || 'Pending'}
                                            </span>
                                        </div>

                                        <div style={{ marginBottom: '16px' }}>
                                            <div style={{ fontSize: '16px', fontWeight: '950', color: '#0f172a', marginBottom: '2px' }}>{req.employee_name || req.name || 'User'}</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '800' }}>ID: {cleanEmpId(req.employee_id)}</div>
                                        </div>

                                        <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '14px', marginBottom: '16px' }}>
                                            <div style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Purpose</div>
                                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {req.purpose || req.reason || 'Not Specified'}
                                            </div>
                                        </div>

                                        {/* Direct Action Buttons */}
                                        {req.status === 'Pending' && (
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); quickStatusUpdate(req.id, 'Approved'); }}
                                                    style={{ flex: 1, background: '#22c55e', color: 'white', border: 'none', padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 10px rgba(34, 197, 94, 0.2)' }}
                                                    onMouseOver={e => e.currentTarget.style.background = '#16a34a'}
                                                    onMouseOut={e => e.currentTarget.style.background = '#22c55e'}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); quickStatusUpdate(req.id, 'Rejected'); }}
                                                    style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)' }}
                                                    onMouseOver={e => e.currentTarget.style.background = '#dc2626'}
                                                    onMouseOut={e => e.currentTarget.style.background = '#ef4444'}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Calendar size={13} color="#94a3b8" />
                                                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '800' }}>
                                                    {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}
                                                </span>
                                            </div>
                                            <ExternalLink size={14} color="#3b82f6" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            {/* Review Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '30px', position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.2)' }}
                        >
                            <button onClick={() => setSelectedRequest(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>✕</button>

                            <h2 style={{ fontSize: '22px', fontWeight: '950', color: '#0f172a', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <FileText size={24} color="#3b82f6" /> Review Request
                            </h2>

                            <div style={{ overflowY: 'auto', maxHeight: '70vh', paddingRight: '10px' }}>
                                <div style={{ display: 'grid', gap: '20px', marginBottom: '30px' }}>
                                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>Request Details</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', gap: '10px', fontSize: '14px' }}>
                                                <span style={{ fontWeight: '600', color: '#64748b', minWidth: '80px' }}>Employee:</span>
                                                <span style={{ fontWeight: '800', color: '#0f172a' }}>{selectedRequest.employee_name}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', fontSize: '14px' }}>
                                                <span style={{ fontWeight: '600', color: '#64748b', minWidth: '80px' }}>Reason:</span>
                                                <span style={{ fontWeight: '700', color: '#334155' }}>{selectedRequest.purpose || selectedRequest.reason}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Update Status</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {['Pending', 'Approved', 'Rejected'].map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => setUpdatePayload(prev => ({ ...prev, status }))}
                                                    style={{
                                                        flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid',
                                                        borderColor: updatePayload.status === status ? '#0f172a' : '#f1f5f9',
                                                        background: updatePayload.status === status ? '#0f172a' : 'white',
                                                        color: updatePayload.status === status ? 'white' : '#64748b',
                                                        fontWeight: '800', fontSize: '12px', cursor: 'pointer', transition: '0.2s'
                                                    }}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Admin Remarks</label>
                                        <textarea
                                            placeholder="Add private remarks or notes..."
                                            value={updatePayload.admin_remark}
                                            onChange={(e) => setUpdatePayload(prev => ({ ...prev, admin_remark: e.target.value }))}
                                            style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #f1f5f9', outline: 'none', fontSize: '14px', fontWeight: '600', minHeight: '80px', resize: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Certificate Download URL (PDF)</label>
                                        <input
                                            type="text"
                                            placeholder="https://example.com/certificate.pdf"
                                            value={updatePayload.certificate_url}
                                            onChange={(e) => setUpdatePayload(prev => ({ ...prev, certificate_url: e.target.value }))}
                                            style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #f1f5f9', outline: 'none', fontSize: '14px', fontWeight: '600' }}
                                        />
                                    </div>

                                    {updatePayload.status === 'Approved' && (
                                        <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '18px', border: '1.5px solid #dcfce7' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                                <Package size={18} color="#16a34a" />
                                                <span style={{ fontSize: '12px', fontWeight: '900', color: '#166534', textTransform: 'uppercase' }}>Hardware Clearance Checklist</span>
                                            </div>

                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#166534', marginBottom: '8px' }}>Laptop / Primary Asset Info</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. MacBook Pro M2, S/N: 12345"
                                                    value={updatePayload.laptop_details}
                                                    onChange={(e) => setUpdatePayload(prev => ({ ...prev, laptop_details: e.target.value }))}
                                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #bbf7d0', fontSize: '13px', outline: 'none' }}
                                                />
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                {[
                                                    { id: 'mouse', label: 'Optical Mouse' },
                                                    { id: 'keyboard', label: 'External Keyboard' },
                                                    { id: 'laptop_stand', label: 'Laptop Stand' },
                                                    { id: 'mobile', label: 'Company Mobile' },
                                                    { id: 'earphones', label: 'Earphones' },
                                                    { id: 'camera', label: 'External Camera' },
                                                    { id: 'tablet', label: 'Tablet' },
                                                    { id: 'storage', label: 'Pendrive / Storage' },
                                                    { id: 'notebook', label: 'Ref Pad / Notebook' },
                                                ].map(asset => (
                                                    <label key={asset.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '10px', background: updatePayload[asset.id] ? '#dcfce7' : 'white', border: '1px solid #bbf7d0', cursor: 'pointer', transition: '0.2s' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={updatePayload[asset.id]}
                                                            onChange={(e) => setUpdatePayload(prev => ({ ...prev, [asset.id]: e.target.checked }))}
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#166534' }}>{asset.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button onClick={() => setSelectedRequest(null)} style={{ flex: 1, padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                                <button
                                    onClick={handleRequestUpdate}
                                    disabled={updating}
                                    style={{ flex: 1, padding: '16px', borderRadius: '14px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: '800', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                                >
                                    {updating ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AppFooter />

            <style>{`
                tr:hover td {
                    background: #f1f5f9 !important;
                }
                table {
                    border-collapse: separate;
                    border-spacing: 0 10px;
                }
                td {
                    border-top: 1px solid #f1f5f9;
                    border-bottom: 1px solid #f1f5f9;
                }
                td:first-child {
                    border-left: 1px solid #f1f5f9;
                }
                td:last-child {
                    border-right: 1px solid #f1f5f9;
                }
            `}</style>
        </div>
    );
}

