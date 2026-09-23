import { z } from 'zod';

export const timetableSlotCreateSchema = z.object({
  sectionCourseId: z.string().uuid('Section Course ID must be a valid UUID'),
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, 'Start time must be HH:MM or HH:MM:SS'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, 'End time must be HH:MM or HH:MM:SS'),
  roomNumber: z.string().min(1, 'Room number is required').max(64),
  slotType: z.enum(['lecture', 'lab', 'tutorial', 'seminar', 'break']).default('lecture'),
});

export const timetableQuerySchema = z.object({
  sectionId: z.string().optional(),
  facultyId: z.string().optional(),
  courseId: z.string().optional(),
  roomNumber: z.string().optional(),
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).optional(),
});

export type TimetableSlotCreateInput = z.infer<typeof timetableSlotCreateSchema>;
export type TimetableQueryInput = z.infer<typeof timetableQuerySchema>;
