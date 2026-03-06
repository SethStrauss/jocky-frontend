import React, { useState, useEffect } from 'react';
import { loadConnections, ArtistConnection } from './MarketplaceView';
import VenueProfileModal from './VenueProfileModal';
import './DJVenuesView.css';

interface DJVenuesViewProps {
  userId: string;
  venueProfiles?: any[];
  onMessage?: (artistId: string, artistName: string, venueName: string, venueId?: string) => void;
}

const DJVenuesView: React.FC<DJVenuesViewProps> = ({ userId, venueProfiles = [], onMessage }) => {
  const [connections, setConnections] = useState<ArtistConnection[]>(() =>
    loadConnections().filter(c => c.artistId === userId && c.status === 'accepted')
  );
  const [selectedVenue, setSelectedVenue] = useState<{ id: string; name: string; profile: any } | null>(null);

  const getProfile = (id: string) => venueProfiles.find((p: any) => p.id === id) || null;

  const openVenue = (id: string, name: string) => {
    const profile = getProfile(id);
    setSelectedVenue({ id, name: profile?.companyName || name, profile });
  };

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'jocky_artist_connections') {
        setConnections(loadConnections().filter(c => c.artistId === userId && c.status === 'accepted'));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [userId]);

  return (
    <div className="dj-venues-view">
      <div className="dv-header">
        <h1 className="dv-title">Venues</h1>
      </div>

      {connections.length > 0 ? (
        <section className="dv-section">
          <div className="dv-cards">
            {connections.map(conn => {
              const vp = getProfile(conn.venueId);
              const displayName = vp?.companyName || conn.venueName || 'Venue';
              const photo = vp?.photo || '';
              return (
                <div key={conn.id} className="dv-card dv-card--connected" style={{ cursor: 'pointer' }} onClick={() => openVenue(conn.venueId, conn.venueName)}>
                  <div className="dv-card-avatar dv-card-avatar--green" style={photo ? { backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
                    {!photo && displayName.charAt(0)}
                  </div>
                  <div className="dv-card-info">
                    <div className="dv-card-name">{displayName}</div>
                    <div className="dv-card-sub">Has added you to their artist pool</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                    {onMessage && (
                      <button className="dv-btn dv-btn--message" onClick={() => onMessage(userId, 'DJ', displayName, conn.venueId)}>
                        Message
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="dv-empty">
          <p>No venues yet.</p>
          <p>Make sure your profile is complete so venues can find you on the Marketplace.</p>
        </div>
      )}

      {selectedVenue && (
        <VenueProfileModal
          profile={selectedVenue.profile}
          venueName={selectedVenue.name}
          onClose={() => setSelectedVenue(null)}
        />
      )}
    </div>
  );
};

export default DJVenuesView;
