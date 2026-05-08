import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, Search, User, Info, FileText, Table, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';

import { API_ENDPOINTS } from '../../config';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import './HRDashboard.css';

export default function LeaveManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'leave');

  const [searchTerm, setSearchTerm] = useState('');
  const [allEmployees, setAllEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [allLeaveStats, setAllLeaveStats] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(true);

  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [winWidth, setWinWidth] = useState(window.innerWidth);
  const [showAllLedger, setShowAllLedger] = useState(false);

  const [showLeaveEditModal, setShowLeaveEditModal] = useState(false);
  const [leaveEditData, setLeaveEditData] = useState({ 
    empId: '', 
    empName: '', 
    cl: 0, 
    lop: 0, 
    month: 4,
    year: 2026,
    available: 0,
    halfDays: 0,
    oldCl: 0,
    oldBalance: 0,
    remark: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.token) {
      // Fetch Employees
      fetch(API_ENDPOINTS.USERS, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setAllEmployees(data);
        })
        .catch(err => console.error("Error fetching users:", err));

      fetchLeaves();
      fetchLeaveStats();
    }
  }, [user]);

  const fetchLeaves = async () => {
    try {
      setLeavesLoading(true);
      const res = await fetch(API_ENDPOINTS.LEAVES_GET, {
        headers: {
          'Authorization': `Bearer ${user?.token || localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      const responseData = await res.json();
      const list = Array.isArray(responseData) ? responseData : (responseData?.all || responseData?.data || responseData?.requests || []);

      const uniqueList = [];
      const seenIds = new Set();
      if (Array.isArray(list)) {
        list.forEach(item => {
          if (item && item.id && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            uniqueList.push(item);
          } else if (item && !item.id) {
            uniqueList.push(item);
          }
        });
      }
      setLeaveRequests(uniqueList);
    } finally {
      setLeavesLoading(false);
    }
  };

  const fetchLeaveStats = async () => {
    if (!user?.token) return;
    try {
      const currentMonth = 4;
      const currentYear = new Date().getFullYear();
      const res = await fetch(`${API_ENDPOINTS.ADMIN_LEAVE_STATS}?month=${currentMonth}&year=${currentYear}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.stats || data.data || []);
        setAllLeaveStats(list);
      }
    } catch (err) {
      console.error("Error fetching all leave stats:", err);
    }
  };

  const submitLeaveAdjustments = async () => {
    if (!user?.token || !leaveEditData.empId) return;
    setIsProcessing(true);
    try {
      const userRole = (user?.role || '').toUpperCase();
      const finalRole = userRole.includes('HR') ? 'HR' : (userRole.includes('ADMIN') || userRole.includes('CEO') || userRole.includes('PM') || userRole.includes('MANAGER') ? 'ADMIN' : 'PM');

      const response = await fetch(API_ENDPOINTS.ADMIN_LEAVE_STATS_UPDATE, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId: leaveEditData.empId,
          employee_id: leaveEditData.empId,
          userId: leaveEditData.empId,
          EmpID: leaveEditData.empId,
          leaves_taken: leaveEditData.cl,
          leaves_available: leaveEditData.available,
          LOP: leaveEditData.lop,
          month: leaveEditData.month,
          year: leaveEditData.year,
          halfDays: leaveEditData.halfDays,
          remarks: leaveEditData.remark || 'Manual adjustment',
          role: finalRole,
          adminId: user?.id || user?.employee_id
        })
      });
      
      const result = await response.json().catch(() => ({}));
      if (response.ok || result.success) {
        alert(`✅ Leave adjustments for ${leaveEditData.empName} saved successfully!`);
        setShowLeaveEditModal(false);
        fetchLeaveStats();
      } else {
        alert(`❌ Failed to save adjustments: ${result.message || result.error || 'Server Error'}`);
      }
    } catch (err) {
      console.error("Error saving leave adjustments:", err);
      alert("❌ System error while saving adjustments.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLedgerExport = (type) => {
    const summaryData = allEmployees
      .filter(emp => String(emp.id || emp.EmpID) !== '20250')
      .map(emp => {
        const statsEntry = allLeaveStats.find(s => String(s.employee_id || s.user_id) === String(emp.id));
        let cl, lop, balance, year, halfDays;
        
        if (statsEntry) {
          cl = parseFloat(statsEntry.leaves_taken || 0);
          lop = parseFloat(statsEntry.LOP || statsEntry.lop || 0);
          balance = parseFloat(statsEntry.leaves_available || statsEntry.available_leaves || statsEntry.Available_Leaves || 0);
          year = statsEntry.year || new Date().getFullYear();
          halfDays = statsEntry.half_day || statsEntry.half_days || 0;
        } else {
          cl = 0;
          lop = 0;
          balance = 0;
          year = new Date().getFullYear();
          halfDays = 0;
        }
        
        return { 
          id: emp.id, 
          name: emp.name || emp.user_name, 
          year: year,
          cl: cl, 
          lop: lop, 
          halfDays: halfDays,
          taken: cl + lop, 
          available: balance 
        };
      });

    if (type === 'excel') {
      const wsData = summaryData.map(row => ({
        'Employee ID': row.id,
        'Name': row.name,
        'Year': row.year,
        'Casual Leaves': row.cl,
        'LOP Leaves': row.lop,
        'Half Days': row.halfDays,
        'Total Taken': row.taken,
        'Available Leaves': row.available
      }));
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Leaves Summary");
      XLSX.writeFile(wb, "NBT_HUB_Leaves_Summary.xlsx");
    } else if (type === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text("Employee Leave Ledger", 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
      
      autoTable(doc, {
        startY: 35,
        head: [['ID', 'Employee Name', 'Year', 'CL', 'LOP', 'Half', 'Taken', 'Balance']],
        body: summaryData.map(r => [r.id, r.name, r.year, r.cl, r.lop, r.halfDays, r.taken, r.available + ' Days']),
        theme: 'grid',
        headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 20 },
          2: { cellWidth: 15 },
          3: { cellWidth: 15 },
          4: { cellWidth: 15 },
          5: { cellWidth: 15 },
          6: { cellWidth: 15 },
          7: { cellWidth: 25, fontStyle: 'bold' }
        }
      });
      doc.save("NBT_HUB_Leaves_Summary.pdf");
    }
    setShowExportDropdown(false);
  };

  const displayedEmployees = allEmployees.filter(emp => {
    const term = searchTerm.toLowerCase();
    return !term || (emp.name || emp.user_name || '').toLowerCase().includes(term);
  });

  return (
    <div className="hr-dashboard-container" style={{ minHeight: '100vh', backgroundColor: '#eaeff2', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />

      <main style={{ flex: 1, padding: winWidth < 768 ? '100px 16px 40px' : '120px 26px 40px', width: '100%', boxSizing: 'border-box', margin: '0' }}>
        <div style={{ width: '100%' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '20px' }}
          >
            <ArrowLeft size={18} color="#64748b" />
          </button>

          <div style={{ display: 'flex', flexDirection: winWidth < 1024 ? 'column' : 'row', justifyContent: 'space-between', alignItems: winWidth < 1024 ? 'stretch' : 'flex-start', marginBottom: winWidth < 768 ? '24px' : '32px', gap: '20px' }}>
            <div style={{ textAlign: winWidth < 768 ? 'center' : 'left' }}>
              <h1 style={{ fontSize: winWidth < 768 ? '24px' : '32px', fontWeight: '950', color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-0.8px' }}>Leave Management</h1>
              <p style={{ color: '#64748b', margin: 0, fontSize: winWidth < 768 ? '13px' : '15px', fontWeight: '600' }}>
                Review and manage employee leave applications.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: winWidth < 768 ? 'center' : 'flex-end' }}>
              <button
                onClick={() => navigate('/my-leaves')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: 'white',
                  border: 'none',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)',
                  transition: 'all 0.3s'
                }}
              >
                <Calendar size={18} /> My Leaves
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: winWidth < 600 ? '12px' : '24px', borderBottom: '1.5px solid #e2e8f0', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button onClick={() => setActiveTab('leave')} style={{ padding: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', borderBottom: activeTab === 'leave' ? '3px solid #1d4ed8' : '3px solid transparent', color: activeTab === 'leave' ? '#1d4ed8' : '#64748b', fontWeight: '800', fontSize: winWidth < 600 ? '12px' : '14px', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }} > Leave Requests <span style={{ background: '#1d4ed8', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '11px' }}>{leaveRequests.length}</span> </button>
            <button onClick={() => setActiveTab('summary')} style={{ padding: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', borderBottom: activeTab === 'summary' ? '3px solid #1d4ed8' : '3px solid transparent', color: activeTab === 'summary' ? '#1d4ed8' : '#64748b', fontWeight: '800', fontSize: winWidth < 600 ? '12px' : '14px', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }} > <Table size={14} /> Leaves Summary (XL) </button>
          </div>

          {activeTab === 'summary' ? (
            <div className="animate-fade-in" style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #f1f5f9', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.02)', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '950', color: '#0f172a' }}>Employee Leave Ledger</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Comprehensive summary of all employee leave balances.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button 
                    onClick={() => setShowAllLedger(!showAllLedger)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: showAllLedger ? '#f1f5f9' : '#0f172a', color: showAllLedger ? '#475569' : 'white', border: 'none', fontWeight: '800', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    {showAllLedger ? 'View Less' : 'View All'}
                  </button>
                  <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <button 
                      onClick={() => setShowExportDropdown(!showExportDropdown)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: '#16a34a', color: 'white', border: 'none', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                    >
                      <Download size={16} /> Export <ChevronDown size={14} style={{ transform: showExportDropdown ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                    </button>
                    {showExportDropdown && (
                      <div className="animate-fade-in" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9', zIndex: 100, minWidth: '160px', overflow: 'hidden' }}>
                        <button onClick={() => handleLedgerExport('excel')} style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', color: '#1e293b', fontWeight: '700', fontSize: '13px', cursor: 'pointer', textAlign: 'left', transition: '0.2s' }}>
                          <FileText size={16} color="#16a34a" /> Export as Excel
                        </button>
                        <button onClick={() => handleLedgerExport('pdf')} style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', color: '#1e293b', fontWeight: '700', fontSize: '13px', cursor: 'pointer', textAlign: 'left', transition: '0.2s' }}>
                          <FileText size={16} color="#dc2626" /> Export as PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid #f1f5f9', borderRadius: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                      <th style={{ padding: '16px', fontWeight: '900', color: '#64748b' }}>EMPLOYEE</th>
                      <th style={{ padding: '16px', fontWeight: '900', color: '#64748b' }}>ID</th>
                      <th style={{ padding: '16px', fontWeight: '900', color: '#64748b' }}>YEAR</th>
                      <th style={{ padding: '16px', fontWeight: '900', color: '#64748b' }}>CASUAL LEAVES</th>
                      <th style={{ padding: '16px', fontWeight: '900', color: '#64748b' }}>LOP LEAVES</th>
                      <th style={{ padding: '16px', fontWeight: '900', color: '#64748b' }}>HALF DAYS</th>
                      <th style={{ padding: '16px', fontWeight: '900', color: '#64748b' }}>TAKEN</th>
                      <th style={{ padding: '16px', fontWeight: '900', color: '#64748b' }}>AVAILABLE LEAVES</th>
                      <th style={{ padding: '16px', fontWeight: '900', color: '#64748b' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showAllLedger ? allEmployees : allEmployees.slice(0, 7))
                      .filter(emp => String(emp.id || emp.EmpID) !== '20250')
                      .map((emp, idx) => {
                      const statsEntry = allLeaveStats.find(s => String(s.employee_id || s.user_id) === String(emp.id));
                      let cl = statsEntry ? parseFloat(statsEntry.leaves_taken || 0) : 0;
                      let lop = statsEntry ? parseFloat(statsEntry.LOP || statsEntry.lop || 0) : 0;
                      let balance = statsEntry ? parseFloat(statsEntry.leaves_available || statsEntry.available_leaves || 0) : 0;
                      const taken = cl + lop;

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f8fafc', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                          <td style={{ padding: '12px 16px', fontWeight: '800', color: '#1e293b' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '950' }}>
                                {String(emp.name || emp.user_name || 'U').charAt(0).toUpperCase()}
                              </div>
                              {emp.name || emp.user_name}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: '700', color: '#000000' }}>#{emp.id}</td>
                          <td style={{ padding: '12px 16px', fontWeight: '700', color: '#64748b' }}>{statsEntry?.year || new Date().getFullYear()}</td>
                          <td style={{ padding: '12px 16px', fontWeight: '800', color: '#000000' }}>{cl}</td>
                          <td style={{ padding: '12px 16px', fontWeight: '800', color: '#000000' }}>{lop}</td>
                          <td style={{ padding: '12px 16px', fontWeight: '800', color: '#000000' }}>{statsEntry?.half_day || statsEntry?.half_days || 0}</td>
                          <td style={{ padding: '12px 16px', fontWeight: '800', color: '#000000' }}>{taken}</td>
                          <td style={{ padding: '12px 16px', fontWeight: '950', color: '#16a34a' }}>{balance} Days</td>
                          <td style={{ padding: '12px 16px' }}>
                            <button onClick={() => { setLeaveEditData({ empId: emp.id, empName: emp.name || emp.user_name, cl, lop, month: 4, year: 2026, available: balance, halfDays: statsEntry?.half_day || 0, oldCl: cl, oldBalance: balance }); setShowLeaveEditModal(true); }} style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', color: '#475569', cursor: 'pointer' }}>Edit</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: winWidth < 768 ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
              {leavesLoading ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px' }}>
                  <p style={{ fontWeight: '800', color: '#64748b' }}>Fetching leave applications...</p>
                </div>
              ) : leaveRequests.length > 0 ? (
                leaveRequests.map(req => {
                  const rawStatus = String(req.status || 'PENDING').toUpperCase();
                  const status = rawStatus.includes('REJECTED') ? 'REJECTED' : (rawStatus.includes('APPROVED') ? 'APPROVED' : 'PENDING');
                  const sColor = status === 'APPROVED' ? '#10b981' : (status === 'REJECTED' ? '#ef4444' : '#f59e0b');
                  const sBg = status === 'APPROVED' ? '#ecfdf5' : (status === 'REJECTED' ? '#fef2f2' : '#fffbeb');
                  const displayDate = req.start_date ? new Date(req.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

                  return (
                    <div key={req.id} onClick={() => navigate(`/attendance/leave/${req.id}`)} style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1.5px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', cursor: 'pointer', transition: '0.2s', display: 'flex', flexDirection: 'column', minHeight: '220px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f8fafc', border: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}><User size={20} /></div>
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: '950', color: '#1e293b' }}>{req.employee_name || req.name || 'Unknown'}</div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '900', color: '#1d4ed8', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>#{req.user_id || req.id}</span>
                                <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{req.leave_type || 'Leave'}</span>
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: '9px', fontWeight: '950', color: sColor, background: sBg, padding: '4px 10px', borderRadius: '100px', textTransform: 'uppercase' }}>{status}</span>
                      </div>
                      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px', fontWeight: '600' }}><Calendar size={14} /> {displayDate}</div>
                      <div style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9', flex: 1 }}>"{req.reason || 'No reason provided'}"</div>
                    </div>
                  );
                })
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}><p style={{ fontWeight: '900', color: '#94a3b8' }}>No leave requests found.</p></div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Leave Edit Modal */}
      {showLeaveEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1.5px solid #f1f5f9', position: 'relative' }}>
            <button onClick={() => setShowLeaveEditModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: '#f8fafc', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>✕</button>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Table size={24} /></div>
              <h2 style={{ fontSize: '20px', fontWeight: '950', color: '#0f172a', margin: '0 0 4px 0' }}>Adjust Leave Ledger</h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Modifying balances for {leaveEditData.empName}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Casual Leaves (Taken)</label>
                <input type="number" value={leaveEditData.cl} onChange={e => setLeaveEditData({ ...leaveEditData, cl: parseFloat(e.target.value || 0) })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', fontWeight: '700', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>LOP Leaves</label>
                <input type="number" value={leaveEditData.lop} onChange={e => setLeaveEditData({ ...leaveEditData, lop: parseFloat(e.target.value || 0) })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', fontWeight: '700', outline: 'none' }} />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Available Balance (Days)</label>
              <input type="number" value={leaveEditData.available} onChange={e => setLeaveEditData({ ...leaveEditData, available: parseFloat(e.target.value || 0) })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #16a34a', fontSize: '14px', fontWeight: '700', outline: 'none', background: '#f0fdf4' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Adjustment Reason</label>
              <textarea placeholder="Why are you making this change?" value={leaveEditData.remark} onChange={e => setLeaveEditData({ ...leaveEditData, remark: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '13px', fontWeight: '600', outline: 'none', minHeight: '80px', resize: 'none' }} />
            </div>

            <button onClick={submitLeaveAdjustments} disabled={isProcessing} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#0f172a', color: 'white', border: 'none', fontWeight: '900', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              {isProcessing ? 'Saving...' : 'Save Adjustments'}
            </button>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
