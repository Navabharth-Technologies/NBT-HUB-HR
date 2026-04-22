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

  const fetchUnreadCounts = async () => {
    if (!user?.token) return;
    try {
      const uid = user?.id || user?.userId || user?.employee_id;
      
      const [leaveRes, ticketRes, notifRes] = await Promise.all([
        fetch(API_ENDPOINTS.LEAVES_GET, { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null),
        fetch(API_ENDPOINTS.SUPPORT_TICKETS, { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null),
        fetch(API_ENDPOINTS.NOTIFICATIONS_BY_USER(uid), { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => null)
      ]);

      let leaveCount = 0;
      let ticketCount = 0;
      let threadCount = 0;

      if (leaveRes?.ok) {
        const lData = await leaveRes.json();
        const lList = Array.isArray(lData) ? lData : (lData.all || lData.data || []);
        leaveCount = lList.filter(l => String(l.status || '').toLowerCase().includes('pending')).length;
      }

      if (ticketRes?.ok) {
        const tData = await ticketRes.json();
        const tList = Array.isArray(tData) ? tData : (tData.data || []);
        ticketCount = tList.filter(t => 
          ((t.department || '').toUpperCase() === 'HR') && 
          (String(t.status || '').toLowerCase() === 'open' || String(t.status || '').toLowerCase() === 'pending')
        ).length;
      }

      if (notifRes?.ok) {
        const nData = await notifRes.json();
        const nList = Array.isArray(nData) ? nData : (nData.data || []);
        threadCount = nList.filter(n => (n.is_read === 0 || n.is_read === false) && (n.message + (n.type || '')).toLowerCase().includes('thread')).length;
      }

      setUnreadCounts({
        leaves: leaveCount,
        tickets: ticketCount,
        threads: threadCount
      });
    } catch (e) {
      console.error("Footer counts fetch error:", e);
    }
  };

  useEffect(() => {
    fetchUnreadCounts();
    const poll = setInterval(fetchUnreadCounts, 15000);
    return () => clearInterval(poll);
  }, [user]);

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

    // Listen to scroll events
    window.addEventListener('scroll', showFooterOnScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', showFooterOnScroll);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={22} /> },
    { name: 'View tickets', path: '/tickets', icon: <Ticket size={22} /> },
    { name: 'Create', path: '/dashboard', icon: <PlusCircle size={24} />, isAction: true },
    { name: 'Leaves', path: '/attendance', icon: <ClipboardList size={22} />, state: { tab: 'leaves' } },
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
      {showAddMenu && (
        <div className="add-upward-menu animate-slide-up">
          <button className="add-menu-item" onClick={() => { if (onCreateTeam) onCreateTeam(); else navigate('/teams'); setShowAddMenu(false); }}>
            <span className="add-menu-icon">👥</span>
            <span>Create New Team</span>
          </button>
          <button className="add-menu-item" onClick={() => { navigate('/courses'); setShowAddMenu(false); }}>
            <span className="add-menu-icon">📚</span>
            <span>Add Course</span>
          </button>
          <button className="add-menu-item" onClick={() => { navigate('/suggestions'); setShowAddMenu(false); }}>
            <span className="add-menu-icon">💡</span>
            <span>Review Suggestions</span>
          </button>
        </div>
      )}

      <nav className="app-footer">
        {navItems.map((item) => (
          <button
            key={item.name}
            className={`footer-item ${isActive(item.path) ? 'active' : ''} ${item.isAction && showAddMenu ? 'action-active' : ''}`}
            onClick={() => handleNavClick(item)}
          >
            <div className="footer-icon">
              {item.icon}
              {item.name === 'Leaves' && unreadCounts.leaves > 0 && !location.pathname.includes('/attendance') && <span className="footer-dot">{unreadCounts.leaves}</span>}
              {item.name === 'View tickets' && unreadCounts.tickets > 0 && !location.pathname.includes('/tickets') && <span className="footer-dot">{unreadCounts.tickets}</span>}
              {item.name === 'Thread' && unreadCounts.threads > 0 && !location.pathname.includes('/engagement') && <span className="footer-dot">{unreadCounts.threads}</span>}
            </div>
            <span className="footer-label">{item.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
