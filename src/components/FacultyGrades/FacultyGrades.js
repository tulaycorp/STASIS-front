import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FacultyGrades.module.css';
import Sidebar from '../FacultySidebar';
import { useFacultyData } from '../../hooks/useFacultyData';
import { 
  courseSectionAPI, 
  enrolledCourseAPI,
  scheduleAPI,
  facultyGradesAPI
} from '../../services/api';
import Loading from '../Loading';

const FacultyGrades = () => {
  const { getUserInfo, facultyData } = useFacultyData();
  const navigate = useNavigate();
  
  // State management
  const [academicPeriods, setAcademicPeriods] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedAcademicPeriod, setSelectedAcademicPeriod] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [gradesList, setGradesList] = useState([]);
  const [studentsGrades, setStudentsGrades] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveLoading, setSaveLoading] = useState({});

  // Toast state
  const [toast, setToast] = useState(null);

  // Add loading state management to prevent duplicate calls
  const [isInitializing, setIsInitializing] = useState(false);

  // Fetch initial data on component mount
  useEffect(() => {
    if (facultyData) {
      fetchInitialData();
    }
  }, [facultyData]);

  // Effect to update the course sidebar when academic period changes
  useEffect(() => {
    console.log('=== FILTERING EFFECT TRIGGERED ===');
    console.log('selectedAcademicPeriod:', selectedAcademicPeriod);
    console.log('gradesList.length:', gradesList.length);
    
    if (selectedAcademicPeriod && gradesList.length > 0) {
      console.log('Filtering courses for academic period:', selectedAcademicPeriod);
      console.log('Available grades list:', gradesList);
      
      const periodCoursesRaw = gradesList.filter(grade => {
        const gradeAcademicPeriod = `${grade.semester} ${grade.academicYear}`;
        console.log(`Checking grade academic period: '${gradeAcademicPeriod}' against selected: '${selectedAcademicPeriod}'`);
        const matches = gradeAcademicPeriod === selectedAcademicPeriod;
        console.log('Match result:', matches);
        return matches;
      });

      console.log('Academic period courses raw:', periodCoursesRaw);

      const newCourseList = periodCoursesRaw.map(grade => ({
        id: grade.id, 
        name: `${grade.course} (${grade.section})`, // Show course name with section in parentheses
        section: grade.section,
        course: grade.course,
        schedule: grade.schedule || null,
        semester: grade.semester,
        academicYear: grade.academicYear
      }));
      
      console.log('New course list:', newCourseList);
      setCourses(newCourseList);

      // Only deselect if the course is not in the filtered list AND we're not in the middle of saving grades
      if (selectedCourseId && 
          !newCourseList.some(c => c.id === selectedCourseId) && 
          !Object.values(studentsGrades).some(g => g.hasChanges && String(g.courseId) === String(selectedCourseId))) {
        console.log('Deselecting course because it is not in the filtered list');
        setSelectedCourseId(null);
        setSelectedCourse(null);
      }
    } else if (gradesList.length > 0 && !selectedAcademicPeriod) {
      console.log('No academic period selected but grades list exists, showing all courses');
      // If no academic period is selected but we have grades, show all courses
      const allCourses = gradesList.map(grade => ({
        id: grade.id, 
        name: `${grade.course} (${grade.section})`, // Show course name with section in parentheses
        section: grade.section,
        course: grade.course,
        schedule: grade.schedule || null,
        semester: grade.semester,
        academicYear: grade.academicYear
      }));
      console.log('All courses:', allCourses);
      setCourses(allCourses);
    } else {
      console.log('No courses to show - either no academic period selected or no grades list');
      setCourses([]);
    }
  }, [selectedAcademicPeriod, gradesList, selectedCourseId]);

  // Track changes separately to avoid dependency array issues
  useEffect(() => {
    const hasUnsavedChanges = Object.values(studentsGrades).some(g => g.hasChanges);
    if (hasUnsavedChanges && selectedCourseId) {
      // Keep the current course selected if there are unsaved changes
      const courseExists = courses.some(c => c.id === selectedCourseId);
      if (!courseExists) {
        console.log('Course not in filtered list but keeping selection due to unsaved changes');
      }
    }
  }, [studentsGrades, selectedCourseId, courses]);

  // Function to fetch students for a selected course
  const fetchStudentsForCourse = async (courseId) => {
    try {
      console.log('Fetching students for course/section ID:', courseId);
      
      // Use the new faculty grades API to fetch students for this section
      const response = await facultyGradesAPI.getSectionStudents(courseId);
      console.log('Students response:', response);
      
      if (response?.data && Array.isArray(response.data)) {
        const enrolledStudents = response.data;
        console.log('Raw enrolled students:', enrolledStudents);
        
        // Process enrolled students to match the expected format
        const processedStudents = enrolledStudents.map(student => {
          // Use enrollmentId as the unique identifier
          const enrollmentId = student.enrolledCourseID;
          if (!enrollmentId) {
            console.warn('No enrollment ID found in data:', student);
            return null;
          }
          
          return {
            id: enrollmentId, // Use enrollmentId as the unique identifier
            studentId: student.id, // Keep original student ID as separate field
            name: `${student.lastName || 'Unknown'}, ${student.firstName || 'Unknown'}`,
            email: student.email || '',
            yearLevel: student.yearLevel || '',
            program: student.programName || 'Unknown Program',
            midterm: student.midtermGrade || null,
            final: student.finalGrade || null,
            weightedAverage: (student.overallGrade !== null && !isNaN(student.overallGrade)) ? student.overallGrade : null,
            enrollmentId: enrollmentId,
            enrollmentStatus: student.status || 'PENDING',
            semesterEnrollmentId: student.semesterEnrollmentID,
            remark: student.remark || 'INCOMPLETE'
          };
        }).filter(student => student !== null);
        
        console.log('Processed students:', processedStudents);
        
        // Update the selected course with the fetched students
        const courseData = gradesList.find(grade => grade.id === courseId);
        if (courseData) {
          const updatedCourseData = {
            ...courseData,
            students: processedStudents
          };
          setSelectedCourse(updatedCourseData);
          console.log('Updated selectedCourse with students:', updatedCourseData);
        }
        
      } else {
        console.warn('No students found or invalid response format');
        const courseData = gradesList.find(grade => grade.id === courseId);
        if (courseData) {
          setSelectedCourse({
            ...courseData,
            students: []
          });
        }
      }
      
    } catch (error) {
      console.error('Error fetching students for course:', error);
      const courseData = gradesList.find(grade => grade.id === courseId);
      if (courseData) {
        setSelectedCourse({
          ...courseData,
          students: []
        });
      }
    }
  };

  // Effect to update the main table when a course is selected
  useEffect(() => {
    if (selectedCourseId) {
      setStudentSearchTerm(''); // Clear search when changing course
    } else {
      setSelectedCourse(null);
    }
  }, [selectedCourseId]);

  // Simplified fetch initial data using the new faculty grades API
  const fetchInitialData = async () => {
    if (!facultyData || isInitializing) {
      if (!facultyData) {
        setError('Faculty information not available. Please log in again.');
        setLoading(false);
      }
      return;
    }
    
    try {
      setIsInitializing(true);
      setLoading(true);
      setError(null);
      
      console.log('Faculty data:', facultyData);
      
      // Get faculty ID
      const facultyId = facultyData?.facultyID || facultyData?.facultyId;
      
      if (!facultyData || !facultyId) {
        console.warn('Faculty information not available, cannot fetch grades.');
        setError('Faculty information not available. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('Fetching faculty sections for faculty ID:', facultyId);
      
      // Use the same API as Faculty Schedule for consistency
      const sectionsResponse = await courseSectionAPI.getSectionsByFaculty(facultyId);
      console.log('Faculty sections response:', sectionsResponse);
      
      const facultySections = sectionsResponse.data || [];
      console.log('Faculty assigned sections:', facultySections);
      
      if (facultySections.length === 0) {
        console.log('No sections assigned to this faculty');
        setAcademicPeriods([]);
        setGradesList([]);
        setLoading(false);
        setIsInitializing(false);
        return;
      }

      // Extract unique academic periods from the faculty's assigned sections
      const uniqueAcademicPeriods = [...new Set(facultySections.map(section => {
        const semester = section.semester || 'Current Semester';
        const year = section.year || new Date().getFullYear();
        return `${semester} ${year}`;
      }))].filter(Boolean);

      console.log('Unique academic periods:', uniqueAcademicPeriods);

      // Sort academic periods (most recent first)
      const sortedAcademicPeriods = uniqueAcademicPeriods.sort((a, b) => {
        const [semesterA, yearA] = a.split(' ');
        const [semesterB, yearB] = b.split(' ');
        
        // First sort by year (descending)
        if (yearA !== yearB) {
          return parseInt(yearB) - parseInt(yearA);
        }
        
        // Then sort by semester (assuming semester format like "1st Semester", "2nd Semester")
        const semesterOrder = {
          '1st': 1,
          '2nd': 2,
          'Summer': 3
        };
        
        const orderA = semesterOrder[semesterA.split(' ')[0]] || 0;
        const orderB = semesterOrder[semesterB.split(' ')[0]] || 0;
        
        return orderB - orderA;
      });

      console.log('Sorted academic periods:', sortedAcademicPeriods);
      setAcademicPeriods(sortedAcademicPeriods);

      if (sortedAcademicPeriods.length > 0) {
        const firstAcademicPeriod = sortedAcademicPeriods[0];
        setSelectedAcademicPeriod(firstAcademicPeriod);
        console.log('Selected academic period:', firstAcademicPeriod);
      }

      // Convert sections to the expected format (without students for now)
      const processedGrades = [];
      
      facultySections.forEach(section => {
        console.log('Processing section summary:', section);
        
        // Extract semester and academic year information
        const semester = section.semester || 'Current Semester';
        const academicYear = section.year || new Date().getFullYear();
        
        // Handle sections with schedules - each schedule can have a different course
        if (Array.isArray(section.schedules) && section.schedules.length > 0) {
          // For grades, we want one entry per section, not per course
          // Find the primary course (first one with course data)
          const primarySchedule = section.schedules.find(schedule => schedule.course);
          
          if (primarySchedule && primarySchedule.course) {
            const course = primarySchedule.course;
            const programName = course.program?.programName || 
                              (() => {
                                const courseCode = course.courseCode || '';
                                const programMatch = courseCode.match(/^[A-Z]+/);
                                return programMatch ? programMatch[0] : 'General Education';
                              })();
            
            processedGrades.push({
              id: section.sectionID,
              course: course.courseDescription || course.courseCode || 'Unknown Course',
              section: section.sectionName,
              creditUnits: course.creditUnits || 3,
              program: programName,
              semester: semester,
              academicYear: academicYear,
              status: section.status || 'ACTIVE',
              instructor: facultyData.firstName + ' ' + facultyData.lastName,
              enrolledStudentsCount: section.enrolledStudentsCount || 0,
              studentsWithGrades: section.studentsWithGrades || 0,
              students: [],
              courseData: course // Store the full course data for reference
            });
          }
        }
        // Fallback for sections without proper schedule/course structure
        else {
          const programName = section.program?.programName || 'General Education';
          
          processedGrades.push({
            id: section.sectionID,
            course: 'Unknown Course',
            section: section.sectionName,
            creditUnits: 3,
            program: programName,
            semester: semester,
            academicYear: academicYear,
            status: section.status || 'ACTIVE',
            instructor: facultyData.firstName + ' ' + facultyData.lastName,
            enrolledStudentsCount: section.enrolledStudentsCount || 0,
            studentsWithGrades: section.studentsWithGrades || 0,
            students: []
          });
        }
      });

      console.log('=== FINAL PROCESSED GRADES ===');
      console.log('Total sections processed:', processedGrades.length);
      
      // Enhanced logging for debugging
      processedGrades.forEach((grade, index) => {
        console.log(`Section ${index + 1}:`, {
          id: grade.id,
          course: grade.course,
          section: grade.section,
          program: grade.program,
          enrolledCount: grade.enrolledStudentsCount,
          studentsWithGrades: grade.studentsWithGrades
        });
      });
      
      // Validate that we have valid data before setting state
      if (processedGrades.length === 0) {
        console.warn('No processed grades found - this might indicate a data processing issue');
        setError('No course sections found for this faculty member.');
      } else {
        console.log(`Successfully processed ${processedGrades.length} sections`);
      }
      
      setGradesList(processedGrades);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load course data. Please try again.');
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  };

  // Add this helper function near the top, after your useState hooks
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAcademicPeriodSelect = (academicPeriod) => {
    setSelectedAcademicPeriod(academicPeriod);
  };

  const getAcademicYear = (academicPeriod) => {
    if (!academicPeriod) return 'N/A';
    
    // Extract academic year from academic period string
    const parts = academicPeriod.trim().split(' ');
    if (parts.length >= 2) {
      return parts[parts.length - 1]; // Last part should be academic year
    }
    
    return 'N/A';
  };

  const formatAcademicPeriodDisplay = (academicPeriod) => {
    if (!academicPeriod) return { year: 'N/A', semester: 'N/A', academicYear: 'N/A' };
    
    // Parse "1st Semester 2023" format
    const parts = academicPeriod.split(' ');
    const semesterPart = parts.length >= 2 ? `${parts[0]} ${parts[1]}` : academicPeriod;
    const yearPart = parts.length >= 3 ? parts[parts.length - 1] : '';
    
    return {
      year: yearPart,
      semester: semesterPart,
      academicYear: yearPart
    };
  };

  const handleCourseSelect = async (courseId) => {
    console.log('=== COURSE SELECTION ===');
    console.log('Selected course ID (section ID):', courseId);
    console.log('Type of courseId:', typeof courseId);
    
    setSelectedCourseId(courseId);
    
    // Find the SPECIFIC SECTION from gradesList
    const sectionData = gradesList.find(grade => grade.id === courseId);
    if (!sectionData) {
      console.error('Section not found in gradesList:', courseId);
      console.error('Available sections in gradesList:', gradesList.map(g => ({ id: g.id, section: g.section, course: g.course })));
      return;
    }
    
    console.log('Found section data:', sectionData);
    console.log('Section name:', sectionData.section);
    console.log('Section ID for API call:', courseId);
    console.log('Section enrolled students count:', sectionData.enrolledStudentsCount);
    
    // Immediately set the section data (without students initially)
    setSelectedCourse(sectionData);
    
    // Fetch students for this SPECIFIC SECTION
    try {
      console.log('Fetching students for section ID:', courseId);
      console.log('Making API call to facultyGradesAPI.getSectionStudents...');
      console.log('API endpoint will be: /faculty-grades/section/' + courseId + '/students');
      
      // Add a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // First, let's try the alternative enrolled course API to see if there's data
      try {
        console.log('Testing alternative API call...');
        const alternativeResponse = await enrolledCourseAPI.getEnrolledCoursesBySection(courseId);
        console.log('Alternative API response:', alternativeResponse);
      } catch (altError) {
        console.log('Alternative API call failed:', altError);
      }
      
      const studentsResponse = await facultyGradesAPI.getSectionStudents(courseId);
      console.log('Raw API response:', studentsResponse);
      console.log('Response status:', studentsResponse?.status);
      console.log('Response data:', studentsResponse?.data);
      console.log('Response data type:', typeof studentsResponse?.data);
      console.log('Is response data array?', Array.isArray(studentsResponse?.data));
      
      const studentsData = studentsResponse?.data || [];
      console.log(`Raw students data for section ${sectionData.section}:`, studentsData);
      console.log('Students data length:', studentsData.length);
      
      if (!Array.isArray(studentsData)) {
        console.error('Students data is not an array:', studentsData);
        setSelectedCourse({
          ...sectionData,
          students: []
        });
        return;
      }
      
      if (studentsData.length === 0) {
        console.log('No students returned from API - this might be expected if no students are enrolled');
        setSelectedCourse({
          ...sectionData,
          students: []
        });
        return;
      }
      
      // Process the students data to match the expected format
      const processedStudents = studentsData.map((studentDto, index) => {
        console.log('Processing student DTO for section', sectionData.section, ':', studentDto);
        
        // Use enrollmentId as the unique identifier since students can have multiple enrollments
        const enrollmentId = studentDto.enrolledCourseID || studentDto.enrollmentId || `enrollment-${index}`;
        const studentId = studentDto.id || studentDto.studentId || `student-${index}`;
        
        if (!enrollmentId || !studentDto.enrolledCourseID) {
          console.warn('Student DTO missing enrollment ID, using fallback:', enrollmentId, studentDto);
        }
        
        return {
          id: enrollmentId, // Use enrollmentId as the unique identifier
          studentId: studentId, // Keep original student ID as separate field
          name: `${studentDto.lastName || 'Unknown'}, ${studentDto.firstName || 'Unknown'}`,
          email: studentDto.email || '',
          yearLevel: studentDto.yearLevel || '',
          program: studentDto.programName || 'Unknown Program',
          midterm: studentDto.midtermGrade || null,
          final: studentDto.finalGrade || null,
          weightedAverage: studentDto.overallGrade || null,
          enrollmentId: enrollmentId,
          enrollmentStatus: studentDto.status || 'PENDING',
          semesterEnrollmentId: studentDto.semesterEnrollmentID,
          remark: studentDto.remark || 'INCOMPLETE'
        };
      }).filter(student => student.enrollmentId); // Remove any students without valid enrollment IDs
      
      console.log(`Processed ${processedStudents.length} students for section ${sectionData.section}:`, processedStudents);
      
      // Debug: Check for duplicate enrollment IDs (should not happen)
      const enrollmentIds = processedStudents.map(s => s.enrollmentId);
      const duplicateEnrollmentIds = enrollmentIds.filter((id, index) => enrollmentIds.indexOf(id) !== index);
      if (duplicateEnrollmentIds.length > 0) {
        console.warn('Found duplicate enrollment IDs (this is a data issue):', duplicateEnrollmentIds);
      }
      
      // Debug: Check for duplicate student IDs (can happen legitimately)
      const studentIds = processedStudents.map(s => s.studentId);
      const duplicateStudentIds = studentIds.filter((id, index) => studentIds.indexOf(id) !== index);
      if (duplicateStudentIds.length > 0) {
        console.log('Found duplicate student IDs (same student, different enrollments):', duplicateStudentIds);
      }
      
      // Create updated section data with ONLY these students
      const updatedSection = {
        ...sectionData,
        students: processedStudents
      };
      
      console.log('Updated section with students:', {
        id: updatedSection.id,
        section: updatedSection.section,
        course: updatedSection.course,
        studentCount: updatedSection.students.length,
        students: updatedSection.students.map(s => ({ id: s.id, name: s.name, section: sectionData.section }))
      });
      
      setSelectedCourse(updatedSection);
      
      // Also update the gradesList to cache the students for this specific section
      setGradesList(prevGradesList => 
        prevGradesList.map(grade => 
          grade.id === courseId 
            ? { ...grade, students: processedStudents }
            : grade
        )
      );
      
      console.log(`Successfully loaded ${processedStudents.length} students for section: ${sectionData.section}`);
      
    } catch (error) {
      console.error('Error fetching students for section:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Keep the course selected but with empty students array
      setSelectedCourse({
        ...sectionData,
        students: []
      });
      
      // Show user-friendly error message
      showToast(`Failed to load students for section ${sectionData.section}. ${error.message}`, 'error');
    }
  };

  const handleGradeChange = (studentId, field, value) => {
    // studentId is now actually the enrollmentId
    const student = selectedCourse.students.find(s => s.id === studentId);
    if (!student) {
      console.error(`Student with enrollment ID ${studentId} not found in selected course`);
      return;
    }
    
    if (!student.enrollmentId) {
      console.error(`No enrollment ID found for student ${studentId}:`, student);
      showToast(`Cannot update grades for student ${studentId}: No enrollment ID found`, 'error');
      return;
    }

    console.log(`=== GRADE CHANGE DEBUG ===`);
    console.log(`Updating ${field} for enrollment ID ${studentId} (actual student: ${student.name}) in course ${selectedCourse.id} to: "${value}"`);
    console.log(`Selected course ID: ${selectedCourse.id}`);
    console.log(`Selected course name: ${selectedCourse.name || selectedCourse.course}`);

    // Create a unique key using enrollment ID and course ID
    const studentCourseKey = `${studentId}-${String(selectedCourse.id)}`;
    console.log(`Student-course key: ${studentCourseKey}`);
    
    const grades = studentsGrades[studentCourseKey] || {};
    
    // Handle value conversion properly
    let processedValue;
    if (field === 'remark') {
      processedValue = value;
    } else {
      // For numeric fields, handle empty string and null values properly
      if (value === '' || value === null || value === undefined) {
        processedValue = null;
      } else {
        const numValue = parseFloat(value);
        processedValue = isNaN(numValue) ? null : numValue;
      }
    }
    
    const updatedGrades = {
      ...grades,
      [field]: processedValue
    };

    console.log(`Processed value for ${field}:`, processedValue);
    console.log(`Updated grades object:`, updatedGrades);

    // Calculate new weighted average if both grades are present and valid
    let newWeightedAverage = student.weightedAverage; // Keep existing if not calculated
    const midtermGrade = field === 'midterm' ? processedValue : (updatedGrades.midterm ?? student.midterm);
    const finalGrade = field === 'final' ? processedValue : (updatedGrades.final ?? student.final);
    
    console.log(`Midterm for calculation: ${midtermGrade}`);
    console.log(`Final for calculation: ${finalGrade}`);
    
    // Only calculate if both grades are valid numbers (not null, undefined, or NaN)
    if (midtermGrade !== null && finalGrade !== null && 
        !isNaN(midtermGrade) && !isNaN(finalGrade)) {
      newWeightedAverage = (midtermGrade + finalGrade) / 2;
      console.log(`Calculated weighted average: ${newWeightedAverage}`);
    } else {
      // If either grade is missing/invalid, set weighted average to null
      newWeightedAverage = null;
      console.log('Weighted average set to null (missing grades)');
    }

    const gradeData = {
      ...updatedGrades,
      weightedAverage: newWeightedAverage,
      enrollmentId: student.enrollmentId,
      studentId: student.studentId, // Use the actual student ID, not enrollment ID
      courseId: String(selectedCourse.id), // Ensure courseId is stored as string for consistency
      hasChanges: true // Mark this student's grades as changed
    };

    console.log(`Storing grade data for key ${studentCourseKey}:`, gradeData);

    // Update local state
    setStudentsGrades(prev => {
      const newState = {
        ...prev,
        [studentCourseKey]: gradeData
      };
      console.log('Updated studentsGrades state:', newState);
      return newState;
    });
  };

  // New function to handle encoding/saving all changed grades
  const handleEncodeGrades = async () => {
    if (!selectedCourse) {
      showToast('No course selected', 'error');
      return;
    }

    console.log('=== ENCODING GRADES DEBUG ===');
    console.log('Selected course ID:', selectedCourse.id);
    console.log('Selected course:', selectedCourse);
    console.log('All studentsGrades entries:', Object.entries(studentsGrades));
    
    // Filter to only get changes for the current selected course with extra validation
    const changedStudents = Object.entries(studentsGrades).filter(([key, grades]) => {
      const hasChanges = grades.hasChanges === true;
      const courseMatches = String(grades.courseId) === String(selectedCourse.id);
      const keyMatchesCourse = key.endsWith(`-${String(selectedCourse.id)}`);
      
      console.log(`Checking student key: ${key}`);
      console.log(`  - hasChanges: ${hasChanges}`);
      console.log(`  - courseMatches: ${courseMatches} (${grades.courseId} === ${selectedCourse.id})`);
      console.log(`  - keyMatchesCourse: ${keyMatchesCourse}`);
      
      return hasChanges && courseMatches && keyMatchesCourse;
    });
    
    console.log('Filtered changed students:', changedStudents);
    
    if (changedStudents.length === 0) {
      showToast('No grades have been changed for this course', 'error');
      return;
    }

    console.log('=== ENCODING GRADES ===');
    console.log('Changed students for course:', selectedCourse.id);
    console.log('Changed students count:', changedStudents.length);
    console.log('Changed students data:', changedStudents);

    try {
      setSaveLoading(prev => ({
        ...prev,
        all: true
      }));

      let successCount = 0;
      let errorCount = 0;

      // Save each student's grades
      for (const [studentCourseKey, grades] of changedStudents) {
        try {
          // Additional validation: ensure the student exists in the current course
          // The key format is "studentId-sectionId", where sectionId is exactly selectedCourse.id
          // We need to extract studentId from the beginning, assuming it's a number
          
          // Since we know the exact sectionId, we can extract it from the end
          const sectionIdStr = String(selectedCourse.id);
          const expectedSuffix = `-${sectionIdStr}`;
          
          if (!studentCourseKey.endsWith(expectedSuffix)) {
            console.error(`Key doesn't end with expected section ID: ${studentCourseKey} (expected suffix: ${expectedSuffix})`);
            errorCount++;
            continue;
          }
          
          // The key format is now "enrollmentId-sectionId"
          // Extract enrollmentId by removing the section ID suffix
          const studentIdStr = studentCourseKey.substring(0, studentCourseKey.length - expectedSuffix.length);
          const enrollmentId = parseInt(studentIdStr);
          
          if (isNaN(enrollmentId)) {
            console.error(`Invalid enrollment ID extracted from key: ${studentCourseKey} -> ${studentIdStr}`);
            errorCount++;
            continue;
          }
          
          console.log(`Parsing key: ${studentCourseKey}`);
          console.log(`  - enrollmentId: ${enrollmentId}`);
          console.log(`  - sectionId: ${sectionIdStr}`);
          console.log(`  - selectedCourse.id: ${selectedCourse.id}`);
          
          const studentInCourse = selectedCourse.students.find(s => s.id === enrollmentId);
          if (!studentInCourse) {
            console.error(`Student with enrollment ID ${enrollmentId} not found in selected course ${selectedCourse.id}`);
            errorCount++;
            continue;
          }
          
          // Validate enrollment ID
          if (!grades.enrollmentId) {
            console.error(`No enrollment ID found for student key ${studentCourseKey}`);
            errorCount++;
            continue;
          }

          const updateData = {
            midtermGrade: grades.midterm,
            finalGrade: grades.final,
            overallGrade: grades.weightedAverage,
            remark: grades.remark || 'INCOMPLETE'
          };

          console.log(`Updating grades for enrollment key ${studentCourseKey} with enrollment ID ${grades.enrollmentId}:`, updateData);
          
          const response = await facultyGradesAPI.updateGrades(grades.enrollmentId, updateData);
          console.log(`API response for enrollment key ${studentCourseKey}:`, response);
          
          if (response && (response.status === 200 || response.status === 204)) {
            console.log(`Successfully updated grades for enrollment key ${studentCourseKey}`);
            successCount++;
          } else {
            console.error(`Unexpected response for enrollment key ${studentCourseKey}:`, response);
            errorCount++;
          }
        } catch (error) {
          console.error(`Error updating grades for enrollment key ${studentCourseKey}:`, error);
          console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          errorCount++;
        }
      }

      console.log(`Encoding complete: ${successCount} successful, ${errorCount} failed`);

      if (successCount > 0) {
        // Create a deep copy of gradesList to avoid mutation issues
        const updatedGradesList = JSON.parse(JSON.stringify(gradesList));
        
        // Find and update the current course section
        const currentSectionIndex = updatedGradesList.findIndex(grade => grade.id === selectedCourse.id);
        
        if (currentSectionIndex !== -1) {
          console.log('Found matching grade section, updating students...');
          const currentSection = updatedGradesList[currentSectionIndex];
          
          // Update students with new grades while preserving all students
          currentSection.students = currentSection.students.map(student => {
            const studentCourseKey = `${student.id}-${String(selectedCourse.id)}`;
            const updatedGrades = studentsGrades[studentCourseKey];
            if (updatedGrades?.hasChanges) {
              console.log(`Updating student ${student.id} with new grades:`, updatedGrades);
              return {
                ...student,
                midterm: updatedGrades.midterm ?? student.midterm,
                final: updatedGrades.final ?? student.final,
                weightedAverage: updatedGrades.weightedAverage ?? student.weightedAverage,
                remark: updatedGrades.remark ?? student.remark
              };
            }
            return student; // Keep unchanged students exactly as they are
          });
          
          console.log('Updated students count:', currentSection.students.length);
        }
        
        // Update the state with the new gradesList
        setGradesList(updatedGradesList);
        
        // Update the selectedCourse to reflect the changes
        if (currentSectionIndex !== -1) {
          setSelectedCourse(updatedGradesList[currentSectionIndex]);
        }

        // Clear only the temporary grades for this course
        setStudentsGrades(prev => {
          const newGrades = { ...prev };
          changedStudents.forEach(([key]) => {
            delete newGrades[key];
          });
          return newGrades;
        });
      }
      
      console.log('=== ENCODING COMPLETE ===');
      
      if (errorCount === 0) {
        showToast(`All ${successCount} grades have been successfully encoded!`, 'success');
      } else if (successCount > 0) {
        showToast(`${successCount} grades encoded successfully, ${errorCount} failed. Please check console for details.`, 'error');
      } else {
        showToast(`Failed to encode all grades. Please check console for details.`, 'error');
      }
    } catch (err) {
      console.error('Error encoding grades:', err);
      showToast('Failed to encode grades. Please try again.', 'error');
    } finally {
      setSaveLoading(prev => ({
        ...prev,
        all: false
      }));
    }
  };

  const filteredStudents = selectedCourse
    ? selectedCourse.students.filter(student => {
        const searchTermLower = studentSearchTerm.toLowerCase();
        return student.name.toLowerCase().includes(searchTermLower) || 
               String(student.studentId).toLowerCase().includes(searchTermLower) ||
               student.email.toLowerCase().includes(searchTermLower);
      })
    : [];

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <Sidebar userInfo={getUserInfo()}/>
        <div className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <Loading message="Loading grades..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardContainer}>
        <Sidebar userInfo={getUserInfo()}/>
        <div className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <h1 className={styles.pageTitle}>Error</h1>
            <p style={{color: 'red'}}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar userInfo={getUserInfo()}/>
      <div className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <div className={styles.breadcrumb}>
            <span 
              className={styles.breadcrumbLink} 
              onClick={() => navigate('/faculty-dashboard')}
            >
              Dashboard
            </span>
            <span className={styles.breadcrumbSeparator}> / </span>
            <span className={styles.breadcrumbCurrent}>Grades</span>
          </div>
          
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Academic Records</h1>
          </div>
          
          <div className={styles.studentContentWrapper}>
            <div>
              <div className={styles.studentNavSection}>
                <div className={styles.studentNavHeader}>
                  <h2 className={styles.studentNavTitle}>Academic Periods</h2>
                  <div className={styles.semesterCurrentInfo}>
                    Academic Year: {getAcademicYear(selectedAcademicPeriod)}
                  </div>
                </div>
                <div className={styles.studentNavList}>
                  {academicPeriods.length > 0 ? (
                    academicPeriods.map((academicPeriod) => {
                      const periodInfo = formatAcademicPeriodDisplay(academicPeriod);
                      return (
                        <div
                          key={academicPeriod}
                          className={`${styles.studentNavItem} ${selectedAcademicPeriod === academicPeriod ? styles.studentNavItemActive : ''}`}
                          onClick={() => handleAcademicPeriodSelect(academicPeriod)}
                        >
                          <span className={styles.studentNavIcon}>📅</span>
                          <div className={styles.semesterInfo}>
                            <div className={styles.semesterMain}>{periodInfo.semester}</div>
                            <div className={styles.semesterYear}>{periodInfo.year}</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className={styles.noSemestersMessage}>
                      {loading ? 'Loading academic periods...' : 'No academic periods available'}
                    </div>
                  )}
                </div>
                <div className={styles.studentNavInfo}>
                  <div className={styles.studentNavInfoItem}>
                    <div className={styles.studentNavInfoLabel}>Selected Period</div>
                    <div className={styles.studentNavInfoValue}>{selectedAcademicPeriod || 'None'}</div>
                  </div>
                  <div className={styles.studentNavInfoItem}>
                    <div className={styles.studentNavInfoLabel}>Courses Found</div>
                    <div className={styles.studentNavInfoValue}>{courses.length}</div>
                  </div>
                  <div className={styles.studentNavInfoItem}>
                    <div className={styles.studentNavInfoLabel}>Academic Year</div>
                    <div className={styles.studentNavInfoValue}>{getAcademicYear(selectedAcademicPeriod)}</div>
                  </div>
                </div>
              </div>
              
              <div className={`${styles.studentNavSection} ${styles.courseSidebar}`}>
                <div className={styles.studentNavHeader}>
                  <h2 className={styles.studentNavTitle}>Courses</h2>
                </div>
                <div className={styles.studentNavList}>
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <div 
                        key={course.id} 
                        className={`${styles.studentNavItem} ${
                          selectedCourseId === course.id ? styles.studentNavItemActive : ''
                        }`} 
                        onClick={() => handleCourseSelect(course.id)}
                      >
                        <div className={styles.semesterInfo}>
                          <div className={styles.semesterMain}>{course.name}</div>
                          <div className={styles.semesterSub}>Section: {course.section}</div>
                          {course.schedule && (
                            <div className={styles.scheduleInfo}>
                              {course.schedule.day} {course.schedule.startTime}-{course.schedule.endTime}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noCoursesMessage}>
                      {selectedAcademicPeriod ? 'No courses found for this academic period.' : 'Select an academic period to view courses.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className={styles.gradesListContainer}>
              <div className={styles.listHeader}>
                <div className={styles.headerCourseInfo}>
                  <h2 className={styles.headerCourseName}>
                    {selectedCourse ? selectedCourse.course : 'Select a Course'}
                  </h2>
                  {selectedCourse && (
                    <div className={styles.headerCourseDetails}>
                      <span className={styles.headerCourseUnits}>
                        {selectedCourse.creditUnits} Units
                      </span>
                      {selectedCourse.schedule && (
                        <span className={styles.headerScheduleInfo}>
                          {selectedCourse.schedule.day} {selectedCourse.schedule.startTime}-{selectedCourse.schedule.endTime} ({selectedCourse.schedule.room})
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className={styles.headerControls}>
                  <div className={styles.academicPeriodIndicator}>
                    {selectedAcademicPeriod || 'No academic period selected'}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search Students..." 
                    value={studentSearchTerm} 
                    onChange={(e) => setStudentSearchTerm(e.target.value)} 
                    className={styles.searchInput} 
                    disabled={!selectedCourse} 
                  />
                </div>
              </div>
              
           
              
              <div className={styles.tableContainer}>
                <table className={styles.gradesTable}>
                  <thead>
                    <tr>
                      <th rowSpan="2">Student ID</th>
                      <th rowSpan="2">Student Name (Last Name, First Name)</th>
                      <th rowSpan="2">Section</th>
                      <th colSpan="3">Student Grades</th>
                      <th rowSpan="2">Remarks</th>
                    </tr>
                    <tr>
                      <th>Midterm</th>
                      <th>Finals</th>
                      <th>Weighted Avg.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      console.log('=== TABLE RENDERING DEBUG ===');
                      console.log('selectedCourse:', selectedCourse);
                      console.log('selectedCourse?.id:', selectedCourse?.id);
                      console.log('selectedCourse?.section:', selectedCourse?.section);
                      console.log('selectedCourse?.course:', selectedCourse?.course);
                      console.log('selectedCourse?.students:', selectedCourse?.students);
                      console.log('selectedCourse?.students?.length:', selectedCourse?.students?.length);
                      console.log('filteredStudents:', filteredStudents);
                      console.log('filteredStudents.length:', filteredStudents.length);
                      console.log('studentSearchTerm:', studentSearchTerm);
                      
                      if (!selectedCourse) {
                        console.log('Showing: Please select a course');
                        return (
                          <tr>
                            <td colSpan="7" className={styles.placeholderCell}>
                              Please select a course to view student grades.
                            </td>
                          </tr>
                        );
                      }
                      
                      if (!selectedCourse.students || selectedCourse.students.length === 0) {
                        console.log('Showing: No students enrolled');
                        return (
                          <tr>
                            <td colSpan="7" className={styles.placeholderCell}>
                              No students enrolled in this course.
                            </td>
                          </tr>
                        );
                      }
                      
                      if (filteredStudents.length === 0) {
                        console.log('Showing: No students match search criteria');
                        return (
                          <tr>
                            <td colSpan="7" className={styles.placeholderCell}>
                              No students match your search criteria.
                            </td>
                          </tr>
                        );
                      }
                      
                      console.log('Showing student rows for:', filteredStudents.length, 'students');
                      return filteredStudents.map((student, index) => {
                        const studentCourseKey = `${student.id}-${String(selectedCourse.id)}`;
                        const currentGrades = studentsGrades[studentCourseKey] || {};
                        const displayedMidterm = currentGrades.midterm ?? student.midterm;
                        const displayedFinal = currentGrades.final ?? student.final;
                        const displayedWeightedAverage = currentGrades.weightedAverage ?? student.weightedAverage;
                        
                        // Create a unique key with fallback
                        const uniqueKey = student.id ? `${student.id}-${String(selectedCourse.id)}` : `student-${index}-${String(selectedCourse.id)}`;
                        
                        return (
                          <tr key={uniqueKey}>
                            <td>
                              <div className={styles.cellContent}>
                                <span className={styles.studentIdLabel}>{student.studentId}</span>
                              </div>
                            </td>
                            <td>
                              <div className={`${styles.cellContent} ${styles.studentName}`}>
                                {student.name}
                              </div>
                            </td>
                            <td>
                              <div className={styles.cellContent}>{selectedCourse.section}</div>
                            </td>
                            <td>
                              <div className={styles.cellContent}>
                                <input 
                                  type="number" 
                                  min="1" 
                                  max="5" 
                                  step="0.01" 
                                  value={displayedMidterm !== null && displayedMidterm !== undefined ? displayedMidterm : ''} 
                                  onChange={(e) => handleGradeChange(student.id, 'midterm', e.target.value)} 
                                  onFocus={(e) => e.target.select()}
                                  placeholder="1.00 - 5.00"
                                  className={`${styles.gradeInput} ${studentsGrades[studentCourseKey]?.hasChanges ? styles.changed : ''}`}
                                />
                              </div>
                            </td>
                            <td>
                              <div className={styles.cellContent}>
                                <input 
                                  type="number" 
                                  min="1" 
                                  max="5" 
                                  step="0.01" 
                                  value={displayedFinal !== null && displayedFinal !== undefined ? displayedFinal : ''} 
                                  onChange={(e) => handleGradeChange(student.id, 'final', e.target.value)} 
                                  onFocus={(e) => e.target.select()}
                                  placeholder="1.00 - 5.00"
                                  className={`${styles.gradeInput} ${studentsGrades[studentCourseKey]?.hasChanges ? styles.changed : ''}`}
                                />
                              </div>
                            </td>
                            <td>
                              <div className={`${styles.cellContent} ${styles.gradeScore}`}>
                                {displayedWeightedAverage !== null && !isNaN(displayedWeightedAverage) 
                                  ? displayedWeightedAverage.toFixed(2) 
                                  : 'N/A'}
                              </div>
                            </td>
                            <td>
                              <div className={styles.cellContent}>
                                <select
                                  value={studentsGrades[studentCourseKey]?.remark || student.remark || 'INCOMPLETE'}
                                  onChange={(e) => handleGradeChange(student.id, 'remark', e.target.value)}
                                  className={`${styles.remarkSelect} ${studentsGrades[studentCourseKey]?.hasChanges ? styles.changed : ''}`}
                                >
                                  <option value="INCOMPLETE">INCOMPLETE</option>
                                  <option value="PASS">PASS</option>
                                  <option value="FAIL">FAIL</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
              
              {/* Add Encode Grades button */}
              {selectedCourse && (() => {
                const changedStudentsCount = Object.values(studentsGrades).filter(g => 
                  g.hasChanges && String(g.courseId) === String(selectedCourse.id)
                ).length;
                
                return changedStudentsCount > 0 ? (
                  <div className={styles.encodeGradesContainer}>
                    <button
                      onClick={handleEncodeGrades}
                      className={styles.encodeGradesButton}
                      disabled={saveLoading.all}
                    >
                      {saveLoading.all ? 'Encoding...' : `Encode Grades (${changedStudentsCount} student${changedStudentsCount !== 1 ? 's' : ''})`}
                    </button>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast notifications */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default FacultyGrades;
