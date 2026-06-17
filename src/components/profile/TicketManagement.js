import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config';
import './HRDashboard.css';
import { AlertCircle, CheckCircle, Clock, Search, Filter, Download, Send, X, MessageCircle, ArrowLeft } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';

export default function TicketManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [priorityFilter, setPriorityFilter] = useState('All Priority');
  const [winWidth, setWinWidth] = useState(window.innerWidth);

  // Action System State
  const [isManaging, setIsManaging] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [actionText, setActionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [viewingTicket, setViewingTicket] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isManaging || viewingTicket) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100%';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    };
  }, [isManaging, viewingTicket]);

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const fetchTickets = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.SUPPORT_TICKETS, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const allTickets = Array.isArray(data) ? data : (data.data || data.value || data.all || []);
        // Only fetch HR related tickets per request
        const hrTickets = allTickets.filter(t => (t.department || '').toUpperCase() === 'HR');
        setTickets(hrTickets);

        // Auto-open ticket from notification
        const openId = location.state?.openId;
        if (openId) {
          const target = hrTickets.find(t => String(t.id) === String(openId) || String(t.ticket_id) === String(openId) || String(t.ticket_number) === String(openId));
          if (target) {
            setSelectedTicket(target);
            setActionText(target.action || '');
            setIsManaging(true);

            // Clear state so it doesn't reopen on refresh
            window.history.replaceState({}, document.title);
          }
        }
      }
    } catch (err) {
      console.error('Ticket fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const searchStr = `${ticket.ticket_number || ticket.id} ${ticket.subject} ${ticket.creatorName || ticket.name || ''} ${ticket.description} ${ticket.department || ''}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All Status' || (ticket.status || '').toLowerCase() === statusFilter.toLowerCase();
    const matchesPriority = priorityFilter === 'All Priority' || (ticket.priority || '').toLowerCase() === priorityFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'closed':
        return { bg: '#f0fdf4', text: '#166534', border: '#bcf0da', icon: <CheckCircle size={14} /> };
      case '':
        return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', icon: <Clock size={14} /> };
      case 'open':
      case 'pending':
        return { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa', icon: <AlertCircle size={14} /> };
      default:
        return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', icon: <AlertCircle size={14} /> };
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return { color: '#b91c1c', label: 'CRITICAL' };
      case 'high':
      case 'urgent':
        return { color: '#ef4444', label: 'HIGH' };
      case 'medium':
        return { color: '#f59e0b', label: 'MEDIUM' };
      case 'low':
        return { color: '#10b981', label: 'LOW' };
      default:
        return { color: '#64748b', label: priority?.toUpperCase() || 'NORMAL' };
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    const today = new Date().toLocaleString();

    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text('TICKET MANAGEMENT', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('TICKETS REPORT', 14, 28);
    doc.text(`Generated on: ${today}`, 14, 34);

    const tableColumn = ["Ticket ID", "Subject", "Requester", "Priority", "Status", "Created At"];
    const tableRows = filteredTickets.map((t, index) => {
      const requesterName = t.creatorName || t.name || t.user_name || 'Anonymous';
      const createdAtVal = Array.isArray(t.created_at) ? t.created_at[0] : t.created_at;

      const formatToDDMMYYYY = (dateVal) => {
        if (!dateVal) return 'Unknown';
        try {
          let clean = String(dateVal).trim();
          if (clean.includes('Z20')) {
            clean = clean.split('Z')[0] + 'Z';
          }
          const d = new Date(clean);
          if (isNaN(d.getTime())) {
            const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (match) return `${match[3]}/${match[2]}/${match[1]}`;
            return clean.split('T')[0];
          }
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        } catch (e) {
          return 'Unknown';
        }
      };

      const createdAt = formatToDDMMYYYY(createdAtVal);
      const statusStr = String(t.status || '').toUpperCase() === 'OPEN' ? 'Pending' : (t.status || 'Pending');
      const priorityStr = (t.priority || 'NORMAL').toUpperCase();

      return [
        `#${t.ticket_number || t.id || index + 1}`,
        t.subject || t.title || 'Untitled',
        requesterName,
        priorityStr,
        statusStr,
        createdAt
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [56, 99, 168], fontSize: 10, fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 8, cellPadding: 4, valign: 'middle' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 28 }, // Ticket ID
        1: { cellWidth: 'auto' }, // Subject
        2: { cellWidth: 40 }, // Requester
        3: { cellWidth: 22, halign: 'center' }, // Priority
        4: { cellWidth: 22, halign: 'center' }, // Status
        5: { cellWidth: 30, halign: 'center' }  // Created At
      }
    });

    doc.save(`Ticket_Management_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const triggerToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
  };

  const handleSaveAction = async () => {
    if (!actionText.trim()) return triggerToast('Please enter a response.', 'error');
    setSubmitting(true);
    try {
      const ticketId = selectedTicket.id || selectedTicket.ticket_id || selectedTicket.ticket_number;
      const updatePayload = {
        id: ticketId,
        ticket_id: ticketId,
        action: actionText,
        response: actionText,
        status: 'Resolved'
      };
      const res = await fetch(`${API_ENDPOINTS.SUPPORT_TICKETS}/${encodeURIComponent(ticketId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(updatePayload)
      });

      if (res.ok) {
        triggerToast('Action submitted successfully');
        setIsManaging(false);
        setActionText('');
        // Update locally for immediate feedback
        setTickets(prev => prev.map(t => (t.id === (selectedTicket.id || selectedTicket.ticket_id) || t.ticket_id === (selectedTicket.id || selectedTicket.ticket_id)) ? { ...t, action: actionText, status: 'Resolved' } : t));
        fetchTickets(); // Refresh from server to be sure
      } else {
        // Try fallback POST
        const res2 = await fetch(`${API_ENDPOINTS.SUPPORT_TICKETS}/${encodeURIComponent(ticketId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
          body: JSON.stringify(updatePayload)
        });
        if (res2.ok) {
          triggerToast('Action submitted successfully');
          setIsManaging(false);
          setActionText('');
          setTickets(prev => prev.map(t => (t.id === (selectedTicket.id || selectedTicket.ticket_id) || t.ticket_id === (selectedTicket.id || selectedTicket.ticket_id)) ? { ...t, action: actionText, status: 'Resolved' } : t));
          fetchTickets();
        } else {
          throw new Error('Update failed');
        }
      }
    } catch (err) {
      console.error('Update error:', err);
      triggerToast('Failed to save action.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="hr-dashboard-container" style={{ minHeight: '100vh', backgroundColor: '#eaeff2', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />

      {toast.show && (
        <div style={{
          position: 'fixed', top: '90px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white', padding: '12px 30px', borderRadius: '15px', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', fontSize: '14px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
        }}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      <main style={{ flex: 1, padding: winWidth < 768 ? '20px 15px 120px' : '40px 40px 160px', maxWidth: '100%', margin: '0 auto', width: '100%', boxSizing: 'border-box', marginTop: winWidth < 768 ? '70px' : '85px' }}>
        <header style={{
          marginBottom: '32px',
          display: 'flex',
          flexDirection: winWidth < 768 ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: winWidth < 768 ? 'flex-start' : 'flex-end',
          gap: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                width: '40px', height: '40px', borderRadius: '12px', background: 'white', border: '1.5px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#3863a8'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: winWidth < 768 ? '26px' : '32px', fontWeight: '950', color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-1px' }}>Ticket Management</h1>
              <p style={{ color: '#64748b', margin: 0, fontSize: winWidth < 768 ? '14px' : '15px', fontWeight: '600', lineHeight: '1.5' }}></p>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="flex-responsive-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '16px', flexDirection: winWidth < 768 ? 'column' : 'row' }}>
          <div style={{ display: 'flex', gap: '12px', width: winWidth < 768 ? '100%' : 'auto' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ flex: 1, padding: '14px 16px', borderRadius: '15px', border: '2px solid #eef2f6', background: 'white', fontWeight: '700', color: '#1e293b', outline: 'none', cursor: 'pointer', fontSize: '13px' }}
            >
              <option>All Status</option>
              <option value="Open">Pending</option>
              <option>Resolved</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ flex: 1, padding: '14px 16px', borderRadius: '15px', border: '2px solid #eef2f6', background: 'white', fontWeight: '700', color: '#1e293b', outline: 'none', cursor: 'pointer', fontSize: '13px' }}
            >
              <option>All Priority</option>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '12px', width: winWidth < 768 ? '100%' : 'auto' }}>
            <button
              className="btn-primary"
              onClick={handleExportPDF}
              style={{ flex: 1, background: 'white', color: '#3863a8', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 20px', borderRadius: '15px', fontWeight: '800' }}
            >
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        <section style={{ background: winWidth < 768 ? 'transparent' : 'white', borderRadius: '24px', border: winWidth < 768 ? 'none' : '1.5px solid #f1f5f9', boxShadow: winWidth < 768 ? 'none' : '0 10px 25px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
          {winWidth < 768 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '20px' }}>Fetching support tickets...</div>
              ) : filteredTickets.length > 0 ? (
                filteredTickets.map((ticket, index) => {
                  const status = getStatusStyle(ticket.status);
                  const priority = getPriorityStyle(ticket.priority);
                  const createdAt = Array.isArray(ticket.created_at) ? ticket.created_at[0] : ticket.created_at;
                  const requesterName = ticket.creatorName || ticket.name || ticket.user_name || 'Anonymous';

                  return (
                    <motion.div
                      key={ticket.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        background: 'white',
                        padding: '24px',
                        borderRadius: '24px',
                        border: '1.5px solid #f1f5f9',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#3863a8', backgroundColor: '#f0f4ff', padding: '4px 12px', borderRadius: '8px' }}>
                          #{ticket.ticket_number || ticket.id || index + 1}
                        </span>
                        <span style={{
                          fontSize: '10px', fontWeight: '950', padding: '6px 12px', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.5px',
                          backgroundColor: status.bg, color: status.text, border: `1px solid ${status.border}`, display: 'inline-flex', alignItems: 'center', gap: '6px'
                        }}>
                          {status.icon} {String(ticket.status || '').toUpperCase() === 'OPEN' ? 'Pending' : (ticket.status || 'Pending')}
                        </span>
                      </div>

                      <div
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setViewingTicket(ticket);
                        }}
                      >
                        <div style={{ fontWeight: '900', color: '#3863a8', fontSize: '16px', marginBottom: '6px', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title="Click to view full subject">{ticket.subject || 'No Subject'}</div>
                        <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.description || 'No description provided.'}</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#e0e7ff', color: '#312e81', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '900' }}>
                          {requesterName.toString().charAt(0)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>{requesterName}</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Requester</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '900', color: priority.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: priority.color }}></span>
                            {priority.label}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontWeight: '700', fontSize: '12px' }}>
                            <Clock size={12} />
                            {(() => {
                              if (!createdAt) return 'Unknown';
                              let clean = String(createdAt).trim();
                              if (clean.includes('Z20')) clean = clean.split('Z')[0] + 'Z';
                              if (clean.includes('-') && clean.length === 10) {
                                const parts = clean.split('-');
                                if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                              }
                              if (clean.includes('T') && clean.includes('-')) {
                                const datePart = clean.split('T')[0];
                                if (datePart.length === 10) {
                                  const parts = datePart.split('-');
                                  if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                                }
                              }
                              const d = new Date(clean);
                              if (isNaN(d.getTime())) return clean;
                              const day = String(d.getDate()).padStart(2, '0');
                              const month = String(d.getMonth() + 1).padStart(2, '0');
                              const year = d.getFullYear();
                              return `${day}-${month}-${year}`;
                            })()}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setActionText(ticket.action || '');
                            setIsManaging(true);
                          }}
                          style={{ padding: '8px 16px', borderRadius: '10px', background: '#3863a8', color: 'white', border: 'none', fontWeight: '800', fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(56, 99, 168, 0.2)' }}
                        >
                          Manage
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '24px', border: '2px dashed #f1f5f9' }}>
                  <div style={{ fontSize: '40px', marginBottom: '20px' }}>🎫</div>
                  <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>No Tickets Found</h3>
                  <p style={{ color: '#64748b' }}>Awaiting new support requests...</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #f1f5f9' }}>
                    <th style={{ padding: '20px 25px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Ticket ID</th>
                    <th style={{ padding: '20px 25px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Subject</th>
                    <th style={{ padding: '20px 25px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Requester</th>
                    <th style={{ padding: '20px 25px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Priority</th>
                    <th style={{ padding: '20px 25px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Created At</th>
                    <th style={{ padding: '20px 25px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                    <th style={{ padding: '20px 25px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Action</th>
                  </tr>
                </thead>
                <tbody className="animate-fade-in">
                  {loading ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Fetching support tickets...</td></tr>
                  ) : filteredTickets.length > 0 ? (
                    filteredTickets.map((ticket, index) => {
                      const status = getStatusStyle(ticket.status);
                      const priority = getPriorityStyle(ticket.priority);
                      const createdAt = Array.isArray(ticket.created_at) ? ticket.created_at[0] : ticket.created_at;
                      const requesterName = ticket.creatorName || ticket.name || ticket.user_name || 'Anonymous';

                      return (
                        <tr key={ticket.id || index} style={{ borderBottom: '1.5px solid #f8fafc', transition: '0.2s' }}>
                          <td style={{ padding: '20px 25px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#3863a8', backgroundColor: '#f0f4ff', padding: '4px 10px', borderRadius: '8px' }}>
                              #{ticket.ticket_number || ticket.id || index + 1}
                            </span>
                          </td>
                          <td
                            style={{ padding: '20px 25px', cursor: 'pointer' }}
                            onClick={() => {
                              setViewingTicket(ticket);
                            }}
                          >
                            <div style={{ fontWeight: '800', color: '#3863a8', fontSize: '14px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title="Click to view full subject">{ticket.subject || 'No Subject'}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>{ticket.description || 'No description provided.'}</div>
                          </td>
                          <td style={{ padding: '20px 25px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: '#e0e7ff', color: '#312e81', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900' }}>
                                {requesterName.toString().charAt(0)}
                              </div>
                              <span style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>{requesterName}</span>
                            </div>
                          </td>
                          <td style={{ padding: '20px 25px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '900', color: priority.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: priority.color }}></span>
                              {priority.label}
                            </div>
                          </td>
                          <td style={{ padding: '20px 25px', color: '#64748b', fontWeight: '600', fontSize: '12px' }}>
                            {(() => {
                              if (!createdAt) return 'Unknown';
                              let clean = String(createdAt).trim();
                              if (clean.includes('Z20')) clean = clean.split('Z')[0] + 'Z';
                              if (clean.includes('-') && clean.length === 10) {
                                const parts = clean.split('-');
                                if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                              }
                              if (clean.includes('T') && clean.includes('-')) {
                                const datePart = clean.split('T')[0];
                                if (datePart.length === 10) {
                                  const parts = datePart.split('-');
                                  if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                                }
                              }
                              const d = new Date(clean);
                              if (isNaN(d.getTime())) return clean;
                              const day = String(d.getDate()).padStart(2, '0');
                              const month = String(d.getMonth() + 1).padStart(2, '0');
                              const year = d.getFullYear();
                              return `${day}-${month}-${year}`;
                            })()}
                          </td>
                          <td style={{ padding: '20px 25px' }}>
                            <span style={{
                              fontSize: '10px', fontWeight: '900', padding: '6px 12px', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.5px',
                              backgroundColor: status.bg, color: status.text, border: `1px solid ${status.border}`, display: 'inline-flex', alignItems: 'center', gap: '6px'
                            }}>
                              {status.icon} {String(ticket.status || '').toUpperCase() === 'OPEN' ? 'Pending' : (ticket.status || 'Pending')}
                            </span>
                          </td>
                          <td style={{ padding: '20px 25px' }}>
                            <button
                              className="btn-ghost"
                              style={{ color: '#3863a8', fontWeight: '800', fontSize: '12px', padding: '6px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px' }}
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setActionText(ticket.action || '');
                                setIsManaging(true);
                              }}
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '100px', backgroundColor: '#fcfcfd' }}>
                        <div style={{ fontSize: '40px', marginBottom: '20px' }}>🎫</div>
                        <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>No Tickets Found</h3>
                        <p style={{ color: '#64748b' }}>Awaiting new support requests...</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <AnimatePresence>
          {isManaging && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                style={{ background: '#ffffff', borderRadius: '30px', padding: '40px', width: '90%', maxWidth: '550px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
              >
                <button
                  onClick={() => setIsManaging(false)}
                  style={{ position: 'absolute', top: '20px', right: '20px', background: '#f8fafc', border: '1px solid #f1f5f9', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: '0.2s' }}
                >
                  <X size={18} />
                </button>

                <div style={{ marginBottom: '30px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px' }}>
                      <MessageCircle size={24} color="#3863a8" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', marginBottom: '2px' }}>Manage Ticket</h2>
                      <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>#{selectedTicket?.ticket_number || selectedTicket?.id}</p>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '18px', marginBottom: '24px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Original Request</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>{selectedTicket?.subject}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>{selectedTicket?.description}</div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', marginBottom: '10px', marginLeft: '4px' }}>
                    Action Taken / Response
                  </label>
                  <textarea
                    value={actionText}
                    onChange={(e) => setActionText(e.target.value)}
                    placeholder="Type your resolution or update here..."
                    style={{ width: '100%', minHeight: '150px', padding: '20px', borderRadius: '18px', border: '2.5px solid #eef2f6', background: 'white', outline: 'none', fontSize: '14px', boxSizing: 'border-box', resize: 'none', transition: '0.2s border-color' }}
                    onFocus={(e) => e.target.style.borderColor = '#3863a8'}
                    onBlur={(e) => e.target.style.borderColor = '#eef2f6'}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setIsManaging(false)}
                    style={{ flex: 1, padding: '14px', borderRadius: '15px', border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAction}
                    disabled={submitting}
                    style={{ flex: 2, padding: '14px', borderRadius: '15px', border: 'none', background: '#3863a8', color: 'white', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: submitting ? 0.7 : 1 }}
                  >
                    {submitting ? 'Saving...' : <><Send size={18} /> Submit Response</>}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {viewingTicket && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                style={{ background: '#ffffff', borderRadius: '30px', padding: '40px', width: '90%', maxWidth: '550px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
              >
                <button
                  onClick={() => setViewingTicket(null)}
                  style={{ position: 'absolute', top: '20px', right: '20px', background: '#f8fafc', border: '1px solid #f1f5f9', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: '0.2s' }}
                >
                  <X size={18} />
                </button>

                <div style={{ marginBottom: '30px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px' }}>
                      <MessageCircle size={24} color="#3863a8" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', margin: '0 0 2px 0' }}>View Ticket</h2>
                      <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', margin: 0 }}>#{viewingTicket?.ticket_number || viewingTicket?.id}</p>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '18px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Original Request</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>{viewingTicket?.subject}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{viewingTicket?.description || 'No description provided.'}</div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <AppFooter />

      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .btn-ghost:hover { background-color: #f8fafc; border-color: #3863a8; }
      `}</style>
    </div>
  );
}
