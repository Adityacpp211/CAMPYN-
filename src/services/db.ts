import {
  Department,
  Course,
  Student,
  Faculty,
  AttendanceSession,
  AttendanceRecord,
  AttendanceCorrection,
  TimetableSlot,
  Assignment,
  Submission,
  Examination,
  MarksEntry,
  FeeDue,
  FeeTransaction,
  ApprovalRequest,
  AuditLog,
  User,
} from '../types';


class CampusDatabase {
  public departments: Department[] = [
    { id: 'dept-cse', code: 'CSE', name: 'Computer Science & Engineering', hodName: 'Dr. Sarah Jenkins', studentCount: 420, facultyCount: 28 },
    { id: 'dept-ece', code: 'ECE', name: 'Electronics & Communication', hodName: 'Dr. Anita Roy', studentCount: 310, facultyCount: 22 },
    { id: 'dept-me', code: 'ME', name: 'Mechanical Engineering', hodName: 'Prof. Marcus Vance', studentCount: 260, facultyCount: 18 },
    { id: 'dept-it', code: 'IT', name: 'Information Technology', hodName: 'Dr. Rajesh Nair', studentCount: 340, facultyCount: 24 },
  ];

  public courses: Course[] = [
    { id: 'c-101', departmentId: 'dept-cse', code: 'CS301', name: 'Data Structures & Algorithms', credits: 4, type: 'core', facultyId: 'fac-1', facultyName: 'Dr. Sarah Jenkins', semester: 5 },
    { id: 'c-102', departmentId: 'dept-cse', code: 'CS302', name: 'Operating Systems & Architecture', credits: 4, type: 'core', facultyId: 'fac-2', facultyName: 'Prof. David Miller', semester: 5 },
    { id: 'c-103', departmentId: 'dept-cse', code: 'CS303', name: 'Database Management Systems', credits: 3, type: 'core', facultyId: 'fac-1', facultyName: 'Dr. Sarah Jenkins', semester: 5 },
    { id: 'c-104', departmentId: 'dept-cse', code: 'CS304', name: 'Computer Networks & Security', credits: 4, type: 'core', facultyId: 'fac-3', facultyName: 'Prof. Anita Roy', semester: 5 },
    { id: 'c-105', departmentId: 'dept-cse', code: 'CS305', name: 'Advanced Algorithms Lab', credits: 2, type: 'lab', facultyId: 'fac-2', facultyName: 'Prof. David Miller', semester: 5 },
  ];

  public faculty: Faculty[] = [
    {
      id: 'fac-1',
      userId: 'u-fac-1',
      employeeId: 'EMP-CSE-001',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 's.jenkins@campus.edu',
      phone: '+1 (555) 234-8901',
      departmentId: 'dept-cse',
      designation: 'Professor & HOD',
      qualification: 'Ph.D. in Computer Science (MIT)',
      specialization: 'Distributed Systems & Database Theory',
      joiningDate: '2016-08-15',
      coursesHandled: ['CS301', 'CS303'],
    },
    {
      id: 'fac-2',
      userId: 'u-fac-2',
      employeeId: 'EMP-CSE-014',
      firstName: 'David',
      lastName: 'Miller',
      email: 'd.miller@campus.edu',
      phone: '+1 (555) 345-6712',
      departmentId: 'dept-cse',
      designation: 'Associate Professor',
      qualification: 'Ph.D. in Systems Engineering (Stanford)',
      specialization: 'Kernel Architecture & Virtualization',
      joiningDate: '2019-01-10',
      coursesHandled: ['CS302', 'CS305'],
    },
    {
      id: 'fac-3',
      userId: 'u-fac-3',
      employeeId: 'EMP-ECE-008',
      firstName: 'Anita',
      lastName: 'Roy',
      email: 'a.roy@campus.edu',
      phone: '+1 (555) 456-7823',
      departmentId: 'dept-ece',
      designation: 'Professor & HOD',
      qualification: 'Ph.D. in Signal Processing (Oxford)',
      specialization: 'Network Protocols & Cryptography',
      joiningDate: '2015-07-01',
      coursesHandled: ['CS304'],
    },
  ];

