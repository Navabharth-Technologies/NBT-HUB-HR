import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config';
import { 
  Package, Search, Edit3, Save, X, Plus,
  Laptop, MousePointer, Keyboard, Smartphone, 
  Camera, Headphones, Tablet as TabletIcon, HardDrive, ScrollText, ArrowLeft
} from 'lucide-react';

export default function AssetsManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [editModal, setEditModal] = useState({ show: false, employee: null, isReadOnly: false });
  const [availableAssetsModal, setAvailableAssetsModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [winWidth, setWinWidth] = useState(window.innerWidth);

  // Asset Form State
  const [form, setForm] = useState({
    employee_name: '',
    employee_id: '',
    designation: '',
    joining_date: '',
    last_working_date: '',
    laptop_details: '',
    mouse: '',
    keyboard: '',
    laptop_stand: '',
    ruf_pad: '',
    pendrive: '',
    mobile: '',
    camera: '',
    earphone: '',
    tablet: ''
  });

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const [empRes, assetRes] = await Promise.all([
        fetch(API_ENDPOINTS.EMPLOYEES, { headers: { 'Authorization': `Bearer ${user.token}` } }),
        fetch(API_ENDPOINTS.ASSETS || `${API_ENDPOINTS.EMPLOYEES}/assets`, { headers: { 'Authorization': `Bearer ${user.token}` } })
      ]);

      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData);
      }

      if (assetRes.ok) {
        const assetData = await assetRes.json();
        const assetMap = {};
        assetData.forEach(a => { 
          // Robust ID extraction
          const id = a.employee_id || a.EmpID || a.employeeId || a.id;
          if (id) assetMap[id] = a; 
        });
        setAssets(assetMap);
      }
    } catch (err) {
      console.error('Fetch assets error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'N/A' || dateStr === '--') return dateStr;
    // Handle ISO format like 2025-10-10T00:00:00
    if (dateStr.includes('T')) {
      const dateOnly = dateStr.split('T')[0];
      const [y, m, d] = dateOnly.split('-');
      return `${d}-${m}-${y}`;
    }
    // Handle YYYY-MM-DD
    if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
      const [y, m, d] = dateStr.split('-');
      return `${d}-${m}-${y}`;
    }
    return dateStr;
  };

  const handleEdit = (emp, readOnly = false) => {
    const empId = emp.id || emp.EmpID;
    const currentAsset = assets[empId] || assets[emp.id] || assets[emp.EmpID] || {};
    const toYesNo = (val, status) => {
      if (val === 'Yes' || val === 'Yes' || status === 'Yes' || Number(val) === 1) return 'Yes';
      if (val === 'No' || val === 'No' || status === 'No' || Number(val) === 0) return 'No';
      return '';
    };

    setForm({
      employee_name: emp.name || currentAsset.name || currentAsset.employee_name || '',
      employee_id: emp.id || emp.EmpID || currentAsset.employee_id || currentAsset.employeeId || '',
      designation: currentAsset.designation || currentAsset.role || emp.role || '',
      joining_date: formatDate(currentAsset.joining_date || currentAsset.doj || currentAsset.joining_date_iso || currentAsset.JoinDate || ''),
      last_working_date: formatDate(currentAsset.last_working_date || currentAsset.lwd || currentAsset.lwd_iso || ''),
      laptop_details: currentAsset.laptop_details || currentAsset.laptop || currentAsset.laptop_unit_details || '',
      mouse: toYesNo(currentAsset.mouse_unit, currentAsset.mouse || currentAsset.mouse_status),
      keyboard: toYesNo(currentAsset.keyboard_unit, currentAsset.keyboard || currentAsset.keyboard_status),
      laptop_stand: toYesNo(currentAsset.stand_unit || currentAsset.laptop_stand_unit, currentAsset.laptop_stand || currentAsset.stand),
      ruf_pad: toYesNo(currentAsset.ruf_pad_unit || currentAsset.rufpad_unit, currentAsset.ruf_pad || currentAsset.rufpad),
      pendrive: toYesNo(currentAsset.pendrive_unit, currentAsset.pendrive),
      mobile: toYesNo(currentAsset.mobile_unit, currentAsset.mobile || currentAsset.mobile_handset),
      camera: toYesNo(currentAsset.camera_unit || currentAsset.webcam_unit, currentAsset.camera || currentAsset.webcam),
      earphone: toYesNo(currentAsset.earphone_unit || currentAsset.headphone_unit || currentAsset.earphone_headphone_unit, currentAsset.earphone || currentAsset.headphone || currentAsset.earphone_headphone || currentAsset.headphones),
      tablet: toYesNo(currentAsset.tablet_unit, currentAsset.tablet)
    });
    setEditModal({ 
      show: true, 
      employee: emp, 
      isReadOnly: readOnly,
      assetId: currentAsset.id || currentAsset.EmpID || currentAsset.employee_id
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Determine if this employee already has an asset record in the DB
      const empId = editModal.employee.id || editModal.employee.EmpID;
      const existingAsset = assets[empId];
      const hasExistingRecord = !!existingAsset;
      
      // Use the DB record's primary key for PUT, fallback to employee ID
      const targetId = editModal.assetId || (existingAsset?.id) || empId;
      
      // POST for brand-new records, PUT for updating existing ones
      const endpoint = hasExistingRecord ? API_ENDPOINTS.ASSET_UPDATE(targetId) : API_ENDPOINTS.ASSETS;
      const method = hasExistingRecord ? 'PUT' : 'POST';
      
      console.log(`[ASSET DECISION] hasExistingRecord=${hasExistingRecord}, targetId=${targetId}, method=${method}`);

      // Advanced Date Formatter (Handles both 16-01-2026 and 16/01/2026)
      const toISO = (d) => {
        if (!d || d === 'N/A' || d === '--' || d.includes('YYYY')) return d;
        const normalized = d.replace(/\//g, '-'); // Support slashes/
        if (normalized.split('-')[0].length === 4) return normalized; 
        const [dd, mm, yyyy] = normalized.split('-');
        if (dd && mm && yyyy) {
          return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        }
        return d;
      };

      const isoDate = toISO(form.joining_date);
      const isoLwd = toISO(form.last_working_date);

      const payload = {
        // Essential Identities
        employee_id: editModal.employee.id || editModal.employee.EmpID,
        id: editModal.assetId || (editModal.employee.id || editModal.employee.EmpID),
        asset_id: editModal.assetId,
        emp_id: editModal.employee.id || editModal.employee.EmpID,
        name: form.employee_name,
        employee_name: form.employee_name,

        // Core Status & Metadata
        status: form.status || 'Active',
        assigned_date: isoDate,
        designation: form.designation,
        role: form.designation,
        
        // Massive Redundancy for Joining Date (DOJ)
        joining_date: isoDate,
        doj: isoDate,
        joining_date_iso: isoDate,
        joining_date_raw: form.joining_date,
        joined_date: isoDate,
        joined_at: isoDate,
        JoinDate: isoDate,
        date_of_joining: isoDate,
        joining_day: form.joining_date,
        
        // LWD Super-Set
        last_working_date: isoLwd,
        lwd: isoLwd,
        lwd_iso: isoLwd,
        lwd_raw: form.last_working_date,
        last_working_day: isoLwd,
        exit_date: isoLwd,

        // Hardware (Full Inventory Map)
        laptop_details: form.laptop_details,
        laptop_unit_details: form.laptop_details,
        laptop: form.laptop_details,
        
        mouse: form.mouse,
        mouse_unit: form.mouse === 'Yes' ? 1 : 0,
        mouse_status: form.mouse,
        
        keyboard: form.keyboard,
        keyboard_unit: form.keyboard === 'Yes' ? 1 : 0,
        keyboard_status: form.keyboard,
        
        laptop_stand: form.laptop_stand,
        stand: form.laptop_stand,
        stand_unit: form.laptop_stand === 'Yes' ? 1 : 0,
        
        ruf_pad: form.ruf_pad,
        rufpad: form.ruf_pad,
        ruf_pad_unit: form.ruf_pad === 'Yes' ? 1 : 0,
        
        pendrive: form.pendrive,
        pendrive_unit: form.pendrive === 'Yes' ? 1 : 0,
        
        mobile: form.mobile,
        mobile_unit: form.mobile === 'Yes' ? 1 : 0,
        mobile_handset: form.mobile,
        
        camera: form.camera,
        webcam: form.camera,
        camera_unit: form.camera === 'Yes' ? 1 : 0,
        
        earphone: form.earphone,
        headphone: form.earphone,
        earphones: form.earphone,
        headphones: form.earphone,
        earphone_headphone: form.earphone,
        earphone_unit: form.earphone === 'Yes' ? 1 : 0,
        headphone_unit: form.earphone === 'Yes' ? 1 : 0,
        
        tablet: form.tablet,
        tablet_unit: form.tablet === 'Yes' ? 1 : 0
      };

      console.log(`[ASSET SYNC] ${method} -> ${endpoint}`, payload);

      const response = await fetch(endpoint, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        alert(`Database Entry Synced! ✅\nServer Info: ${result.message || 'Stored Successfully'}`);
        setEditModal({ show: false, employee: null, isReadOnly: false });
        // Force a brief delay before re-fetching to allow DB indexing
        setTimeout(() => fetchData(), 500);
      } else {
        alert(`Storage Error: ${result.message || result.error || 'Server rejected the entry'}`);
      }
    } catch (err) {
      console.error('Fatal Asset Sync Error:', err);
      alert('Network failure connecting to the Asset Database.');
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || (emp.team && emp.team.includes(selectedDept));
    return matchesSearch && matchesDept;
  });

  return (
    <div className="assets-management-container" style={{ minHeight: '100vh', backgroundColor: '#eaeff2', fontFamily: "'Outfit', sans-serif" }}>
      <AppHeader />
      
      <main className="dashboard-content" style={{ 
        paddingTop: winWidth < 768 ? '100px' : '120px',
        paddingLeft: winWidth < 768 ? '16px' : '26px',
        paddingRight: winWidth < 768 ? '16px' : '26px',
        paddingBottom: '100px',
        boxSizing: 'border-box'
      }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '25px', width: '100%', flexWrap: 'wrap', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button 
                onClick={() => navigate(-1)} 
                style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowLeft size={18} color="#64748b" />
              </button>
              <div style={{ background: 'white', padding: '12px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <Package size={24} color="#3163aa" />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Asset Management Hub</h1>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '2px 0 0 0' }}>Deploy and track workforce hardware inventory</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => setAvailableAssetsModal(true)}
                style={{ background: 'white', color: '#3163aa', border: '2px solid #3163aa', padding: '12px 24px', borderRadius: '14px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.3s' }}
              >
                <Package size={18} />
                Available Assets
              </button>
              <button 
                onClick={() => {
                  setForm({
                    designation: '', joining_date: '', last_working_date: '', laptop_details: '',
                    mouse: '', keyboard: '', laptop_stand: '', ruf_pad: '', pendrive: '',
                    mobile: '', camera: '', earphone: '', tablet: ''
                  });
                  setEditModal({ show: true, employee: { is_new: true, name: '' } });
                }}
                style={{ background: '#3163aa', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 15px rgba(49, 99, 170, 0.2)' }}
              >
                <Plus size={18} />
                Add new assets details for new joinee
              </button>
            </div>
          </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }} className="animate-fade-in">
          <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search member name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px 15px 12px 45px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: 'white' }}
            />
          </div>
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '600', color: '#1e293b', minWidth: '180px' }}
          >
            <option value="All">All Units</option>
            <option value="Technical Support">Support Sigma</option>
            <option value="Development">Development Devildog</option>
            <option value="Marketing">Growth Bravo</option>
          </select>
        </div>

        {/* Table/Card View */}
        {winWidth < 768 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '24px' }}>Establishing neural link...</div>
            ) : filteredEmployees.map((emp, i) => {
              const empId = emp.id || emp.EmpID;
              const asset = assets[empId] || assets[emp.id] || assets[emp.EmpID] || {};
              const hasAsset = !!(assets[empId] || assets[emp.id] || assets[emp.EmpID]);
              return (
                <div key={i} style={{ background: 'white', borderRadius: '24px', padding: '20px', border: '1.5px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3163aa', fontWeight: '900', fontSize: '16px' }}>
                      {emp.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '900', fontSize: '16px', color: '#1e293b' }}>{emp.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>ID: {emp.id || emp.EmpID}</div>
                    </div>
                    <div style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '10px', fontWeight: '900', background: hasAsset ? '#f0fdf4' : '#eff6ff', color: hasAsset ? '#16a34a' : '#2563eb', border: `1px solid ${hasAsset ? '#bbf7d0' : '#dbeafe'}` }}>
                      {hasAsset ? 'CONFIGURED' : 'PENDING'}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Designation</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#334155' }}>{asset.designation || emp.role || 'Unspecified'}</div>
                  </div>

                  <button 
                    onClick={() => handleEdit(emp, hasAsset)}
                    style={{ 
                      width: '100%', padding: '12px', borderRadius: '14px', border: 'none', 
                      background: hasAsset ? '#f1f5f9' : '#3163aa', 
                      color: hasAsset ? '#475569' : 'white', 
                      fontWeight: '800', fontSize: '13px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    {hasAsset ? <Package size={16} /> : <Edit3 size={16} />}
                    {hasAsset ? 'View Asset Details' : 'Configure Hardware'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="dashboard-section animate-fade-in" style={{ padding: '0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', background: 'white', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '15px 25px', color: '#64748b', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', width: '350px' }}>Member Details</th>
                    <th style={{ padding: '15px 25px', color: '#64748b', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', width: '300px' }}>Designation</th>
                    <th style={{ padding: '15px 25px', color: '#64748b', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', width: '250px' }}>Configuration</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i}><td colSpan="5" style={{ padding: '25px', textAlign: 'center', color: '#94a3b8' }}>Establishing neural link...</td></tr>
                    ))
                  ) : filteredEmployees.map((emp, i) => {
                    const empId = emp.id || emp.EmpID;
                    const asset = assets[empId] || assets[emp.id] || assets[emp.EmpID] || {};
                    const hasAsset = !!(assets[empId] || assets[emp.id] || assets[emp.EmpID]);
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s', backgroundColor: i % 2 === 0 ? 'transparent' : '#fcfdfe' }}>
                        <td style={{ padding: '15px 25px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3163aa', fontWeight: '900', fontSize: '14px' }}>
                              {emp.name.charAt(0)}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {emp.id || emp.EmpID}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '15px 25px' }}>
                          <span style={{ fontSize: '13px', color: '#334155', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{asset.designation || emp.role || 'Unspecified'}</span>
                        </td>
                        <td style={{ padding: '15px 25px', textAlign: 'center' }}>
                          {hasAsset ? (
                            <button 
                              onClick={() => handleEdit(emp, true)}
                              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', color: '#64748b', cursor: 'pointer', transition: '0.2s', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Package size={14} /> <span style={{ fontSize: '12px', fontWeight: '800' }}>View Details</span>
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleEdit(emp, false)}
                              style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '10px', padding: '8px 12px', color: '#2563eb', cursor: 'pointer', transition: '0.2s', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Edit3 size={14} /> <span style={{ fontSize: '12px', fontWeight: '800' }}>Configure</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="animate-slide-up" style={{ background: 'white', width: '100%', maxWidth: '800px', borderRadius: '30px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '25px 35px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '45px', height: '45px', borderRadius: '14px', background: '#3163aa', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>
                    {editModal.employee.is_new ? '+' : editModal.employee.name.charAt(0)}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', margin: 0 }}>
                      {editModal.isReadOnly ? `Asset Details: ${editModal.employee.name}` : (editModal.employee.is_new ? 'Add New Asset Record' : `Update Assets: ${editModal.employee.name}`)}
                    </h2>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                      {editModal.employee.is_new ? 'New assignment record' : `ID: ${editModal.employee.id || editModal.employee.EmpID}`}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {editModal.isReadOnly && (
                    <button 
                      onClick={() => setEditModal(prev => ({ ...prev, isReadOnly: false }))}
                      style={{ background: '#eff6ff', border: '1px solid #dbeafe', padding: '8px 16px', borderRadius: '12px', color: '#2563eb', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
                    >
                      <Edit3 size={16} /> Edit Record
                    </button>
                  )}
                  <button onClick={() => setEditModal({ show: false, employee: null })} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}><X size={16} /></button>
                </div>
              </div>
            </div>

            <div style={{ padding: '35px', overflowY: 'auto', flex: 1, position: 'relative' }}>
              {editModal.isReadOnly && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5, cursor: 'not-allowed' }} />
              )}
              <div style={{ display: 'grid', gridTemplateColumns: winWidth < 600 ? '1fr' : '1fr 1fr', gap: '25px' }}>
                {/* Deployment Base Details */}
                <div style={{ gridColumn: 'span 2', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#3163aa', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1.5px solid #eff6ff', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ScrollText size={14} /> Deployment Base Details
                  </h3>
                </div>
                <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', paddingLeft: '4px' }}>EMPLOYEE NAME</label>
                    <input 
                      type="text" 
                      placeholder="Enter Name" 
                      value={form.employee_name} 
                      onChange={(e) => setForm({ ...form, employee_name: e.target.value })} 
                      readOnly={!editModal.employee.is_new}
                      style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid #e2e8f0', background: editModal.employee.is_new ? '#f8fafc' : '#f1f5f9', fontWeight: '600', fontSize: '14px', outline: 'none', cursor: editModal.employee.is_new ? 'text' : 'not-allowed' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', paddingLeft: '4px' }}>EMPLOYEE ID</label>
                    <input 
                      type="text" 
                      placeholder={editModal.employee.is_new ? "Auto/Manual" : "System ID"} 
                      value={form.employee_id} 
                      onChange={(e) => setForm({ ...form, employee_id: e.target.value })} 
                      readOnly={!editModal.employee.is_new}
                      style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid #e2e8f0', background: editModal.employee.is_new ? '#f8fafc' : '#f1f5f9', fontWeight: '600', fontSize: '14px', outline: 'none', cursor: editModal.employee.is_new ? 'text' : 'not-allowed' }} 
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', paddingLeft: '4px' }}>DESIGNATION</label>
                  <input type="text" placeholder="e.g. Lead Software Engineer" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '600', fontSize: '14px', outline: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', paddingLeft: '4px' }}>JOINING DATE</label>
                    <input type="text" placeholder="DD-MM-YYYY" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '600', fontSize: '14px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', paddingLeft: '4px' }}>LWD</label>
                    <input type="text" placeholder="N/A" value={form.last_working_date} onChange={(e) => setForm({ ...form, last_working_date: e.target.value })} style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '600', fontSize: '14px', outline: 'none' }} />
                  </div>
                </div>

                {/* Hardware Inventory */}
                <div style={{ gridColumn: 'span 2', margin: '15px 0 10px 0' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#3163aa', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1.5px solid #eff6ff', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Laptop size={14} /> Hardware Inventory
                  </h3>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', paddingLeft: '4px' }}>
                    <Laptop size={14} /> LAPTOP UNIT DETAILS
                  </label>
                  <textarea placeholder="Model, Serial Number, OS details..." value={form.laptop_details} onChange={(e)=>setForm({...form, laptop_details: e.target.value})} style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '600', fontSize: '14px', minHeight: '80px', resize: 'none', outline: 'none' }} />
                </div>

                {[
                  { key: 'mouse', label: 'MOUSE', icon: <MousePointer size={14} /> },
                  { key: 'keyboard', label: 'KEYBOARD', icon: <Keyboard size={14} /> },
                  { key: 'laptop_stand', label: 'LAPTOP STAND', icon: <Laptop size={14} /> },
                  { key: 'ruf_pad', label: 'RUF PAD', icon: <ScrollText size={14} /> },
                  { key: 'pendrive', label: 'PENDRIVE', icon: <HardDrive size={14} /> },
                  { key: 'mobile', label: 'MOBILE UNIT', icon: <Smartphone size={14} /> },
                  { key: 'camera', label: 'CAMERA/WEBCAM', icon: <Camera size={14} /> },
                  { key: 'earphone', label: 'EARPHONE/HEADPHONE', icon: <Headphones size={14} /> },
                  { key: 'tablet', label: 'TABLET UNIT', icon: <TabletIcon size={14} /> }
                ].map((item) => (
                  <div key={item.key}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', paddingLeft: '4px' }}>{item.icon} {item.label}</label>
                    <select 
                      value={form[item.key]} 
                      onChange={(e)=>setForm({...form, [item.key]: e.target.value})} 
                      style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '600', fontSize: '14px', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="">Select Option</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '25px 35px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => setEditModal({ show: false, employee: null })}
                style={{ flex: 1, padding: '14px', borderRadius: '50px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}
              >
                Discard Changes
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                style={{ flex: 2, padding: '14px', borderRadius: '50px', border: 'none', background: '#3163aa', color: 'white', fontSize: '14px', fontWeight: '800', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 15px -3px rgba(49, 99, 170, 0.2)' }}
              >
                {saving ? 'Syncing...' : <><Save size={18} /> Submit details</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Available Assets Modal */}
      {availableAssetsModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="modal-content animate-slide-up" style={{
            background: 'white', borderRadius: '30px', width: '90%', maxWidth: '600px',
            padding: '40px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <button 
              onClick={() => setAvailableAssetsModal(false)}
              style={{ position: 'absolute', top: '25px', right: '25px', background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '35px' }}>
              <div style={{ background: '#eff6ff', width: '60px', height: '60px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                <Package size={30} color="#3163aa" />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: '0 0 8px 0' }}>Available Hardware Inventory</h2>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Current unassigned assets in stock</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
              {[
                { label: 'Laptops', icon: <Laptop size={18} />, count: 5, color: '#3b82f6' },
                { label: 'Mouse', icon: <MousePointer size={18} />, count: 12, color: '#10b981' },
                { label: 'Keyboards', icon: <Keyboard size={18} />, count: 8, color: '#f59e0b' },
                { label: 'Laptop Stands', icon: <Package size={18} />, count: 4, color: '#6366f1' },
                { label: 'Ruf Pads', icon: <ScrollText size={18} />, count: 15, color: '#ec4899' },
                { label: 'Pendrives', icon: <HardDrive size={18} />, count: 20, color: '#14b8a6' },
                { label: 'Webcams', icon: <Camera size={18} />, count: 3, color: '#8b5cf6' },
                { label: 'Earphones', icon: <Headphones size={18} />, count: 10, color: '#ef4444' }
              ].map((item, i) => (
                <div key={i} style={{ 
                  background: '#f8fafc', padding: '20px', borderRadius: '20px', 
                  border: '1px solid #e2e8f0', textAlign: 'center',
                  transition: 'transform 0.2s'
                }}>
                  <div style={{ color: item.color, marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b' }}>{item.count}</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginTop: '4px' }}>{item.label}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '35px', padding: '20px', background: '#fffbeb', borderRadius: '20px', border: '1px solid #fde68a', display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div style={{ fontSize: '20px' }}>⚠️</div>
              <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '600', lineHeight: '1.5' }}>
                Inventory levels are updated automatically when new assets are assigned or returned. Contact IT warehouse for physical verification.
              </div>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
