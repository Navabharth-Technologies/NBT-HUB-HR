import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_ENDPOINTS } from '../../config';
import './Dashboard.css';

export default function EmployeeModule() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('Departments');
  const [winWidth, setWinWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!user?.token) return;
      try {
        const response = await fetch(API_ENDPOINTS.EMPLOYEES, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const filtered = Array.isArray(data) ? data.filter(emp => String(emp.id || emp.EmpID || '').trim() !== '20250') : [];
          setEmployees(filtered);
        }
      } catch (err) {
        console.error('Employee fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [user]);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().startsWith(searchTerm.toLowerCase());

    const matchesDept = selectedDept === 'Departments' ||
      (emp.role && emp.role.toLowerCase().includes(selectedDept.toLowerCase())) ||
      (emp.team && emp.team.toLowerCase().includes(selectedDept.toLowerCase()));

    return matchesSearch && matchesDept;
  });

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Add Title
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text('Employees of NBT', 14, 22);

    // Add Subtitle
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Total Staff Count: ${filteredEmployees.length}`, 14, 30);
    doc.text(`Report Type: Management Overview`, 14, 36);
    doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 42);

    const cleanText = (str) => {
      if (!str) return 'N/A';
      return String(str)
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width spaces
        .replace(/[^\x20-\x7E\s]/g, '') // remove non-ASCII/weird character spacing
        .replace(/\s+/g, ' ')
        .trim();
    };

    const tableColumn = ["ID", "Name", "Role", "Team", "Email", "Status"];
    const tableRows = filteredEmployees.map(emp => [
      cleanText(emp.id),
      cleanText(emp.name),
      cleanText(emp.role),
      cleanText(emp.team),
      cleanText(emp.email),
      cleanText(emp.status || 'Active').toUpperCase()
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 5, bottom: 5, left: 3, right: 3 },
        valign: 'middle',
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 16, halign: 'center' }, // ID
        1: { cellWidth: 'auto' },               // Name (auto-sized to fit complete name)
        2: { cellWidth: 'auto' },               // Role
        3: { cellWidth: 'auto' },               // Team
        4: { cellWidth: 'auto' },               // Email
        5: { cellWidth: 16, halign: 'center' }  // Status
      },
      headStyles: { fillColor: [49, 99, 170], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 12, right: 12 }
    });

    doc.save('Employees_of_NBT.pdf');
  };

  return (
    <div className="hr-dashboard-container">
      <AppHeader />

      <main className="dashboard-content" style={{ paddingBottom: '100px', padding: winWidth < 480 ? '12px 14px' : '20px', marginTop: winWidth < 768 ? '70px' : '85px' }}>
        <header className="section-header" style={{ marginBottom: winWidth < 480 ? '15px' : '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: winWidth < 480 ? '8px' : '15px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate(-1)}
              style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
            >
              <ArrowLeft size={18} color="#64748b" />
            </button>
            <div>
              <h1 style={{ fontSize: winWidth < 480 ? '20px' : (winWidth < 600 ? '22px' : '26px'), fontWeight: '800', color: '#1e293b', margin: 0 }}>Total Employees</h1>
              <p style={{ color: '#64748b', fontSize: winWidth < 480 ? '11px' : (winWidth < 600 ? '13px' : '15px'), margin: '2px 0 0 0' }}>View all {employees.length} members</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', width: winWidth < 600 ? '100%' : 'auto', marginTop: winWidth < 480 ? '12px' : '0' }}>
            <button
              onClick={exportToPDF}
              className="btn-outline"
              style={{ flex: winWidth < 600 ? 1 : 'none', justifyContent: 'center', padding: winWidth < 480 ? '8px' : '10px', fontSize: winWidth < 480 ? '12px' : '13px' }}
            >
              Export PDF
            </button>
          </div>
        </header>

        {/* Search & Filter Bar */}
        <div style={{ marginBottom: winWidth < 480 ? '16px' : '32px', display: 'flex', gap: winWidth < 480 ? '8px' : '16px', flexDirection: winWidth < 600 ? 'column' : 'row' }}>
          <div style={{ flex: winWidth < 600 ? 'unset' : '1 1 300px', width: '100%', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '16px', top: winWidth < 480 ? '10px' : '14px', fontSize: winWidth < 480 ? '14px' : '18px' }}>🔍</span>
            <input
              type="text"
              placeholder="Search name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{
                paddingLeft: '44px',
                paddingTop: winWidth < 480 ? '10px' : '14px',
                paddingBottom: winWidth < 480 ? '10px' : '14px',
                fontSize: winWidth < 480 ? '13px' : '14px',
                boxShadow: 'var(--shadow-sm)'
              }}
            />
          </div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="form-select"
            style={{
              width: winWidth < 600 ? '100%' : 'auto',
              padding: winWidth < 480 ? '10px' : '12px',
              fontSize: winWidth < 480 ? '13px' : '14px',
              minWidth: '200px'
            }}
          >
            <option value="Departments">All Roles</option>
            <option value="Project Manager">Project Manager</option>
            <option value="Lead Software Engineer">Lead Software Engineer</option>
            <option value="Junior Software Engineer">Junior Software Engineer</option>
            <option value="Marketing Team Lead">Marketing Team Lead</option>
            <option value="Human Resource">Human Resource</option>
            <option value="Technical Support Engineer">Technical Support Engineer</option>

          </select>
        </div>

        {/* Employee Grid */}
        <section className="dashboard-section animate-fade-in" style={{ padding: '0', background: 'transparent', border: 'none', boxShadow: 'none' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: winWidth > 1400
              ? 'repeat(3, 1fr)'
              : (winWidth > 1100 ? 'repeat(2, 1fr)' : `repeat(auto-fit, minmax(${winWidth < 480 ? '100%' : '350px'}, 1fr))`),
            gap: '32px',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '100%',
            margin: '0 auto'
          }}>
            {filteredEmployees.map((emp, i) => (
              <div
                key={i}
                className="team-card-static"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  padding: winWidth < 480 ? '20px' : '40px',
                  border: '1px solid #1e3a8a',
                  background: 'var(--white)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'default'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: winWidth < 480 ? '12px' : '20px', marginBottom: winWidth < 480 ? '15px' : '30px' }}>
                  <div style={{
                    width: winWidth < 480 ? '42px' : '56px',
                    height: winWidth < 480 ? '42px' : '56px',
                    borderRadius: winWidth < 480 ? '12px' : '16px',
                    background: 'var(--primary-light)', color: 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: winWidth < 480 ? '18px' : '24px', fontWeight: '900'
                  }}>
                    {emp.name.charAt(0)}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <h3 style={{ fontSize: winWidth < 480 ? '16px' : '18px', fontWeight: '800', color: 'var(--secondary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</h3>
                    <div style={{ fontSize: winWidth < 480 ? '11px' : '13px', fontWeight: '700', color: 'var(--primary)' }}>{emp.role}</div>
                  </div>

                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: winWidth < 480 ? '8px' : '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: winWidth < 480 ? '12px' : '14px', color: 'var(--text-muted)' }}>
                    <span style={{ fontSize: winWidth < 480 ? '12px' : '16px', flexShrink: 0 }}>🏢</span> <span style={{ fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.team}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: winWidth < 480 ? '12px' : '14px', color: 'var(--text-muted)' }}>
                    <span style={{ fontSize: winWidth < 480 ? '12px' : '16px', flexShrink: 0 }}>📧</span> <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: winWidth < 480 ? '11px' : '14px', color: 'var(--text-muted)' }}>
                    <span style={{ fontSize: winWidth < 480 ? '12px' : '16px', flexShrink: 0 }}>🆔</span> <span>{emp.id}</span>
                  </div>
                </div>


              </div>
            ))}
          </div>
        </section>
      </main>

      <AppFooter />

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
