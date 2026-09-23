import { z } from 'zod';

export const courseCreateSchema = z.object({
  departmentId: z.string().uuid('Department ID must be a valid UUID'),
  code: z.string().min(2, 'Course code is required').max(32),
  name: z.string().min(2, 'Course name is required').max(255),
  credits: z.number().int().min(1, 'Credits must be at least 1').max(20),
  courseType: z.enum(['core', 'elective', 'lab', 'seminar']).default('core'),
  syllabus: z.string().optional(),
  description: z.string().optional(),
  programId: z.string().uuid().optional(),
  semesterId: z.string().uuid().optional(),
});

export const courseUpdateSchema = courseCreateSchema.partial();

export const courseQuerySchema = z.object({
  departmentId: z.string().optional(),
  programId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;
export type CourseQueryInput = z.infer<typeof courseQuerySchema>;
