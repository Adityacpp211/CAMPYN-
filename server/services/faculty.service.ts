import { facultyRepository } from '../repositories/faculty.repository';
import { FacultyCreateInput, FacultyUpdateInput, FacultyQueryInput, FacultyAssignInput } from '../validators/faculty.validator';
import { createAuditLog } from './auditService';
import { AuthUser } from '../middleware/auth';

export class FacultyService {
  async getFacultyList(institutionId: string, query: FacultyQueryInput): Promise<{ data: any[]; pagination: any }> {
    const result = await facultyRepository.findFaculty(institutionId, query);
    const limit = query.limit || 50;
    const page = query.page || 1;

    return {
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  async getFacultyById(id: string, institutionId: string): Promise<any> {
    const faculty = await facultyRepository.findFacultyById(id, institutionId);
    if (!faculty) {
      const err: any = new Error(`Faculty '${id}' not found`);
      err.code = 'NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }
    return faculty;
  }

  async createFaculty(user: AuthUser, input: FacultyCreateInput): Promise<any> {
    const created = await facultyRepository.createFaculty(user.institutionId, input);

    await createAuditLog({
      institutionId: user.institutionId,
      actorId: user.id,
      actorEmail: user.email,
      role: user.role,
      action: 'FACULTY_CREATED',
      entity: 'faculty',
      entityId: created.id,
      newValues: created,
      reason: `Faculty member ${input.firstName} ${input.lastName} (${input.employeeId}) registered`,
    });

    return created;
  }

  async updateFaculty(user: AuthUser, id: string, input: FacultyUpdateInput): Promise<any> {
    const updated = await facultyRepository.updateFaculty(id, user.institutionId, input);
    if (!updated) {
      const err: any = new Error(`Faculty '${id}' not found`);
      err.code = 'NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    await createAuditLog({
      institutionId: user.institutionId,
      actorId: user.id,
      actorEmail: user.email,
      role: user.role,
      action: 'FACULTY_UPDATED',
      entity: 'faculty',
      entityId: id,
      newValues: updated,
      reason: `Faculty profile ${id} updated by ${user.email}`,
    });

    return updated;
  }

  async assignFaculty(user: AuthUser, input: FacultyAssignInput): Promise<any> {
    const assignment = await facultyRepository.assignFaculty(input);

    await createAuditLog({
      institutionId: user.institutionId,
      actorId: user.id,
      actorEmail: user.email,
      role: user.role,
      action: 'FACULTY_ASSIGNED',
      entity: 'section_courses',
      entityId: assignment.id,
      newValues: assignment,
      reason: `Faculty assigned to course section by ${user.email}`,
    });

    return assignment;
  }

  async unassignFaculty(user: AuthUser, sectionCourseId: string): Promise<void> {
    await facultyRepository.unassignFaculty(sectionCourseId);

    await createAuditLog({
      institutionId: user.institutionId,
      actorId: user.id,
      actorEmail: user.email,
      role: user.role,
      action: 'FACULTY_UNASSIGNED',
      entity: 'section_courses',
      entityId: sectionCourseId,
      reason: `Faculty unassigned from course section by ${user.email}`,
    });
  }
}

export const facultyService = new FacultyService();