  public students: Student[] = [
    {
      id: 'stu-1',
      userId: 'u-stu-1',
      studentIdNumber: 'SID-2024-0412',
      rollNumber: 'CSE-24-001',
      registrationNumber: 'REG2024CS09881',
      firstName: 'Maya',
      lastName: 'Chen',
      email: 'm.chen@campus.edu',
      phone: '+1 (555) 890-1122',
      departmentId: 'dept-cse',
      programName: 'B.Tech Computer Science',
      semesterNumber: 5,
      sectionName: 'Section A',
      admissionDate: '2024-08-01',
      dateOfBirth: '2004-05-14',
      bloodGroup: 'O+',
      guardianName: 'Robert Chen',
      guardianPhone: '+1 (555) 890-9900',
      academicStatus: 'active',
      attendancePercentage: 88.5,
      cgpa: 3.92,
      pendingFees: 0,
    },
    {
      id: 'stu-2',
      userId: 'u-stu-2',
      studentIdNumber: 'SID-2024-0413',
      rollNumber: 'CSE-24-002',
      registrationNumber: 'REG2024CS09882',
      firstName: 'Aarav',
      lastName: 'Sharma',
      email: 'a.sharma@campus.edu',
      phone: '+1 (555) 781-3344',
      departmentId: 'dept-cse',
      programName: 'B.Tech Computer Science',
      semesterNumber: 5,
      sectionName: 'Section A',
      admissionDate: '2024-08-01',
      dateOfBirth: '2004-11-20',
      bloodGroup: 'B+',
      guardianName: 'Priya Sharma',
      guardianPhone: '+1 (555) 781-9988',
      academicStatus: 'active',
      attendancePercentage: 71.0, // Shortage alert!
      cgpa: 3.65,
      pendingFees: 1200,
    },
    {
      id: 'stu-3',
      userId: 'u-stu-3',
      studentIdNumber: 'SID-2024-0414',
      rollNumber: 'CSE-24-003',
      registrationNumber: 'REG2024CS09883',
      firstName: 'Liam',
      lastName: 'Vance',
      email: 'l.vance@campus.edu',
      phone: '+1 (555) 672-4455',
      departmentId: 'dept-cse',
      programName: 'B.Tech Computer Science',
      semesterNumber: 5,
      sectionName: 'Section A',
      admissionDate: '2024-08-01',
      dateOfBirth: '2004-03-08',
      bloodGroup: 'A-',
      guardianName: 'Arthur Vance',
      guardianPhone: '+1 (555) 672-8877',
      academicStatus: 'active',
      attendancePercentage: 94.0,
      cgpa: 3.88,
      pendingFees: 0,
    },
    {
      id: 'stu-4',
      userId: 'u-stu-4',
      studentIdNumber: 'SID-2024-0415',
      rollNumber: 'CSE-24-004',
      registrationNumber: 'REG2024CS09884',
      firstName: 'Elena',
      lastName: 'Rostova',
      email: 'e.rostova@campus.edu',
      phone: '+1 (555) 451-2289',
      departmentId: 'dept-cse',
      programName: 'B.Tech Computer Science',
      semesterNumber: 5,
      sectionName: 'Section A',
      admissionDate: '2024-08-01',
      dateOfBirth: '2004-09-30',
      bloodGroup: 'AB+',
      guardianName: 'Dmitri Rostov',
      guardianPhone: '+1 (555) 451-9911',
      academicStatus: 'active',
      attendancePercentage: 82.0,
      cgpa: 3.74,
      pendingFees: 450,
    },
    {
      id: 'stu-5',
      userId: 'u-stu-5',
      studentIdNumber: 'SID-2024-0416',
      rollNumber: 'CSE-24-005',
      registrationNumber: 'REG2024CS09885',
      firstName: 'Marcus',
      lastName: 'Zhang',
      email: 'm.zhang@campus.edu',
      phone: '+1 (555) 902-6677',
      departmentId: 'dept-cse',
      programName: 'B.Tech Computer Science',
      semesterNumber: 5,
      sectionName: 'Section A',
      admissionDate: '2024-08-01',
      dateOfBirth: '2004-07-19',
      bloodGroup: 'O-',
      guardianName: 'Wei Zhang',
      guardianPhone: '+1 (555) 902-3322',
      academicStatus: 'active',
      attendancePercentage: 68.0, // Critical shortage!
      cgpa: 3.42,
      pendingFees: 2400,
    },
  ];

