import { z } from 'zod';

export const studentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  departmentId: z.string().optional(),
  section: z.string().optional(),
  status: z.enum(['active', 'graduated', 'suspended', 'withdrawn']).optional(),
});

export const createStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  rollNumber: z.string().min(1, 'Roll number is required'),
  studentIdNumber: z.string().optional(),
  registrationNumber: z.string().optional(),
  departmentId: z.string().optional(),
  programId: z.string().uuid('Invalid program UUID'),
  academicYearId: z.string().optional(),
  semesterId: z.string().uuid('Invalid semester UUID').optional(),
  currentSemesterId: z.string().uuid('Invalid semester UUID').optional(),
  sectionId: z.string().uuid('Invalid section UUID').optional(),
  currentSectionId: z.string().uuid('Invalid section UUID').optional(),
  admissionDate: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: z.string().optional(),
  gender: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().email().optional().or(z.literal('')),
}).transform((data) => ({
  ...data,
  studentIdNumber: data.studentIdNumber || data.registrationNumber || `STU-${Date.now()}`,
  sectionId: (data.sectionId || data.currentSectionId)!,
  semesterId: (data.semesterId || data.currentSemesterId)!,
  admissionDate: data.admissionDate || new Date().toISOString().split('T')[0],
  dateOfBirth: data.dateOfBirth || '2004-01-01',
}));


export const sectionTransferSchema = z.object({
  toSectionId: z.string().uuid('Target Section ID must be a valid UUID'),
  reason: z.string().min(5, 'A clear justification reason (min 5 characters) is required for section transfer'),
});

export const enrollmentCreateSchema = z.object({
  studentId: z.string().uuid('Student ID must be a valid UUID'),
  sectionCourseId: z.string().uuid('Section Course ID must be a valid UUID'),
});

export type StudentQueryInput = z.infer<typeof studentQuerySchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type SectionTransferInput = z.infer<typeof sectionTransferSchema>;
export type EnrollmentCreateInput = z.infer<typeof enrollmentCreateSchema>;
