import { studentRepository } from '../repositories/student.repository';
import { AuthUser } from '../middleware/auth';
import { assertStudentSelfAccess } from '../middleware/resourceAuth';
import { StudentQueryInput } from '../validators/student.validator';
import { createAuditLog } from './auditService';

export class StudentService {
  async getStudents(actor: AuthUser, query: StudentQueryInput) {
    return await studentRepository.findAll(actor.institutionId, query);
  }

  async getStudentById(actor: AuthUser, idOrRoll: string) {
    // ABAC IDOR assertion: If actor is student, verify they are accessing only their own profile
    await assertStudentSelfAccess(actor, idOrRoll);

    const student = await studentRepository.findById(actor.institutionId, idOrRoll);
    if (!student) {
      const error: any = new Error('Student not found');
      error.statusCode = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }
    return student;
  }

  async getStudentProfile(actor: AuthUser) {
    const student = await studentRepository.findByUserId(actor.institutionId, actor.id);
    if (!student) {
      const error: any = new Error('Student profile not found for the authenticated user');
      error.statusCode = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }
    return student;
  }
}

export const studentService = new StudentService();
