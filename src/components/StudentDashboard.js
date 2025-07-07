import React, { useState, useEffect } from 'react';
import './StudentDashboard.module.css';
import Sidebar from './StudentSidebar';
import { useStudentData } from '../hooks/useStudentData';
import { enrolledCourseAPI } from '../services/api';

const StudentDashboard = () => {
  const { studentData, loading: studentLoading, error: studentError, getStudentName, getUserInfo } = useStudentData();
  const studentId = studentData?.id;

  const [dashboardData, setStudentDashboardData] = useState({});

  // Schedule state
  const [scheduleList, setScheduleList] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [showGraduationModal, setShowGraduationModal] = useState(false);
  
  const [enrollmentForm, setEnrollmentForm] = useState({
    studentId: '',
    semester: '',
    academicYear: '',
    courses: []
  });

  const [graduationForm, setGraduationForm] = useState({
    studentId: '',
    program: '',
    expectedGraduation: '',
    applicationDate: ''
  });

  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.getDate());

  // Fetch schedule from backend
  useEffect(() => {
    if (!studentId || studentLoading) return;
    
    console.log('Fetching schedule for student ID:', studentId);
    setScheduleLoading(true);
    
    enrolledCourseAPI.getEnrolledCoursesByStudent(studentId)
      .then(res => {
        console.log('Raw enrolled courses response:', res);
        console.log('Enrolled courses data:', res.data);
        console.log('Number of enrolled courses:', res.data?.length || 0);
        
        // Filter only active enrollments and map to schedule format
        const mapped = (res.data || [])
          .filter(ec => {
            console.log('Checking enrollment status:', ec.status);
            return ec.status === 'Enrolled' || ec.status === 'ENROLLED';
          })
          .map((ec) => {
            console.log('Processing enrollment for schedule:', ec);
            console.log('Enrollment data:', {
              courseCode: ec.courseCode,
              courseDescription: ec.courseDescription,
              sectionName: ec.sectionName,
              faculty: ec.faculty,
              startTime: ec.startTime,
              endTime: ec.endTime,
              day: ec.day,
              room: ec.room
            });
            
            // Use the DTO fields directly since they're already mapped properly
            return {
              courseCode: ec.courseCode || 'N/A',
              course: ec.courseDescription || 'Unknown Course',
              section: ec.sectionName || 'N/A',
              instructor: ec.faculty || 'TBA',
              room: ec.room || 'TBA',
              day: ec.day || 'TBA',
              timeFrom: ec.startTime ? ec.startTime.substring(0, 5) : 'TBA',
              timeTo: ec.endTime ? ec.endTime.substring(0, 5) : 'TBA',
              status: ec.status
            };
          });
        console.log('Final mapped schedule data:', mapped);
        setScheduleList(mapped);
      })
      .catch((error) => {
        console.error('Error fetching enrolled courses:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setScheduleList([]);
      })
      .finally(() => setScheduleLoading(false));
  }, [studentId, studentLoading]);

  // Helper function to get day name from date
  const getDayName = (date, month, year) => {
    const dateObj = new Date(year, month, date);
    return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Format time for display
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour12 = hours % 12 || 12;
    const ampm = hours < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Get schedule for selected date
  const getScheduleForDate = () => {
    const selectedDayName = getDayName(selectedDate, calendarMonth, calendarYear);
    return scheduleList.filter(schedule => schedule.day === selectedDayName);
  };

  // Generate calendar days for the selected month/year
  const generateCalendarDays = () => {
    const days = [];
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const prevMonthDays = new Date(calendarYear, calendarMonth, 0).getDate();

    // Previous month's ending days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        isSelected: day === selectedDate && calendarMonth === calendarMonth && calendarYear === calendarYear,
        isToday: day === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear()
      });
    }

    return days;
  };

  // Calendar navigation handlers
  const goToPrevMonth = () => {
    setCalendarMonth(prev => {
      if (prev === 0) {
        setCalendarYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
    setSelectedDate(1);
  };

  const goToNextMonth = () => {
    setCalendarMonth(prev => {
      if (prev === 11) {
        setCalendarYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
    setSelectedDate(1);
  };

  // Enrollment Modal functions
  const showEnrollmentForm = () => {
    setShowEnrollmentModal(true);
  };

  const closeEnrollmentModal = () => {
    setShowEnrollmentModal(false);
    setEnrollmentForm({
      studentId: '',
      semester: '',
      academicYear: '',
      courses: []
    });
  };

  const handleEnrollmentFormChange = (field, value) => {
    setEnrollmentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEnrollment = () => {
    // Validate required fields
    if (!enrollmentForm.studentId || !enrollmentForm.semester || !enrollmentForm.academicYear) {
      alert('Please fill in all required fields');
      return;
    }
    
    console.log('Processing enrollment:', enrollmentForm);
    alert('Enrollment processed successfully!');
    closeEnrollmentModal();
  };

  // Graduation Modal functions
  const showGraduationForm = () => {
    setShowGraduationModal(true);
  };

  const closeGraduationModal = () => {
    setShowGraduationModal(false);
    setGraduationForm({
      studentId: '',
      program: '',
      expectedGraduation: '',
      applicationDate: ''
    });
  };

  const handleGraduationFormChange = (field, value) => {
    setGraduationForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGraduation = () => {
    // Validate required fields
    if (!graduationForm.studentId || !graduationForm.program || !graduationForm.expectedGraduation) {
      alert('Please fill in all required fields');
      return;
    }
    
    console.log('Processing graduation application:', graduationForm);
    alert('Graduation application submitted successfully!');
    closeGraduationModal();
  };

  const semesterOptions = [
    "1st Semester",
    "2nd Semester", 
    "Summer"
  ];

  const academicYearOptions = [
    "2024-2025",
    "2025-2026",
    "2026-2027"
  ];

  const programs = [
    "Bachelor of Science in Computer Science",
    "Bachelor of Science in Information Technology",
    "Bachelor of Engineering",
    "Bachelor of Science in Mathematics",
    "Bachelor of Arts",
    "Master of Science in Computer Science",
    "Master of Business Administration"
  ];

  const calendarDays = generateCalendarDays();

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <Sidebar userInfo={getUserInfo()} />

      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-welcome-title">Welcome back, {getStudentName()}</h1>
        </div>

        {/* Content Wrapper */}
        <div className="dashboard-content-wrapper">
          {/* Main Left Section */}
          <div className="dashboard-main-section">
            <div className="dashboard-main-grid">
              {/* Quick Actions */}
              <div className="dashboard-section-card">
                <div className="dashboard-section-header">
                  <h2 className="dashboard-section-title">Quick Actions</h2>
                </div>
                <div className="dashboard-actions-grid">
                  <div className="dashboard-action-btn" onClick={showEnrollmentForm}>
                    <div className="dashboard-action-title">Enrollment for Next Sem</div>
                    <div className="dashboard-action-desc">Process student enrollment</div>
                  </div>
                  <div className="dashboard-action-btn" onClick={showGraduationForm}>
                    <div className="dashboard-action-title">Application for Graduation</div>
                    <div className="dashboard-action-desc">Submit graduation application</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Sidebar */}
          <div className="dashboard-right-sidebar">
            {/* Calendar */}
            <div className="dashboard-calendar-section">
              <div className="dashboard-calendar-header-section">
                <h2 className="dashboard-calendar-title">Calendar</h2>
              </div>
              <div className="dashboard-calendar-content">
                <div className="dashboard-calendar-month" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <button className="btn btn-secondary" style={{ minWidth: 0, padding: '4px 10px' }} onClick={goToPrevMonth}>‹</button>
                  <span>
                    {new Date(calendarYear, calendarMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <button className="btn btn-secondary" style={{ minWidth: 0, padding: '4px 10px' }} onClick={goToNextMonth}>›</button>
                </div>
                <div className="dashboard-calendar-grid">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="dashboard-calendar-day-header">{day}</div>
                  ))}
                  {calendarDays.map((dayObj, index) => {
                    let dayClasses = ['dashboard-calendar-day'];
                    if (dayObj.isCurrentMonth) dayClasses.push('dashboard-calendar-day-current-month');
                    if (dayObj.isSelected) dayClasses.push('dashboard-calendar-day-selected');
                    if (dayObj.isToday && !dayObj.isSelected) dayClasses.push('dashboard-calendar-day-today');
                    return (
                      <div
                        key={index}
                        className={dayClasses.join(' ')}
                        onClick={() => dayObj.isCurrentMonth && setSelectedDate(dayObj.day)}
                      >
                        {dayObj.day}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="dashboard-section-card">
              <div className="dashboard-schedule-header-section">
                <h2 className="dashboard-schedule-title">Schedule</h2>
                <div className="dashboard-schedule-subtitle">
                  {getDayName(selectedDate, calendarMonth, calendarYear)}
                </div>
              </div>
              <div className="dashboard-schedule-content">
                {scheduleLoading ? (
                  <div className="dashboard-schedule-loading">
                    <div className="dashboard-schedule-loading-spinner"></div>
                    <div>Loading schedule...</div>
                  </div>
                ) : (
                  (() => {
                    const daySchedule = getScheduleForDate();
                    return daySchedule.length === 0 ? (
                      <div className="dashboard-schedule-empty">
                        <div className="dashboard-schedule-empty-icon">📅</div>
                        <div className="dashboard-schedule-empty-text">No classes scheduled</div>
                        <div className="dashboard-schedule-empty-subtext">
                          Enjoy your free day!
                        </div>
                      </div>
                    ) : (
                      daySchedule.map((schedule, index) => (
                        <div 
                          key={`${schedule.courseCode}-${index}`} 
                          className={`dashboard-schedule-item ${index % 2 === 0 ? 'dashboard-schedule-item-blue' : 'dashboard-schedule-item-green'}`}
                        >
                          <div className="dashboard-schedule-time">
                            {formatTime(schedule.timeFrom)} - {formatTime(schedule.timeTo)}
                          </div>
                          <div className="dashboard-schedule-subject">
                            <span className="dashboard-schedule-course-code">{schedule.courseCode}</span>
                            <span className="dashboard-schedule-course-name">{schedule.course}</span>
                          </div>
                          <div className="dashboard-schedule-details">
                            <div className="dashboard-schedule-room">{schedule.room}</div>
                            {schedule.instructor && schedule.instructor !== 'TBA' && (
                              <div className="dashboard-schedule-instructor">{schedule.instructor}</div>
                            )}
                          </div>
                          {schedule.status && (
                            <div className="dashboard-schedule-status">{schedule.status}</div>
                          )}
                        </div>
                      ))
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Modal */}
      {showEnrollmentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Enrollment for Next Semester</h2>
            </div>
            
            <div className="modal-body">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Student ID *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Student ID"
                    value={enrollmentForm.studentId}
                    onChange={(e) => handleEnrollmentFormChange('studentId', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Semester *</label>
                  <select
                    className="form-input"
                    value={enrollmentForm.semester}
                    onChange={(e) => handleEnrollmentFormChange('semester', e.target.value)}
                  >
                    <option value="">Select Semester</option>
                    {semesterOptions.map((semester) => (
                      <option key={semester} value={semester}>{semester}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Academic Year *</label>
                  <select
                    className="form-input"
                    value={enrollmentForm.academicYear}
                    onChange={(e) => handleEnrollmentFormChange('academicYear', e.target.value)}
                  >
                    <option value="">Select Academic Year</option>
                    {academicYearOptions.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeEnrollmentModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleEnrollment}>
                Process Enrollment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Graduation Modal */}
      {showGraduationModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Application for Graduation</h2>
            </div>
            
            <div className="modal-body">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Student ID *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Student ID"
                    value={graduationForm.studentId}
                    onChange={(e) => handleGraduationFormChange('studentId', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Program *</label>
                  <select
                    className="form-input"
                    value={graduationForm.program}
                    onChange={(e) => handleGraduationFormChange('program', e.target.value)}
                  >
                    <option value="">Select Program</option>
                    {programs.map((program) => (
                      <option key={program} value={program}>{program}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Expected Graduation *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={graduationForm.expectedGraduation}
                    onChange={(e) => handleGraduationFormChange('expectedGraduation', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Application Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={graduationForm.applicationDate}
                    onChange={(e) => handleGraduationFormChange('applicationDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeGraduationModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleGraduation}>
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
