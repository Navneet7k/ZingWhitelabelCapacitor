import React, { useEffect, useState } from 'react';
import { getStatus, onStatusChange, applyNow, applyLater } from '../services/updater';
import type { UpdateStatus } from '../services/updater';
import './UpdatePrompt.css';

const UpdatePrompt: React.FC = () => {
  const [status, setStatus]   = useState<UpdateStatus>(getStatus);
  const [applying, setApplying] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => onStatusChange(setStatus), []);

  if (status.state !== 'ready') return null;

  const handleNow = async () => {
    setApplying(true);
    setError(null);
    try {
      await applyNow();
      // App reloads here — lines below only run if set() somehow fails
    } catch (e: any) {
      setError('Could not apply update. Please restart the app manually.');
      setApplying(false);
    }
  };

  const handleLater = () => {
    applyLater();
  };

  return (
    <>
      <div className="upd-scrim" />
      <div className="upd-sheet">
        <div className="upd-sheet__handle" />

        <div className="upd-sheet__body">
          <div className="upd-badge">🆕</div>

          <h3 className="upd-title">Update Ready</h3>
          <p className="upd-sub">
            Version <strong>{status.version}</strong> has been downloaded
            and is ready to install.
          </p>

          {error && <p className="upd-error">{error}</p>}

          {applying ? (
            <div className="upd-applying">
              <div className="upd-spinner" />
              <span className="upd-applying__text">Applying update…</span>
            </div>
          ) : (
            <div className="upd-actions">
              <button className="upd-btn upd-btn--primary" onClick={handleNow}>
                Restart Now
              </button>
              <button className="upd-btn upd-btn--secondary" onClick={handleLater}>
                Later
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UpdatePrompt;
