import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Share2, Mail, FileText, Landmark, Clock, User, Briefcase, Building2, MapPin, ChevronDown, FileSpreadsheet, Fingerprint, Calendar, Shield, Heart, X, Check, Edit, Trash2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, BASE_URL } from '../../config';
import logo from '../../assets/logo.png';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

export default function PaySlipScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [showExportOptions, setShowExportOptions] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [payslipsList, setPayslipsList] = useState([]);
    const [isLoadingPayslips, setIsLoadingPayslips] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingPayslipId, setEditingPayslipId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [payslipToDelete, setPayslipToDelete] = useState(null);
    const [activePayslipForDownload, setActivePayslipForDownload] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [usersList, setUsersList] = useState([]);
    const [previewData, setPreviewData] = useState(null);
    const [formData, setFormData] = useState({
        employee_id: '', month: '', year: '', emp_name: '', department: '', designation: '',
        total_present: '', total_weekly_off: '', total_holidays: '', total_leaves: '',
        total_absent: '', total_work_ot: '', total_ot_hours: '',
        basic_salary: '', hra: '', conveyance: '', special_allowance: '',
        performance_incentive: '', yearly_incentive: '',
        pf_deduction: '', esi_deduction: '', pt_deduction: '', lwf_deduction: '', income_tax: '', lop_deduction: '',
        total_earnings: '', total_incentives: '', total_deductions: '', net_payable: '', available_leaves: '',
        lop: ''
    });
    const dropdownRef = useRef(null);
    const filterDropdownRef = useRef(null);
    const [showFilterOptions, setShowFilterOptions] = useState(false);
    const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('');
    const [selectedMonthFilter, setSelectedMonthFilter] = useState('');
    const [filterData, setFilterData] = useState({
        employee_id: '',
        month: '',
        year: '',
        basic_salary: ''
    });
    const [isFilterLoading, setIsFilterLoading] = useState(false);
    const [isFormFetching, setIsFormFetching] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedEmployeeFilter, selectedMonthFilter, payslipsList]);

    const monthsList = [
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' }
    ];

    const yearsList = ['2025', '2026', '2027', '2028', '2029', '2030'];

    const originalPayslip = isEditMode ? payslipsList.find(p => (p._id || p.id) === editingPayslipId) : null;
    const initialMonth = originalPayslip ? String(originalPayslip.month) : null;
    const initialYear = originalPayslip ? String(originalPayslip.year) : null;

    const isMonthDisabled = (monthValue, selectedYear) => {
        if (originalPayslip && String(monthValue) === String(initialMonth) && String(selectedYear) === String(initialYear)) {
            return false;
        }

        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();

        const mVal = parseInt(monthValue, 10);
        const yVal = selectedYear ? parseInt(selectedYear, 10) : currentYear;

        // Check if upcoming/future (only future months/years are disabled)
        if (yVal > currentYear) return true;
        if (yVal === currentYear && mVal > currentMonth) return true;

        return false;
    };

    const isYearDisabled = (yearValue) => {
        if (originalPayslip && String(yearValue) === String(initialYear)) {
            return false;
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const yVal = parseInt(yearValue, 10);

        // Only future years are disabled
        if (yVal > currentYear) return true;
        return false;
    };

    const formatCurrency = (val) => {
        if (val === undefined || val === null || val === '') return '0';
        const num = parseFloat(val);
        if (isNaN(num)) return val;
        return num.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0
        });
    };

    const getMonthName = (monthStr) => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const idx = parseInt(monthStr, 10);
        if (!isNaN(idx) && idx >= 1 && idx <= 12) {
            return months[idx - 1];
        }
        return monthStr || '';
    };

    const normalizePayslipData = (item) => {
        if (!item) return null;
        return {
            employee_id: String(item.employee_id || item.id || ''),
            month: String(item.month || ''),
            year: String(item.year || ''),
            emp_name: String(item.emp_name || item.employee_name || item.name || ''),
            department: String(item.department || ''),
            designation: String(item.designation || item.role || ''),
            total_present: String(item.total_present || item.totalPresent || item.present || '0'),
            total_weekly_off: String(item.total_weekly_off || item.totalWeeklyOff || '0'),
            total_holidays: String(item.total_holidays || item.totalHolidays || '0'),
            total_leaves: String(item.total_leaves || item.totalLeaves || '0'),
            total_absent: String(item.total_absent || item.totalAbsent || item.absent || '0'),
            total_work_ot: String(item.total_work_ot || item.totalWorkOt || '0'),
            total_ot_hours: String(item.total_ot_hours || item.totalOtHours || '0'),
            basic_salary: String(item.basic_salary || item.basicSalary || item.basic || '0'),
            hra: String(item.hra || '0'),
            conveyance: String(item.conveyance || '0'),
            special_allowance: String(item.special_allowance || item.specialAllowance || '0'),
            performance_incentive: String(item.performance_incentive || item.performanceIncentive || '0'),
            yearly_incentive: String(item.yearly_incentive || item.yearlyIncentive || '0'),
            pf_deduction: String(item.pf_deduction || item.pfDeduction || '0'),
            esi_deduction: String(item.esi_deduction || item.esiDeduction || '0'),
            pt_deduction: String(item.pt_deduction || item.ptDeduction || '0'),
            lwf_deduction: String(item.lwf_deduction || item.lwfDeduction || '0'),
            income_tax: String(item.income_tax || item.incomeTax || '0'),
            lop_deduction: String(item.lop_deduction || item.lopDeduction || '0'),
            total_earnings: String(item.total_earnings || item.totalEarnings || '0'),
            total_incentives: String(item.total_incentives || item.totalIncentives || '0'),
            total_deductions: String(item.total_deductions || item.totalDeductions || item.deductions || '0'),
            net_payable: String(item.net_payable || item.netPayable || '0'),
            available_leaves: String(item.available_leaves || item.availableLeaves || '0'),
            lop: String(item.lop || item.LOP || item.total_absent || '0')
        };
    };

    const renderPayslipTemplate = (data, elementId) => {
        if (!data) return null;
        return (
            <div id={elementId} style={{ background: 'white', padding: '25px 40px', position: 'relative', overflow: 'hidden', border: '1px solid #e2e8f0', width: '850px', boxSizing: 'border-box' }}>
                {/* Decorative Corners */}
                <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'linear-gradient(225deg, #3b82f6 50%, transparent 50%)' }}></div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '120px', height: '120px', background: 'linear-gradient(45deg, #3b82f6 50%, transparent 50%)' }}></div>

                {/* Company Branding */}
                <div style={{ textAlign: 'center', marginBottom: '30px', position: 'relative', zIndex: 2 }}>
                    <img src={logo} alt="Company Logo" style={{ width: '120px', marginBottom: '15px' }} />
                    <h1 style={{ fontSize: '28px', fontWeight: '950', color: '#0f172a', margin: '0 0 5px 0', letterSpacing: '-1px' }}>NAVABHARATH TECHNOLOGIES</h1>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Smarter Solutions for Better Future</p>
                    <div style={{ width: '100%', height: '1.5px', background: '#f1f5f9', margin: '20px 0' }}></div>
                    <h2 style={{ fontSize: '15px', fontWeight: '950', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1.5px solid #e2e8f0', display: 'inline-block', paddingBottom: '10px', marginBottom: '10px' }}>
                        PAY SLIP FOR THE MONTH OF {getMonthName(data.month).toUpperCase()} - {data.year || ''}
                    </h2>
                </div>

                {/* Employee Details Grid */}
                <div style={{ border: '1.5px solid #e2e8f0', marginBottom: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1.5px solid #e2e8f0' }}>
                        <div style={{ padding: '12px 15px', borderRight: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', fontWeight: '950', color: '#475569' }}>EMPCODE</span>
                            <span style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a' }}>{data.employee_id || ''}</span>
                        </div>
                        <div style={{ padding: '12px 15px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', fontWeight: '950', color: '#475569' }}>DEPARTMENT</span>
                            <span style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a' }}>{data.department || ''}</span>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                        <div style={{ padding: '12px 15px', borderRight: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', fontWeight: '950', color: '#475569' }}>EMP. NAME</span>
                            <span style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a' }}>{data.emp_name || data.employee_name || data.name || ''}</span>
                        </div>
                        <div style={{ padding: '12px 15px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', fontWeight: '950', color: '#475569' }}>DESIGNATION</span>
                            <span style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a' }}>{data.designation || ''}</span>
                        </div>
                    </div>
                </div>

                {/* Attendance Statistics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', border: '1.5px solid #e2e8f0', marginBottom: '20px', fontSize: '9px' }}>
                    {[
                        { l: 'TOT. PRE:', v: data.total_present || '0' },
                        { l: 'TOT. WO:-', v: data.total_weekly_off || '0' },
                        { l: 'TOT. HL:-', v: data.total_holidays || '0' },
                        { l: 'TOT. LEAVE:-', v: data.total_leaves || '0' },
                        { l: 'TOTAL ABSENT', v: data.total_absent || '0' },
                        { l: 'TOTAL WORK+OT', v: data.total_work_ot || '0' },
                        { l: 'TOTAL OT', v: (data.total_ot_hours === '0' || !data.total_ot_hours) ? '0:00' : data.total_ot_hours },
                        { l: 'AVAILABLE LEAVE', v: data.available_leaves || '0' },
                        { l: 'LOP COUNT', v: data.lop || '0' },
                        { l: 'BS/REF AMT.', v: formatCurrency(data.basic_salary) }
                    ].map((item, i) => {
                        const isRightMost = (i + 1) % 5 === 0;
                        const isBottomRow = i >= 5;
                        return (
                            <div key={i} style={{
                                padding: '10px 12px',
                                borderRight: isRightMost ? 'none' : '1.5px solid #e2e8f0',
                                borderBottom: isBottomRow ? 'none' : '1.5px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontWeight: '900', color: '#475569', fontSize: '8px' }}>{item.l}</span>
                                <span style={{ fontWeight: '950', color: '#0f172a' }}>{item.v}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Earnings & Deductions Tables */}
                <div style={{ display: 'flex', flexDirection: 'row', border: '1px solid #e2e8f0', fontSize: '10px' }}>
                    {/* Earnings Column */}
                    <div style={{ flex: 1, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '950' }}>EARNING</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {[
                                { l: 'Basic', v: data.basic_salary },
                                { l: 'HRA', v: data.hra },
                                { l: 'Conveyance', v: data.conveyance },
                                { l: 'Special Allowance', v: data.special_allowance }
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                                    <span>{item.l}</span>
                                    <span style={{ fontWeight: '800' }}>{formatCurrency(item.v)}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderTop: '2px solid #e2e8f0', fontWeight: '950', background: '#f8fafc' }}>
                                <span>Total Earning</span>
                                <span>{formatCurrency(data.total_earnings)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderTop: '1px solid transparent', visibility: 'hidden', fontWeight: '950' }}>
                                <span>Net Payable</span>
                                <span style={{ fontSize: '13px' }}>₹ 0</span>
                            </div>
                        </div>
                    </div>

                    {/* Incentives Column */}
                    <div style={{ flex: 1, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '950' }}>INCENTIVES</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {[
                                { l: 'Performance', v: data.performance_incentive },
                                { l: 'Yearly Incentive', v: data.yearly_incentive }
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                                    <span>{item.l}</span>
                                    <span style={{ fontWeight: '800' }}>{formatCurrency(item.v)}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderTop: '2px solid #e2e8f0', fontWeight: '950', background: '#f8fafc' }}>
                                <span>Total Incent.</span>
                                <span>{formatCurrency(data.total_incentives)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderTop: '1px solid transparent', visibility: 'hidden', fontWeight: '950' }}>
                                <span>Net Payable</span>
                                <span style={{ fontSize: '13px' }}>₹ 0</span>
                            </div>
                        </div>
                    </div>

                    {/* Deductions Column */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '950' }}>DEDUCTION</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {[
                                { l: 'PF', v: data.pf_deduction },
                                { l: 'ESI', v: data.esi_deduction },
                                { l: 'PT', v: data.pt_deduction },
                                { l: 'LWF', v: data.lwf_deduction },
                                { l: 'Income Tax', v: data.income_tax },
                                { l: 'LOP Deduction', v: data.lop_deduction }
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                                    <span>{item.l}</span>
                                    <span style={{ fontWeight: '800' }}>{formatCurrency(item.v)}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderTop: '2px solid #e2e8f0', fontWeight: '950', background: '#f8fafc' }}>
                                <span>Total Deduct.</span>
                                <span>{formatCurrency(data.total_deductions)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderTop: '1px solid #e2e8f0', fontWeight: '950' }}>
                                <span>Net Payable</span>
                                <span style={{ color: '#16a34a', fontWeight: '950', fontSize: '13px' }}>₹ {formatCurrency(data.net_payable)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: '40px', position: 'relative', zIndex: 10 }}>
                    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', fontWeight: '600' }}>
                            This is a computer generated payslip and does not require a physical signature.
                        </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '10px' }}>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: '1.3' }}>
                            <span style={{ fontSize: '12px', fontWeight: '850', color: '#0f3a78' }}>Phone: 0821-3128831</span>
                            <span style={{ fontSize: '12px', fontWeight: '850', color: '#0f3a78' }}>www.navabharathtechnologies.com</span>
                            <span style={{ fontSize: '12px', fontWeight: '850', color: '#0f3a78' }}>contact@navabharathtechnologies.com</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const mapApiDataToPayslip = (data, employeeId, month, year) => {
        const basic = parseFloat(data.basic_salary || data.basic || data.basicSalary) || 0;
        const hra = parseFloat(data.hra) || 0;
        const conveyance = parseFloat(data.conveyance) || 0;
        const special_allowance = parseFloat(data.special_allowance || data.specialAllowance) || 0;

        const performance_incentive = parseFloat(data.performance_incentive || data.performanceIncentive || data.performance) || 0;
        const yearly_incentive = parseFloat(data.yearly_incentive || data.yearlyIncentive || data.yearly) || 0;

        const pf_deduction = parseFloat(data.pf_deduction || data.pf || data.pfDeduction) || 0;
        const esi_deduction = parseFloat(data.esi_deduction || data.esi || data.esiDeduction) || 0;
        const pt_deduction = parseFloat(data.pt_deduction || data.pt || data.ptDeduction) || 0;
        const lwf_deduction = parseFloat(data.lwf_deduction || data.lwf || data.lwfDeduction) || 0;
        const income_tax = parseFloat(data.income_tax || data.tax || data.incomeTax) || 0;

        const absentDays = parseFloat(data.lop || data.LOP || data.total_absent || data.absent || 0) || 0;
        const targetMonth = parseInt(month || data.month) || 4;
        const targetYear = parseInt(year || data.year) || 2026;

        const getDaysInMonth = (y, m) => new Date(y, m, 0).getDate();
        const totalDays = getDaysInMonth(targetYear, targetMonth);
        const perDaySalary = totalDays > 0 ? (basic / totalDays) : 0;
        const lop_deduction = Math.round(perDaySalary * absentDays);

        const getSundaysInMonth = (y, m) => {
            let sundays = 0;
            const daysInMonth = new Date(y, m, 0).getDate();
            for (let d = 1; d <= daysInMonth; d++) {
                const dt = new Date(y, m - 1, d);
                if (dt.getDay() === 0) sundays++;
            }
            return sundays;
        };
        const calculatedWeekoffs = getSundaysInMonth(targetYear, targetMonth);

        const earnings = basic + hra + conveyance + special_allowance;
        const incentives = performance_incentive + yearly_incentive;
        const deductions = pf_deduction + esi_deduction + pt_deduction + lwf_deduction + income_tax + lop_deduction;

        const serverNetPayable = data.net_payable !== undefined && data.net_payable !== null ? parseFloat(data.net_payable) :
            (data.netPayable !== undefined && data.netPayable !== null ? parseFloat(data.netPayable) : null);
        const net_payable = serverNetPayable !== null ? Math.round(serverNetPayable) : Math.max(0, Math.round(earnings + incentives - deductions));

        return {
            employee_id: employeeId || data.employee_id || data.id || '',
            month: month || data.month || '',
            year: year || data.year || '',
            emp_name: data.emp_name || data.name || data.employee_name || '',
            department: data.department || '',
            designation: data.designation || data.role || '',

            total_present: String(data.total_present || data.present || data.present_days || '0'),
            total_weekly_off: String(calculatedWeekoffs),
            total_holidays: String(data.total_holidays || data.holidays || data.public_holidays || '0'),
            total_leaves: String(data.total_leaves || data.leaves || data.casual_leaves || '0'),
            total_absent: String(absentDays),
            total_work_ot: String(data.total_work_ot || data.work_ot || data.work_overtime || '0'),
            total_ot_hours: String(data.total_ot_hours || data.ot_hours || data.overtime_hours || '0'),
            available_leaves: String(data.available_leaves || data.availableLeaves || data.leave_balance || data.balance || '0'),
            lop: String(absentDays),

            basic_salary: String(basic),
            hra: String(hra),
            conveyance: String(conveyance),
            special_allowance: String(special_allowance),

            performance_incentive: String(performance_incentive),
            yearly_incentive: String(yearly_incentive),

            pf_deduction: String(pf_deduction),
            esi_deduction: String(esi_deduction),
            pt_deduction: String(pt_deduction),
            lwf_deduction: String(lwf_deduction),
            income_tax: String(income_tax),
            lop_deduction: String(lop_deduction),

            total_earnings: String(earnings),
            total_incentives: String(incentives),
            total_deductions: String(deductions),
            net_payable: String(net_payable)
        };
    };

    useEffect(() => {
        const fetchFormSummary = async () => {
            if (isEditMode || !showAddForm || !formData.employee_id || !formData.month || !formData.year) return;
            try {
                setIsFormFetching(true);

                // 1. Fetch main summary details
                const url = API_ENDPOINTS.PAY_SLIPS_CALCULATE_SUMMARY(formData.employee_id, formData.month, formData.year);
                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });

                let mapped = {};
                if (res.ok) {
                    const data = await res.json();
                    mapped = mapApiDataToPayslip(data, formData.employee_id, formData.month, formData.year);
                }

                // 2. Fetch LOP stats from all possible leave stats endpoints for exact month & year match
                let lopVal = '0';
                const endpointsToTry = [
                    `${BASE_URL}/api/leave_stats?month=${formData.month}&year=${formData.year}`,
                    `${BASE_URL}/api/admin/leave_stats?month=${formData.month}&year=${formData.year}`,
                    `${BASE_URL}/api/leave-stats?month=${formData.month}&year=${formData.year}`,
                    `${API_ENDPOINTS.ADMIN_LEAVE_STATS}?month=${formData.month}&year=${formData.year}`
                ];

                for (const ep of endpointsToTry) {
                    try {
                        const statsRes = await fetch(ep, {
                            headers: { 'Authorization': `Bearer ${user?.token}` }
                        });
                        if (statsRes.ok) {
                            const statsData = await statsRes.json();
                            const statsList = Array.isArray(statsData) ? statsData : (statsData.stats || statsData.data || []);
                            const userStat = statsList.find(s => String(s.employee_id || s.user_id) === String(formData.employee_id));
                            if (userStat) {
                                lopVal = String(userStat.LOP !== undefined ? userStat.LOP : (userStat.lop !== undefined ? userStat.lop : '0'));
                                break;
                            }
                        }
                    } catch (e) {
                        console.error("Error trying endpoint:", ep, e);
                    }
                }

                // Recalculate dynamic high-precision LOP and Net Payable values for pre-fill
                const basicSalaryNum = parseFloat(mapped.basic_salary) || parseFloat(formData.basic_salary) || 0;
                const absentDaysNum = parseFloat(lopVal) || 0;

                const targetMonth = parseInt(formData.month) || 4;
                const targetYear = parseInt(formData.year) || 2026;
                const totalDays = new Date(targetYear, targetMonth, 0).getDate();
                const perDaySalary = totalDays > 0 ? (basicSalaryNum / totalDays) : 0;
                const calculatedLopDeduction = Math.round(perDaySalary * absentDaysNum);

                const earningsNum = basicSalaryNum + (parseFloat(mapped.hra) || 0) + (parseFloat(mapped.conveyance) || 0) + (parseFloat(mapped.special_allowance) || 0);
                const incentivesNum = (parseFloat(mapped.performance_incentive) || 0) + (parseFloat(mapped.yearly_incentive) || 0);
                const deductionsNum = (parseFloat(mapped.pf_deduction) || 0) + (parseFloat(mapped.esi_deduction) || 0) + (parseFloat(mapped.pt_deduction) || 0) + (parseFloat(mapped.lwf_deduction) || 0) + (parseFloat(mapped.income_tax) || 0) + calculatedLopDeduction;
                const calculatedNetPayable = Math.max(0, Math.round(earningsNum + incentivesNum - deductionsNum));

                setFormData(prev => ({
                    ...prev,
                    ...mapped,
                    emp_name: prev.emp_name !== '' ? prev.emp_name : mapped.emp_name,
                    department: prev.department, // Do not auto-populate department from summary
                    designation: prev.designation !== '' ? prev.designation : mapped.designation,
                    lop: lopVal,
                    total_absent: lopVal, // LOP days count is sent in total_absent parameter
                    lop_deduction: String(calculatedLopDeduction),
                    net_payable: String(calculatedNetPayable),
                    total_deductions: String(deductionsNum)
                }));
            } catch (err) {
                console.error("Error fetching summary for form:", err);
            } finally {
                setIsFormFetching(false);
            }
        };
        fetchFormSummary();
    }, [formData.employee_id, formData.month, formData.year, showAddForm, user, isEditMode]);

    const [winWidth, setWinWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWinWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch all payslips from backend
    const fetchPayslips = async () => {
        try {
            setIsLoadingPayslips(true);
            const res = await fetch(`${BASE_URL}/api/admin/payslips`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                console.log('Payslips API raw response:', data);
                const list = Array.isArray(data) ? data : (data.payslips || data.data || data.result || data.results || data.records || []);
                console.log('Parsed payslips list:', list.length, 'items');
                
                // Sort payslips month-wise (Year and Month descending)
                const sortedList = [...list].sort((a, b) => {
                    const monthMap = {
                        'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
                        'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12,
                        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
                        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
                    };

                    const getMonthVal = (m) => {
                        if (!m) return 0;
                        const clean = String(m).trim().toLowerCase();
                        if (monthMap[clean] !== undefined) return monthMap[clean];
                        const parsed = parseInt(clean, 10);
                        return isNaN(parsed) ? 0 : parsed;
                    };

                    const getYearVal = (y) => {
                        if (!y) return 0;
                        const parsed = parseInt(String(y).trim(), 10);
                        return isNaN(parsed) ? 0 : parsed;
                    };

                    const yearA = getYearVal(a.year || a.Year);
                    const yearB = getYearVal(b.year || b.Year);

                    if (yearB !== yearA) {
                        return yearB - yearA; // Year descending
                    }

                    const monthA = getMonthVal(a.month || a.Month);
                    const monthB = getMonthVal(b.month || b.Month);

                    if (monthB !== monthA) {
                        return monthB - monthA; // Month descending
                    }

                    // Tie breakers: employee name, then ID
                    const nameA = String(a.emp_name || a.employee_name || a.name || '').trim();
                    const nameB = String(b.emp_name || b.employee_name || b.name || '').trim();
                    if (nameA !== nameB) {
                        return nameA.localeCompare(nameB);
                    }

                    const idA = String(a.employee_id || a.id || '').trim();
                    const idB = String(b.employee_id || b.id || '').trim();
                    return idA.localeCompare(idB);
                });

                setPayslipsList(sortedList);
            } else {
                console.error('Failed to fetch payslips list, status:', res.status);
            }
        } catch (err) {
            console.error('Error fetching payslips list:', err);
        } finally {
            setIsLoadingPayslips(false);
        }
    };

    useEffect(() => {
        if (user?.token) {
            fetchPayslips();
        }
    }, [user]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch(API_ENDPOINTS.USERS, {
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const sorted = [...data].sort((a, b) => {
                        const idA = parseInt(String(a.employee_id || a.id || '').replace(/[^\d]/g, ''), 10) || 0;
                        const idB = parseInt(String(b.employee_id || b.id || '').replace(/[^\d]/g, ''), 10) || 0;
                        if (idA !== idB) return idA - idB;
                        return String(a.employee_id || a.id || '').localeCompare(String(b.employee_id || b.id || ''));
                    });
                    setUsersList(sorted);
                }
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
                // department: selectedUser.department || '', // Manual entry requested
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
                'pf_deduction', 'esi_deduction', 'pt_deduction', 'lwf_deduction', 'income_tax', 'lop_deduction',
                'lop', 'total_absent', 'month', 'year'
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

                // Dynamically compute LOP deduction on input change to ensure real-time precision rounding
                const targetMonth = parseInt(updated.month) || 4;
                const targetYear = parseInt(updated.year) || 2026;
                const totalDays = new Date(targetYear, targetMonth, 0).getDate();
                const absentDays = parseFloat(updated.lop) || parseFloat(updated.total_absent) || 0;
                const perDaySalary = totalDays > 0 ? (basic / totalDays) : 0;
                const calculatedLop = Math.round(perDaySalary * absentDays);

                const earnings = basic + hra + conv + spec;
                const incentives = perf + yearly;
                const deductions = pf + esi + pt + lwf + itax + calculatedLop;

                updated.lop_deduction = calculatedLop.toString();
                updated.total_earnings = earnings.toString();
                updated.total_incentives = incentives.toString();
                updated.total_deductions = deductions.toString();

                // Dynamic formula matching payslip image perfectly
                updated.net_payable = Math.max(0, Math.round(earnings + incentives - deductions)).toString();
            }

            return updated;
        });
    };

    const handleCloseModal = () => {
        setShowAddForm(false);
        setIsEditMode(false);
        setEditingPayslipId(null);
        setFormData({
            employee_id: '', month: '', year: '', emp_name: '', department: '', designation: '',
            total_present: '', total_weekly_off: '', total_holidays: '', total_leaves: '',
            total_absent: '', total_work_ot: '', total_ot_hours: '',
            basic_salary: '', hra: '', conveyance: '', special_allowance: '',
            performance_incentive: '', yearly_incentive: '',
            pf_deduction: '', esi_deduction: '', pt_deduction: '', lwf_deduction: '', income_tax: '', lop_deduction: '',
            total_earnings: '', total_incentives: '', total_deductions: '', net_payable: '', available_leaves: '',
            lop: ''
        });
    };

    const handleConfirmOK = () => {
        setPreviewData({ ...formData }); // Update the document view immediately
        handleCloseModal();
        setShowSuccessPopup(false);
        fetchPayslips(); // Refresh the payslips list
    };

    const handleConfirmCancel = () => {
        setShowSuccessPopup(false); // Stay on the same screen, no reset or redirection
    };

    const deletePayslipById = async (id) => {
        try {
            let response = await fetch(`${BASE_URL}/api/admin/pay-slips/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (!response.ok) {
                response = await fetch(`${BASE_URL}/api/admin/payslips/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
            }
            if (!response.ok) {
                response = await fetch(`${BASE_URL}/api/payslips/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
            }
            return response.ok;
        } catch (err) {
            console.error(`Failed to delete payslip ${id}:`, err);
            return false;
        }
    };

    const handleAddPayslip = async (e) => {
        e.preventDefault();
        if (isMonthDisabled(formData.month, formData.year) || isYearDisabled(formData.year)) {
            alert('The selected Month or Year is not selectable. Only the previous month and present month/year are allowed.');
            return;
        }
        try {
            const idsToDelete = [];

            // 1. If we are editing, we do NOT delete the current payslip (it will be updated via PUT).
            // We only need to check for other duplicate records.

            // 2. Check if there are any existing payslips in payslipsList 
            // that match the target employee_id, month, and year of the saved data.
            // We must delete them to avoid duplicates, except for the one we are editing.
            const targetEmpId = String(formData.employee_id || '').trim();
            const targetMonth = String(formData.month || '').trim();
            const targetYear = String(formData.year || '').trim();

            payslipsList.forEach(item => {
                const itemEmpId = String(item.employee_id || item.id || '').trim();
                const itemMonth = String(item.month || '').trim();
                const itemYear = String(item.year || '').trim();
                
                if (itemEmpId === targetEmpId && itemMonth === targetMonth && itemYear === targetYear) {
                    const itemId = item._id || item.id;
                    // If we are editing, exclude the currently editing payslip from deletion
                    if (isEditMode && editingPayslipId && String(itemId) === String(editingPayslipId)) {
                        return;
                    }
                    if (itemId && !idsToDelete.includes(itemId)) {
                        idsToDelete.push(itemId);
                    }
                }
            });

            let response;
            if (isEditMode && editingPayslipId) {
                const payload = {
                    ...formData,
                    _id: editingPayslipId,
                    id: editingPayslipId
                };
                // Try PUT /api/admin/pay-slips/:id (primary)
                response = await fetch(`${BASE_URL}/api/admin/pay-slips/${editingPayslipId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user?.token}`
                    },
                    body: JSON.stringify(payload)
                });
                // Alias: PUT /api/admin/payslips/:id
                if (!response.ok) {
                    response = await fetch(`${BASE_URL}/api/admin/payslips/${editingPayslipId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${user?.token}`
                        },
                        body: JSON.stringify(payload)
                    });
                }
                // Alias: PUT /api/payslips/:id (direct client compatibility)
                if (!response.ok) {
                    response = await fetch(`${BASE_URL}/api/payslips/${editingPayslipId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${user?.token}`
                        },
                        body: JSON.stringify(payload)
                    });
                }
            } else {
                response = await fetch(API_ENDPOINTS.PAY_SLIP_POST, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user?.token}`
                    },
                    body: JSON.stringify(formData)
                });
            }

            if (response.ok) {
                // Delete old/duplicate payslips
                if (idsToDelete.length > 0) {
                    await Promise.all(idsToDelete.map(id => deletePayslipById(id)));
                }

                // Sync the manually updated department and designation back to the user's profile
                // This ensures it stores in the DB and shows as the new default going forward.
                try {
                    await fetch(API_ENDPOINTS.EMPLOYEE_PROFILE_UPDATE, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${user?.token}`
                        },
                        body: JSON.stringify({
                            employee_id: formData.employee_id,
                            id: formData.employee_id,
                            department: formData.department,
                            designation: formData.designation
                        })
                    });
                } catch (syncErr) {
                    console.error('Failed to sync employee profile:', syncErr);
                }

                setShowSuccessPopup(true);
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
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
                setShowFilterOptions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLoadData = async () => {
        if (!filterData.employee_id || !filterData.month || !filterData.year) {
            alert('Please select Employee, Month, and Year.');
            return;
        }
        try {
            setIsFilterLoading(true);

            // 1. Fetch main summary details
            const url = API_ENDPOINTS.PAY_SLIPS_CALCULATE_SUMMARY(filterData.employee_id, filterData.month, filterData.year);
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });

            let mapped = {};
            if (res.ok) {
                const data = await res.json();
                mapped = mapApiDataToPayslip(data, filterData.employee_id, filterData.month, filterData.year);
            } else {
                const selectedUser = usersList.find(u => String(u.employee_id || u.id) === String(filterData.employee_id));
                mapped = {
                    employee_id: filterData.employee_id,
                    month: filterData.month,
                    year: filterData.year,
                    emp_name: selectedUser?.name || 'Employee',
                    department: selectedUser?.department || 'Staff',
                    designation: selectedUser?.role || selectedUser?.designation || '',
                    basic_salary: filterData.basic_salary || '0',
                    total_present: '0',
                    total_weekly_off: '0',
                    total_holidays: '0',
                    total_leaves: '0',
                    total_absent: '0',
                    total_work_ot: '0',
                    total_ot_hours: '0',
                    available_leaves: '0',
                    lop: '0',
                    pf_deduction: '0',
                    esi_deduction: '0',
                    pt_deduction: '0',
                    lwf_deduction: '0',
                    income_tax: '0',
                    lop_deduction: '0',
                    total_earnings: '0',
                    total_incentives: '0',
                    total_deductions: '0',
                    net_payable: '0'
                };
            }

            // 2. Fetch LOP stats from all possible leave stats endpoints for exact month & year match
            let lopVal = '0';
            const endpointsToTry = [
                `${BASE_URL}/api/leave_stats?month=${filterData.month}&year=${filterData.year}`,
                `${BASE_URL}/api/admin/leave_stats?month=${filterData.month}&year=${filterData.year}`,
                `${BASE_URL}/api/leave-stats?month=${filterData.month}&year=${filterData.year}`,
                `${API_ENDPOINTS.ADMIN_LEAVE_STATS}?month=${filterData.month}&year=${filterData.year}`
            ];

            for (const ep of endpointsToTry) {
                try {
                    const statsRes = await fetch(ep, {
                        headers: { 'Authorization': `Bearer ${user?.token}` }
                    });
                    if (statsRes.ok) {
                        const statsData = await statsRes.json();
                        const statsList = Array.isArray(statsData) ? statsData : (statsData.stats || statsData.data || []);
                        const userStat = statsList.find(s => String(s.employee_id || s.user_id) === String(filterData.employee_id));
                        if (userStat) {
                            lopVal = String(userStat.LOP !== undefined ? userStat.LOP : (userStat.lop !== undefined ? userStat.lop : '0'));
                            break;
                        }
                    }
                } catch (e) {
                    console.error("Error trying endpoint:", ep, e);
                }
            }

            const basicSalaryNum = parseFloat(filterData.basic_salary) || parseFloat(mapped.basic_salary) || 0;
            const absentDaysNum = parseFloat(lopVal) || parseFloat(mapped.total_absent) || 0;

            const targetMonth = parseInt(filterData.month) || 4;
            const targetYear = parseInt(filterData.year) || 2026;
            const totalDays = new Date(targetYear, targetMonth, 0).getDate();
            const perDaySalary = totalDays > 0 ? (basicSalaryNum / totalDays) : 0;
            const calculatedLopDeduction = Math.round(perDaySalary * absentDaysNum);

            const earningsNum = basicSalaryNum + (parseFloat(mapped.hra) || 0) + (parseFloat(mapped.conveyance) || 0) + (parseFloat(mapped.special_allowance) || 0);
            const incentivesNum = (parseFloat(mapped.performance_incentive) || 0) + (parseFloat(mapped.yearly_incentive) || 0);
            const deductionsNum = (parseFloat(mapped.pf_deduction) || 0) + (parseFloat(mapped.esi_deduction) || 0) + (parseFloat(mapped.pt_deduction) || 0) + (parseFloat(mapped.lwf_deduction) || 0) + (parseFloat(mapped.income_tax) || 0) + calculatedLopDeduction;
            const calculatedNetPayable = Math.max(0, Math.round(earningsNum + incentivesNum - deductionsNum));

            const finalPreview = {
                ...mapped,
                basic_salary: String(basicSalaryNum),
                lop: String(absentDaysNum),
                total_absent: String(absentDaysNum),
                lop_deduction: String(calculatedLopDeduction),
                net_payable: String(calculatedNetPayable),
                total_deductions: String(deductionsNum)
            };

            setPreviewData(finalPreview);

            setFormData(prev => ({
                ...prev,
                ...finalPreview
            }));

        } catch (err) {
            console.error("Error loading preview data:", err);
            alert("Failed to load employee details.");
        } finally {
            setIsFilterLoading(false);
        }
    };

    const handleModalLoadData = async () => {
        if (!formData.employee_id || !formData.month || !formData.year) {
            alert('Please select Employee, Month, and Year first.');
            return;
        }
        try {
            setIsFormFetching(true);

            // 1. Fetch main summary details
            const url = API_ENDPOINTS.PAY_SLIPS_CALCULATE_SUMMARY(formData.employee_id, formData.month, formData.year);
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });

            let mapped = {};
            if (res.ok) {
                const data = await res.json();
                mapped = mapApiDataToPayslip(data, formData.employee_id, formData.month, formData.year);
            }

            // 2. Fetch LOP stats from leave stats
            let lopVal = '0';
            const endpointsToTry = [
                `${BASE_URL}/api/leave_stats?month=${formData.month}&year=${formData.year}`,
                `${BASE_URL}/api/admin/leave_stats?month=${formData.month}&year=${formData.year}`,
                `${BASE_URL}/api/leave-stats?month=${formData.month}&year=${formData.year}`,
                `${API_ENDPOINTS.ADMIN_LEAVE_STATS}?month=${formData.month}&year=${formData.year}`
            ];

            for (const ep of endpointsToTry) {
                try {
                    const statsRes = await fetch(ep, {
                        headers: { 'Authorization': `Bearer ${user?.token}` }
                    });
                    if (statsRes.ok) {
                        const statsData = await statsRes.json();
                        const statsList = Array.isArray(statsData) ? statsData : (statsData.stats || statsData.data || []);
                        const userStat = statsList.find(s => String(s.employee_id || s.user_id) === String(formData.employee_id));
                        if (userStat) {
                            lopVal = String(userStat.LOP !== undefined ? userStat.LOP : (userStat.lop !== undefined ? userStat.lop : '0'));
                            break;
                        }
                    }
                } catch (e) {
                    console.error("Error trying endpoint:", ep, e);
                }
            }

            const basicSalaryNum = parseFloat(formData.basic_salary) || parseFloat(mapped.basic_salary) || 0;
            const absentDaysNum = parseFloat(lopVal) || parseFloat(mapped.total_absent) || 0;

            const targetMonth = parseInt(formData.month) || 4;
            const targetYear = parseInt(formData.year) || 2026;
            const totalDays = new Date(targetYear, targetMonth, 0).getDate();
            const perDaySalary = totalDays > 0 ? (basicSalaryNum / totalDays) : 0;
            const calculatedLopDeduction = Math.round(perDaySalary * absentDaysNum);

            const earningsNum = basicSalaryNum + (parseFloat(mapped.hra) || 0) + (parseFloat(mapped.conveyance) || 0) + (parseFloat(mapped.special_allowance) || 0);
            const incentivesNum = (parseFloat(mapped.performance_incentive) || 0) + (parseFloat(mapped.yearly_incentive) || 0);
            const deductionsNum = (parseFloat(mapped.pf_deduction) || 0) + (parseFloat(mapped.esi_deduction) || 0) + (parseFloat(mapped.pt_deduction) || 0) + (parseFloat(mapped.lwf_deduction) || 0) + (parseFloat(mapped.income_tax) || 0) + calculatedLopDeduction;
            const calculatedNetPayable = Math.max(0, Math.round(earningsNum + incentivesNum - deductionsNum));

            setFormData(prev => ({
                ...prev,
                ...mapped,
                emp_name: prev.emp_name !== '' ? prev.emp_name : mapped.emp_name,
                department: prev.department,
                designation: prev.designation !== '' ? prev.designation : mapped.designation,
                basic_salary: String(basicSalaryNum),
                lop: String(absentDaysNum),
                total_absent: String(absentDaysNum),
                lop_deduction: String(calculatedLopDeduction),
                net_payable: String(calculatedNetPayable),
                total_deductions: String(deductionsNum)
            }));

        } catch (err) {
            console.error("Error loading modal details:", err);
            alert("Failed to load details.");
        } finally {
            setIsFormFetching(false);
        }
    };

    const handlePrint = () => {
        setShowExportOptions(false);
        if (filteredPayslips.length === 0) {
            alert('No payslip records to print.');
            return;
        }
        window.print();
    };

    const handleAddClick = () => {
        setIsEditMode(false);
        setEditingPayslipId(null);
        setFormData({
            employee_id: '', month: '', year: '', emp_name: '', department: '', designation: '',
            total_present: '', total_weekly_off: '', total_holidays: '', total_leaves: '',
            total_absent: '', total_work_ot: '', total_ot_hours: '',
            basic_salary: '', hra: '', conveyance: '', special_allowance: '',
            performance_incentive: '', yearly_incentive: '',
            pf_deduction: '', esi_deduction: '', pt_deduction: '', lwf_deduction: '', income_tax: '', lop_deduction: '',
            total_earnings: '', total_incentives: '', total_deductions: '', net_payable: '', available_leaves: '',
            lop: ''
        });
        setShowAddForm(true);
    };

    const handleEditPayslip = (item) => {
        setIsEditMode(true);
        setEditingPayslipId(item._id || item.id);
        setFormData({
            employee_id: String(item.employee_id || item.id || ''),
            month: String(item.month || ''),
            year: String(item.year || ''),
            emp_name: String(item.emp_name || item.employee_name || item.name || ''),
            department: String(item.department || ''),
            designation: String(item.designation || item.role || ''),
            total_present: String(item.total_present || item.totalPresent || item.present || '0'),
            total_weekly_off: String(item.total_weekly_off || item.totalWeeklyOff || '0'),
            total_holidays: String(item.total_holidays || item.totalHolidays || '0'),
            total_leaves: String(item.total_leaves || item.totalLeaves || '0'),
            total_absent: String(item.total_absent || item.totalAbsent || item.absent || '0'),
            total_work_ot: String(item.total_work_ot || item.totalWorkOt || '0'),
            total_ot_hours: String(item.total_ot_hours || item.totalOtHours || '0'),
            basic_salary: String(item.basic_salary || item.basicSalary || item.basic || '0'),
            hra: String(item.hra || '0'),
            conveyance: String(item.conveyance || '0'),
            special_allowance: String(item.special_allowance || item.specialAllowance || '0'),
            performance_incentive: String(item.performance_incentive || item.performanceIncentive || '0'),
            yearly_incentive: String(item.yearly_incentive || item.yearlyIncentive || '0'),
            pf_deduction: String(item.pf_deduction || item.pfDeduction || '0'),
            esi_deduction: String(item.esi_deduction || item.esiDeduction || '0'),
            pt_deduction: String(item.pt_deduction || item.ptDeduction || '0'),
            lwf_deduction: String(item.lwf_deduction || item.lwfDeduction || '0'),
            income_tax: String(item.income_tax || item.incomeTax || '0'),
            lop_deduction: String(item.lop_deduction || item.lopDeduction || '0'),
            total_earnings: String(item.total_earnings || item.totalEarnings || '0'),
            total_incentives: String(item.total_incentives || item.totalIncentives || '0'),
            total_deductions: String(item.total_deductions || item.totalDeductions || item.deductions || '0'),
            net_payable: String(item.net_payable || item.netPayable || '0'),
            available_leaves: String(item.available_leaves || item.availableLeaves || '0'),
            lop: String(item.lop || item.LOP || item.total_absent || '0')
        });
        setShowAddForm(true);
    };

    const handleDeletePayslip = (item) => {
        setPayslipToDelete(item);
        setShowDeleteConfirm(true);
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
        setPayslipToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!payslipToDelete) return;
        const id = payslipToDelete._id || payslipToDelete.id;
        setShowDeleteConfirm(false);
        setPayslipToDelete(null);
        try {
            // Primary: DELETE /api/admin/pay-slips/:id
            let response = await fetch(`${BASE_URL}/api/admin/pay-slips/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            // Alias: DELETE /api/admin/payslips/:id
            if (!response.ok) {
                response = await fetch(`${BASE_URL}/api/admin/payslips/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
            }
            // Alias: DELETE /api/payslips/:id (direct client compatibility)
            if (!response.ok) {
                response = await fetch(`${BASE_URL}/api/payslips/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
            }
            if (response.ok) {
                fetchPayslips();
            } else {
                alert('Failed to delete payslip. Please try again.');
            }
        } catch (err) {
            console.error('Delete payslip error:', err);
            alert('Error deleting payslip. Check your connection.');
        }
    };

    const handleDownloadRowPDF = async (payslip) => {
        if (!payslip) return;
        const normalized = normalizePayslipData(payslip);
        const payslipId = payslip._id || payslip.id;
        setDownloadingId(payslipId);
        setActivePayslipForDownload(normalized);

        setTimeout(async () => {
            const element = document.getElementById('payslip-document-download-hidden');
            if (!element) {
                setDownloadingId(null);
                setActivePayslipForDownload(null);
                return;
            }

            try {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });

                const imgData = canvas.toDataURL('image/png');
                const canvasWidthMm = 210; // Standard A4 width in mm
                const canvasHeightMm = (canvas.height * canvasWidthMm) / canvas.width;

                const pdf = new jsPDF({
                    orientation: 'p',
                    unit: 'mm',
                    format: [canvasWidthMm, canvasHeightMm]
                });

                pdf.addImage(imgData, 'PNG', 0, 0, canvasWidthMm, canvasHeightMm);
                pdf.save(`Payslip_${normalized.emp_name || 'Employee'}_${getMonthName(normalized.month)}_${normalized.year || ''}.pdf`);
            } catch (error) {
                console.error('PDF Generation Error:', error);
                alert('Failed to generate PDF statement.');
            } finally {
                setDownloadingId(null);
                setActivePayslipForDownload(null);
            }
        }, 300);
    };

    const handleDownloadPDF = () => {
        setShowExportOptions(false);
        if (filteredPayslips.length === 0) {
            alert('No payslip records to export.');
            return;
        }

        try {
            const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4 PDF

            // Add title and company details
            doc.setFontSize(20);
            doc.setTextColor(15, 23, 42); // deep navy
            doc.text('NAVABHARATH TECHNOLOGIES', 14, 15);

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139); // slate grey
            doc.text('PAYSLIPS SUMMARY REPORT', 14, 21);

            const todayStr = new Date().toLocaleDateString('en-GB');
            doc.text(`Generated Date: ${todayStr}`, 14, 26);

            // Prepare table headers and rows
            const headers = [
                ['S.No', 'Employee ID', 'Employee Name', 'Month', 'Basic Salary', 'Present', 'LOP', 'Deductions', 'Net Payable']
            ];

            const rows = filteredPayslips.map((item, idx) => {
                const data = normalizePayslipData(item);
                return [
                    idx + 1,
                    data.employee_id || '-',
                    data.emp_name || '-',
                    getMonthName(data.month) + ' ' + (data.year || ''),
                    `Rs.${formatCurrency(data.basic_salary)}`,
                    data.total_present || '0',
                    data.lop || '0',
                    `Rs.${formatCurrency(data.total_deductions)}`,
                    `Rs.${formatCurrency(data.net_payable)}`
                ];
            });

            // Use jspdf-autotable to draw the table beautifully
            autoTable(doc, {
                head: headers,
                body: rows,
                startY: 32,
                theme: 'grid',
                headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
                bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: {
                    0: { cellWidth: 15 }, // S.No
                    1: { cellWidth: 25 }, // Employee ID
                    2: { cellWidth: 55 }, // Employee Name
                    3: { cellWidth: 30 }, // Month
                    4: { cellWidth: 30 }, // Basic Salary
                    5: { cellWidth: 20 }, // Present
                    6: { cellWidth: 15 }, // LOP
                    7: { cellWidth: 30 }, // Deductions
                    8: { cellWidth: 35 }  // Net Payable
                },
                margin: { top: 32, left: 14, right: 14 },
                didDrawPage: (data) => {
                    // Footer
                    const str = `Page ${doc.internal.getNumberOfPages()}`;
                    doc.setFontSize(8);
                    doc.setTextColor(148, 163, 184);
                    doc.text(str, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
                }
            });

            let filename = 'Payslips_Report';
            if (selectedEmployeeFilter) {
                filename += `_${selectedEmployeeFilter.replace(/\s+/g, '_')}`;
            }
            if (selectedMonthFilter) {
                filename += `_${getMonthName(selectedMonthFilter)}`;
            }
            filename += '.pdf';

            doc.save(filename);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate PDF report.');
        }
    };

    const handleDownloadExcel = () => {
        setShowExportOptions(false);
        if (filteredPayslips.length === 0) {
            alert('No payslip records to export.');
            return;
        }

        const worksheetData = [
            ["NAVABHARATH TECHNOLOGIES - PAYSLIPS REPORT"],
            [],
            ["Emp ID", "Employee Name", "Month", "Year", "Department", "Designation", "Basic Salary", "HRA", "Conveyance", "Special Allowance", "Performance", "Yearly", "PF", "ESI", "PT", "LWF", "Income Tax", "LOP Deduction", "Total Earnings", "Total Incentives", "Total Deductions", "Net Payable", "Present", "Weekly Off", "Holidays", "Leaves", "Absent", "Work OT", "OT Hours"]
        ];

        filteredPayslips.forEach(item => {
            const data = normalizePayslipData(item);
            worksheetData.push([
                data.employee_id,
                data.emp_name,
                getMonthName(data.month),
                data.year,
                data.department,
                data.designation,
                Number(data.basic_salary || 0),
                Number(data.hra || 0),
                Number(data.conveyance || 0),
                Number(data.special_allowance || 0),
                Number(data.performance_incentive || 0),
                Number(data.yearly_incentive || 0),
                Number(data.pf_deduction || 0),
                Number(data.esi_deduction || 0),
                Number(data.pt_deduction || 0),
                Number(data.lwf_deduction || 0),
                Number(data.income_tax || 0),
                Number(data.lop_deduction || 0),
                Number(data.total_earnings || 0),
                Number(data.total_incentives || 0),
                Number(data.total_deductions || 0),
                Number(data.net_payable || 0),
                data.total_present,
                data.total_weekly_off,
                data.total_holidays,
                data.total_leaves,
                data.total_absent,
                data.total_work_ot,
                data.total_ot_hours
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Payslips");
        
        let filename = 'Payslips_Report';
        if (selectedEmployeeFilter) {
            filename += `_${selectedEmployeeFilter.replace(/\s+/g, '_')}`;
        }
        if (selectedMonthFilter) {
            filename += `_${getMonthName(selectedMonthFilter)}`;
        }
        filename += '.xlsx';

        XLSX.writeFile(wb, filename);
    };

    const uniqueEmployees = Array.from(new Set(payslipsList.map(item => item.emp_name || item.employee_name || item.name || '').filter(Boolean))).sort();

    const filteredPayslips = payslipsList.filter(item => {
        const itemEmpName = (item.emp_name || item.employee_name || item.name || '').trim().toLowerCase();
        const matchesEmployee = !selectedEmployeeFilter || itemEmpName === selectedEmployeeFilter.trim().toLowerCase();
        
        const getMonthNum = (m) => {
            if (!m) return 0;
            const clean = String(m).trim().toLowerCase();
            const monthMap = {
                'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
                'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12,
                'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
                'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
            };
            if (monthMap[clean] !== undefined) return monthMap[clean];
            const parsed = parseInt(clean, 10);
            return isNaN(parsed) ? 0 : parsed;
        };

        const matchesMonth = !selectedMonthFilter || getMonthNum(item.month) === getMonthNum(selectedMonthFilter);
        return matchesEmployee && matchesMonth;
    });

    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredPayslips.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPayslips = filteredPayslips.slice(startIndex, startIndex + itemsPerPage);

    const nowForDropdown = new Date();
    const currentMonthForDropdown = nowForDropdown.getMonth() + 1;
    const currentYearForDropdown = nowForDropdown.getFullYear();
    const selectedYearVal = formData.year ? parseInt(formData.year, 10) : currentYearForDropdown;

    const monthOptions = monthsList.map(m => {
        const mVal = parseInt(m.value, 10);
        const isUpcoming = selectedYearVal > currentYearForDropdown || (selectedYearVal === currentYearForDropdown && mVal > currentMonthForDropdown);
        const disabled = isMonthDisabled(m.value, formData.year);
        const labelText = isUpcoming ? `● ${m.label}` : m.label;

        return {
            value: m.value,
            label: labelText,
            disabled: disabled
        };
    });

    const yearOptions = yearsList.map(y => {
        const yVal = parseInt(y, 10);
        const isUpcoming = yVal > currentYearForDropdown;
        const disabled = isYearDisabled(y);
        const labelText = isUpcoming ? `● ${y}` : y;

        return {
            value: y,
            label: labelText,
            disabled: disabled
        };
    });

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#eaeff2', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', sans-serif" }}>
            <div className="no-print">
                <AppHeader />
            </div>

            <main style={{ flex: 1, padding: winWidth < 768 ? '20px 15px' : '20px 20px', marginTop: winWidth < 768 ? '85px' : '110px' }}>
                <div style={{ maxWidth: '100%', margin: '0 auto' }}>

                    {/* Top Action Bar */}
                    <div className="no-print" style={{ display: 'flex', flexDirection: winWidth < 600 ? 'column' : 'row', justifyContent: 'space-between', alignItems: winWidth < 600 ? 'flex-start' : 'center', marginBottom: '32px', gap: '16px' }}>
                        <button
                            onClick={() => navigate(-1)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1.5px solid #e2e8f0', padding: '10px 20px', borderRadius: '12px', color: '#64748b', fontWeight: '800', cursor: 'pointer', transition: '0.2s' }}
                        >
                            <ArrowLeft size={18} /> Back
                        </button>

                        <div style={{ display: 'flex', gap: '12px', width: winWidth < 600 ? '100%' : 'auto', alignItems: 'center' }}>
                            <div style={{ flex: 1, minWidth: 0, width: winWidth < 600 ? 'auto' : '160px' }}>
                                <button
                                    onClick={handleAddClick}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#0f172a', color: 'white', border: '1.5px solid #0f172a', padding: '0 16px', height: '44px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.2)', whiteSpace: 'nowrap' }}
                                >
                                    <Printer size={18} /> {winWidth < 480 ? 'Add' : 'Add payslip'}
                                </button>
                            </div>

                            <div ref={filterDropdownRef} style={{ position: 'relative', flex: 1, minWidth: 0, width: winWidth < 600 ? 'auto' : '160px' }}>
                                <button
                                    onClick={() => setShowFilterOptions(!showFilterOptions)}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'white', border: '1.5px solid #e2e8f0', padding: '0 16px', height: '44px', borderRadius: '12px', color: '#0f172a', fontWeight: '800', cursor: 'pointer', transition: '0.2s', whiteSpace: 'nowrap' }}
                                >
                                    <Filter size={18} /> Filter
                                    {(selectedEmployeeFilter || selectedMonthFilter) && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                                            <span style={{
                                                background: '#1e40af',
                                                color: 'white',
                                                borderRadius: '50%',
                                                width: '18px',
                                                height: '18px',
                                                fontSize: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: '900'
                                            }}>
                                                {(selectedEmployeeFilter && selectedMonthFilter) ? 2 : 1}
                                            </span>
                                            <span
                                                title="Clear Filters"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedEmployeeFilter('');
                                                    setSelectedMonthFilter('');
                                                    setCurrentPage(1);
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: '#ef4444',
                                                    color: 'white',
                                                    borderRadius: '50%',
                                                    width: '18px',
                                                    height: '18px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = '#ef4444'; }}
                                            >
                                                <X size={10} strokeWidth={3} />
                                            </span>
                                        </div>
                                    )}
                                </button>

                                {showFilterOptions && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 8px)',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '16px',
                                        padding: '16px',
                                        width: '260px',
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                        zIndex: 1000,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px',
                                        animation: 'dropdown-fade-in 0.2s ease-out'
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee Name</label>
                                            <select
                                                value={selectedEmployeeFilter}
                                                onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    borderRadius: '8px',
                                                    border: '1.5px solid #e2e8f0',
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    color: '#0f172a',
                                                    background: '#f8fafc',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value="">All Employees</option>
                                                {uniqueEmployees.map((name, i) => (
                                                    <option key={i} value={name}>{name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Month</label>
                                            <select
                                                value={selectedMonthFilter}
                                                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    borderRadius: '8px',
                                                    border: '1.5px solid #e2e8f0',
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    color: '#0f172a',
                                                    background: '#f8fafc',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value="">All Months</option>
                                                {monthsList.map((m) => (
                                                    <option key={m.value} value={m.value}>{m.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {(selectedEmployeeFilter || selectedMonthFilter) && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedEmployeeFilter('');
                                                    setSelectedMonthFilter('');
                                                }}
                                                style={{
                                                    marginTop: '4px',
                                                    padding: '8px',
                                                    background: '#f1f5f9',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    color: '#64748b',
                                                    fontWeight: '800',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    width: '100%'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                                            >
                                                Clear Filters
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div ref={dropdownRef} style={{ position: 'relative', flex: 1, minWidth: 0, width: winWidth < 600 ? 'auto' : '160px' }}>
                                <button
                                    onClick={() => !isExportingPDF && setShowExportOptions(!showExportOptions)}
                                    disabled={isExportingPDF}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'white', border: '1.5px solid #e2e8f0', padding: '0 16px', height: '44px', borderRadius: '12px', color: '#0f172a', fontWeight: '800', cursor: isExportingPDF ? 'not-allowed' : 'pointer', transition: '0.2s', whiteSpace: 'nowrap', opacity: isExportingPDF ? 0.7 : 1 }}
                                >
                                    {isExportingPDF ? (
                                        <>
                                            <svg className="payslip-table-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                                            Exporting...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={18} /> Export <ChevronDown size={14} style={{ transform: showExportOptions ? 'rotate(180deg)' : 'rotate(0)' }} />
                                        </>
                                    )}
                                </button>

                                {showExportOptions && (
                                    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '8px', width: '220px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', zIndex: 1000, animation: 'dropdown-fade-in 0.2s ease-out' }}>
                                        <button onClick={handleDownloadPDF} style={dropdownItemStyle}><FileText size={16} color="#ef4444" /> PDF</button>
                                        <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }}></div>
                                        <button onClick={handleDownloadExcel} style={dropdownItemStyle}><FileSpreadsheet size={16} color="#16a34a" /> Excel</button>
                                        <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }}></div>
                                        <button onClick={handlePrint} style={dropdownItemStyle}><Printer size={16} color="#64748b" /> Print</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Employee Payslips List Table */}
                    <div className="payslip-table-card" style={{ background: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)', border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
                        {/* Table Header Row */}
                        <div className="payslip-table-scroll" style={{ overflowX: 'auto' }}>
                            <div className="payslip-table-wrapper" style={{ minWidth: '880px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '0.5fr 1fr 1.5fr 0.8fr 1fr 0.8fr 0.6fr 1fr 1.1fr 0.5fr 0.5fr 0.5fr', padding: '14px 20px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>S.No</span>
                                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Employee ID</span>
                                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Employee Name</span>
                                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Month</span>
                                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Basic Salary</span>
                                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Present</span>
                                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>LOP</span>
                                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Deductions</span>
                                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Net Payable</span>
                                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Action</span>
                                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Delete</span>
                                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Download</span>
                                </div>

                                {/* Table Body */}
                                {isLoadingPayslips ? (
                                    <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
                                        <svg className="payslip-table-spinner" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px' }}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                                        <p style={{ margin: 0, fontWeight: '800', fontSize: '13px', color: '#94a3b8' }}>Loading payslips...</p>
                                    </div>
                                ) : payslipsList.length === 0 ? (
                                    <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                                        <FileText size={36} color="#cbd5e1" style={{ marginBottom: '12px' }} />
                                        <p style={{ margin: 0, fontWeight: '800', fontSize: '14px', color: '#94a3b8' }}>No payslips added yet</p>
                                        <p style={{ margin: '6px 0 0', fontWeight: '600', fontSize: '12px', color: '#cbd5e1' }}>Click "Add payslip" to create the first entry</p>
                                    </div>
                                ) : filteredPayslips.length === 0 ? (
                                    <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                                        <FileText size={36} color="#cbd5e1" style={{ marginBottom: '12px' }} />
                                        <p style={{ margin: 0, fontWeight: '800', fontSize: '14px', color: '#94a3b8' }}>No matching payslips found</p>
                                        <p style={{ margin: '6px 0 0', fontWeight: '600', fontSize: '12px', color: '#cbd5e1' }}>Try adjusting your filters or clear them to see all records</p>
                                    </div>
                                ) : (
                                    paginatedPayslips.map((item, index) => (
                                        <div
                                            key={item._id || item.id || index}
                                            className="payslip-row"
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '0.5fr 1fr 1.5fr 0.8fr 1fr 0.8fr 0.6fr 1fr 1.1fr 0.5fr 0.5fr 0.5fr',
                                                padding: '13px 20px',
                                                borderBottom: '1px solid #f1f5f9',
                                                gap: '8px',
                                                alignItems: 'center',
                                                background: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                                                transition: 'all 0.2s ease',
                                                cursor: 'default'
                                            }}
                                        >
                                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#475569' }}>{startIndex + index + 1}</span>
                                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.employee_id || item.id || '-'}</span>
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.emp_name || item.employee_name || item.name || '-'}</span>
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>{item.month ? `${['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(item.month)] || item.month}${item.year ? ` ${item.year}` : ''}` : '-'}</span>
                                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>₹{item.basic_salary || item.basicSalary || item.basic || '0'}</span>
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>{item.total_present || item.totalPresent || item.present || '0'}</span>
                                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#ef4444' }}>{item.lop || item.LOP || item.total_absent || item.absent || '0'}</span>
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626' }}>₹{item.total_deductions || item.totalDeduction || item.deductions || '0'}</span>
                                            <span style={{ fontSize: '13px', fontWeight: '900', color: '#16a34a' }}>₹{item.net_payable || item.netPayable || '0'}</span>
                                            <button
                                                onClick={() => handleEditPayslip(item)}
                                                title="Edit Payslip"
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '10px',
                                                    border: '1.5px solid #e2e8f0',
                                                    background: 'white',
                                                    color: '#1e40af',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    padding: 0
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#1e40af'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#1e40af'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#1e40af'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePayslip(item)}
                                                title="Delete Payslip"
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '10px',
                                                    border: '1.5px solid #fecaca',
                                                    background: 'white',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    padding: 0
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fecaca'; }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDownloadRowPDF(item)}
                                                title="Download PDF"
                                                disabled={downloadingId === (item._id || item.id)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '10px',
                                                    border: '1.5px solid #cbd5e1',
                                                    background: 'white',
                                                    color: '#0f172a',
                                                    cursor: downloadingId === (item._id || item.id) ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    padding: 0,
                                                    opacity: downloadingId === (item._id || item.id) ? 0.6 : 1
                                                }}
                                                onMouseEnter={e => {
                                                    if (downloadingId !== (item._id || item.id)) {
                                                        e.currentTarget.style.background = '#0f172a';
                                                        e.currentTarget.style.color = 'white';
                                                        e.currentTarget.style.borderColor = '#0f172a';
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    if (downloadingId !== (item._id || item.id)) {
                                                        e.currentTarget.style.background = 'white';
                                                        e.currentTarget.style.color = '#0f172a';
                                                        e.currentTarget.style.borderColor = '#cbd5e1';
                                                    }
                                                }}
                                            >
                                                {downloadingId === (item._id || item.id) ? (
                                                    <svg className="payslip-table-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                                                ) : (
                                                    <Download size={14} />
                                                )}
                                            </button>
                                        </div>
                                    ))
                                )}

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '12px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>
                                            Showing <span style={{ color: '#0f172a', fontWeight: '800' }}>{startIndex + 1}</span> to <span style={{ color: '#0f172a', fontWeight: '800' }}>{Math.min(startIndex + itemsPerPage, filteredPayslips.length)}</span> of <span style={{ color: '#0f172a', fontWeight: '800' }}>{filteredPayslips.length}</span> entries
                                        </span>
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <button
                                                type="button"
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '4px',
                                                    padding: '8px 12px',
                                                    borderRadius: '10px',
                                                    border: '1.5px solid #e2e8f0',
                                                    background: currentPage === 1 ? '#f1f5f9' : 'white',
                                                    color: currentPage === 1 ? '#cbd5e1' : '#475569',
                                                    fontWeight: '800',
                                                    fontSize: '12px',
                                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <ChevronLeft size={16} /> Previous
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <button
                                                    type="button"
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '10px',
                                                        border: '1.5px solid',
                                                        borderColor: currentPage === page ? '#0f172a' : '#e2e8f0',
                                                        background: currentPage === page ? '#0f172a' : 'white',
                                                        color: currentPage === page ? 'white' : '#475569',
                                                        fontWeight: '800',
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                disabled={currentPage === totalPages}
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '4px',
                                                    padding: '8px 12px',
                                                    borderRadius: '10px',
                                                    border: '1.5px solid #e2e8f0',
                                                    background: currentPage === totalPages ? '#f1f5f9' : 'white',
                                                    color: currentPage === totalPages ? '#cbd5e1' : '#475569',
                                                    fontWeight: '800',
                                                    fontSize: '12px',
                                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                Next <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* Add Payslip Modal */}
            {showAddForm && (
                <div className="no-print" style={modalOverlayStyle}>
                    <div style={{ ...modalContentStyle, maxWidth: winWidth < 768 ? '100%' : '920px', padding: winWidth < 768 ? '24px' : '30px 40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', flexShrink: 0 }}>
                            <h2 style={{ margin: 0, fontSize: winWidth < 768 ? '18px' : '20px', fontWeight: '900', color: '#0f172a' }}>{isEditMode ? 'Edit Payslip' : 'Add New Payslip'}</h2>
                            <button type="button" onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleAddPayslip} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                            {isFormFetching && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(30, 64, 175, 0.05)', color: '#1e40af', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', fontWeight: '850', fontSize: '13px', gridColumn: 'span 3' }}>
                                    <svg className="spinner-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                                    Fetching basic details and attendance stats...
                                </div>
                            )}
                            <div style={{ ...formGridStyle, gridTemplateColumns: winWidth < 768 ? '1fr' : (winWidth < 1024 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)') }}>
                                <div style={{ gridColumn: winWidth < 768 ? 'auto' : 'span 3', marginBottom: '8px' }}>
                                    <h3 style={sectionHeaderStyle}><User size={16} /> Personnel Details</h3>
                                </div>
                                <FormSelect label="Employee ID" name="employee_id" icon={<Fingerprint size={16} />} value={formData.employee_id} onChange={handleUserSelect} options={usersList.map(u => ({ value: u.employee_id || u.id, label: u.employee_id || u.id }))} />
                                <FormSelect label="Employee Name" name="emp_name" icon={<User size={16} />} value={formData.employee_id} onChange={handleUserSelect} options={usersList.map(u => ({ value: u.employee_id || u.id, label: u.name }))} />
                                <FormField label="Department" name="department" icon={<Building2 size={16} />} value={formData.department} onChange={handleInputChange} />
                                <FormSelect label="Designation" name="designation" icon={<Briefcase size={16} />} value={formData.designation} onChange={handleInputChange} options={Array.from(new Set(usersList.map(u => u.role || u.designation))).filter(Boolean).map(role => ({ value: role, label: role }))} />
                                <FormSelect label="Month" name="month" icon={<Calendar size={16} />} value={formData.month} onChange={handleInputChange} options={monthOptions} />
                                <FormSelect label="Year" name="year" icon={<Clock size={16} />} value={formData.year} onChange={handleInputChange} options={yearOptions} />

                                <FormField label="Basic Salary" name="basic_salary" type="number" value={formData.basic_salary} onChange={handleInputChange} />
                                <div style={{ gridColumn: winWidth < 768 ? 'auto' : 'span 3', display: 'flex', justifyContent: 'center', marginTop: '10px', borderTop: '1px dashed #e2e8f0', paddingTop: '20px' }}>
                                    <button
                                        type="button"
                                        onClick={handleModalLoadData}
                                        disabled={isFormFetching}
                                        style={{
                                            width: winWidth < 768 ? '100%' : '300px',
                                            background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '12px 20px',
                                            borderRadius: '12px',
                                            fontWeight: '900',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: '0.3s',
                                            boxShadow: '0 4px 12px rgba(30, 64, 175, 0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            opacity: isFormFetching ? 0.7 : 1
                                        }}
                                    >
                                        {isFormFetching ? 'Loading...' : 'Load Data'}
                                    </button>
                                </div>

                                <div style={{ gridColumn: winWidth < 768 ? 'auto' : 'span 3', margin: '24px 0 8px' }}>
                                    <h3 style={sectionHeaderStyle}><Landmark size={16} /> Earnings</h3>
                                </div>
                                <FormField label="HRA" name="hra" type="number" value={formData.hra} onChange={handleInputChange} />
                                <FormField label="Conveyance" name="conveyance" type="number" value={formData.conveyance} onChange={handleInputChange} />
                                <FormField label="Special Allowance" name="special_allowance" type="number" value={formData.special_allowance} onChange={handleInputChange} />
                                <FormField label="Total Earnings" name="total_earnings" type="number" value={formData.total_earnings} readOnly />
                                <div style={{ display: winWidth < 768 ? 'none' : 'block' }}></div> {/* Spacer */}
                                <div style={{ display: winWidth < 768 ? 'none' : 'block' }}></div> {/* Spacer */}

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
                                <FormField label="LOP Deduction" name="lop_deduction" type="number" value={formData.lop_deduction} readOnly />
                                <FormField label="Total Deductions" name="total_deductions" type="number" value={formData.total_deductions} readOnly />

                                <div style={{ gridColumn: winWidth < 768 ? 'auto' : 'span 3', margin: '24px 0 8px' }}>
                                    <h3 style={{ ...sectionHeaderStyle, color: '#16a34a', background: 'rgba(22, 163, 74, 0.05)' }}> Final Net Payable</h3>
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
                                <FormField label="LOP" name="lop" type="number" value={formData.lop} onChange={handleInputChange} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: winWidth < 480 ? 'column' : 'row', gap: '12px', marginTop: '20px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '16px', flexShrink: 0 }}>
                                <button type="button" onClick={handleCloseModal} style={{ ...cancelButtonStyle, width: winWidth < 480 ? '100%' : 'auto' }}>Cancel</button>
                                <button type="submit" style={{ ...submitButtonStyle, width: winWidth < 480 ? '100%' : 'auto' }}>{isEditMode ? 'Update Entry' : 'Save Entry'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="no-print">
                <AppFooter />
            </div>

            {/* Custom Center Pop-Up Modal */}
            {showSuccessPopup && (
                <div className="no-print" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 99999,
                    animation: 'fadeIn 0.25s ease'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        padding: '32px',
                        width: '90%',
                        maxWidth: '420px',
                        boxShadow: '0 20px 50px rgba(15, 23, 42, 0.15)',
                        border: '1.5px solid #e2e8f0',
                        textAlign: 'center',
                        animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: '#ecfdf5',
                            color: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.15)'
                        }}>
                            <Check size={28} strokeWidth={3} />
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '950', color: '#0f172a' }}>
                            Success!
                        </h3>
                        <p style={{ margin: '0 0 24px', fontSize: '13px', fontWeight: '750', color: '#475569', lineHeight: '1.5' }}>
                            {isEditMode ? "Payslip Updated Successfully!" : "Payslip Updated Successfully."}
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                type="button"
                                onClick={handleConfirmCancel}
                                style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    borderRadius: '12px',
                                    border: '1.5px solid #e2e8f0',
                                    background: 'white',
                                    color: '#475569',
                                    fontWeight: '900',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    outline: 'none'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmOK}
                                style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    fontWeight: '900',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                                    outline: 'none'
                                }}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Center Delete Confirmation Pop-Up Modal */}
            {showDeleteConfirm && (
                <div className="no-print" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 99999,
                    animation: 'fadeIn 0.25s ease'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        padding: '32px',
                        width: '90%',
                        maxWidth: '420px',
                        boxShadow: '0 20px 50px rgba(15, 23, 42, 0.15)',
                        border: '1.5px solid #e2e8f0',
                        textAlign: 'center',
                        animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: '#fef2f2',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            boxShadow: '0 8px 20px rgba(239, 68, 68, 0.15)'
                        }}>
                            <Trash2 size={28} strokeWidth={2.5} />
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '950', color: '#0f172a' }}>
                            Delete Payslip?
                        </h3>
                        <p style={{ margin: '0 0 24px', fontSize: '13px', fontWeight: '750', color: '#475569', lineHeight: '1.5' }}>
                            Are you sure you want to delete the payslip for <span style={{ color: '#0f172a', fontWeight: '900' }}>{payslipToDelete?.emp_name || payslipToDelete?.employee_name || payslipToDelete?.name || 'this employee'}</span>? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                type="button"
                                onClick={handleCancelDelete}
                                style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    borderRadius: '12px',
                                    border: '1.5px solid #e2e8f0',
                                    background: 'white',
                                    color: '#475569',
                                    fontWeight: '900',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    outline: 'none'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    color: 'white',
                                    fontWeight: '900',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                                    outline: 'none'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Off-screen hidden container for PDF rendering - positioned fixed at (0,0) with opacity 0.01 to ensure html2canvas loads and renders layout perfectly */}
            <div id="payslips-print-container" style={{ position: 'fixed', left: 0, top: 0, width: '850px', zIndex: -9999, opacity: 0.01, pointerEvents: 'none' }}>
                {filteredPayslips.map((item, idx) => {
                    const normalized = normalizePayslipData(item);
                    return (
                        <div key={item._id || item.id || idx} id={`payslip-print-item-${idx}`} className="print-payslip-page" style={{ pageBreakAfter: idx === filteredPayslips.length - 1 ? 'auto' : 'always', marginBottom: '40px', background: 'white' }}>
                            {renderPayslipTemplate(normalized, `payslip-print-item-tpl-${idx}`)}
                        </div>
                    );
                })}
            </div>

            {activePayslipForDownload && (
                <div className="no-print" style={{ position: 'fixed', left: 0, top: 0, width: '850px', zIndex: -9999, opacity: 0.01, pointerEvents: 'none' }}>
                    {renderPayslipTemplate(activePayslipForDownload, 'payslip-document-download-hidden')}
                </div>
            )}

            <style>{`
                @keyframes dropdown-fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes modal-pop { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                @keyframes payslipSpinAnim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .payslip-table-spinner { animation: payslipSpinAnim 1s linear infinite; }
                .payslip-row:hover { background: #eef2ff !important; }
                @media print {
                    html, body {
                        background: #ffffff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        margin: 10mm !important;
                        padding: 0 !important;
                        overflow: visible !important;
                    }
                    .no-print, header, footer, .app-header, .app-footer, button, .footer-item-container {
                        display: none !important;
                        visibility: hidden !important;
                    }
                    main {
                        display: block !important;
                        margin-top: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                    }
                    .payslip-row {
                        background: #ffffff !important;
                        border-bottom: 1.5px solid #cbd5e1 !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    /* Ensure action/delete/download columns are hidden in print */
                    .payslip-row button, 
                    .payslip-row svg,
                    .payslip-row > *:nth-child(10),
                    .payslip-row > *:nth-child(11),
                    .payslip-row > *:nth-child(12) {
                        display: none !important;
                        visibility: hidden !important;
                    }
                    /* Hide header's last 3 labels */
                    div[style*="gridTemplateColumns"] > span:nth-child(10),
                    div[style*="gridTemplateColumns"] > span:nth-child(11),
                    div[style*="gridTemplateColumns"] > span:nth-child(12) {
                        display: none !important;
                    }
                    /* Adjust grid layout header/body column templates to span only the 9 visible columns */
                    .payslip-row, 
                    div[style*="gridTemplateColumns"] {
                        grid-template-columns: 0.5fr 1fr 1.5fr 0.8fr 1fr 0.8fr 0.6fr 1fr 1.1fr !important;
                    }
                    /* Prevent horizontal scroll/cutoff of table in print preview */
                    .payslip-table-card {
                        box-shadow: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                        background: transparent !important;
                    }
                    .payslip-table-scroll {
                        overflow: visible !important;
                        overflow-x: visible !important;
                    }
                    .payslip-table-wrapper {
                        min-width: auto !important;
                        width: 100% !important;
                    }
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
            <select name={name} value={value} onChange={onChange} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                <option value="">Select {label}</option>
                {options.map((opt, i) => (
                    <option 
                        key={i} 
                        value={opt.value} 
                        disabled={opt.disabled}
                        style={{ color: opt.disabled ? '#cbd5e1' : '#0f172a' }}
                    >
                        {opt.label}
                    </option>
                ))}
            </select>
            <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}><ChevronDown size={14} /></div>
        </div>
    </div>
);

const FormField = ({ label, name, value, onChange, type = "text", icon, ...rest }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginLeft: '4px' }}>{label}</label>
        <div style={{ position: 'relative' }}>
            {icon && <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>{icon}</div>}
            <input type={type} name={name} value={value} onChange={onChange} autoComplete="off" style={{ ...inputStyle, paddingLeft: icon ? '40px' : '14px' }} {...rest} />
        </div>
    </div>
);

const inputStyle = {
    width: '100%',
    padding: '12px 14px 12px 40px',
    borderRadius: '14px',
    border: '1.5px solid #94a3b8',
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
    maxHeight: '48vh',
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
    maxWidth: '920px',
    borderRadius: '32px',
    padding: '40px',
    boxShadow: '0 40px 100px -20px rgba(15, 23, 42, 0.3)',
    animation: 'modal-pop 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    position: 'relative',
    overflow: 'hidden',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column'
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