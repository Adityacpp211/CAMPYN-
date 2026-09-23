import { z } from 'zod';

export const facultyCreateSchema = z.object({
  email: z.string().email('Valid institutional email is required'),
  username: z.string().min(3).max(64),
  firstName: z.string().min(1).max(128),
  lastName: z.string().min(1).max(128),
  departmentId: z.string().uuid('Department ID must be a valid UUID'),
  employeeId: z.string().min(2).max(64),
  designation: z.string().min(2).max(128),
  qualification: z.string().min(2).max(255),
  specialization: z.string().optional(),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Joining date must be YYYY-MM-DD'),
});

export const facultyUpdateSchema = z.object({
  firstName: z.string().min(1).max(128).optional(),
  lastName: z.string().min(1).max(128).optional(),
  departmentId: z.string().uuid().optional(),
  designation: z.string().min(2).max(128).optional(),
  qualification: z.string().min(2).max(255).optional(),
  specialization: z.string().optional(),
  status: z.enum(['active', 'on_leave', 'retired', 'resigned']).optional(),
});

export const facultyAssignSchema = z.object({
  facultyId: z.string().uuid('Faculty ID must be a valid UUID'),
  courseId: z.string().uuid('Course ID must be a valid UUID'),
  sectionId: z.string().uuid('Section ID must be a valid UUID'),
});

export const facultyQuerySchema = z.object({
  departmentId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type FacultyCreateInput = z.infer<typeof facultyCreateSchema>;
export type FacultyUpdateInput = z.infer<typeof facultyUpdateSchema>;
export type FacultyAssignInput = z.infer<typeof facultyAssignSchema>;
export type FacultyQueryInput = z.infer<typeof facultyQuerySchema>;
