import React, { useState, useEffect } from 'react';
import { getDJPhoto } from '../utils/djPhoto';
import MarketplaceProfileModal from './MarketplaceProfileModal';
import './MarketplaceView.css';

export interface MarketplaceArtist {
  id: string;
  name: string;
  type: string;
  location: string;
  genres?: string[];
  priceRange?: string;
}

export interface ArtistConnection {
  id: string;
  artistId: string;
  artistName: string;
  artistType: string;
  artistLocation: string;
  artistGenres: string[];
  venueId: string;
  venueName: string;
  status: 'pending' | 'accepted' | 'declined';
  requestedAt: string;
}

const VENUE_ID = 'venue_default';
const VENUE_NAME = 'Sturehof';
const CONNECTIONS_KEY = 'jocky_artist_connections';

export function loadConnections(): ArtistConnection[] {
  try {
    return JSON.parse(localStorage.getItem(CONNECTIONS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveConnections(conns: ArtistConnection[]) {
  localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(conns));
}

// DJ Strauss is always on the marketplace (pulled from his profile)
export function getDJStraussListing(): MarketplaceArtist {
  try {
    const profile = JSON.parse(localStorage.getItem('jocky_dj_profile') || '{}');
    return {
      id: 'dj_strauss',
      name: profile.name || 'DJ Strauss',
      type: profile.category || 'Club DJ',
      location: profile.location || 'Stockholm',
      genres: profile.genres || ['House', 'Techno', 'Tech House'],
      priceRange: profile.price || '5 000–10 000 SEK',
    };
  } catch {
    return { id: 'dj_strauss', name: 'DJ Strauss', type: 'Club DJ', location: 'Stockholm', genres: ['House', 'Techno', 'Tech House'] };
  }
}

interface MarketplaceViewProps {
  onConnectionChange?: () => void;
}

const MarketplaceView: React.FC<MarketplaceViewProps> = ({ onConnectionChange }) => {
  const [artistType, setArtistType] = useState('');
  const [location, setLocation] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [connections, setConnections] = useState<ArtistConnection[]>(loadConnections);
  const [added, setAdded] = useState<string | null>(null);
  const [profileArtist, setProfileArtist] = useState<MarketplaceArtist | null>(null);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === CONNECTIONS_KEY) setConnections(loadConnections());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const allArtists: MarketplaceArtist[] = [getDJStraussListing()];

  const filtered = allArtists.filter(a => {
    const matchesType = !artistType || a.type.toLowerCase().includes(artistType.toLowerCase());
    const matchesLocation = !location || a.location.toLowerCase().includes(location.toLowerCase());
    const matchesSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesLocation && matchesSearch;
  });

  const getConnectionStatus = (artistId: string) =>
    connections.find(c => c.artistId === artistId && c.venueId === VENUE_ID)?.status;

  const handleAdd = (artist: MarketplaceArtist) => {
    const existing = connections.find(c => c.artistId === artist.id && c.venueId === VENUE_ID);
    if (existing) return;
    const newConn: ArtistConnection = {
      id: `conn_${Date.now()}`,
      artistId: artist.id,
      artistName: artist.name,
      artistType: artist.type,
      artistLocation: artist.location,
      artistGenres: artist.genres || [],
      venueId: VENUE_ID,
      venueName: VENUE_NAME,
      status: 'accepted',
      requestedAt: new Date().toISOString(),
    };
    const updated = [...connections, newConn];
    saveConnections(updated);
    setConnections(updated);
    setAdded(artist.id);
    setTimeout(() => setAdded(null), 2000);
    onConnectionChange?.();
  };

  return (
    <div className="marketplace-view">
      <h1 className="marketplace-title">Marketplace</h1>

      <div className="marketplace-filters">
        <select className="filter-select" value={artistType} onChange={e => setArtistType(e.target.value)}>
          <option value="">Type of artist</option>
          <option value="DJ">DJ</option>
          <option value="Live">Live artist</option>
          <option value="Standup">Comedian</option>
        </select>

        <select className="filter-select" value={location} onChange={e => setLocation(e.target.value)}>
          <option value="">Location</option>
          <option value="Stockholm">Stockholm</option>
          <option value="Göteborg">Göteborg</option>
          <option value="Malmö">Malmö</option>
        </select>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search artists"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      <div className="artist-count">
        {filtered.length} {filtered.length === 1 ? 'artist' : 'artists'}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 32px', color: '#9CA3AF', fontSize: '14px', lineHeight: '1.8' }}>
          <p>No artists on the marketplace yet.</p>
          <p>Artists appear here once they create a profile.</p>
        </div>
      )}

      <div className="marketplace-grid">
        {filtered.map(artist => {
          const status = getConnectionStatus(artist.id);
          return (
            <div key={artist.id} className="marketplace-card" style={{ cursor: 'pointer' }} onClick={() => setProfileArtist(artist)}>
              <div className="marketplace-card-image">
                {artist.id === 'dj_strauss' && getDJPhoto()
                  ? <img src={getDJPhoto()} alt={artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div className="placeholder-image"><span>{artist.name.charAt(0)}</span></div>
                }
              </div>
              <div className="marketplace-card-info">
                <h3 className="artist-card-name">{artist.name}</h3>
                <p className="artist-card-type">{artist.type}</p>
                <p className="artist-card-location">{artist.location}</p>
                {artist.genres && artist.genres.length > 0 && (
                  <p className="artist-card-genres">{artist.genres.join(', ')}</p>
                )}
              </div>
              <div className="marketplace-card-action" onClick={e => e.stopPropagation()}>
                {!status && (
                  <button
                    className="btn-add-to-pool"
                    onClick={() => handleAdd(artist)}
                  >
                    {added === artist.id ? 'Request sent!' : '+ Add to my artists'}
                  </button>
                )}
                {status === 'pending' && (
                  <span className="conn-status conn-status--pending">Pending response</span>
                )}
                {status === 'accepted' && (
                  <span className="conn-status conn-status--accepted">In your pool</span>
                )}
                {status === 'declined' && (
                  <span className="conn-status conn-status--declined">Declined</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {profileArtist && (
        <MarketplaceProfileModal
          artist={profileArtist}
          connectionStatus={getConnectionStatus(profileArtist.id)}
          onClose={() => setProfileArtist(null)}
          onAdd={() => { handleAdd(profileArtist); setProfileArtist(null); }}
        />
      )}
    </div>
  );
};

export default MarketplaceView;
