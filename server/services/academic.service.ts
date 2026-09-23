import { academicRepository } from '../repositories/academic.repository';
import { createAuditLog } from './auditService';
import {
  DepartmentCreateInput,
  DepartmentUpdateInput,
  ProgramCreateInput,
  AcademicYearCreateInput,
  SemesterCreateInput,
  SectionCreateInput,
} from '../validators/academic.validator';
import { AuthUser } from '../middleware/auth';

export class AcademicService {
  async getDepartments(institutionId: string): Promise<any[]> {
    return academicRepository.findDepartments(institutionId);
  }

  async getDepartmentById(id: string, institutionId: string): Promise<any> {
    const dept = await academicRepository.findDepartmentById(id, institutionId);
    if (!dept) {
      const err: any = new Error(`Department with ID '${id}' not found`);
      err.code = 'NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }
    return dept;
  }

  async getDepartmentStats(id: string, institutionId: string): Promise<any> {
    const stats = await academicRepository.getDepartmentStats(id, institutionId);
    if (!stats) {
      const err: any = new Error(`Department with ID '${id}' not found`);
      err.code = 'NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }
    return stats;
  }

  async createDepartment(user: AuthUser, input: DepartmentCreateInput): Promise<any> {
    const existing = await academicRepository.findDepartmentByCode(input.code, user.institutionId);
    if (existing) {
      const err: any = new Error(`Department code '${input.code}' is already registered in this institution`);
      err.code = 'DUPLICATE_DEPARTMENT_CODE';
      err.statusCode = 409;
      throw err;
    }


    const created = await academicRepository.createDepartment(user.institutionId, input);

    await createAuditLog({
      institutionId: user.institutionId,
      actorId: user.id,
      actorEmail: user.email,
      role: user.role,
      action: 'DEPARTMENT_CREATED',
      entity: 'departments',
      entityId: created.id,
      newValues: created,
      reason: `Department ${created.name} (${created.code}) created by ${user.firstName} ${user.lastName}`,
    });

    return created;
  }

  async updateDepartment(user: AuthUser, id: string, input: DepartmentUpdateInput): Promise<any> {
    const existing = await academicRepository.findDepartmentById(id, user.institutionId);
    if (!existing) {
      const err: any = new Error(`Department '${id}' not found`);
      err.code = 'NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    if (input.code && input.code !== existing.code) {
      const duplicateCode = await academicRepository.findDepartmentByCode(input.code, user.institutionId);
      if (duplicateCode && duplicateCode.id !== id) {
        const err: any = new Error(`Department code '${input.code}' already exists`);
        err.code = 'CONFLICT';
        err.statusCode = 409;
        throw err;
      }
    }

    const updated = await academicRepository.updateDepartment(id, user.institutionId, input);

    await createAuditLog({
      institutionId: user.institutionId,
      actorId: user.id,
      actorEmail: user.email,
      role: user.role,
      action: 'DEPARTMENT_UPDATED',
      entity: 'departments',
      entityId: id,
      oldValues: existing,
      newValues: updated,
      reason: `Department ${id} modified`,
    });

    return updated;
  }

  async archiveDepartment(user: AuthUser, id: string): Promise<void> {
    const existing = await academicRepository.findDepartmentById(id, user.institutionId);
    if (!existing) {
      const err: any = new Error(`Department '${id}' not found`);
      err.code = 'NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    await academicRepository.archiveDepartment(id, user.institutionId);

    await createAuditLog({
      institutionId: user.institutionId,
      actorId: user.id,
      actorEmail: user.email,
      role: user.role,
      action: 'DEPARTMENT_ARCHIVED',
      entity: 'departments',
      entityId: id,
      reason: `Department archived by ${user.email}`,
    });
  }

  // Programs
  async getPrograms(institutionId: string, departmentId?: string): Promise<any[]> {
    return academicRepository.findPrograms(institutionId, departmentId);
  }

  async createProgram(user: AuthUser, input: ProgramCreateInput): Promise<any> {
    const created = await academicRepository.createProgram(input.departmentId, input);
    await createAuditLog({
      institutionId: user.institutionId,
      actorId: user.id,
      actorEmail: user.email,
      role: user.role,
      action: 'PROGRAM_CREATED',
      entity: 'programs',
      entityId: created.id,
      newValues: created,
    });
    return created;
  }

  // Academic Years
  async getAcademicYears(institutionId: string): Promise<any[]> {
    return academicRepository.findAcademicYears(institutionId);
  }

  async createAcademicYear(user: AuthUser, input: AcademicYearCreateInput): Promise<any> {
    const created = await academicRepository.createAcademicYear(user.institutionId, input);
    return created;
  }

  // Semesters
  async getSemesters(academicYearId?: string): Promise<any[]> {
    return academicRepository.findSemesters(academicYearId);
  }

  async createSemester(user: AuthUser, input: SemesterCreateInput): Promise<any> {
    const created = await academicRepository.createSemester(input);
    return created;
  }

  // Sections
  async getSections(institutionId: string, programId?: string, semesterId?: string): Promise<any[]> {
    return academicRepository.findSections(institutionId, programId, semesterId);
  }

  async createSection(user: AuthUser, input: SectionCreateInput): Promise<any> {
    const created = await academicRepository.createSection(input);
    return created;
  }
}

export const academicService = new AcademicService();
