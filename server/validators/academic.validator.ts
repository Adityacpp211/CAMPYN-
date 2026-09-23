import { z } from 'zod';

export const departmentCreateSchema = z.object({
  code: z.string().min(2, 'Department code must be at least 2 characters').max(32),
  name: z.string().min(2, 'Department name must be at least 2 characters').max(255),
  campusId: z.string().uuid().optional(),
  description: z.string().optional(),
  hodId: z.string().uuid().optional(),
});

export const departmentUpdateSchema = departmentCreateSchema.partial();

export const programCreateSchema = z.object({
  departmentId: z.string().uuid('Department ID must be a valid UUID'),
  code: z.string().min(2).max(32),
  name: z.string().min(2).max(255),
  degreeType: z.string().min(2).max(64),
  durationSemesters: z.number().int().min(1).max(12),
  totalCredits: z.number().int().min(1).max(400),
});

export const academicYearCreateSchema = z.object({
  name: z.string().min(4).max(64),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  isCurrent: z.boolean().optional(),
});

export const semesterCreateSchema = z.object({
  academicYearId: z.string().uuid('Academic Year ID must be a valid UUID'),
  programId: z.string().uuid().optional(),
  term: z.string().min(2).max(32),
  semesterNumber: z.number().int().min(1).max(12),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isCurrent: z.boolean().optional(),
});

export const sectionCreateSchema = z.object({
  programId: z.string().uuid(),
  semesterId: z.string().uuid(),
  academicYearId: z.string().uuid().optional(),
  name: z.string().min(1).max(32),
  capacity: z.number().int().min(1).max(200).default(60),
});

export type DepartmentCreateInput = z.infer<typeof departmentCreateSchema>;
export type DepartmentUpdateInput = z.infer<typeof departmentUpdateSchema>;
export type ProgramCreateInput = z.infer<typeof programCreateSchema>;
export type AcademicYearCreateInput = z.infer<typeof academicYearCreateSchema>;
export type SemesterCreateInput = z.infer<typeof semesterCreateSchema>;
export type SectionCreateInput = z.infer<typeof sectionCreateSchema>;
