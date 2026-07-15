import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, BASE_URL } from '../../config';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '../../assets/logo.png';
import { cleanEmpId } from '../../utils/cleanId';
import {
    ArrowLeft, FileText, CheckCircle, Clock,
    Download, Plus, Search, Filter, AlertCircle, X, XCircle,
    ExternalLink, Calendar, Info, Package, ShieldCheck, Sparkles,
    Send, Lock, Unlock, Monitor, Mouse, Keyboard, Smartphone, Headphones, Camera, Tablet, HardDrive, Book,
    ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExperienceLetterUser({ defaultTab = 'submit' }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = String(user?.role || '').toLowerCase() === 'admin' || String(user?.role || '').toLowerCase().includes('hr');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [purpose, setPurpose] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [showAssetsModal, setShowAssetsModal] = useState(false);
    const [assetData, setAssetData] = useState(null);
    const [assetsLoading, setAssetsLoading] = useState(false);
    const [employeeNames, setEmployeeNames] = useState({});
    const [adminRemark, setAdminRemark] = useState('');
    const [certificateUrl, setCertificateUrl] = useState('');
    const [winWidth, setWinWidth] = useState(window.innerWidth);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [activeTab, setActiveTab] = useState(defaultTab || 'submit');
    const [downloadingId, setDownloadingId] = useState(null);
    const [formData, setFormData] = useState({
        laptopBrand: '',
        serialNumber: '',
        mouse: false,
        keyboard: false,
        stand: false,
        mobile: false,
        earphones: false,
        camera: false,
        tablet: false,
        pendrive: false,
        notepad: false
    });
    const [isAssetsDeclared, setIsAssetsDeclared] = useState(false);
    const [resignationStatus, setResignationStatus] = useState(null);
    const [isExitCompleted, setIsExitCompleted] = useState(false);
    const [checkingResignation, setCheckingResignation] = useState(true);
    const [showEntrancePopup, setShowEntrancePopup] = useState(false);

    useEffect(() => {
        if (defaultTab) {
            setActiveTab(defaultTab);
        }
    }, [defaultTab]);

    useEffect(() => {
        const fetchMyAssets = async () => {
            if (!user?.token) return;
            try {
                const res = await fetch(`${BASE_URL}/api/my-assets?employee_id=${user?.id || user?.employee_id}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const asset = Array.isArray(data) ? data[0] : (data.data ? (Array.isArray(data.data) ? data.data[0] : data.data) : data);
                    if (asset) {
                        setFormData(prev => ({
                            ...prev,
                            laptopBrand: asset.laptop_details || asset.laptop || asset.laptopBrand || prev.laptopBrand,
                            serialNumber: asset.serial_number || asset.serialNumber || prev.serialNumber,
                            mouse: asset.mouse === 'Yes' || asset.mouse === true || asset.mouse === 1 || prev.mouse,
                            keyboard: asset.keyboard === 'Yes' || asset.keyboard === true || asset.keyboard === 1 || prev.keyboard,
                            stand: asset.laptop_stand === 'Yes' || asset.stand === 'Yes' || asset.stand === true || prev.stand,
                            mobile: asset.mobile === 'Yes' || asset.company_mobile === 'Yes' || asset.mobile === true || prev.mobile,
                            earphones: asset.earphone === 'Yes' || asset.earphones === 'Yes' || asset.earphone_headphone === 'Yes' || asset.earphones === true || prev.earphones,
                            camera: asset.camera === 'Yes' || asset.external_camera === 'Yes' || asset.camera === true || prev.camera,
                            tablet: asset.tablet === 'Yes' || asset.tablet === true || prev.tablet,
                            pendrive: asset.pendrive === 'Yes' || asset.pendrive === true || prev.pendrive,
                            notepad: asset.ruf_pad === 'Yes' || asset.ref_pad === 'Yes' || asset.notepad === 'Yes' || asset.notepad === true || prev.notepad
                        }));
                        if (asset.laptop_details || asset.laptop || asset.serial_number || asset.serialNumber) {
                            setIsAssetsDeclared(true);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch my assets", err);
            }
        };
        fetchMyAssets();
    }, [user]);

    useEffect(() => {
        if (selectedDetail) {
            setAdminRemark(selectedDetail.admin_remark || '');
            setCertificateUrl(selectedDetail.certificate_url || '');
        }
    }, [selectedDetail]);

    useEffect(() => {
        const handleResize = () => setWinWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (showSuccessPopup) {
            const timer = setTimeout(() => {
                setShowSuccessPopup(false);
                setSelectedDetail(null);
                fetchMyRequests();
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [showSuccessPopup]);


    useEffect(() => {
        fetchMyRequests();
        fetchAllEmployees();
    }, [user]);

    useEffect(() => {
        const checkResignationAndExit = async () => {
            try {
                const token = localStorage.getItem('token') || user?.token;
                const cleanToken = (token && token !== 'undefined' && token !== 'null') ? token.replace(/['"]+/g, '').trim() : '';

                const url = `${BASE_URL}/api/resignations/my`;
                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${cleanToken}` }
                });

                if (res.ok) {
                    const raw = await res.json();
                    let data = Array.isArray(raw) ? raw : (raw.data || raw.value || []);

                    const activeRes = data.find(r => (r.status || '').toUpperCase() !== 'REVOKED') || data[0];
                    if (activeRes) {
                        const statusUpper = (activeRes.status || '').toUpperCase();
                        setResignationStatus(statusUpper);
                        if (statusUpper !== 'APPROVED') {
                            setShowEntrancePopup(activeTab === 'submit');
                        }

                        const exitRes = await fetch(`${BASE_URL}/api/exit-formalities/resignation/${activeRes.id}`, {
                            headers: { 'Authorization': `Bearer ${cleanToken}` }
                        });
                        if (exitRes.ok) {
                            const exitData = await exitRes.json();
                            if (exitData && (exitData.id || (Array.isArray(exitData) && exitData.length > 0))) {
                                setIsExitCompleted(true);
                            } else {
                                setIsExitCompleted(false);
                            }
                        } else {
                            setIsExitCompleted(false);
                        }
                    } else {
                        setResignationStatus(null);
                        setIsExitCompleted(false);
                        setShowEntrancePopup(activeTab === 'submit');
                    }
                } else {
                    setResignationStatus(null);
                    setIsExitCompleted(false);
                    setShowEntrancePopup(activeTab === 'submit');
                }
            } catch (err) {
                console.warn("Error checking resignation & exit status:", err);
            } finally {
                setCheckingResignation(false);
            }
        };
        if (user) {
            checkResignationAndExit();
        }
    }, [user, activeTab]);

    const fetchMyRequests = async () => {
        if (!user?.token) return;
        try {
            setLoading(true);
            const employeeId = user.id || user.employee_id;
            // In the HR portal, we want this screen to act as a global view for HR approval
            const endpoint = API_ENDPOINTS.SERVICE_CERTIFICATES_ADMIN || `${API_ENDPOINTS.BASE_URL || 'http://localhost:5000'}/api/service-certificates`;

            const res = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            if (res.ok) {
                const result = await res.json();
                console.log('Certificate fetch result:', result);

                let actualData = [];
                if (Array.isArray(result)) {
                    actualData = result;
                } else if (result.data && Array.isArray(result.data)) {
                    actualData = result.data;
                } else if (result.certificate_requests && Array.isArray(result.certificate_requests)) {
                    actualData = result.certificate_requests;
                } else if (result.requests && Array.isArray(result.requests)) {
                    actualData = result.requests;
                }

                // HR portal shows all requests by default but filter out Asset Declarations as they are viewed inside Service Certificates
                const filteredData = actualData.filter(req => req.purpose !== 'Professional Asset Declaration');

                setRequests(filteredData);
            }
        } catch (error) {
            console.error('Fetch requests error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllEmployees = async () => {
        if (!user?.token) return;
        try {
            const res = await fetch(API_ENDPOINTS.EMPLOYEES, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const mapping = {};
                (Array.isArray(data) ? data : (data.data || [])).forEach(emp => {
                    mapping[emp.employee_id || emp.id] = emp.name || emp.employee_name;
                });
                setEmployeeNames(mapping);
            }
        } catch (error) {
            console.error('Fetch employees error:', error);
        }
    };

    const formatToDDMMYYYY = (dateStr) => {
        if (!dateStr) return 'N/A';
        let s = String(dateStr).trim();
        if (s.includes('T')) {
            s = s.split('T')[0];
        }
        if (s.includes(',')) {
            s = s.split(',')[0];
        }
        if (s.includes(' ')) {
            s = s.split(' ')[0];
        }
        const matchDMY = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
        if (matchDMY) {
            const day = matchDMY[1].padStart(2, '0');
            const month = matchDMY[2].padStart(2, '0');
            const year = matchDMY[3];
            return `${day}-${month}-${year}`;
        }
        const matchYMD = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
        if (matchYMD) {
            const year = matchYMD[1];
            const month = matchYMD[2].padStart(2, '0');
            const day = matchYMD[3].padStart(2, '0');
            return `${day}-${month}-${year}`;
        }
        const d = new Date(s);
        if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}-${month}-${year}`;
        }
        return s;
    };

    const generateExperienceLetterPDF = async (details) => {
        // Wrapper to keep container off-screen but renderable by html2canvas
        const wrapper = document.createElement('div');
        wrapper.style.position = 'fixed';
        wrapper.style.top = '-9999px';
        wrapper.style.left = '-9999px';
        wrapper.style.width = '794px';
        wrapper.style.height = '1123px';
        wrapper.style.overflow = 'hidden';
        wrapper.style.zIndex = '-9999';
        document.body.appendChild(wrapper);

        const container = document.createElement('div');
        container.style.position = 'relative';
        container.style.width = '794px';
        container.style.height = '1123px';
        container.style.background = '#ffffff';
        container.style.boxSizing = 'border-box';
        container.style.padding = '80px 70px 60px 70px';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.justifyContent = 'space-between';
        container.style.fontFamily = "'Outfit', sans-serif";
        container.style.color = '#0f172a';
        container.style.overflow = 'hidden';
        wrapper.appendChild(container);

        const issueDateStr = details.dateOfIssue || new Date().toLocaleDateString('en-GB');
        const formattedDoj = formatToDDMMYYYY(details.doj);
        const formattedLwd = formatToDDMMYYYY(details.lwd);
        const designationUpper = String(details.designation || 'SOFTWARE ENGINEER').toUpperCase();

        container.innerHTML = `
            <div style="position: absolute; top: 0; right: 0; width: 220px; height: 220px; pointer-events: none; z-index: 1;">
                <svg viewBox="0 0 200 200" style="width: 100%; height: 100%; display: block;">
                    <polygon points="200,0 20,0 200,180" fill="#1d70b8" />
                    <polygon points="200,0 80,0 200,120" fill="#1e1b4b" />
                    <polygon points="200,0 140,0 200,60" fill="#0ea5e9" />
                </svg>
            </div>

            <div style="position: absolute; bottom: 0; left: 0; width: 220px; height: 220px; pointer-events: none; z-index: 1;">
                <svg viewBox="0 0 200 200" style="width: 100%; height: 100%; display: block;">
                    <polygon points="0,200 0,20 180,200" fill="#1d70b8" />
                    <polygon points="0,200 0,80 120,200" fill="#1e1b4b" />
                    <polygon points="0,200 0,140 60,200" fill="#0ea5e9" />
                </svg>
            </div>

            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.03; width: 400px; pointer-events: none; z-index: 0; display: flex; align-items: center; justify-content: center;">
                <img src="${logo}" style="width: 100%; height: auto;" />
            </div>

            <div style="position: relative; z-index: 10; display: flex; flex-direction: column; height: 100%; justify-content: space-between; box-sizing: border-box;">
                <div>
                    <div style="display: flex; align-items: center; margin-bottom: 45px;">
                        <img src="${logo}" style="height: 80px; object-fit: contain;" />
                    </div>

                    <div style="text-align: center; margin-bottom: 50px;">
                        <h2 style="font-size: 24px; font-weight: 800; color: #1e3a8a; text-decoration: underline; text-underline-offset: 8px; letter-spacing: 1.5px; margin: 0;">EXPERIENCE LETTER</h2>
                    </div>

                    <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 30px;">
                        Date: ${issueDateStr}
                    </div>

                    <div style="font-size: 14px; font-weight: 800; color: #1e293b; margin-bottom: 35px; letter-spacing: 0.5px;">
                        TO WHOMSOEVER IT MAY CONCERN
                    </div>

                    <div style="font-size: 14px; line-height: 2.0; color: #334155; display: flex; flex-direction: column; gap: 24px; text-align: justify; font-weight: 500;">
                        <p style="margin: 0;">
                            This is to certify that <strong>${String(details.empName).toUpperCase()}</strong>, holding the position of <strong>${details.designation}</strong>, was employed with Navabharath Technologies from <strong>${formattedDoj}</strong> to <strong>${formattedLwd}</strong>.
                        </p>
                        <p style="margin: 0;">
                            During their tenure with us, <strong>${String(details.empName).toUpperCase()} was responsible for ${details.designation}</strong>.
                        </p>
                        <p style="margin: 0;">
                            They demonstrated professionalism, dedication, skills and contributed positively to the team and organization.
                        </p>
                        <p style="margin: 0;">
                            We appreciate their efforts and wish them all the best in their future endeavors.
                        </p>
                    </div>

                    <div style="margin-top: 50px; font-size: 14px;">
                        <p style="margin: 0 0 45px 0; font-weight: 700; color: #1e293b;">For Navabharath Technologies.</p>
                        <div style="margin-top: 20px; font-weight: 800; color: #1e293b; line-height: 1.4;">
                            <p style="margin: 0; font-size: 15px;">Anish V N</p>
                            <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 700;">PROJECT MANAGER</p>
                            <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 700;">NAVABHARATH TECHNOLOGIES</p>
                        </div>
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; align-items: flex-end;">
                    <div style="display: flex; flex-direction: column; gap: 10px; border-left: 3px solid #0ea5e9; padding-left: 14px; margin-bottom: 10px; font-size: 11px; font-weight: 800; color: #475569;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 14px; height: 14px; background: #0ea5e9; border-radius: 2px;"></div>
                            <span>Phone: 0821-3128831</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 14px; height: 14px; background: #0ea5e9; border-radius: 2px;"></div>
                            <span>www.navabharathtechnologies.com</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 14px; height: 14px; background: #0ea5e9; border-radius: 2px;"></div>
                            <span>contact@navabharathtechnologies.com</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        try {
            const canvas = await html2canvas(container, {
                scale: 3,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                width: 794,
                height: 1123,
                scrollX: 0,
                scrollY: 0,
                allowTaint: true
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
            pdf.save(`Experience_Letter_${details.empName.replace(/\s+/g, '_')}.pdf`);
        } finally {
            document.body.removeChild(wrapper);
        }
    };


    const handleDownloadCertificate = async (req) => {
        if (downloadingId) return;
        setDownloadingId(req.id);
        try {
            const token = user?.token || localStorage.getItem('token');
            const cleanToken = token ? token.replace(/['"]+/g, '').trim() : '';
            const empId = req.employee_id || user?.employee_id || user?.id;

            const profileRes = await fetch(`${BASE_URL}/api/employee-profile/${empId}`, {
                headers: { 'Authorization': `Bearer ${cleanToken}` }
            });

            let doj = 'N/A';
            let lwd = 'N/A';
            let empName = req.employee_name || req.name || user?.name || 'Employee';
            let designation = user?.designation || 'Software Engineer';

            if (profileRes.ok) {
                const profileData = await profileRes.json();
                const profile = profileData.data || profileData.profile || profileData.record || profileData;
                if (profile) {
                    doj = profile.doj || profile.joining_date || profile.date_of_joining || doj;
                    lwd = profile.lwd || profile.separation || profile.last_working_day || lwd;
                    empName = profile.emp_name || profile.name || empName;
                    designation = profile.designation || designation;
                }
            }

            if (doj === 'N/A' || lwd === 'N/A') {
                const exitRes = await fetch(`${BASE_URL}/api/exit-formalities/resignation/${req.id || req.resignation_id}`, {
                    headers: { 'Authorization': `Bearer ${cleanToken}` }
                });
                if (exitRes.ok) {
                    const exitData = await exitRes.json();
                    const exit = Array.isArray(exitData) ? exitData[0] : exitData;
                    if (exit) {
                        if (doj === 'N/A') doj = exit.date_of_joining || doj;
                        if (lwd === 'N/A') lwd = exit.last_working_day || lwd;
                    }
                }
            }

            const applyDate = req.created_at || req.created_date || req.timestamp || req.time_stamp;
            const finalToDate = applyDate || lwd;

            await generateExperienceLetterPDF({
                empName,
                designation,
                doj,
                lwd: finalToDate,
                id: empId,
                dateOfIssue: new Date().toLocaleDateString('en-GB')
            });
        } catch (err) {
            console.error("Error generating experience letter:", err);
            alert("Failed to generate PDF experience letter.");
        } finally {
            setDownloadingId(null);
        }
    };

    const fetchAssetData = async (employeeId = null) => {
        if (!user?.token) return;
        try {
            setAssetsLoading(true);
            const targetEmpId = employeeId || user.id || user.employee_id;

            // Fetch from the global assets endpoint
            const res = await fetch(API_ENDPOINTS.ASSETS || `${API_ENDPOINTS.BASE_URL || 'http://localhost:5000'}/api/assets`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            if (res.ok) {
                const allAssets = await res.json();
                const list = Array.isArray(allAssets) ? allAssets : (allAssets.data || []);

                // Find the asset record for this specific employee
                const myAsset = list.find(a =>
                    String(a.employee_id || a.EmpID || a.employeeId || a.id) === String(targetEmpId)
                );

                if (myAsset) {
                    setAssetData(myAsset);
                } else {
                    console.warn('No asset record found for employee:', targetEmpId);
                }
            }
        } catch (error) {
            console.error('Fetch assets error:', error);
        } finally {
            setAssetsLoading(false);
        }
    };

    useEffect(() => {
        if (showAssetsModal && !assetData?.id) {
            fetchAssetData();
        }
    }, [showAssetsModal]);

    const handleHardwareDeclaration = async () => {
        if (!formData.laptopBrand || !formData.serialNumber) {
            setPopupMessage('Please provide Laptop Details and Serial Number.');
            setShowSuccessPopup(true);
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(API_ENDPOINTS.SERVICE_CERTIFICATE_REQUEST, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    employee_id: user.id || user.employee_id,
                    employee_name: user.name,
                    laptop_details: formData.laptopBrand,
                    serial_number: formData.serialNumber,
                    mouse: formData.mouse ? 1 : 0,
                    keyboard: formData.keyboard ? 1 : 0,
                    laptop_stand: formData.stand ? 1 : 0,
                    company_mobile: formData.mobile ? 1 : 0,
                    earphone_headphone: formData.earphones ? 1 : 0,
                    external_camera: formData.camera ? 1 : 0,
                    tablet: formData.tablet ? 1 : 0,
                    pendrive: formData.pendrive ? 1 : 0,
                    ref_pad: formData.notepad ? 1 : 0
                })
            });

            if (res.ok) {
                setIsAssetsDeclared(true);
                setPopupMessage('Hardware details verified successfully. You can now submit your application.');
                setShowSuccessPopup(true);
            } else {
                setPopupMessage('Failed to verify hardware details. Please try again.');
                setShowSuccessPopup(true);
            }
        } catch (error) {
            console.error('Hardware declaration error:', error);
            setPopupMessage('Network error while verifying hardware details.');
            setShowSuccessPopup(true);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateRequest = async () => {
        if (!isAssetsDeclared) {
            setPopupMessage('Please declare and finalize your hardware first.');
            setShowSuccessPopup(true);
            return;
        }
        if (!purpose.trim() || !user?.token) return;

        const finalPurpose = purpose === 'Other' ? formData.other_purpose : purpose;
        if (!finalPurpose) {
            setPopupMessage('Please specify your purpose.');
            setShowSuccessPopup(true);
            return;
        }

        try {
            setSubmitting(true);
            const res = await fetch(API_ENDPOINTS.SERVICE_CERTIFICATE_REQUEST, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    employee_id: user.id || user.employee_id,
                    employee_name: user.name,
                    purpose: finalPurpose,
                    status: 'Pending',
                    laptop_details: formData.laptopBrand,
                    serial_number: formData.serialNumber,
                    mouse: formData.mouse ? 1 : 0,
                    keyboard: formData.keyboard ? 1 : 0,
                    laptop_stand: formData.stand ? 1 : 0,
                    company_mobile: formData.mobile ? 1 : 0,
                    earphone_headphone: formData.earphones ? 1 : 0,
                    external_camera: formData.camera ? 1 : 0,
                    tablet: formData.tablet ? 1 : 0,
                    pendrive: formData.pendrive ? 1 : 0,
                    ref_pad: formData.notepad ? 1 : 0
                })
            });
            if (res.ok) {
                setShowRequestModal(false);
                setPurpose('');
                fetchMyRequests();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const quickStatusUpdate = async (id, newStatus) => {
        if (!user?.token) return;
        try {
            const res = await fetch(API_ENDPOINTS.SERVICE_CERTIFICATE_UPDATE(id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    status: newStatus,
                    admin_remark: adminRemark,
                    certificate_url: certificateUrl
                })
            });
            if (res.ok) {
                setPopupMessage(newStatus === 'Approved' ? 'Certificate Approved Successfully!' : 'Certificate Rejected Successfully!');
                setShowSuccessPopup(true);
            }
        } catch (error) {
            console.error('Quick update error:', error);
        }
    };

    const pendingRequests = requests.filter(r => r.status === 'Pending');
    const historyRequests = requests.filter(r => r.status !== 'Pending');
    const hasAlreadySubmitted = requests.some(r => String(r.employee_id) === String(user?.employee_id) || String(r.employee_id) === String(user?.id));

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#eaeff2', display: 'flex', flexDirection: 'column' }}>
            <AppHeader />

            <main style={{
                flex: 1,
                padding: winWidth < 768 ? '90px 15px 120px' : '100px 40px 120px',
                maxWidth: '100%',
                margin: '0',
                width: '100%',
                fontFamily: "'Outfit', sans-serif"
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <ArrowLeft size={18} color="#64748b" />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                            {activeTab === 'history' ? 'Experience Letter History' : 'Experience Letter'}
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0', fontWeight: '500' }}>
                            {activeTab === 'history' ? 'View applied experience letter requests' : 'Request / Review service certificate'}
                        </p>
                    </div>
                </div>

                {activeTab === 'submit' ? (
                    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: winWidth < 1024 ? '1fr' : '2fr 1fr', gap: '30px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            <div style={{ background: 'white', borderRadius: '24px', padding: '30px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '25px' }}>
                                    <FileText size={20} color="#64748b" />
                                    <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Service Certificate Application</h2>
                                </div>
                                {checkingResignation ? (
                                    <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                                        <div style={{ width: '24px', height: '24px', border: '3px solid #64748b40', borderTop: '3px solid #64748b', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }}></div>
                                        <div style={{ fontSize: '13px', fontWeight: '600' }}>Checking clearance status...</div>
                                    </div>
                                ) : (resignationStatus !== 'APPROVED' || !isExitCompleted) ? (
                                    <div style={{
                                        padding: '30px',
                                        textAlign: 'center',
                                        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                                        borderRadius: '20px',
                                        border: '1.5px solid #fca5a5',
                                        boxShadow: '0 8px 24px rgba(220, 38, 38, 0.03)',
                                        color: '#b91c1c'
                                    }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#dc2626' }}>
                                            <AlertCircle size={28} />
                                        </div>
                                        <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#991b1b', marginBottom: '8px' }}>Request Locked</h3>
                                        <p style={{ fontSize: '13px', color: '#991b1b90', lineHeight: '1.5', margin: 0, fontWeight: '600' }}>
                                            Experience letter requests are only available after your resignation is approved by TL, PM, and HR, and exit formalities are fully completed.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#1e293b', marginBottom: '8px' }}>Purpose of request <span style={{ color: '#ef4444' }}>*</span></label>
                                            <div style={{ position: 'relative' }}>
                                                <select
                                                    value={purpose} onChange={(e) => setPurpose(e.target.value)}
                                                    style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1.5px solid #cbd5e1', background: '#f8fafc', outline: 'none', fontWeight: '700', color: '#0f172a', appearance: 'none', cursor: 'pointer' }}
                                                >
                                                    <option value="" disabled>Select Purpose</option>
                                                    <option value="Higher Education">Higher Education</option>
                                                    <option value="New Job Opportunity">New Job Opportunity</option>
                                                    <option value="Personal Reasons">Personal Reasons</option>
                                                    <option value="Other">Other (Specify below)</option>
                                                </select>
                                                <ChevronDown size={18} color="#94a3b8" style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                            </div>
                                        </div>
                                        {purpose === 'Other' && (
                                            <div className="animate-slide-up" style={{ marginBottom: '20px' }}>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#1e293b', marginBottom: '8px' }}>Specify Other Purpose <span style={{ color: '#ef4444' }}>*</span></label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter your specific reason..."
                                                    value={formData.other_purpose || ''}
                                                    onChange={(e) => setFormData({ ...formData, other_purpose: e.target.value })}
                                                    style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1.5px solid #cbd5e1', background: '#f8fafc', outline: 'none', fontWeight: '700', color: '#0f172a' }}
                                                />
                                            </div>
                                        )}
                                        <div style={{ display: 'grid', gridTemplateColumns: winWidth < 600 ? '1fr' : '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>JOB TITLE</label>
                                                <div style={{ background: '#eef2ff', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: '800', color: '#312e81', border: '1px solid #e0e7ff' }}>
                                                    {user?.designation || 'Junior Software Engineer'}
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>EMPLOYEE ID</label>
                                                <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: '800', color: '#166534', border: '1px solid #dcfce7' }}>
                                                    {cleanEmpId(user?.employee_id || user?.id) || '202351'}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleCreateRequest}
                                            disabled={hasAlreadySubmitted || !isAssetsDeclared || submitting}
                                            style={{
                                                width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                                                background: hasAlreadySubmitted ? '#cbd5e1' : (isAssetsDeclared ? '#3b82f6' : '#cbd5e1'),
                                                color: 'white', fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', gap: '10px',
                                                cursor: (hasAlreadySubmitted || !isAssetsDeclared || submitting) ? 'not-allowed' : 'pointer',
                                                marginBottom: '15px', transition: 'all 0.3s',
                                                boxShadow: (!hasAlreadySubmitted && isAssetsDeclared) ? '0 10px 15px -3px rgba(59, 130, 246, 0.2)' : 'none'
                                            }}
                                        >
                                            {hasAlreadySubmitted ? <Lock size={16} /> : (isAssetsDeclared ? <Unlock size={16} /> : <Lock size={16} />)}
                                            {hasAlreadySubmitted ? 'Already Application Submitted' : (submitting && isAssetsDeclared ? 'Processing...' : 'Submit Application')}
                                        </button>
                                        <div style={{ background: '#fffbeb', padding: '12px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <AlertCircle size={16} /> Once approved HR manager will process within 1-2 business days
                                        </div>
                                    </>
                                )}
                            </div>

                            <div style={{ background: 'white', borderRadius: '24px', padding: '30px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                                    <Unlock size={20} color="#3b82f6" />
                                    <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Professional Asset Declaration</h2>
                                </div>
                                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '25px' }}>
                                    Declare details of company assets provided to you for your work remote setup.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: winWidth < 600 ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#1e293b', marginBottom: '8px' }}>Laptop Details (Brand) <span style={{ color: '#ef4444' }}>*</span></label>
                                        <input
                                            placeholder="e.g. Macbook Pro 14, Windows HP..."
                                            value={formData.laptopBrand} onChange={e => setFormData({ ...formData, laptopBrand: e.target.value })}
                                            style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1.5px solid #cbd5e1', outline: 'none', fontWeight: '600', fontSize: '13px', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#1e293b', marginBottom: '8px' }}>Serial Number <span style={{ color: '#ef4444' }}>*</span></label>
                                        <input
                                            placeholder="e.g. MXR293L23"
                                            value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                                            style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1.5px solid #cbd5e1', outline: 'none', fontWeight: '600', fontSize: '13px', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                </div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#1e293b', marginBottom: '15px' }}>
                                    <CheckCircle size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px', color: '#3b82f6' }} /> Hardware Components
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '30px' }}>
                                    {[
                                        { id: 'mouse', label: 'Optical Mouse', icon: <Mouse size={16} /> },
                                        { id: 'keyboard', label: 'External Keyboard', icon: <Keyboard size={16} /> },
                                        { id: 'stand', label: 'Laptop Stand', icon: <Monitor size={16} /> },
                                        { id: 'mobile', label: 'Company Mobile', icon: <Smartphone size={16} /> },
                                        { id: 'earphones', label: 'Earphones', icon: <Headphones size={16} /> },
                                        { id: 'camera', label: 'External Camera', icon: <Camera size={16} /> },
                                        { id: 'tablet', label: 'Tablet', icon: <Tablet size={16} /> },
                                        { id: 'pendrive', label: 'Pendrive / Storage', icon: <HardDrive size={16} /> },
                                        { id: 'notepad', label: 'Ref Pad / Notebook', icon: <Book size={16} /> },
                                    ].map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => setFormData({ ...formData, [item.id]: !formData[item.id] })}
                                            style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                padding: '12px 10px', borderRadius: '14px', border: formData[item.id] ? '1.5px solid #10b981' : '1.5px solid #e2e8f0',
                                                background: formData[item.id] ? '#ecfdf5' : 'white', color: formData[item.id] ? '#059669' : '#64748b',
                                                fontWeight: '700', fontSize: '11px', cursor: 'pointer', transition: '0.2s', textAlign: 'center'
                                            }}
                                        >
                                            {item.icon}
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleHardwareDeclaration}
                                    disabled={submitting || isAssetsDeclared}
                                    style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: isAssetsDeclared ? '#9ca3af' : '#10b981', color: 'white', fontWeight: '900', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: (submitting || isAssetsDeclared) ? 'not-allowed' : 'pointer', boxShadow: isAssetsDeclared ? 'none' : '0 10px 15px -3px rgba(16, 185, 129, 0.2)', opacity: (submitting || isAssetsDeclared) ? 0.7 : 1, transition: 'all 0.3s' }}
                                >
                                    <ShieldCheck size={18} /> {submitting && !isAssetsDeclared ? 'Processing...' : isAssetsDeclared ? 'Hardware Declared' : 'Submit Hardware Declaration'}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            <div style={{ background: 'white', borderRadius: '24px', padding: '25px', border: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
                                    <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '10px' }}>
                                        <ShieldCheck size={18} color="#10b981" />
                                    </div>
                                    <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Guidelines</h3>
                                </div>
                                <ul style={{ paddingLeft: '20px', margin: 0, color: '#475569', fontSize: '13px', fontWeight: '500', lineHeight: '1.7' }}>
                                    <li style={{ marginBottom: '10px' }}>Network connectivity from HR working apps.</li>
                                    <li style={{ marginBottom: '10px' }}>Tech hardware to be stored in clean, dry spaces.</li>
                                    <li style={{ marginBottom: '10px' }}>Remote tracking apps installed to experience effects.</li>
                                    <li>All hardware should be returned in 1-2 months.</li>
                                </ul>
                            </div>

                            <div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
                                    <Clock size={18} color="#64748b" />
                                    <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Request History</h3>
                                </div>
                                {requests.filter(r => r.employee_id === user?.employee_id || r.employee_id === user?.id).length === 0 ? (
                                    <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '40px 20px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                                        <FileText size={32} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#64748b', marginBottom: '4px' }}>No requests yet</div>
                                        <div style={{ fontSize: '12px', fontWeight: '500', color: '#94a3b8' }}>Your certificate applications will appear here</div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {requests.filter(r => r.employee_id === user?.employee_id || r.employee_id === user?.id).slice(0, 3).map(r => {
                                            const reqStatus = r.status || 'Pending';
                                            const isAppr = reqStatus.toLowerCase() === 'approved';
                                            const isRej = reqStatus.toLowerCase() === 'rejected';
                                            const isBothApproved = (r.status || '').toLowerCase() === 'approved' || (r.status || '').toLowerCase() === 'completed';
                                            const downloadUrl = r.certificate_url || r.file_path;
                                            return (
                                                <div key={r.id} style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{r.purpose || 'Service Certificate'}</div>
                                                        <div style={{ fontSize: '11px', fontWeight: '500', color: '#94a3b8', marginTop: '4px' }}>{new Date(r.created_at).toLocaleDateString()}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '8px', background: isAppr ? '#f0fdf4' : (isRej ? '#fef2f2' : '#fffbeb'), color: isAppr ? '#16a34a' : (isRej ? '#dc2626' : '#d97706') }}>
                                                            {reqStatus.charAt(0).toUpperCase() + reqStatus.slice(1)}
                                                        </div>
                                                        {isBothApproved && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDownloadCertificate(r); }}
                                                                disabled={downloadingId === r.id}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    background: '#0f172a',
                                                                    color: 'white',
                                                                    borderRadius: '8px',
                                                                    width: '28px',
                                                                    height: '28px',
                                                                    cursor: 'pointer',
                                                                    border: 'none'
                                                                }}
                                                                title="Download Experience Letter"
                                                            >
                                                                {downloadingId === r.id ? (
                                                                    <div style={{ width: '12px', height: '12px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                                                ) : (
                                                                    <Download size={14} />
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <section style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px'
                    }}>

                        {loading ? (
                            <div style={{ background: 'white', padding: '60px', borderRadius: '24px', textAlign: 'center', color: '#94a3b8', fontWeight: '800', border: '1px solid #f1f5f9' }}>Syncing certificates...</div>
                        ) : requests.length === 0 ? (
                            <div style={{ background: 'white', padding: '80px 40px', borderRadius: '24px', textAlign: 'center', border: '2px dashed #e2e8f0' }}>
                                <div style={{ width: '64px', height: '64px', background: '#f8fafc', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                    <FileText size={30} color="#cbd5e1" />
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '0 0 8px 0' }}>No Records</h3>
                                <p style={{ color: '#94a3b8', fontWeight: '600', margin: 0, fontSize: '14px' }}>No verification requests found.</p>
                            </div>
                        ) : (
                            <section style={{
                                display: 'grid',
                                gridTemplateColumns: winWidth < 768 ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '20px'
                            }}>
                                {requests.map((req) => {
                                    const status = req.status || 'Pending';
                                    const isPending = status.toLowerCase() === 'pending' || status.toLowerCase() === 'pending audit';
                                    const isApproved = status.toLowerCase() === 'approved';
                                    const isRejected = status.toLowerCase() === 'rejected';

                                    const formatDate = (dateStr) => {
                                        if (!dateStr) return '';
                                        const d = new Date(dateStr);
                                        return d.toLocaleDateString();
                                    };

                                    return (
                                        <div key={req.id} onClick={() => setSelectedDetail(req)} style={{
                                            position: 'relative', background: 'white', borderRadius: '16px', padding: '24px', cursor: 'pointer',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', overflow: 'hidden',
                                            transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', flexDirection: 'column'
                                        }}
                                            onMouseOver={e => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.04)';
                                            }}
                                            onMouseOut={e => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.02)';
                                            }}>
                                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: status === 'Pending Audit' ? '#ef4444' : isPending ? '#fbbf24' : isApproved ? '#22c55e' : '#ef4444' }} />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0' }}>{req.purpose || 'Service Certificate'}</h3>
                                                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontWeight: '600' }}>Req #{String(req.id).padStart(4, '0')}</p>
                                                </div>
                                                <div style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', background: status === 'Pending Audit' ? '#fef2f2' : isPending ? '#fef3c7' : isApproved ? '#dcfce7' : '#fee2e2', color: status === 'Pending Audit' ? '#ef4444' : isPending ? '#b45309' : isApproved ? '#15803d' : '#b91c1c' }}>
                                                    {status}
                                                </div>
                                            </div>
                                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', marginBottom: '16px', marginTop: 'auto' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <FileText size={12} color="#64748b" />
                                                    </div>
                                                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#334155' }}>{req.employee_name || req.name || employeeNames[req.employee_id] || 'Employee'}</span>
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginLeft: '32px' }}>ID: {cleanEmpId(req.employee_id)}</div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 'auto' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                                                    <Clock size={13} color="#64748b" />
                                                    <span style={{ fontSize: '12px', fontWeight: '800' }}>{formatDate(req.created_at)}</span>
                                                </div>
                                                {(() => {
                                                    const canDownload = (req.status || '').toLowerCase() === 'approved' || (req.status || '').toLowerCase() === 'completed';
                                                    return (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); if (canDownload) handleDownloadCertificate(req); }}
                                                            disabled={!canDownload || downloadingId === req.id}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                background: canDownload ? '#0f172a' : '#e2e8f0',
                                                                color: canDownload ? 'white' : '#94a3b8',
                                                                borderRadius: '8px',
                                                                width: '32px',
                                                                height: '32px',
                                                                cursor: canDownload ? 'pointer' : 'not-allowed',
                                                                transition: 'background-color 0.2s',
                                                                border: 'none',
                                                                boxShadow: canDownload ? '0 4px 10px rgba(15,23,42,0.15)' : 'none'
                                                            }}
                                                            onMouseOver={e => { if (canDownload) e.currentTarget.style.backgroundColor = '#1e293b'; }}
                                                            onMouseOut={e => { if (canDownload) e.currentTarget.style.backgroundColor = '#0f172a'; }}
                                                            title={canDownload ? 'Download Experience Letter' : 'Available once approved'}
                                                        >
                                                            {downloadingId === req.id ? (
                                                                <div style={{ width: '14px', height: '14px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                                            ) : (
                                                                <Download size={16} />
                                                            )}
                                                        </button>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )
                                })}
                            </section>
                        )}
                    </section>
                )}
            </main>

            {/* NEW REQUEST MODAL */}
            <AnimatePresence>
                {showRequestModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' }}>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            style={{
                                background: 'white',
                                borderRadius: '24px',
                                width: '100%',
                                maxWidth: '450px',
                                padding: winWidth < 768 ? '20px' : '30px',
                                position: 'relative'
                            }}
                        >

                            <button onClick={() => setShowRequestModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer' }}>✕</button>
                            <h2 style={{ fontSize: '22px', fontWeight: '950', color: '#0f172a', marginBottom: '20px' }}>New Certificate Request</h2>

                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Reason for Request</label>
                                <textarea
                                    placeholder="e.g. For Bank Loan application..."
                                    value={purpose} onChange={(e) => setPurpose(e.target.value)}
                                    style={{ width: '100%', padding: '15px', borderRadius: '14px', border: '1.5px solid #f1f5f9', outline: 'none', fontSize: '14px', fontWeight: '600', minHeight: '100px', background: '#f8fafc' }}
                                />
                            </div>

                            <button
                                onClick={handleCreateRequest}
                                disabled={submitting || !purpose.trim()}
                                style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: '#0f172a', color: 'white', fontWeight: '800', fontSize: '15px', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
                            >
                                {submitting ? 'Submitting...' : 'Send Request'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* DETAIL VIEW MODAL */}
            <AnimatePresence>
                {selectedDetail && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3100,
                        padding: winWidth < 768 ? '10px' : '20px'
                    }}>


                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            style={{
                                background: 'white',
                                borderRadius: winWidth < 768 ? '24px' : '32px',
                                width: '100%',
                                maxWidth: '550px',
                                position: 'relative',
                                overflowX: 'hidden',
                                overflowY: 'auto',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                                maxHeight: winWidth < 768 ? '80vh' : '90vh'
                            }}



                        >

                            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: winWidth < 768 ? '20px 15px' : '40px', color: 'white', textAlign: 'center' }}>


                                <button onClick={() => setSelectedDetail(null)} style={{ position: 'absolute', top: winWidth < 768 ? '10px' : '25px', right: winWidth < 768 ? '10px' : '25px', background: 'rgba(255,255,255,0.1)', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                                <div style={{ width: winWidth < 768 ? '40px' : '70px', height: winWidth < 768 ? '40px' : '70px', background: 'rgba(255,255,255,0.1)', borderRadius: winWidth < 768 ? '12px' : '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', backdropFilter: 'blur(10px)' }}>
                                    <FileText size={winWidth < 768 ? 20 : 32} />
                                </div>
                                <h2 style={{ fontSize: winWidth < 768 ? '18px' : '24px', fontWeight: '950', margin: '0 0 2px 0', letterSpacing: '-0.5px' }}>Service Certificate</h2>
                                <p style={{ margin: 0, opacity: 0.7, fontSize: winWidth < 768 ? '11px' : '14px', fontWeight: '600' }}>Request ID: #{selectedDetail.id}</p>


                            </div>

                            <div style={{ padding: winWidth < 768 ? '15px' : '40px' }}>


                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: winWidth < 480 ? '1fr' : '1fr 1fr',
                                    gap: winWidth < 768 ? '10px' : '30px',
                                    marginBottom: winWidth < 768 ? '15px' : '35px'
                                }}>


                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '950', color: '#475569', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Request Date</label>
                                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{new Date(selectedDetail.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '950', color: '#475569', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Status</label>
                                        <div style={{ display: 'inline-flex', background: selectedDetail.status === 'Approved' ? '#f0fdf4' : '#fffbeb', color: selectedDetail.status === 'Approved' ? '#16a34a' : '#d97706', padding: '4px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '950' }}>
                                            {selectedDetail.status || 'Pending'}
                                        </div>
                                    </div>
                                </div>

                                {/* PM Status & HR Status */}
                                <div style={{ display: 'grid', gridTemplateColumns: winWidth < 480 ? '1fr' : '1fr 1fr', gap: winWidth < 768 ? '10px' : '20px', marginBottom: winWidth < 768 ? '15px' : '25px' }}>
                                    <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '14px 16px', border: '1px solid #f1f5f9' }}>
                                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>PM Status</div>
                                        {(() => {
                                            const ps = (selectedDetail.pm_status || 'Pending').toLowerCase();
                                            const c = ps === 'approved' ? { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' } : ps === 'rejected' ? { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' } : { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
                                            return <span style={{ background: c.bg, color: c.text, border: `1.5px solid ${c.border}`, padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'capitalize', display: 'inline-block' }}>{selectedDetail.pm_status || 'Pending'}</span>;
                                        })()}
                                    </div>
                                    <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '14px 16px', border: '1px solid #f1f5f9' }}>
                                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>HR Status</div>
                                        {(() => {
                                            const hs = (selectedDetail.status || 'Pending').toLowerCase();
                                            const c = hs === 'approved' ? { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' } : hs === 'rejected' ? { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' } : { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
                                            return <span style={{ background: c.bg, color: c.text, border: `1.5px solid ${c.border}`, padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'capitalize', display: 'inline-block' }}>{selectedDetail.status || 'Pending'}</span>;
                                        })()}
                                    </div>
                                </div>


                                <div style={{ marginBottom: winWidth < 768 ? '15px' : '35px' }}>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '950', color: '#475569', textTransform: 'uppercase', marginBottom: winWidth < 768 ? '6px' : '12px', letterSpacing: '0.5px' }}>Purpose of Verification</label>
                                    <div style={{ background: '#f8fafc', padding: winWidth < 768 ? '10px 12px' : '20px', borderRadius: '14px', border: '1px solid #f1f5f9', fontSize: '13px', fontWeight: '700', color: '#334155', lineHeight: '1.4' }}>
                                        {selectedDetail.purpose}
                                    </div>
                                </div>



                                <div style={{ marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '950', color: '#475569', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>HR Admin Remarks</label>
                                        <textarea
                                            value={adminRemark}
                                            onChange={(e) => setAdminRemark(e.target.value)}
                                            placeholder="Enter internal notes or feedback..."
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #f1f5f9', outline: 'none', fontSize: '13px', fontWeight: '600', minHeight: '80px', background: '#f8fafc' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {(selectedDetail.status === 'Pending' || selectedDetail.status === 'Pending Audit') ? (
                                        <>
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: winWidth < 500 ? 'column' : 'row',
                                                gap: winWidth < 768 ? '8px' : '10px',
                                                width: '100%',
                                                marginBottom: winWidth < 768 ? '8px' : '10px'
                                            }}>


                                                <button
                                                    onClick={() => quickStatusUpdate(selectedDetail.id, 'Approved')}
                                                    style={{
                                                        flex: 1,
                                                        padding: winWidth < 768 ? '10px' : '14px',
                                                        borderRadius: '14px',
                                                        border: 'none',
                                                        background: '#22c55e',
                                                        color: 'white',
                                                        fontWeight: '800',
                                                        fontSize: winWidth < 768 ? '13px' : '14px',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)',
                                                        width: winWidth < 500 ? '90%' : 'auto',
                                                        margin: winWidth < 500 ? '0 auto' : '0'
                                                    }}
                                                >
                                                    Approve
                                                </button>

                                                <button
                                                    onClick={() => quickStatusUpdate(selectedDetail.id, 'Rejected')}
                                                    style={{
                                                        flex: 1,
                                                        padding: winWidth < 768 ? '10px' : '14px',
                                                        borderRadius: '14px',
                                                        border: 'none',
                                                        background: '#ef4444',
                                                        color: 'white',
                                                        fontWeight: '800',
                                                        fontSize: winWidth < 768 ? '13px' : '14px',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                                                        width: winWidth < 500 ? '90%' : 'auto',
                                                        margin: winWidth < 500 ? '0 auto' : '0'
                                                    }}
                                                >
                                                    Reject
                                                </button>

                                            </div>
                                        </>
                                    ) : ((selectedDetail.status || '').toLowerCase() === 'approved' || (selectedDetail.status || '').toLowerCase() === 'completed') ? (
                                        <button
                                            onClick={() => handleDownloadCertificate(selectedDetail)}
                                            disabled={downloadingId === selectedDetail.id}
                                            style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#0f172a', color: 'white', fontWeight: '800', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                        >
                                            {downloadingId === selectedDetail.id ? (
                                                <>
                                                    <div style={{ width: '18px', height: '18px', border: '3px solid white', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                                    Generating PDF...
                                                </>
                                            ) : (
                                                <>
                                                    <Download size={18} /> Download official PDF
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedDetail(null)}
                                            style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '2px solid #f1f5f9', background: 'white', color: '#0f172a', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}
                                        >
                                            Close View
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* AVAILABLE ASSETS MODAL */}
            <AnimatePresence>
                {showAssetsModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3200, padding: '20px' }}>

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            style={{
                                background: 'white',
                                borderRadius: winWidth < 768 ? '24px' : '32px',
                                width: '100%',
                                maxWidth: '850px',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                                border: '1px solid #f1f5f9',
                                maxHeight: '95vh',
                                overflowY: 'auto'
                            }}
                        >

                            <div style={{ padding: winWidth < 768 ? '20px' : '40px' }}>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                        <div style={{ width: '56px', height: '56px', background: '#eef2ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Package size={28} color="#4f46e5" />
                                        </div>
                                        <div>
                                            <h2 style={{ fontSize: '24px', fontWeight: '950', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Professional Asset Declaration</h2>
                                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: '700' }}>
                                                    {assetData?.employee_name || assetData?.name || employeeNames[assetData?.employee_id] || 'Employee'} (ID: {cleanEmpId(assetData?.employee_id)})
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowAssetsModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                                </div>

                                <div style={{ marginBottom: '32px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Laptop Details & Serial Number</label>
                                    <div style={{ background: '#f8fafc', padding: '20px 24px', borderRadius: '18px', border: '1.5px solid #f1f5f9', fontSize: '15px', fontWeight: '700', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div>{assetData?.laptop_details || 'N/A'}</div>
                                        {assetData?.serial_number && (
                                            <div style={{ fontSize: '13px', color: '#64748b' }}>S/N: {assetData.serial_number}</div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ background: '#f8fafc', padding: '30px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                                        <ShieldCheck size={20} color="#059669" />
                                        <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Hardware Peripherals Verified</h3>
                                    </div>

                                    {assetsLoading ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: '800' }}>Fetching verified assets...</div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
                                            {[
                                                { label: 'Optical Mouse', checked: assetData?.mouse === 'Yes' || assetData?.mouse_status === 'Yes' || Number(assetData?.mouse_unit) === 1 },
                                                { label: 'External Keyboard', checked: assetData?.keyboard === 'Yes' || assetData?.keyboard_status === 'Yes' || Number(assetData?.keyboard_unit) === 1 },
                                                { label: 'Laptop Stand', checked: assetData?.laptop_stand === 'Yes' || assetData?.stand === 'Yes' || Number(assetData?.stand_unit) === 1 || Number(assetData?.laptop_stand_unit) === 1 },
                                                { label: 'Company Mobile', checked: assetData?.mobile === 'Yes' || assetData?.mobile_handset === 'Yes' || Number(assetData?.mobile_unit) === 1 },
                                                { label: 'Earphones', checked: assetData?.earphone === 'Yes' || assetData?.headphone === 'Yes' || assetData?.earphone_headphone === 'Yes' || Number(assetData?.earphone_unit) === 1 || Number(assetData?.headphone_unit) === 1 },
                                                { label: 'External Camera', checked: assetData?.camera === 'Yes' || assetData?.webcam === 'Yes' || Number(assetData?.camera_unit) === 1 },
                                                { label: 'Tablet', checked: assetData?.tablet === 'Yes' || Number(assetData?.tablet_unit) === 1 },
                                                { label: 'Pendrive / Storage', checked: assetData?.pendrive === 'Yes' || Number(assetData?.pendrive_unit) === 1 },
                                                { label: 'Ref Pad / Notebook', checked: assetData?.ruf_pad === 'Yes' || assetData?.rufpad === 'Yes' || Number(assetData?.ruf_pad_unit) === 1 || Number(assetData?.ref_pad_unit) === 1 },
                                            ].map((asset, idx) => (
                                                <div key={idx} style={{
                                                    background: asset.checked ? '#f0fdf4' : 'white',
                                                    border: asset.checked ? '1.5px solid #bbf7d0' : '1.5px solid #e2e8f0',
                                                    borderRadius: '16px',
                                                    padding: '16px 10px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '10px',
                                                    textAlign: 'center',
                                                    transition: '0.2s'
                                                }}>
                                                    <div style={{
                                                        width: '24px', height: '24px', borderRadius: '50%',
                                                        background: asset.checked ? '#22c55e' : '#f1f5f9',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                        {asset.checked ? <CheckCircle size={14} color="white" /> : <Package size={14} color="#94a3b8" />}
                                                    </div>
                                                    <span style={{ fontSize: '11px', fontWeight: '800', color: asset.checked ? '#166534' : '#64748b' }}>{asset.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Custom Center Pop-Up Modal */}
            {showSuccessPopup && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999,
                    animation: 'fadeIn 0.25s ease'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '24px', padding: '32px', width: '90%', maxWidth: '420px',
                        boxShadow: '0 20px 50px rgba(15, 23, 42, 0.15)', border: '1.5px solid #e2e8f0', textAlign: 'center',
                        animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%',
                            background: (popupMessage.includes('Approved') || popupMessage.includes('successfully')) ? '#ecfdf5' : (popupMessage.includes('Rejected') || popupMessage.includes('Please')) ? '#fef2f2' : '#f0f9ff',
                            color: (popupMessage.includes('Approved') || popupMessage.includes('successfully')) ? '#10b981' : (popupMessage.includes('Rejected') || popupMessage.includes('Please')) ? '#ef4444' : '#3b82f6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                            boxShadow: (popupMessage.includes('Approved') || popupMessage.includes('successfully')) ? '0 8px 20px rgba(16, 185, 129, 0.15)' : (popupMessage.includes('Rejected') || popupMessage.includes('Please')) ? '0 8px 20px rgba(239, 68, 68, 0.15)' : '0 8px 20px rgba(59, 130, 246, 0.15)'
                        }}>
                            {(popupMessage.includes('Approved') || popupMessage.includes('successfully')) ? <CheckCircle size={28} strokeWidth={3} /> : (popupMessage.includes('Rejected') || popupMessage.includes('Please')) ? <XCircle size={28} strokeWidth={3} /> : <Info size={28} strokeWidth={3} />}
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '950', color: '#0f172a' }}>
                            {popupMessage.includes('Approved') ? 'Approved!' : popupMessage.includes('Rejected') ? 'Rejected!' : popupMessage.includes('successfully') ? 'Success!' : 'Notice'}
                        </h3>
                        <p style={{ margin: '0', fontSize: '13px', fontWeight: '750', color: '#475569', lineHeight: '1.5' }}>
                            {popupMessage}
                        </p>
                    </div>
                </div>
            )}

            {/* Entrance Warning Modal */}
            <AnimatePresence>
                {showEntrancePopup && activeTab === 'submit' && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(8px)',
                        zIndex: 99999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '20px'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            style={{
                                background: 'white', borderRadius: '28px', padding: '40px 30px',
                                maxWidth: '480px', width: '100%', textAlign: 'center',
                                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
                                border: '1px solid #f1f5f9',
                                display: 'flex', flexDirection: 'column', alignItems: 'center'
                            }}
                        >
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                backgroundColor: '#fee2e2', color: '#ef4444',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '24px'
                            }}>
                                <AlertCircle size={32} />
                            </div>
                            <h3 style={{
                                fontSize: '20px', fontWeight: '900', color: '#0f172a',
                                marginBottom: '16px', lineHeight: '1.3'
                            }}>
                                Resignation Approval Required
                            </h3>
                            <p style={{
                                fontSize: '14px', color: '#475569', lineHeight: '1.6',
                                marginBottom: '32px', fontWeight: '600'
                            }}>
                                You should get approval for your resignation first then only you can apply for experience letter.
                            </p>
                            <button
                                onClick={() => setShowEntrancePopup(false)}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '16px',
                                    backgroundColor: '#0f172a', color: 'white', border: 'none',
                                    fontSize: '15px', fontWeight: '800', cursor: 'pointer',
                                    boxShadow: '0 10px 20px rgba(15, 23, 42, 0.15)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Okay
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AppFooter />
        </div>
    );
}