  public attendanceSessions: AttendanceSession[] = [
    {
      id: 'att-sess-1',
      courseCode: 'CS301',
      courseName: 'Data Structures & Algorithms',
      sectionName: 'Section A',
      sessionDate: '2026-09-22',
      slot: '09:00 - 10:00 AM',
      recordedBy: 'Dr. Sarah Jenkins',
      isLocked: false,
    },
  ];

  public attendanceRecords: AttendanceRecord[] = [
    { id: 'rec-1', sessionId: 'att-sess-1', studentId: 'stu-1', studentRoll: 'CSE-24-001', studentName: 'Maya Chen', status: 'present', recordedAt: '2026-09-22 09:05:00' },
    { id: 'rec-2', sessionId: 'att-sess-1', studentId: 'stu-2', studentRoll: 'CSE-24-002', studentName: 'Aarav Sharma', status: 'absent', recordedAt: '2026-09-22 09:05:00' },
    { id: 'rec-3', sessionId: 'att-sess-1', studentId: 'stu-3', studentRoll: 'CSE-24-003', studentName: 'Liam Vance', status: 'present', recordedAt: '2026-09-22 09:05:00' },
    { id: 'rec-4', sessionId: 'att-sess-1', studentId: 'stu-4', studentRoll: 'CSE-24-004', studentName: 'Elena Rostova', status: 'present', recordedAt: '2026-09-22 09:05:00' },
    { id: 'rec-5', sessionId: 'att-sess-1', studentId: 'stu-5', studentRoll: 'CSE-24-005', studentName: 'Marcus Zhang', status: 'absent', recordedAt: '2026-09-22 09:05:00' },
  ];

  public attendanceCorrections: AttendanceCorrection[] = [
    {
      id: 'corr-1',
      recordId: 'rec-2',
      requestedBy: 'Aarav Sharma (Student)',
      previousStatus: 'absent',
      newStatus: 'excused',
      reason: 'Representing University in Inter-Collegiate ACM-ICPC Regional Hackathon.',
      status: 'pending',
      timestamp: '2026-09-22 10:15:00',
    },
  ];

  public timetableSlots: TimetableSlot[] = [
    { id: 'tt-1', day: 'Monday', timeSlot: '09:00 - 10:00 AM', courseCode: 'CS301', courseName: 'Data Structures', facultyName: 'Dr. Sarah Jenkins', roomNumber: 'Room 301', sectionName: 'Section A' },
    { id: 'tt-2', day: 'Monday', timeSlot: '10:15 - 11:15 AM', courseCode: 'CS302', courseName: 'Operating Systems', facultyName: 'Prof. David Miller', roomNumber: 'Room 301', sectionName: 'Section A' },
    { id: 'tt-3', day: 'Monday', timeSlot: '11:30 - 01:00 PM', courseCode: 'CS305', courseName: 'Advanced Algo Lab', facultyName: 'Prof. David Miller', roomNumber: 'Computing Lab 4', sectionName: 'Section A' },
    { id: 'tt-4', day: 'Tuesday', timeSlot: '09:00 - 10:00 AM', courseCode: 'CS303', courseName: 'Database Systems', facultyName: 'Dr. Sarah Jenkins', roomNumber: 'Room 302', sectionName: 'Section A' },
    { id: 'tt-5', day: 'Tuesday', timeSlot: '10:15 - 11:15 AM', courseCode: 'CS304', courseName: 'Computer Networks', facultyName: 'Prof. Anita Roy', roomNumber: 'Room 302', sectionName: 'Section A' },
    { id: 'tt-6', day: 'Wednesday', timeSlot: '09:00 - 10:00 AM', courseCode: 'CS301', courseName: 'Data Structures', facultyName: 'Dr. Sarah Jenkins', roomNumber: 'Room 301', sectionName: 'Section A' },
    { id: 'tt-7', day: 'Wednesday', timeSlot: '10:15 - 11:15 AM', courseCode: 'CS302', courseName: 'Operating Systems', facultyName: 'Prof. David Miller', roomNumber: 'Room 301', sectionName: 'Section A', hasConflict: true, conflictDetails: 'Room 301 double-booked with ECE Seminar slot' },
  ];

