import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentEnrollment.module.css';
import Sidebar from './StudentSidebar';
import { useStudentData } from '../hooks/useStudentData';
import { 
  enrolledCourseAPI, 
  courseAPI, 
  courseSectionAPI, 
  curriculumAPI, 
  semesterEnrollmentAPI,
  scheduleAPI,  // NEW: Added schedule API for enhanced course-schedule management
  studentAPI,  // Added for student data fetching
  curriculumDetailAPI  // Added for curriculum detail fetching
} from '../services/api';
import Loading from './Loading';

/**
 * Enhanced StudentEnrollment Component
 * 
 * This component has been updated to support the new Course-Schedule Management System:
 * - Supports multiple courses per section through individual schedule assignments
 * - Handles one-to-one course-schedule relationships
 * - Displays course assignments per schedule with visual indicators
 * - Enhanced enrollment process for schedule-course assignments
 * - Backward compatibility with existing direct course assignments
 * 
 * Key Features:
 * - 📚 Badge: Indicates course-schedule assignments
 * - + Badge: Indicates sections with multiple schedules
 * - Enhanced schedule selection with course-specific filtering
 * - Improved enrollment modal with detailed schedule information
 * - Updated "My Enrollments" display showing course-schedule relationships
 */

function StudentEnrollment(props) {
  const [toast, setToast] = useState(null);

  // Call this function to show a toast
  const showToast = (message, type = "") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500); // Hide after 4.5s
  };


  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { getUserInfo } = useStudentData();
  const navigate = useNavigate();
  
  // Student and curriculum data
  const { studentData, loading: studentLoading, error: studentError } = useStudentData();
  const [currentCurriculum, setCurrentCurriculum] = useState(null);
  const [curriculumCourses, setCurriculumCourses] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  
  // UI state
  const [selectedTab, setSelectedTab] = useState('available');
  const [selectedYearLevel, setSelectedYearLevel] = useState('current');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add refresh trigger
  
  // New state for bulk enrollment
  const [selectedCourses, setSelectedCourses] = useState({}); // courseId -> sectionId mapping
  const [selectedSections, setSelectedSections] = useState({}); // courseId -> section object mapping

  // Manual refresh function
  const refreshData = () => {
    console.log('Manually refreshing enrollment data...');
    setRefreshTrigger(prev => prev + 1);
  };

  // Fetch curriculum and enrollment data
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!studentData?.id) {
          throw new Error('No student data available');
        }

        console.log('Fetching data for student:', studentData);

        // First get the student's curriculum
        const studentResponse = await studentAPI.getStudentById(studentData.id);
        const student = studentResponse.data;
        console.log('Student data fetched:', student);

        if (!student.curriculum?.curriculumID) {
          throw new Error('No curriculum assigned to student');
        }

        // Fetch curriculum details
        const curriculumResponse = await curriculumAPI.getCurriculumById(student.curriculum.curriculumID);
        setCurrentCurriculum(curriculumResponse.data);
        console.log('Curriculum fetched:', curriculumResponse.data);

        // Fetch curriculum courses with details
        const curriculumDetailsResponse = await curriculumDetailAPI.getDetailsByCurriculum(student.curriculum.curriculumID);
        const curriculumDetails = curriculumDetailsResponse.data;
        console.log('Curriculum details fetched:', curriculumDetails);

        // Transform curriculum details to include full course information
        const coursesWithDetails = curriculumDetails.map(detail => {
          console.log('Processing curriculum detail:', detail);
          console.log('Course in detail:', detail.course);
          
          if (!detail.course) {
            console.error('No course found in curriculum detail:', detail);
            return null;
          }
          
          return {
            curriculumDetailId: detail.curriculumDetailID,
            courseId: detail.course.id,
            courseCode: detail.course.courseCode,
            courseName: detail.course.courseDescription,
            description: detail.course.courseDescription,
            yearLevel: detail.YearLevel || detail.yearLevel,
            semester: detail.Semester || detail.semester,
            credits: detail.course.credits
          };
        }).filter(course => course !== null);
        
        setCurriculumCourses(coursesWithDetails);
        console.log('Transformed curriculum courses:', coursesWithDetails);

        // Fetch available sections
        const sectionsResponse = await courseSectionAPI.getAllSections();
        console.log('Raw sections response:', sectionsResponse.data);
        
        // TEST: Call the debug endpoint to see backend data
        try {
          const debugResponse = await fetch('http://localhost:8080/api/test/sections-debug');
          const debugData = await debugResponse.json();
          console.log('DEBUG: Backend sections data:', debugData);
        } catch (debugError) {
          console.warn('Debug endpoint not available:', debugError);
        }
        
        // Transform sections to handle multiple schedules per section
        const sectionScheduleMap = new Map();
        const transformedSections = [];
        
        sectionsResponse.data.forEach(section => {
          // Handle case where section has multiple schedules (array)
          if (Array.isArray(section.schedules) && section.schedules.length > 0) {
            section.schedules.forEach(schedule => {
              const sectionKey = section.sectionID;
              
              // Track if this section has multiple schedules
              if (!sectionScheduleMap.has(sectionKey)) {
                sectionScheduleMap.set(sectionKey, 0);
              }
              sectionScheduleMap.set(sectionKey, sectionScheduleMap.get(sectionKey) + 1);
              
              transformedSections.push({
                ...section,
                schedule: schedule,
                scheduleId: schedule.scheduleID,
                room: schedule.room,
                day: schedule.day,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                scheduleStatus: schedule.status,
                // For course information, prioritize schedule.course, then section.course
                course: schedule.course || section.course,
                hasDirectCourse: !!schedule.course,
                hasMultipleSchedules: false // Will be updated below
              });
            });
          } 
          // Backward compatibility - handle case where section has a single schedule object
          else if (section.schedule) {
            const sectionKey = section.sectionID;
            sectionScheduleMap.set(sectionKey, 1);
            
            transformedSections.push({
              ...section,
              scheduleId: section.schedule.scheduleID,
              room: section.schedule.room,
              day: section.schedule.day,
              startTime: section.schedule.startTime,
              endTime: section.schedule.endTime,
              scheduleStatus: section.schedule.status,
              hasDirectCourse: false,
              hasMultipleSchedules: false
            });
          }
          // Handle sections without schedules
          else {
            const sectionKey = section.sectionID;
            sectionScheduleMap.set(sectionKey, 0);
            
            transformedSections.push({
              ...section,
              schedule: null,
              scheduleId: null,
              room: 'TBA',
              day: 'TBA',
              startTime: null,
              endTime: null,
              scheduleStatus: 'INACTIVE',
              hasDirectCourse: false,
              hasMultipleSchedules: false
            });
          }
        });
        
        // Update hasMultipleSchedules flag
        transformedSections.forEach(section => {
          section.hasMultipleSchedules = sectionScheduleMap.get(section.sectionID) > 1;
        });
        
        setAvailableSections(transformedSections);
        console.log('Transformed sections:', transformedSections);
        console.log('Section schedule counts:', Array.from(sectionScheduleMap.entries()));

        // Fetch student's current enrollments
        try {
          console.log('Fetching enrollments for student ID:', studentData.id);
          const enrollmentsResponse = await enrolledCourseAPI.getEnrolledCoursesByStudent(studentData.id);
          console.log('Raw enrollments response:', enrollmentsResponse);
          console.log('Enrollments data:', enrollmentsResponse.data);
          console.log('Number of enrollments:', enrollmentsResponse.data?.length || 0);
          
          // Transform enrollment data to handle new DTO structure
          const transformedEnrollments = (enrollmentsResponse.data || []).map(enrollment => {
            console.log('Processing enrollment with DTO structure:', enrollment);
            
            // Create enhanced enrollment object using DTO fields
            const enhancedEnrollment = {
              enrolledCourseID: enrollment.enrolledCourseID,
              status: enrollment.status,
              
              // Create section object using DTO data
              section: {
                sectionName: enrollment.sectionName,
                course: {
                  id: enrollment.courseId, // Use numeric courseId for proper matching
                  courseID: enrollment.courseId,
                  courseCode: enrollment.courseCode,
                  courseDescription: enrollment.courseDescription,
                  courseName: enrollment.courseDescription,
                  credits: enrollment.credits
                },
                faculty: enrollment.faculty ? {
                  firstName: enrollment.faculty.split(' ')[0] || '',
                  lastName: enrollment.faculty.split(' ').slice(1).join(' ') || ''
                } : null,
                startTime: enrollment.startTime,
                endTime: enrollment.endTime,
                day: enrollment.day,
                room: enrollment.room
              },
              
              // Semester enrollment info
              semesterEnrollment: {
                semester: enrollment.semester,
                academicYear: enrollment.academicYear
              },
              
              // Grade information
              grade: enrollment.gradeValue || enrollment.midtermGrade || enrollment.finalGrade ? {
                gradeValue: enrollment.gradeValue,
                midtermGrade: enrollment.midtermGrade,
                finalGrade: enrollment.finalGrade,
                overallGrade: enrollment.overallGrade,
                letterGrade: enrollment.grade,
                remark: enrollment.remark
              } : null
            };
            
            console.log('Enhanced enrollment:', enhancedEnrollment);
            return enhancedEnrollment;
          });
          
          setMyEnrollments(transformedEnrollments);
        } catch (enrollmentError) {
          console.error('Failed to fetch enrollments:', enrollmentError);
          console.error('Error details:', {
            message: enrollmentError.message,
            response: enrollmentError.response?.data,
            status: enrollmentError.response?.status
          });
          setMyEnrollments([]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching enrollment data:', err);
        if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
          setError('Unable to connect to server. Please check if the backend is running on http://localhost:8080');
        } else {
          setError(err.message || 'Failed to load enrollment data');
        }
        setLoading(false);
      }
    };

    if (studentData && !studentLoading) {
      fetchData();
    }
  }, [studentData, studentLoading, refreshTrigger]);

    // Get courses available for enrollment based on student type
    const getAvailableCoursesForEnrollment = () => {
      if (!studentData || !curriculumCourses.length) {
        console.log('Missing required data for enrollment:', {
          hasStudentData: !!studentData,
          curriculumCoursesLength: curriculumCourses.length
        });
        return [];
      }

      console.log('Getting available courses for enrollment...');
      console.log('Curriculum courses:', curriculumCourses);

      // Filter curriculum courses based on semester selection
      let eligibleCourses = curriculumCourses.filter(curriculumDetail => {
        const semesterCondition = selectedSemester === 'all' || 
          curriculumDetail.semester === selectedSemester || 
          curriculumDetail.semester === Number(selectedSemester);
        
        // Check if student is not already enrolled in this course
        // Compare course IDs more comprehensively
        const notCurrentlyEnrolled = !myEnrollments.some(e => {
          const enrolledCourseId = e.section?.course?.id || e.section?.course?.courseID;
          const currentCourseId = curriculumDetail.courseId;
          
          // Convert to strings for comparison
          const enrolledIdStr = String(enrolledCourseId);
          const currentIdStr = String(currentCourseId);
          
          const isMatching = enrolledIdStr === currentIdStr && e.status === 'Enrolled';
          
          console.log('Enrollment match check:', {
            currentCourseId,
            enrolledCourseId,
            enrolledIdStr,
            currentIdStr,
            status: e.status,
            isMatching,
            enrollmentId: e.enrolledCourseID,
            sectionDetails: {
              sectionId: e.section?.sectionID,
              sectionName: e.section?.sectionName,
              courseData: e.section?.course
            }
          });
          
          return isMatching;
        });

        console.log('Course filter check:', {
          courseId: curriculumDetail.courseId,
          courseName: curriculumDetail.courseName,
          semester: curriculumDetail.semester,
          semesterCondition,
          notCurrentlyEnrolled,
          enrolledCourses: myEnrollments.map(e => ({
            enrollmentId: e.enrolledCourseID,
            id: e.section?.course?.id || e.section?.course?.courseID,
            status: e.status,
            sectionId: e.section?.sectionID,
            fullSection: e.section
          }))
        });

        return semesterCondition && notCurrentlyEnrolled;
      });        console.log('Eligible courses after filtering:', eligibleCourses);
        console.log('Available sections for matching:', availableSections.length);

        // Add available sections to each course - updated for new schedule-course structure
        return eligibleCourses.map(curriculumDetail => {
          console.log(`\n=== Processing curriculum course: ${curriculumDetail.courseId} (${curriculumDetail.courseName}) ===`);
          
          // Find matching sections for this course through schedule-course assignments
          const courseSections = availableSections.filter(section => {
            // Debug the structure of each section to understand what we're working with
            console.log(`  Checking section ${section.sectionID || section.id} (${section.sectionName}) for course ${curriculumDetail.courseId}:`, {
              sectionCourseId: section.course?.id,
              directCourseId: section.courseId,
              course_id: section.course_id,
              course: section.course,
              schedules: section.schedules?.length || 0,
              hasDirectCourse: section.hasDirectCourse,
              schedulesDetail: section.schedules?.map(s => ({
                scheduleId: s.scheduleID || s.id,
                courseId: s.course?.id,
                courseCode: s.course?.courseCode,
                courseDescription: s.course?.courseDescription
              }))
            });
            
            // Convert IDs to strings for comparison to avoid type mismatches
            const courseIdStr = String(curriculumDetail.courseId);
            
            // NEW: Check if section has schedules with course assignments
            if (section.schedules && section.schedules.length > 0) {
              const hasMatchingSchedule = section.schedules.some(schedule => {
                if (schedule.course) {
                  const scheduleMatches = String(schedule.course.id) === courseIdStr || 
                                       String(schedule.course.courseID) === courseIdStr;
                  const scheduleId = schedule.id || schedule.scheduleID || schedule.scheduleId;
                  console.log(`    Schedule ${scheduleId || 'undefined'} course match check:`, {
                    scheduleMatches,
                    scheduleCourseId: schedule.course.id,
                    scheduleCourseCode: schedule.course.courseCode,
                    curriculumCourseId: courseIdStr
                  });
                  return scheduleMatches;
                }
                console.log(`    Schedule has no course assigned`);
                return false;
              });
              
              if (hasMatchingSchedule) {
                console.log(`    ✓ MATCH: Schedule-course relationship found`);
                return true;
              }
            }
            
            // BACKWARD COMPATIBILITY: For sections with direct course assignments (old structure)
            if (section.hasDirectCourse && section.course) {
              const matches = String(section.course.id) === courseIdStr || String(section.course.courseID) === courseIdStr;
              console.log(`    Direct course match check: ${matches}`);
              return matches;
            }
            
            // For sections with course through section relationship (backward compatibility)
            if (section.course && (String(section.course.id) === courseIdStr || String(section.course.courseID) === courseIdStr)) {
              console.log(`    Section course relationship match`);
              return true;
            }
            
            // Check if section has courseId field directly
            if (section.courseId && String(section.courseId) === courseIdStr) {
              console.log(`    Direct courseId match`);
              return true;
            }
            
            // Check if section has course_id field
            if (section.course_id && String(section.course_id) === courseIdStr) {
              console.log(`    course_id field match`);
              return true;
            }
            
            console.log(`    ✗ NO MATCH: No course relationship found`);
            return false;
        });
        
        console.log(`  Sections found for course ${curriculumDetail.courseId} (${curriculumDetail.courseName}):`, courseSections.length);
        if (courseSections.length > 0) {
          console.log(`  First matching section:`, courseSections[0]);
        }
        
        return {
          ...curriculumDetail,
          availableSections: courseSections
        };
      });
      // Don't filter out courses without sections - show all curriculum courses
    };

  // Filter courses based on search - memoize to avoid constant recalculation
  const filteredCourses = useMemo(() => {
    const availableCourses = getAvailableCoursesForEnrollment();
    return availableCourses.filter(course => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        course.courseCode?.toLowerCase().includes(searchLower) ||
        course.courseName?.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower)
      );
    });
  }, [studentData, curriculumCourses, availableSections, myEnrollments, selectedSemester, searchTerm]);

  // Handle enrollment
  const handleEnroll = (section) => {
    setSelectedSection(section);
    setShowEnrollModal(true);
  };

  const confirmEnrollment = async () => {
    if (!selectedSection) return;

    try {
      setEnrollmentLoading(true);

      // NEW: Enhanced validation with conflict checking
      const selectedCourse = Object.keys(selectedSections).find(courseId => 
        selectedSections[courseId] === selectedSection
      );
      
      if (selectedCourse) {
        const validationErrors = await validateEnrollment(selectedSection, selectedCourse);
        if (validationErrors.length > 0) {
          showToast(`Enrollment validation failed: ${validationErrors.join(', ')}`, 'error');
          return;
        }
      }

      // NEW: Handle schedule-course assignments
      const enrollmentData = {
        studentId: studentData.id,
        courseSectionId: selectedSection.sectionID,
        status: 'Enrolled'
      };

      // Include schedule ID if this is a schedule-course assignment
      if (selectedSection.selectedSchedule) {
        enrollmentData.scheduleId = selectedSection.selectedSchedule.id;
      }

      const response = await enrolledCourseAPI.createEnrollment(enrollmentData);
      const newEnrollment = response.data;

      // Enhance the new enrollment with section data from our transformed sections
      // const enhancedEnrollment = {
      //   ...newEnrollment,
      //   section: {
      //     ...newEnrollment.section,
      //     ...selectedSection // Use the selected section data which has all the schedule info
      //   }
      // };

      // setMyEnrollments(prev => [...prev, enhancedEnrollment]); // REMOVE this line
      
      setShowEnrollModal(false);
      setSelectedSection(null);
      showToast('Successfully enrolled in the course!', 'success');
    } catch (error) {
      console.error('Enrollment error:', error);
      showToast('Failed to enroll in course. Please try again.', 'error'); 
    } finally {
      setEnrollmentLoading(false); // Set loading false first
      refreshData(); // Then refresh data
    }
  };

  // Handle bulk enrollment
  const handleBulkEnroll = async () => {
    const selectedCount = Object.keys(selectedCourses).length;
    if (selectedCount === 0) return;

    console.log('=== BULK ENROLLMENT DEBUG ===');
    console.log('Selected courses object:', selectedCourses);
    console.log('Selected sections object:', selectedSections);
    console.log('Number of selected courses:', selectedCount);

    if (!window.confirm(`Are you sure you want to enroll in ${selectedCount} course(s)?`)) return;

    try {
      setEnrollmentLoading(true);
      const courseEntries = Object.entries(selectedCourses);
      const newEnrollments = [];

      console.log('Starting bulk enrollment for courses:', courseEntries);
      console.log('Selected sections:', selectedSections);
      console.log('Current enrollments before bulk:', myEnrollments.map(e => ({
        id: e.enrolledCourseID,
        courseId: e.section?.course?.id,
        status: e.status
      })));

      // Process each enrollment sequentially to avoid race conditions
      for (const [courseId, selectionValue] of courseEntries) {
        try {
          let courseSectionId;
          let scheduleId = null;
          
          // NEW: Handle schedule-course assignments
          if (selectionValue.includes('-')) {
            const [sectionId, schedId] = selectionValue.split('-');
            courseSectionId = parseInt(sectionId);
            scheduleId = parseInt(schedId);
          } else {
            // BACKWARD COMPATIBILITY: Handle direct section selection
            courseSectionId = parseInt(selectionValue);
          }
          
          // Create enrollment data with enhanced structure
          const enrollmentData = {
            studentId: studentData.id,
            courseSectionId: courseSectionId,
            scheduleId: scheduleId, // NEW: Include schedule ID for course-schedule assignments
            status: 'Enrolled'
          };

          console.log('Creating enrollment for course:', courseId, 'with data:', enrollmentData);

          const response = await enrolledCourseAPI.createEnrollment(enrollmentData);
          const enrollment = response.data;
          const selectedSection = selectedSections[courseId];

          console.log('Raw enrollment from API:', enrollment);
          console.log('Selected section for course', courseId, ':', selectedSection);

          console.log('Enrollment created successfully:', {
            enrollmentId: enrollment.enrolledCourseID,
            courseId,
            courseSectionId,
            scheduleId,
            selectedSection: selectedSection ? {
              sectionID: selectedSection.sectionID,
              sectionName: selectedSection.sectionName,
              courseId: selectedSection.course?.id,
              hasScheduleInfo: !!selectedSection.selectedSchedule
            } : null
          });

          // Enhance the enrollment with the selected section data
          const enhancedEnrollment = {
            ...enrollment,
            section: {
              ...enrollment.section,
              ...selectedSection, // Use the selected section data which has all the schedule info
              // Ensure course information is preserved
              course: selectedSection.course || enrollment.section?.course,
              // NEW: Include schedule-specific information
              selectedSchedule: selectedSection.selectedSchedule || null,
              scheduleId: selectedSection.scheduleId || null
            }
          };

          console.log('Enhanced enrollment:', {
            enrollmentId: enhancedEnrollment.enrolledCourseID,
            courseId: enhancedEnrollment.section?.course?.id,
            courseName: enhancedEnrollment.section?.course?.courseName || enhancedEnrollment.section?.course?.courseDescription,
            scheduleInfo: enhancedEnrollment.section?.selectedSchedule || 'No specific schedule',
            originalEnrollment: enrollment,
            selectedSection: selectedSection,
            enhancedSection: enhancedEnrollment.section
          });

          newEnrollments.push(enhancedEnrollment);
        } catch (courseError) {
          console.error(`Failed to enroll in course ${courseId}:`, courseError);
          // Don't show individual error toasts here - we'll handle it in the final summary
        }
      }

      console.log('All enrollments processed. New enrollments:', newEnrollments.length);

      // Update state only once with all new enrollments
      // if (newEnrollments.length > 0) {
      //   setMyEnrollments(prev => {
      //     // Filter out any potential duplicates based on enrolledCourseID
      //     const existingIds = new Set(prev.map(e => e.enrolledCourseID));
      //     const uniqueNewEnrollments = newEnrollments.filter(e => !existingIds.has(e.enrolledCourseID));
      //     const updated = [...prev, ...uniqueNewEnrollments];
      //     return updated;
      //   });
      // }

      // Clear selections
      setSelectedCourses({});
      setSelectedSections({});

      // Force a re-render to update the available courses list
      refreshData(); // Only refresh from backend, do not update myEnrollments locally

      if (newEnrollments.length === selectedCount) {
        showToast(`Successfully enrolled in ${newEnrollments.length} course(s)!`, 'success');
      } else if (newEnrollments.length > 0) {
        showToast(`Successfully enrolled in ${newEnrollments.length} out of ${selectedCount} course(s).`, 'warning');
      } else {
        showToast('No courses were enrolled. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Bulk enrollment error:', error);
      showToast('Failed to enroll in courses. Please try again.', 'error');
    } finally {
      setEnrollmentLoading(false); // Set loading false first
      refreshData(); // Then refresh data
    }
  };

  // Handle drop
  const handleDrop = async (enrollmentId, courseId = null) => {
    const confirmMessage = courseId 
      ? 'Are you sure you want to drop this specific course?' 
      : 'Are you sure you want to drop this course?';
      
    if (!window.confirm(confirmMessage)) return;

    try {
      console.log('=== DROPPING COURSE ===');
      console.log('Enrollment ID:', enrollmentId);
      console.log('Course ID:', courseId);
      
      // Find the specific enrollment to get schedule information
      const enrollmentToDrop = myEnrollments.find(e => 
        e.enrolledCourseID === enrollmentId && 
        (courseId ? e.courseId === courseId : true)
      );
      
      console.log('Enrollment to drop:', enrollmentToDrop);
      
      // Try to get schedule ID for course-specific dropping
      let scheduleId = null;
      if (enrollmentToDrop && courseId) {
        // Look for schedule ID in the enrollment data
        scheduleId = enrollmentToDrop.scheduleId || 
                    enrollmentToDrop.section?.scheduleId || 
                    enrollmentToDrop.section?.selectedSchedule?.id ||
                    enrollmentToDrop.section?.selectedSchedule?.scheduleID;
        console.log('Found schedule ID for course-specific drop:', scheduleId);
      }
      
      await enrolledCourseAPI.deleteEnrollment(enrollmentId, scheduleId);
      
      // Remove from enrollments - if course-specific drop, remove only matching course
      if (courseId && scheduleId) {
        setMyEnrollments(prev => prev.filter(e => 
          !(e.enrolledCourseID === enrollmentId && e.courseId === courseId)
        ));
      } else {
        // Remove all courses with the same enrollmentId (old behavior)
        setMyEnrollments(prev => prev.filter(e => e.enrolledCourseID !== enrollmentId));
      }
      
      // Clear any selected courses that might conflict
      setSelectedCourses({});
      setSelectedSections({});
      
      showToast('Course dropped successfully!', 'success');
    } catch (error) {
      console.error('Drop error:', error);
      showToast('Failed to drop course. Please try again.', 'error');
    }
  };

  // Format time for display
  const formatTime = (time) => {
    if (!time) return '';
    
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour < 12 ? 'AM' : 'PM';
      return `${hour12}:${minutes} ${ampm}`;
    } catch (error) {
      return time; // Return original if formatting fails
    }
  };

  // Get year level options for irregular students
  const getYearLevelOptions = () => {
    if (!studentData) return [];
    
    const options = [{ value: 'current', label: `Up to Year ${studentData.year_level}` }];
    for (let i = 1; i <= studentData.year_level; i++) {
      options.push({ value: i.toString(), label: `Year ${i}` });
    }
    return options;
  };

  // Statistics calculations
  const totalAvailableCourses = filteredCourses.length;
  const activeEnrollments = myEnrollments.filter(e => e.status === 'Enrolled');
  const myTotalCredits = activeEnrollments.reduce((sum, enrollment) => {
    const credits = enrollment.section?.course?.credits || 0;
    return sum + credits;
  }, 0);
  
  // Enhanced statistics
  const enrolledWithDirectCourse = activeEnrollments.filter(e => e.section?.hasDirectCourse).length;
  const uniqueCoursesEnrolled = new Set(
    activeEnrollments
      .map(e => e.section?.course?.id || e.section?.course?.courseID)
      .filter(id => id !== undefined)
  ).size;
  const sectionsWithMultipleSchedules = activeEnrollments.filter(e => e.section?.hasMultipleSchedules).length;

  // Debug: Log current enrollment state
  console.log('Current enrollment state:', {
    myEnrollments: myEnrollments.map(e => ({
      id: e.enrolledCourseID,
      status: e.status,
      courseId: e.section?.course?.id || e.section?.course?.courseID,
      courseName: e.section?.course?.courseName || e.section?.course?.courseDescription
    })),
    totalEnrollments: myEnrollments.length,
    activeEnrollments: activeEnrollments.length
  });

  // NEW: Schedule conflict checking for enhanced system
  const checkScheduleConflicts = async (scheduleData) => {
    try {
      console.log('Checking schedule conflicts for:', scheduleData);
      const response = await scheduleAPI.checkConflicts(
        scheduleData.day,
        scheduleData.startTime,
        scheduleData.endTime
      );
      
      if (response.data && response.data.length > 0) {
        console.log('Schedule conflicts found:', response.data);
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error checking schedule conflicts:', error);
      return [];
    }
  };

  // NEW: Enhanced enrollment validation with conflict checking
  const validateEnrollment = async (selectedSection, courseId) => {
    const validationErrors = [];
    
    // Check if section has schedule information
    if (!selectedSection) {
      validationErrors.push('No section selected');
      return validationErrors;
    }
    
    // Get schedule information
    const scheduleInfo = selectedSection.selectedSchedule || {
      day: selectedSection.day,
      startTime: selectedSection.startTime,
      endTime: selectedSection.endTime
    };
    
    // Check for schedule conflicts if we have schedule information
    if (scheduleInfo.day && scheduleInfo.startTime && scheduleInfo.endTime) {
      const conflicts = await checkScheduleConflicts(scheduleInfo);
      
      if (conflicts.length > 0) {
        validationErrors.push(`Schedule conflict detected: ${conflicts.map(c => c.sectionName || 'Unknown section').join(', ')}`);
      }
    }
    
    // Check for duplicate course enrollment
    const isAlreadyEnrolled = myEnrollments.some(enrollment => {
      const enrolledCourseId = enrollment.section?.course?.id || enrollment.section?.course?.courseID;
      return String(enrolledCourseId) === String(courseId) && enrollment.status === 'Enrolled';
    });
    
    if (isAlreadyEnrolled) {
      validationErrors.push('You are already enrolled in this course');
    }
    
    return validationErrors;
  };

  if (loading || studentLoading) {
    return (
      <div className="dashboard-container">
        <Sidebar userInfo={getUserInfo()} />
        <div className="main-content">
          <div className="loading-container">
            <Loading message="Loading enrollment data..." />
          </div>
        </div>
      </div>
    );
  }

  if (error || studentError) {
    return (
      <div className="dashboard-container">
        <Sidebar userInfo={getUserInfo()} />
        <div className="main-content">
          <div className="error-container">
            <h2>Error Loading Enrollment Data</h2>
            <p>{error || studentError}</p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <Sidebar userInfo={getUserInfo()} />

      {/* Main Content */}
      <div className="main-content">
        <div className="content-wrapper">
          <div className="breadcrumb">
            <span 
              className="breadcrumb-link" 
              onClick={() => navigate('/student-dashboard')}
            >
              Dashboard
            </span>
            <span className="breadcrumb-separator"> / </span>
            <span className="breadcrumb-current">Enrollment</span>
          </div>
          
          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">Course Enrollment</h1>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">⏰</div>
              <div className="stat-content">
                <div className="stat-title">Available Classes</div>
                <div className="stat-value">{totalAvailableCourses}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">🎒</div> 
              <div className="stat-content">
                <div className="stat-title">Enrolled Courses</div>
                <div className="stat-value">{activeEnrollments.length}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">🎓</div>
              <div className="stat-content">
                <div className="stat-title">Total Credits</div>
                <div className="stat-value">{myTotalCredits}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">📖</div>
              <div className="stat-content">
                <div className="stat-title">Courses</div>
                <div className="stat-value">{uniqueCoursesEnrolled}</div>
              </div>
            </div>
            {enrolledWithDirectCourse > 0 && (
              <div className="stat-card">
                <div className="stat-label">Direct Course Assignments</div>
                <div className="stat-value">{enrolledWithDirectCourse} 📚</div>
              </div>
            )}
            {sectionsWithMultipleSchedules > 0 && (
              <div className="stat-card">
                <div className="stat-label">Multi-Schedule Sections</div>
                <div className="stat-value">{sectionsWithMultipleSchedules} +</div>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button 
              className={`page-btn ${selectedTab === 'available' ? 'active' : ''}`}
              onClick={() => setSelectedTab('available')}
            >
              Available Courses
            </button>
           
            <button 
              className={`page-btn ${selectedTab === 'enrolled' ? 'active' : ''}`}
              onClick={() => setSelectedTab('enrolled')}
            >
              My Enrollments ({activeEnrollments.length})
            </button>
                
          </div>

          {/* Course List */}
          <div className="schedule-list-container">
            <div className="list-header" style={{ marginBottom: '20px' }}>
              <div className="list-controls">
                <h2 className="list-title">
                  {selectedTab === 'available' ? 'Available Courses' : 'My Enrollments'}
                </h2>
               <div className="student-info">
              <p><strong>Program:</strong> {studentData?.program?.programName || 'N/A'}</p>
              <p><strong>Year Level:</strong> {studentData?.year_level}</p>
              </div>  
                {selectedTab === 'available' && (
                  <div className="controls">
                    <select 
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="select-input"
                    >
                      <option value="all">All Semesters</option>
                      <option value="1">1st Semester</option>
                      <option value="2">2nd Semester</option>
                      <option value="3">Summer</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                    <button 
                      className="btn-secondary"
                      onClick={refreshData}
                      disabled={loading}
                      title="Refresh available courses"
                    >
                      {loading ? '⏳' : '🔄'} Refresh
                    </button>
                 
                  </div>
                )}
              </div>
            </div>

            {selectedTab === 'available' && (
              <div className="enrollment-actions" style={{ marginBottom: '20px' }}>
                <button 
                  className="btn-primary"
                  onClick={handleBulkEnroll}
                  disabled={Object.keys(selectedCourses).length === 0 || enrollmentLoading}
                >
                  {enrollmentLoading ? 'Enrolling...' : `Enroll Now (${Object.keys(selectedCourses).length} courses)`}
                </button>
              </div>
            )}

            <div className="table-container">
              {selectedTab === 'available' ? (
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Year/Semester</th>
                      <th>Credits</th>
                      <th>Available Schedules</th>
                      <th>Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center">
                          No courses available for enrollment
                        </td>
                      </tr>
                    ) : (
                      filteredCourses.map((course) => {
                        const hasDirectCourseSchedules = course.availableSections?.some(s => s.hasDirectCourse);
                        const hasMultipleSchedules = course.availableSections?.some(s => s.hasMultipleSchedules);
                        
                        const rowClasses = [];
                        if (hasDirectCourseSchedules) rowClasses.push('has-direct-course');
                        if (hasMultipleSchedules) rowClasses.push('has-multiple-schedules');
                        
                        return (
                          <tr key={course.curriculumDetailId} className={rowClasses.join(' ')}>
                            <td>
                              {course.courseCode}
                              {hasDirectCourseSchedules && <span className="badge course-badge" title="Some schedules have direct course assignment">📚</span>}
                            </td>
                            <td>
                              <div className="schedule-info">
                                <div className="schedule-course">{course.courseName}</div>
                                {course.description && (
                                  <div className="schedule-section">{course.description}</div>
                                )}
                              </div>
                            </td>
                            <td>
                              Year {course.yearLevel} - Sem {course.semester}
                              {hasMultipleSchedules && <span className="badge multiple-badge" title="Multiple schedules available">+</span>}
                            </td>
                            <td className="font-semibold">{course.credits}</td>
                            <td>
                                <select
                                  className="form-select"
                                  value={selectedCourses[course.courseId] || ''}
                                  onChange={(e) => {
                                    console.log('=== COURSE SELECTION DEBUG ===');
                                    console.log('Course ID:', course.courseId);
                                    console.log('Selection value:', e.target.value);
                                    console.log('Current selectedCourses before:', selectedCourses);
                                    
                                    const selectionValue = e.target.value;
                                    if (!selectionValue) {
                                      // If no selection, remove from both states
                                      const { [course.courseId]: _, ...restCourses } = selectedCourses;
                                      const { [course.courseId]: __, ...restSections } = selectedSections;
                                      setSelectedCourses(restCourses);
                                      setSelectedSections(restSections);
                                      console.log('Removed course from selection');
                                      return;
                                    }
                                    
                                    // Handle new format: "sectionId-scheduleId" for schedule-course assignments
                                    if (selectionValue.includes('-')) {
                                      const [sectionId, scheduleId] = selectionValue.split('-');
                                      const section = availableSections.find(s => s.sectionID.toString() === sectionId);
                                      
                                      if (section && section.schedules) {
                                        const schedule = section.schedules.find((sch, index) => {
                                          // Add null checks for schedule ID
                                          const scheduleIdToCheck = sch.id || sch.scheduleID || sch.scheduleId || `temp-${index}`;
                                          return scheduleIdToCheck && scheduleIdToCheck.toString() === scheduleId;
                                        });
                                        
                                        if (schedule) {
                                          // Create enhanced section object with schedule info
                                          const enhancedSection = {
                                            ...section,
                                            selectedSchedule: schedule,
                                            course: schedule.course,
                                            startTime: schedule.startTime,
                                            endTime: schedule.endTime,
                                            day: schedule.day,
                                            room: schedule.room,
                                            scheduleId: schedule.id || schedule.scheduleID || schedule.scheduleId,
                                            hasDirectCourse: true
                                          };
                                          
                                          setSelectedCourses(prev => ({
                                            ...prev,
                                            [course.courseId]: selectionValue
                                          }));
                                          setSelectedSections(prev => ({
                                            ...prev,
                                            [course.courseId]: enhancedSection
                                          }));
                                          
                                          console.log('Selected course (schedule-based):', course.courseId, 'with value:', selectionValue);
                                          console.log('Enhanced section:', enhancedSection);
                                        }
                                      }
                                    } else {
                                      // Handle backward compatibility: direct section selection
                                      const section = availableSections.find(s => s.sectionID.toString() === selectionValue);
                                      if (section) {
                                        setSelectedCourses(prev => ({
                                          ...prev,
                                          [course.courseId]: selectionValue
                                        }));
                                        setSelectedSections(prev => ({
                                          ...prev,
                                          [course.courseId]: section
                                        }));
                                        
                                        console.log('Selected course (section-based):', course.courseId, 'with value:', selectionValue);
                                        console.log('Selected section:', section);
                                      }
                                    }
                                  }}
                                >
                                  <option value="">Select Schedule</option>
                                  {course.availableSections && course.availableSections.length > 0 ? (
                                    (() => {
                                      // Collect all schedule options and deduplicate more comprehensively
                                      const allOptions = [];
                                      const seenOptions = new Set();
                                      const scheduleMap = new Map(); // Use Map for better deduplication
                                      
                                      course.availableSections
                                        .filter(section => 
                                          section.status === 'Active' || 
                                          section.status === 'ACTIVE' ||
                                          section.scheduleStatus === 'Active' || 
                                          section.scheduleStatus === 'ACTIVE'
                                        )
                                        .forEach(section => {
                                          // NEW: Handle sections with multiple schedules for the same course
                                          if (section.schedules && section.schedules.length > 0) {
                                            console.log('Processing schedules for section:', section.sectionID, 'schedules:', section.schedules);
                                            
                                            // Find schedules that match this course
                                            const courseSchedules = section.schedules.filter(schedule => {
                                              if (schedule.course) {
                                                const scheduleMatches = String(schedule.course.id) === String(course.courseId) || 
                                                                     String(schedule.course.courseID) === String(course.courseId);
                                                return scheduleMatches;
                                              }
                                              return false;
                                            });
                                            
                                            console.log('Matching schedules for course', course.courseId, ':', courseSchedules);
                                            
                                            // Create options for each matching schedule
                                            courseSchedules.forEach((schedule, index) => {
                                              const scheduleId = schedule.id || schedule.scheduleID || schedule.scheduleId || `temp-${index}`;
                                              
                                              // Create more comprehensive unique key including schedule details
                                              const scheduleDetails = `${schedule.day}-${schedule.startTime}-${schedule.endTime}-${schedule.room}`;
                                              const uniqueKey = `${section.sectionID}-${scheduleId}-${scheduleDetails}`;
                                              
                                              // Skip duplicates
                                              if (seenOptions.has(uniqueKey)) {
                                                console.log('Skipping duplicate schedule:', uniqueKey);
                                                return;
                                              }
                                              
                                              seenOptions.add(uniqueKey);
                                              
                                              const scheduleText = schedule.day && schedule.startTime && schedule.endTime 
                                                ? `${schedule.day} ${formatTime(schedule.startTime)}-${formatTime(schedule.endTime)}`
                                                : 'TBA';
                                              
                                              const roomText = schedule.room ? ` • Room: ${schedule.room}` : '';
                                              const instructorText = section.faculty?.firstName && section.faculty?.lastName 
                                                ? ` • ${section.faculty.firstName} ${section.faculty.lastName}`
                                                : '';
                                              
                                              const courseIndicator = ' 📚';
                                              
                                              allOptions.push(
                                                <option 
                                                  key={uniqueKey} 
                                                  value={`${section.sectionID}-${scheduleId}`}
                                                >
                                                  {`${section.sectionName} - ${scheduleText}${roomText}${instructorText}${courseIndicator}`}
                                                </option>
                                              );
                                            });
                                          } else {
                                            // BACKWARD COMPATIBILITY: Handle sections with direct course assignments
                                            const scheduleText = section.day && section.startTime && section.endTime 
                                              ? `${section.day} ${formatTime(section.startTime)}-${formatTime(section.endTime)}`
                                              : 'TBA';
                                            
                                            const roomText = section.room ? ` • Room: ${section.room}` : '';
                                            const instructorText = section.faculty?.firstName && section.faculty?.lastName 
                                              ? ` • ${section.faculty.firstName} ${section.faculty.lastName}`
                                              : '';
                                            
                                            const directCourseIndicator = section.hasDirectCourse ? ' 📚' : '';
                                            
                                            // Create comprehensive unique key for backward compatibility
                                            const scheduleDetails = `${section.day}-${section.startTime}-${section.endTime}-${section.room}`;
                                            const uniqueKey = `${section.sectionID}-${section.scheduleId || 'default'}-${scheduleDetails}`;
                                            
                                            if (!seenOptions.has(uniqueKey)) {
                                              seenOptions.add(uniqueKey);
                                              allOptions.push(
                                                <option 
                                                  key={uniqueKey} 
                                                  value={section.sectionID}
                                                >
                                                  {`${section.sectionName} - ${scheduleText}${roomText}${instructorText}${directCourseIndicator}`}
                                                </option>
                                              );
                                            }
                                          }
                                        });
                                      
                                      // Additional deduplication pass: remove schedules with identical display text
                                      const finalOptions = [];
                                      const seenDisplayTexts = new Set();
                                      
                                      allOptions.forEach(option => {
                                        const displayText = option.props.children;
                                        if (!seenDisplayTexts.has(displayText)) {
                                          seenDisplayTexts.add(displayText);
                                          finalOptions.push(option);
                                        } else {
                                          console.log('Removing duplicate display text:', displayText);
                                        }
                                      });
                                      
                                      return finalOptions.length > 0 ? finalOptions : (
                                        <option value="" disabled>No active schedules available</option>
                                      );
                                    })()
                                  ) : (
                                    <option value="" disabled>No active schedules available</option>
                                  )}
                                </select>
                                {course.availableSections && course.availableSections.length === 0 && (
                                  <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '4px', color: '#6b7280' }}>
                                    No schedules available for this course
                                  </div>
                                )}
                            </td>
                            <td>
                              <input
                                type="checkbox"
                                checked={!!selectedCourses[course.courseId]}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // Auto-select the first available schedule when checkbox is checked
                                    if (course.availableSections && course.availableSections.length > 0) {
                                      const firstSection = course.availableSections[0];
                                      const selectionValue = `${firstSection.sectionId}-${firstSection.id}`;
                                      
                                      // Find the full section object
                                      const section = availableSections.find(s => s.sectionID.toString() === firstSection.sectionId.toString());
                                      
                                      if (section && section.schedules) {
                                        const schedule = section.schedules.find(sch => 
                                          (sch.id || sch.scheduleID || sch.scheduleId) && 
                                          (sch.id || sch.scheduleID || sch.scheduleId).toString() === firstSection.id.toString()
                                        );
                                        
                                        if (schedule) {
                                          const enhancedSection = {
                                            ...section,
                                            selectedSchedule: schedule,
                                            course: schedule.course,
                                            startTime: schedule.startTime,
                                            endTime: schedule.endTime,
                                            day: schedule.day,
                                            room: schedule.room,
                                            scheduleId: schedule.id || schedule.scheduleID || schedule.scheduleId,
                                            hasDirectCourse: true
                                          };
                                          
                                          setSelectedCourses(prev => ({
                                            ...prev,
                                            [course.courseId]: selectionValue
                                          }));
                                          setSelectedSections(prev => ({
                                            ...prev,
                                            [course.courseId]: enhancedSection
                                          }));
                                          
                                          console.log('Auto-selected first schedule for course:', course.courseId, 'with value:', selectionValue);
                                        }
                                      }
                                    }
                                  } else {
                                    // Remove selection when unchecked
                                    const { [course.courseId]: _, ...rest } = selectedCourses;
                                    const { [course.courseId]: __, ...sectionsRest } = selectedSections;
                                    setSelectedCourses(rest);
                                    setSelectedSections(sectionsRest);
                                  }
                                }}
                                disabled={!course.availableSections?.length}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Section</th>
                      <th>Schedule</th>
                      <th>Credits</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myEnrollments.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center">
                          No enrollments found
                        </td>
                      </tr>
                    ) : (
                      myEnrollments.map((enrollment) => {
                        const rowClasses = [];
                        if (enrollment.section?.hasDirectCourse) rowClasses.push('has-direct-course');
                        if (enrollment.section?.hasMultipleSchedules) rowClasses.push('has-multiple-schedules');
                        
                        // Use DTO data structure directly
                        const scheduleInfo = {
                          startTime: enrollment.section?.startTime,
                          endTime: enrollment.section?.endTime,
                          day: enrollment.section?.day,
                          room: enrollment.section?.room
                        };
                        
                        return (
                          <tr key={enrollment.enrolledCourseID} className={rowClasses.join(' ')}>
                            <td>
                              {enrollment.section?.course?.courseCode || 'N/A'}
                            </td>
                            <td>
                              <div className="schedule-info">
                                <div className="schedule-course">
                                  {enrollment.section?.course?.courseDescription || 'N/A'}
                                </div>
                              </div>
                            </td>
                            <td>
                              {enrollment.section?.sectionName || 'N/A'}
                            </td>
                            <td>
                              <div className="time-info">
                                <div className="time-period">
                                  {formatTime(scheduleInfo.startTime)} - {formatTime(scheduleInfo.endTime)}
                                </div>
                                <div className="day-info">{scheduleInfo.day || 'TBA'}</div>
                                {scheduleInfo.room && (
                                  <div className="room-info">Room: {scheduleInfo.room}</div>
                                )}
                              </div>
                            </td>
                            <td className="font-semibold">{enrollment.section?.course?.credits || 0}</td>
                            <td>
                              <span className="status-badge status-active">
                                {enrollment.status}
                              </span>
                            </td>
                            <td>
                              {enrollment.status === 'Enrolled' && (
                                <button 
                                  className="btn-primary"
                                  onClick={() => handleDrop(enrollment.enrolledCourseID, enrollment.courseId)}
                                  title={`Drop ${enrollment.courseCode || 'course'}`}
                                >
                                  Drop
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="table-footer">
              <div className="table-info">
                {selectedTab === 'available' 
                  ? `Showing ${filteredCourses.length} available courses`
                  : `Showing ${myEnrollments.length} enrollments`
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Confirmation Modal */}
      {showEnrollModal && selectedSection && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">Confirm Enrollment</h3>
            </div>
            <div className="modal-content">
              <div className="enrollment-details">
                <p><strong>Course:</strong> {selectedSection.course?.courseCode} - {selectedSection.course?.courseName || selectedSection.course?.courseDescription}</p>
                <p><strong>Section:</strong> {selectedSection.sectionName}</p>
                <p><strong>Instructor:</strong> {selectedSection.faculty?.firstName} {selectedSection.faculty?.lastName}</p>
                
                {/* Enhanced schedule information */}
                {selectedSection.selectedSchedule ? (
                  <>
                    <p><strong>Schedule:</strong> {selectedSection.selectedSchedule.day || 'TBA'}, {formatTime(selectedSection.selectedSchedule.startTime)} - {formatTime(selectedSection.selectedSchedule.endTime)}</p>
                    <p><strong>Room:</strong> {selectedSection.selectedSchedule.room || 'TBA'}</p>
                    <p><strong>Schedule ID:</strong> {selectedSection.selectedSchedule.id || 
                                                         selectedSection.selectedSchedule.scheduleID || 
                                                         selectedSection.selectedSchedule.scheduleId || 'N/A'}</p>
                    <p><strong>Assignment Type:</strong> Course-Schedule Assignment 📚</p>
                  </>
                ) : (
                  <>
                    <p><strong>Schedule:</strong> {selectedSection.day || selectedSection.schedule?.day || 'TBA'}, {formatTime(selectedSection.startTime || selectedSection.schedule?.startTime)} - {formatTime(selectedSection.endTime || selectedSection.schedule?.endTime)}</p>
                    <p><strong>Room:</strong> {selectedSection.room || selectedSection.schedule?.room || 'TBA'}</p>
                    {selectedSection.hasDirectCourse && (
                      <p><strong>Assignment Type:</strong> Direct Course Assignment 📚</p>
                    )}
                  </>
                )}
                
                <p><strong>Credits:</strong> {selectedSection.course?.credits}</p>
                <p><strong>Capacity:</strong> {selectedSection.enrolledCount || 0}/{selectedSection.capacity}</p>
                
                {selectedSection.hasMultipleSchedules && (
                  <p><strong>Note:</strong> This section has multiple schedules available. +</p>
                )}
                
                <br />
                <p>Are you sure you want to enroll in this section?</p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowEnrollModal(false)}
                disabled={enrollmentLoading}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={confirmEnrollment}
                disabled={enrollmentLoading}
              >
                {enrollmentLoading ? 'Enrolling...' : 'Confirm Enrollment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div id="toast-container">
        {toast && (
          <div className={`toast${toast.type ? " " + toast.type : ""}`}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentEnrollment;