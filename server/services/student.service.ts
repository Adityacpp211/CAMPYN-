import { studentRepository } from '../repositories/student.repository';
import { AuthUser } from '../middleware/auth';
import { assertStudentSelfAccess } from '../middleware/resourceAuth';
import { StudentQueryInput, CreateStudentInput, SectionTransferInput } from '../validators/student.validator';
import { createAuditLog } from './auditService';

export class StudentService {
  async getStudents(actor: AuthUser, query: StudentQueryInput) {
    return await studentRepository.findAll(actor.institutionId, query);
  }

  async getStudentById(actor: AuthUser, idOrRoll: string) {
    // ABAC IDOR assertion: If actor is student, verify they are accessing only their own profile
    await assertStudentSelfAccess(actor, idOrRoll);

    const student = await studentRepository.getStudentDossier(actor.institutionId, idOrRoll);
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
    return await studentRepository.getStudentDossier(actor.institutionId, student.id);
  }

  async createStudent(actor: AuthUser, input: CreateStudentInput) {
    const created = await studentRepository.createStudent(actor.institutionId, input);

    await createAuditLog({
      institutionId: actor.institutionId,
      actorId: actor.id,
      actorEmail: actor.email,
      role: actor.role,
      action: 'STUDENT_CREATED',
      entity: 'students',
      entityId: created.id,
      newValues: created,
      reason: `Student ${created.first_name} ${created.last_name} (${created.roll_number}) enrolled`,
    });

    return created;
  }

  async transferSection(actor: AuthUser, studentId: string, input: SectionTransferInput) {
    const result = await studentRepository.transferSection(studentId, input.toSectionId, input.reason, actor.id);

    await createAuditLog({
      institutionId: actor.institutionId,
      actorId: actor.id,
      actorEmail: actor.email,
      role: actor.role,
      action: 'SECTION_TRANSFERRED',
      entity: 'students',
      entityId: studentId,
      newValues: result,
      reason: `Section transfer: ${input.reason}`,
    });

    return result;
  }

  async updateStudent(actor: AuthUser, studentId: string, input: any) {
    const updated = await studentRepository.updateStudent(studentId, actor.institutionId, input);
    if (!updated) {
      const error: any = new Error('Student not found');
      error.statusCode = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }

    await createAuditLog({
      institutionId: actor.institutionId,
      actorId: actor.id,
      actorEmail: actor.email,
      role: actor.role,
      action: 'STUDENT_UPDATED',
      entity: 'students',
      entityId: studentId,
      newValues: updated,
      reason: `Student profile ${studentId} updated by ${actor.email}`,
    });

    return updated;
  }
}

export const studentService = new StudentService();
