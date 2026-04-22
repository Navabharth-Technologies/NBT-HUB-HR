import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config';

const TaskNotification = ({ onOpenTask }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [lastIds, setLastIds] = useState(new Set());
  
  const [winWidth, setWinWidth] = useState(window.innerWidth);

  // Auto-dismiss visited notifications
  useEffect(() => {
    const path = location.pathname;
    setNotifications(prev => prev.filter(n => {
       const msg = (n.description || '').toLowerCase();
       const title = (n.title || '').toLowerCase();
       const combine = msg + title;

       if (path.includes('/attendance') && combine.includes('leave')) return false;
       if (path.includes('/tickets') && combine.includes('ticket')) return false;
       if (path.includes('/engagement') && combine.includes('thread')) return false;
       if (path.includes('/admin/resignations') && combine.includes('resignation')) return false;
       if (path.includes('/admin/certificates') && combine.includes('certificate')) return false;
       if (path.includes('/job-applications') && combine.includes('job')) return false;
       if (path.includes('/assets') && combine.includes('asset')) return false;
       if (path.includes('/performance') && combine.includes('performance')) return false;
       if (path.includes('/courses') && combine.includes('course')) return false;
       if (path.includes('/awards') && combine.includes('award')) return false;
       if (path.includes('/new-joinees') && (combine.includes('joinee') || n.isBlockedAlert)) return false;
       
       return true;
    }));
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchBlockedJoinees = async () => {
    if (!user?.token) return;
    try {
      const res = await fetch(API_ENDPOINTS.NEW_JOINEES, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const blockedUsers = (data || []).filter(j => Number(j.is_blocked) === 1);
        
        const blockedNotifications = blockedUsers.map(user => ({
           id: `blocked-${user.id || user.name}`,
           title: 'BLOCKED JOINEE',
           description: `${user.name} got blocked for pending courses. Please unblock them.`,
           time: 'JUST NOW',
           date: new Date().toLocaleDateString(),
           isNew: true,
           rawDate: new Date(),
           isBlockedAlert: true
        }));
        
        setNotifications(prev => {
           // Always remove old blocked alerts and re-add current ones (or none if list is empty)
           const otherNotifs = (prev || []).filter(n => !n.isBlockedAlert);
           return [...blockedNotifications, ...otherNotifs].sort((a, b) => b.rawDate - a.rawDate);
        });
        
        // Only trigger "unread" bubble if we actually found NEW blocked users that weren't there before
        if (blockedUsers.length > 0 && !isOpen) {
           setHasUnread(true);
        }
      }
    } catch (err) {
      console.error("Blocked Joinee Fetch Error:", err);
    }
  };

  const fetchNotifications = async () => {
    if (!user?.token) return;
    const uid = user?.id || user?.empId || user?.userId || user?.employee_id;

    try {
      const endpoints = [
        fetch(API_ENDPOINTS.NOTIFICATIONS_BY_USER(uid), { headers: { 'Authorization': `Bearer ${user.token}` } }),
        fetch(API_ENDPOINTS.LEAVES_GET, { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null),
        fetch(API_ENDPOINTS.SUPPORT_TICKETS, { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null),
        fetch(API_ENDPOINTS.RESIGNATIONS_GET, { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null),
        fetch(API_ENDPOINTS.SERVICE_CERTIFICATES_GET, { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null),
        fetch(API_ENDPOINTS.THREADS || '', { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null),
        fetch(API_ENDPOINTS.JOB_APPLICATIONS || '', { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null)
      ];

      const results = await Promise.all(endpoints);
      let aggregated = [];

      const parseDate = (d) => {
        const r = new Date(d);
        return isNaN(r.getTime()) ? new Date() : r;
      };

      // 1. System Notifications
      if (results[0]?.ok) {
        const data = await results[0].json();
        const list = Array.isArray(data) ? data : (data.data || []);
        list.forEach(n => aggregated.push({
          id: `sys-${n.id}`,
          title: (n.type || 'SYSTEM').toUpperCase(),
          description: n.message,
          rawDate: parseDate(n.created_at || n.timestamp),
          isNew: n.is_read === 0 || n.is_read === false,
          type: 'system'
        }));
      }

      // 2. Pending Leaves
      if (results[1]?.ok) {
        const data = await results[1].json();
        const list = Array.isArray(data) ? data : (data.all || data.data || data.requests || []);
        list.filter(l => String(l.status || '').toLowerCase().includes('pending')).forEach(l => aggregated.push({
          id: `leave-${l.id}`,
          title: 'LEAVE REQUEST',
          description: `New Leave Request from ${l.employee_name || l.name || 'Employee'} (${l.leave_type}): ${l.start_date} to ${l.end_date}`,
          rawDate: parseDate(l.created_at || l.date),
          isNew: true,
          type: 'leave'
        }));
      }

      // 3. Open Tickets
      if (results[2]?.ok) {
        const data = await results[2].json();
        const list = Array.isArray(data) ? data : (data.data || []);
        list.filter(t => String(t.status || '').toLowerCase() === 'open' || String(t.status || '').toLowerCase() === 'pending').forEach(t => aggregated.push({
          id: `ticket-${t.id}`,
          title: 'SUPPORT TICKET',
          description: `New Ticket #${t.ticket_no || t.id}: ${t.subject || 'No Subject'}`,
          rawDate: parseDate(t.created_at),
          isNew: true,
          type: 'ticket'
        }));
      }

      // 4. Pending Resignations
      if (results[3]?.ok) {
        const data = await results[3].json();
        const list = Array.isArray(data) ? data : (data.data || []);
        list.filter(r => String(r.status || '').toLowerCase().includes('pending')).forEach(r => aggregated.push({
          id: `resig-${r.id}`,
          title: 'RESIGNATION',
          description: `Resignation Request from ${r.employee_name || r.name || 'Employee'}: ${r.reason || 'No reason specified'}`,
          rawDate: parseDate(r.created_at),
          isNew: true,
          type: 'resignation'
        }));
      }

      // 5. Pending Certificates
      if (results[4]?.ok) {
        const data = await results[4].json();
        const list = Array.isArray(data) ? data : (data.data || []);
        list.filter(c => String(c.status || '').toLowerCase().includes('pending')).forEach(c => aggregated.push({
          id: `cert-${c.id}`,
          title: 'CERTIFICATE REQUEST',
          description: `Service Certificate Request from ${c.employee_name || 'Employee'}`,
          rawDate: parseDate(c.created_at),
          isNew: true,
          type: 'certificate'
        }));
      }

      // 6. Job Applications
      if (results[6]?.ok) {
        const data = await results[6].json();
        const list = Array.isArray(data) ? data : (data.data || []);
        list.filter(j => String(j.status || '').toLowerCase().includes('pending')).forEach(j => aggregated.push({
          id: `job-${j.id}`,
          title: 'JOB APPLICATION',
          description: `New Application: ${j.full_name} for ${j.position}`,
          rawDate: parseDate(j.created_at),
          isNew: true,
          type: 'job'
        }));
      }

      const finalMapped = aggregated.sort((a, b) => b.rawDate - a.rawDate).map(n => ({
        ...n,
        time: n.rawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: n.rawDate.toLocaleDateString()
      }));

      setNotifications(finalMapped);
      const hasNew = finalMapped.some(n => n.isNew);
      if (hasNew && !isOpen) setHasUnread(true);

    } catch (err) {
      console.error("Notification Aggregator Sync Error:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchBlockedJoinees();
    const poll = setInterval(() => {
      fetchNotifications();
      fetchBlockedJoinees();
    }, 15000);
    return () => clearInterval(poll);
  }, [user, lastIds.size]);

  const isMobile = winWidth < 768;

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: isMobile ? '145px' : '175px', 
      right: isMobile ? '10px' : '30px', 
      zIndex: 1000, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'flex-end', 
      gap: '15px' 
    }}>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            style={{
              background: 'white',
              width: isMobile ? 'calc(100vw - 20px)' : '360px',
              maxHeight: '520px',
              borderRadius: isMobile ? '20px' : '28px 28px 4px 28px',
              boxShadow: '0 30px 70px rgba(0, 0, 0, 0.2)',
              border: '1.5px solid #f1f5f9',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '20px', background: '#3B5998', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bell size={20} fill="white" />
                <span style={{ fontWeight: '1000', fontSize: '14px', letterSpacing: '0.5px' }}>NOTIFICATIONS</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', padding: '6px', color: 'white', cursor: 'pointer', display: 'flex' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc' }}>
              {notifications.length > 0 ? notifications.map((notif, idx) => {
                const isLeave = (notif.description || '').toLowerCase().includes('leave request');
                let leaveInfo = null;
                if (isLeave) {
                   const match = notif.description.match(/Leave Request from (.*?) \((.*?)\): (.*)/);
                   if (match) {
                     leaveInfo = { name: match[1], type: match[2], dates: match[3] };
                   }
                }

                return (
                <div key={notif.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '9px', fontWeight: '1000', color: '#94a3b8', marginLeft: '5px', marginBottom: '1px' }}>{notif.time.toUpperCase()} - {notif.date}</div>
                  <div style={{
                    background: notif.isNew ? '#ffffff' : '#f8fafc',
                    padding: '12px',
                    borderRadius: '16px 16px 16px 4px',
                    boxShadow: notif.isNew ? '0 4px 15px rgba(59, 89, 152, 0.12)' : 'none',
                    border: notif.isNew ? '1.5px solid #3B5998' : '1px solid #eef2f6',
                    position: 'relative'
                  }}>
                    {notif.isNew && (
                      <div style={{ position: 'absolute', top: '-8px', right: '10px', background: '#3B5998', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '8px', fontWeight: '1000' }}>URGENT</div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: isLeave ? '8px' : '4px' }}>
                      <Bell size={12} color="#3B5998" />
                      <span style={{ fontWeight: '1000', fontSize: '12px', color: '#0B1E3F' }}>{notif.title}</span>
                    </div>
                    
                    {isLeave && leaveInfo ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '900', color: '#1e293b' }}>Leave Request: {leaveInfo.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Type: {leaveInfo.type}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Dates: {leaveInfo.dates}</div>
                      </div>
                    ) : (
                      <p style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4', margin: 0, fontWeight: '600' }}>{notif.description}</p>
                    )}
                    
                    {(notif.isNew || idx === 0) && (
                      <button
                        onClick={() => {
                          const desc = (notif.description || '').toLowerCase();
                          const title = (notif.title || '').toLowerCase();

                          if (notif.isBlockedAlert) {
                            window.location.href = '/new-joinees#blocked';
                          } else if (desc.includes('leave') || title.includes('leave')) {
                            window.location.href = '/attendance';
                          } else if (desc.includes('resignation') || title.includes('resignation')) {
                            window.location.href = '/admin/resignations';
                          } else if (desc.includes('certificate') || title.includes('certificate')) {
                            window.location.href = '/admin/certificates';
                          } else if (desc.includes('job') || title.includes('job')) {
                            window.location.href = '/job-applications';
                          } else if (desc.includes('ticket') || title.includes('ticket')) {
                            window.location.href = '/tickets';
                          } else if (desc.includes('asset') || title.includes('asset')) {
                            window.location.href = '/assets';
                          } else if (desc.includes('performance') || title.includes('performance')) {
                            window.location.href = '/performance';
                          } else if (desc.includes('course') || title.includes('course')) {
                            window.location.href = '/courses';
                          } else if (desc.includes('award') || title.includes('award') || desc.includes('recognition')) {
                            window.location.href = '/awards';
                          } else if (onOpenTask) {
                            onOpenTask();
                          } else {
                            window.location.href = '/alerts';
                          }
                          setIsOpen(false);
                          setHasUnread(false);
                        }}
                        style={{
                          marginTop: '12px',
                          width: '100%',
                          background: notif.isBlockedAlert ? '#ef4444' : '#3B5998',
                          color: 'white',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '10px',
                          fontWeight: '1000',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: notif.isBlockedAlert ? '0 4px 12px rgba(239, 68, 68, 0.2)' : 'none'
                        }}
                      >
                        <Play size={12} fill="white" /> {notif.isBlockedAlert ? 'MANAGE JOINEES' : 'VIEW NOTIFICATION'}
                      </button>
                    )}
                  </div>
                </div>
                );
              }) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '13px', fontWeight: '700' }}>
                   No new assignments yet.
                </div>
              )}
            </div>

            <div style={{ padding: '12px', background: 'white', borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: '11px', fontWeight: '1000', color: '#3B5998' }}>
              NBT HUB ASSISTANCE LIVE
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setHasUnread(false);
        }}
        style={{
          background: '#3B5998',
          color: 'white',
          width: isMobile ? '50px' : '60px',
          height: isMobile ? '50px' : '60px',
          borderRadius: '50%',
          boxShadow: '0 20px 40px rgba(59, 89, 152, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: 0
        }}
      >
        <Bell size={isMobile ? 22 : 26} fill="white" />
        {hasUnread && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{
              position: 'absolute',
              top: isMobile ? '10px' : '15px',
              right: isMobile ? '10px' : '15px',
              width: '12px',
              height: '12px',
              background: '#ef4444',
              borderRadius: '50%',
              border: '2px solid white'
            }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default TaskNotification;
