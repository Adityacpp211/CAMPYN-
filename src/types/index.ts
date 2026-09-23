export type UserRole =
  | 'SUPER_ADMIN'
  | 'COLLEGE_ADMIN'
  | 'PRINCIPAL'
  | 'HOD'
  | 'FACULTY'
  | 'STUDENT'
  | 'PARENT'
  | 'ACCOUNTANT'
  | 'LIBRARIAN'
  | 'EXAM_CELL'
  | 'PLACEMENT_OFFICER'
  | 'HOSTEL_ADMIN'
  | 'TRANSPORT_ADMIN'
  | 'AUDITOR';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  departmentId?: string;
  phone?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  hodName: string;
  studentCount: number;
  facultyCount: number;
}

export interface Course {
  id: string;
  departmentId: string;
  code: string;
  name: string;
  credits: number;
  type: 'core' | 'elective' | 'lab';
  facultyId: string;
  facultyName: string;
  semester: number;
}

export interface Student {
  id: string;
  userId: string;
  studentIdNumber: string;
  rollNumber: string;
  registrationNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string;
  programName: string;
  semesterNumber: number;
  sectionName: string;
  admissionDate: string;
  dateOfBirth: string;
  bloodGroup: string;
  guardianName: string;
  guardianPhone: string;
  academicStatus: 'active' | 'graduated' | 'suspended';
  attendancePercentage: number;
  cgpa: number;
  pendingFees: number;
}

export interface Faculty {
  id: string;
  userId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string;
  designation: string;
  qualification: string;
  specialization: string;
  joiningDate: string;
  coursesHandled: string[];
}

export interface AttendanceSession {
  id: string;
  courseCode: string;
  courseName: string;
  sectionName: string;
  sessionDate: string;
  slot: string;
  recordedBy: string;
  isLocked: boolean;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  studentRoll: string;
  studentName: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  recordedAt: string;
}

export interface AttendanceCorrection {
  id: string;
  recordId: string;
  requestedBy: string;
  previousStatus: 'present' | 'absent' | 'late' | 'excused';
  newStatus: 'present' | 'absent' | 'late' | 'excused';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

export interface TimetableSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  dayOfWeek?: string;
  timeSlot: string;
  courseCode: string;
  courseName: string;
  facultyName: string;
  roomNumber: string;
  sectionName: string;
  hasConflict?: boolean;
  conflictDetails?: string;
}


export interface Assignment {
  id: string;
  courseCode: string;
  courseName: string;
  title: string;
  description: string;
  maxMarks: number;
  dueDate: string;
  allowLate: boolean;
  submissionCount: number;
  totalStudents: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentRoll: string;
  studentName: string;
  submittedAt: string;
  isLate: boolean;
  marksAwarded?: number;
  feedback?: string;
  status: 'submitted' | 'graded';
}

export interface Examination {
  id: string;
  title: string;
  examType: 'midterm' | 'final' | 'internal' | 'lab';
  semester: number;
  isLocked: boolean;
  isPublished: boolean;
}

export interface MarksEntry {
  id: string;
  examId: string;
  courseCode: string;
  studentId: string;
  studentRoll: string;
  studentName: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  verified: boolean;
}

export interface FeeDue {
  id: string;
  studentId: string;
  studentRoll: string;
  studentName: string;
  title: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid';
}

export interface FeeTransaction {
  id: string;
  feeDueId: string;
  reference: string;
  studentName: string;
  amount: number;
  paymentMode: 'online' | 'cheque' | 'bank_transfer' | 'cash' | 'reversal';
  receiptNumber: string;
  status: 'success' | 'reversed';
  timestamp: string;
  notes?: string;
}

export interface ApprovalRequest {
  id: string;
  requesterName: string;
  requesterRole: UserRole;
  entity: 'attendance' | 'marks' | 'fee_refund' | 'leave';
  entityId: string;
  requestType: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  currentApprover: string;
  decisionReason?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorEmail: string;
  role: UserRole;
  action: 'LOGIN' | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'MARKS_CHANGE' | 'ATTENDANCE_CHANGE' | 'PAYMENT' | 'REFUND';
  entity: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  reason?: string;
  ipAddress: string;
  timestamp: string;
}

export interface GlobalFilterState {
  academicYear: string;
  semester: number;
  departmentId: string;
  section: string;
}
