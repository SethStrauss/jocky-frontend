import React, { useState, useRef, useEffect } from 'react';
import { currentSession } from './currentUser';
import { upsertDJProfile, uploadDJPhoto } from './services/db';
import './DJProfile.css';

interface Gig {
  id: string;
  venue: string;
  event: string;
  date: string;
}

interface DJProfileProps {
  onClose: () => void;
}

const similar = [
  { initials: 'AC', name: 'AronChupa', sub: 'DJ · Stockholm' },
  { initials: 'GI', name: 'Gilly',     sub: 'DJ · Stockholm' },
  { initials: 'DT', name: 'DJ Terka',  sub: 'DJ · Stockholm' },
];

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function getSpotifyEmbedUrl(url: string): string | null {
  const match = url.match(/open\.spotify\.com\/(artist|album|track|playlist)\/([a-zA-Z0-9]+)/);
  return match ? `https://open.spotify.com/embed/${match[1]}/${match[2]}` : null;
}

const STORAGE_KEY = 'jocky_dj_profile';

const defaults = {
  name:       '',
  bio:        '',
  genres:     [] as string[],
  category:   'Club DJ',
  location:   '',
  spotify:    '',
  youtube:    '',
  price:      '',
  photo:      '',
  photoX:     50,
  photoY:     50,
  manualGigs: [] as Gig[],
  pressKit:   null as { name: string; data: string } | null,
};

function loadProfile() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaults, ...JSON.parse(saved) };
  } catch {}
  return defaults;
}

function loadPastConfirmedGigs(): Gig[] {
  try {
    const saved = localStorage.getItem('jocky_events');
    if (!saved) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return JSON.parse(saved)
      .filter((e: any) => {
        if (e.status !== 'confirmed') return false;
        const d = new Date(e.date);
        d.setHours(0, 0, 0, 0);
        return d < today;
      })
      .map((e: any) => ({
        id: `evt_${e.id}`,
        venue: e.venue || e.danceFloor || 'Unknown Venue',
        event: e.name || 'Untitled Event',
        date: typeof e.date === 'string' ? e.date.split('T')[0] : new Date(e.date).toISOString().split('T')[0],
      }));
  } catch {}
  return [];
}

