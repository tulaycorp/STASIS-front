import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FacultyDashboard.module.css';
import Sidebar from '../FacultySidebar';
import { useFacultyData } from '../../hooks/useFacultyData';
import { courseSectionAPI } from '../../services/api'; 

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const { getFacultyName, getUserInfo, facultyData } = useFacultyData();
  const [dashboardData, setStudentDashboardData] = useState({});

  // Schedule state
  const [scheduleList, setScheduleList] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.getDate());

  // Fetch schedule data for faculty
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setScheduleLoading(true);
        const facultyId = facultyData?.facultyID || facultyData?.facultyId;
        if (!facultyData || !facultyId) {
          console.warn('Faculty information not available, cannot fetch schedule.');
          setScheduleList([]);
          setScheduleLoading(false);
          return; 
        }

        console.log('Fetching schedule for faculty ID:', facultyId);
        
        // Fetch sections assigned to this faculty
        const response = await courseSectionAPI.getSectionsByFaculty(facultyId);
        console.log('API Response for faculty sections:', response);
        
        if (response && response.data) {
          const sectionsData = Array.isArray(response.data) ? response.data : 
                             (response.data.data || response.data.sections || []);
          
          console.log('Sections data for faculty:', sectionsData);
          
          // Initialize empty array for all schedule entries
          const transformedSchedule = [];
          
          // Process each section
          sectionsData.forEach(section => {
            // Handle case where section has multiple schedules (array)
            if (Array.isArray(section.schedules) && section.schedules.length > 0) {
              section.schedules.forEach(schedule => {
                transformedSchedule.push({
                  id: schedule.scheduleID,
                  courseCode: schedule.course?.courseCode || section.course?.courseCode || 'N/A',
                  courseName: schedule.course?.courseDescription || section.course?.courseDescription || 'Unknown Course',
                  section: section.sectionName || 'N/A',
                  instructor: `${facultyData.firstName} ${facultyData.lastName}` || 'Unknown Instructor',
                  room: schedule.room || 'TBA',
                  day: schedule.day || 'TBA',
                  timeFrom: schedule.startTime ? schedule.startTime.substring(0, 5) : 'TBA',
                  timeTo: schedule.endTime ? schedule.endTime.substring(0, 5) : 'TBA',
                  status: schedule.status || 'ACTIVE'
                });
              });
            } 
            // Backward compatibility - handle case where section has a single schedule object
            else if (section.schedule) {
              transformedSchedule.push({
                id: section.schedule.scheduleID,
                courseCode: section.course?.courseCode || 'N/A',
                courseName: section.course?.courseDescription || 'Unknown Course',
                section: section.sectionName || 'N/A',
                instructor: `${facultyData.firstName} ${facultyData.lastName}` || 'Unknown Instructor',
                room: section.schedule.room || 'TBA',
                day: section.schedule.day || 'TBA',
                timeFrom: section.schedule.startTime ? section.schedule.startTime.substring(0, 5) : 'TBA',
                timeTo: section.schedule.endTime ? section.schedule.endTime.substring(0, 5) : 'TBA',
                status: section.schedule.status || 'ACTIVE'
              });
            }
          });
          
          console.log('Transformed schedule:', transformedSchedule);
          setScheduleList(transformedSchedule);
        } else {
          console.log('No data received from API');
          setScheduleList([]);
        }
      } catch (err) {
        console.error('Error fetching schedule data:', err);
        setScheduleList([]);
      } finally {
        setScheduleLoading(false);
      }
    };
    fetchSchedule();
  }, [facultyData]);

  // Helper function to get day name from date
  const getDayName = (date, month, year) => {
    const dateObj = new Date(year, month, date);
    return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Format time for display
  const formatTime = (time) => {
    if (!time || time === 'TBA') return '';
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

  const calendarDays = generateCalendarDays();
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <Sidebar userInfo={getUserInfo()} />

      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-welcome-title">Welcome back, {getFacultyName()}</h1>
        </div>

        {/* Content Wrapper */}
        <div className="dashboard-content-wrapper">
          {/* Main Left Section */}
          <div className="dashboard-main-section">
            <div className="dashboard-main-grid">
              {/* Quick Actions - Empty Section */}
              <div className="dashboard-section-card">
                <div className="dashboard-section-header">
                  <h2 className="dashboard-section-title">Quick Actions</h2>
                </div>
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6c757d' }}>
                  No quick actions available
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
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                  {getDayName(selectedDate, calendarMonth, calendarYear)}
                </div>
              </div>
              <div className="dashboard-schedule-content">
                {scheduleLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    Loading schedule...
                  </div>
                ) : (
                  (() => {
                    const daySchedule = getScheduleForDate();
                    return daySchedule.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                        No classes scheduled for this day
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
                            {schedule.courseCode} - {schedule.courseName}
                          </div>
                          <div className="dashboard-schedule-room">{schedule.room}</div>
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
    </div>
  );
};

export default FacultyDashboard;
