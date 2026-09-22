import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

export const timetableRouter = Router();

timetableRouter.use(authenticateToken);

// GET /api/timetable
timetableRouter.get('/', requirePermission('timetable.read'), async (_req: Request, res: Response): Promise<void> => {
  // Return structured timetable slots
  const slots = [
    {
      id: 'slot-1',
      day: 'Monday',
      timeSlot: '09:00 - 10:00',
      courseCode: 'CS301',
      courseName: 'Data Structures & Algorithms',
      facultyName: 'Dr. Sarah Jenkins',
      roomNumber: 'LH-101',
      sectionName: 'Section A',
      hasConflict: false,
    },
    {
      id: 'slot-2',
      day: 'Monday',
      timeSlot: '10:15 - 11:15',
      courseCode: 'CS302',
      courseName: 'Operating Systems & Architecture',
      facultyName: 'Prof. David Miller',
      roomNumber: 'LH-102',
      sectionName: 'Section A',
      hasConflict: false,
    },
    {
      id: 'slot-3',
      day: 'Monday',
      timeSlot: '11:30 - 12:30',
      courseCode: 'CS303',
      courseName: 'Database Management Systems',
      facultyName: 'Dr. Sarah Jenkins',
      roomNumber: 'LH-101',
      sectionName: 'Section A',
      hasConflict: false,
    },
    {
      id: 'slot-4',
      day: 'Tuesday',
      timeSlot: '09:00 - 10:00',
      courseCode: 'CS304',
      courseName: 'Computer Networks & Security',
      facultyName: 'Prof. Anita Roy',
      roomNumber: 'LH-103',
      sectionName: 'Section A',
      hasConflict: false,
    },
    {
      id: 'slot-5',
      day: 'Wednesday',
      timeSlot: '14:00 - 16:00',
      courseCode: 'CS305',
      courseName: 'Advanced Algorithms Lab',
      facultyName: 'Prof. David Miller',
      roomNumber: 'LAB-3',
      sectionName: 'Section A',
      hasConflict: false,
    },
  ];

  res.json({
    success: true,
    data: slots,
  });
});
