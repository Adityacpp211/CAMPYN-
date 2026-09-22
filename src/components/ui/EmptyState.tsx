import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div
      style={{
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        backgroundColor: 'var(--color-dark-charcoal)',
        border: '1px dashed var(--color-border-gray)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      {Icon && (
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-charcoal)',
            border: '1px solid var(--color-border-gray)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-light-gray)',
            marginBottom: '16px',
          }}
        >
          <Icon size={20} />
        </div>
      )}
      <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-off-white)', marginBottom: '4px' }}>
        {title}
      </h4>
      <p style={{ fontSize: '13px', color: 'var(--color-medium-gray)', maxWidth: '380px', marginBottom: actionText ? '16px' : 0 }}>
        {description}
      </p>
      {actionText && onAction && (
        <button className="btn btn-secondary btn-sm" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};
