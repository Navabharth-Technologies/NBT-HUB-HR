import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Download, 
  RefreshCw, 
  User, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Clock3,
  ChevronRight,
  FileSpreadsheet,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, TEAM_OFFICE_AUTH_TOKEN } from '../../config';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import './HRDashboard.css';

export default function EmployeeAttendanceManagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [employee, setEmployee] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(localStorage.getItem('nbtAttendanceFromDate') || '2026-01-01');
  const [endDate, setEndDate] = useState(localStorage.getItem('nbtAttendanceToDate') || new Date().toISOString().split('T')[0]);

  useEffect(() => {
    localStorage.setItem('nbtAttendanceFromDate', startDate);
  }, [startDate]);

  useEffect(() => {
    localStorage.setItem('nbtAttendanceToDate', endDate);
  }, [endDate]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [winWidth, setWinWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getFilteredLogs = () => {
    return logs.filter(log => {
      if (!startDate && !endDate) return true;
      const logDateStr = log.punch_date || log.PunchDate || log.date || log.created_at || log.Punch_Date;
      if (!logDateStr) return true;
      
      // Compare by date strings (YYYY-MM-DD) to ensure inclusive range without time/TZ issues
      let logDateOnly = '';
      try {
        logDateOnly = new Date(logDateStr).toISOString().split('T')[0];
      } catch (e) {
        // Fallback for non-standard formats like DD-MM-YYYY
        const match = logDateStr.match(/(\d{4})-(\d{2})-(\d{2})/) || logDateStr.match(/(\d{2})-(\d{2})-(\d{4})/);
        if (match && match[3].length === 4) logDateOnly = `${match[3]}-${match[2]}-${match[1]}`;
        else logDateOnly = logDateStr.split('T')[0].split(' ')[0];
      }

      if (startDate && logDateOnly < startDate) return false;
      if (endDate && logDateOnly > endDate) return false;
      return true;
    });
  };

  // Helper to resolve work hours across all possible DB field names
  const resolveWorkHrs = (log) => {
    const fromDB = log.work_time || log.work_hrs || log.WorkTime || log.worktime || log.Work_Time || log.TotalHrs || log.Duration || log.WorkingHours;
    if (fromDB && fromDB !== '00:00' && fromDB !== '--:--') return fromDB;
    
    const inT = log.in_time || log.inTime || log.INTime || log.PunchIn || log.PunchInTime || log.CheckIn || log.InTime || log.Log_In;
    const outT = log.out_time || log.outTime || log.OUTTime || log.PunchOut || log.PunchOutTime || log.CheckOut || log.OutTime || log.Log_Out;
    
    const computed = calculateWorkHours(inT, outT);
    return computed !== '--:--' ? computed : '00:00';
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const filteredLogs = getFilteredLogs();
    const empName = employee?.name || 'Employee';
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Format the selected date range for display
    const formatDateDisplay = (dateStr) => {
      if (!dateStr) return 'N/A';
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };
    const dateRangeText = `${formatDateDisplay(startDate)}  →  ${formatDateDisplay(endDate)}`;

    // --- Header ---
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 220, 48, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Attendance Report', 14, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${today}`, 14, 28);
    // Date range in header
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Period: ${dateRangeText}`, 14, 38);

    // --- Employee Info ---
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`Employee: ${empName}`, 14, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Employee ID: #${id}  |  Total Records: ${filteredLogs.length}  |  Date Range: ${formatDateDisplay(startDate)} – ${formatDateDisplay(endDate)}`, 14, 68);

    // --- Table ---
    const tableData = filteredLogs.map(log => [
      log.punch_date ? String(log.punch_date).split('T')[0].split(' ')[0] : 'N/A',
      log.in_time || log.inTime || '----',
      log.out_time || log.outTime || '----',
      resolveWorkHrs(log),
      log.status || (log.in_time ? 'PRESENT' : 'ABSENT'),
      log.in_location || '----',
      log.out_location || '----'
    ]);

    autoTable(doc, {
      startY: 76,
      head: [['Date', 'Punch In', 'Punch Out', 'Work Hrs', 'Status', 'In Location', 'Out Location']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 28, halign: 'center' },
        2: { cellWidth: 28, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });

    // --- Footer ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}  |  Confidential - HR System`, 14, doc.internal.pageSize.height - 10);
    }

    doc.save(`Attendance_${empName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  const handleExportExcel = () => {
    const filteredLogs = getFilteredLogs();
    const empName = employee?.name || 'Employee';

    const headers = ['Employee Name', 'Employee ID', 'Date', 'Punch In', 'Punch Out', 'Work Hours', 'Status', 'In Location', 'Out Location'];
    const rows = filteredLogs.map(log => {
      const pDate = log.punch_date || log.PunchDate || log.date || log.Punch_Date || log.created_at;
      const pIn = log.in_time || log.inTime || log.INTime || log.PunchIn;
      const pOut = log.out_time || log.outTime || log.OUTTime || log.PunchOut;
      const status = log.status || log.Status || (pIn ? 'PRESENT' : 'ABSENT');
      
      return [
        empName,
        id,
        pDate ? String(pDate).split('T')[0].split(' ')[0] : 'N/A',
        pIn || '----',
        pOut || '----',
        resolveWorkHrs(log),
        status,
        log.in_location || '----',
        log.out_location || '----'
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_${empName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };


  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!user?.token || !id) {
        console.warn('Attendance Detail: Missing token or ID', { hasToken: !!user?.token, id });
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        console.log('Attendance Detail: Fetching for ID:', id);
        
        // Fetch All Users/Employees to find the specific employee
        const userRes = await fetch(API_ENDPOINTS.EMPLOYEES || API_ENDPOINTS.USERS, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const users = await userRes.json();
        const validUsers = Array.isArray(users) ? users : (users?.data || []);
        
        const found = validUsers.find(u => {
          if (!u) return false;
          return (
            String(u.id) === String(id) || 
            String(u.Empcode) === String(id) || 
            String(u.EmpID) === String(id)
          );
        });
        setEmployee(found);

        // Fetch Logs with filters and high limit
        const queryParams = new URLSearchParams({ 
          startDate: startDate, 
          endDate: endDate,
          userId: id,
          limit: 1000 
        });

        const logsRes = await fetch(`${API_ENDPOINTS.ATTENDANCE_LOGS_GET}?${queryParams.toString()}`, {
          headers: { 
            'Authorization': `Bearer ${user?.token || TEAM_OFFICE_AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        const logsData = await logsRes.json();
        
        // Support new backend format { data: [...] }
        const allLogs = logsData.data || logsData.attendance || logsData.logs || (Array.isArray(logsData) ? logsData : []);
        
        // 3. Strict Frontend Filtering (ID matching ONLY to prevent cross-employee data leak)
        const individualLogs = allLogs.filter(l => {
          if (!l) return false;
          const targetId = String(id).trim();
          
          // Try all possible identifier fields from various backend versions
          // Priority: user_id, Empcode, EmpID, userId
          const logId = String(l.user_id || l.Empcode || l.EmpID || l.userId || l.UserId || l.user_ID || l.UserID || '').trim();
          
          return logId === targetId;
        });

        // 4. Group Logs by Date (Consolidate multiple punches into one daily summary)
        const grouped = {};
        individualLogs.forEach(l => {
          const rawDate = l.punch_date || l.date || l.PunchDate || l.PDate || l.created_at || '';
          if (!rawDate) return;
          
          // Extract just the YYYY-MM-DD part
          // Extract just the YYYY-MM-DD part safely
          let dStr = '';
          try {
            const dObj = new Date(rawDate);
            if (isNaN(dObj.getTime())) {
              dStr = String(rawDate).split('T')[0].split(' ')[0];
            } else {
              dStr = dObj.toISOString().split('T')[0];
            }
          } catch (e) {
            dStr = String(rawDate).split('T')[0].split(' ')[0];
          }
          
          if (!dStr || dStr.length < 8 || dStr.toLowerCase().includes('invalid')) return;
          
          if (!grouped[dStr]) grouped[dStr] = [];
          grouped[dStr].push(l);
        });

        const summaryLogs = Object.keys(grouped).map(date => {
          const dayPunches = grouped[date].sort((a,b) => {
            const timeA = a.in_time || a.INTime || a.PunchIn || a.punch_in || '00:00';
            const timeB = b.in_time || b.INTime || b.PunchIn || b.punch_in || '00:00';
            return String(timeA).localeCompare(String(timeB));
          });
          
          const firstPunch = dayPunches[0];
          const lastPunch = dayPunches[dayPunches.length - 1];

          // Calculate work hours based on first/last punch of the day
          const punchInTime = firstPunch.in_time || firstPunch.INTime || firstPunch.PunchIn || firstPunch.punch_in || '----';
          const punchOutTime = lastPunch.out_time || lastPunch.OUTTime || lastPunch.PunchOut || lastPunch.punch_out || '----';

          const isToday = date === new Date().toLocaleDateString('en-CA') || date === new Date().toISOString().split('T')[0];
          return {
            ...firstPunch,
            punch_date: date,
            in_time: punchInTime,
            out_time: (isToday && dayPunches.length === 1) ? '----' : punchOutTime,
            in_location: firstPunch.punchin_location || firstPunch.in_location || firstPunch.location || '----',
            out_location: (isToday && dayPunches.length === 1) ? '----' : (lastPunch.punchout_location || lastPunch.out_location || lastPunch.location || '----'),
            status: firstPunch.status || (punchInTime !== '----' ? 'PRESENT' : 'ABSENT'),
            work_hrs: calculateWorkHours(punchInTime, (isToday && dayPunches.length === 1) ? null : (punchOutTime !== '----' ? punchOutTime : null))
          };
        });

        setLogs(summaryLogs.sort((a, b) => new Date(b.punch_date) - new Date(a.punch_date)));

      } catch (err) {
        console.error("Error fetching employee detail:", err);
        setError("Failed to load attendance records. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [id, user, startDate, endDate]);

  const calculateWorkHours = (inTime, outTime) => {
    if (!inTime || !outTime || inTime === '----' || outTime === '----') return '00:00';
    try {
      const parseTime = (timeStr) => {
        if (!timeStr || typeof timeStr !== 'string') return null;
        
        // Handle 24h format (e.g., "09:03")
        const hmMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (hmMatch) {
          const d = new Date();
          d.setHours(parseInt(hmMatch[1], 10), parseInt(hmMatch[2], 10), parseInt(hmMatch[3] || 0, 10), 0);
          return d;
        }

        // Handle 12h format (e.g., "09:03 AM")
        const parts = timeStr.trim().split(/\s+/);
        if (parts.length >= 2) {
          const [time, modifier] = parts;
          let [hours, minutes] = time.split(':').map(n => parseInt(n, 10));
          if (modifier.toUpperCase() === 'PM' && hours !== 12) hours += 12;
          if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
          const d = new Date();
          d.setHours(hours, minutes, 0, 0);
          return d;
        }
        return null;
      };
      
      const inDate = parseTime(inTime);
      const outDate = parseTime(outTime);
      if (!inDate || !outDate) return '00:00';
      
      let diffMs = outDate - inDate;
      if (diffMs < 0) return '00:00';
      
      const totalMinutes = Math.floor(diffMs / 1000 / 60);
      const hrs = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    } catch (e) {
      return '00:00';
    }
  };

  const getStatusStyle = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('PRESENT')) return { color: '#059669', bg: '#ecfdf5', border: '#10b981' };
    if (s.includes('LATE')) return { color: '#d97706', bg: '#fffbeb', border: '#f59e0b' };
    if (s.includes('ABSENT')) return { color: '#dc2626', bg: '#fef2f2', border: '#ef4444' };
    if (s.includes('WO') || s.includes('OFF')) return { color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' };
    return { color: '#3863a8', bg: '#eff6ff', border: '#3b82f6' };
  };

  return (
    <div className="hr-dashboard-container" style={{ minHeight: '100vh', backgroundColor: '#eaeff2', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      
      <main style={{ flex: 1, padding: winWidth < 768 ? '20px 16px 40px' : '30px 26px 40px', margin: '0', width: '100%', boxSizing: 'border-box', marginTop: winWidth < 768 ? '85px' : '100px' }}>
        


        {/* Dashboard Header */}
        <div style={{ display: 'flex', flexDirection: winWidth < 1024 ? 'column' : 'row', justifyContent: 'space-between', alignItems: winWidth < 1024 ? 'stretch' : 'center', marginBottom: '32px', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: winWidth < 768 ? '12px' : '20px' }}>
            <button 
              onClick={() => navigate(-1)}
              style={{ width: winWidth < 768 ? '40px' : '48px', height: winWidth < 768 ? '40px' : '48px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: '0.2s', flexShrink: 0 }}
            >
              <ArrowLeft size={winWidth < 768 ? 20 : 24} />
            </button>
            <div>
              <h1 style={{ fontSize: winWidth < 768 ? '22px' : '32px', fontWeight: '950', color: '#0f172a', margin: '0', letterSpacing: '-0.5px' }}>
                {employee?.name || 'Employee'}
              </h1>
              <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ID: <span style={{ color: '#0f172a' }}>#{id}</span> • <span style={{ color: '#10b981' }}>Verified</span>
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: winWidth < 600 ? 'column' : 'row', gap: '12px', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', background: 'white', borderRadius: '14px', border: '1.5px solid #e2e8f0', padding: '2px 4px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <label htmlFor="startDateInput" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', cursor: 'pointer' }}>
                <input 
                  id="startDateInput"
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ border: 'none', outline: 'none', fontSize: '11px', fontWeight: '800', color: '#64748b', background: 'transparent', width: '95px', cursor: 'pointer' }} 
                />
              </label>
              <div style={{ width: '1px', background: '#e2e8f0', height: '16px', margin: 'auto 0' }}></div>
              <label htmlFor="endDateInput" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', cursor: 'pointer' }}>
                <span style={{ fontSize: '10px', fontWeight: '950', color: '#94a3b8', letterSpacing: '0.5px' }}>TO</span>
                <input 
                  id="endDateInput"
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ border: 'none', outline: 'none', fontSize: '11px', fontWeight: '800', color: '#64748b', background: 'transparent', width: '95px', cursor: 'pointer' }} 
                />
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', flex: 1 }}>

              
              <div style={{ position: 'relative', flex: 2 }}>
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0 20px', height: '44px', borderRadius: '12px', background: '#0f172a', color: 'white', border: 'none', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                >
                  <Download size={16} /> Export 
                </button>

                {showExportMenu && (
                  <>
                    <div 
                      onClick={() => setShowExportMenu(false)}
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
                    />
                    <div style={{ 
                      position: 'absolute', top: '120%', right: 0, width: '180px', background: 'white', borderRadius: '16px', 
                      padding: '8px', shadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1.5px solid #f1f5f9', zIndex: 999,
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                    }}>
                      <button 
                        onClick={handleExportPDF}
                        className="export-menu-item"
                        style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontWeight: '700', fontSize: '12px', cursor: 'pointer', transition: '0.2s' }}
                      >
                        <FileText size={16} color="#ef4444" /> Export as PDF
                      </button>
                      <button 
                        onClick={handleExportExcel}
                        className="export-menu-item"
                        style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontWeight: '700', fontSize: '12px', cursor: 'pointer', transition: '0.2s' }}
                      >
                        <FileSpreadsheet size={16} color="#22c55e" /> Export as XL
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>



        {/* Mini Summary Strip */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
           <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 16px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={16} />
              </div>
              <div>
                <div style={{ fontSize: '9px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL LOGS</div>
                <div style={{ fontSize: '14px', fontWeight: '950', color: '#0f172a' }}>{logs.length}</div>
              </div>
           </div>

           <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 16px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={16} />
              </div>
              <div>
                <div style={{ fontSize: '9px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>VERIFIED BY</div>
                <div style={{ fontSize: '14px', fontWeight: '950', color: '#0f172a' }}>Biometrics API</div>
              </div>
           </div>
        </div>

        {/* Main Table Content */}
        <div style={{ background: winWidth < 768 ? 'transparent' : 'white', borderRadius: '28px', border: winWidth < 768 ? 'none' : '1.5px solid #f1f5f9', boxShadow: winWidth < 768 ? 'none' : '0 20px 25px -5px rgba(0,0,0,0.03)', overflowX: winWidth < 768 ? 'hidden' : 'auto' }}>
          {winWidth < 768 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '24px' }}>
                  <div className="animate-spin" style={{ margin: '0 auto', width: '32px', height: '32px', border: '3px solid #f3f3f3', borderTop: '3px solid #3b82f6', borderRadius: '50%' }}></div>
                  <p style={{ marginTop: '16px', fontWeight: '700', color: '#64748b' }}>Loading records...</p>
                </div>
              ) : error ? (
                <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '24px' }}>
                  <AlertCircle size={32} color="#ef4444" style={{ margin: '0 auto' }} />
                  <p style={{ marginTop: '12px', fontWeight: '800', color: '#ef4444' }}>{error}</p>
                </div>
              ) : logs.length > 0 ? (
                getFilteredLogs().map((log, idx) => {
                  const punchIn = log.in_time || '----';
                  const punchOut = log.out_time || '----';
                  const workHrs = log.work_hrs || '00:00';
                  const pDate = log.punch_date || log.date || log.created_at;

                  const d = new Date(pDate);
                  const isSunday = d.getDay() === 0;
                  const month = d.toLocaleDateString('en-US', { month: 'short' });
                  const dateDay = String(d.getDate()).padStart(2, '0');
                  const dayMonth = `${month} ${dateDay}`;
                  const holidays = ['Jan 01', 'Jan 26', 'Mar 04', 'Mar 19', 'Mar 21', 'Mar 26', 'Mar 31', 'Apr 03', 'May 01', 'May 27', 'Jun 26', 'Aug 15', 'Aug 26', 'Sep 04', 'Oct 02', 'Oct 20', 'Nov 08', 'Nov 24', 'Dec 25'];
                  const isHoliday = holidays.includes(dayMonth);

                  let statusText = String(log.status || (log.in_time && log.in_time !== '----' ? 'PRESENT' : 'ABSENT')).toUpperCase();
                  if ((!log.in_time || log.in_time === '----') || statusText === 'ABSENT') {
                    if (isSunday) statusText = 'WO';
                    else if (isHoliday) statusText = 'NH';
                    else statusText = 'ABSENT';
                  }

                  const isPresent = statusText.includes('PRESENT') || statusText === 'P';
                  const isWO = statusText === 'WO';
                  const isNH = statusText === 'NH';

                  return (
                    <div key={idx} style={{ 
                      background: 'white', borderRadius: '24px', padding: '20px', 
                      border: '1.5px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      display: 'flex', flexDirection: 'column', gap: '16px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f8fafc', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Calendar size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '950', color: '#1e293b' }}>
                              {pDate ? new Date(pDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '----'}
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>Attendance Log</div>
                          </div>
                        </div>
                        <div style={{ 
                          padding: '6px 14px', borderRadius: '100px', 
                          background: isPresent ? '#f0fdf4' : (isWO || isNH ? '#eff6ff' : '#fef2f2'), 
                          color: isPresent ? '#16a34a' : (isWO || isNH ? '#3b82f6' : '#ef4444'),
                          fontSize: '11px', fontWeight: '950', border: `1px solid ${isPresent ? '#bbf7d0' : (isWO || isNH ? '#dbeafe' : '#fee2e2')}`
                        }}>
                          {statusText}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '16px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>Punch In</div>
                          <div style={{ fontSize: '14px', fontWeight: '950', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} color="#3b82f6" /> {punchIn}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>Punch Out</div>
                          <div style={{ fontSize: '14px', fontWeight: '950', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} color="#64748b" /> {punchOut}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '950', color: '#1e293b' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginRight: '4px' }}>DURATION:</span>
                          {workHrs} HRS
                        </div>
                        <div style={{ width: '1px', height: '16px', background: '#e2e8f0' }}></div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <MapPin size={16} color="#94a3b8" title={`In: ${log.in_location || 'N/A'}`} />
                          <MapPin size={16} color="#cbd5e1" title={`Out: ${log.out_location || 'N/A'}`} />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '24px', border: '1.5px solid #f1f5f9' }}>
                  <AlertCircle size={40} color="#cbd5e1" style={{ margin: '0 auto' }} />
                  <p style={{ marginTop: '16px', color: '#64748b', fontWeight: '900' }}>No records found.</p>
                </div>
              )}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #f1f5f9' }}>
                  <th style={{ padding: '24px 30px', fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>EMPLOYEE</th>
                  <th style={{ padding: '24px 30px', fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>DATE</th>
                  <th style={{ padding: '24px 30px', fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>PUNCH IN</th>
                  <th style={{ padding: '24px 30px', fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>PUNCH OUT</th>
                  <th style={{ padding: '24px 30px', fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>WORK HRS</th>
                  <th style={{ padding: '24px 30px', fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>STATUS</th>
                  <th style={{ padding: '24px 30px', fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Punch In Location</th>
                  <th style={{ padding: '24px 30px', fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Punch Out Location</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '100px', textAlign: 'center' }}>
                       <div className="animate-spin" style={{ margin: '0 auto', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%' }}></div>
                       <p style={{ marginTop: '20px', fontWeight: '700', color: '#64748b' }}>Loading Comprehensive Records...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '60px', textAlign: 'center' }}>
                       <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto' }} />
                       <p style={{ marginTop: '16px', fontWeight: '800', color: '#ef4444' }}>{error}</p>
                       <button onClick={() => window.location.reload()} style={{ marginTop: '12px', padding: '8px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>Retry</button>
                    </td>
                  </tr>
                ) : logs.length > 0 ? (
                  getFilteredLogs().map((log, idx) => {
                    const style = getStatusStyle(log.status || (log.in_time ? 'PRESENT' : 'ABSENT'));
                    return (
                      <tr key={idx} style={{ borderBottom: '1.5px solid #f8fafc', transition: '0.2s' }}><td style={{ padding: '20px 30px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#ebeef3', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '900' }}>
                              {String(employee?.name || log.user_name || 'E').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>{employee?.name || log.user_name || 'Individual Employee'}</div>
                              <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>ID: {id || '00000'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '20px 30px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '700', color: '#475569' }}>
                            <Calendar size={16} color="#94a3b8" />
                            {(() => {
                              const pDate = log.punch_date || log.PunchDate || log.date || log.created_at;
                              if (!pDate) return 'N/A';
                              const dateStr = String(pDate).split('T')[0].split(' ')[0];
                              const d = new Date(dateStr);
                              if (isNaN(d.getTime())) return dateStr;
                              const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                              return `${dateStr} (${dayName})`;
                            })()}
                          </div>
                        </td>
                        <td style={{ padding: '20px 30px', fontSize: '14px', fontWeight: '800', color: '#3b82f6', whiteSpace: 'nowrap' }}>{log.in_time || '----'}</td>
                        <td style={{ padding: '20px 30px', fontSize: '14px', fontWeight: '800', color: '#64748b', whiteSpace: 'nowrap' }}>{log.out_time || '----'}</td>
                        <td style={{ padding: '20px 30px', whiteSpace: 'nowrap' }}>
                           <div style={{ fontSize: '14px', fontWeight: '950', color: '#0f172a' }}>
                             {log.work_hrs || '00:00'}
                             <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '4px' }}>HOURS</span>
                           </div>
                        </td>
                        <td style={{ padding: '20px 30px' }}>
                          {(() => {
                            const logDate = log.punch_date || log.date || log.created_at || '';
                            const d = new Date(logDate);
                            
                            // Defensive check for invalid date to prevent crash
                            if (isNaN(d.getTime())) {
                              return (
                                <div style={{ fontSize: '11px', fontWeight: '950', color: '#ef4444', background: '#fef2f2', padding: '6px 14px', borderRadius: '100px' }}>
                                  INVALID DATE
                                </div>
                              );
                            }

                            const isSunday = d.getDay() === 0;
                            const month = d.toLocaleDateString('en-US', { month: 'short' });
                            const dateDay = String(d.getDate()).padStart(2, '0');
                            const dayMonth = `${month} ${dateDay}`;
                            const holidays = ['Jan 01', 'Jan 26', 'Mar 04', 'Mar 19', 'Mar 21', 'Mar 26', 'Mar 31', 'Apr 03', 'May 01', 'May 27', 'Jun 26', 'Aug 15', 'Aug 26', 'Sep 04', 'Oct 02', 'Oct 20', 'Nov 08', 'Nov 24', 'Dec 25'];
                            const isHoliday = holidays.includes(dayMonth);

                            let statusText = String(log.status || (log.in_time && log.in_time !== '----' ? 'Present' : 'Absent'));
                            
                            if ((!log.in_time || log.in_time === '----') || statusText === 'A' || statusText === 'P' || statusText === 'ABSENT' || statusText === 'PRESENT') {
                              if (isSunday) statusText = 'WO';
                              else if (isHoliday) statusText = 'NH';
                              else statusText = (log.in_time && log.in_time !== '----') ? 'PRESENT' : 'ABSENT';
                            }

                            const isPresent = statusText === 'Present' || statusText === 'PRESENT' || statusText.includes('PRESENT') || statusText.includes('Present');
                            const isWO = statusText === 'WO';
                            const isNH = statusText === 'NH';

                            return (
                              <div style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                padding: '6px 14px', 
                                borderRadius: '100px', 
                                background: isPresent ? '#f0fdf4' : (isWO || isNH ? '#eff6ff' : '#fef2f2'), 
                                border: `1.5px solid ${isPresent ? '#bbf7d0' : (isWO || isNH ? '#dbeafe' : '#fee2e2')}`,
                                color: isPresent ? '#16a34a' : (isWO || isNH ? '#3b82f6' : '#ef4444'),
                                fontSize: '11px',
                                fontWeight: '950',
                                whiteSpace: 'nowrap'
                              }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPresent ? '#22c55e' : (isWO || isNH ? '#3b82f6' : '#ef4444') }}></div>
                                {statusText}
                              </div>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '20px 30px', fontSize: '12px', fontWeight: '800', color: '#64748b', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.in_location}>
                          {log.in_location || '----'}
                        </td>
                        <td style={{ padding: '20px 30px', fontSize: '12px', fontWeight: '800', color: '#64748b', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.out_location}>
                          {log.out_location || '----'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" style={{ padding: '40px', textAlign: 'center' }}>
                       <AlertCircle size={48} color="#cbd5e1" style={{ margin: '0 auto' }} />
                       <h3 style={{ marginTop: '20px', fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>No Records Found</h3>
                       <p style={{ color: '#64748b', fontSize: '14px' }}>This employee hasn't logged any biometric data yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
}