  public assignments: Assignment[] = [
    {
      id: 'asg-1',
      courseCode: 'CS301',
      courseName: 'Data Structures & Algorithms',
      title: 'B-Tree & Red-Black Tree Implementation in C++',
      description: 'Implement a fully concurrent Red-Black Tree with insertion, deletion, and rotation balance verifiers.',
      maxMarks: 50,
      dueDate: '2026-09-28 23:59',
      allowLate: false,
      submissionCount: 4,
      totalStudents: 5,
    },
    {
      id: 'asg-2',
      courseCode: 'CS302',
      courseName: 'Operating Systems',
      title: 'Custom Linux Kernel Module & Scheduling Benchmark',
      description: 'Write a kernel module that captures page fault frequencies and compares CFS vs. Realtime FIFO.',
      maxMarks: 40,
      dueDate: '2026-10-05 23:59',
      allowLate: true,
      submissionCount: 2,
      totalStudents: 5,
    },
  ];

  public submissions: Submission[] = [
    { id: 'sub-1', assignmentId: 'asg-1', studentId: 'stu-1', studentRoll: 'CSE-24-001', studentName: 'Maya Chen', submittedAt: '2026-09-22 14:20', isLate: false, marksAwarded: 48, feedback: 'Flawless rotation logic and valgrind clean.', status: 'graded' },
    { id: 'sub-2', assignmentId: 'asg-1', studentId: 'stu-2', studentRoll: 'CSE-24-002', studentName: 'Aarav Sharma', submittedAt: '2026-09-22 18:45', isLate: false, marksAwarded: 42, feedback: 'Minor memory leak on double-black node resolution.', status: 'graded' },
    { id: 'sub-3', assignmentId: 'asg-1', studentId: 'stu-3', studentRoll: 'CSE-24-003', studentName: 'Liam Vance', submittedAt: '2026-09-22 20:10', isLate: false, status: 'submitted' },
    { id: 'sub-4', assignmentId: 'asg-1', studentId: 'stu-4', studentRoll: 'CSE-24-004', studentName: 'Elena Rostova', submittedAt: '2026-09-22 21:00', isLate: false, status: 'submitted' },
  ];

  public examinations: Examination[] = [
    { id: 'exam-1', title: 'Mid-Term Theory Examinations', examType: 'midterm', semester: 5, isLocked: false, isPublished: false },
    { id: 'exam-2', title: 'Continuous Assessment Test 1 (CAT-1)', examType: 'internal', semester: 5, isLocked: true, isPublished: true },
  ];

  public marksEntries: MarksEntry[] = [
    { id: 'm-1', examId: 'exam-2', courseCode: 'CS301', studentId: 'stu-1', studentRoll: 'CSE-24-001', studentName: 'Maya Chen', marksObtained: 48, maxMarks: 50, grade: 'A+', verified: true },
    { id: 'm-2', examId: 'exam-2', courseCode: 'CS301', studentId: 'stu-2', studentRoll: 'CSE-24-002', studentName: 'Aarav Sharma', marksObtained: 41, maxMarks: 50, grade: 'A', verified: true },
    { id: 'm-3', examId: 'exam-2', courseCode: 'CS301', studentId: 'stu-3', studentRoll: 'CSE-24-003', studentName: 'Liam Vance', marksObtained: 47, maxMarks: 50, grade: 'A+', verified: true },
    { id: 'm-4', examId: 'exam-2', courseCode: 'CS301', studentId: 'stu-4', studentRoll: 'CSE-24-004', studentName: 'Elena Rostova', marksObtained: 44, maxMarks: 50, grade: 'A', verified: true },
    { id: 'm-5', examId: 'exam-2', courseCode: 'CS301', studentId: 'stu-5', studentRoll: 'CSE-24-005', studentName: 'Marcus Zhang', marksObtained: 34, maxMarks: 50, grade: 'B', verified: true },
  ];

