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
          setEmployees(data);
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
    const matchesSearch = emp.name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
      (emp.team && emp.team.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.role && emp.role.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDept = selectedDept === 'Departments' || 
      (emp.role && emp.role.toLowerCase().includes(selectedDept.toLowerCase())) ||
      (emp.team && emp.team.toLowerCase().includes(selectedDept.toLowerCase()));
      
    return matchesSearch && matchesDept;
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add Title
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text('Total Employees', 14, 22);
    
    // Add Subtitle
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Total Members: ${filteredEmployees.length}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 37);

    const tableColumn = ["ID", "Name", "Role", "Team", "Email", "Status"];
    const tableRows = filteredEmployees.map(emp => [
      emp.id || 'N/A',
      emp.name || 'N/A',
      emp.role || 'N/A',
      emp.team || 'N/A',
      emp.email || 'N/A',
      (emp.status || 'Active').toUpperCase()
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [56, 99, 168], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 45 }
    });

    doc.save('Total_Employees.pdf');
  };

  return (
    <div className="hr-dashboard-container">
      <AppHeader />
      
      <main className="dashboard-content" style={{paddingBottom: '100px', padding: winWidth < 480 ? '12px 14px' : '20px', marginTop: winWidth < 768 ? '70px' : '85px'}}>
        <header className="section-header" style={{ marginBottom: winWidth < 480 ? '15px' : '24px' }}>
          <div style={{display: 'flex', alignItems: 'center', gap: winWidth < 480 ? '8px' : '15px', flexWrap: 'wrap'}}>
            <button 
              onClick={() => navigate(-1)} 
              style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
            >
              <ArrowLeft size={18} color="#64748b" />
            </button>
            <div>
              <h1 style={{fontSize: winWidth < 480 ? '20px' : (winWidth < 600 ? '22px' : '26px'), fontWeight: '800', color: '#1e293b', margin: 0}}>Total Employees</h1>
              <p style={{color: '#64748b', fontSize: winWidth < 480 ? '11px' : (winWidth < 600 ? '13px' : '15px'), margin: '2px 0 0 0'}}>Manage all {employees.length} members</p>
            </div>
          </div>
          <div style={{display: 'flex', gap: '8px', width: winWidth < 600 ? '100%' : 'auto', marginTop: winWidth < 480 ? '12px' : '0'}}>
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
        <div style={{marginBottom: winWidth < 480 ? '16px' : '32px', display: 'flex', gap: winWidth < 480 ? '8px' : '16px', flexDirection: winWidth < 600 ? 'column' : 'row'}}>
           <div style={{flex: winWidth < 600 ? 'unset' : '1 1 300px', width: '100%', position: 'relative'}}>
              <span style={{position: 'absolute', left: '16px', top: winWidth < 480 ? '10px' : '14px', fontSize: winWidth < 480 ? '14px' : '18px'}}>🔍</span>
              <input 
                type="text" 
                placeholder="Search name, role, or team..."
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
              <option value="Departments">All Departments</option>
              <option value="Junior software engineer">Junior SE</option>
              <option value="Lead software engineer">Lead SE</option>
              <option value="Digital marketing">Digital Marketing</option>
              <option value="Technical support">Tech Support</option>
           </select>
        </div>

        {/* Employee Grid */}
         <section className="dashboard-section animate-fade-in" style={{padding: '0', background: 'transparent', border: 'none', boxShadow: 'none'}}>
            <div style={{
               display: 'grid', 
               gridTemplateColumns: winWidth > 1400 
                ? 'repeat(4, 1fr)' 
                : (winWidth > 1100 ? 'repeat(3, 1fr)' : `repeat(auto-fit, minmax(${winWidth < 480 ? '100%' : '300px'}, 1fr))`), 
               gap: '24px', 
               justifyContent: 'center',
               width: '100%',
               maxWidth: '100%',
               margin: '0 auto'
            }}>
               {filteredEmployees.map((emp, i) => (
                <div key={i} className="team-card" style={{position: 'relative', overflow: 'hidden', padding: winWidth < 480 ? '20px' : '40px'}}>
                   <div style={{display: 'flex', alignItems: 'center', gap: winWidth < 480 ? '12px' : '20px', marginBottom: winWidth < 480 ? '15px' : '30px'}}>
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
                      <div style={{overflow: 'hidden'}}>
                         <h3 style={{fontSize: winWidth < 480 ? '16px' : '18px', fontWeight: '800', color: 'var(--secondary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{emp.name}</h3>
                         <div style={{fontSize: winWidth < 480 ? '11px' : '13px', fontWeight: '700', color: 'var(--primary)'}}>{emp.role}</div>
                      </div>
                      <div style={{
                        marginLeft: 'auto', padding: '3px 10px', borderRadius: '6px', fontSize: winWidth < 480 ? '9px' : '11px', fontWeight: '900',
                        background: emp.status === 'Active' ? '#f0fdf4' : '#f8fafc',
                        color: emp.status === 'Active' ? 'var(--accent)' : 'var(--text-muted)',
                        border: `1px solid ${emp.status === 'Active' ? '#bcf0da' : '#e2e8f0'}`,
                        flexShrink: 0
                      }}>
                        {(emp.status || 'Active').toUpperCase()}
                      </div>
                   </div>

                   <div style={{display: 'flex', flexDirection: 'column', gap: winWidth < 480 ? '8px' : '12px'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: winWidth < 480 ? '12px' : '14px', color: 'var(--text-muted)'}}>
                         <span style={{fontSize: winWidth < 480 ? '12px' : '16px', flexShrink: 0}}>🏢</span> <span style={{fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{emp.team}</span>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: winWidth < 480 ? '12px' : '14px', color: 'var(--text-muted)'}}>
                         <span style={{fontSize: winWidth < 480 ? '12px' : '16px', flexShrink: 0}}>📧</span> <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{emp.email}</span>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: winWidth < 480 ? '11px' : '14px', color: 'var(--text-muted)'}}>
                         <span style={{fontSize: winWidth < 480 ? '12px' : '16px', flexShrink: 0}}>🆔</span> <span>{emp.id}</span>
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
