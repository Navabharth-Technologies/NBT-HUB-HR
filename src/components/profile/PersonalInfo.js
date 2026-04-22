import React, { useState, useEffect, cloneElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronDown, Save, CreditCard, Building2, FileText,
  Shield, AlertCircle, CheckCircle2, User, Hash, Landmark, RefreshCw,
  Briefcase, MapPin, Mail, Phone, GraduationCap, History, DollarSign,
  FileCheck, Users, Calendar, Heart, Globe, Trash2, Pencil, Upload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL, API_ENDPOINTS } from '../../config';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';

const LOCKED_FIELDS = ['gross_salary_a', 'salary', 'pt', 'bgv_status', 'approved_by_ceo'];

const SECTIONS = [
  {
    id: 'primary',
    label: 'Primary Profile',
    icon: <User size={20} />,
    color: '#3b82f6',
    fields: [
      { key: 'emp_name', label: 'Employee Name', placeholder: 'Full Name', type: 'text' },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
      { key: 'dob', label: 'Date of Birth', type: 'text', placeholder: 'DD-MM-YYYY' },
      { key: 'age', label: 'Age', type: 'text', placeholder: 'Years' },
      { key: 'religion', label: 'Religion', type: 'text' },
      { key: 'blood_group', label: 'Blood Group', type: 'text' },
      { key: 'marital_status', label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed'] },
      { key: 'nationality', label: 'Nationality', type: 'text', placeholder: 'e.g. Indian' },
      { key: 'father_husband_name', label: "Father/Husband's Name", type: 'text' },
      { key: 'category', label: 'Category', type: 'select', options: ['General', 'OBC', 'SC', 'ST', 'Other'] },
      { key: 'pan_number', label: 'PAN Number', type: 'text', placeholder: 'ABCDE1234F' },
      { key: 'pan_proof', label: 'PAN Card Proof', type: 'file' },
      { key: 'aadhar_number', label: 'Aadhar Number', type: 'text', placeholder: '1234 5678 9012' },
      { key: 'aadhar_proof', label: 'Aadhar Card Proof', type: 'file' },
      { key: 'voter_id', label: 'Voter ID Number', type: 'text' },
      { key: 'voter_proof', label: 'Voter ID Proof', type: 'file' },
      { key: 'passport_no', label: 'Passport No', type: 'text' },
      { key: 'passport_proof', label: 'Passport Proof', type: 'file' },
    ]
  },
  {
    id: 'hierarchy',
    label: 'Organizational Hierarchy',
    icon: <Building2 size={20} />,
    color: '#8b5cf6',
    fields: [
      { key: 'designation', label: 'Designation', type: 'text' },
      { key: 'department', label: 'Department', type: 'text' },
      { key: 'process', label: 'Process', type: 'text' },
      { key: 'supervisor_l1', label: 'Supervisor L1 (Reporting Person)', type: 'text' },
      { key: 'supervisor_l2', label: 'Supervisor L2', type: 'text' },
      { key: 'doj', label: 'Date of Joining', type: 'text', placeholder: 'DD-MM-YYYY' },
      { key: 'ft_pt', label: 'FT/PT', type: 'select', options: ['Full Time', 'Part Time', 'Contract'] },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'On Bench', 'Notice Period', 'Terminated'] },
      { key: 'place', label: 'Work Location', type: 'text' },
      { key: 'moved', label: 'Moved (Project/Dept)', type: 'text' },
      { key: 'official_email', label: 'Official Email ID', type: 'text' },
    ]
  },
  {
    id: 'contact',
    label: 'Contact & Geography',
    icon: <MapPin size={20} />,
    color: '#10b981',
    fields: [
      { key: 'contact_no', label: 'Contact No', type: 'text' },
      { key: 'emergency_contact_no', label: 'Emergency Contact No', type: 'text' },
      { key: 'personal_email', label: 'Personal Email ID', type: 'text' },
      { key: 'present_address', label: 'Present Address', type: 'text' },
      { key: 'permanent_address', label: 'Permanent Address', type: 'text' },
      { key: 'state', label: 'State', type: 'text' },
    ]
  },
  {
    id: 'academic',
    label: 'Academic & Career',
    icon: <GraduationCap size={20} />,
    color: '#f59e0b',
    fields: [
      { key: 'qualification', label: 'Qualification', type: 'text' },
      { key: 'edu_completion_year', label: 'EDU Completion Year', type: 'text' },
      { key: 'college', label: 'College', type: 'text' },
      { key: 'university', label: 'University', type: 'text' },
      { key: 'previous_org', label: 'Previous Organization', type: 'text' },
      { key: 'previous_exp', label: 'Previous Experience', type: 'text' },
      { key: 'source', label: 'Source', type: 'text' },
      { key: 'languages_known', label: 'Languages Known', type: 'text' },
    ]
  },
  {
    id: 'exit',
    label: 'Exit & Retention',
    icon: <History size={20} />,
    color: '#ef4444',
    fields: [
      { key: 'separation', label: 'Separation Date', type: 'text', placeholder: 'DD-MM-YYYY' },
      { key: 'lwd', label: 'Last Working Day (LWD)', type: 'text' },
      { key: 'attrition_bucket', label: 'Attrition Bucket', type: 'select', options: ['N/A', 'Resignation', 'Performance', 'Behavioral', 'Medical'] },
      { key: 'reason', label: 'Reason of Separation', type: 'text' },
    ]
  },
  {
    id: 'finance',
    label: 'Banking & Finance',
    icon: <Landmark size={20} />,
    color: '#315A9E',
    fields: [
      { key: 'bank_name', label: 'Bank Name', type: 'text' },
      { key: 'bank_account_no', label: 'Bank Account No.', type: 'text' },
      { key: 'ifsc_code', label: 'IFSC Code', type: 'text' },
      { key: 'bank_branch', label: 'Bank Branch', type: 'text' },
      { key: 'gross_salary_a', label: 'Gross Salary (A)', type: 'text' },
      { key: 'salary', label: 'Net Salary', type: 'text' },
      { key: 'pt', label: 'Professional Tax (PT)', type: 'text' },
    ]
  },
  {
    id: 'compliance',
    label: 'Compliance & Docs',
    icon: <FileCheck size={20} />,
    color: '#0ea5e9',
    fields: [
      { key: 'bgv_status', label: 'BGV Status', type: 'select', options: ['Pending', 'Completed', 'Failed'] },
      { key: 'appointment_letter', label: 'Appointment Letter', type: 'select', options: ['Not Sent', 'Sent', 'Signed'] },
      { key: 'approved_by_ceo', label: 'Approved By CEO', type: 'select', options: ['No', 'Yes'] },
      { key: 'onboarding_doc_completed', label: 'Onboarding Doc Completed', type: 'select', options: ['No', 'Yes'] },
      { key: 'id_card', label: 'ID Card Status', type: 'select', options: ['Not Issued', 'Issued'] },
      { key: 'onboarding_link', label: 'Onboarding Link', type: 'text' },
    ]
  }
];

