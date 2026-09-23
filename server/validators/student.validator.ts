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
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  rollNumber: z.string().min(1, 'Roll number is required'),
  studentIdNumber: z.string().min(1, 'Student ID number is required'),
  programId: z.string().uuid('Invalid program UUID'),
  semesterId: z.string().uuid('Invalid semester UUID'),
  sectionId: z.string().uuid('Invalid section UUID'),
  admissionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Admission date must be YYYY-MM-DD'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD'),
  bloodGroup: z.string().optional(),
  gender: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().email().optional().or(z.literal('')),
});

export const updateStudentSchema = createStudentSchema.partial();

export type StudentQueryInput = z.infer<typeof studentQuerySchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
