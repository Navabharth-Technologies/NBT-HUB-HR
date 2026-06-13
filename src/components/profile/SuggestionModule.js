import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { ArrowLeft, Download, Calendar, X, ClipboardList, Lightbulb } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, BASE_URL } from '../../config';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Dashboard.css';

export default function SuggestionModule() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Parse a date string like "22/5/2026" or "5/22/2026" or "22-05-2026" safely
  const parseDate = (dateStr) => {
    if (!dateStr || dateStr === 'Today') return new Date();
    
    const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        const d = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`);
        if (!isNaN(d)) return d;
      } else {
        // Try d/m/yyyy or dd-mm-yyyy
        const d = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
        if (!isNaN(d)) return d;
        // Try m/d/yyyy or mm-dd-yyyy
        const d2 = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
        if (!isNaN(d2)) return d2;
      }
    }

    // Try ISO fallback
    const iso = new Date(dateStr);
    if (!isNaN(iso)) return iso;

    return null;
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (!fromDate && !toDate) return true;
    const d = parseDate(s.date);
    if (!d) return true;
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (to) to.setHours(23, 59, 59, 999);
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });

  const clearFilter = () => {
    setFromDate('');
    setToDate('');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('en-GB');

    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text('NBT Suggestions Hub Report', 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Total Submissions: ${filteredSubmissions.length}`, 14, 30);
    doc.text(`Report Type: Suggestion Details`, 14, 36);
    doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 42);

    let currentY = 50;
    if (fromDate || toDate) {
      const fromStr = fromDate ? new Date(fromDate).toLocaleDateString('en-GB') : 'Start';
      const toStr = toDate ? new Date(toDate).toLocaleDateString('en-GB') : 'Today';
      doc.text(`Date Range: ${fromStr} to ${toStr}`, 14, 48);
      currentY = 56;
    }

    const cleanText = (str) => {
      if (!str) return 'N/A';
      return String(str)
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/[^\x20-\x7E\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const tableColumn = ["Submitted By", "Emp ID / Team", "Date", "Suggestion Content", "Engagement"];
    const tableRows = filteredSubmissions.map(s => [
      cleanText(s.user),
      cleanText(s.team),
      cleanText(s.date),
      cleanText(s.content),
      cleanText(s.participation).toUpperCase()
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: currentY,
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 5, bottom: 5, left: 3, right: 3 },
        valign: 'middle',
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 24 },
        2: { cellWidth: 24, halign: 'center' },
        3: { cellWidth: 78 },
        4: { cellWidth: 28, halign: 'center' }
      },
      headStyles: { fillColor: [49, 99, 170], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 12, right: 12 }
    });

    doc.save(`Suggestions_Report_${today.replace(/\//g, '-')}.pdf`);
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      const token = user?.token || localStorage.getItem('token');
      if (!token) { setLoading(false); return; }
      try {
        setLoading(true);
        const res = await fetch(API_ENDPOINTS.SUGGESTIONS, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.data || data.suggestions || []);
          const mapped = list.map(s => {
            const rawDate = s.created_at || s.date;
            let formattedDate = 'Today';
            if (rawDate && rawDate !== 'Today') {
              if (typeof rawDate === 'string' && rawDate.includes('-') && rawDate.length === 10) {
                const parts = rawDate.split('-');
                if (parts[0].length === 4) {
                  formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                } else {
                  formattedDate = rawDate;
                }
              } else {
                const d = new Date(rawDate);
                if (!isNaN(d.getTime())) {
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  formattedDate = `${day}-${month}-${year}`;
                } else {
                  formattedDate = rawDate;
                }
              }
            }
            return {
              user: s.employee_name || s.user_name || s.user || 'Anonymous',
              team: s.employee_id || s.department || s.team || 'N/A',
              date: formattedDate,
              content: s.suggestion || s.suggestion_text || s.message || s.content || 'No content provided.',
              participation: s.requirement || s.status || s.participation || 'Active',
              profile_pic: s.profile_pic || s.profile_picture || s.user_profile_pic || s.user_pic
            };
          });
          setSubmissions(mapped);
        } else {
          console.error('Failed to fetch suggestions:', res.status);
        }
      } catch (err) {
        console.error('Suggestion fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, [user]);

  return (
    <div className="hr-dashboard-container suggestion-screen-container">
      <style>{`
        .suggestion-screen-container,
        .suggestion-screen-container * {
          font-family: 'Outfit', sans-serif !important;
        }
      `}</style>
      <AppHeader />

      <main className="dashboard-content" style={{ paddingBottom: '100px' }}>
        {/* Page Header */}
        <header className="section-header" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: 'white', padding: '10px', borderRadius: '12px',
                border: '1px solid #e2e8f0', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <ArrowLeft size={18} color="#64748b" />
            </button>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--secondary)' }}>Suggestions Hub</h1>
              <p style={{ color: 'var(--text-muted)' }}></p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={handleExportPDF}
              className="btn-outline"
              style={{
                background: 'white', color: 'var(--primary)', border: '2px solid #cbd5e1',
                borderRadius: '12px', padding: '10px 18px', fontSize: '13px', fontWeight: '800',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <Download size={16} /> Export PDF
            </button>
          </div>
        </header>

        {/* Date Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '6px 14px', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', height: '44px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', fontWeight: '800', color: '#1e293b', width: '130px', fontFamily: 'inherit', cursor: 'pointer' }}
              />
            </div>

            <div style={{ width: '1.5px', height: '16px', background: '#e2e8f0' }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>To</span>
              <input
                type="date"
                value={toDate}
                min={fromDate || ''}
                onChange={(e) => setToDate(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', fontWeight: '800', color: '#1e293b', width: '130px', fontFamily: 'inherit', cursor: 'pointer' }}
              />
            </div>
          </div>

          {(fromDate || toDate) && (
            <button
              onClick={clearFilter}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fecaca',
                borderRadius: '10px', padding: '7px 12px', fontSize: '12px', fontWeight: '800',
                cursor: 'pointer', transition: 'all 0.2s', height: '36px'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
            >
              <X size={13} /> Clear
            </button>
          )}

          {/* Result count */}
          <span style={{
            marginLeft: 'auto', fontSize: '12px', fontWeight: '800',
            color: '#64748b', background: '#f1f5f9', padding: '6px 14px',
            borderRadius: '20px'
          }}>
            {loading ? '...' : `${filteredSubmissions.length} result${filteredSubmissions.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Submissions Section */}
        <section className="dashboard-section animate-fade-in" style={{ border: 'none', boxShadow: 'none', padding: '0 4px' }}>
          <h2 className="section-title">Recent Submissions</h2>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--white)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
                <p style={{ fontWeight: '800' }}>Fetching latest suggestions...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--white)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
                <Calendar size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                <p style={{ fontWeight: '800' }}>
                  {submissions.length === 0 ? 'No submissions found.' : 'No submissions found for the selected date range.'}
                </p>
                {(fromDate || toDate) && (
                  <button
                    onClick={clearFilter}
                    style={{ marginTop: '12px', background: '#315A9E', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 18px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            ) : (
              filteredSubmissions.map((s, i) => (
                <div key={i} style={{ 
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderTop: '4px solid #f59e0b',
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  {/* Date Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontWeight: '800', fontSize: '13px' }}>
                    <Calendar size={14} color="#1e293b" />
                    {s.date}
                  </div>

                  {/* Requirement Block */}
                  <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #e0f2fe',
                    borderRadius: '10px',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontSize: '11px', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <ClipboardList size={14} />
                      Requirement
                    </div>
                    <div style={{ color: '#1e293b', fontSize: '14px', fontWeight: '600', lineHeight: '1.5' }}>
                      {s.participation}
                    </div>
                  </div>

                  {/* Suggestion Block */}
                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fef3c7',
                    borderRadius: '10px',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d97706', fontSize: '11px', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <Lightbulb size={14} />
                      Suggestion
                    </div>
                    <div style={{ color: '#1e293b', fontSize: '14px', fontWeight: '600', lineHeight: '1.5' }}>
                      {s.content}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
