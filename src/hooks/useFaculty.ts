import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Faculty } from '../types';

export interface UseFacultyOptions {
  departmentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useFaculty(options: UseFacultyOptions = {}) {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFaculty = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.faculty.list({
        departmentId: options.departmentId,
        search: options.search,
        page: options.page,
        limit: options.limit,
      });
      setFaculty(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load faculty roster');
    } finally {
      setLoading(false);
    }
  }, [options.departmentId, options.search, options.page, options.limit]);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  const createFaculty = async (data: any) => {
    const res = await api.faculty.create(data);
    await fetchFaculty();
    return res;
  };

  const assignCourse = async (data: { facultyId: string; courseId: string; sectionId: string }) => {
    const res = await api.faculty.assign(data);
    await fetchFaculty();
    return res;
  };

  return {
    faculty,
    loading,
    error,
    refetch: fetchFaculty,
    createFaculty,
    assignCourse,
  };
}
