import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { AttendanceSession, AttendanceRecord } from '../types';

export function useAttendance(sessionId?: string) {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await api.attendance.sessions();
      setSessions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attendance sessions');
    }
  }, []);

  const fetchRecords = useCallback(async (sId?: string) => {
    try {
      const data = await api.attendance.records(sId);
      setRecords(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attendance records');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSessions(), fetchRecords(sessionId)]).finally(() => setLoading(false));
  }, [fetchSessions, fetchRecords, sessionId]);

  const updateRecord = async (recordId: string, status: string, reason: string) => {
    const updated = await api.attendance.updateRecord(recordId, status, reason);
    await fetchRecords(sessionId);
    return updated;
  };

  const submitCorrection = async (recordId: string, newStatus: string, reason: string) => {
    const result = await api.attendance.submitCorrection(recordId, newStatus, reason);
    await fetchRecords(sessionId);
    return result;
  };

  return {
    sessions,
    records,
    loading,
    error,
    updateRecord,
    submitCorrection,
    refetch: () => Promise.all([fetchSessions(), fetchRecords(sessionId)]),
  };
}
