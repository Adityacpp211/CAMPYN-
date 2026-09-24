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
        page: options.page,
        limit: options.limit,
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
  }, [options.search, options.departmentId, options.section, options.page, options.limit]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const createStudent = async (data: any) => {
    const res = await api.students.create(data);
    await fetchStudents();
    return res;
  };

  const updateStudent = async (id: string, data: any) => {
    const res = await api.students.update(id, data);
    await fetchStudents();
    return res;
  };

  const transferSection = async (studentId: string, toSectionId: string, reason: string) => {
    const res = await api.students.transferSection(studentId, toSectionId, reason);
    await fetchStudents();
    return res;
  };

  return {
    students,
    pagination,
    loading,
    error,
    createStudent,
    updateStudent,
    transferSection,
    refetch: fetchStudents,
  };
}

export function useStudent(id?: string) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState<boolean>(!!id);
  const [error, setError] = useState<string | null>(null);

  const fetchStudent = useCallback(async () => {
    if (!id) {
      setStudent(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.students.get(id);
      setStudent(res?.data || res);
    } catch (err: any) {
      setError(err.message || `Failed to load student ${id}`);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  return {
    student,
    loading,
    error,
    refetch: fetchStudent,
  };
}
