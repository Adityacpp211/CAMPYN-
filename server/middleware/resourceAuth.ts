import { dbClient } from '../db';
import { AuthUser } from './auth';

export class ResourceAuthError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, code = 'RESOURCE_ACCESS_DENIED', statusCode = 403) {
    super(message);
    this.name = 'ResourceAuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Ensures a student can only access their own records (IDOR protection).
 */
export async function assertStudentSelfAccess(
  actor: AuthUser,
  targetStudentIdOrRoll: string
): Promise<void> {
  if (actor.role !== 'STUDENT') {
    // Non-students (faculty, admin, accountant) are governed by RBAC
    return;
  }

  // Lookup target student's user_id
  const stuRes = await dbClient.query(`
    SELECT user_id, id, roll_number 
    FROM students 
    WHERE id::text = $1 OR roll_number = $1
  `, [targetStudentIdOrRoll]);

  if (stuRes.rows.length === 0) {
    throw new ResourceAuthError('Requested student record not found', 'RESOURCE_NOT_FOUND', 404);
  }

  const target = stuRes.rows[0];
  if (target.user_id !== actor.id) {
    throw new ResourceAuthError(
      'IDOR Violation: Students are strictly restricted to accessing their own records',
      'STUDENT_PRIVACY_VIOLATION',
      403
    );
  }
}

/**
 * Ensures faculty can only record/modify attendance or marks for courses they are actively assigned to teach.
 */
export async function assertFacultyCourseAssignment(
  actor: AuthUser,
  courseIdOrCode: string,
  sectionId?: string
): Promise<void> {
  // Administrators, HODs, Exam Cell can manage across department
  if (['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'HOD', 'EXAM_CELL'].includes(actor.role)) {
    return;
  }

  if (actor.role !== 'FACULTY') {
    throw new ResourceAuthError('Action requires instructional faculty credentials', 'ROLE_UNAUTHORIZED', 403);
  }

  let sql = `
    SELECT sc.id 
    FROM section_courses sc
    JOIN faculty f ON sc.faculty_id = f.id
    JOIN courses c ON sc.course_id = c.id
    WHERE f.user_id = $1 AND (c.id::text = $2 OR c.code = $2)
  `;
  const params: any[] = [actor.id, courseIdOrCode];

  if (sectionId) {
    params.push(sectionId);
    sql += ` AND sc.section_id = $${params.length}`;
  }

  const res = await dbClient.query(sql, params);
  if (res.rows.length === 0) {
    throw new ResourceAuthError(
      'Instructional Boundary Violation: Faculty member is not assigned to this course/section',
      'FACULTY_COURSE_UNASSIGNED',
      403
    );
  }
}
