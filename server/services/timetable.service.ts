import { timetableRepository } from '../repositories/timetable.repository';
import { TimetableSlotCreateInput, TimetableQueryInput } from '../validators/timetable.validator';
import { createAuditLog } from './auditService';
import { AuthUser } from '../middleware/auth';

export class TimetableService {
  async getTimetable(institutionId: string, query: TimetableQueryInput): Promise<any[]> {
    return timetableRepository.findSlots(institutionId, query);
  }

  async createSlot(user: AuthUser, input: TimetableSlotCreateInput): Promise<any> {
    // Validate time sequence
    if (input.startTime >= input.endTime) {
      const err: any = new Error('Slot start time must be earlier than end time');
      err.code = 'INVALID_TIME_RANGE';
      err.statusCode = 400;
      throw err;
    }

    // Run Server-Side Conflict Detection Engine
    const conflict = await timetableRepository.checkConflicts(user.institutionId, {
      sectionCourseId: input.sectionCourseId,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      roomNumber: input.roomNumber,
    });

    if (conflict.hasConflict) {
      const err: any = new Error(conflict.message || 'Timetable scheduling conflict detected');
      err.code = 'TIMETABLE_CONFLICT';
      err.statusCode = 409;
      err.conflictType = conflict.type;
      err.conflictingSlot = conflict.conflictingSlot;
      throw err;
    }

    const created = await timetableRepository.createSlot(user.institutionId, input);

    await createAuditLog({
      institutionId: user.institutionId,
      actorId: user.id,
      actorEmail: user.email,
      role: user.role,
      action: 'TIMETABLE_SLOT_CREATED',
      entity: 'timetable_slots',
      entityId: created.id,
      newValues: created,
      reason: `Timetable slot created for ${input.dayOfWeek} ${input.startTime}-${input.endTime} in ${input.roomNumber}`,
    });

    return created;
  }

  async deleteSlot(user: AuthUser, id: string): Promise<void> {
    const deleted = await timetableRepository.deleteSlot(id, user.institutionId);
    if (!deleted) {
      const err: any = new Error(`Timetable slot '${id}' not found`);
      err.code = 'NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    await createAuditLog({
      institutionId: user.institutionId,
      actorId: user.id,
      actorEmail: user.email,
      role: user.role,
      action: 'TIMETABLE_SLOT_DELETED',
      entity: 'timetable_slots',
      entityId: id,
      reason: `Timetable slot ${id} deleted by ${user.email}`,
    });
  }
}

export const timetableService = new TimetableService();
