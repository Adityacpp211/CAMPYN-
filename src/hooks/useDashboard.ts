import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { AuditLog } from '../types';

export interface DashboardData {
  metrics: {
    totalStudents: number;
    totalFaculty: number;
    totalCourses: number;
    pendingApprovals: number;
    feesCollected: number;
    feesOutstanding: number;
    attendanceRate: number;
  };
  recentAudits: AuditLog[];
  lowAttendanceAlerts: Array<{
    id: string;
    studentRoll: string;
    studentName: string;
    percentage: number;
  }>;
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await api.dashboard.stats();
      setData(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    data,
    loading,
    error,
    refetch: fetchStats,
  };
}
