import { courseRepository } from '../repositories/course.repository';
import { CourseCreateInput, CourseUpdateInput, CourseQueryInput } from '../validators/course.validator';
import { createAuditLog } from './auditService';
import { AuthUser } from '../middleware/auth';

export class CourseService {
  async getCourses(institutionId: string, query: CourseQueryInput): Promise<{ data: any[]; pagination: any }> {
    const result = await courseRepository.findCourses(institutionId, query);
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

  async getCourseById(id: string, institutionId: string): Promise<any> {
    const course = await courseRepository.findCourseById(id, institutionId);
    if (!course) {
      const err: any = new Error(`Course '${id}' not found`);
      err.code = 'NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }
    return course;
  }

  async createCourse(user: AuthUser, input: CourseCreateInput): Promise<any> {
    const existing = await courseRepository.findCourseByCode(input.code, input.departmentId);
    if (existing) {
      const err: any = new Error(`Course code '${input.code}' is already registered in this department`);
      err.code = 'DUPLICATE_COURSE_CODE';
      err.statusCode = 409;
      throw err;
    }


    const created = await courseRepository.createCourse(input);

    await createAuditLog({
      institutionId: user.institutionId,
      actorId: user.id,
      actorEmail: user.email,
      role: user.role,
      action: 'COURSE_CREATED',
      entity: 'courses',
      entityId: created.id,
      newValues: created,
      reason: `Course ${created.name} (${created.code}) created by ${user.email}`,
    });

    return created;
  }

  async updateCourse(user: AuthUser, id: string, input: CourseUpdateInput): Promise<any> {
    const existing = await courseRepository.findCourseById(id, user.institutionId);
    if (!existing) {
      const err: any = new Error(`Course '${id}' not found`);
      err.code = 'NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const updated = await courseRepository.updateCourse(id, input);

    await createAuditLog({
      institutionId: user.institutionId,
      actorId: user.id,
      actorEmail: user.email,
      role: user.role,
      action: 'COURSE_UPDATED',
      entity: 'courses',
      entityId: id,
      oldValues: existing,
      newValues: updated,
      reason: `Course ${id} updated by ${user.email}`,
    });

    return updated;
  }

  async archiveCourse(user: AuthUser, id: string): Promise<void> {
    const existing = await courseRepository.findCourseById(id, user.institutionId);
    if (!existing) {
      const err: any = new Error(`Course '${id}' not found`);
      err.code = 'NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    await courseRepository.archiveCourse(id);

    await createAuditLog({
      institutionId: user.institutionId,
      actorId: user.id,
      actorEmail: user.email,
      role: user.role,
      action: 'COURSE_ARCHIVED',
      entity: 'courses',
      entityId: id,
      reason: `Course ${id} archived by ${user.email}`,
    });
  }

  async getCourseOfferings(institutionId: string, courseId?: string, sectionId?: string): Promise<any[]> {
    return courseRepository.findCourseOfferings(institutionId, courseId, sectionId);
  }
}

export const courseService = new CourseService();
