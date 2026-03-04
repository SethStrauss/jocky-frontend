import React, { useState, useEffect } from 'react';
import { loadConnections, saveConnections, ArtistConnection } from './MarketplaceView';
import { updateConnectionStatusDB } from '../services/db';
import './DJVenuesView.css';

interface DJVenuesViewProps {
  userId: string;
  onMessage?: (artistId: string, artistName: string, venueName: string, venueId?: string) => void;
  onConnectionChange?: () => void;
}

const DJVenuesView: React.FC<DJVenuesViewProps> = ({ userId, onMessage, onConnectionChange }) => {
  const [connections, setConnections] = useState<ArtistConnection[]>(() =>
    loadConnections().filter(c => c.artistId === userId)
  );

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'jocky_artist_connections') {
        setConnections(loadConnections().filter(c => c.artistId === userId));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [userId]);

  const respond = (connId: string, status: 'accepted' | 'declined') => {
    const all = loadConnections();
    const updated = all.map(c => c.id === connId ? { ...c, status } : c);
    saveConnections(updated);
    setConnections(updated.filter(c => c.artistId === userId));
    updateConnectionStatusDB(connId, status);
    onConnectionChange?.();
  };

  const pending  = connections.filter(c => c.status === 'pending');
  const accepted = connections.filter(c => c.status === 'accepted');

  return (
    <div className="dj-venues-view">
      <div className="dv-header">
        <h1 className="dv-title">Venues</h1>
        {pending.length > 0 && (
          <span className="dv-badge">{pending.length} new</span>
        )}
      </div>

      {pending.length > 0 && (
        <section className="dv-section">
          <h2 className="dv-section-title">Venue requests</h2>
          <div className="dv-cards">
            {pending.map(conn => (
              <div key={conn.id} className="dv-card">
                <div className="dv-card-avatar">{conn.venueName.charAt(0)}</div>
                <div className="dv-card-info">
                  <div className="dv-card-name">{conn.venueName}</div>
                  <div className="dv-card-sub">wants to add you to their artist pool</div>
                  <div className="dv-card-date">
                    {new Date(conn.requestedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                  </div>
                </div>
                <div className="dv-card-actions">
                  <button className="dv-btn dv-btn--decline" onClick={() => respond(conn.id, 'declined')}>Decline</button>
                  <button className="dv-btn dv-btn--accept"  onClick={() => respond(conn.id, 'accepted')}>Accept</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {accepted.length > 0 && (
        <section className="dv-section">
          <h2 className="dv-section-title">Connected venues</h2>
          <div className="dv-cards">
            {accepted.map(conn => (
              <div key={conn.id} className="dv-card dv-card--connected">
                <div className="dv-card-avatar dv-card-avatar--green">{conn.venueName.charAt(0)}</div>
                <div className="dv-card-info">
                  <div className="dv-card-name">{conn.venueName}</div>
                  <div className="dv-card-sub">You are in their artist pool</div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {onMessage && (
                    <button className="dv-btn dv-btn--message" onClick={() => onMessage(userId, 'DJ', conn.venueName, conn.venueId)}>
                      Message
                    </button>
                  )}
                  <span className="dv-connected-badge">Connected</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {connections.length === 0 && (
        <div className="dv-empty">
          <p>No venue requests yet.</p>
          <p>Make sure your profile is complete so venues can find you on the Marketplace.</p>
        </div>
      )}
    </div>
  );
};

export default DJVenuesView;