export default function PersonalInfo({ onBack }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    emp_name: '', gender: 'Male', dob: '', age: '', religion: '', blood_group: '', marital_status: 'Single', nationality: 'Indian', father_husband_name: '', pan_number: '', aadhar_number: '', category: 'General',
    pan_proof: '', aadhar_proof: '', voter_id: '', voter_proof: '', passport_no: '', passport_proof: '',
    designation: '', department: '', process: '', supervisor_l1: '', supervisor_l2: '', doj: '', ft_pt: 'Full Time', status: 'Active', place: '', moved: '', official_email: '',
    contact_no: '', emergency_contact_no: '', personal_email: '', present_address: '', permanent_address: '', state: '',
    qualification: '', edu_completion_year: '', college: '', university: '', previous_org: '', previous_exp: '', source: '', languages_known: '',
    separation: '', lwd: '', attrition_bucket: 'N/A', reason: '',
    bank_name: '', bank_account_no: '', ifsc_code: '', bank_branch: '', gross_salary_a: '', salary: '', pt: '',
    bgv_status: 'Pending', appointment_letter: 'Not Sent', approved_by_ceo: 'No', onboarding_doc_completed: 'No', id_card: 'Not Issued', onboarding_link: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [winWidth, setWinWidth] = useState(window.innerWidth);
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const isMobile = winWidth < 768;
  const isTablet = winWidth < 1024;
  const [activeSection, setActiveSection] = useState('primary');
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState({});

  useEffect(() => {
    const savedId = localStorage.getItem('last_selected_emp_id');
    const currentUserId = user?.employee_id || user?.id || user?.email || user?.EmpID;
    
    if (savedId) {
      setSelectedEmpId(savedId);
    } else if (currentUserId && !selectedEmpId) {
      setSelectedEmpId(currentUserId);
    }
  }, [user]);

  useEffect(() => {
    // Enable fetching for all users as per request for persistent access
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BASE_URL}/api/employees`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setEmployees(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      }
    };
    fetchEmployees();
  }, [user]);

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const uid = selectedEmpId;
        if (!uid) return;

        // Reset form to baseline state
        const emptyForm = {
          emp_name: '', gender: 'Male', dob: '', age: '', religion: '', blood_group: '', marital_status: 'Single', nationality: 'Indian', father_husband_name: '', pan_number: '', aadhar_number: '', category: 'General',
          pan_proof: '', aadhar_proof: '', voter_id: '', voter_proof: '', passport_no: '', passport_proof: '',
          designation: '', department: '', process: '', supervisor_l1: '', supervisor_l2: '', doj: '', ft_pt: 'Full Time', status: 'Active', place: '', moved: '', official_email: '',
          contact_no: '', emergency_contact_no: '', personal_email: '', present_address: '', permanent_address: '', state: '',
          qualification: '', edu_completion_year: '', college: '', university: '', previous_org: '', previous_exp: '', source: '', languages_known: '',
          separation: '', lwd: '', attrition_bucket: 'N/A', reason: '',
          bank_name: '', bank_account_no: '', ifsc_code: '', bank_branch: '', gross_salary_a: '', salary: '', pt: '',
          bgv_status: 'Pending', appointment_letter: 'Not Sent', approved_by_ceo: 'No', onboarding_doc_completed: 'No', id_card: 'Not Issued', onboarding_link: ''
        };
        setForm(emptyForm);

        const token = localStorage.getItem('token');
        const res = await fetch(API_ENDPOINTS.EMPLOYEE_PROFILE_GET(uid), {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          let response = await res.json();
          
          // Unwrap common API response envelopes
          let data = response.data || response.profile || response.record || response;
          if (Array.isArray(data)) data = data[0];
          
          if (!data || typeof data !== 'object') return;

          // Check if profile has any real content (excluding base identifiers)
          const hasMetadata = Object.keys(data).some(k => 
            !['id', 'name', 'employee_id', 'email', 'EmpID', 'emp_name'].includes(k.toLowerCase()) && 
            data[k] !== null && data[k] !== ''
          );
          
          if (!hasMetadata && String(uid) !== String(user?.employee_id || user?.id || user?.email)) {
            setToast({ type: 'info', msg: 'This employee has a baseline record but no granular metadata yet.' });
          }

          // Case-insensitive mapping to form keys
          const cleanData = {};
          Object.keys(data).forEach(apiKey => {
            const val = data[apiKey];
            // Normalize nulls and undefined to empty strings for text fields to avoid 'Not Provided' showing incorrectly
            const normalizedVal = (val === null || val === undefined) ? '' : val;
            
            const lowerKey = apiKey.toLowerCase();
            const targetKey = Object.keys(emptyForm).find(formKey => formKey.toLowerCase() === lowerKey) || apiKey;
            cleanData[targetKey] = normalizedVal;
          });

          setForm(prev => ({ ...prev, ...cleanData }));
        } else {
           if (String(uid) !== String(user?.employee_id || user?.id || user?.email)) {
             setToast({ type: 'info', msg: 'Unable to reach profile metadata for this employee.' });
           }
        }
      } catch (err) {
        console.error("Failed to sync profile info:", err);
      }
    };
    loadDocs();
  }, [selectedEmpId]);

  const handleFileSelect = async (key, file) => {
    if (!file) return;
    setIsEditing(true);
    setUploadingFiles(prev => ({ ...prev, [key]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('employee_id', selectedEmpId);
      formData.append('type', key);

      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.PROFILE_UPLOAD_DOC, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const url = data.url || data.filePath || data.path || data.record?.path;
        if (url) {
          setForm(prev => ({ ...prev, [key]: url }));
          setToast({ type: 'success', msg: `${key.replace('_', ' ').toUpperCase()} Attached!` });
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setToast({ type: 'error', msg: errData.message || 'Upload failed.' });
      }
    } catch (err) {
      console.error("Upload error:", err);
      setToast({ type: 'error', msg: 'Network error during upload.' });
    } finally {
      setUploadingFiles(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleChange = (key, value) => {
    let updates = { [key]: value };

    // Auto-calculate age based on Date of Birth (DD-MM-YYYY)
    if (key === 'dob' && value && value.length === 10) {
      const parts = value.split('-');
      if (parts.length === 3) {
        // Format: Day-Month-Year
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed
        const year = parseInt(parts[2], 10);
        
        const birthDate = new Date(year, month, day);
        if (!isNaN(birthDate.getTime())) {
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          if (age >= 0) {
            updates.age = String(age);
          }
        }
      }
    }

    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const uid = selectedEmpId;
      const token = localStorage.getItem('token');
      // Using the New Iron-Clad Upsert API
      const res = await fetch(API_ENDPOINTS.EMPLOYEE_PROFILE_UPDATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...form, employee_id: uid, id: uid })
      });
      if (res.ok) {
        setToast({ type: 'success', msg: 'Profile Info updated successfully!' });
        setIsEditing(false);
      } else {
        setToast({ type: 'error', msg: 'Failed to save. Please try again.' });
      }
    } catch {
      setToast({ type: 'error', msg: 'Network error. Please check your connection.' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDelete = async () => {
    const isSelf = String(selectedEmpId) === String(user?.id || user?.employee_id || user?.email);
    if (isSelf) {
      alert("You cannot delete your own profile data.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this employee's granular profile data? This action cannot be undone and will reset their metadata record.")) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.EMPLOYEE_PROFILE_DELETE(selectedEmpId), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setToast({ type: 'success', msg: 'Metadata record deleted successfully.' });
        // Reset form and reload
        setForm({
          emp_name: '', gender: 'Male', dob: '', age: '', religion: '', blood_group: '', marital_status: 'Single', nationality: 'Indian', father_husband_name: '', pan_number: '', aadhar_number: '', category: 'General',
          pan_proof: '', aadhar_proof: '', voter_id: '', voter_proof: '', passport_no: '', passport_proof: '',
          designation: '', department: '', process: '', supervisor_l1: '', supervisor_l2: '', doj: '', ft_pt: 'Full Time', status: 'Active', place: '', moved: '', official_email: '',
          contact_no: '', emergency_contact_no: '', personal_email: '', present_address: '', permanent_address: '', state: '',
          qualification: '', edu_completion_year: '', college: '', university: '', previous_org: '', previous_exp: '', source: '', languages_known: '',
          separation: '', lwd: '', attrition_bucket: 'N/A', reason: '',
          bank_name: '', bank_account_no: '', ifsc_code: '', bank_branch: '', gross_salary_a: '', salary: '', pt: '',
          bgv_status: 'Pending', appointment_letter: 'Not Sent', approved_by_ceo: 'No', onboarding_doc_completed: 'No', id_card: 'Not Issued', onboarding_link: ''
        });
      } else {
        setToast({ type: 'error', msg: 'Failed to delete metadata.' });
      }
    } catch {
      setToast({ type: 'error', msg: 'Network error.' });
    }
  };

  const currentSection = SECTIONS.find(s => s.id === activeSection);
  const userRole = user?.role?.toLowerCase() || 'employee';
  const isAdmin = ['admin', 'manager', 'lead', 'teamleader', 'ceo', 'hr'].includes(userRole);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fa', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      
      <div style={{ flex: 1, padding: isMobile ? '15px' : (isTablet ? '25px' : '40px'), boxSizing: 'border-box', overflowX: 'hidden', width: '100%', marginTop: isMobile ? '80px' : '70px' }}>
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              style={{
                position: 'fixed', top: isMobile ? '20px' : '110px', left: '50%', transform: 'translateX(-50%)',
                zIndex: 9999, backgroundColor: toast.type === 'success' ? '#0B1E3F' : '#ef4444',
                color: 'white', padding: isMobile ? '10px 20px' : '14px 28px', borderRadius: '16px',
                display: 'flex', alignItems: 'center', gap: '10px', width: isMobile ? '90%' : 'auto',
                fontWeight: '800', fontSize: '14px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                justifyContent: 'center'
              }}
            >
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', marginBottom: '32px', flexDirection: isMobile ? 'column' : 'row', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px', justifyContent: isMobile ? 'center' : 'flex-start' }}>
            <button onClick={onBack} style={{ padding: isMobile ? '8px' : '12px', borderRadius: '14px', backgroundColor: 'white', border: '1.5px solid #e2e8f0', cursor: 'pointer' }}>
              <ChevronLeft size={isMobile ? 18 : 22} color="#0B1E3F" />
            </button>
            <div>
              <h1 style={{ fontSize: isMobile ? '22px' : '32px', fontWeight: '900', color: '#0B1E3F', margin: 0 }}>Profile Info</h1>
              <p style={{ fontSize: isMobile ? '12px' : '14px', color: '#64748b', margin: '2px 0 0 0', fontWeight: '600' }}>Employee metadata record</p>
            </div>
          </div>
          
          {/* PERSISTENT EMPLOYEE SELECTION DROPDOWN - DO NOT REMOVE OR OVERWRITE THIS BLOCK */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ position: 'relative', minWidth: isMobile ? '100%' : '240px' }}>
              <Users size={16} color="#64748b" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
              <select
                value={selectedEmpId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedEmpId(newId);
                  localStorage.setItem('last_selected_emp_id', newId);
                  setIsEditing(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  borderRadius: '16px',
                  border: '1.5px solid #e2e8f0',
                  backgroundColor: 'white',
                  color: '#0B1E3F',
                  fontSize: '14px',
                  fontWeight: '800',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                }}
              >
                <option value={user?.employee_id || user?.id || user?.email || user?.EmpID}>
                  My Profile ({user?.name || 'Self'}) - {user?.employee_id || user?.EmpID || 'Self'}
                </option>
                {employees
                  .filter(emp => {
                    const empId = emp.employee_id || emp.EmpID || emp.id;
                    const currentUserId = user?.employee_id || user?.id || user?.email || user?.EmpID;
                    return empId && String(empId) !== String(currentUserId);
                  })
                  .map(emp => {
                    const empId = emp.employee_id || emp.EmpID || emp.id;
                    const empName = emp.name || emp.emp_name || emp.Name;
                    return (
                      <option key={empId} value={empId}>
                        {empName} ({empId})
                      </option>
                    );
                  })
                }
              </select>
              <ChevronDown size={14} color="#64748b" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>

            {isAdmin && String(selectedEmpId) !== String(user?.id || user?.employee_id || user?.email || user?.EmpID) && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleDelete}
                style={{
                  padding: '14px', backgroundColor: '#fee2e2', color: '#ef4444',
                  border: '1.5px solid #fecaca', borderRadius: '16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                title="Delete Profile Data"
              >
                <Trash2 size={20} />
              </motion.button>
            )}

            {isEditing ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: isMobile ? '10px 20px' : '14px 28px', backgroundColor: '#315A9E', color: 'white',
                border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: isMobile ? '13px' : '15px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 8px 20px rgba(49,90,158,0.25)',
                justifyContent: 'center', alignSelf: isMobile ? 'center' : 'auto',
                width: isMobile ? 'fit-content' : 'auto'
              }}
            >
              {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
              {saving ? 'Publishing...' : 'Save All Details'}
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsEditing(true)}
              style={{
                padding: isMobile ? '10px 20px' : '14px 28px', backgroundColor: 'white', color: '#0B1E3F',
                border: '1.5px solid #0B1E3F', borderRadius: '16px', fontWeight: '900', fontSize: isMobile ? '13px' : '15px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                justifyContent: 'center', alignSelf: isMobile ? 'center' : 'auto',
                width: isMobile ? 'fit-content' : 'auto'
              }}
            >
              <Pencil size={16} />
              Edit Profile
            </motion.button>
          )}
        </div>
      </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '280px 1fr', gap: '24px', alignItems: 'start' }}>
          <div style={{ width: isMobile ? '92%' : '100%', margin: isMobile ? '0 auto' : '0' }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'row' : 'column', 
              gap: '10px',
              overflowX: isMobile ? 'auto' : 'visible',
              paddingBottom: isMobile ? '10px' : '0',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              {SECTIONS.map(sec => {
                const isActive = activeSection === sec.id;
                return (
                  <motion.button
                    key={sec.id}
                    whileHover={!isMobile ? { x: 4 } : {}}
                    onClick={() => setActiveSection(sec.id)}
                    style={{
                      padding: isMobile ? '8px 14px' : '16px 20px', 
                      borderRadius: isMobile ? '12px' : '18px', 
                      border: 'none', 
                      cursor: 'pointer',
                      backgroundColor: isActive ? '#0B1E3F' : 'white',
                      color: isActive ? 'white' : '#475569',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: isMobile ? '10px' : '14px',
                      fontWeight: '800', 
                      fontSize: isMobile ? '12px' : '15px', 
                      textAlign: 'left',
                      border: `1.5px solid ${isActive ? '#0B1E3F' : '#e2e8f0'}`,
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    <div style={{ color: isActive ? 'white' : sec.color }}>{cloneElement(sec.icon, { size: isMobile ? 16 : 20 })}</div>
                    <div>{sec.label}</div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            style={{ 
              backgroundColor: 'white', 
              borderRadius: isMobile ? '20px' : '28px', 
              padding: isMobile ? '24px' : '40px', 
              border: '1.5px solid #e2e8f0', 
              boxSizing: 'border-box', 
              width: isMobile ? '92%' : '100%', 
              margin: isMobile ? '0 auto' : '0',
              boxShadow: '0 10px 40px rgba(0,0,0,0.03)' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' }}>
              <div style={{ padding: '12px', borderRadius: '16px', backgroundColor: `${currentSection.color}15`, flexShrink: 0 }}>
                <div style={{ color: currentSection.color }}>{currentSection.icon}</div>
              </div>
              <div>
                <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '900', color: '#0B1E3F', margin: 0 }}>{currentSection.label}</h2>
                <p style={{ fontSize: isMobile ? '12px' : '14px', color: '#94a3b8', margin: '4px 0 0 0', fontWeight: '600' }}>Official employee metadata records</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
              {(() => {
                const fields = currentSection.fields;
                const items = [];
                for (let i = 0; i < fields.length; i++) {
                  const f = fields[i];
                  const next = fields[i + 1];
                  // Detect pairs (Number Field + File/Proof Field)
                  if (next && next.type === 'file' && (f.key.toLowerCase().includes('number') || f.key.toLowerCase().includes('_id') || f.key.toLowerCase().includes('_no'))) {
                    items.push({ type: 'pair', f1: f, f2: next });
                    i++; // Skip next field as it's paired
                  } else {
                    items.push({ type: 'single', f: f });
                  }
                }

                return items.map((item, idx) => {
                  if (item.type === 'pair') {
                    const { f1, f2 } = item;
                    const isLocked1 = LOCKED_FIELDS.includes(f1.key) && !isAdmin;
                    const isLocked2 = LOCKED_FIELDS.includes(f2.key) && !isAdmin;
                    
                    return (
                      <div key={f1.key} style={{ display: 'flex', flexDirection: 'column', gap: '16px', gridColumn: isMobile ? 'span 1' : 'auto' }}>
                        {/* Number Field */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: isLocked1 ? 0.7 : 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{f1.label}</label>
                            {isLocked1 && <Shield size={10} color="#94a3b8" />}
                          </div>
                          <input
                            type="text"
                            value={form[f1.key]}
                            readOnly={!isEditing || isLocked1}
                            onChange={e => handleChange(f1.key, e.target.value)}
                            placeholder={isEditing ? (f1.placeholder || `Enter ${f1.label}`) : 'Not Provided'}
                            style={{
                              width: '100%', padding: '16px 20px', borderRadius: '16px', fontSize: isMobile ? '14px' : '16px',
                              fontWeight: '700', color: (!isEditing || isLocked1) ? '#94a3b8' : '#1e293b', backgroundColor: (!isEditing || isLocked1) ? '#f1f5f9' : '#f8fafc',
                              border: (isEditing && !isLocked1) ? '2px solid #315A9E' : '2px solid #e2e8f0', outline: 'none', boxSizing: 'border-box',
                              transition: 'all 0.2s', cursor: (!isEditing || isLocked1) ? 'default' : 'text'
                            }}
                          />
                        </div>
                        {/* Proof Field */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: isLocked2 ? 0.7 : 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{f2.label}</label>
                            {isLocked2 && <Shield size={10} color="#94a3b8" />}
                          </div>
                          <div style={{
                            border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '20px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                            background: '#f8fafc', position: 'relative', transition: 'all 0.3s'
                          }}>
                            {form[f2.key] ? (
                              <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#10b98115', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileCheck size={20} color="#10b981" />
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '13px', fontWeight: '900', color: '#10b981' }}>DOCUMENT ATTACHED</div>
                                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>Proof is securely stored</div>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                                  <a href={`${BASE_URL}${form[f2.key].startsWith('/') ? '' : '/'}${form[f2.key]}`} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#315A9E', fontWeight: '900', textDecoration: 'none', padding: '6px 12px', background: '#315A9E10', borderRadius: '8px' }}>VIEW PROOF</a>
                                  {isEditing && (
                                    <button onClick={() => setForm(prev => ({ ...prev, [f2.key]: '' }))} style={{ border: 'none', background: '#ef444410', color: '#ef4444', fontSize: '11px', fontWeight: '900', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px' }}>REMOVE</button>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#315A9E15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Upload size={24} color="#315A9E" />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '14px', fontWeight: '900', color: '#0B1E3F', letterSpacing: '0.5px' }}>UPLOAD PROOF</div>
                                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', marginTop: '2px' }}>Select from Gallery or Camera</div>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*,.pdf,application/pdf"
                                  disabled={isLocked2}
                                  onChange={e => handleFileSelect(f2.key, e.target.files[0])}
                                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: isLocked2 ? 'default' : 'pointer' }}
                                />
                                {uploadingFiles[f2.key] && (
                                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', zIndex: 2 }}>
                                    <RefreshCw size={24} className="spin" color="#315A9E" />
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const field = item.f;
                  const isLockedForRole = LOCKED_FIELDS.includes(field.key) && !isAdmin;
                  const isDisabled = !isEditing || isLockedForRole;

                  return (
                    <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: isLockedForRole ? 0.7 : 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                          {field.label}
                        </label>
                        {isLockedForRole && <Shield size={10} color="#94a3b8" />}
                      </div>
                      {field.type === 'file' ? (
                        <div style={{
                          border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '20px',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                          background: '#f8fafc', position: 'relative', transition: 'all 0.3s'
                        }}>
                          {form[field.key] ? (
                            <>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                 <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#10b98115', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                   <FileCheck size={20} color="#10b981" />
                                 </div>
                                 <div>
                                   <div style={{ fontSize: '13px', fontWeight: '900', color: '#10b981' }}>DOCUMENT ATTACHED</div>
                                   <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>Proof is securely stored</div>
                                 </div>
                               </div>
                               <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                                 <a href={`${BASE_URL}${form[field.key].startsWith('/') ? '' : '/'}${form[field.key]}`} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#315A9E', fontWeight: '900', textDecoration: 'none', padding: '6px 12px', background: '#315A9E10', borderRadius: '8px' }}>VIEW PROOF</a>
                                 {isEditing && (
                                   <button onClick={() => setForm(prev => ({ ...prev, [field.key]: '' }))} style={{ border: 'none', background: '#ef444410', color: '#ef4444', fontSize: '11px', fontWeight: '900', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px' }}>REMOVE</button>
                                 )}
                               </div>
                            </>
                          ) : (
                            <>
                              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#315A9E15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Upload size={24} color="#315A9E" />
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '14px', fontWeight: '900', color: '#0B1E3F', letterSpacing: '0.5px' }}>UPLOAD PROOF</div>
                                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', marginTop: '2px' }}>Select from Gallery or Camera</div>
                              </div>
                              <input
                                type="file"
                                accept="image/*,.pdf,application/pdf"
                                onChange={e => handleFileSelect(field.key, e.target.files[0])}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                              />
                              {uploadingFiles[field.key] && (
                               <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', zIndex: 2 }}>
                                 <RefreshCw size={24} className="spin" color="#315A9E" />
                               </div>
                              )}
                            </>
                          )}
                        </div>
                      ) : field.type === 'select' ? (
                        <select
                          value={form[field.key]}
                          disabled={isDisabled}
                          onChange={e => handleChange(field.key, e.target.value)}
                          style={{
                            width: '100%', padding: '16px 20px', borderRadius: '16px', fontSize: isMobile ? '14px' : '16px',
                            fontWeight: '700', color: isDisabled ? '#94a3b8' : '#1e293b', backgroundColor: isDisabled ? '#f1f5f9' : '#f8fafc',
                            border: !isDisabled ? '2px solid #315A9E' : '2px solid #e2e8f0', outline: 'none', cursor: isDisabled ? 'default' : 'pointer', appearance: 'none', boxSizing: 'border-box',
                            transition: 'all 0.2s'
                          }}
                        >
                          {field.options.map(o => <option key={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={form[field.key]}
                          readOnly={isDisabled}
                          onChange={e => handleChange(field.key, e.target.value)}
                          placeholder={isEditing ? (field.placeholder || `Enter ${field.label}`) : 'Not Provided'}
                          style={{
                            width: '100%', padding: '16px 20px', borderRadius: '16px', fontSize: isMobile ? '14px' : '16px',
                            fontWeight: '700', color: isDisabled ? '#94a3b8' : '#1e293b', backgroundColor: isDisabled ? '#f1f5f9' : '#f8fafc',
                            border: !isDisabled ? '2px solid #315A9E' : '2px solid #e2e8f0', outline: 'none', boxSizing: 'border-box',
                            transition: 'all 0.2s', cursor: isDisabled ? 'default' : 'text'
                          }}
                        />
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </motion.div>
        </div>
      </div>
      
      <AppFooter />

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
