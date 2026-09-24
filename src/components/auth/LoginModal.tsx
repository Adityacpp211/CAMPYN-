import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { api } from '../../services/api';
import { User } from '../../types';
import { Lock, Mail, AlertCircle, AlertTriangle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  isExpired?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  isExpired,
}) => {
  const [email, setEmail] = useState('admin.vance@campus.edu');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.auth.login(email, password);
      const user: User = {
        ...res.user,
        role: res.session?.role || res.user.role,
        permissions: res.session?.permissions || res.user.permissions,
        departmentId: res.session?.departmentId || res.user.departmentId,
      };
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      if (err.status === 429) {
        setError('Rate limit exceeded. Too many login attempts. Please wait 15 minutes before retrying.');
      } else if (err.status === 401) {
        setError('Invalid credentials. Check your institutional username/email and password.');
      } else if (err.message && err.message.includes('fetch')) {
        setError('Network failure: Unable to connect to backend server. Verify server is running on port 3001.');
      } else {
        setError(err.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCredential = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password@123');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enterprise Identity Authentication">
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {isExpired && (
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid #EAB308',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#FDE047',
              fontSize: '12px',
            }}
          >
            <AlertTriangle size={14} />
            <span>Your session has expired. Please re-authenticate to continue.</span>
          </div>
        )}

        <p style={{ fontSize: '12px', color: 'var(--color-light-gray)' }}>
          Sign in with your institutional credentials to establish an authenticated cryptographic JWT session.
        </p>

        {error && (
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'rgba(211, 47, 47, 0.1)',
              border: '1px solid var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#FF8A80',
              fontSize: '12px',
            }}
          >
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label style={{ fontSize: '11px', color: 'var(--color-light-gray)', marginBottom: '4px', display: 'block' }}>
            Institutional Email or Username
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={14} color="var(--color-medium-gray)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base"
              style={{ paddingLeft: '32px' }}
              placeholder="e.g. admin.vance@campus.edu"
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '11px', color: 'var(--color-light-gray)', marginBottom: '4px', display: 'block' }}>
            Account Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={14} color="var(--color-medium-gray)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base"
              style={{ paddingLeft: '32px' }}
              placeholder="••••••••••••"
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          <span style={{ fontSize: '10px', color: 'var(--color-medium-gray)' }}>
            DEVELOPMENT DEMO ACCOUNTS (Password: Password@123):
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ fontSize: '10px', padding: '2px 6px' }}
              onClick={() => fillQuickCredential('admin.vance@campus.edu')}
            >
              Admin
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ fontSize: '10px', padding: '2px 6px' }}
              onClick={() => fillQuickCredential('s.jenkins@campus.edu')}
            >
              Faculty (HOD)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ fontSize: '10px', padding: '2px 6px' }}
              onClick={() => fillQuickCredential('bursar.cole@campus.edu')}
            >
              Accountant
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ fontSize: '10px', padding: '2px 6px' }}
              onClick={() => fillQuickCredential('m.chen@campus.edu')}
            >
              Student
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
