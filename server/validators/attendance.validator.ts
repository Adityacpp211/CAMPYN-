import { z } from 'zod';

export const recordAttendanceSchema = z.object({
  sectionCourseId: z.string().uuid('Invalid section course UUID'),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Session date must be YYYY-MM-DD'),
  slotStart: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Slot start must be HH:MM or HH:MM:SS'),
  slotEnd: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Slot end must be HH:MM or HH:MM:SS'),
  records: z.array(
    z.object({
      studentId: z.string().uuid('Invalid student UUID'),
      status: z.enum(['present', 'absent', 'late', 'excused']),
    })
  ).min(1, 'At least one student attendance record is required'),
});

export const attendanceCorrectionSchema = z.object({
  attendanceRecordId: z.string().uuid('Invalid attendance record UUID'),
  newStatus: z.enum(['present', 'absent', 'late', 'excused']),
  reason: z.string().min(5, 'Reason must be at least 5 characters long'),
});

export type RecordAttendanceInput = z.infer<typeof recordAttendanceSchema>;
export type AttendanceCorrectionInput = z.infer<typeof attendanceCorrectionSchema>;
