import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './StudentGrades.module.css';
import Sidebar from './StudentSidebar';
import { useStudentData } from '../hooks/useStudentData';
import { enrolledCourseAPI, semesterEnrollmentAPI } from '../services/api';
import Loading from './Loading';

const StudentGrades = () => {
  const { getUserInfo, studentData } = useStudentData(); // Add studentData here
  const navigate = useNavigate();
  
  // STATE VARIABLES
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [gradesList, setGradesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch student enrollments and grades from backend
  useEffect(() => {
    // Get student ID directly from studentData
    const studentId = studentData?.id;
    console.log('Current student ID:', studentId);
    
    if (!studentId) {
      if (!loading) {
        console.log('No student ID available yet, waiting for data...');
      }
      return;
    }
    
    // Add a check to prevent repeated API calls
    if (gradesList.length > 0 && !loading) {
      return; // Data already loaded, no need to fetch again
    }
    
    setLoading(true);
    
    // Fetch all enrolled courses for this student
    console.log(`Fetching enrolled courses for student ID: ${studentId}`);
    enrolledCourseAPI.getEnrolledCoursesByStudent(studentId)
      .then(res => {
        console.log('Student enrolled courses data:', res.data);
        
        // Transform backend data to match the expected structure
        const backendGrades = (res.data || []).map(ec => {
          console.log('Processing grade data for enrollment:', ec);
          console.log('Grade data:', {
            courseCode: ec.courseCode,
            courseDescription: ec.courseDescription,
            sectionName: ec.sectionName,
            faculty: ec.faculty,
            credits: ec.credits,
            gradeValue: ec.gradeValue,
            grade: ec.grade,
            semester: ec.semester,
            academicYear: ec.academicYear
          });
          
          return {
            id: ec.courseCode || ec.enrolledCourseID || '',
            course: ec.courseDescription || 'Unknown Course',
            section: ec.sectionName || 'N/A',
            instructor: ec.faculty || 'TBA',
            creditUnits: ec.credits || 0,
            midtermGrade: ec.midtermGrade ?? null,
            finalGrade: ec.finalGrade ?? null,
            overallGrade: ec.gradeValue ?? null,
            letterGrade: ec.grade ?? '',
            remarks: ec.remark ?? 
              (ec.gradeValue != null
                ? (ec.gradeValue >= 60 ? 'Passed' : 'Failed')
                : 'In Progress'),
            semester: ec.semester && ec.academicYear 
              ? `${ec.semester} ${ec.academicYear}` 
              : 'Current Semester',
            academicYear: ec.academicYear || 'Current',
            semesterOnly: ec.semester || 'Current',
            status: ec.status || 'Active',
            enrollmentID: ec.enrolledCourseID,
            semesterEnrollmentID: ec.semesterEnrollmentID
          };
        });
        
        console.log('Transformed grades data:', backendGrades);
        setGradesList(backendGrades);
        
        // Extract unique semesters from the enrollments
        const uniqueSemesters = [...new Set(backendGrades.map(g => g.semester))].filter(Boolean);
        console.log('Unique semesters:', uniqueSemesters);
        setSemesters(uniqueSemesters);
        
        // Select the most recent semester by default
        if (uniqueSemesters.length > 0) {
          setSelectedSemester(uniqueSemesters[0]);
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching student grades:', err);
        setError('Failed to load your grades. Please try again later.');
        setLoading(false);
        setGradesList([]);
      });
  }, [studentData, gradesList.length]); // Remove loading, add gradesList.length

  const getAcademicYear = (semester) => {
    if (!semester) return 'N/A';
    
    // Extract academic year from semester string if possible
    const parts = semester.trim().split(' ');
    if (parts.length >= 2) {
      return parts[parts.length - 1]; // Last part should be academic year
    }
    
    return 'N/A';
  };

  const formatSemesterDisplay = (semester) => {
    if (!semester) return { year: 'N/A', semester: 'N/A', academicYear: 'N/A' };
    
    // Parse "1st Semester 2023-2024" format
    const parts = semester.split(' ');
    const semesterPart = parts.length >= 2 ? `${parts[0]} ${parts[1]}` : semester;
    const yearPart = parts.length >= 3 ? parts[parts.length - 1] : '';
    
    return {
      year: yearPart,
      semester: semesterPart,
      academicYear: yearPart
    };
  };

  const filteredGrades = gradesList.filter(grade => {
    const matchesSearch = (grade.course || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (grade.section || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (grade.instructor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (grade.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = grade.semester === selectedSemester || !selectedSemester;
    return matchesSearch && matchesSemester;
  });

  // Calculate academic metrics
  const completedCourses = gradesList.filter(g => g.status === 'COMPLETED' || g.overallGrade != null);

  // For a 1-5 scale where 1 is best (100%) and 5 is worst (0%)
  const totalGradePoints = completedCourses.reduce((sum, grade) => {
    // Only include courses with valid overall grades
    if (grade.overallGrade !== null && grade.overallGrade !== undefined) {
      // Lower is better in this system, so we don't need to invert
      return sum + (grade.overallGrade * grade.creditUnits);
    }
    return sum;
  }, 0);

  const totalCreditUnits = completedCourses.reduce((sum, grade) => 
    sum + (grade.creditUnits || 0), 0);

  // Calculate GPA directly without dividing by 25
  const currentGPA = totalCreditUnits > 0 
    ? (totalGradePoints / totalCreditUnits).toFixed(2) 
    : '0.00';
  const totalUnitsEarned = completedCourses.reduce((sum, grade) => sum + (grade.creditUnits || 0), 0);
  const totalUnitsEnrolled = gradesList.reduce((sum, grade) => sum + (grade.creditUnits || 0), 0);
  const enrollmentStatus = totalUnitsEnrolled >= 18 ? 'Regular' : 'Irregular';

  const handleSemesterSelect = (semester) => {
    setSelectedSemester(semester);
  };

  const showArchiveSemester = () => {
    alert("Archive functionality would be implemented here.");
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Existing Sidebar */}
      <Sidebar userInfo={getUserInfo()} />

      <div className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbLink} onClick={() => navigate('/student-dashboard')}>Dashboard</span>
            <span className={styles.breadcrumbSeparator}> / </span>
            <span className={styles.breadcrumbCurrent}>My Grades</span>
          </div>
          
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>My Grades</h1>
            <div className={styles.semesterIndicator}>
              {selectedSemester || 'No semesters available'}
            </div>
          </div>

          <div className={styles.studentContentWrapper}>
            <div className={styles.studentNavSection}>
              <div className={styles.studentNavHeader}>
                <h2 className={styles.studentNavTitle}>Academic Periods</h2>
                <div className={styles.semesterCurrentInfo}>
                  Academic Year: {getAcademicYear(selectedSemester)}
                </div>
              </div>
              <div className={styles.studentNavList}>
                {semesters.length > 0 ? (
                  semesters.map((semester) => {
                    const semesterInfo = formatSemesterDisplay(semester);
                    return (
                      <div
                        key={semester}
                        className={`${styles.studentNavItem} ${selectedSemester === semester ? styles.studentNavItemActive : ''}`}
                        onClick={() => handleSemesterSelect(semester)}
                      >
                        <span className={styles.studentNavIcon}>📅</span>
                        <div className={styles.semesterInfo}>
                          <div className={styles.semesterMain}>{semesterInfo.semester}</div>
                          <div className={styles.semesterYear}>{semesterInfo.year}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.noSemestersMessage}>
                    {loading ? 'Loading semesters...' : 'No semesters available'}
                  </div>
                )}
              </div>
              <div className={styles.studentNavActions}>
                <button className={styles.studentBtnAddSection} onClick={showArchiveSemester}>
                  Download Transcript
                </button>
              </div>
              <div className={styles.studentNavInfo}>
                <div className={styles.studentNavInfoItem}>
                  <div className={styles.studentNavInfoLabel}>Selected Semester</div>
                  <div className={styles.studentNavInfoValue}>{selectedSemester || 'None'}</div>
                </div>
                <div className={styles.studentNavInfoItem}>
                  <div className={styles.studentNavInfoLabel}>Courses Found</div>
                  <div className={styles.studentNavInfoValue}>{filteredGrades.length}</div>
                </div>
                <div className={styles.studentNavInfoItem}>
                  <div className={styles.studentNavInfoLabel}>Academic Year</div>
                  <div className={styles.studentNavInfoValue}>{getAcademicYear(selectedSemester)}</div>
                </div>
              </div>
            </div>

            <div className={styles.gradesListContainer}>
              <div className={styles.listHeader}>
                <div className={styles.listControls}>
                  <h2 className={styles.listTitle}>Academic Records</h2>
                  <div className={styles.controls}>
                    <input
                      type="text"
                      placeholder="Search courses, instructors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={styles.searchInput}
                    />
                  </div>
                </div>
                
                <div className={styles.academicInfo}>
                  <div className={styles.academicItem}>
                    <span className={styles.academicLabel}>Overall GPA:</span>
                    <span className={`${styles.academicValue} ${styles.gpaValue}`}>{currentGPA}</span>
                  </div>
                  <div className={styles.academicItem}>
                    <span className={styles.academicLabel}>Enrollment Status:</span>
                    <span className={`${styles.academicValue} ${styles.statusBadge} ${enrollmentStatus.toLowerCase() === 'regular' ? styles.statusRegular : styles.statusIrregular}`}>
                      {enrollmentStatus}
                    </span>
                  </div>
                  <div className={styles.academicItem}>
                    <span className={styles.academicLabel}>Units Earned:</span>
                    <span className={styles.academicValue}>{totalUnitsEarned} / {totalUnitsEnrolled}</span>
                  </div>
                </div>
              </div>

              <div className={styles.tableContainer}>
                {loading ? (
                  <Loading message="Loading your grades..." />
                ) : error ? (
                  <div className={styles.errorMessage}>{error}</div>
                ) : filteredGrades.length === 0 ? (
                  <div className={styles.noGradesMessage}>
                    {semesters.length === 0 
                      ? "No enrollment records found." 
                      : "No courses found for the selected semester."}
                  </div>
                ) : (
                  <table className={styles.gradesTable}>
                    <thead>
                      <tr>
                        <th>Course Code</th>
                        <th>Course & Section</th>
                        <th>Instructor</th>
                        <th>Units</th>
                        <th>Midterm</th>
                        <th>Final</th>
                        <th>Overall</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGrades.map((grade) => (
                        <tr key={grade.enrollmentID || grade.id}>
                          <td className={styles.courseCode}>{grade.id}</td>
                          <td>
                            <div className={styles.courseInfo}>
                              <div className={styles.courseName}>{grade.course}</div>
                              <div className={styles.courseSection}>{grade.section}</div>
                            </div>
                          </td>
                          <td className={styles.instructorName}>{grade.instructor}</td>
                          <td className={styles.creditUnits}>{grade.creditUnits}</td>
                          <td className={styles.gradeScore}>
                            {grade.midtermGrade !== null ? Number(grade.midtermGrade).toFixed(2) : '-'}
                          </td>
                          <td className={styles.gradeScore}>
                            {grade.finalGrade !== null ? Number(grade.finalGrade).toFixed(2) : '-'}
                          </td>
                          <td className={styles.gradeScore}>
                            {grade.overallGrade !== null ? Number(grade.overallGrade).toFixed(2) : '-'}
                          </td>
                          <td>
                            <span className={`${styles.remarksBadge} ${
                              grade.remarks === 'Passed' || grade.remarks === 'PASS' 
                                ? styles.remarksPassed 
                                : grade.remarks === 'Failed' || grade.remarks === 'FAIL' 
                                  ? styles.remarksFailed 
                                  : styles.remarksProgress
                            }`}>
                              {grade.remarks === 'PASS' ? 'Passed' : 
                               grade.remarks === 'FAIL' ? 'Failed' : 
                               grade.remarks === 'INCOMPLETE' ? 'In Progress' : 
                               grade.remarks}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className={styles.tableFooter}>
                <div className={styles.tableInfo}>
                  Showing {filteredGrades.length} courses {selectedSemester ? `for ${selectedSemester}` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentGrades;