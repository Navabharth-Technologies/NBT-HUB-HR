import React, { useState, useEffect } from 'react';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { 
  Search, Download, ArrowLeft, User, 
  Filter, Calendar, Clock, FileText
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './HRDashboard.css';

export default function AllEmployeesReport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [winWidth, setWinWidth] = useState(window.innerWidth);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filter = params.get('filter');
    if (filter) {
      setActiveFilter(filter);
    }
  }, [location]);

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const logsRes = await fetch(`${API_ENDPOINTS.ATTENDANCE_LOGS_GET}?limit=2000`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          const allLogs = logsData?.data || logsData?.attendance || [];
          
          // Map real logs to report format
          const mapped = allLogs.map((log) => {
            const punchIn = log?.in_time || log?.INTime || '----';
            const punchOut = log?.out_time || log?.OUTTime || '----';
            const rawDate = log?.punch_date || log?.date || log?.created_at || '';
            const dateStr = rawDate ? String(rawDate).split('T')[0].split(' ')[0] : 'N/A';
            
            return {
              id: log.user_id || log.Empcode || 'N/A',
              name: log.user_name || 'Individual Employee',
              role: log.role || log.department || 'Staff',
              punchIn,
              punchOut,
              date: dateStr,
              status: log.status || (punchIn !== '----' ? 'PRESENT' : 'ABSENT')
            };
          });
          setEmployees(mapped);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [user]);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeFilter === 'all') return true;
    if (activeFilter === 'attendance' || activeFilter === 'present') return emp.status.toUpperCase() === 'PRESENT';
    if (activeFilter === 'leave' || activeFilter === 'absent') return emp.status.toUpperCase() === 'ABSENT' || emp.status.toUpperCase().includes('LEAVE');
    
    return true;
  });

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    const today = new Date().toLocaleDateString();

    doc.setFontSize(22);
    doc.setTextColor(56, 99, 168); // Titan Blue
    doc.text('TITAN WORKFORCE ATTENDANCE REPORT', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('CONFIDENTIAL HR DOCUMENT', 14, 28);
    doc.text(`Generated on: ${today}`, 14, 34);

    const tableColumn = ["Employee ID", "Full Name", "Role / Designation", "Status"];
    const tableRows = filteredEmployees.map(emp => [
      emp.id,
      emp.name,
      emp.role,
      emp.status
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [56, 99, 168], fontSize: 10, halign: 'center' },
      styles: { fontSize: 9, cellPadding: 5 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(`Organizational_Attendance_Report_${today.replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="hr-dashboard-container" style={{ minHeight: '100vh', backgroundColor: '#eaeff2', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      
      <main style={{ flex: 1, padding: winWidth < 768 ? '20px 15px' : '40px', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box', marginTop: '70px' }}>
        
        {/* Header Section */}
        <header style={{ marginBottom: '32px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '16px', width: 'fit-content' }}
          >
            <ArrowLeft size={18} color="#64748b" />
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h1 style={{ fontSize: winWidth < 768 ? '24px' : '32px', fontWeight: '900', color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-1px' }}>Organization Attendance Report</h1>
              <p style={{ color: '#64748b', margin: 0, fontSize: '15px', fontWeight: '500' }}>Viewing comprehensive logs for all {employees.length} active staff members</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
               <button 
                onClick={handleExportPDF}
                className="btn-primary" 
                style={{ background: 'white', color: '#3863a8', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
               >
                 <FileText size={16} /> Export PDF Report
               </button>
            </div>
          </div>
        </header>

        {/* Content Section */}
        <section style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #f1f5f9', boxShadow: '0 10px 25px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
          
          {/* Status Tabs Filter */}
          <div style={{ display: 'flex', gap: '20px', padding: '0 24px', borderBottom: '1.5px solid #f1f5f9' }}>
            {['all', 'present', 'absent'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{
                  padding: '16px 8px',
                  fontSize: '13px',
                  fontWeight: '800',
                  color: activeFilter === filter ? '#3863a8' : '#64748b',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeFilter === filter ? '3px solid #3863a8' : '3px solid transparent',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                {filter} {filter !== 'all' && `(${employees.filter(e => {
                  const s = e.status?.toUpperCase() || '';
                  if (filter === 'present') return s === 'PRESENT' || s === 'ON TIME' || s === 'LATE';
                  if (filter === 'absent') return s === 'ABSENT' || s === '-' || s.includes('LEAVE');
                  return false;
                }).length})`}
              </button>
            ))}
          </div>

          {/* Table Toolbar */}
          <div style={{ padding: '20px 24px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
             <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={18} />
                <input 
                  type="text" 
                  placeholder="Filter by name or designation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: '12px', border: '2.5px solid #eef2f6', background: 'white', outline: 'none', fontSize: '13px' }}
                />
             </div>
             <div style={{ fontSize: '14px', fontWeight: '700', color: '#3863a8', background: '#f0f7ff', padding: '8px 16px', borderRadius: '10px' }}>
                Displaying: {filteredEmployees.length} Results
             </div>
          </div>

          <div style={{ overflowX: winWidth < 768 ? 'hidden' : 'auto' }}>
            {winWidth < 768 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', background: '#eaeff2' }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', background: 'white', borderRadius: '24px' }}>Generating report...</div>
                ) : filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => {
                    const d = new Date(emp.date);
                    const isSunday = d.getDay() === 0;
                    const month = d.toLocaleDateString('en-US', { month: 'short' });
                    const dateDay = String(d.getDate()).padStart(2, '0');
                    const dayMonth = `${month} ${dateDay}`;
                    const holidays = ['Jan 01', 'Jan 26', 'Mar 04', 'Mar 19', 'Mar 21', 'Mar 26', 'Mar 31', 'Apr 03', 'May 01', 'May 27', 'Jun 26', 'Aug 15', 'Aug 26', 'Sep 04', 'Oct 02', 'Oct 20', 'Nov 08', 'Nov 24', 'Dec 25'];
                    const isHoliday = holidays.includes(dayMonth);

                    let statusText = String(emp.status || 'ABSENT').toUpperCase();
                    if (emp.punchIn === '----' || statusText === 'ABSENT') {
                      if (isSunday) statusText = 'WO';
                      else if (isHoliday) statusText = 'NH';
                      else statusText = 'ABSENT';
                    }

                    const isPresent = statusText.includes('PRESENT');
                    const isWO = statusText === 'WO';
                    const isNH = statusText === 'NH';

                    return (
                      <div key={emp.id} style={{ background: 'white', borderRadius: '24px', padding: '20px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User size={20} color="#3863a8" />
                            </div>
                            <div>
                              <div style={{ fontWeight: '900', color: '#1e293b', fontSize: '15px' }}>{emp.name}</div>
                              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>#{emp.id} • {emp.role}</div>
                            </div>
                          </div>
                          <span style={{ 
                            fontSize: '10px', fontWeight: '950', padding: '6px 12px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.5px',
                            background: isPresent ? '#f0fdf4' : (isWO || isNH ? '#eff6ff' : '#fef2f2'),
                            color: isPresent ? '#16a34a' : (isWO || isNH ? '#3b82f6' : '#ef4444'),
                            border: `1.5px solid ${isPresent ? '#bbf7d0' : (isWO || isNH ? '#dbeafe' : '#fee2e2')}`
                          }}>
                            {statusText}
                          </span>
                        </div>

                        <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                           <div>
                              <div style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Date</div>
                              <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={14} color="#64748b" /> {emp.date}
                              </div>
                           </div>
                           <div>
                              <div style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Timeline</div>
                              <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={14} color="#64748b" /> {emp.punchIn} - {emp.punchOut}
                              </div>
                           </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', background: 'white', borderRadius: '24px' }}>No matching results</div>
                )}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #f1f5f9' }}>
                    <th style={{ padding: '20px 25px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Employee</th>
                    <th style={{ padding: '20px 25px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>ID</th>
                    <th style={{ padding: '20px 25px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</th>
                    <th style={{ padding: '20px 25px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Punch In</th>
                    <th style={{ padding: '20px 25px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Punch Out</th>
                    <th style={{ padding: '20px 25px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Generating organizational report...</td></tr>
                  ) : filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.id} style={{ borderBottom: '1.5px solid #f8fafc', transition: '0.2s' }}><td style={{ padding: '20px 25px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User size={20} color="#3863a8" />
                            </div>
                            <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '15px' }}>{emp.name}</div>
                          </div>
                        </td>
                        <td style={{ padding: '20px 25px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>#{emp.id}</div>
                        </td>
                        <td style={{ padding: '20px 25px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#64748b' }}>{emp.date}</div>
                        </td>
                        <td style={{ padding: '20px 25px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '900', color: '#1d4ed8' }}>{emp.punchIn}</div>
                        </td>
                        <td style={{ padding: '20px 25px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '900', color: '#475569' }}>{emp.punchOut}</div>
                        </td>
                        <td style={{ padding: '20px 25px' }}>
                          {(() => {
                            const d = new Date(emp.date);
                            const isSunday = d.getDay() === 0;
                            
                            const month = d.toLocaleDateString('en-US', { month: 'short' });
                            const dateDay = String(d.getDate()).padStart(2, '0');
                            const dayMonth = `${month} ${dateDay}`;
                            const holidays = ['Jan 01', 'Jan 26', 'Mar 04', 'Mar 19', 'Mar 21', 'Mar 26', 'Mar 31', 'Apr 03', 'May 01', 'May 27', 'Jun 26', 'Aug 15', 'Aug 26', 'Sep 04', 'Oct 02', 'Oct 20', 'Nov 08', 'Nov 24', 'Dec 25'];
                            const isHoliday = holidays.includes(dayMonth);

                            let statusText = String(emp.status || 'ABSENT').toUpperCase();
                            if (emp.punchIn === '----' || statusText === 'ABSENT') {
                              if (isSunday) statusText = 'WO';
                              else if (isHoliday) statusText = 'NH';
                              else statusText = 'ABSENT';
                            }

                            const isPresent = statusText.includes('PRESENT');
                            const isWO = statusText === 'WO';
                            const isNH = statusText === 'NH';

                            return (
                              <span style={{ 
                                fontSize: '10px', fontWeight: '900', padding: '6px 12px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.5px',
                                background: isPresent ? '#f0fdf4' : (isWO || isNH ? '#eff6ff' : '#fef2f2'),
                                color: isPresent ? '#16a34a' : (isWO || isNH ? '#3b82f6' : '#ef4444'),
                                border: `1.5px solid ${isPresent ? '#bbf7d0' : (isWO || isNH ? '#dbeafe' : '#fee2e2')}`
                              }}>
                                {statusText}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '100px', color: '#64748b' }}>No employees found matching the search criteria.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
