import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import Sidebar from '../Sidebar';
import { useAdminData } from '../../hooks/useAdminData';
import { 
  facultyAPI, 
  programAPI, 
  studentAPI, 
  curriculumAPI, 
  courseSectionAPI, 
  courseAPI,
  scheduleAPI 
} from '../../services/api';

const AdminDashboard = () => {
  const { getAdminName, getUserInfo } = useAdminData();
  
  // State to hold the fetched lists
  const [facultyList, setFacultyList] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [studentCount, setStudentCount] = useState(0); 
  const [programsLoaded, setProgramsLoaded] = useState(false);

  const [dashboardData, setAdminDashboardData] = useState({
    stats: {
      totalStudents: 0, 
      studentGrowth: '',
      facultyGrowth: '',
      courseGrowth: ''
    }
  });

  // Fetch all necessary data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch all data in parallel
        const [facultyResponse, programResponse, studentCountResponse] = await Promise.all([
          facultyAPI.getAllFaculty(),
          programAPI.getAllPrograms(),
          studentAPI.getStudentCount()
        ]);
        
        setFacultyList(facultyResponse.data);
        setProgramsList(programResponse.data);
        setStudentCount(studentCountResponse.data.count);
        setProgramsLoaded(true);
        setAdminDashboardData(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            totalStudents: studentCountResponse.data.count
          }
        }));
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      }
    };
    loadData();
  }, []);

  // Student Form State and Handlers
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    year_level: 1,
    programId: '',
    curriculumId: '',     
    sectionId: ''         
  });

  const [availableCurriculums, setAvailableCurriculums] = useState([]);
  const [availableSectionsForStudent, setAvailableSectionsForStudent] = useState([]);

  const showAddStudentForm = () => {
    setStudentForm({
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: '',
      year_level: 1,
      programId: '',
      curriculumId: '',   
      sectionId: ''      
    });
    setShowAddStudentModal(true);
  };

  const closeAddStudentModal = () => {
    setShowAddStudentModal(false);
  };

  const handleStudentFormChange = (field, value) => {
    setStudentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStudentProgramChange = async (programId) => {
    handleStudentFormChange('programId', programId);
    handleStudentFormChange('curriculumId', '');
    handleStudentFormChange('sectionId', '');
    if (!programId) {
      setAvailableCurriculums([]);
      setAvailableSectionsForStudent([]);
      return;
    }
    try {
      // Fetch curriculums for the selected program
      const currRes = await curriculumAPI.getCurriculumsByProgram(programId);
      setAvailableCurriculums(currRes.data || []);

      // Fetch sections for the selected program
      const secRes = await courseSectionAPI.getSectionsByProgram(programId);
      setAvailableSectionsForStudent(secRes.data || []);
    } catch (err) {
      setAvailableCurriculums([]);
      setAvailableSectionsForStudent([]);
    }
  };

  const handleAddStudent = async () => {
    // Validate required fields
    if (!studentForm.firstName || !studentForm.lastName || !studentForm.email || !studentForm.programId || !studentForm.curriculumId) {
      showToast('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentForm.email)) {
      showToast('Please enter a valid email address');
      return;
    }

    try {
      // Find the selected program object
      const selectedProgramObj = programsList.find(p => p.programID.toString() === studentForm.programId);

      const studentData = {
        firstName: studentForm.firstName,
        lastName: studentForm.lastName,
        email: studentForm.email,
        dateOfBirth: studentForm.dateOfBirth,
        year_level: parseInt(studentForm.year_level),
        program: selectedProgramObj || null,
        curriculumId: studentForm.curriculumId,
        sectionId: studentForm.sectionId || null
      };

      await studentAPI.createStudent(studentData);
      showToast('Student added successfully!');
      closeAddStudentModal();

      // Refresh student count
      const countResponse = await studentAPI.getStudentCount();
      setStudentCount(countResponse.data.count);
      setAdminDashboardData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          totalStudents: countResponse.data.count
        }
      }));
    } catch (error) {
      console.error('Error adding student:', error);
      if (error.response?.status === 400) {
        showToast('Email already exists or invalid data provided!');
      } else {
        showToast('Failed to add student. Please try again.');
      }
    }
  };

  // Faculty Modal State and Handlers
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [facultyForm, setFacultyForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    Program: '',
    position: '',
    Status: ''
  });

  const showAddFacultyForm = () => {
    setShowAddFacultyModal(true);
  };

  const closeAddFacultyModal = () => {
    setShowAddFacultyModal(false);
    setFacultyForm({
      firstName: '',
      lastName: '',
      email: '',
      Program: '',
      position: '',
      Status: ''
    });
  };

  const handleFacultyFormChange = (field, value) => {
    setFacultyForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddFaculty = async () => {
    // Validate required fields
    if (!facultyForm.firstName || !facultyForm.lastName || !facultyForm.email || !facultyForm.Program) {
      showToast('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(facultyForm.email)) {
      showToast('Please enter a valid email address');
      return;
    }

    try {
      // Find the selected program object
      const selectedProgramObj = programsList.find(p => p.programID.toString() === facultyForm.Program);

      const facultyData = {
        firstName: facultyForm.firstName,
        lastName: facultyForm.lastName,
        email: facultyForm.email,
        position: facultyForm.position || 'Assistant Professor',
        status: facultyForm.Status || 'Active',
        program: selectedProgramObj || null
      };

      await facultyAPI.createFaculty(facultyData);

      showToast('Faculty added successfully!');
      closeAddFacultyModal();

      // Refresh faculty list so the new faculty appears in the table
      const facultyResponse = await facultyAPI.getAllFaculty();
      setFacultyList(facultyResponse.data);

    } catch (error) {
      console.error('Error adding faculty:', error);
      if (error.response?.status === 400) {
        showToast('Email already exists or invalid data provided!');
      } else {
        showToast('Failed to add faculty. Please try again.');
      }
    }
  };

  // Course Modal State and Handlers
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);

  const [courseForm, setCourseForm] = useState({
    courseCode: '',
    courseDescription: '',
    courseName: '',
    credits: '',
    program: '',
    status: 'Active'
  });

  const showAddCourseForm = () => {
    setCourseForm({
      courseCode: '',
      courseDescription: '',
      courseName: '',
      credits: '',
      program: '',
      status: 'Active'
    });
    setShowAddCourseModal(true);
  };

  const closeModal = () => {
    setShowAddCourseModal(false);
    setCourseForm({
      courseCode: '',
      courseDescription: '',
      courseName: '',
      credits: '',
      program: '',
      status: 'Active'
    });
  };

  const handleCourseFormChange = (field, value) => {
    setCourseForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddCourse = async () => {
     if (!courseForm.courseCode || !courseForm.courseDescription || !courseForm.credits || !courseForm.program) {
       showToast('Please fill in all required fields');
       return;
     }
     
     if (isNaN(courseForm.credits) || courseForm.credits <= 0) {
       showToast('Credits must be a positive number');
       return;
     }
     
     try {
       const courseData = {
         courseCode: courseForm.courseCode,
         courseDescription: courseForm.courseDescription,
         credits: parseInt(courseForm.credits),
         program: courseForm.program
       };
 
       console.log('Creating course:', courseData);
       await courseAPI.createCourse(courseData);
       showToast('Course added successfully!');
       closeModal();
     } catch (error) {
       console.error('Error adding course:', error);
       if (error.response?.status === 400) {
         showToast('Course code already exists or invalid data provided!');
       } else {
         showToast('Failed to add course. Please try again.');
       }
     }
   };

  // Schedule Modal State and Handlers
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [courseOptions, setCourseOptions] = useState([]);
  const [instructorOptions, setInstructorOptions] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [statusOptions, setStatusOptions] = useState(['ACTIVE', 'CANCELLED', 'COMPLETED', 'FULL']);

  const [scheduleForm, setScheduleForm] = useState({
    course: '',
    sectionName: '',
    instructor: '',
    room: '',
    day: '',
    startTime: '',
    endTime: '',
    status: statusOptions[0],
    semester: 'Current',
    year: new Date().getFullYear()
  });

  const showScheduleManager = () => {
    setScheduleForm({
      course: '',
      sectionName: '',
      instructor: '',
      room: '',
      day: '',
      startTime: '',
      endTime: '',
      status: statusOptions[0],
      semester: 'Current',
      year: new Date().getFullYear()
    });
    setShowAddScheduleModal(true);
  };

  const closeAddScheduleModal = () => {
    setShowAddScheduleModal(false);
    setScheduleForm({
      course: '',
      sectionName: '',
      instructor: '',
      room: '',
      day: '',
      startTime: '',
      endTime: '',
      status: statusOptions[0],
      semester: 'Current',
      year: new Date().getFullYear()
    });
  };

  const handleScheduleFormChange = (field, value) => {
    setScheduleForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    const loadScheduleDropdowns = async () => {
      try {
        const [coursesRes, instructorsRes, sectionsRes] = await Promise.all([
          courseAPI.getAllCourses(),
          facultyAPI.getAllFaculty(),
          courseSectionAPI.getAllSections()
        ]);
        setCourseOptions(
          coursesRes.data.map(course => ({
            id: course.id,
            label: `${course.courseCode} - ${course.courseDescription}`,
            value: course.courseCode
          }))
        );
        setInstructorOptions(
          instructorsRes.data.map(faculty => ({
            id: faculty.facultyID,
            label: `${faculty.firstName} ${faculty.lastName}`,
            value: faculty.facultyID
          }))
        );
        setSectionsList(sectionsRes.data);
      } catch (err) {
        setCourseOptions([]);
        setInstructorOptions([]);
        setSectionsList([]);
      }
    };
    if (showAddScheduleModal) {
      loadScheduleDropdowns();
    }
  }, [showAddScheduleModal]);

  const [scheduleList, setScheduleList] = useState([]);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        // Use scheduleAPI instead of courseSectionAPI
        const response = await scheduleAPI.getAllSchedules();
        setScheduleList(response.data);
      } catch (err) {
        setScheduleList([]);
      }
    };
    fetchSchedules();
  }, []);

  const handleAddSchedule = async () => {
    try {
      // Validate required fields
      if (
        !scheduleForm.course ||
        !scheduleForm.sectionName ||
        !scheduleForm.instructor ||
        !scheduleForm.room ||
        !scheduleForm.day ||
        !scheduleForm.startTime ||
        !scheduleForm.endTime
      ) {
        showToast('Please fill in all required fields.');
        return;
      }

      // Validate time
      if (scheduleForm.startTime >= scheduleForm.endTime) {
        showToast('End time must be after start time');
        return;
      }

      // Find course and faculty objects
      const selectedCourse = courseOptions.find(c => c.value === scheduleForm.course);
      const selectedFaculty = instructorOptions.find(f => f.value === parseInt(scheduleForm.instructor));

      // First, create a schedule
      const scheduleData = {
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        day: scheduleForm.day,
        status: scheduleForm.status,
        room: scheduleForm.room
      };

      // Create the schedule first
      const scheduleResponse = await scheduleAPI.createSchedule(scheduleData);
      const savedSchedule = scheduleResponse.data;

      // Then create or update the section with the new schedule
      const sectionData = {
        sectionName: scheduleForm.sectionName,
        semester: scheduleForm.semester || 'Current',
        year: scheduleForm.year,
        course: { id: selectedCourse?.id },
        faculty: selectedFaculty ? { facultyID: selectedFaculty.value } : null,
        schedule: { scheduleID: savedSchedule.scheduleID }
      };

      await courseSectionAPI.createSection(sectionData);
      showToast('Schedule added successfully!');
      closeAddScheduleModal();

      // Refresh schedule list
      const response = await scheduleAPI.getAllSchedules();
      setScheduleList(response.data);

    } catch (error) {
      console.error('Error adding schedule:', error);
      if (error.response?.status === 400) {
        showToast(error.response.data || 'Invalid schedule data provided!');
      } else {
        showToast('Failed to add schedule. Please try again.');
      }
    }
  };

  // Calendar State and Handlers
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.getDate());

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
        isSelected: day === selectedDate && calendarMonth === today.getMonth() && calendarYear === today.getFullYear(),
        isToday: day === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear()
      });
    }

    return days;
  };

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

  const positionOptions = [
    "Professor",
    "Associate Professor",
    "Assistant Professor",
    "Instructor",
    "Lecturer",
    "Program Head",
    "Dean"
  ];

  const StatusOptions = [
    'Active',
    'Inactive',
    'On Leave',
    'Retired'
  ];


  const roomOptions = [
    "Room 101",
    "Room 102",
    "Lab 201",
    "Lab 202",
    "Lecture Hall A",
    "Lecture Hall B",
    "Computer Lab 1",
    "Computer Lab 2"
  ];

  const dayOptions = [
    "Monday",
    "Tuesday", 
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  const calendarDays = generateCalendarDays();
  
  // Toast state and helper
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const showToast = (message, type = "success") => {
    const id = toastId.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  return (
    <div className="dashboard-container">
      <Sidebar userInfo={getUserInfo()} />

      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-welcome-title">Welcome back, {getAdminName()}</h1>
        </div>

        {/* Stats Cards */}
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
              <div className="stat-icon blue">👥</div>
              <div className="stat-content">
                <div className="dashboard-stat-title">Total Students</div>
                <div className="dashboard-stat-value">{studentCount.toLocaleString()}</div>
            </div>
          </div>
          <div className="dashboard-stat-card">
            <div className="stat-icon blue">👨‍🏫</div>
            <div className="stat-content">
              <div className="dashboard-stat-title">Total Faculty</div>
              <div className="dashboard-stat-value">{facultyList.length}</div>
            </div>
          </div>
          <div className="dashboard-stat-card">
            <div className="stat-icon blue">📚</div>
              <div className="stat-content">
              <div className="dashboard-stat-title">Total Programs</div>
              <div className="dashboard-stat-value">{programsList.length}</div>
            </div>
          </div>
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
                  <div className="dashboard-action-btn" onClick={showAddStudentForm}>
                    <div className="dashboard-action-title">Add Student</div>
                    <div className="dashboard-action-desc">Create new student profile</div>
                  </div>
                  <div className="dashboard-action-btn" onClick={showAddFacultyForm}>
                    <div className="dashboard-action-title">Add Faculty</div>
                    <div className="dashboard-action-desc">Register new faculty member</div>
                  </div>
                  <div className="dashboard-action-btn" onClick={showAddCourseForm}>
                    <div className="dashboard-action-title">Add Course</div>
                    <div className="dashboard-action-desc">Create new course</div>
                  </div>
                  <div className="dashboard-action-btn" onClick={showScheduleManager}>
                    <div className="dashboard-action-title">Schedule</div>
                    <div className="dashboard-action-desc">Manage class schedules</div>
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
                  <button className="btn btn-secondary" style={{ minWidth: 0, padding: '4px 10px' }} onClick={goToPrevMonth}>&lt;</button>
                  <span>
                    {new Date(calendarYear, calendarMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <button className="btn btn-secondary" style={{ minWidth: 0, padding: '4px 10px' }} onClick={goToNextMonth}>&gt;</button>
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
          </div>
        </div>
      </div>

      {/* Student Modal */}
      {showAddStudentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Student</h2>
            </div>

            <div className="modal-body">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input type="text" className="form-input" placeholder="Enter first name" value={studentForm.firstName} onChange={(e) => handleStudentFormChange('firstName', e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input type="text" className="form-input" placeholder="Enter last name" value={studentForm.lastName} onChange={(e) => handleStudentFormChange('lastName', e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-input" placeholder="Enter email address" value={studentForm.email} onChange={(e) => handleStudentFormChange('email', e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input type="date" className="form-input" value={studentForm.dateOfBirth} onChange={(e) => handleStudentFormChange('dateOfBirth', e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Year Level</label>
                  <select className="form-input" value={studentForm.year_level} onChange={(e) => handleStudentFormChange('year_level', e.target.value)}>
                    <option value={1}>Year 1</option> <option value={2}>Year 2</option> <option value={3}>Year 3</option> <option value={4}>Year 4</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Program *</label>
                  <select className="form-input" value={studentForm.programId} onChange={(e) => handleStudentProgramChange(e.target.value)}>
                    <option value="">Select Program</option>
                    {programsList.map((program) => (
                      <option key={program.programID} value={program.programID}>{program.programName}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Curriculum *</label>
                  <select className="form-input" value={studentForm.curriculumId} onChange={(e) => handleStudentFormChange('curriculumId', e.target.value)} disabled={!studentForm.programId}>
                    <option value="">Select Curriculum</option>
                    {availableCurriculums.map((curriculum) => (
                      <option key={curriculum.curriculumID} value={curriculum.curriculumID}>{curriculum.curriculumName} ({curriculum.academicYear})</option>
                    ))}
                  </select>
                  {studentForm.programId && availableCurriculums.length === 0 && (<p style={{ color: '#6c757d', fontSize: '12px', marginTop: '5px' }}>No active curriculums for this program.</p>)}
                </div>

                <div className="form-group">
                  <label className="form-label">Section</label>
                  <select className="form-input" value={studentForm.sectionId} onChange={(e) => handleStudentFormChange('sectionId', e.target.value)} disabled={!studentForm.programId}>
                    <option value="">Select Section *</option>
                    {availableSectionsForStudent.map((section) => (
                        <option key={section.sectionID} value={section.sectionID}>{section.sectionName}</option>
                    ))}
                  </select>
                  {studentForm.programId && availableSectionsForStudent.length === 0 && (<p style={{ color: '#6c757d', fontSize: '12px', marginTop: '5px' }}>No sections available for this program.</p>)}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeAddStudentModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddStudent}>Add Student</button>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Modal */}
      {showAddFacultyModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Faculty</h2>
            </div>
            
            <div className="modal-body">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter First Name"
                    value={facultyForm.firstName}
                    onChange={(e) => handleFacultyFormChange('firstName', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Last Name"
                    value={facultyForm.lastName}
                    onChange={(e) => handleFacultyFormChange('lastName', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter Email Address"
                    value={facultyForm.email}
                    onChange={(e) => handleFacultyFormChange('email', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Program *</label>
                  <select
                    className="form-input" 
                    value={facultyForm.Program}
                    onChange={(e) => handleFacultyFormChange('Program', e.target.value)}
                  >
                    <option value="">Select Program</option>
                    {programsList.map((program) => (
                      <option key={program.programID} value={program.programID}>{program.programName}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <select
                    className="form-input" 
                    value={facultyForm.position}
                    onChange={(e) => handleFacultyFormChange('position', e.target.value)}
                  >
                    <option value="">Select position</option>
                    {positionOptions.map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input" 
                    value={facultyForm.Status}
                    onChange={(e) => handleFacultyFormChange('Status', e.target.value)}
                  >
                    <option value="">Select status</option>
                    {StatusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeAddFacultyModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddFaculty}>
                Add Faculty
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Modal */}
      {showAddCourseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Course</h2>
            </div>
            <div className="modal-body">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Course Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Course Code (e.g., CS101)"
                    value={courseForm.courseCode}
                    onChange={(e) => handleCourseFormChange('courseCode', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Course Description *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Course Description"
                    value={courseForm.courseDescription}
                    onChange={(e) => handleCourseFormChange('courseDescription', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Credits *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Enter number of credits"
                    min="1"
                    max="6"
                    value={courseForm.credits}
                    onChange={(e) => handleCourseFormChange('credits', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Program *</label>
                  <select
                    className="form-input"
                    value={courseForm.program}
                    onChange={(e) => handleCourseFormChange('program', e.target.value)}
                  >
                    <option value="">Select Program</option>
                    {programsList.map((program) => (
                      <option key={program.programID} value={program.programName}>{program.programName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddCourse}
              >
                Add Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showAddScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Schedule</h2>
            </div>
            <div className="modal-body">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Course *</label>
                  <select
                    className="form-input"
                    value={scheduleForm.course}
                    onChange={(e) => handleScheduleFormChange('course', e.target.value)}
                  >
                    <option value="">Select course</option>
                    {courseOptions.map((course) => (
                      <option key={course.id} value={course.value}>{course.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Section Name *</label>
                  <select
                    className="form-input"
                    value={scheduleForm.sectionName}
                    onChange={(e) => handleScheduleFormChange('sectionName', e.target.value)}
                  >
                    <option value="">Select section</option>
                    {sectionsList.map((section) => (
                      <option key={section.sectionID} value={section.sectionName}>
                        {section.sectionName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Instructor *</label>
                  <select
                    className="form-input"
                    value={scheduleForm.instructor}
                    onChange={(e) => handleScheduleFormChange('instructor', e.target.value)}
                  >
                    <option value="">Select instructor</option>
                    {instructorOptions.map((instructor) => (
                      <option key={instructor.id} value={instructor.value}>{instructor.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Room *</label>
                  <select
                    className="form-input"
                    value={scheduleForm.room}
                    onChange={(e) => handleScheduleFormChange('room', e.target.value)}
                  >
                    <option value="">Select room</option>
                    {roomOptions.map((room) => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Day *</label>
                  <select
                    className="form-input"
                    value={scheduleForm.day}
                    onChange={(e) => handleScheduleFormChange('day', e.target.value)}
                  >
                    <option value="">Select day</option>
                    {dayOptions.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Start Time *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={scheduleForm.startTime}
                    onChange={(e) => handleScheduleFormChange('startTime', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">End Time *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={scheduleForm.endTime}
                    onChange={(e) => handleScheduleFormChange('endTime', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={scheduleForm.status}
                    onChange={(e) => handleScheduleFormChange('status', e.target.value)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeAddScheduleModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddSchedule}>
                Add Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast container */}
      <div id="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>{toast.message}</div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;