  public feeDues: FeeDue[] = [
    { id: 'fee-1', studentId: 'stu-1', studentRoll: 'CSE-24-001', studentName: 'Maya Chen', title: 'Semester 5 Tuition & Laboratory Fee', totalAmount: 4800, paidAmount: 4800, outstandingAmount: 0, dueDate: '2026-08-30', status: 'paid' },
    { id: 'fee-2', studentId: 'stu-2', studentRoll: 'CSE-24-002', studentName: 'Aarav Sharma', title: 'Semester 5 Tuition & Laboratory Fee', totalAmount: 4800, paidAmount: 3600, outstandingAmount: 1200, dueDate: '2026-08-30', status: 'partial' },
    { id: 'fee-3', studentId: 'stu-3', studentRoll: 'CSE-24-003', studentName: 'Liam Vance', title: 'Semester 5 Tuition & Laboratory Fee', totalAmount: 4800, paidAmount: 4800, outstandingAmount: 0, dueDate: '2026-08-30', status: 'paid' },
    { id: 'fee-4', studentId: 'stu-4', studentRoll: 'CSE-24-004', studentName: 'Elena Rostova', title: 'Semester 5 Examination & Library Dues', totalAmount: 950, paidAmount: 500, outstandingAmount: 450, dueDate: '2026-09-15', status: 'partial' },
    { id: 'fee-5', studentId: 'stu-5', studentRoll: 'CSE-24-005', studentName: 'Marcus Zhang', title: 'Semester 5 Tuition & Hostel Accommodation', totalAmount: 6400, paidAmount: 4000, outstandingAmount: 2400, dueDate: '2026-08-30', status: 'partial' },
  ];

  public feeTransactions: FeeTransaction[] = [
    { id: 'txn-101', feeDueId: 'fee-1', reference: 'TXN-20260810-0988', studentName: 'Maya Chen', amount: 4800, paymentMode: 'online', receiptNumber: 'REC-77821', status: 'success', timestamp: '2026-08-10 11:24:00', notes: 'Settled full tuition via Stripe NetBanking' },
    { id: 'txn-102', feeDueId: 'fee-2', reference: 'TXN-20260814-3411', studentName: 'Aarav Sharma', amount: 3600, paymentMode: 'bank_transfer', receiptNumber: 'REC-77894', status: 'success', timestamp: '2026-08-14 15:40:00', notes: 'Installment 1 wire transfer acknowledged' },
  ];

  public approvalRequests: ApprovalRequest[] = [
    {
      id: 'appr-1',
      requesterName: 'Aarav Sharma',
      requesterRole: 'STUDENT',
      entity: 'attendance',
      entityId: 'rec-2',
      requestType: 'Attendance Regularization',
      reason: 'ACM-ICPC Regional Hackathon attendance waiver document submitted.',
      status: 'pending',
      currentApprover: 'Dr. Sarah Jenkins (HOD CSE)',
      createdAt: '2026-09-22 10:15',
    },
    {
      id: 'appr-2',
      requesterName: 'Prof. David Miller',
      requesterRole: 'FACULTY',
      entity: 'marks',
      entityId: 'm-2',
      requestType: 'CAT-1 Re-evaluation Correction',
      reason: 'Totaling omission of 4 marks on Question 3B for Student Aarav Sharma.',
      status: 'pending',
      currentApprover: 'Exam Cell / Principal',
      createdAt: '2026-09-22 11:30',
    },
  ];

  public auditLogs: AuditLog[] = [
    {
      id: 'aud-1',
      actorEmail: 'admin@campus.edu',
      role: 'COLLEGE_ADMIN',
      action: 'LOGIN',
      entity: 'auth',
      entityId: 'session-01',
      ipAddress: '192.168.1.10',
      timestamp: '2026-09-22 08:30:12',
    },
    {
      id: 'aud-2',
      actorEmail: 's.jenkins@campus.edu',
      role: 'FACULTY',
      action: 'CREATE',
      entity: 'attendance_session',
      entityId: 'att-sess-1',
      newValues: { course: 'CS301', section: 'Section A', date: '2026-09-22', presentCount: 3, absentCount: 2 },
      reason: 'Morning class attendance marked',
      ipAddress: '192.168.1.44',
      timestamp: '2026-09-22 09:05:00',
    },
  ];

  // Transactional Audit Logger
  public logAudit(
    actor: User,
    action: AuditLog['action'],
    entity: string,
    entityId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    reason?: string
  ): void {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actorEmail: actor.email,
      role: actor.role,
      action,
      entity,
      entityId,
      oldValues,
      newValues,
      reason: reason || 'Operation committed via CampusOS',
      ipAddress: '127.0.0.1',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    this.auditLogs.unshift(log);
  }

