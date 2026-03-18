import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Artist, Event } from '../types';
import MarketplaceProfileModal from './MarketplaceProfileModal';
import { MarketplaceArtist } from './MarketplaceView';
import './BookArtistModal.css';

interface BookArtistModalProps {
  onClose: () => void;
  onBook: (selectedArtists: string[], selectedEvents: string[], mode: 'interest' | 'booking') => void;
  artists: Artist[];
  events: Event[];
  allDJProfiles?: any[];
}

const BookArtistModal: React.FC<BookArtistModalProps> = ({ onClose, onBook, artists, events, allDJProfiles = [] }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [mode, setMode] = useState<'interest' | 'booking'>('interest');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [poolSearchQuery, setPoolSearchQuery] = useState('');
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [marketplaceSearchQuery, setMarketplaceSearchQuery] = useState('');
  const [artistTypeFilter, setArtistTypeFilter] = useState('all');
  const [musicTypeFilter, setMusicTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
  };

  const toggleArtist = (artistId: string) => {
    setSelectedArtists(prev =>
      prev.includes(artistId) ? prev.filter(id => id !== artistId) : [...prev, artistId]
    );
  };

  const handleSubmit = () => {
    onBook(selectedArtists, selectedEvents, mode);
  };

  const poolArtists = artists.filter(artist =>
    artist.name.toLowerCase().includes(poolSearchQuery.toLowerCase()) ||
    artist.genres.some(g => g.toLowerCase().includes(poolSearchQuery.toLowerCase()))
  );

  const [profileArtist, setProfileArtist] = useState<MarketplaceArtist | null>(null);
  const allMarketplaceArtists: Artist[] = allDJProfiles.filter((p: any) => p.name).map((p: any) => ({
    id: p.id,
    name: p.name,
    type: p.category || 'Club DJ',
    location: p.location || '',
    genres: p.genres || [],
    about: p.bio || '',
    image: p.photo || '',
  }));

  const marketplaceArtists = allMarketplaceArtists.filter(artist => {
    const matchesSearch = artist.name.toLowerCase().includes(marketplaceSearchQuery.toLowerCase()) ||
                         artist.genres.some(g => g.toLowerCase().includes(marketplaceSearchQuery.toLowerCase()));
    const matchesType = artistTypeFilter === 'all' || artist.type.toLowerCase() === artistTypeFilter.toLowerCase();
    const matchesGenre = musicTypeFilter === 'all' ||
                        artist.genres.some(g => g.toLowerCase().includes(musicTypeFilter.toLowerCase()));
    const matchesLocation = locationFilter === 'all' || artist.location === locationFilter;
    return matchesSearch && matchesType && matchesGenre && matchesLocation;
  });

  const renderArtistCard = (artist: Artist) => {
    return (
      <div
        key={artist.id}
        className={`artist-card ${selectedArtists.includes(artist.id) ? 'selected' : ''}`}
        onClick={() => toggleArtist(artist.id)}
      >
        <input type="checkbox" checked={selectedArtists.includes(artist.id)} readOnly />
        <div className="artist-avatar" style={artist.image ? { backgroundImage: `url(${artist.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
          {!artist.image && artist.name.charAt(0)}
        </div>
        <div className="artist-info">
          <div className="artist-name">{artist.name}</div>
          <div className="artist-genres">{artist.genres.join(', ')}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="wizard-modal book-artist-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wizard-header">
          <h2 className="wizard-title">Book artist</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="wizard-steps">
          <div
            className={`wizard-step ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
            onClick={() => setCurrentStep(1)}
          >
            <div className="step-number">1</div>
            <div className="step-label">Events</div>
          </div>
          <div
            className={`wizard-step ${currentStep === 2 ? 'active' : ''}`}
            onClick={() => currentStep === 2 && setCurrentStep(2)}
          >
            <div className="step-number">2</div>
            <div className="step-label">Invite artists</div>
          </div>
        </div>

        <div className="wizard-content">
          {currentStep === 1 && (
            <div className="step-content">
              <table className="events-table">
                <thead>
                  <tr>
                    <th>Dance floor <span className="sort-arrow">↑↓</span></th>
                    <th>Date and time <span className="sort-arrow">↑↓</span></th>
                    <th>Event name <span className="sort-arrow">↑↓</span></th>
                    <th>Status <span className="sort-arrow">↑↓</span></th>
                    <th>Artist name <span className="sort-arrow">↑↓</span></th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => {
                    const isSelected = selectedEvents.includes(event.id);
                    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                    const d = new Date(event.date);
                    const dateStr = event.selectedDates && event.selectedDates.length > 1
                      ? `${event.selectedDates.length} dates · ${event.startTime}–${event.endTime}`
                      : `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]} ${event.startTime}–${event.endTime}`;
                    const eventArtists = [
                      ...(event.interestChecks || []),
                      ...(event.bookingRequests || []),
                    ];
                    if (event.artistName && eventArtists.length === 0) {
                      eventArtists.push({ artistId: event.artistId || '', artistName: event.artistName });
                    }
                    const statusLabel = event.status === 'confirmed' ? 'Confirmed'
                      : event.status === 'open' ? 'Interest check'
                      : event.status === 'offered' ? 'Booking request'
                      : event.status === 'declined' ? 'Declined'
                      : 'Created';
                    return (
                      <tr
                        key={event.id}
                        className={isSelected ? 'row-selected' : ''}
                        onClick={() => toggleEvent(event.id)}
                      >
                        <td>{event.danceFloor || event.venue || '—'}</td>
                        <td>{dateStr}</td>
                        <td className="event-name-cell">{event.name || 'Untitled Event'}</td>
                        <td>
                          <span className={`et-status-pill et-status-${event.status || 'created'}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td>
                          <div className="et-artist-cell">
                            <div className="et-avatar-stack">
                              {eventArtists.slice(0, 4).map((a, i) => {
                                const photo = artists.find(ar => ar.id === a.artistId)?.image || '';
                                return (
                                <div key={i} className="et-avatar" style={{ zIndex: 4 - i, ...(photo ? { backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}) }}>
                                  {!photo && a.artistName.charAt(0).toUpperCase()}
                                </div>
                                );
                              })}
                            </div>
                            {eventArtists.length === 1 && (
                              <span className="et-artist-name">{eventArtists[0].artistName}</span>
                            )}
                          </div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button className="et-edit-btn" title="Edit">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-content artists-step">
              <div className="mode-tabs">
                <button className={`mode-tab ${mode === 'interest' ? 'active' : ''}`} onClick={() => { setMode('interest'); setSelectedArtists([]); }}>Interest check</button>
                <button className={`mode-tab ${mode === 'booking' ? 'active' : ''}`} onClick={() => { setMode('booking'); setSelectedArtists([]); }}>Booking request</button>
              </div>

              {poolArtists.length > 0 && (
                <div className="artist-section">
                  <div className="section-header">
                    <h3>Artist Pool</h3>
                    <span className="count">{poolArtists.length} artists</span>
                  </div>
                  <div className="search-box">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <input type="text" placeholder="Search your artists..." value={poolSearchQuery} onChange={(e) => setPoolSearchQuery(e.target.value)} />
                  </div>
                  <div className="artists-list">{poolArtists.map(renderArtistCard)}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="wizard-footer">
          {currentStep > 1 && (
            <button className="btn-back" onClick={() => setCurrentStep(1)}>Back</button>
          )}
          <div style={{ flex: 1 }} />
          {currentStep < 2 ? (
            <button className="btn-next" onClick={() => setCurrentStep(2)} disabled={selectedEvents.length === 0}>
              Next step
            </button>
          ) : (
            <>
              <button className="btn-find-marketplace" onClick={() => setShowMarketplace(true)}>
                Find on Marketplace
              </button>
              <button className="btn-create" onClick={handleSubmit} disabled={selectedArtists.length === 0}>
                {mode === 'interest' ? 'Send interest check' : 'Send booking request'}
              </button>
            </>
          )}
        </div>
      </div>

      {showMarketplace && ReactDOM.createPortal(
        <div className="bam-mp-overlay" onClick={() => setShowMarketplace(false)}>
          <div className="bam-mp-modal" onClick={(e) => e.stopPropagation()}>

            <div className="bam-mp-header">
              <div>
                <h2 className="bam-mp-title">Marketplace</h2>
                <p className="bam-mp-count">{marketplaceArtists.length} artist{marketplaceArtists.length !== 1 ? 's' : ''}</p>
              </div>
              <button className="bam-mp-close" onClick={() => setShowMarketplace(false)}>×</button>
            </div>

            <div className="bam-mp-filters">
              <div className="search-box" style={{ minWidth: 300 }}>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <input type="text" placeholder="Search marketplace..." value={marketplaceSearchQuery} onChange={(e) => setMarketplaceSearchQuery(e.target.value)} />
              </div>
              <select value={artistTypeFilter} onChange={(e) => setArtistTypeFilter(e.target.value)}>
                <option value="all">Type of artist</option>
                <option value="dj">DJ</option>
                <option value="producer">Producer</option>
              </select>
              <select value={musicTypeFilter} onChange={(e) => setMusicTypeFilter(e.target.value)}>
                <option value="all">Type of music</option>
                <option value="house">House</option>
                <option value="techno">Techno</option>
              </select>
              <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                <option value="all">Location</option>
                <option value="Stockholm">Stockholm</option>
              </select>
            </div>

            <div className="bam-mp-grid">
              {marketplaceArtists.map(artist => {
                const isSelected = selectedArtists.includes(artist.id);
                const isInPool = artists.some(a => a.id === artist.id);
                return (
                  <div
                    key={artist.id}
                    className={`marketplace-card${isSelected ? ' bam-mp-card-selected' : ''}`}
                    onClick={() => setProfileArtist({ id: artist.id, name: artist.name, type: artist.type, location: artist.location, genres: artist.genres, photo: artist.image })}
                  >
                    <div className="marketplace-card-image">
                      {artist.image
                        ? <img src={artist.image} alt={artist.name} />
                        : <div className="placeholder-image"><span>{artist.name.charAt(0)}</span></div>
                      }
                    </div>
                    <div className="marketplace-card-info">
                      <h3 className="artist-card-name">{artist.name}</h3>
                      {artist.type && <p className="artist-card-type">{artist.type}</p>}
                      {artist.location && <p className="artist-card-location">{artist.location}</p>}
                      {artist.genres.length > 0 && <p className="artist-card-genres">{artist.genres.join(', ')}</p>}
                    </div>
                    <div className="marketplace-card-action" onClick={e => e.stopPropagation()}>
                      <button
                        className={`bam-mp-select-btn ${isInPool ? 'bam-mp-btn-pool' : isSelected ? 'bam-mp-btn-selected' : 'bam-mp-btn-default'}`}
                        onClick={() => { if (!isInPool) toggleArtist(artist.id); }}
                      >
                        {isInPool ? 'In your pool' : isSelected ? '✓ Selected' : 'Select'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bam-mp-footer" style={{ visibility: selectedArtists.length > 0 ? 'visible' : 'hidden' }}>
              <button className="btn-next" onClick={() => setShowMarketplace(false)}>
                Next step →
              </button>
              <span className="bam-mp-selected-count">{selectedArtists.length} selected</span>
            </div>

          </div>
        </div>,
        document.body
      )}
    {profileArtist && ReactDOM.createPortal(
      <MarketplaceProfileModal
        artist={profileArtist}
        onClose={() => setProfileArtist(null)}
        onAdd={() => { toggleArtist(profileArtist.id); setProfileArtist(null); }}
      />,
      document.body
    )}
    </div>
  );
};

export default BookArtistModal;
