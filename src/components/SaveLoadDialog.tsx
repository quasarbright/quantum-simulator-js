// Save/Load experiment dialog

import React, { useState, useEffect } from 'react';
import { getSavedExperimentsList, deleteExperimentFromLocalStorage } from '../utils/persistence';

interface SaveLoadDialogProps {
  isOpen: boolean;
  mode: 'save' | 'load';
  currentExperimentName?: string;
  onClose: () => void;
  onSave: (name: string) => void;
  onLoad: (name: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export const SaveLoadDialog: React.FC<SaveLoadDialogProps> = ({
  isOpen,
  mode,
  currentExperimentName,
  onClose,
  onSave,
  onLoad,
  onExport,
  onImport,
}) => {
  const [savedExperiments, setSavedExperiments] = useState<Array<{ name: string; timestamp: number }>>([]);
  const [newName, setNewName] = useState(currentExperimentName || '');

  useEffect(() => {
    if (isOpen) {
      setSavedExperiments(getSavedExperimentsList());
    }
  }, [isOpen]);

  const handleDelete = (name: string) => {
    if (confirm(`Delete experiment "${name}"?`)) {
      deleteExperimentFromLocalStorage(name);
      setSavedExperiments(getSavedExperimentsList());
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      onClose();
    }
  };

  if (!isOpen) return null;

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
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid #404040',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 20px 0', color: '#e5e5e5', fontSize: '20px' }}>
          {mode === 'save' ? 'Save Experiment' : 'Load Experiment'}
        </h2>

        {mode === 'save' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#a3a3a3', fontSize: '14px' }}>
              Experiment Name:
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter name..."
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #404040',
                borderRadius: '6px',
                color: '#e5e5e5',
                fontSize: '14px',
              }}
              autoFocus
            />
            <button
              onClick={() => {
                if (newName.trim()) {
                  onSave(newName.trim());
                  onClose();
                }
              }}
              disabled={!newName.trim()}
              style={{
                marginTop: '12px',
                padding: '10px 20px',
                backgroundColor: newName.trim() ? '#4caf50' : '#404040',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: newName.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              Save
            </button>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#e5e5e5', fontSize: '16px' }}>
            Saved Experiments
          </h3>
          {savedExperiments.length === 0 ? (
            <p style={{ color: '#737373', fontSize: '14px' }}>No saved experiments</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {savedExperiments.map((exp) => (
                <div
                  key={exp.name}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px',
                    backgroundColor: '#2a2a2a',
                    borderRadius: '6px',
                    border: '1px solid #404040',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#e5e5e5', fontSize: '14px', fontWeight: 'bold' }}>
                      {exp.name}
                    </div>
                    <div style={{ color: '#737373', fontSize: '12px', marginTop: '4px' }}>
                      {new Date(exp.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {mode === 'load' && (
                      <button
                        onClick={() => {
                          onLoad(exp.name);
                          onClose();
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#4caf50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Load
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(exp.name)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid #404040', paddingTop: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#e5e5e5', fontSize: '16px' }}>
            Import/Export
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onExport}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              Export to File
            </button>
            <label
              style={{
                padding: '10px 20px',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'inline-block',
              }}
            >
              Import from File
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#404040',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            width: '100%',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

