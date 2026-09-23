import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { TimetableSlot } from '../types';

export interface UseTimetableOptions {
  sectionId?: string;
  facultyId?: string;
  roomNumber?: string;
  dayOfWeek?: string;
}

export function useTimetable(options: UseTimetableOptions = {}) {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimetable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.timetable.list({
        sectionId: options.sectionId,
        facultyId: options.facultyId,
        roomNumber: options.roomNumber,
        dayOfWeek: options.dayOfWeek,
      });
      setSlots(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load timetable schedule');
    } finally {
      setLoading(false);
    }
  }, [options.sectionId, options.facultyId, options.roomNumber, options.dayOfWeek]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const createSlot = async (slotData: any) => {
    const res = await api.timetable.createSlot(slotData);
    await fetchTimetable();
    return res;
  };

  const deleteSlot = async (id: string) => {
    const res = await api.timetable.deleteSlot(id);
    await fetchTimetable();
    return res;
  };

  const conflictCount = slots.filter((s) => s.hasConflict).length;

  return {
    slots,
    loading,
    error,
    conflictCount,
    refetch: fetchTimetable,
    createSlot,
    deleteSlot,
  };
}
