import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Ticket, PlusCircle, 
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
  const [unreadCounts, setUnreadCounts] = useState({ leaves: 0, tickets: 0, threads: 0 });
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
      
      const [leaveRes, ticketRes, notifRes] = await Promise.all([
        fetch(API_ENDPOINTS.LEAVES_GET, { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null),
        fetch(API_ENDPOINTS.SUPPORT_TICKETS, { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null),
        fetch(API_ENDPOINTS.NOTIFICATIONS_BY_USER(uid), { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null)
      ]);

      const updates = {};

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

      if (Object.keys(updates).length > 0) {
        setUnreadCounts(prev => ({ ...prev, ...updates }));
      }
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

      if (currentPath.startsWith('/engagement')) {
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
    { name: 'Create', path: '/dashboard', icon: <PlusCircle size={24} />, isAction: true },
    { name: 'Leaves', path: '/leaves', icon: <ClipboardList size={22} /> },
    { name: 'Thread', path: '/engagement', icon: <MessageSquare size={22} /> },
    { name: 'Attendance', path: '/attendance', icon: <UserCheck size={22} /> },
  ];

  const handleNavClick = (item) => {
    if (item.isAction) {
      setShowAddMenu(!showAddMenu);
    } else {
      navigate(item.path, { state: item.state });
      setShowAddMenu(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div 
        className={`app-footer-wrapper ${!isVisible && !showAddMenu ? 'app-footer-hidden' : ''}`}
        onMouseEnter={() => setIsVisible(true)}
    >
      <nav className="app-footer">
        {navItems.map((item) => (
          <div key={item.name} className="footer-item-container" style={{ position: 'relative' }}>
            {item.isAction && showAddMenu && (
              <div className="add-upward-menu animate-slide-up">
                <button className="add-menu-item" onClick={(e) => { e.stopPropagation(); if (onCreateTeam) onCreateTeam(); else navigate('/teams'); setShowAddMenu(false); }}>
                  <span className="add-menu-icon">👥</span>
                  <span>Create New Team</span>
                </button>
                <button className="add-menu-item" onClick={(e) => { e.stopPropagation(); navigate('/courses'); setShowAddMenu(false); }}>
                  <span className="add-menu-icon">📚</span>
                  <span>Add Course</span>
                </button>
                <button className="add-menu-item" onClick={(e) => { e.stopPropagation(); navigate('/suggestions'); setShowAddMenu(false); }}>
                  <span className="add-menu-icon">💡</span>
                  <span>Review Suggestions</span>
                </button>
              </div>
            )}
            <button
              key={item.name}
              className={`footer-item ${isActive(item.path) ? 'active' : ''} ${item.isAction && showAddMenu ? 'action-active' : ''}`}
              onClick={() => handleNavClick(item)}
            >
              <div className="footer-icon">
                {item.icon}
                {item.name === 'Leaves' && (unreadCounts.leaves - seenCounts.leaves) > 0 && !location.pathname.includes('/leaves') && <span className="footer-dot">{unreadCounts.leaves - seenCounts.leaves}</span>}
                {item.name === 'View tickets' && (unreadCounts.tickets - seenCounts.tickets) > 0 && !location.pathname.includes('/tickets') && <span className="footer-dot">{unreadCounts.tickets - seenCounts.tickets}</span>}
                {item.name === 'Thread' && (unreadCounts.threads - seenCounts.threads) > 0 && !location.pathname.includes('/engagement') && <span className="footer-dot">{unreadCounts.threads - seenCounts.threads}</span>}
              </div>
              <span className="footer-label">{item.name}</span>
            </button>
          </div>
        ))}
      </nav>
    </div>
  );
}