const DJProfile: React.FC<DJProfileProps> = ({ onClose }) => {
  const [editMode, setEditMode]   = useState(false);
  const [expanded, setExpanded]   = useState(false);

  const initial = loadProfile();
  const [name,     setName]     = useState(initial.name);
  const [bio,      setBio]      = useState(initial.bio);
  const [genres,   setGenres]   = useState<string[]>(initial.genres);
  const [category, setCategory] = useState(initial.category);
  const [location, setLocation] = useState(initial.location);
  const [spotify,  setSpotify]  = useState(initial.spotify);
  const [youtube,  setYoutube]  = useState(initial.youtube);
  const [price] = useState(initial.price);
  const [newGenre, setNewGenre] = useState('');

  const [photo,    setPhoto]    = useState(initial.photo || '');
  const [photoX,   setPhotoX]   = useState<number>(initial.photoX ?? 50);
  const [photoY,   setPhotoY]   = useState<number>(initial.photoY ?? 50);
  const [pressKit, setPressKit] = useState<{ name: string; data: string } | null>(initial.pressKit || null);
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const pressKitInputRef = useRef<HTMLInputElement>(null);
  const heroRef      = useRef<HTMLDivElement>(null);
  const dragging     = useRef(false);

  const [manualGigs, setManualGigs] = useState<Gig[]>(loadProfile().manualGigs || []);
  const [newGig, setNewGig] = useState({ venue: '', event: '', date: '' });

  // Re-read from localStorage if another part of the app updates the profile (e.g. after onboarding)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const p = loadProfile();
      setName(p.name);
      setBio(p.bio);
      setGenres(p.genres);
      setCategory(p.category);
      setLocation(p.location);
      setSpotify(p.spotify);
      setYoutube(p.youtube);
      setPhoto(p.photo || '');
      setPhotoX(p.photoX ?? 50);
      setPhotoY(p.photoY ?? 50);
      setPressKit(p.pressKit || null);
      setManualGigs(p.manualGigs || []);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setPhoto(reader.result as string); setPhotoX(50); setPhotoY(50); };
    reader.readAsDataURL(file);
  };

  const handleHeroMouseDown = (e: React.MouseEvent) => {
    if (!editMode || !photo) return;
    dragging.current = true;
    e.preventDefault();
  };

  const handleHeroMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top)  / rect.height) * 100));
    setPhotoX(x);
    setPhotoY(y);
  };

  const handleHeroMouseUp = () => { dragging.current = false; };

  const handlePressKitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { alert('PDF must be under 8 MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setPressKit({ name: file.name, data: reader.result as string });
    reader.readAsDataURL(file);
  };

  const autoGigs = loadPastConfirmedGigs();
  const autoGigIds = new Set(autoGigs.map(g => g.id));

  // Combined gig history: auto-generated + manual, sorted newest first
  const allGigs = [...autoGigs, ...manualGigs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const saveProfile = async () => {
    let photoToSave = photo;
    if (photo && photo.startsWith('data:') && currentSession?.userId) {
      photoToSave = await uploadDJPhoto(currentSession.userId, photo);
      setPhoto(photoToSave);
    }
    const profileData = { name, bio, genres, category, location, spotify, youtube, price, photo: photoToSave, photoX, photoY, manualGigs, pressKit };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profileData));
    if (currentSession?.userId) upsertDJProfile(currentSession.userId, profileData);
  };

  const addGenre = () => {
    const g = newGenre.trim();
    if (g && !genres.includes(g)) { setGenres(prev => [...prev, g]); }
    setNewGenre('');
  };

  const addGig = () => {
    if (newGig.venue && newGig.event && newGig.date) {
      setManualGigs(prev => [{ id: Date.now().toString(), ...newGig }, ...prev]);
      setNewGig({ venue: '', event: '', date: '' });
    }
  };

  const bioShort     = bio.length > 180 ? bio.slice(0, 180) + '…' : bio;
  const youtubeEmbed = getYouTubeEmbedUrl(youtube);
  const spotifyEmbed = getSpotifyEmbedUrl(spotify);

  return (
    <div className="pp-page">

      {/* ── Hero ── */}
      <div className="pp-hero" ref={heroRef}>
        <div
          className="pp-hero-art"
          style={photo ? { backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: `${photoX}% ${photoY}%` } : undefined}
        />
        <div className="pp-hero-overlay" />
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />

        {/* Drag zone — only covers the upper photo area, stops before the text */}
        {editMode && photo && (
          <div
            className="pp-drag-zone"
            onMouseDown={handleHeroMouseDown}
            onMouseMove={handleHeroMouseMove}
            onMouseUp={handleHeroMouseUp}
            onMouseLeave={handleHeroMouseUp}
          >
            <div className="pp-photo-drag-hint">Drag to adjust position</div>
          </div>
        )}

        {editMode && (
          <button className="pp-photo-btn" onClick={() => fileInputRef.current?.click()} title={photo ? 'Change photo' : 'Upload photo'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </button>
        )}

        <div className="pp-hero-topbar">
          <button className="pp-back" onClick={onClose}>← Back</button>
          <button
            className={`pp-edit-btn ${editMode ? 'pp-edit-btn--save' : ''}`}
            onClick={() => { if (editMode) saveProfile(); setEditMode(m => !m); }}
          >
            {editMode ? '✓  Save Profile' : '✎  Edit Profile'}
          </button>
        </div>

        <div className="pp-hero-bottom">
          <span className="pp-verified">✓ Identity verified</span>
          {editMode
            ? <input className="pp-name-input" value={name} onChange={e => setName(e.target.value)} />
            : <h1 className="pp-name">{name}</h1>
          }
          <p className="pp-sub">DJ · {location}</p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="pp-body">
        <div className="pp-main">

          {/* Bio */}
          <section className="pp-section">
            {editMode
              ? <textarea className="pp-bio-input" value={bio} onChange={e => setBio(e.target.value)} rows={5} />
              : <>
                  <p className="pp-bio">{expanded ? bio : bioShort}</p>
                  {bio.length > 180 && (
                    <button className="pp-toggle" onClick={() => setExpanded(e => !e)}>
                      {expanded ? 'Show less ▲' : 'Show more ▼'}
                    </button>
                  )}
                </>
            }
          </section>

          <div className="pp-divider" />

          {/* Genres */}
          <section className="pp-section">
            <h3 className="pp-section-title">Genres</h3>
            <div className="pp-tags">
              {genres.map(g => (
                <span key={g} className="pp-tag">
                  {g}
                  {editMode && <button className="pp-tag-x" onClick={() => setGenres(prev => prev.filter(x => x !== g))}>✕</button>}
                </span>
              ))}
              {editMode && (
                <span className="pp-tag-new">
                  <input
                    className="pp-tag-input"
                    placeholder="Add genre…"
                    value={newGenre}
                    onChange={e => setNewGenre(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addGenre()}
                  />
                  <button className="pp-tag-add" onClick={addGenre}>+</button>
                </span>
              )}
            </div>
          </section>

          <div className="pp-divider" />

          {/* Category */}
          <section className="pp-section">
            <h3 className="pp-section-title">Category</h3>
            {editMode
              ? <input className="pp-field-input" value={category} onChange={e => setCategory(e.target.value)} />
              : <div className="pp-tags"><span className="pp-tag">{category}</span></div>
            }
          </section>

          <div className="pp-divider" />

          {/* Location */}
          <section className="pp-section">
            <h3 className="pp-section-title">Location</h3>
            {editMode
              ? <input className="pp-field-input" value={location} onChange={e => setLocation(e.target.value)} />
              : <p className="pp-location">{location}</p>
            }
          </section>

          <div className="pp-divider" />

          {/* Spotify */}
          <section className="pp-section">
            <h3 className="pp-section-title">Spotify</h3>
            {editMode
              ? <input className="pp-field-input" placeholder="https://open.spotify.com/artist/…" value={spotify} onChange={e => setSpotify(e.target.value)} />
              : spotifyEmbed
                ? <iframe
                    className="pp-spotify-embed"
                    src={`${spotifyEmbed}?utm_source=generator&theme=0`}
                    width="100%"
                    height="352"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title="Spotify"
                  />
                : spotify
                  ? <a className="pp-spotify-btn" href={spotify} target="_blank" rel="noreferrer">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      Listen on Spotify
                    </a>
                  : <p className="pp-empty-field">No Spotify link added yet</p>
            }
          </section>

          <div className="pp-divider" />

          {/* YouTube */}
          <section className="pp-section">
            <h3 className="pp-section-title">YouTube</h3>
            {editMode
              ? <input className="pp-field-input" placeholder="https://youtube.com/watch?v=…" value={youtube} onChange={e => setYoutube(e.target.value)} />
              : youtubeEmbed
                ? <div className="pp-youtube-wrap">
                    <iframe src={youtubeEmbed} title="YouTube video" frameBorder="0" allowFullScreen />
                  </div>
                : <p className="pp-empty-field">No YouTube video added yet</p>
            }
          </section>

          <div className="pp-divider" />

          {/* Press Kit */}
          <section className="pp-section">
            <h3 className="pp-section-title">Upload PDF</h3>
            <input
              ref={pressKitInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={handlePressKitChange}
            />
            {pressKit ? (
              <div className="pp-presskit-row">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" style={{ color: '#ef4444', flexShrink: 0 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                </svg>
                <span className="pp-presskit-name">{pressKit.name}</span>
                <a className="pp-presskit-view" href={pressKit.data} target="_blank" rel="noreferrer">View</a>
                <a className="pp-presskit-view" href={pressKit.data} download={pressKit.name}>Download</a>
                {editMode && (
                  <button className="pp-presskit-remove" onClick={() => setPressKit(null)}>✕ Remove</button>
                )}
              </div>
            ) : (
              editMode
                ? <button className="pp-presskit-upload" onClick={() => pressKitInputRef.current?.click()}>
                    📄 Upload PDF
                  </button>
                : <p className="pp-empty-field">No press kit uploaded yet</p>
            )}
            {editMode && pressKit && (
              <button className="pp-presskit-upload" style={{ marginTop: 10 }} onClick={() => pressKitInputRef.current?.click()}>
                📄 Replace PDF
              </button>
            )}
          </section>

          <div className="pp-divider" />

          {/* Gig History */}
          <section className="pp-section">
            <h3 className="pp-section-title">Gig History</h3>

            {editMode && (
              <div className="pp-gig-form">
                <input className="pp-field-input" placeholder="Venue" value={newGig.venue} onChange={e => setNewGig(g => ({ ...g, venue: e.target.value }))} />
                <input className="pp-field-input" placeholder="Event name" value={newGig.event} onChange={e => setNewGig(g => ({ ...g, event: e.target.value }))} />
                <input className="pp-field-input" type="date" value={newGig.date} onChange={e => setNewGig(g => ({ ...g, date: e.target.value }))} />
                <button className="pp-gig-add-btn" onClick={addGig}>+ Add Gig</button>
              </div>
            )}

            <div className="pp-gig-list">
              {allGigs.length === 0 && (
                <p className="pp-empty-field">No past gigs yet — accepted bookings will appear here once their date passes.</p>
              )}
              {allGigs.map(gig => (
                <div key={gig.id} className="pp-gig-row">
                  <div className={`pp-gig-dot${autoGigIds.has(gig.id) ? ' pp-gig-dot--auto' : ''}`} />
                  <div className="pp-gig-info">
                    <span className="pp-gig-venue">{gig.venue}</span>
                    <span className="pp-gig-event">{gig.event}</span>
                  </div>
                  <span className="pp-gig-date">
                    {new Date(gig.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {editMode && !autoGigIds.has(gig.id) && (
                    <button className="pp-gig-x" onClick={() => setManualGigs(prev => prev.filter(g => g.id !== gig.id))}>✕</button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div className="pp-divider" />

          {/* Similar */}
          <section className="pp-section">
            <h3 className="pp-section-title">Similar Artists</h3>
            <div className="pp-similar">
              {similar.map(a => (
                <div key={a.name} className="pp-similar-card">
                  <div className="pp-similar-avatar">{a.initials}</div>
                  <div className="pp-similar-name">{a.name}</div>
                  <div className="pp-similar-sub">{a.sub}</div>
                </div>
              ))}
            </div>
          </section>

        </div>


      </div>
    </div>
  );
};

export default DJProfile;
