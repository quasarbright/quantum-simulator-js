// Panel for displaying validation warnings and errors

import React from 'react';
import type { ValidationResult } from '../core/validation';

interface ValidationPanelProps {
  isOpen: boolean;
  validationResult: ValidationResult;
  onClose: () => void;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  isOpen,
  validationResult,
  onClose,
}) => {
  if (!isOpen) return null;

  const hasIssues = validationResult.errors.length > 0 || validationResult.warnings.length > 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid #404040',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h2 style={{ margin: 0, color: '#e5e5e5', fontSize: '18px' }}>
            Validation Issues
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              color: '#a3a3a3',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        {!hasIssues ? (
          <div style={{ color: '#4caf50', padding: '16px', textAlign: 'center' }}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: '0 auto 8px' }}
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              No validation issues found
            </div>
            <div style={{ fontSize: '12px', color: '#a3a3a3', marginTop: '4px' }}>
              Your experiment looks good!
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <div>
                <h3
                  style={{
                    margin: '0 0 8px 0',
                    color: '#f44336',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  Errors ({validationResult.errors.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {validationResult.errors.map((error, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: '#2a1a1a',
                        border: '1px solid #f44336',
                        borderRadius: '4px',
                        padding: '12px',
                      }}
                    >
                      <div style={{ color: '#e5e5e5', fontSize: '13px' }}>
                        {error.message}
                      </div>
                      {error.position && (
                        <div
                          style={{
                            color: '#a3a3a3',
                            fontSize: '11px',
                            marginTop: '4px',
                          }}
                        >
                          Position: ({error.position.x.re}, {error.position.y.re})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <div>
                <h3
                  style={{
                    margin: '0 0 8px 0',
                    color: '#f59e0b',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  Warnings ({validationResult.warnings.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {validationResult.warnings.map((warning, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: '#2a2a1a',
                        border: '1px solid #f59e0b',
                        borderRadius: '4px',
                        padding: '12px',
                      }}
                    >
                      <div style={{ color: '#e5e5e5', fontSize: '13px' }}>
                        {warning.message}
                      </div>
                      {warning.position && (
                        <div
                          style={{
                            color: '#a3a3a3',
                            fontSize: '11px',
                            marginTop: '4px',
                          }}
                        >
                          Position: ({warning.position.x.re}, {warning.position.y.re})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Close button */}
        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6366f1',
              color: 'white',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