  // Attendance update with mandatory reason & audit tracking
  public updateAttendanceRecord(
    recordId: string,
    newStatus: 'present' | 'absent' | 'late' | 'excused',
    reason: string,
    actor: User
  ): boolean {
    const rec = this.attendanceRecords.find((r) => r.id === recordId);
    if (!rec) return false;

    const oldStatus = rec.status;
    rec.status = newStatus;

    this.logAudit(
      actor,
      'ATTENDANCE_CHANGE',
      'attendance_record',
      recordId,
      { status: oldStatus },
      { status: newStatus },
      `Attendance updated for ${rec.studentName} (${rec.studentRoll}): ${reason}`
    );

    return true;
  }

  // Transactional Fee Payment Settlement
  public recordFeePayment(
    feeDueId: string,
    amount: number,
    mode: 'online' | 'cheque' | 'bank_transfer' | 'cash',
    actor: User
  ): boolean {
    const due = this.feeDues.find((d) => d.id === feeDueId);
    if (!due || due.outstandingAmount <= 0) return false;

    const actualPayment = Math.min(amount, due.outstandingAmount);
    const oldDueState = { paid: due.paidAmount, outstanding: due.outstandingAmount, status: due.status };

    due.paidAmount += actualPayment;
    due.outstandingAmount -= actualPayment;
    due.status = due.outstandingAmount === 0 ? 'paid' : 'partial';

    const txn: FeeTransaction = {
      id: `txn-${Date.now()}`,
      feeDueId,
      reference: `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      studentName: due.studentName,
      amount: actualPayment,
      paymentMode: mode,
      receiptNumber: `REC-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'success',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      notes: `Recorded by ${actor.firstName} ${actor.lastName} (${actor.role})`,
    };

    this.feeTransactions.unshift(txn);

    this.logAudit(
      actor,
      'PAYMENT',
      'fee_dues',
      feeDueId,
      oldDueState,
      { paid: due.paidAmount, outstanding: due.outstandingAmount, status: due.status, txnId: txn.id },
      `Payment collected for ${due.studentName}: $${actualPayment} via ${mode}`
    );

    return true;
  }

  // Non-destructive Fee Refund Reversal
  public refundFeeTransaction(txnId: string, reason: string, actor: User): boolean {
    const txn = this.feeTransactions.find((t) => t.id === txnId);
    if (!txn || txn.status === 'reversed') return false;

    const due = this.feeDues.find((d) => d.id === txn.feeDueId);
    if (!due) return false;

    txn.status = 'reversed';
    due.paidAmount -= txn.amount;
    due.outstandingAmount += txn.amount;
    due.status = due.outstandingAmount === due.totalAmount ? 'unpaid' : 'partial';

    this.logAudit(
      actor,
      'REFUND',
      'fee_transactions',
      txnId,
      { amount: txn.amount, previousStatus: 'success' },
      { reversedAmount: txn.amount, currentStatus: 'reversed' },
      `Transaction ${txn.reference} reversed. Reason: ${reason}`
    );

    return true;
  }

  // Workflow Approval resolution
  public resolveApproval(
    requestId: string,
    decision: 'approved' | 'rejected',
    decisionReason: string,
    actor: User
  ): boolean {
    const req = this.approvalRequests.find((r) => r.id === requestId);
    if (!req || req.status !== 'pending') return false;

    req.status = decision;
    req.decisionReason = decisionReason;

    // Execute side-effect if approved
    if (decision === 'approved' && req.entity === 'attendance') {
      const corr = this.attendanceCorrections.find((c) => c.id === 'corr-1');
      if (corr) {
        corr.status = 'approved';
        this.updateAttendanceRecord(corr.recordId, corr.newStatus, `Approved by ${actor.firstName}: ${decisionReason}`, actor);
      }
    }

    this.logAudit(
      actor,
      decision === 'approved' ? 'APPROVE' : 'REJECT',
      'approval_requests',
      requestId,
      { status: 'pending' },
      { status: decision, decisionReason },
      `Workflow request [${req.requestType}] resolved with ${decision}`
    );

    return true;
  }
}

export const db = new CampusDatabase();
