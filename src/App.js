import React from 'react';
// Import routing components and new login forms
import { Routes, Route } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import StudentLoginForm from './components/StudentLoginForm';
import FacultyLoginForm from './components/FacultyLoginForm';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import CurriculumManagement from './components/CurriculumManagement/CurriculumManagement';
import StudentManagement from './components/StudentManagement/StudentManagement';
import FacultyManagement from './components/FacultyManagement/FacultyManagement';
import CourseManagement from './components/CourseManagement/CourseManagement';
import ScheduleManagement from './components/ScheduleManagement/ScheduleManagement';
import AdminTools from './components/AdminTools/AdminTools';
import StudentDashboard from './components/StudentDashboard';
import StudentSchedule from './components/StudentSchedule/StudentSchedule';
import StudentSettings from './components/StudentSettings';
import StudentGrades from './components/StudentGrades';
import FacultyDashboard from './components/FacultyDashboard/FacultyDashboard';
import FacultySchedule from './components/FacultySchedule/FacultySchedule';
import FacultyGrades from './components/FacultyGrades/FacultyGrades';
import FacultySettings from './components/FacultySettings/FacultySettings';
import StudentEnrollment from './components/StudentEnrollment';
import './index.css'; // Global styles

function App() {
  return (
    <div className="App">
      {/* Use Routes component to define possible routes */}
      <Routes>
        {/* Route for the initial role selection page */}
        <Route path="/" element={<LoginPage />} />

        {/* Route for the Student login form */}
        <Route path="/login/student" element={<StudentLoginForm />} />

        {/* Route for the Faculty/Admin login form */}
        <Route path="/login/faculty" element={<FacultyLoginForm />} />

        {/* Route for the admin dashboard form */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        <Route path="/curriculum-management" element={<CurriculumManagement />} />

        <Route path="/student-management" element={<StudentManagement />} />

        <Route path="/faculty-management" element={<FacultyManagement />} />

        <Route path="/course-management" element={<CourseManagement />} />

        <Route path="/schedule-management" element={<ScheduleManagement />} />

        <Route path="/admin-tools" element={<AdminTools />} />

        <Route path="/student-dashboard" element={<StudentDashboard />} />

        <Route path="/student-schedule" element={<StudentSchedule />} />

        <Route path="/student-settings" element={<StudentSettings />} />

        <Route path="/student-grades" element={<StudentGrades />} />

        <Route path="/faculty-dashboard" element={<FacultyDashboard />} />

        <Route path="/faculty-schedule" element={<FacultySchedule />} />

        <Route path="/faculty-grades" element={<FacultyGrades />} />

        
        <Route path="/faculty-settings" element={<FacultySettings />} />

        <Route path="/enrollment" element={<StudentEnrollment />} />

        {/* Add other routes for dashboards etc. later */}
        {/* Example: <Route path="/dashboard" element={<Dashboard />} /> */}

        {/* Optional: Add a catch-all route for 404 Not Found */}
        <Route path="*" element={<div><h2>404 Not Found</h2><p>The page you requested does not exist.</p><a href='/'>Go Home</a></div>} />
      </Routes>
    </div>
  );
}

export default App;