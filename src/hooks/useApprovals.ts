import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { ApprovalRequest } from '../types';

export function useApprovals() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.approvals.list();
      setRequests(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const resolveApproval = async (
    id: string,
    decision: 'approved' | 'rejected',
    reason: string
  ) => {
    const res = await api.approvals.resolve(id, decision, reason);
    await fetchApprovals();
    return res;
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return {
    requests,
    pendingCount,
    loading,
    error,
    refetch: fetchApprovals,
    resolveApproval,
  };
}
