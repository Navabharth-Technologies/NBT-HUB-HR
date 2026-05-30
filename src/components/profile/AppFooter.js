import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Ticket, PlusCircle, X,
  ClipboardList, MessageSquare, UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config';
import './AppFooter.css';

export default function AppFooter({ onCreateTeam }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({ leaves: -1, tickets: -1, threads: -1 });
  const [seenCounts, setSeenCounts] = useState(() => {
    try {
      const saved = localStorage.getItem('hr_footer_seen_counts');
      return saved ? JSON.parse(saved) : { leaves: 0, tickets: 0, threads: 0 };
    } catch (e) {
      return { leaves: 0, tickets: 0, threads: 0 };
    }
  });

  const fetchUnreadCounts = async () => {
    if (!user?.token) return;
    try {
      const uid = user?.id || user?.userId || user?.employee_id;

      const userRole = user?.role?.toLowerCase() || 'employee';
      const isAdmin = ['admin', 'manager', 'lead', 'teamleader', 'ceo', 'hr'].includes(userRole);

      const fetchPromises = [
        fetch(API_ENDPOINTS.NOTIFICATIONS_BY_USER(uid), { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null)
      ];

      if (isAdmin) {
        fetchPromises.push(
          fetch(API_ENDPOINTS.LEAVES_GET, { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null),
          fetch(API_ENDPOINTS.SUPPORT_TICKETS, { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null)
        );
      }

      const results = await Promise.all(fetchPromises);
      const notifRes = results[0];
      const leaveRes = isAdmin ? results[1] : null;
      const ticketRes = isAdmin ? results[2] : null;

      const updates = { leaves: 0, tickets: 0, threads: 0 };

      if (leaveRes?.ok) {
        const lData = await leaveRes.json();
        const lList = Array.isArray(lData) ? lData : (lData.all || lData.data || []);
        updates.leaves = lList.filter(l => String(l.status || '').toLowerCase().includes('pending')).length;
      }

      if (ticketRes?.ok) {
        const tData = await ticketRes.json();
        const tList = Array.isArray(tData) ? tData : (tData.data || tData.value || []);
        updates.tickets = tList.filter(t =>
          ((t.department || '').toUpperCase() === 'HR') &&
          (String(t.status || '').toLowerCase() === 'open' || String(t.status || '').toLowerCase() === 'pending')
        ).length;
      }

      if (notifRes?.ok) {
        const nData = await notifRes.json();
        const nList = Array.isArray(nData) ? nData : (nData.data || []);
        updates.threads = nList.filter(n => (n.is_read === 0 || n.is_read === false) && (n.message + (n.type || '')).toLowerCase().includes('thread')).length;
      }

      setUnreadCounts(updates);
    } catch (e) {
      console.error("Footer counts fetch error:", e);
    }
  };

  useEffect(() => {
    fetchUnreadCounts();
    const poll = setInterval(fetchUnreadCounts, 15000);
    return () => clearInterval(poll);
  }, [user]);

  // Update seen counts when visiting the respective screens
  useEffect(() => {
    if (unreadCounts.leaves === -1 || unreadCounts.tickets === -1 || unreadCounts.threads === -1) {
      return;
    }
    setSeenCounts(prev => {
      const currentPath = location.pathname;
      const next = { ...prev };
      let changed = false;

      // Aggressive Sync: If on the page, the "seen" count must match the "live" count exactly.
      if (currentPath.startsWith('/leaves')) {
        if (next.leaves !== unreadCounts.leaves) {
          next.leaves = unreadCounts.leaves;
          changed = true;
        }
      } else if (unreadCounts.leaves < next.leaves) {
        // Sync Down: If count dropped elsewhere, match it to avoid negative badges
        next.leaves = unreadCounts.leaves;
        changed = true;
      }

      if (currentPath.startsWith('/tickets')) {
        if (next.tickets !== unreadCounts.tickets) {
          next.tickets = unreadCounts.tickets;
          changed = true;
        }
      } else if (unreadCounts.tickets < next.tickets) {
        next.tickets = unreadCounts.tickets;
        changed = true;
      }

      if (currentPath.startsWith('/threads')) {
        if (next.threads !== unreadCounts.threads) {
          next.threads = unreadCounts.threads;
          changed = true;
        }
      } else if (unreadCounts.threads < next.threads) {
        next.threads = unreadCounts.threads;
        changed = true;
      }

      if (changed) {
        localStorage.setItem('hr_footer_seen_counts', JSON.stringify(next));
        return next;
      }
      return prev;
    });
  }, [location.pathname, unreadCounts]);

  useEffect(() => {
    let timeout;

    const showFooterOnScroll = () => {
      setIsVisible(true);
      if (timeout) clearTimeout(timeout);

      // Hide after 6 seconds of no scrolling
      timeout = setTimeout(() => {
        setIsVisible(false);
      }, 6000);
    };

    // Listen to all scrolling behaviors universally
    window.addEventListener('scroll', showFooterOnScroll, { passive: true });
    window.addEventListener('wheel', showFooterOnScroll, { passive: true });
    window.addEventListener('touchmove', showFooterOnScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', showFooterOnScroll);
      window.removeEventListener('wheel', showFooterOnScroll);
      window.removeEventListener('touchmove', showFooterOnScroll);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={22} /> },
    { name: 'View tickets', path: '/tickets', icon: <Ticket size={22} /> },
    { name: 'Create', path: '/dashboard', icon: showAddMenu ? <X size={24} /> : <PlusCircle size={24} />, isAction: true },
    { name: 'Leaves', path: '/leaves', icon: <ClipboardList size={22} /> },
    { name: 'Thread', path: '/threads', icon: <MessageSquare size={22} /> },
    { name: 'Profile', path: '/profile', icon: <UserCheck size={22} /> },
  ];

  const handleNavClick = (item) => {
    if (item.isAction) {
      setShowAddMenu(!showAddMenu);
    } else {
      navigate(item.path, { state: item.state });
      setShowAddMenu(false);
    }
  };

  const isActive = (item) => {
    if (item.isAction) return false;
    if (item.name === 'Profile') {
      return location.pathname === '/profile' || location.pathname === '/performance' || location.pathname === '/personal-info';
    }
    return location.pathname === item.path;
  };

  return (
    <>
      {showAddMenu && (
        <div
          className="footer-overlay animate-fade-in"
          onClick={() => setShowAddMenu(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 2999,
          }}
        />
      )}
      <div
        className={`app-footer-wrapper ${!isVisible && !showAddMenu ? 'app-footer-hidden' : ''}`}
        onMouseEnter={() => setIsVisible(true)}
      >
        {showAddMenu && (
          <div 
            className="footer-animate-slide-up"
            style={{
              position: 'absolute',
              bottom: '90px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'row',
              gap: '4px',
              zIndex: 3001,
              width: 'max-content',
              maxWidth: 'calc(100vw - 24px)',
              overflowX: 'auto',
              boxSizing: 'border-box',
              marginBottom: '16px'
            }}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); navigate('/courses'); setShowAddMenu(false); }}
              style={{ background: 'white', borderRadius: '24px', padding: '12px 16px', boxShadow: '0 12px 28px rgba(15,23,42,0.12)', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: '12px', border: '1.5px solid #e2e8f0', width: '270px', height: '80px', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(15,23,42,0.18)'; e.currentTarget.style.borderColor = '#3863a8'; e.currentTarget.querySelector('.add-menu-icon').style.background = '#eff6ff'; e.currentTarget.querySelector('.add-menu-icon').style.transform = 'scale(1.1)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(15,23,42,0.12)'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.querySelector('.add-menu-icon').style.background = '#f1f5f9'; e.currentTarget.querySelector('.add-menu-icon').style.transform = 'none'; }}
            >
              <span className="add-menu-icon" style={{ fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', width: '44px', height: '44px', borderRadius: '50%', transition: 'all 0.2s ease', flexShrink: 0 }}>📚</span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#334155', textAlign: 'left', lineHeight: '1.2', flex: 1, whiteSpace: 'nowrap' }}>Add Course</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); navigate('/job-postings'); setShowAddMenu(false); }}
              style={{ background: 'white', borderRadius: '24px', padding: '12px 16px', boxShadow: '0 12px 28px rgba(15,23,42,0.12)', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: '12px', border: '1.5px solid #e2e8f0', width: '270px', height: '80px', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(15,23,42,0.18)'; e.currentTarget.style.borderColor = '#3863a8'; e.currentTarget.querySelector('.add-menu-icon').style.background = '#eff6ff'; e.currentTarget.querySelector('.add-menu-icon').style.transform = 'scale(1.1)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(15,23,42,0.12)'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.querySelector('.add-menu-icon').style.background = '#f1f5f9'; e.currentTarget.querySelector('.add-menu-icon').style.transform = 'none'; }}
            >
              <span className="add-menu-icon" style={{ fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', width: '44px', height: '44px', borderRadius: '50%', transition: 'all 0.2s ease', flexShrink: 0 }}>📋</span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#334155', textAlign: 'left', lineHeight: '1.2', flex: 1, whiteSpace: 'nowrap' }}>Post Vacancy</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); navigate('/payslip', { state: { openAddForm: true } }); setShowAddMenu(false); }}
              style={{ background: 'white', borderRadius: '24px', padding: '12px 16px', boxShadow: '0 12px 28px rgba(15,23,42,0.12)', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: '12px', border: '1.5px solid #e2e8f0', width: '270px', height: '80px', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(15,23,42,0.18)'; e.currentTarget.style.borderColor = '#3863a8'; e.currentTarget.querySelector('.add-menu-icon').style.background = '#eff6ff'; e.currentTarget.querySelector('.add-menu-icon').style.transform = 'scale(1.1)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(15,23,42,0.12)'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.querySelector('.add-menu-icon').style.background = '#f1f5f9'; e.currentTarget.querySelector('.add-menu-icon').style.transform = 'none'; }}
            >
              <span className="add-menu-icon" style={{ fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', width: '44px', height: '44px', borderRadius: '50%', transition: 'all 0.2s ease', flexShrink: 0 }}>📄</span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#334155', textAlign: 'left', lineHeight: '1.2', flex: 1, whiteSpace: 'nowrap' }}>Add Employee Payslip</span>
            </button>
          </div>
        )}

        <nav className="app-footer">
          {navItems.map((item) => (
            <div key={item.name} className="footer-item-container" style={{ position: 'relative' }}>
              <button
                className={`footer-item ${isActive(item) ? 'active' : ''} ${item.isAction && showAddMenu ? 'action-active' : ''}`}
                onClick={() => handleNavClick(item)}
                style={showAddMenu && !item.isAction ? {
                  filter: 'blur(3px)',
                  opacity: 0.35,
                  pointerEvents: 'none',
                  transition: 'filter 0.3s ease, opacity 0.3s ease'
                } : {
                  transition: 'filter 0.3s ease, opacity 0.3s ease'
                }}
              >
                <div className="footer-icon">
                  {item.icon}
                  {item.name === 'Leaves' && unreadCounts.leaves >= 0 && (unreadCounts.leaves - seenCounts.leaves) > 0 && !location.pathname.includes('/leaves') && <span className="footer-dot">{unreadCounts.leaves - seenCounts.leaves}</span>}
                  {item.name === 'View tickets' && unreadCounts.tickets >= 0 && (unreadCounts.tickets - seenCounts.tickets) > 0 && !location.pathname.includes('/tickets') && <span className="footer-dot">{unreadCounts.tickets - seenCounts.tickets}</span>}
                  {item.name === 'Thread' && unreadCounts.threads >= 0 && (unreadCounts.threads - seenCounts.threads) > 0 && !location.pathname.includes('/threads') && <span className="footer-dot">{unreadCounts.threads - seenCounts.threads}</span>}
                </div>
                <span className="footer-label">{item.name}</span>
              </button>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
