import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { Calendar, Plus, X, RefreshCw, ArrowLeft, Edit, Trash2, Check, MoreVertical } from 'lucide-react';

export default function HolidayScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [winWidth, setWinWidth] = useState(window.innerWidth);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '' });
  const [editingHoliday, setEditingHoliday] = useState(null);
  
  // Selection Mode States
  const [mode, setMode] = useState('view'); // 'view', 'edit_select', 'delete_select'
  const [selectedId, setSelectedId] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchHolidays = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.HOLIDAYS, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.data || []);
        
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentDay = today.getDate();
        const parseDate = (dateStr) => {
          if (!dateStr) return new Date(NaN);
          if (dateStr instanceof Date) return dateStr;
          const s = String(dateStr).trim();
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s);
          if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(s)) {
            const [d, m, y] = s.split(/[-/]/);
            return new Date(y, m - 1, d);
          }
          if (/^\d{1,2}[-/]\d{1,2}$/.test(s)) {
            const [d, m] = s.split(/[-/]/);
            return new Date(new Date().getFullYear(), m - 1, d);
          }
          return new Date(s);
        };

        const processed = list.map(h => {
          const hDate = parseDate(h.date || h.holiday_date);
          if (isNaN(hDate.getTime())) {
            return { ...h, status: 'Upcoming', month: 'N/A', day: 'N/A', dayName: 'N/A', originalMonth: 12, originalDay: 31, formattedISO: '' };
          }
          const hMonth = hDate.getMonth();
          const hDay = hDate.getDate();
          const hDayName = hDate.toLocaleDateString('en-US', { weekday: 'long' });
          const hMonthName = hDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

          let status = 'Upcoming';
          if (hMonth < currentMonth || (hMonth === currentMonth && hDay < currentDay)) {
            status = 'Passed';
          }

          return {
            ...h,
            status,
            month: hMonthName,
            day: hDay,
            dayName: hDayName,
            originalMonth: hMonth,
            originalDay: hDay,
            formattedISO: hDate.toISOString().split('T')[0]
          };
        });

        const sorted = processed.sort((a, b) => {
          if (a.originalMonth !== b.originalMonth) return a.originalMonth - b.originalMonth;
          return a.originalDay - b.originalDay;
        });

        setHolidays(sorted);
      }
    } catch (err) {
      console.error('Holidays fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [user]);

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!newHoliday.name || !newHoliday.date) return;
    setSubmitting(true);
    try {
      const payload = {
        name: newHoliday.name,
        title: newHoliday.name,
        holiday_name: newHoliday.name,
        date: newHoliday.date,
        holiday_date: newHoliday.date,
        added_by: user.name || 'Admin'
      };

      const res = await fetch(API_ENDPOINTS.HOLIDAYS_ADD, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}` 
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setShowAddModal(false);
        setNewHoliday({ name: '', date: '' });
        fetchHolidays();
      } else {
        alert(data.message || data.error || 'Failed to add holiday.');
      }
    } catch (err) {
      console.error('Error adding holiday:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateHoliday = async (e) => {
    e.preventDefault();
    if (!editingHoliday) return;
    setSubmitting(true);
    try {
      const res = await fetch(API_ENDPOINTS.HOLIDAYS_UPDATE(editingHoliday.id), {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}` 
        },
        body: JSON.stringify({
          name: editingHoliday.name,
          title: editingHoliday.name,
          date: editingHoliday.date,
          holiday_date: editingHoliday.date
        })
      });
      if (res.ok) {
        setShowEditModal(false);
        setMode('view');
        setSelectedId(null);
        fetchHolidays();
      } else {
        alert('Failed to update holiday.');
      }
    } catch (err) {
      console.error('Error updating holiday:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHoliday = async () => {
    if (!selectedId) return;
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(API_ENDPOINTS.HOLIDAYS_DELETE(selectedId), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        setMode('view');
        setSelectedId(null);
        fetchHolidays();
      } else {
        alert('Failed to delete holiday.');
      }
    } catch (err) {
      console.error('Error deleting holiday:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCardClick = (id) => {
    if (mode === 'view') return;
    setSelectedId(id);
  };

  const startEdit = () => {
    const holiday = holidays.find(h => h.id === selectedId);
    if (!holiday) return;
    setEditingHoliday({
      id: holiday.id,
      name: holiday.name || holiday.title,
      date: holiday.formattedISO
    });
    setShowEditModal(true);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f9fa', paddingBottom: '20px' }}>
      <AppHeader />
      
      <main style={{ padding: winWidth < 768 ? '100px 16px 20px' : '120px 40px 20px', width: '100%', margin: '0', boxSizing: 'border-box', position: 'relative' }}>
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          style={{ 
            position: 'absolute', left: winWidth < 768 ? '16px' : '40px', top: winWidth < 768 ? '90px' : '110px', 
            background: 'white', border: 'none', width: '45px', height: '45px', 
            borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', color: '#1e293b',
            transition: '0.2s transform', zIndex: 10
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(-3px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>

        <div style={{ position: 'absolute', right: winWidth < 768 ? '16px' : '40px', top: winWidth < 768 ? '90px' : '110px', display: 'flex', gap: '12px', zIndex: 10 }}>
          
          {/* Action Menu (Pen Icon) */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ 
                background: 'white', color: '#1e293b', border: 'none', 
                width: '45px', height: '45px', borderRadius: '15px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', transition: '0.2s'
              }}
            >
              <Edit size={20} />
            </button>

            {showDropdown && (
              <div style={{ position: 'absolute', top: '55px', right: 0, background: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '8px', minWidth: '160px', border: '1px solid #f1f5f9', zIndex: 100 }}>
                <button 
                  onClick={() => { setMode('edit_select'); setShowDropdown(false); setSelectedId(null); }}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: 'none', background: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: '#475569' }}
                  onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseOut={e => e.currentTarget.style.background = 'none'}
                >
                  <Edit size={16} /> Edit Holiday
                </button>
                <button 
                  onClick={() => { setMode('delete_select'); setShowDropdown(false); setSelectedId(null); }}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: 'none', background: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: '#ef4444' }}
                  onMouseOver={e => e.currentTarget.style.background = '#fef2f2'}
                  onMouseOut={e => e.currentTarget.style.background = 'none'}
                >
                  <Trash2 size={16} /> Delete Holiday
                </button>
              </div>
            )}
          </div>

          {/* Add Holiday Button */}
          <button 
            onClick={() => setShowAddModal(true)}
            style={{ 
              background: '#10b981', color: 'white', border: 'none', 
              padding: '0 24px', height: '45px', borderRadius: '15px', fontWeight: '900', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)', transition: '0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={18} /> Add Holiday
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '50px', marginTop: winWidth < 768 ? '40px' : '0' }}>
          <div style={{ 
            width: '60px', height: '60px', borderRadius: '16px', background: 'white', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.05)', border: '1.5px solid #e2e8f0'
          }}>
            <Calendar size={28} color="#0d9488" />
          </div>
          <h1 style={{ fontSize: winWidth < 768 ? '28px' : '38px', fontWeight: '950', color: '#1e293b', marginBottom: '8px' }}>
            NBT Calendar
          </h1>
          <p style={{ fontSize: '13px', fontWeight: '800', color: '#3863a8', letterSpacing: '2px', textTransform: 'uppercase' }}>
            OFFICIAL CORPORATE HOLIDAYS 2026
          </p>
        </div>

        {mode !== 'view' && (
          <div style={{ background: '#1e293b', padding: '12px 24px', borderRadius: '50px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '600px', margin: '0 auto 30px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
            <span style={{ fontWeight: '800', fontSize: '14px' }}>
              {mode === 'edit_select' ? 'Select a holiday card to Edit' : 'Select a holiday card to Delete'}
            </span>
            <div style={{ display: 'flex', gap: '12px' }}>
              {selectedId && (
                <button 
                  onClick={mode === 'edit_select' ? startEdit : handleDeleteHoliday}
                  style={{ background: mode === 'edit_select' ? '#10b981' : '#ef4444', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '50px', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}
                >
                  {mode === 'edit_select' ? 'Proceed with Edit' : 'Confirm Delete'}
                </button>
              )}
              <button 
                onClick={() => { setMode('view'); setSelectedId(null); }}
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '50px', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px', color: '#64748b', fontWeight: '700' }}>Synchronizing Calendar...</div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: winWidth < 768 ? '1fr' : (winWidth < 1100 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'), 
            gap: '24px',
            width: '100%'
          }}>
            {holidays.map((h, idx) => (
              <div 
                key={idx} 
                onClick={() => handleCardClick(h.id)}
                style={{ 
                  background: 'white', borderRadius: '32px', padding: '24px', 
                  display: 'flex', alignItems: 'center', gap: '20px', 
                  boxShadow: selectedId === h.id ? '0 0 0 3px #10b981, 0 15px 35px -5px rgba(0,0,0,0.1)' : '0 15px 35px -5px rgba(0,0,0,0.04)', 
                  border: h.status === 'Upcoming' ? '2.5px solid #10b981' : '1px solid rgba(241, 245, 249, 0.8)',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: mode !== 'view' ? 'pointer' : 'default',
                  transition: '0.2s all'
                }}
              >
                {/* Selection Indicator (Radio Button style) */}
                {mode !== 'view' && (
                  <div style={{ 
                    width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #cbd5e1', 
                    background: selectedId === h.id ? '#10b981' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'absolute', top: '15px', left: '15px', zIndex: 2
                  }}>
                    {selectedId === h.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                  </div>
                )}

                {/* Date Box */}
                <div style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  minWidth: '70px', height: '85px', borderRadius: '20px', border: '1px solid #f1f5f9',
                  marginLeft: mode !== 'view' ? '25px' : '0'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>{h.month}</div>
                  <div style={{ fontSize: '26px', fontWeight: '950', color: '#1e293b', lineHeight: 1, margin: '2px 0' }}>{h.day}</div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8' }}>{h.dayName.substring(0, 8)}</div>
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b', margin: 0, textAlign: 'center' }}>
                    {h.name || h.title}
                  </h3>
                </div>

                {/* Badge */}
                <div style={{ 
                  position: 'absolute', bottom: '15px', right: '15px',
                  padding: '5px 12px', borderRadius: '10px', 
                  background: h.status === 'Passed' ? '#f1f5f9' : '#10b981',
                  color: h.status === 'Passed' ? '#94a3b8' : 'white',
                  fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px'
                }}>
                  {h.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Holiday Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="animate-slide-up" style={{ background: '#ffffff', borderRadius: '30px', padding: '40px', width: '90%', maxWidth: '420px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <button 
              onClick={() => setShowAddModal(false)} 
              style={{ position: 'absolute', top: '25px', right: '25px', background: '#f8fafc', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                <Plus size={24} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Add New Holiday</h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', fontWeight: '600' }}>Updates the corporate calendar</p>
            </div>

            <form onSubmit={handleAddHoliday} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Holiday Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Independence Day"
                  value={newHoliday.name}
                  onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Holiday Date</label>
                <input 
                  type="date" 
                  value={newHoliday.date}
                  onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })}
                  style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                style={{ width: '100%', padding: '16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '50px', fontWeight: '900', fontSize: '15px', cursor: submitting ? 'not-allowed' : 'pointer', marginTop: '10px', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {submitting ? <RefreshCw size={18} className="spin" /> : 'Confirm Holiday'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Holiday Modal */}
      {showEditModal && editingHoliday && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="animate-slide-up" style={{ background: '#ffffff', borderRadius: '30px', padding: '40px', width: '90%', maxWidth: '420px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <button 
              onClick={() => { setShowEditModal(false); setMode('view'); setSelectedId(null); }} 
              style={{ position: 'absolute', top: '25px', right: '25px', background: '#f8fafc', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                <Edit size={24} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Edit Holiday</h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', fontWeight: '600' }}>Modify existing calendar event</p>
            </div>

            <form onSubmit={handleUpdateHoliday} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Holiday Name</label>
                <input 
                  type="text" 
                  value={editingHoliday.name}
                  onChange={e => setEditingHoliday({ ...editingHoliday, name: e.target.value })}
                  style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Holiday Date</label>
                <input 
                  type="date" 
                  value={editingHoliday.date}
                  onChange={e => setEditingHoliday({ ...editingHoliday, date: e.target.value })}
                  style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                style={{ width: '100%', padding: '16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '50px', fontWeight: '900', fontSize: '15px', cursor: submitting ? 'not-allowed' : 'pointer', marginTop: '10px', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {submitting ? <RefreshCw size={18} className="spin" /> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      <AppFooter />
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
}
