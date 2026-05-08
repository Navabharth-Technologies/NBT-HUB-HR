import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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


function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginScreen />} />
      </Routes>
    );
  }

  return (
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
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThreadProvider>
          <AppRoutes />
        </ThreadProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
