import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, BASE_URL } from '../../config';
import logo from '../../assets/logo.png';
import { ArrowLeft, Printer, Save, Check, Pencil, Download, ExternalLink, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const formatDateToDDMMYYYY = (dateStr) => {
    if (!dateStr || dateStr === '—' || dateStr === 'N/A') return '—';
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    } catch (e) {
        return dateStr;
    }
};

export default function ExitFormalities() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [resignation, setResignation] = useState(null);
    const [isEditable, setIsEditable] = useState(false);
    const [dbRecordId, setDbRecordId] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(true);
    const [authMessage, setAuthMessage] = useState('');
    const [showPrintDropdown, setShowPrintDropdown] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [feedback, setFeedback] = useState({ show: false, message: '', type: 'success' });

    const showFeedback = (msg, type = 'success') => {
        setFeedback({ show: true, message: msg, type });
    };
    const [formData, setFormData] = useState({
        // Section 1: Employee Details
        employeeName: '',
        department: '',
        lastWorkingDay: '',
        employeeId: '',
        reportingManager: '',
        resignationDate: '',
        designation: '',
        dateOfJoining: '',
        hrName: '',

        // Section 2: Resignation Details
        reasonForLeaving: {
            betterOpportunity: false,
            personalReasons: false,
            careerGrowth: false,
            relocation: false,
            workEnvironment: false,
            other: false,
            otherText: ''
        },

        // Section 3: Knowledge & Work Handover
        handoverCompleted: '', // 'Yes' | 'No'
        handoverGivenTo: '',
        pendingTasks: '',

        // Section 4: Company Assets Returned
        assets: {
            idCard: { returned: '', remarks: '' },
            laptop: { returned: '', remarks: '' },
            mobile: { returned: '', remarks: '' },
            accessCard: { returned: '', remarks: '' },
            other: { returned: '', remarks: '' }
        },

        // Section 5: Clearance Status
        clearance: {
            hr: '', // 'Yes' | 'No'
            it: '', // 'Yes' | 'No'
            finance: '', // 'Yes' | 'No'
            admin: '' // 'Yes' | 'No'
        },

        // Section 6: Final Settlement
        noticePeriodServed: '', // 'Yes' | 'No'
        recovery: '',
        finalSettlementDate: ''
    });

