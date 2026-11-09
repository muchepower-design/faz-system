// frontend/src/components/ui.jsx
//
// Shared UI primitives used across the admin dashboard and public site.
// Exports: Card, Button, Input, Textarea, Select, Modal, ModalFooter,
//          Spinner, EmptyState, Badge, Alert
//
// Usage:
//   import { Card, Button, Input, Modal, ModalFooter, Spinner, EmptyState } from '../../../components/ui';

import { createPortal } from 'react-dom';
import { forwardRef, useEffect, useId } from 'react';

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/* ------------------------------------------------------------------ */
/* Spinner                                                             */
/* ------------------------------------------------------------------ */

const SPINNER_SIZES = {
  xs: 'w-3 h-3 border-[1.5px]',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
  xl: 'w-12 h-12 border-4',
};

export function Spinner({ size = 'md', className = '', label = 'Loading' }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block animate-spin rounded-full border-gray-300 border-t-faz-orange',
        SPINNER_SIZES[size] || SPINNER_SIZES.md,
        className
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

const CARD_PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

export function Card({
  children,
  padding = 'md',
  className = '',
  as: Tag = 'div',
  ...rest
}) {
  return (
    <Tag
      className={cn(
        'bg-white border border-gray-200 rounded-2xl shadow-sm',
        CARD_PADDING[padding] ?? CARD_PADDING.md,
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-4', className)}>
      <div className="min-w-0">
        {title && <h3 className="font-bold text-gray-800 truncate">{title}</h3>}
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

const BUTTON_VARIANTS = {
  primary:
    'bg-faz-orange text-white hover:brightness-95 focus-visible:ring-faz-orange/40 shadow-sm',
  secondary:
    'bg-gray-900 text-white hover:bg-gray-800 focus-visible:ring-gray-900/30 shadow-sm',
  outline:
    'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-300',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus-visible:ring-gray-300',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500/40 shadow-sm',
  success:
    'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500/40 shadow-sm',
};

const BUTTON_SIZES = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
  icon: 'p-2 text-sm',
};

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    type = 'button',
    loading = false,
    disabled = false,
    fullWidth = false,
    className = '',
    leftIcon,
    rightIcon,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.primary,
        BUTTON_SIZES[size] ?? BUTTON_SIZES.md,
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading ? (
        <Spinner size="sm" className="border-white/40 border-t-white" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

/* ------------------------------------------------------------------ */
/* Input / Textarea / Select                                           */
/* ------------------------------------------------------------------ */

const FIELD_BASE =
  'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 ' +
  'transition focus:outline-none focus:ring-2 focus:ring-faz-orange/30 focus:border-faz-orange ' +
  'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed';

function fieldClasses(error) {
  return cn(
    FIELD_BASE,
    error ? 'border-red-400 focus:ring-red-300/40 focus:border-red-500' : 'border-gray-300'
  );
}

function FieldWrapper({ id, label, hint, error, required, className, children }) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { label, hint, error, required, className, containerClassName, id, type = 'text', ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id || `input-${autoId}`;

  return (
    <FieldWrapper
      id={inputId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <input
        ref={ref}
        id={inputId}
        type={type}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        className={cn(fieldClasses(error), className)}
        {...rest}
      />
    </FieldWrapper>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, hint, error, required, className, containerClassName, id, rows = 6, ...rest },
  ref
) {
  const autoId = useId();
  const textareaId = id || `textarea-${autoId}`;

  return (
    <FieldWrapper
      id={textareaId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        className={cn(fieldClasses(error), 'resize-y leading-relaxed', className)}
        {...rest}
      />
    </FieldWrapper>
  );
});

export const Select = forwardRef(function Select(
  { label, hint, error, required, className, containerClassName, id, children, ...rest },
  ref
) {
  const autoId = useId();
  const selectId = id || `select-${autoId}`;

  return (
    <FieldWrapper
      id={selectId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <select
        ref={ref}
        id={selectId}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        className={cn(fieldClasses(error), 'pr-8', className)}
        {...rest}
      >
        {children}
      </select>
    </FieldWrapper>
  );
});

export function Checkbox({ label, className = '', id, ...rest }) {
  const autoId = useId();
  const checkboxId = id || `checkbox-${autoId}`;

  return (
    <label
      htmlFor={checkboxId}
      className={cn('inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none', className)}
    >
      <input
        id={checkboxId}
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-faz-orange focus:ring-faz-orange/40"
        {...rest}
      />
      {label}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Badge / Alert                                                       */
/* ------------------------------------------------------------------ */

const BADGE_VARIANTS = {
  gray: 'bg-gray-100 text-gray-600',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  blue: 'bg-blue-100 text-blue-700',
  orange: 'bg-orange-100 text-faz-orange',
};

export function Badge({ children, variant = 'gray', className = '' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        BADGE_VARIANTS[variant] ?? BADGE_VARIANTS.gray,
        className
      )}
    >
      {children}
    </span>
  );
}

const ALERT_VARIANTS = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800',
};

export function Alert({ children, variant = 'info', className = '' }) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border px-4 py-3 text-sm',
        ALERT_VARIANTS[variant] ?? ALERT_VARIANTS.info,
        className
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

const MODAL_SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
  full: 'max-w-[95vw]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  closeOnBackdrop = true,
  showClose = true,
  className = '',
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative flex min-h-full items-start justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === 'string' ? title : undefined}
          className={cn(
            'relative w-full bg-white rounded-2xl shadow-xl my-4 sm:my-8',
            MODAL_SIZES[size] ?? MODAL_SIZES.md,
            className
          )}
        >
          {(title || showClose) && (
            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="min-w-0">
                {title && (
                  <h2 className="text-lg font-bold text-gray-800 truncate">{title}</h2>
                )}
                {subtitle && (
                  <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
                )}
              </div>

              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="-mr-2 -mt-1 p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              )}
            </div>
          )}

          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Footer bar for a <Modal>. Uses negative margins so it spans the full
 * width of the modal body and sits flush against the bottom edge.
 */
export function ModalFooter({ children, className = '' }) {
  return (
    <div
      className={cn(
        '-mx-6 -mb-5 mt-6 px-6 py-4 bg-gray-50 border-t border-gray-100',
        'flex flex-col-reverse sm:flex-row sm:justify-end gap-3',
        'rounded-b-2xl',
        className
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* EmptyState                                                          */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon = '📭',
  title = 'Nothing here yet',
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        className
      )}
    >
      <div className="text-4xl mb-3 leading-none" aria-hidden="true">
        {icon}
      </div>
      {title && <p className="font-semibold text-gray-800">{title}</p>}
      {description && (
        <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Default export (optional convenience)                               */
/* ------------------------------------------------------------------ */

export default {
  Card,
  CardHeader,
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Modal,
  ModalFooter,
  Spinner,
  EmptyState,
  Badge,
  Alert,
  cn,
};