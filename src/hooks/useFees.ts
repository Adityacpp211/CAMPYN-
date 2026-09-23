import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { FeeDue, FeeTransaction } from '../types';

export function useFees() {
  const [dues, setDues] = useState<FeeDue[]>([]);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [duesData, txnsData] = await Promise.all([
        api.fees.dues(),
        api.fees.transactions(),
      ]);
      setDues(duesData);
      setTransactions(txnsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch financial records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const collectPayment = async (feeDueId: string, amount: number, paymentMode: string) => {
    const res = await api.fees.collect(feeDueId, amount, paymentMode);
    await fetchFees();
    return res;
  };

  const processRefund = async (txnId: string, reason: string) => {
    const res = await api.fees.refund(txnId, reason);
    await fetchFees();
    return res;
  };

  return {
    dues,
    transactions,
    loading,
    error,
    collectPayment,
    processRefund,
    refetch: fetchFees,
  };
}