const fetchWithTimeout = async (url, options = {}, timeoutMs = 3000) => {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timer);
        return res;
    } catch (e) {
        return null;
    }
};

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchData();
    }, [user?.token, user?.id, id]);

    const fetchData = async () => {
        // 0. Instant render from local storage if available to eliminate waiting
        let localState = null;
        try {
            const savedLocal = localStorage.getItem(`exit_formalities_${id}`);
            if (savedLocal) {
                const parsed = JSON.parse(savedLocal);
                if (parsed && parsed.formData) {
                    localState = parsed;
                } else if (parsed) {
                    localState = { formData: parsed, timestamp: 0 };
                }
                if (localState?.formData) {
                    setFormData(localState.formData);
                    setResignation({
                        id: id,
                        employee_id: localState.formData.employeeId,
                        employee_name: localState.formData.employeeName,
                        department: localState.formData.department,
                        designation: localState.formData.designation,
                        last_working_day: localState.formData.lastWorkingDay,
                        resignation_date: localState.formData.resignationDate,
                        hr_name: localState.formData.hrName,
                        reporting_manager: localState.formData.reportingManager,
                        status: 'Approved'
                    });
                    setLoading(false);
                }
            }
        } catch (e) {
            console.error('Error reading local cache:', e);
        }

        // Safety fallback timer: guarantees loading state clears within 3.5s max
        const safetyTimer = setTimeout(() => {
            setLoading(false);
        }, 3500);

        try {
            if (!localState) {
                setLoading(true);
            }

            // Parallel fetch with timeouts to avoid any hanging HTTP requests
            const [usersRes, resAdminRes, resFallbackRes, dbRes] = await Promise.allSettled([
                fetchWithTimeout(API_ENDPOINTS.USERS, { headers: { 'Authorization': `Bearer ${user.token}` } }, 3000),
                fetchWithTimeout(API_ENDPOINTS.RESIGNATIONS_GET || `${BASE_URL}/api/admin/resignations`, { headers: { 'Authorization': `Bearer ${user.token}` } }, 3000),
                fetchWithTimeout(`${BASE_URL}/api/resignations`, { headers: { 'Authorization': `Bearer ${user.token}` } }, 3000),
                fetchWithTimeout(`${API_ENDPOINTS.EXIT_FORMALITIES}/resignation/${id}`, { headers: { 'Authorization': `Bearer ${user.token}` } }, 3000)
            ]);

            let users = [];
            if (usersRes.status === 'fulfilled' && usersRes.value && usersRes.value.ok) {
                try {
                    const uData = await usersRes.value.json();
                    users = Array.isArray(uData) ? uData : (uData?.data || uData?.users || []);
                } catch (e) {}
            }

            let actualResList = [];
            const extractResList = (data) => {
                if (Array.isArray(data)) return data;
                if (data?.data && Array.isArray(data.data)) return data.data;
                if (data?.requests && Array.isArray(data.requests)) return data.requests;
                if (data?.data?.requests && Array.isArray(data.data.requests)) return data.data.requests;
                if (data?.data?.resignations && Array.isArray(data.data.resignations)) return data.data.resignations;
                if (data?.resignations && Array.isArray(data.resignations)) return data.resignations;
                return [];
            };

            if (resAdminRes.status === 'fulfilled' && resAdminRes.value && resAdminRes.value.ok) {
                try {
                    const resJson = await resAdminRes.value.json();
                    actualResList = extractResList(resJson);
                } catch (e) {}
            }

            if (actualResList.length === 0 && resFallbackRes.status === 'fulfilled' && resFallbackRes.value && resFallbackRes.value.ok) {
                try {
                    const fallbackJson = await resFallbackRes.value.json();
                    actualResList = extractResList(fallbackJson);
                } catch (e) {}
            }

            let dbData = null;
            let isForbidden = false;

            if (dbRes.status === 'fulfilled' && dbRes.value) {
                if (dbRes.value.ok) {
                    try {
                        const rawData = await dbRes.value.json();
                        dbData = Array.isArray(rawData) ? rawData[0] : rawData;
                    } catch (e) {}
                } else if (dbRes.value.status === 403) {
                    isForbidden = true;
                }
            }

            // If not found, try direct ID or employee ID endpoint
            if (!dbData && !isForbidden) {
                try {
                    const dbRes2 = await fetchWithTimeout(`${API_ENDPOINTS.EXIT_FORMALITIES}/${id}`, {
                        headers: { 'Authorization': `Bearer ${user.token}` }
                    }, 2000);
                    if (dbRes2 && dbRes2.ok) {
                        const rawData2 = await dbRes2.json();
                        dbData = Array.isArray(rawData2) ? rawData2[0] : rawData2;
                    }
                } catch (e) {}

                if (!dbData) {
                    try {
                        const dbRes3 = await fetchWithTimeout(`${API_ENDPOINTS.EXIT_FORMALITIES}/employee/${id}`, {
                            headers: { 'Authorization': `Bearer ${user.token}` }
                        }, 2000);
                        if (dbRes3 && dbRes3.ok) {
                            const rawData3 = await dbRes3.json();
                            dbData = Array.isArray(rawData3) ? rawData3[0] : rawData3;
                        }
                    } catch (e) {}
                }
            }

            if (isForbidden) {
                setIsAuthorized(false);
                setAuthMessage("You are not authorized to view or edit this employee's exit formalities. Only their direct reporting manager, HR, or CEO can access this page.");
                setLoading(false);
                return;
            }

            setIsAuthorized(true);
            setAuthMessage('');

            // 4. Search actualResList for matching resignation
            let foundRes = actualResList.find(r => 
                String(r.id) === String(id) || 
                String(r.resignation_id) === String(id)
            );

            if (!foundRes && dbData?.resignation_id) {
                foundRes = actualResList.find(r => 
                    String(r.id) === String(dbData.resignation_id) || 
                    String(r.resignation_id) === String(dbData.resignation_id)
                );
            }

            if (!foundRes) {
                foundRes = actualResList.find(r => 
                    String(r.employee_id) === String(id) || 
                    String(r.company_employee_id) === String(id) ||
                    (dbData?.employee_id && String(r.employee_id) === String(dbData.employee_id))
                );
            }

            // 6. If not found in list but dbData exists, construct foundRes from dbData
            if (!foundRes && dbData) {
                foundRes = {
                    id: dbData.resignation_id || id,
                    employee_id: dbData.employee_id,
                    employee_name: dbData.employee_name || '',
                    department: dbData.department || '',
                    designation: dbData.designation || '',
                    last_working_day: dbData.last_working_day || '',
                    resignation_date: dbData.resignation_submitted_date || '',
                    hr_name: dbData.hr_name || '',
                    reporting_manager: dbData.reporting_manager || '',
                    status: 'Approved'
                };
            }

            // 7. If still not found, construct foundRes from local storage
            if (!foundRes && localState?.formData) {
                foundRes = {
                    id: id,
                    employee_id: localState.formData.employeeId,
                    employee_name: localState.formData.employeeName,
                    department: localState.formData.department,
                    designation: localState.formData.designation,
                    last_working_day: localState.formData.lastWorkingDay,
                    resignation_date: localState.formData.resignationDate,
                    hr_name: localState.formData.hrName,
                    reporting_manager: localState.formData.reportingManager,
                    status: 'Approved'
                };
            }

            if (!foundRes) {
                console.warn(`Resignation record not found for id: ${id}. Available records:`, actualResList.length);
                setResignation(null);
                setLoading(false);
                return;
            }

            setResignation(foundRes);

            const mapDbToForm = (data) => {
                const reasonFlags = {
                    betterOpportunity: String(data.reason_type || '').includes('Better opportunity'),
                    personalReasons: String(data.reason_type || '').includes('Personal reasons'),
                    careerGrowth: String(data.reason_type || '').includes('Career growth'),
                    relocation: String(data.reason_type || '').includes('Relocation'),
                    workEnvironment: String(data.reason_type || '').includes('Work environment'),
                    other: String(data.reason_type || '').includes('Other'),
                    otherText: data.reason_other_specify || ''
                };

                return {
                    employeeName: data.employee_name || '',
                    department: data.department || '',
                    lastWorkingDay: data.last_working_day ? String(data.last_working_day).split('T')[0] : '',
                    employeeId: data.company_employee_id || String(data.employee_id || ''),
                    reportingManager: data.reporting_manager || '',
                    resignationDate: data.resignation_submitted_date ? String(data.resignation_submitted_date).split('T')[0] : '',
                    designation: data.designation || '',
                    dateOfJoining: data.date_of_joining ? String(data.date_of_joining).split('T')[0] : '',
                    hrName: data.hr_name || '',
                    reasonForLeaving: reasonFlags,
                    handoverCompleted: data.handover_completed || '',
                    handoverGivenTo: data.handover_to_employee_id ? String(data.handover_to_employee_id) : (data.handover_to_name || ''),
                    pendingTasks: data.pending_tasks || '',
                    assets: {
                        idCard: { returned: data.asset_id_card_status || '', remarks: data.asset_id_card_remarks || '' },
                        laptop: { returned: data.asset_laptop_status || '', remarks: data.asset_laptop_remarks || '' },
                        mobile: { returned: data.asset_mobile_status || '', remarks: data.asset_mobile_remarks || '' },
                        accessCard: { returned: data.asset_access_card_status || '', remarks: data.asset_access_card_remarks || '' },
                        other: { returned: data.asset_other_status || '', remarks: data.asset_other_remarks || '' }
                    },
                    clearance: {
                        hr: data.clearance_hr_status || '',
                        it: data.clearance_it_status || '',
                        finance: data.clearance_finance_status || '',
                        admin: data.clearance_admin_status || ''
                    },
                    noticePeriodServed: data.notice_period_served || '',
                    recovery: data.recovery_details || '',
                    finalSettlementDate: data.final_settlement_date ? String(data.final_settlement_date).split('T')[0] : ''
                };
            };

            if (dbData && dbData.resignation_id) {
                setDbRecordId(dbData.id);
                const mapped = mapDbToForm(dbData);
                setFormData(mapped);
                localStorage.setItem(`exit_formalities_${id}`, JSON.stringify({
                    formData: mapped,
                    timestamp: dbData.updated_at ? new Date(dbData.updated_at).getTime() : 0
                }));
                return;
            }

            if (localState) {
                setFormData(localState.formData);
                return;
            }

            // Map users for names/roles
            const usersMap = {};
            const depMap = {};
            const managerMap = {};
            const dojMap = {};

            users.forEach(u => {
                const uid = u.id || u.employee_id;
                if (uid != null) {
                    usersMap[uid] = u.name || u.username;
                    depMap[uid] = u.department || 'N/A';
                    managerMap[uid] = u.reporting_manager || u.manager_name || 'N/A';
                    dojMap[uid] = u.date_of_joining || u.doj || 'N/A';
                }
            });

            // Pre-populate fields from the resignation data & user data
            const empName = foundRes.employee_name || usersMap[foundRes.employee_id] || 'N/A';
            const empId = foundRes.employee_id || 'N/A';
            const lwd = foundRes.last_working_day ? new Date(foundRes.last_working_day).toISOString().split('T')[0] : '';
            const resignDate = foundRes.resignation_date ? new Date(foundRes.resignation_date).toISOString().split('T')[0] : '';
            const dept = depMap[empId] || foundRes.department || 'N/A';
            const desig = foundRes.designation || 'N/A';
            const manager = managerMap[empId] || 'N/A';
            const doj = dojMap[empId] || 'N/A';
            const hrVal = foundRes.hr_name || 'HR Team';

            // Map reason
            const reasonLower = String(foundRes.reason || '').toLowerCase();
            const reasonFlags = {
                betterOpportunity: reasonLower.includes('better') || reasonLower.includes('opportunity'),
                personalReasons: reasonLower.includes('personal'),
                careerGrowth: reasonLower.includes('career') || reasonLower.includes('growth'),
                relocation: reasonLower.includes('reloc'),
                workEnvironment: reasonLower.includes('environment') || reasonLower.includes('work'),
                other: false,
                otherText: ''
            };

            if (!reasonFlags.betterOpportunity && !reasonFlags.personalReasons && !reasonFlags.careerGrowth && !reasonFlags.relocation && !reasonFlags.workEnvironment) {
                reasonFlags.other = true;
                reasonFlags.otherText = foundRes.reason || '';
            }

            const defaultFormData = {
                ...formData,
                employeeName: empName,
                department: dept,
                lastWorkingDay: lwd,
                employeeId: empId,
                reportingManager: manager,
                resignationDate: resignDate,
                designation: desig,
                dateOfJoining: doj,
                hrName: hrVal,
                reasonForLeaving: reasonFlags
            };

            setFormData(defaultFormData);
            localStorage.setItem(`exit_formalities_${id}`, JSON.stringify({
                formData: defaultFormData,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('Error loading exit formalities data', error);
        } finally {
            clearTimeout(safetyTimer);
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Map selected checkboxes to single reason_type string
        const selectedReasons = [];
        if (formData.reasonForLeaving.betterOpportunity) selectedReasons.push('Better opportunity');
        if (formData.reasonForLeaving.personalReasons) selectedReasons.push('Personal reasons');
        if (formData.reasonForLeaving.careerGrowth) selectedReasons.push('Career growth');
        if (formData.reasonForLeaving.relocation) selectedReasons.push('Relocation');
        if (formData.reasonForLeaving.workEnvironment) selectedReasons.push('Work environment');
        if (formData.reasonForLeaving.other) selectedReasons.push('Other');
        const reason_type = selectedReasons.join(', ');

        const isNumeric = /^\d+$/.test(formData.handoverGivenTo.trim());
        const handover_to_employee_id = isNumeric ? parseInt(formData.handoverGivenTo) : null;
        const handover_to_name = isNumeric ? '' : formData.handoverGivenTo;

        const payload = {
            resignation_id: parseInt(id),
            employee_id: resignation ? resignation.employee_id : null,
            employee_name: formData.employeeName,
            department: formData.department,
            last_working_day: formData.lastWorkingDay || null,
            company_employee_id: formData.employeeId,
            reporting_manager: formData.reportingManager,
            resignation_submitted_date: formData.resignationDate || null,
            designation: formData.designation,
            date_of_joining: formData.dateOfJoining || null,
            hr_name: formData.hrName,
            reason_type: reason_type,
            reason_other_specify: formData.reasonForLeaving.otherText || '',
            handover_completed: formData.handoverCompleted,
            handover_to_employee_id: handover_to_employee_id,
            handover_to_name: handover_to_name,
            pending_tasks: formData.pendingTasks,
            asset_id_card_status: formData.assets.idCard.returned,
            asset_id_card_remarks: formData.assets.idCard.remarks,
            asset_laptop_status: formData.assets.laptop.returned,
            asset_laptop_remarks: formData.assets.laptop.remarks,
            asset_mobile_status: formData.assets.mobile.returned,
            asset_mobile_remarks: formData.assets.mobile.remarks,
            asset_access_card_status: formData.assets.accessCard.returned,
            asset_access_card_remarks: formData.assets.accessCard.remarks,
            asset_other_status: formData.assets.other.returned,
            asset_other_remarks: formData.assets.other.remarks,
            clearance_hr_status: formData.clearance.hr,
            clearance_hr_remarks: '',
            clearance_it_status: formData.clearance.it,
            clearance_it_remarks: '',
            clearance_finance_status: formData.clearance.finance,
            clearance_finance_remarks: '',
            clearance_admin_status: formData.clearance.admin,
            clearance_admin_remarks: '',
            notice_period_served: formData.noticePeriodServed,
            recovery_details: formData.recovery,
            final_settlement_date: formData.finalSettlementDate || null
        };

        // Save to localStorage with timestamp
        localStorage.setItem(`exit_formalities_${id}`, JSON.stringify({
            formData: formData,
            timestamp: Date.now()
        }));

        const url = dbRecordId 
            ? `${API_ENDPOINTS.EXIT_FORMALITIES}/${dbRecordId}`
            : API_ENDPOINTS.EXIT_FORMALITIES;
        const method = dbRecordId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const resData = await response.json();
                const createdId = resData?.id || resData?.data?.id || resData?.record?.id;
                if (!dbRecordId && createdId) {
                    setDbRecordId(createdId);
                }
                try {
                    await fetch(API_ENDPOINTS.ALERTS || `${BASE_URL}/api/notifications`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${user.token}`
                        },
                        body: JSON.stringify({
                            target_user_id: resignation ? resignation.employee_id : payload.employee_id,
                            title: 'Exit Formalities Completed',
                            message: 'Your exit formalities are completed so view the Feedback form and fill out this',
                            type: 'RESIGNATION'
                        })
                    });
                } catch (notifErr) {
                    console.error("Failed to send exit formalities notification", notifErr);
                }
                // Save again to update localStorage timestamp
                localStorage.setItem(`exit_formalities_${id}`, JSON.stringify({
                    formData: formData,
                    timestamp: Date.now()
                }));
                showFeedback('Exit formalities form saved successfully', 'success');
            } else {
                const errData = await response.json();
                console.error('Error saving to database:', errData);
                if (errData.error && errData.error.includes('only submit your own')) {
                    showFeedback('Progress saved locally! 💾\n\nNote: The exit formalities record must be initiated by HR or the employee first before it can sync to the database.', 'warning');
                } else if (errData.error && errData.error.includes('Unauthorized to modify')) {
                    showFeedback("Progress saved locally! 💾\n\nNote: You are not authorized to modify this employee's exit formalities in the database. Only their direct reporting manager, HR, or CEO can save modifications to the database.", 'warning');
                } else {
                    showFeedback(`Form progress saved locally, but database sync failed: ${errData.error || 'Server error'}`, 'error');
                }
            }
        } catch (error) {
            console.error('Error saving exit formalities', error);
            showFeedback('Form progress saved locally! (Backend database offline/unreachable) 💾', 'warning');
        }
    };

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (showPrintDropdown && !e.target.closest('.print-dropdown-wrapper')) {
                setShowPrintDropdown(false);
            }
        };
        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [showPrintDropdown]);

    const handlePrint = () => {
        window.print();
    };

    const handleExportPDF = async () => {
        const wasEditable = isEditable;
        let previewWindow = null;
        try {
            previewWindow = window.open('about:blank', '_blank');
        } catch (e) {
            console.warn('Popup blocked or not permitted:', e);
        }

        try {
            setIsExporting(true);
            // Temporarily disable edit mode so html2canvas renders clean text spans/divs instead of inputs
            if (wasEditable) {
                setIsEditable(false);
                await new Promise(resolve => setTimeout(resolve, 80));
            }

            const pages = document.querySelectorAll('.a4-page');
            if (pages.length === 0) {
                if (previewWindow && !previewWindow.closed) previewWindow.close();
                showFeedback('Unable to open the PDF. Please try again.', 'error');
                return;
            }

            const cleanName = (formData.employeeName || resignation?.employee_name || 'Employee')
                .trim()
                .replace(/[^a-zA-Z0-9_\-]/g, '_');
            const fileName = `Exit_Formalities_${cleanName}.pdf`;

            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                
                // Save original styles
                const originalBoxShadow = page.style.boxShadow;
                const originalBorderRadius = page.style.borderRadius;
                
                // Temporary clear styles for clean PDF export
                page.style.boxShadow = 'none';
                page.style.borderRadius = '0';
                
                // Render the page to a canvas with scale: 2 (192 DPI, crisp, fast, and light)
                const canvas = await html2canvas(page, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    width: page.offsetWidth || 794,
                    height: page.offsetHeight || 1123,
                    scrollX: 0,
                    scrollY: 0,
                    windowWidth: page.scrollWidth || 794,
                    windowHeight: page.scrollHeight || 1123
                });

                // Restore styles
                page.style.boxShadow = originalBoxShadow;
                page.style.borderRadius = originalBorderRadius;

                // High-quality JPEG data URL: reduces file size from 72MB to ~1.2MB for instant opening and zero corruption
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                
                if (i > 0) {
                    pdf.addPage('a4', 'p');
                }
                
                // standard A4 size: 210mm x 297mm
                pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
            }

            const pdfBlob = pdf.output('blob');
            const blobWithMime = new Blob([pdfBlob], { type: 'application/pdf' });
            const blobUrl = URL.createObjectURL(blobWithMime);

            let openedSuccessfully = false;
            if (previewWindow && !previewWindow.closed) {
                try {
                    previewWindow.location.href = blobUrl;
                    openedSuccessfully = true;
                } catch (e) {
                    console.warn('Could not set location.href of previewWindow, trying window.open:', e);
                }
            }

            if (!openedSuccessfully) {
                previewWindow = window.open(blobUrl, '_blank');
                if (previewWindow && !previewWindow.closed) {
                    openedSuccessfully = true;
                }
            }

            if (!openedSuccessfully || !previewWindow) {
                showFeedback('Unable to open the PDF. Please try again.', 'error');
                return;
            }

            pdf.save(fileName);

            setTimeout(() => {
                try {
                    URL.revokeObjectURL(blobUrl);
                } catch (e) {}
            }, 120000);
        } catch (error) {
            if (previewWindow && !previewWindow.closed) previewWindow.close();
            console.error('PDF generation error:', error);
            showFeedback('Unable to open the PDF. Please try again.', 'error');
        } finally {
            if (wasEditable) {
                setIsEditable(true);
            }
            setIsExporting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#eaeff2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif" }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#64748b' }}>Loading Exit Formalities...</div>
            </div>
        );
    }

    if (!resignation) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#eaeff2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", gap: '15px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>Resignation record not found.</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '10px 18px', borderRadius: '12px', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: '600', color: '#475569' }}
                    >
                        <ArrowLeft size={16} /> Go Back
                    </button>
                    <button
                        onClick={() => fetchData()}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', padding: '10px 18px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '600', color: 'white' }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="exit-formalities-container" style={{ minHeight: '100vh', backgroundColor: '#eaeff2', padding: '100px 20px 45px', fontFamily: "'Outfit', sans-serif", overflowX: 'auto' }}>
            {/* Header controls */}
            <div className="no-print" style={{ maxWidth: '800px', margin: '0 auto 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '9px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: '600', color: '#475569', fontSize: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => {
                            if (!isAuthorized) {
                                showFeedback("You are not authorized to edit this form. Only the employee's direct reporting manager, HR, or CEO can edit exit formalities.", 'error');
                                return;
                            }
                            setIsEditable(!isEditable);
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: !isAuthorized ? '#e2e8f0' : (isEditable ? '#10b981' : 'white'),
                            color: !isAuthorized ? '#94a3b8' : (isEditable ? 'white' : '#475569'),
                            padding: '9px 18px',
                            borderRadius: '10px',
                            border: '1px solid ' + (!isAuthorized ? '#cbd5e1' : (isEditable ? '#10b981' : '#cbd5e1')),
                            cursor: !isAuthorized ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            boxShadow: isEditable && isAuthorized ? '0 4px 12px rgba(16, 185, 129, 0.2)' : '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        title={!isAuthorized ? "Unauthorized to edit" : (isEditable ? "Disable Editing" : "Enable Editing")}
                    >
                        <Pencil size={15} /> {isEditable ? "Editing Enabled" : "Edit Form"}
                    </button>
                    <button
                        onClick={() => {
                            if (!isAuthorized) {
                                showFeedback("You are not authorized to save this form.", 'error');
                                return;
                            }
                            handleSave();
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: !isAuthorized ? '#cbd5e1' : '#1d4ed8',
                            color: !isAuthorized ? '#94a3b8' : 'white',
                            padding: '9px 18px',
                            borderRadius: '10px',
                            border: 'none',
                            cursor: !isAuthorized ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            boxShadow: isAuthorized ? '0 2px 4px rgba(29, 78, 216, 0.25)' : 'none'
                        }}
                    >
                        <Save size={15} /> Save Progress
                    </button>
                    <div className="print-dropdown-wrapper" style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowPrintDropdown(!showPrintDropdown)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#0f172a',
                                color: 'white',
                                padding: '9px 18px',
                                borderRadius: '10px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '14px',
                                boxShadow: '0 2px 4px rgba(15, 23, 42, 0.2)'
                            }}
                        >
                            <Printer size={15} /> Print / Save PDF
                        </button>
                        {showPrintDropdown && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 6px)',
                                right: 0,
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                                padding: '6px',
                                zIndex: 1000,
                                minWidth: '180px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px'
                            }}>
                                <button
                                    onClick={() => {
                                        setShowPrintDropdown(false);
                                        handlePrint();
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        background: 'transparent',
                                        border: 'none',
                                        padding: '10px 14px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '500',
                                        color: '#1e293b',
                                        textAlign: 'left',
                                        width: '100%',
                                        fontSize: '14px',
                                        transition: 'background 0.15s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <Printer size={15} color="#475569" /> Print
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPrintDropdown(false);
                                        handleExportPDF();
                                    }}
                                    disabled={isExporting}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        background: 'transparent',
                                        border: 'none',
                                        padding: '10px 14px',
                                        borderRadius: '6px',
                                        cursor: isExporting ? 'not-allowed' : 'pointer',
                                        fontWeight: '500',
                                        color: '#1e293b',
                                        textAlign: 'left',
                                        width: '100%',
                                        fontSize: '14px',
                                        transition: 'background 0.15s',
                                        opacity: isExporting ? 0.6 : 1
                                    }}
                                    onMouseEnter={(e) => { if (!isExporting) e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                                    onMouseLeave={(e) => { if (!isExporting) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    <FileText size={15} color="#475569" /> {isExporting ? 'Exporting...' : 'Export as PDF'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Unauthorized Warning Banner */}
            {!isAuthorized && (
                <div className="no-print" style={{ maxWidth: '800px', margin: '0 auto 20px', padding: '15px 20px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '12px', color: '#991b1b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)' }}>
                    <span>⚠️ {authMessage}</span>
                </div>
            )}

            {/* A4 Document Pages Wrapper */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center' }}>
                
                {/* PAGE 1 */}
                <div className="a4-page" style={{ position: 'relative', width: '210mm', minWidth: '210mm', height: '297mm', minHeight: '297mm', flexShrink: 0, background: 'white', padding: '12mm 15mm', boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {/* Top Right Triangle Graphics */}
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', overflow: 'hidden', pointerEvents: 'none' }}>
                        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
                            <polygon points="100,0 0,0 100,100" fill="#0ea5e9" />
                            <polygon points="100,0 40,0 100,60" fill="#1e1b4b" />
                        </svg>
                    </div>

                    {/* Bottom Left Corner Graphic */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '110px', height: '110px', overflow: 'hidden', pointerEvents: 'none' }}>
                        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
                            <polygon points="0,100 100,100 0,0" fill="#0ea5e9" />
                            <polygon points="0,100 60,100 0,40" fill="#1e1b4b" />
                        </svg>
                    </div>

                    {/* Logo & Header */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
                            <img src={logo} alt="Navabharath Logo" style={{ height: '65px', objectFit: 'contain' }} />
                        </div>

                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e3a8a', textDecoration: 'underline', textUnderlineOffset: '5px', letterSpacing: '1px', margin: 0 }}>EMPLOYEE EXIT FORM</h2>
                        </div>

                        {/* 1. Employee Details Section */}
                        <div style={{ marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1e3a8a', borderBottom: '1px solid #1e3a8a', paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>1. Employee Details</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ border: '1px solid #000', padding: '8px 10px', fontWeight: '700', width: '33.33%', backgroundColor: '#f8fafc', verticalAlign: 'top' }}>
                                            Employee Name:<br />
                                            {isEditable ? (
                                                <>
                                                    <input type="text" className="print-hide-input" value={formData.employeeName} onChange={e => setFormData({ ...formData, employeeName: e.target.value })} style={{ border: 'none', background: 'transparent', width: '100%', fontWeight: '700', outline: 'none', color: '#334155', fontSize: '13px', marginTop: '3px' }} />
                                                    <div className="print-show-text" style={{ fontWeight: '700', color: '#334155', fontSize: '13px', marginTop: '3px', minHeight: '18px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                                        {formData.employeeName || '—'}
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ fontWeight: '700', color: '#334155', fontSize: '13px', marginTop: '3px', minHeight: '18px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                                    {formData.employeeName || '—'}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ border: '1px solid #000', padding: '8px 10px', fontWeight: '700', width: '33.33%', backgroundColor: '#f8fafc', verticalAlign: 'top' }}>
                                            Department:<br />
                                            {isEditable ? (
                                                <>
                                                    <input type="text" className="print-hide-input" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} style={{ border: 'none', background: 'transparent', width: '100%', fontWeight: '700', outline: 'none', color: '#334155', fontSize: '13px', marginTop: '3px' }} />
                                                    <div className="print-show-text" style={{ fontWeight: '700', color: '#334155', fontSize: '13px', marginTop: '3px', minHeight: '18px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                                        {formData.department || '—'}
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ fontWeight: '700', color: '#334155', fontSize: '13px', marginTop: '3px', minHeight: '18px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                                    {formData.department || '—'}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ border: '1px solid #000', padding: '8px 10px', fontWeight: '700', width: '33.33%', backgroundColor: '#f8fafc', verticalAlign: 'top' }}>
                                            Last Working Day:<br />
                                            {isEditable ? (
                                                <>
                                                    <input type="date" className="print-hide-input" value={formData.lastWorkingDay} onChange={e => setFormData({ ...formData, lastWorkingDay: e.target.value })} style={{ border: 'none', background: 'transparent', width: '100%', fontWeight: '700', outline: 'none', color: '#334155', fontSize: '13px', marginTop: '3px' }} />
                                                    <div className="print-show-text" style={{ fontWeight: '700', color: '#334155', fontSize: '13px', marginTop: '3px', minHeight: '18px', lineHeight: '1.4' }}>
                                                        {formatDateToDDMMYYYY(formData.lastWorkingDay)}
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ fontWeight: '700', color: '#334155', fontSize: '13px', marginTop: '3px', minHeight: '18px', lineHeight: '1.4' }}>
                                                    {formatDateToDDMMYYYY(formData.lastWorkingDay)}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ border: '1px solid #000', padding: '8px 10px', fontWeight: '700', backgroundColor: '#f8fafc', verticalAlign: 'top' }}>
                                            Employee ID:<br />
                                            {isEditable ? (
                                                <>
                                                    <input type="text" className="print-hide-input" value={formData.employeeId} onChange={e => setFormData({ ...formData, employeeId: e.target.value })} style={{ border: 'none', background: 'transparent', width: '100%', fontWeight: '700', outline: 'none', color: '#334155', fontSize: '13px', marginTop: '3px' }} />
                                                    <div className="print-show-text" style={{ fontWeight: '700', color: '#334155', fontSize: '13px', marginTop: '3px', minHeight: '18px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                                        {formData.employeeId || '—'}
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ fontWeight: '700', color: '#334155', fontSize: '13px', marginTop: '3px', minHeight: '18px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                                    {formData.employeeId || '—'}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ border: '1px solid #000', padding: '8px 10px', fontWeight: '700', backgroundColor: '#f8fafc', verticalAlign: 'top' }}>
                                            Reporting Manager:<br />
                                            {isEditable ? (
                                                <>
                                                    <input type="text" className="print-hide-input" value={formData.reportingManager} onChange={e => setFormData({ ...formData, reportingManager: e.target.value })} style={{ border: 'none', background: 'transparent', width: '100%', fontWeight: '700', outline: 'none', color: '#334155', fontSize: '13px', marginTop: '3px' }} />
                                                    <div className="print-show-text" style={{ fontWeight: '700', color: '#334155', fontSize: '13px', marginTop: '3px', minHeight: '18px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                                        {formData.reportingManager || '—'}
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ fontWeight: '700', color: '#334155', fontSize: '13px', marginTop: '3px', minHeight: '18px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                                    {formData.reportingManager || '—'}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ border: '1px solid #000', padding: '8px 10px', fontWeight: '700', backgroundColor: '#f8fafc', verticalAlign: 'top' }}>
                                            Date of Resignation Submitted:<br />
                                            {isEditable ? (
                                                <>
                                                    <input type="date" className="print-hide-input" value={formData.resignationDate} onChange={e => setFormData({ ...formData, resignationDate: e.target.value })} style={{ border: 'none', background: 'transparent', width: '100%', fontWeight: '700', outline: 'none', color: '#334155', fontSize: '13px', marginTop: '3px' }} />
                                                    <div className="print-show-text" style={{ fontWeight: '700', color: '#334155', fontSize: '13px', marginTop: '3px', minHeight: '18px', lineHeight: '1.4' }}>
                                                        {formatDateToDDMMYYYY(formData.resignationDate)}
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ fontWeight: '700', color: '#334155', fontSize: '13px', marginTop: '3px', minHeight: '18px', lineHeight: '1.4' }}>
                                                    {formatDateToDDMMYYYY(formData.resignationDate)}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ border: '1px solid #000', padding: '8px 10px', fontWeight: '700', backgroundColor: '#f8fafc', verticalAlign: 'top' }}>
                                            Designation:<br />
                                            {isEditable ? (
                                                <>
                                                    <input type="text" className="print-hide-input" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} style={{ border: 'none', background: 'transparent', width: '100%', fontWeight: '700', outline: 'none', color: '#334155', fontSize: '13px', marginTop: '3px' }} />
                                                    <div className="print-show-text" style={{ fontWeight: '700', color: '#334155', fontSize: '13px', marginTop: '3px', minHeight: '18px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                                        {formData.designation || '—'}
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ fontWeight: '700', color: '#334155', fontSize: '13px', marginTop: '3px', minHeight: '18px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                                    {formData.designation || '—'}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ border: '1px solid #000', padding: '8px 10px', fontWeight: '700', backgroundColor: '#f8fafc', verticalAlign: 'top' }}>
                                            Date of Joining:<br />
                                            {isEditable ? (
                                                <>
                                                    <input type="date" className="print-hide-input" value={formData.dateOfJoining} onChange={e => setFormData({ ...formData, dateOfJoining: e.target.value })} style={{ border: 'none', background: 'transparent', width: '100%', fontWeight: '700', outline: 'none', color: '#334155', fontSize: '13px', marginTop: '3px' }} />
                                                    <div className="print-show-text" style={{ fontWeight: '700', color: '#334155', fontSize: '13px', marginTop: '3px', minHeight: '18px', lineHeight: '1.4' }}>
                                                        {formatDateToDDMMYYYY(formData.dateOfJoining)}
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ fontWeight: '700', color: '#334155', fontSize: '13px', marginTop: '3px', minHeight: '18px', lineHeight: '1.4' }}>
                                                    {formatDateToDDMMYYYY(formData.dateOfJoining)}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ border: '1px solid #000', padding: '8px 10px', fontWeight: '700', backgroundColor: '#f8fafc', verticalAlign: 'top' }}>
                                            HR:<br />
                                            {isEditable ? (
                                                <>
                                                    <input type="text" className="print-hide-input" value={formData.hrName} onChange={e => setFormData({ ...formData, hrName: e.target.value })} style={{ border: 'none', background: 'transparent', width: '100%', fontWeight: '700', outline: 'none', color: '#334155', fontSize: '13px', marginTop: '3px' }} />
                                                    <div className="print-show-text" style={{ fontWeight: '700', color: '#334155', fontSize: '13px', marginTop: '3px', minHeight: '18px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                                        {formData.hrName || '—'}
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ fontWeight: '700', color: '#334155', fontSize: '13px', marginTop: '3px', minHeight: '18px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                                    {formData.hrName || '—'}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 2. Resignation Details Section */}
                        <div style={{ marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1e3a8a', borderBottom: '1px solid #1e3a8a', paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>2. Resignation Details</h3>
                            <div style={{ fontSize: '13px', color: '#334155', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong>Date of Resignation Submitted:</strong>
                                <span style={{ borderBottom: '1.5px dashed #475569', minWidth: '150px', display: 'inline-block', fontWeight: '700', paddingLeft: '8px', lineHeight: '1.4' }}>{formatDateToDDMMYYYY(formData.resignationDate)}</span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
                                <strong>Reason for Leaving (tick or specify):</strong>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '5px' }}>
                                {[
                                    { key: 'betterOpportunity', label: 'Better opportunity' },
                                    { key: 'personalReasons', label: 'Personal reasons' },
                                    { key: 'careerGrowth', label: 'Career growth' },
                                    { key: 'relocation', label: 'Relocation' },
                                    { key: 'workEnvironment', label: 'Work environment' }
                                ].map(item => (
                                    <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: isEditable ? 'pointer' : 'default', lineHeight: '1.4' }}>
                                        <input
                                            type="checkbox"
                                            disabled={!isEditable}
                                            checked={formData.reasonForLeaving[item.key]}
                                            onChange={e => setFormData({
                                                ...formData,
                                                reasonForLeaving: {
                                                    ...formData.reasonForLeaving,
                                                    [item.key]: e.target.checked
                                                }
                                            })}
                                            style={{ width: '16px', height: '16px', cursor: isEditable ? 'pointer' : 'default', accentColor: '#1e3a8a' }}
                                        />
                                        {item.label}
                                    </label>
                                ))}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', marginTop: '2px', lineHeight: '1.4' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: isEditable ? 'pointer' : 'default' }}>
                                        <input
                                            type="checkbox"
                                            disabled={!isEditable}
                                            checked={formData.reasonForLeaving.other}
                                            onChange={e => setFormData({
                                                ...formData,
                                                reasonForLeaving: {
                                                    ...formData.reasonForLeaving,
                                                    other: e.target.checked
                                                }
                                            })}
                                            style={{ width: '16px', height: '16px', cursor: isEditable ? 'pointer' : 'default', accentColor: '#1e3a8a' }}
                                        />
                                        Other:
                                    </label>
                                    {isEditable ? (
                                        <>
                                            <input
                                                type="text"
                                                className="print-hide-input"
                                                value={formData.reasonForLeaving.otherText}
                                                onChange={e => setFormData({
                                                    ...formData,
                                                    reasonForLeaving: {
                                                        ...formData.reasonForLeaving,
                                                        other: true,
                                                        otherText: e.target.value
                                                    }
                                                })}
                                                style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', fontSize: '13px', flex: 1, padding: '2px 8px', fontWeight: '600', color: '#1e293b' }}
                                            />
                                            <span className="print-show-inline-text" style={{ borderBottom: '1px dashed #475569', minWidth: '150px', fontWeight: '700', paddingLeft: '8px', fontSize: '13px', color: '#1e293b', lineHeight: '1.4' }}>
                                                {formData.reasonForLeaving.otherText || '—'}
                                            </span>
                                        </>
                                    ) : (
                                        <span style={{ borderBottom: '1px dashed #475569', minWidth: '150px', display: 'inline-block', fontWeight: '700', paddingLeft: '8px', fontSize: '13px', color: '#1e293b', lineHeight: '1.4' }}>
                                            {formData.reasonForLeaving.otherText || '—'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Page Footer */}
                    <div style={{ position: 'relative', marginTop: 'auto' }}>
                        {/* Footer Contacts */}
                        <div style={{ textTransform: 'none', textAlign: 'center', borderTop: '1.5px solid #cbd5e1', paddingTop: '10px', fontSize: '11px', fontWeight: '700', color: '#475569', display: 'flex', justifyContent: 'center', gap: '25px', zIndex: 10 }}>
                            <span>Phone: 0821-3128831</span>
                            <span>www.navabharathtechnologies.com</span>
                            <span>hr@navabharathtechnologies.com</span>
                        </div>
                    </div>
                </div>

                {/* PAGE 2 */}
                <div className="a4-page" style={{ position: 'relative', width: '210mm', minWidth: '210mm', height: '297mm', minHeight: '297mm', flexShrink: 0, background: 'white', padding: '12mm 15mm', boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {/* Top Right Triangle Graphics */}
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', overflow: 'hidden', pointerEvents: 'none' }}>
                        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
                            <polygon points="100,0 0,0 100,100" fill="#0ea5e9" />
                            <polygon points="100,0 40,0 100,60" fill="#1e1b4b" />
                        </svg>
                    </div>

                    {/* Bottom Left Corner Graphic */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '110px', height: '110px', overflow: 'hidden', pointerEvents: 'none' }}>
                        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
                            <polygon points="0,100 100,100 0,0" fill="#0ea5e9" />
                            <polygon points="0,100 60,100 0,40" fill="#1e1b4b" />
                        </svg>
                    </div>

                    {/* Logo & Header */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
                            <img src={logo} alt="Navabharath Logo" style={{ height: '65px', objectFit: 'contain' }} />
                        </div>

                        {/* 3. Knowledge & Work Handover Section */}
                        <div style={{ marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1e3a8a', borderBottom: '1px solid #1e3a8a', paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>3. Knowledge & Work Handover</h3>
                            
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '10px', fontSize: '13px' }}>
                                <strong>Handover Completed:</strong>
                                {['Yes', 'No'].map(val => (
                                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isEditable ? 'pointer' : 'default', fontWeight: '600' }}>
                                        <input
                                            type="radio"
                                            name="handoverCompleted"
                                            value={val}
                                            disabled={!isEditable}
                                            checked={formData.handoverCompleted === val}
                                            onChange={e => setFormData({ ...formData, handoverCompleted: e.target.value })}
                                            style={{ width: '16px', height: '16px', cursor: isEditable ? 'pointer' : 'default', accentColor: '#1e3a8a' }}
                                        />
                                        {val}
                                    </label>
                                ))}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', marginBottom: '12px' }}>
                                <strong>Handover Given To:</strong>
                                {isEditable ? (
                                    <>
                                        <input
                                            type="text"
                                            className="print-hide-input"
                                            value={formData.handoverGivenTo}
                                            onChange={e => setFormData({ ...formData, handoverGivenTo: e.target.value })}
                                            style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', fontSize: '13px', flex: 1, padding: '2px 8px', fontWeight: '600', color: '#1e293b' }}
                                            placeholder="Employee name or ID"
                                        />
                                        <span className="print-show-inline-text" style={{ borderBottom: '1px dashed #475569', minWidth: '150px', fontWeight: '700', paddingLeft: '8px', fontSize: '13px', color: '#1e293b', lineHeight: '1.4' }}>
                                            {formData.handoverGivenTo || '—'}
                                        </span>
                                    </>
                                ) : (
                                    <span style={{ borderBottom: '1px dashed #475569', minWidth: '150px', display: 'inline-block', fontWeight: '700', paddingLeft: '8px', fontSize: '13px', color: '#1e293b', lineHeight: '1.4' }}>
                                        {formData.handoverGivenTo || '—'}
                                    </span>
                                )}
                            </div>

                            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <strong>Pending Tasks (if any):</strong>
                                {isEditable ? (
                                    <>
                                        <textarea
                                            className="print-hide-input"
                                            value={formData.pendingTasks}
                                            onChange={e => setFormData({ ...formData, pendingTasks: e.target.value })}
                                            style={{ width: '100%', minHeight: '60px', height: '60px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', padding: '8px 10px', fontSize: '13px', fontWeight: '600', color: '#334155', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                            placeholder="Enter details of tasks handed over or pending..."
                                        />
                                        <div className="print-show-text" style={{ width: '100%', minHeight: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '8px 10px', fontSize: '13px', fontWeight: '600', color: '#334155', whiteSpace: 'pre-wrap', backgroundColor: '#f8fafc', boxSizing: 'border-box', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                            {formData.pendingTasks || 'No pending tasks.'}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ width: '100%', minHeight: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '8px 10px', fontSize: '13px', fontWeight: '600', color: '#334155', whiteSpace: 'pre-wrap', backgroundColor: '#f8fafc', boxSizing: 'border-box', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                        {formData.pendingTasks || 'No pending tasks.'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 4. Company Assets Returned Section */}
                        <div style={{ marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1e3a8a', borderBottom: '1px solid #1e3a8a', paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>4. Company Assets Returned</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                                        <th style={{ border: '1px solid #cbd5e1', padding: '8px 10px', textAlign: 'left', width: '30%' }}>Asset</th>
                                        <th style={{ border: '1px solid #cbd5e1', padding: '8px 10px', width: '15%' }}>Yes</th>
                                        <th style={{ border: '1px solid #cbd5e1', padding: '8px 10px', width: '15%' }}>No</th>
                                        <th style={{ border: '1px solid #cbd5e1', padding: '8px 10px', textAlign: 'left' }}>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { key: 'idCard', label: 'ID Card' },
                                        { key: 'laptop', label: 'Laptop/Desktop' },
                                        { key: 'mobile', label: 'Mobile / SIM' },
                                        { key: 'accessCard', label: 'Access Card / Keys' },
                                        { key: 'other', label: 'Other' }
                                    ].map(item => (
                                        <tr key={item.key}>
                                            <td style={{ border: '1px solid #cbd5e1', padding: '8px 10px', textAlign: 'left', fontWeight: '700' }}>{item.label}</td>
                                            <td style={{ border: '1px solid #cbd5e1', padding: '8px 10px' }}>
                                                <input
                                                    type="radio"
                                                    name={`asset_${item.key}`}
                                                    disabled={!isEditable}
                                                    checked={formData.assets[item.key].returned === 'Yes'}
                                                    onChange={() => setFormData({
                                                        ...formData,
                                                        assets: {
                                                            ...formData.assets,
                                                            [item.key]: { ...formData.assets[item.key], returned: 'Yes' }
                                                        }
                                                    })}
                                                    style={{ width: '16px', height: '16px', cursor: isEditable ? 'pointer' : 'default', accentColor: '#1e3a8a' }}
                                                />
                                            </td>
                                            <td style={{ border: '1px solid #cbd5e1', padding: '8px 10px' }}>
                                                <input
                                                    type="radio"
                                                    name={`asset_${item.key}`}
                                                    disabled={!isEditable}
                                                    checked={formData.assets[item.key].returned === 'No'}
                                                    onChange={() => setFormData({
                                                        ...formData,
                                                        assets: {
                                                            ...formData.assets,
                                                            [item.key]: { ...formData.assets[item.key], returned: 'No' }
                                                        }
                                                    })}
                                                    style={{ width: '16px', height: '16px', cursor: isEditable ? 'pointer' : 'default', accentColor: '#1e3a8a' }}
                                                />
                                            </td>
                                            <td style={{ border: '1px solid #cbd5e1', padding: '8px 10px', textAlign: 'left' }}>
                                                {isEditable ? (
                                                    <>
                                                        <input
                                                            type="text"
                                                            className="print-hide-input"
                                                            value={formData.assets[item.key].remarks}
                                                            onChange={e => setFormData({
                                                                ...formData,
                                                                assets: {
                                                                    ...formData.assets,
                                                                    [item.key]: { ...formData.assets[item.key], remarks: e.target.value }
                                                                }
                                                            })}
                                                            style={{ border: 'none', borderBottom: '1.5px dashed #cbd5e1', width: '100%', outline: 'none', background: 'transparent', fontSize: '13px', fontWeight: '600', color: '#334155', padding: '2px 0' }}
                                                            placeholder="Add comments..."
                                                        />
                                                        <span className="print-show-text" style={{ fontSize: '13px', fontWeight: '600', color: '#334155', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                                            {formData.assets[item.key].remarks || '—'}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155', lineHeight: '1.4', wordBreak: 'break-word', display: 'block' }}>
                                                        {formData.assets[item.key].remarks || '—'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Page Footer */}
                    <div style={{ position: 'relative', marginTop: 'auto' }}>
                        {/* Footer Contacts */}
                        <div style={{ textAlign: 'center', borderTop: '1.5px solid #cbd5e1', paddingTop: '10px', fontSize: '11px', fontWeight: '700', color: '#475569', display: 'flex', justifyContent: 'center', gap: '25px', zIndex: 10 }}>
                            <span>Phone: 0821-3128831</span>
                            <span>www.navabharathtechnologies.com</span>
                            <span>hr@navabharathtechnologies.com</span>
                        </div>
                    </div>
                </div>

                {/* PAGE 3 */}
                <div className="a4-page" style={{ position: 'relative', width: '210mm', minWidth: '210mm', height: '297mm', minHeight: '297mm', flexShrink: 0, background: 'white', padding: '12mm 15mm', boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {/* Top Right Triangle Graphics */}
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', overflow: 'hidden', pointerEvents: 'none' }}>
                        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
                            <polygon points="100,0 0,0 100,100" fill="#0ea5e9" />
                            <polygon points="100,0 40,0 100,60" fill="#1e1b4b" />
                        </svg>
                    </div>

                    {/* Bottom Left Corner Graphic */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '110px', height: '110px', overflow: 'hidden', pointerEvents: 'none' }}>
                        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
                            <polygon points="0,100 100,100 0,0" fill="#0ea5e9" />
                            <polygon points="0,100 60,100 0,40" fill="#1e1b4b" />
                        </svg>
                    </div>

                    {/* Logo & Header */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
                            <img src={logo} alt="Navabharath Logo" style={{ height: '65px', objectFit: 'contain' }} />
                        </div>

                        {/* 5. Clearance Status Section */}
                        <div style={{ marginBottom: '20px', position: 'relative' }}>
                            {/* Watermark in background */}
                            <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', opacity: 0.05, width: '220px', zIndex: 0, pointerEvents: 'none' }}>
                                <img src={logo} alt="Navabharath Watermark" style={{ width: '100%' }} />
                            </div>

                            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1e3a8a', borderBottom: '1px solid #1e3a8a', paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', position: 'relative', zIndex: 1 }}>5. Clearance Status</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '5px', position: 'relative', zIndex: 1 }}>
                                {[
                                    { key: 'hr', label: 'HR Clearance' },
                                    { key: 'it', label: 'IT Clearance' },
                                    { key: 'finance', label: 'Finance Clearance' },
                                    { key: 'admin', label: 'Admin Clearance' }
                                ].map(item => (
                                    <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '300px', fontSize: '13px' }}>
                                        <strong>{item.label}:</strong>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            {['Yes', 'No'].map(val => (
                                                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: isEditable ? 'pointer' : 'default', fontWeight: '600' }}>
                                                    <input
                                                        type="radio"
                                                        name={`clearance_${item.key}`}
                                                        value={val}
                                                        disabled={!isEditable}
                                                        checked={formData.clearance[item.key] === val}
                                                        onChange={e => setFormData({
                                                            ...formData,
                                                            clearance: {
                                                                ...formData.clearance,
                                                                [item.key]: e.target.value
                                                            }
                                                        })}
                                                        style={{ width: '16px', height: '16px', cursor: isEditable ? 'pointer' : 'default', accentColor: '#1e3a8a' }}
                                                    />
                                                    {val}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 6. Final Settlement Section */}
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1e3a8a', borderBottom: '1px solid #1e3a8a', paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>6. Final Settlement</h3>
                            
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '12px', fontSize: '13px' }}>
                                <strong>Notice Period Served:</strong>
                                {['Yes', 'No'].map(val => (
                                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isEditable ? 'pointer' : 'default', fontWeight: '600' }}>
                                        <input
                                            type="radio"
                                            name="noticePeriodServed"
                                            value={val}
                                            disabled={!isEditable}
                                            checked={formData.noticePeriodServed === val}
                                            onChange={e => setFormData({ ...formData, noticePeriodServed: e.target.value })}
                                            style={{ width: '16px', height: '16px', cursor: isEditable ? 'pointer' : 'default', accentColor: '#1e3a8a' }}
                                        />
                                        {val}
                                    </label>
                                ))}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', marginBottom: '12px' }}>
                                <strong>Recovery (if any):</strong>
                                {isEditable ? (
                                    <>
                                        <input
                                            type="text"
                                            className="print-hide-input"
                                            value={formData.recovery}
                                            onChange={e => setFormData({ ...formData, recovery: e.target.value })}
                                            style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', fontSize: '13px', flex: 1, padding: '2px 8px', fontWeight: '600', color: '#1e293b' }}
                                            placeholder="Specify amount or items to recover..."
                                        />
                                        <span className="print-show-inline-text" style={{ borderBottom: '1px dashed #475569', minWidth: '150px', fontWeight: '700', paddingLeft: '8px', fontSize: '13px', color: '#1e293b', lineHeight: '1.4' }}>
                                            {formData.recovery || '—'}
                                        </span>
                                    </>
                                ) : (
                                    <span style={{ borderBottom: '1px dashed #475569', minWidth: '150px', display: 'inline-block', fontWeight: '700', paddingLeft: '8px', fontSize: '13px', color: '#1e293b', lineHeight: '1.4' }}>
                                        {formData.recovery || '—'}
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', marginBottom: '15px' }}>
                                <strong>Final Settlement Date:</strong>
                                {isEditable ? (
                                    <>
                                        <input
                                            type="date"
                                            className="print-hide-input"
                                            value={formData.finalSettlementDate}
                                            onChange={e => setFormData({ ...formData, finalSettlementDate: e.target.value })}
                                            style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', fontSize: '13px', width: '200px', padding: '2px 8px', fontWeight: '600', color: '#1e293b' }}
                                        />
                                        <span className="print-show-inline-text" style={{ borderBottom: '1px dashed #475569', minWidth: '150px', fontWeight: '700', paddingLeft: '8px', fontSize: '13px', color: '#1e293b', lineHeight: '1.4' }}>
                                            {formatDateToDDMMYYYY(formData.finalSettlementDate)}
                                        </span>
                                    </>
                                ) : (
                                    <span style={{ borderBottom: '1px dashed #475569', minWidth: '150px', display: 'inline-block', fontWeight: '700', paddingLeft: '8px', fontSize: '13px', color: '#1e293b', lineHeight: '1.4' }}>
                                        {formatDateToDDMMYYYY(formData.finalSettlementDate)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Page Footer */}
                    <div style={{ position: 'relative', marginTop: 'auto' }}>
                        {/* Footer Contacts */}
                        <div style={{ textAlign: 'center', borderTop: '1.5px solid #cbd5e1', paddingTop: '10px', fontSize: '11px', fontWeight: '700', color: '#475569', display: 'flex', justifyContent: 'center', gap: '25px', zIndex: 10 }}>
                            <span>Phone: 0821-3128831</span>
                            <span>www.navabharathtechnologies.com</span>
                            <span>hr@navabharathtechnologies.com</span>
                        </div>
                    </div>
                </div>
            </div>

            {feedback.show && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)',
                    zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '24px 32px', borderRadius: '24px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: '12px', border: `1.5px solid ${feedback.type === 'success' ? '#4ade80' : feedback.type === 'warning' ? '#f59e0b' : '#ef4444'}`,
                        maxWidth: '360px', width: '100%', boxSizing: 'border-box'
                    }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '50%',
                            backgroundColor: feedback.type === 'success' ? '#ecfdf5' : feedback.type === 'warning' ? '#fffbeb' : '#fef2f2',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px'
                        }}>
                            {feedback.type === 'success' ? (
                                <span style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold' }}>✓</span>
                            ) : feedback.type === 'warning' ? (
                                <span style={{ color: '#d97706', fontSize: '24px', fontWeight: 'bold' }}>!</span>
                            ) : (
                                <span style={{ color: '#ef4444', fontSize: '24px', fontWeight: 'bold' }}>✕</span>
                            )}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', textAlign: 'center', lineHeight: '1.5', whiteSpace: 'pre-line' }}>{feedback.message}</div>
                        <button
                            onClick={() => setFeedback({ show: false, message: '', type: 'success' })}
                            style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', backgroundColor: '#0f172a', color: 'white', fontWeight: '800', cursor: 'pointer', marginTop: '8px', fontSize: '13px' }}
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}



            {/* Print & Screen Media Styles */}
            <style>{`
                .print-show-text, .print-show-inline-text {
                    display: none;
                }
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    html, body {
                        background-color: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 210mm !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .exit-formalities-container {
                        padding: 0 !important;
                        margin: 0 !important;
                        background-color: white !important;
                        overflow: visible !important;
                    }
                    .a4-page {
                        box-shadow: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                        margin: 0 !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        min-height: 297mm !important;
                        max-height: 297mm !important;
                        overflow: hidden !important;
                        page-break-after: always !important;
                        break-after: page !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        box-sizing: border-box !important;
                    }
                    .a4-page:last-child {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                    }
                    .print-hide-input {
                        display: none !important;
                    }
                    .print-show-text {
                        display: block !important;
                        line-height: 1.4 !important;
                        font-size: 13px !important;
                        color: #1e293b !important;
                        font-weight: 700 !important;
                        word-break: break-word !important;
                        overflow: visible !important;
                    }
                    .print-show-inline-text {
                        display: inline-block !important;
                        line-height: 1.4 !important;
                        font-size: 13px !important;
                        color: #1e293b !important;
                        font-weight: 700 !important;
                        word-break: break-word !important;
                        overflow: visible !important;
                    }
                    input[type="text"], input[type="date"], textarea {
                        border: none !important;
                        background: transparent !important;
                    }
                }
            `}</style>
        </div>
    );
}
