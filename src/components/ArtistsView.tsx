import React, { useState, useEffect } from 'react';
import { loadConnections, saveConnections, ArtistConnection, MarketplaceArtist } from './MarketplaceView';
import { getDJPhoto } from '../utils/djPhoto';
import { loadVenueName } from '../utils/venueProfile';
import MarketplaceProfileModal from './MarketplaceProfileModal';
import './ArtistsView.css';

const VENUE_ID = 'venue_default';
const VENUE_NAME = loadVenueName();

interface ArtistsViewProps {
  onMessage?: (artistId: string, artistName: string, venueName: string) => void;
}

const ArtistsView: React.FC<ArtistsViewProps> = ({ onMessage }) => {
  const [connections, setConnections] = useState<ArtistConnection[]>(() =>
    loadConnections().filter(c => c.venueId === VENUE_ID)
  );
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [profileArtist, setProfileArtist] = useState<MarketplaceArtist | null>(null);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'jocky_artist_connections') {
        setConnections(loadConnections().filter(c => c.venueId === VENUE_ID));
      }
    };
    window.addEventListener('storage', handler);
    // Re-load on mount in case DJ accepted in another tab
    setConnections(loadConnections().filter(c => c.venueId === VENUE_ID));
    return () => window.removeEventListener('storage', handler);
  }, []);

  const accepted = connections.filter(c => c.status === 'accepted');
  const pending  = connections.filter(c => c.status === 'pending');

  const displayList = (activeTab === 'all' ? accepted : pending).filter(c =>
    c.artistName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const removeConnection = (connId: string) => {
    const all = loadConnections();
    const updated = all.filter(c => c.id !== connId);
    saveConnections(updated);
    setConnections(updated.filter(c => c.venueId === VENUE_ID));
  };

  return (
    <>
    <div className="artists-view">
      <div className="artists-header">
        <div className="artists-header-left">
          <h1 className="artists-title">Artists</h1>
          <div className="artists-tabs">
            <button
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              My Artists {accepted.length > 0 && <span className="tab-count">{accepted.length}</span>}
            </button>
            <button
              className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending {pending.length > 0 && <span className="tab-count tab-count--orange">{pending.length}</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="artists-content">
        <div className="artist-list-panel" style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search artists"
            className="artist-search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          <div className="artist-cards">
            {displayList.length === 0 && (
              <div className="empty-state">
                {activeTab === 'all'
                  ? <p>No artists in your pool yet. Go to <strong>Marketplace</strong> to add artists.</p>
                  : <p>No pending requests.</p>
                }
              </div>
            )}

            {displayList.map(conn => (
              <div key={conn.id} className={`artist-pool-card ${conn.status === 'pending' ? 'artist-pool-card--pending' : ''}`}
                onClick={() => setProfileArtist({ id: conn.artistId, name: conn.artistName, type: conn.artistType, location: conn.artistLocation, genres: conn.artistGenres })}
                style={{ cursor: 'pointer' }}
              >
                <div className="pool-avatar" style={conn.artistId === 'dj_strauss' && getDJPhoto() ? { padding: 0, overflow: 'hidden' } : undefined}>
                  {conn.artistId === 'dj_strauss' && getDJPhoto()
                    ? <img src={getDJPhoto()} alt={conn.artistName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : conn.artistName.charAt(0)
                  }
                </div>
                <div className="pool-info">
                  <div className="pool-name">{conn.artistName}</div>
                  <div className="pool-type">{conn.artistType} · {conn.artistLocation}</div>
                  {conn.artistGenres.length > 0 && (
                    <div className="pool-genres">{conn.artistGenres.join(', ')}</div>
                  )}
                </div>
                {conn.status === 'pending' && (
                  <span className="pool-status-badge pool-status-badge--pending">Awaiting response</span>
                )}
                {conn.status === 'accepted' && (
                  <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                    {onMessage && (
                      <button className="pool-message-btn" onClick={() => onMessage(conn.artistId, conn.artistName, VENUE_NAME)}>
                        Message
                      </button>
                    )}
                    <button className="pool-remove-btn" onClick={() => removeConnection(conn.id)}>Remove</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {profileArtist && (
      <MarketplaceProfileModal
        artist={profileArtist}
        connectionStatus="accepted"
        onClose={() => setProfileArtist(null)}
        onAdd={() => {}}
      />
    )}
    </>
  );
};

export default ArtistsView;
