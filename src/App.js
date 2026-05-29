import { useAuth, AuthProvider } from './context/AuthContext';
import { ThreadProvider } from './context/ThreadContext';
import HRDashboard from './components/profile/HRDashboard';
import PerformanceModule from './components/profile/PerformanceModule';
import CourseModule from './components/profile/CourseModule';
import SuggestionModule from './components/profile/SuggestionModule';
import EngagementModule from './components/profile/EngagementModule';
import EmployeeModule from './components/profile/EmployeeModule';
import NewJoineeModule from './components/profile/NewJoineeModule';
import LoginScreen from './components/profile/LoginScreen';
import AlertScreen from './components/profile/AlertScreen';
import BirthdayScreen from './components/profile/BirthdayScreen';
import HolidayScreen from './components/profile/HolidayScreen';


import TeamsModule from './components/profile/TeamsModule';
import TicketManagement from './components/profile/TicketManagement';
import AttendanceManagement from './components/profile/AttendanceManagement';
import LeaveManagement from './components/profile/LeaveManagement';
import EmployeeAttendanceManagement from './components/profile/EmployeeAttendanceManagement';
import AllEmployeesReport from './components/profile/AllEmployeesReport';
import FunQuiz from './components/profile/FunQuiz';
import LeaveRequestDetail from './components/profile/LeaveRequestDetail';
import PaySlipScreen from './components/profile/PaySlipScreen';
import SalaryStatements from './components/profile/SalaryStatements';
import AwardsScreen from './components/profile/AwardsScreen';
import TeamDetail from './components/profile/TeamDetail';
import ServiceCertificateManagement from './components/profile/ServiceCertificateManagement';
import ServiceCertificateUserScreen from './components/profile/ServiceCertificateUserScreen';
import ResignationManagement from './components/profile/ResignationManagement';
import ResignationUserScreen from './components/profile/ResignationUserScreen';
import PersonalInfo from './components/profile/PersonalInfo';
import AssetsManagement from './components/profile/AssetsManagement';
import JobApplications from './components/profile/JobApplications';
import JobPostings from './components/profile/JobPostings';
import MyLeaves from './components/profile/MyLeaves';

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { WifiOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskNotification from './components/profile/TaskNotification';

function AppRoutes() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null; // Prevent flicker and redirect on refresh

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginScreen />} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<HRDashboard />} />
      <Route path="/performance" element={<PerformanceModule />} />
      <Route path="/profile" element={<Navigate to="/performance" />} />
      <Route path="/courses" element={<CourseModule />} />
      <Route path="/suggestions" element={<SuggestionModule />} />
      <Route path="/engagement" element={<EngagementModule />} />
      <Route path="/employees" element={<EmployeeModule />} />
      <Route path="/new-joinees" element={<NewJoineeModule />} />
      <Route path="/alerts" element={<AlertScreen />} />

      <Route path="/teams" element={<TeamsModule />} />
      <Route path="/teams/:id" element={<TeamDetail />} />
      <Route path="/tickets" element={<TicketManagement />} />
      <Route path="/attendance" element={<AttendanceManagement />} />
      <Route path="/leaves" element={<LeaveManagement />} />
      <Route path="/attendance/detail/:id" element={<EmployeeAttendanceManagement />} />
      <Route path="/attendance/leave/:id" element={<LeaveRequestDetail />} />
      <Route path="/all-employees" element={<AllEmployeesReport />} />
      <Route path="/fun-quiz" element={<FunQuiz />} />
      <Route path="/payslip" element={<PaySlipScreen />} />
      <Route path="/salary-statements" element={<SalaryStatements />} />
      <Route path="/awards" element={<AwardsScreen />} />
      <Route path="/admin/certificates" element={<ServiceCertificateManagement />} />
      <Route path="/admin/resignations" element={<ResignationManagement />} />

      {/* User Hubs */}
      <Route path="/service-certificates" element={<ServiceCertificateUserScreen />} />
      <Route path="/resignations" element={<ResignationUserScreen />} />
      <Route path="/personal-info" element={<PersonalInfo onBack={() => window.history.back()} />} />
      <Route path="/assets" element={<AssetsManagement />} />
      <Route path="/job-applications" element={<JobApplications />} />
      <Route path="/job-postings" element={<JobPostings />} />
      <Route path="/my-leaves" element={<MyLeaves />} />
      <Route path="/birthdays" element={<BirthdayScreen />} />
      <Route path="/holidays" element={<HolidayScreen />} />

    </Routes>
      <TaskNotification onOpenTask={() => navigate('/performance')} />
    </>
  );
}

function NetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      console.log("🌐 App is ONLINE");
      setIsOnline(true);
    };
    const handleOffline = () => {
      console.log("❌ App is OFFLINE");
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Polling fallback - every 1 second with verification
    const interval = setInterval(() => {
      const currentStatus = navigator.onLine;
      if (currentStatus !== isOnline) {
        // Double check to prevent flickering
        setTimeout(() => {
          if (navigator.onLine === currentStatus) {
            setIsOnline(currentStatus);
          }
        }, 500);
      }
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  return (
    <>
      {!isOnline && (
        <div
          style={{
            position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
            background: '#ef4444', color: 'white', padding: '12px 24px',
            borderRadius: '16px', zIndex: 2147483647,
            display: 'flex', alignItems: 'center', gap: '12px',
            boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
            border: '2px solid rgba(255,255,255,0.2)',
            animation: 'slideDown 0.4s ease-out, pulse 2s infinite',
            fontWeight: '800', fontSize: '15px', letterSpacing: '0.5px'
          }}
        >
          <WifiOff size={20} />
          NETWORK DISCONNECTED • PLEASE RECONNECT
          <style>{`
            @keyframes slideDown {
              from { transform: translate(-50%, -100px); opacity: 0; }
              to { transform: translate(-50%, 0); opacity: 1; }
            }
            @keyframes pulse {
              0% { transform: translate(-50%, 0) scale(1); }
              50% { transform: translate(-50%, 0) scale(1.02); }
              100% { transform: translate(-50%, 0) scale(1); }
            }
          `}</style>
        </div>
      )}
      {!isOnline && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          zIndex: 2147483646, cursor: 'not-allowed'
        }} />
      )}
    </>
  );
}

function App() {
  return (
    <>
      <NetworkStatus />
      <AuthProvider>
        <ThreadProvider>
          <AppRoutes />
          <style>{`
            html, body {
              overflow: auto;
              width: 100%;
              position: static;
              margin: 0;
              padding: 0;
              touch-action: pan-y;
              overscroll-behavior-x: none;
            }
            * {
              box-sizing: border-box;
            }
          `}</style>
        </ThreadProvider>
      </AuthProvider>
    </>
  );
}

export default App;
