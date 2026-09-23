import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Student } from '../types';

export interface UseStudentsOptions {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  section?: string;
}

export function useStudents(options: UseStudentsOptions = {}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: options.page || 1,
    limit: options.limit || 20,
    totalPages: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await api.students.list({
        search: options.search,
        departmentId: options.departmentId,
        section: options.section,
      });

      if (Array.isArray(response)) {
        setStudents(response);
        setPagination({
          total: response.length,
          page: 1,
          limit: response.length,
          totalPages: 1,
        });
      } else if (response && response.data) {
        setStudents(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load student records');
    } finally {
      setLoading(false);
    }
  }, [options.search, options.departmentId, options.section]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return {
    students,
    pagination,
    loading,
    error,
    refetch: fetchStudents,
  };
}
