import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MarketplaceArtist } from './MarketplaceView';
import './MarketplaceProfileModal.css';

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function getSpotifyEmbedUrl(url: string): string | null {
  const match = url.match(/open\.spotify\.com\/(artist|album|track|playlist)\/([a-zA-Z0-9]+)/);
  return match ? `https://open.spotify.com/embed/${match[1]}/${match[2]}` : null;
}

interface Gig { id: string; venue: string; event: string; date: string; }

function loadFullProfile() {
  const defaults = {
    name: 'DJ Strauss',
    bio: 'Stockholm-based DJ with 5+ years of experience in House, Techno and Tech House. Known for high-energy sets and reading the crowd perfectly. Available for clubs, private events and festivals across Scandinavia and Europe.',
    genres: ['House', 'Techno', 'Tech House'] as string[],
    category: 'Club DJ',
    location: 'Stockholm, Sweden',
    spotify: '',
    youtube: '',
    price: '5 000 – 10 000 SEK',
    photo: '',
    photoX: 50,
    photoY: 15,
    manualGigs: [] as Gig[],
  };
  try {
    const saved = localStorage.getItem('jocky_dj_profile');
    if (saved) return { ...defaults, ...JSON.parse(saved) };
  } catch {}
  return defaults;
}

function loadPastGigs(): Gig[] {
  try {
    const saved = localStorage.getItem('jocky_events');
    if (!saved) return [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return JSON.parse(saved)
      .filter((e: any) => e.status === 'confirmed' && new Date(e.date) < today)
      .map((e: any) => ({
        id: `evt_${e.id}`,
        venue: e.venue || 'Unknown Venue',
        event: e.name || 'Untitled',
        date: typeof e.date === 'string' ? e.date.split('T')[0] : new Date(e.date).toISOString().split('T')[0],
      }));
  } catch { return []; }
}

interface Props {
  artist: MarketplaceArtist;
  connectionStatus?: 'pending' | 'accepted' | 'declined';
  onClose: () => void;
  onAdd: () => void;
}

const MarketplaceProfileModal: React.FC<Props> = ({ artist, connectionStatus, onClose, onAdd }) => {
  const [expanded, setExpanded] = useState(false);
  const profile = loadFullProfile();
  const { photoX, photoY, bio, genres, category, location, spotify, youtube, price, manualGigs } = profile;
  const photo = artist.photo || profile.photo;
  const name = artist.name || profile.name;

  const pressKit = (profile as any).pressKit as { name: string; data: string } | null;
  const youtubeEmbed = getYouTubeEmbedUrl(youtube);
  const spotifyEmbed = getSpotifyEmbedUrl(spotify);
  const autoGigs = loadPastGigs();
  const allGigs = [...autoGigs, ...(manualGigs || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const autoGigIds = new Set(autoGigs.map(g => g.id));
  const bioShort = bio.length > 220 ? bio.slice(0, 220) + '…' : bio;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return ReactDOM.createPortal(
    <div className="mpm-backdrop" onClick={onClose}>
      <div className="mpm-dialog" onClick={e => e.stopPropagation()}>

        {/* Hero */}
        <div className="mpm-hero" style={photo ? { backgroundImage: `url(${photo})`, backgroundPosition: `${photoX}% ${photoY}%` } : undefined}>
          <div className="mpm-hero-overlay" />
          <button className="mpm-close" onClick={onClose}>✕</button>
          <div className="mpm-hero-content">
            <span className="mpm-verified">✓ Identity verified</span>
            <h2 className="mpm-name">{name}</h2>
            <p className="mpm-sub">{category} · {location}</p>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="mpm-body">

          {/* CTA row */}
          <div className="mpm-cta-row">
            <div>
              <div className="mpm-price-label">Starting from</div>
              <div className="mpm-price">{price}</div>
            </div>
            {!connectionStatus && (
              <button className="mpm-add-btn" onClick={onAdd}>+ Add to my artists</button>
            )}
            {connectionStatus === 'pending' && (
              <span className="mpm-status mpm-status--pending">Request sent</span>
            )}
            {connectionStatus === 'accepted' && (
              <span className="mpm-status mpm-status--accepted">In your pool</span>
            )}
            {connectionStatus === 'declined' && (
              <span className="mpm-status mpm-status--declined">Declined</span>
            )}
          </div>

          <div className="mpm-divider" />

          {/* Bio */}
          <div className="mpm-section">
            <p className="mpm-bio">{expanded ? bio : bioShort}</p>
            {bio.length > 220 && (
              <button className="mpm-toggle" onClick={() => setExpanded(e => !e)}>
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>

          <div className="mpm-divider" />

          {/* Genres */}
          <div className="mpm-section">
            <h3 className="mpm-section-title">Genres</h3>
            <div className="mpm-tags">
              {genres.map((g: string) => <span key={g} className="mpm-tag">{g}</span>)}
            </div>
          </div>

          <div className="mpm-divider" />

          {/* Details row */}
          <div className="mpm-section mpm-details-grid">
            <div>
              <div className="mpm-detail-label">Category</div>
              <div className="mpm-detail-value">{category}</div>
            </div>
            <div>
              <div className="mpm-detail-label">Location</div>
              <div className="mpm-detail-value">{location}</div>
            </div>
          </div>

          {/* Spotify */}
          {(spotify || spotifyEmbed) && (
            <>
              <div className="mpm-divider" />
              <div className="mpm-section">
                <h3 className="mpm-section-title">Spotify</h3>
                {spotifyEmbed
                  ? <iframe
                      src={`${spotifyEmbed}?utm_source=generator&theme=0`}
                      width="100%" height="152" frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy" title="Spotify"
                      style={{ borderRadius: 10, display: 'block' }}
                    />
                  : <a className="mpm-spotify-btn" href={spotify} target="_blank" rel="noreferrer">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      Listen on Spotify
                    </a>
                }
              </div>
            </>
          )}

          {/* YouTube */}
          {youtubeEmbed && (
            <>
              <div className="mpm-divider" />
              <div className="mpm-section">
                <h3 className="mpm-section-title">YouTube</h3>
                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: 10, overflow: 'hidden', background: '#000' }}>
                  <iframe src={youtubeEmbed} title="YouTube" frameBorder="0" allowFullScreen
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} />
                </div>
              </div>
            </>
          )}

          {/* Press Kit */}
          {pressKit && (
            <>
              <div className="mpm-divider" />
              <div className="mpm-section">
                <h3 className="mpm-section-title">PDF</h3>
                <div className="mpm-presskit-row">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style={{ color: '#EF4444', flexShrink: 0 }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                  </svg>
                  <span className="mpm-presskit-name">{pressKit.name}</span>
                  <a className="mpm-presskit-btn" href={pressKit.data} target="_blank" rel="noreferrer">View</a>
                  <a className="mpm-presskit-btn" href={pressKit.data} download={pressKit.name}>Download</a>
                </div>
              </div>
            </>
          )}

          {/* Gig History */}
          {allGigs.length > 0 && (
            <>
              <div className="mpm-divider" />
              <div className="mpm-section">
                <h3 className="mpm-section-title">Gig History</h3>
                <div className="mpm-gigs">
                  {allGigs.map(gig => (
                    <div key={gig.id} className="mpm-gig-row">
                      <div className={`mpm-gig-dot${autoGigIds.has(gig.id) ? ' mpm-gig-dot--verified' : ''}`} />
                      <div className="mpm-gig-info">
                        <span className="mpm-gig-venue">{gig.venue}</span>
                        <span className="mpm-gig-event">{gig.event}</span>
                      </div>
                      <span className="mpm-gig-date">
                        {new Date(gig.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
};

export default MarketplaceProfileModal;
