import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Share2, Mail, FileText, Landmark, Clock, User, Briefcase, Building2, MapPin, ChevronDown, FileSpreadsheet, Fingerprint, Calendar, Shield, Heart, X, Check } from 'lucide-react';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config';
import logo from '../../assets/logo.png';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

export default function PaySlipScreen() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showExportOptions, setShowExportOptions] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [usersList, setUsersList] = useState([]);
    const [previewData, setPreviewData] = useState(null);
    const [formData, setFormData] = useState({
        employee_id: '', month: '', year: '', emp_name: '', department: '', designation: '',
        total_present: '', total_weekly_off: '', total_holidays: '', total_leaves: '',
        total_absent: '', total_work_ot: '', total_ot_hours: '', 
        basic_salary: '', hra: '', conveyance: '', special_allowance: '',
        performance_incentive: '', yearly_incentive: '',
        pf_deduction: '', esi_deduction: '', pt_deduction: '', lwf_deduction: '', income_tax: '',
        total_earnings: '', total_incentives: '', total_deductions: '', net_payable: '', available_leaves: ''
    });
    const dropdownRef = useRef(null);

    const [winWidth, setWinWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWinWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch(API_ENDPOINTS.USERS, {
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
                const data = await res.json();
                if (res.ok) setUsersList(data);
            } catch (err) { console.error('User fetch error:', err); }
        };
        fetchUsers();
    }, [user]);

    const handleUserSelect = (e) => {
        const selectedValue = e.target.value;
        const selectedUser = usersList.find(u => String(u.employee_id || u.id) === String(selectedValue));
        if (selectedUser) {
            setFormData(prev => ({
                ...prev,
                employee_id: selectedUser.employee_id || selectedUser.id,
                emp_name: selectedUser.name,
                designation: selectedUser.role || selectedUser.designation || ''
            }));
        } else {
            setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            
            // Auto-calculate financials if specific fields change
            const financialFields = [
                'basic_salary', 'hra', 'conveyance', 'special_allowance',
                'performance_incentive', 'yearly_incentive',
                'pf_deduction', 'esi_deduction', 'pt_deduction', 'lwf_deduction', 'income_tax'
            ];
            
            if (financialFields.includes(name)) {
                const basic = parseFloat(updated.basic_salary) || 0;
                const hra = parseFloat(updated.hra) || 0;
                const conv = parseFloat(updated.conveyance) || 0;
                const spec = parseFloat(updated.special_allowance) || 0;
                
                const perf = parseFloat(updated.performance_incentive) || 0;
                const yearly = parseFloat(updated.yearly_incentive) || 0;
                
                const pf = parseFloat(updated.pf_deduction) || 0;
                const esi = parseFloat(updated.esi_deduction) || 0;
                const pt = parseFloat(updated.pt_deduction) || 0;
                const lwf = parseFloat(updated.lwf_deduction) || 0;
                const itax = parseFloat(updated.income_tax) || 0;
 
                const earnings = basic + hra + conv + spec;
                const incentives = perf + yearly;
                const deductions = pf + esi + pt + lwf + itax;
                
                updated.total_earnings = earnings.toString();
                updated.total_incentives = incentives.toString();
                updated.total_deductions = deductions.toString();
                updated.net_payable = (earnings + incentives - deductions).toString();
            }
            
            return updated;
        });
    };

    const handleAddPayslip = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(API_ENDPOINTS.PAY_SLIP_POST, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('Payslip Added Successfully to Database!');
                setPreviewData({ ...formData }); // Update the document view immediately
                setShowAddForm(false);
                setFormData({
                    employee_id: '', month: '', year: '', emp_name: '', department: '', designation: '',
                    total_present: '', total_weekly_off: '', total_holidays: '', total_leaves: '',
                    total_absent: '', total_work_ot: '', total_ot_hours: '', 
                    basic_salary: '', hra: '', conveyance: '', special_allowance: '',
                    performance_incentive: '', yearly_incentive: '',
                    pf_deduction: '', esi_deduction: '', pt_deduction: '', lwf_deduction: '', income_tax: '',
                    total_earnings: '', total_incentives: '', total_deductions: '', net_payable: '', available_leaves: ''
                });
            } else {
                const err = await response.json();
                alert(`Error: ${err.message || 'Failed to save payslip'}`);
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Internal server error. Please check backend connection.');
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowExportOptions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePrint = () => {
        setShowExportOptions(false);
        window.print();
    };

    const handleAddClick = () => {
        setShowAddForm(true);
    };

    const handleDownloadPDF = async () => {
        setShowExportOptions(false);
        const element = document.getElementById('payslip-document');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = 210;
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Payslip_${previewData?.emp_name || 'Employee'}_${previewData?.month}_${previewData?.year}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate high-quality PDF. Please try Print instead.');
        }
    };

    const handleDownloadExcel = () => {
        setShowExportOptions(false);
        const data = previewData || {};
        const basic = Number(data.basic_salary || 0);
        const deduct = Number(data.pf_deduction || 0) + Number(data.esi_deduction || 0) + Number(data.pt_deduction || 0);
        
        const worksheetData = [
            ["NAVABHARATH TECHNOLOGIES PAYSLIP"],
            ["Month/Year", `${data.month}/${data.year}`],
            ["Employee Details"],
            ["Employee Code", data.employee_id],
            ["Name", data.emp_name],
            ["Department", data.department],
            ["Designation", data.designation],
            [],
            ["Attendance Stats"],
            ["Present Days", data.total_present],
            ["Weekly Offs", data.total_weekly_off],
            ["Leaves", data.total_leaves],
            ["OT Hours", data.total_ot_hours],
            [],
            ["Financial Summary"],
            ["Basic Salary", basic],
            ["Total Deductions", deduct],
            ["Net Payable Amount", basic - deduct],
            [],
            ["Footer", "Computer generated. No signature required."]
        ];

        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Payslip");
        XLSX.writeFile(wb, `Payslip_${data.emp_name || 'Employee'}.xlsx`);
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#eaeff2', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', sans-serif" }}>
            <div className="no-print">
                <AppHeader />
            </div>

            <main style={{ flex: 1, padding: winWidth < 768 ? '20px 15px' : '20px 20px', marginTop: winWidth < 768 ? '85px' : '110px' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>

                    {/* Top Action Bar */}
                    <div className="no-print" style={{ display: 'flex', flexDirection: winWidth < 600 ? 'column' : 'row', justifyContent: 'space-between', alignItems: winWidth < 600 ? 'flex-start' : 'center', marginBottom: '32px', gap: '16px' }}>
                        <button
                            onClick={() => navigate(-1)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1.5px solid #e2e8f0', padding: '10px 20px', borderRadius: '12px', color: '#64748b', fontWeight: '800', cursor: 'pointer', transition: '0.2s' }}
                        >
                            <ArrowLeft size={18} /> Back
                        </button>

                        <div style={{ display: 'flex', gap: '12px', width: winWidth < 600 ? '100%' : 'auto' }}>
                            <button
                                onClick={handleAddClick}
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#0f172a', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.2)' }}
                            >
                                <Printer size={18} /> {winWidth < 480 ? 'Add' : 'Add payslip'}
                            </button>

                            <div ref={dropdownRef} style={{ position: 'relative', flex: 1 }}>
                                <button
                                    onClick={() => setShowExportOptions(!showExportOptions)}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'white', border: '1.5px solid #e2e8f0', padding: '10px 24px', borderRadius: '12px', color: '#0f172a', fontWeight: '800', cursor: 'pointer', transition: '0.2s' }}
                                >
                                    <Download size={18} /> Export <ChevronDown size={14} style={{ transform: showExportOptions ? 'rotate(180deg)' : 'rotate(0)' }} />
                                </button>

                                {showExportOptions && (
                                    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '8px', width: '220px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', zIndex: 1000, animation: 'dropdown-fade-in 0.2s ease-out' }}>
                                        <button onClick={handleDownloadPDF} style={dropdownItemStyle}><FileText size={16} color="#ef4444" /> PDF</button>
                                        <button onClick={handleDownloadExcel} style={dropdownItemStyle}><FileSpreadsheet size={16} color="#22c55e" /> Excel</button>
                                        <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }}></div>
                                        <button onClick={handlePrint} style={dropdownItemStyle}><Printer size={16} color="#64748b" /> Print</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* The Payslip Document */}
                    <div id="payslip-document" style={{ background: 'white', borderRadius: winWidth < 768 ? '16px' : '0', padding: winWidth < 768 ? '20px' : '25px 40px', boxShadow: '0 4px 50px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden', border: '1px solid #e2e8f0' }}>

                        {/* Decorative Corners */}
                        <div style={{ position: 'absolute', top: 0, right: 0, width: winWidth < 768 ? '60px' : '120px', height: winWidth < 768 ? '60px' : '120px', background: 'linear-gradient(225deg, #1e40af 50%, transparent 50%)' }}></div>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: winWidth < 768 ? '60px' : '120px', height: winWidth < 768 ? '60px' : '120px', background: 'linear-gradient(45deg, #1e40af 50%, transparent 50%)' }}></div>

                        {/* Company Branding */}
                        <div style={{ textAlign: 'center', marginBottom: '30px', position: 'relative', zIndex: 2 }}>
                            <img src={logo} alt="Company Logo" style={{ width: winWidth < 768 ? '40px' : '50px', marginBottom: '15px' }} />
                            <h1 style={{ fontSize: winWidth < 768 ? '20px' : '28px', fontWeight: '950', color: '#0f172a', margin: '0 0 5px 0', letterSpacing: '-1px' }}>NAVABHARATH TECHNOLOGIES</h1>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Smarter Solutions for Better Future</p>
                            <div style={{ width: '100%', height: '1.5px', background: '#f1f5f9', margin: '20px 0' }}></div>
                            <h2 style={{ fontSize: winWidth < 768 ? '13px' : '15px', fontWeight: '950', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1.5px solid #e2e8f0', display: 'inline-block', paddingBottom: '10px', marginBottom: '10px' }}>
                                PAY SLIP FOR THE MONTH OF {previewData?.month ? new Date(2000, previewData.month - 1).toLocaleString('default', { month: 'long' }).toUpperCase() : 'APRIL'} - {previewData?.year || '2026'}
                            </h2>
                        </div>

                        {/* Employee Details Grid */}
                        <div style={{ border: '1.5px solid #e2e8f0', marginBottom: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1.5px solid #e2e8f0' }}>
                                <div style={{ padding: '12px 15px', borderRight: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '950', color: '#475569' }}>EMPCODE</span>
                                    <span style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a' }}>{previewData?.employee_id || '202516'}</span>
                                </div>
                                <div style={{ padding: '12px 15px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '950', color: '#475569' }}>DEPARTMENT</span>
                                    <span style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a' }}>{previewData?.department || 'Information Technology'}</span>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                <div style={{ padding: '12px 15px', borderRight: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '950', color: '#475569' }}>EMP. NAME</span>
                                    <span style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a' }}>{previewData?.emp_name || 'Sahana Nv'}</span>
                                </div>
                                <div style={{ padding: '12px 15px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '950', color: '#475569' }}>DESIGNATION</span>
                                    <span style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a' }}>{previewData?.designation || 'Lead Software Engineer'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Attendance Statistics Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1.5px solid #e2e8f0', marginBottom: '20px', fontSize: '9px' }}>
                            {[
                                { l: 'TOT. PRE:', v: previewData?.total_present || '31' },
                                { l: 'TOT. WO:-', v: previewData?.total_weekly_off || '4' },
                                { l: 'TOT. HL:-', v: previewData?.total_holidays || '0' },
                                { l: 'TOT. LEAVE:-', v: previewData?.total_leaves || '1' },
                                { l: 'TOTAL ABSENT', v: previewData?.total_absent || '1' },
                                { l: 'TOTAL WORK+OT', v: previewData?.total_work_ot || '1' },
                                { l: 'TOTAL OT', v: previewData?.total_ot_hours || '1' },
                                { l: 'BS/REFERENCE AMT.', v: Number(previewData?.basic_salary || 5000) }
                            ].map((item, i) => (
                                <div key={i} style={{ padding: '10px 12px', borderRight: (i + 1) % 4 === 0 ? 'none' : '1.5px solid #e2e8f0', borderBottom: i < 4 ? '1.5px solid #e2e8f0' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '900', color: '#475569' }}>{item.l}</span>
                                    <span style={{ fontWeight: '950', color: '#0f172a' }}>{item.v}</span>
                                </div>
                            ))}
                        </div>

                        {/* Earnings & Deductions Tables */}
                        <div style={{ display: 'flex', border: '1px solid #e2e8f0', fontSize: '10px' }}>
                            {/* Earnings Column */}
                            <div style={{ flex: 1, borderRight: '1px solid #e2e8f0' }}>
                                <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '950' }}>EARNING</div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {[
                                        { l: 'Basic', v: previewData?.basic_salary || '25,000' },
                                        { l: 'HRA', v: previewData?.hra || '0' },
                                        { l: 'Conveyance', v: previewData?.conveyance || '0' },
                                        { l: 'Special Allowance', v: previewData?.special_allowance || '0' }
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                                            <span>{item.l}</span>
                                            <span style={{ fontWeight: '800' }}>{item.v}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', marginTop: 'auto', borderTop: '2px solid #e2e8f0', fontWeight: '950', background: '#f8fafc' }}>
                                    <span>Total Earning</span>
                                    <span>{previewData?.total_earnings || '30,000'}</span>
                                </div>
                            </div>

                            {/* Incentives Column */}
                            <div style={{ flex: 1, borderRight: '1px solid #e2e8f0' }}>
                                <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '950' }}>INCENTIVES</div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {[
                                        { l: 'Performance', v: previewData?.performance_incentive || '0' },
                                        { l: 'Yearly Incentive', v: previewData?.yearly_incentive || '0' }
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                                            <span>{item.l}</span>
                                            <span style={{ fontWeight: '800' }}>{item.v}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', marginTop: 'auto', borderTop: '2px solid #e2e8f0', fontWeight: '950', background: '#f8fafc' }}>
                                    <span>Total Incent.</span>
                                    <span>{previewData?.total_incentives || '0'}</span>
                                </div>
                            </div>

                            {/* Deductions Column */}
                            <div style={{ flex: 1 }}>
                                <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '950' }}>DEDUCTION</div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {[
                                        { l: 'PF', v: previewData?.pf_deduction || '1,000' },
                                        { l: 'ESI', v: previewData?.esi_deduction || '500' },
                                        { l: 'PT', v: previewData?.pt_deduction || '100' },
                                        { l: 'LWF', v: previewData?.lwf_deduction || '0' },
                                        { l: 'Income Tax', v: previewData?.income_tax || '0' }
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                                            <span>{item.l}</span>
                                            <span style={{ fontWeight: '800' }}>{item.v}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderTop: '2px solid #e2e8f0', fontWeight: '950', background: '#f8fafc' }}>
                                    <span>Total Deduct.</span>
                                    <span>{previewData?.total_deductions || '1,600'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderTop: '1px solid #e2e8f0', fontWeight: '950' }}>
                                    <span>Net Payable</span>
                                    <span>{previewData?.net_payable || '28,400'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ display: 'flex', flexDirection: winWidth < 600 ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', borderTop: '1px solid #f1f5f9', paddingTop: '15px', gap: '10px' }}>
                            <p style={{ margin: 0, fontSize: '9px', color: '#94a3b8', fontStyle: 'italic', fontWeight: '700' }}>
                                Computer generated payslip. No signature required.
                            </p>
                            <div style={{ textAlign: winWidth < 600 ? 'center' : 'right' }}>
                                <span style={{ fontSize: '10px', fontWeight: '800', color: '#3163aa' }}>navabharathtechnologies.com</span>
                                <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
                                <span style={{ fontSize: '10px', fontWeight: '950', color: '#0f172a' }}>0821-3128831</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Add Payslip Modal */}
            {showAddForm && (
                <div style={modalOverlayStyle}>
                    <div style={{ ...modalContentStyle, maxWidth: winWidth < 768 ? '100%' : '1100px', padding: winWidth < 768 ? '24px' : '40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                            <h2 style={{ margin: 0, fontSize: winWidth < 768 ? '18px' : '20px', fontWeight: '900', color: '#0f172a' }}>Add New Payslip</h2>
                            <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
                        </div>
                        
                        <form onSubmit={handleAddPayslip}>
                            <div style={{ ...formGridStyle, gridTemplateColumns: winWidth < 768 ? '1fr' : (winWidth < 1024 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)') }}>
                                <div style={{ gridColumn: winWidth < 768 ? 'auto' : 'span 3', marginBottom: '8px' }}>
                                    <h3 style={sectionHeaderStyle}><User size={16} /> Personnel Details</h3>
                                </div>
                                <FormSelect label="Employee ID" name="employee_id" icon={<Fingerprint size={16} />} value={formData.employee_id} onChange={handleUserSelect} options={usersList.map(u => ({ value: u.employee_id || u.id, label: u.employee_id || u.id }))} />
                                <FormSelect label="Employee Name" name="emp_name" icon={<User size={16} />} value={formData.employee_id} onChange={handleUserSelect} options={usersList.map(u => ({ value: u.employee_id || u.id, label: u.name }))} />
                                <FormField label="Department" name="department" icon={<Building2 size={16} />} value={formData.department} onChange={handleInputChange} />
                                <FormSelect label="Designation" name="designation" icon={<Briefcase size={16} />} value={formData.designation} onChange={handleInputChange} options={Array.from(new Set(usersList.map(u => u.role || u.designation))).filter(Boolean).map(role => ({ value: role, label: role }))} />
                                <FormField label="Month" name="month" type="number" icon={<Calendar size={16} />} value={formData.month} onChange={handleInputChange} />
                                <FormField label="Year" name="year" type="number" icon={<Clock size={16} />} value={formData.year} onChange={handleInputChange} />
                                
                                <FormField label="Basic Salary" name="basic_salary" type="number" value={formData.basic_salary} onChange={handleInputChange} />
                                <FormField label="HRA" name="hra" type="number" value={formData.hra} onChange={handleInputChange} />
                                <FormField label="Conveyance" name="conveyance" type="number" value={formData.conveyance} onChange={handleInputChange} />
                                <FormField label="Special Allowance" name="special_allowance" type="number" value={formData.special_allowance} onChange={handleInputChange} />
                                <FormField label="Total Earnings" name="total_earnings" type="number" value={formData.total_earnings} readOnly />
                                <div></div>

                                <div style={{ gridColumn: winWidth < 768 ? 'auto' : 'span 3', margin: '24px 0 8px' }}>
                                    <h3 style={sectionHeaderStyle}><Share2 size={16} /> Incentives</h3>
                                </div>
                                <FormField label="Performance" name="performance_incentive" type="number" value={formData.performance_incentive} onChange={handleInputChange} />
                                <FormField label="Yearly Incentive" name="yearly_incentive" type="number" value={formData.yearly_incentive} onChange={handleInputChange} />
                                <FormField label="Total Incentives" name="total_incentives" type="number" value={formData.total_incentives} readOnly />

                                <div style={{ gridColumn: winWidth < 768 ? 'auto' : 'span 3', margin: '24px 0 8px' }}>
                                    <h3 style={sectionHeaderStyle}><Shield size={16} /> Deductions</h3>
                                </div>
                                <FormField label="PF" name="pf_deduction" type="number" value={formData.pf_deduction} onChange={handleInputChange} />
                                <FormField label="ESI" name="esi_deduction" type="number" value={formData.esi_deduction} onChange={handleInputChange} />
                                <FormField label="PT" name="pt_deduction" type="number" value={formData.pt_deduction} onChange={handleInputChange} />
                                <FormField label="LWF" name="lwf_deduction" type="number" value={formData.lwf_deduction} onChange={handleInputChange} />
                                <FormField label="Income Tax" name="income_tax" type="number" value={formData.income_tax} onChange={handleInputChange} />
                                <FormField label="Total Deductions" name="total_deductions" type="number" value={formData.total_deductions} readOnly />
                                
                                <div style={{ gridColumn: winWidth < 768 ? 'auto' : 'span 3', margin: '24px 0 8px' }}>
                                    <h3 style={{...sectionHeaderStyle, color: '#16a34a', background: 'rgba(22, 163, 74, 0.05)' }}> Final Net Payable</h3>
                                </div>
                                <FormField label="Net Payable Amount" name="net_payable" type="number" value={formData.net_payable} readOnly />
                                <div></div>
                                <div></div>
                                <div></div> {/* Spacer */}

                                <div style={{ gridColumn: winWidth < 768 ? 'auto' : 'span 3', margin: '24px 0 8px' }}>
                                    <h3 style={sectionHeaderStyle}><Clock size={16} /> Attendance & Leave Details</h3>
                                </div>
                                <FormField label="Total Present" name="total_present" type="number" value={formData.total_present} onChange={handleInputChange} />
                                <FormField label="Total Weekly Off" name="total_weekly_off" type="number" value={formData.total_weekly_off} onChange={handleInputChange} />
                                <FormField label="Total Holidays" name="total_holidays" type="number" value={formData.total_holidays} onChange={handleInputChange} />
                                
                                <FormField label="Total Leaves" name="total_leaves" type="number" value={formData.total_leaves} onChange={handleInputChange} />
                                <FormField label="Total Absent" name="total_absent" type="number" value={formData.total_absent} onChange={handleInputChange} />
                                <FormField label="Total Work OT" name="total_work_ot" value={formData.total_work_ot} onChange={handleInputChange} />
                                
                                <FormField label="Total OT Hours" name="total_ot_hours" type="number" value={formData.total_ot_hours} onChange={handleInputChange} />
                                <FormField label="Available Leaves" name="available_leaves" type="number" value={formData.available_leaves} onChange={handleInputChange} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: winWidth < 480 ? 'column' : 'row', gap: '12px', marginTop: '32px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                                <button type="button" onClick={() => setShowAddForm(false)} style={{ ...cancelButtonStyle, width: winWidth < 480 ? '100%' : 'auto' }}>Cancel</button>
                                <button type="submit" style={{ ...submitButtonStyle, width: winWidth < 480 ? '100%' : 'auto' }}>Save Entry</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="no-print">
                <AppFooter />
            </div>

            <style>{`
                @keyframes dropdown-fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes modal-pop { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                @media print {
                    body * { visibility: hidden; }
                    #payslip-document, #payslip-document * { visibility: visible; }
                    #payslip-document { position: absolute; left: 0; top: 0; width: 100% !important; margin: 0 !important; padding: 0 !important; border: none !important; box-shadow: none !important; }
                    #payslip-document { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                }
            `}</style>
        </div>
    );
}

const FormSelect = ({ label, name, value, onChange, options, icon }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginLeft: '4px' }}>{label}</label>
        <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', zIndex: 1 }}>{icon}</div>
            <select name={name} value={value} onChange={onChange} style={{...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                <option value="">Select {label}</option>
                {options.map((opt, i) => (
                    <option key={i} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}><ChevronDown size={14} /></div>
        </div>
    </div>
);

const FormField = ({ label, name, value, onChange, type = "text", icon }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginLeft: '4px' }}>{label}</label>
        <div style={{ position: 'relative' }}>
            {icon && <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>{icon}</div>}
            <input type={type} name={name} value={value} onChange={onChange} autoComplete="off" style={{ ...inputStyle, paddingLeft: icon ? '40px' : '14px' }} />
        </div>
    </div>
);

const inputStyle = {
    width: '100%',
    padding: '12px 14px 12px 40px', 
    borderRadius: '14px', 
    border: '1.5px solid #e2e8f0', 
    fontSize: '14px',
    fontWeight: '700',
    color: '#0f172a',
    background: '#f8fafc',
    outline: 'none',
    transition: 'all 0.3s ease',
};

const sectionHeaderStyle = {
    fontSize: '14px',
    fontWeight: '900',
    color: '#1e40af',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    background: 'rgba(30, 64, 175, 0.05)',
    padding: '8px 16px',
    borderRadius: '8px',
    margin: 0
};

const formGridStyle = {
    display: 'grid', 
    gridTemplateColumns: 'repeat(3, 1fr)', 
    gap: '20px 24px', 
    maxHeight: '65vh', 
    overflowY: 'auto', 
    paddingRight: '12px',
    paddingBottom: '20px'
};

const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
};

const modalContentStyle = {
    background: 'white',
    width: '100%',
    maxWidth: '1100px',
    borderRadius: '32px',
    padding: '40px',
    boxShadow: '0 40px 100px -20px rgba(15, 23, 42, 0.3)',
    animation: 'modal-pop 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    position: 'relative',
    overflow: 'hidden'
};

const submitButtonStyle = {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: 'white',
    border: 'none',
    padding: '14px 40px',
    borderRadius: '14px',
    fontWeight: '900',
    cursor: 'pointer',
    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
    transition: '0.3s'
};

const cancelButtonStyle = {
    background: 'white',
    color: '#64748b',
    border: '1.5px solid #e2e8f0',
    padding: '14px 40px',
    borderRadius: '14px',
    fontWeight: '800',
    cursor: 'pointer',
    transition: '0.3s'
};

const dropdownItemStyle = {
    width: '100%',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'none',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#0f172a',
    cursor: 'pointer',
    textAlign: 'left',
    transition: '0.2s'
};
;
