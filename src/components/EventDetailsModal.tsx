import React, { useState } from 'react';
import { getDJPhoto } from '../utils/djPhoto';
import { Event, Artist } from '../types';
import { eventService } from '../services/event.service';
import './EventDetailsModal.css';

function loadDanceFloors(): { id: string; name: string }[] {
  try {
    const s = localStorage.getItem('jocky_venue_profile');
    if (s) {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed.danceFloors)) return parsed.danceFloors;
    }
  } catch {}
  return [
    { id: '1', name: 'Main Dining' },
    { id: '2', name: 'Upstairs' },
    { id: '3', name: 'Basement' },
  ];
}

function loadArtistProfile() {
  try {
    const saved = localStorage.getItem('jocky_dj_profile');
    const defaults = { name: 'DJ Strauss', bio: '', genres: [] as string[], category: 'Club DJ', location: 'Stockholm', photo: '', photoX: 50, photoY: 50, pressKit: null as { name: string; data: string } | null };
    if (saved) return { ...defaults, ...JSON.parse(saved) };
    return defaults;
  } catch { return { name: 'DJ Strauss', bio: '', genres: [] as string[], category: 'Club DJ', location: 'Stockholm', photo: '', photoX: 50, photoY: 50, pressKit: null }; }
}

interface EventDetailsModalProps {
  event: Event;
  clickedDate?: Date;
  onClose: () => void;
  onUpdate: (updatedEvent?: Event) => void;
  onDelete?: () => void;
  onMessageArtist?: (artistId: string, artistName: string) => void;
  artists: Artist[];
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  clickedDate,
  onClose,
  onUpdate,
  onDelete,
  onMessageArtist,
  artists
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: event.name,
    startTime: event.startTime,
    endTime: event.endTime,
    danceFloor: event.danceFloor || '',
    amount: event.amount ? String(event.amount) : '',
    notes: event.notes || '',
  });
  const [deleting, setDeleting] = useState(false);
  const [interestOpen, setInterestOpen] = useState(false);
  const [offersOpen, setOffersOpen] = useState(false);

  const handleClose = () => {
    if (editing) {
      const updatedEvent: Event = {
        ...event,
        name: draft.name,
        startTime: draft.startTime,
        endTime: draft.endTime,
        danceFloor: draft.danceFloor,
        amount: parseFloat(draft.amount) || 0,
        notes: draft.notes,
      };
      onUpdate(updatedEvent);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      setDeleting(true);
      await eventService.deleteEvent(event.id);
      if (onDelete) onDelete();
      onClose();
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusDisplay = (status?: string) => {
    switch (status) {
      case 'offered': return { label: 'Offered', class: 'status-offered' };
      case 'confirmed': return { label: 'Confirmed', class: 'status-confirmed' };
      case 'declined': return { label: 'Declined', class: 'status-declined' };
      case 'cancelled': return { label: 'Cancelled', class: 'status-declined' };
      default: return { label: 'Open', class: 'status-open' };
    }
  };

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const h = String(i).padStart(2, '0');
    return <option key={h} value={`${h}:00`}>{`${h}:00`}</option>;
  });

  const statusInfo = getStatusDisplay(event.status);
  const interestChecks = (event.interestChecks || []).length > 0
    ? (event.interestChecks || [])
    : (event.status === 'open' && event.artistName
      ? [{ artistId: event.artistId || '', artistName: event.artistName }]
      : []);
  const bookingRequests = (event.bookingRequests || []).length > 0
    ? (event.bookingRequests || [])
    : (event.status === 'offered' && event.artistName
      ? [{ artistId: event.artistId || '', artistName: event.artistName }]
      : []);

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="event-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            {editing ? (
              <input
                className="edm-name-input"
                value={draft.name}
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                autoFocus
              />
            ) : (
              <h2 className="modal-title">{event.name}</h2>
            )}
            <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            {editing ? (
              <button className="edm-btn-save" onClick={() => { const updatedEvent: Event = { ...event, name: draft.name, startTime: draft.startTime, endTime: draft.endTime, danceFloor: draft.danceFloor, amount: parseFloat(draft.amount) || 0, notes: draft.notes }; onUpdate(updatedEvent); setEditing(false); }}>Save</button>
            ) : (
              <button className="edm-btn-edit" onClick={() => setEditing(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </button>
            )}
            <button className="modal-close" onClick={handleClose}>×</button>
          </div>
        </div>

        <div className="event-info">
          <div className="info-row">
            <span className="info-label">Date</span>
            <span className="info-value">
              {(clickedDate || event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">Time</span>
            {editing ? (
              <div className="edm-time-row">
                <select className="edm-select" value={draft.startTime} onChange={e => setDraft(d => ({ ...d, startTime: e.target.value }))}>{timeOptions}</select>
                <span style={{ color: '#9CA3AF' }}>–</span>
                <select className="edm-select" value={draft.endTime} onChange={e => setDraft(d => ({ ...d, endTime: e.target.value }))}>{timeOptions}</select>
              </div>
            ) : (
              <span className="info-value">{event.startTime} – {event.endTime}</span>
            )}
          </div>

          {(event.venue) && (
            <div className="info-row">
              <span className="info-label">Venue</span>
              <span className="info-value">{event.venue}</span>
            </div>
          )}

          <div className="info-row">
            <span className="info-label">Dance Floor</span>
            {editing ? (
              <select className="edm-select" value={draft.danceFloor} onChange={e => setDraft(d => ({ ...d, danceFloor: e.target.value }))}>
                <option value="">—</option>
                {loadDanceFloors().map(f => (
                  <option key={f.id} value={f.name}>{f.name}</option>
                ))}
              </select>
            ) : (
              <span className="info-value">{event.danceFloor || '—'}</span>
            )}
          </div>

          <div className="info-row">
            <span className="info-label">Amount</span>
            {editing ? (
              <input className="edm-input" type="number" value={draft.amount} onChange={e => setDraft(d => ({ ...d, amount: e.target.value }))} placeholder="0" />
            ) : (
              <span className="info-value">{event.amount > 0 ? `${event.amount.toLocaleString()} SEK` : '—'}</span>
            )}
          </div>

          <div className="info-row" style={{ borderBottom: 'none' }}>
            <span className="info-label">Notes</span>
            {editing ? (
              <textarea className="edm-textarea" value={draft.notes} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} rows={3} />
            ) : (
              <span className="info-value">{event.notes || '—'}</span>
            )}
          </div>

          {event.artistName && event.status !== 'open' && (() => {
            const p = loadArtistProfile();
            const bioShort = p.bio.length > 120 ? p.bio.slice(0, 120) + '…' : p.bio;
            return (
              <div className="edm-artist-card">
                <div className="edm-artist-header">
                  <div className="edm-artist-photo" style={p.photo ? { backgroundImage: `url(${p.photo})`, backgroundSize: 'cover', backgroundPosition: `${p.photoX}% ${p.photoY}%` } : undefined}>
                    {!p.photo && event.artistName.charAt(0).toUpperCase()}
                  </div>
                  <div className="edm-artist-meta">
                    <div className="edm-artist-name">{event.artistName}</div>
                    <div className="edm-artist-sub">{p.category} · {p.location}</div>
                    <div className="edm-artist-genres">
                      {p.genres.map((g: string) => <span key={g} className="edm-genre-tag">{g}</span>)}
                    </div>
                  </div>
                </div>
                {p.bio && <p className="edm-artist-bio">{bioShort}</p>}
                {p.pressKit && (
                  <a className="edm-presskit-btn" href={p.pressKit.data} download={p.pressKit.name}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/></svg>
                    {p.pressKit.name}
                  </a>
                )}
              </div>
            );
          })()}
        </div>

        {(event.status === 'open' || event.status === 'offered') && (
          <div className="edm-checks-section">
            <button className="edm-checks-toggle" onClick={() => setInterestOpen(o => !o)}>
              <span>Interest checks sent to</span>
              {interestChecks.length > 0 && <span className="edm-checks-count">{interestChecks.length}</span>}
              <svg className={`edm-checks-chevron ${interestOpen ? 'open' : ''}`} viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {interestOpen && (
              <div className="edm-checks-list">
                {interestChecks.length === 0
                  ? <div className="edm-check-empty">No interest checks sent yet</div>
                  : interestChecks.map((check, i) => {
                      const photo = getDJPhoto();
                      const statusText = check.djResponse === 'interested' ? 'Interested ✓'
                        : check.djResponse === 'declined' ? 'Declined'
                        : 'Waiting for response…';
                      const statusColor = check.djResponse === 'interested' ? '#10B981'
                        : check.djResponse === 'declined' ? '#EF4444'
                        : '#9CA3AF';
                      return (
                        <div key={i} className="edm-check-row">
                          <div className="edm-confirmed-avatar" style={photo ? { backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
                            {!photo && check.artistName.charAt(0).toUpperCase()}
                          </div>
                          <span className="edm-confirmed-name">{check.artistName}</span>
                          <span className="edm-check-status" style={{ color: statusColor }}>{statusText}</span>
                        </div>
                      );
                    })}
              </div>
            )}
          </div>
        )}

        {event.status === 'offered' && (
          <div className="edm-checks-section">
            <button className="edm-checks-toggle" onClick={() => setOffersOpen(o => !o)}>
              <span>Offers sent to</span>
              {bookingRequests.length > 0 && <span className="edm-checks-count edm-checks-count--offered">{bookingRequests.length}</span>}
              <svg className={`edm-checks-chevron ${offersOpen ? 'open' : ''}`} viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {offersOpen && (
              <div className="edm-checks-list">
                {bookingRequests.length === 0
                  ? <div className="edm-check-empty">No offers sent yet</div>
                  : bookingRequests.map((req, i) => {
                      const photo = getDJPhoto();
                      return (
                        <div key={i} className="edm-check-row">
                          <div className="edm-confirmed-avatar" style={photo ? { backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
                            {!photo && req.artistName.charAt(0).toUpperCase()}
                          </div>
                          <span className="edm-confirmed-name">{req.artistName}</span>
                          <span className="edm-check-status">Offer sent · Waiting…</span>
                        </div>
                      );
                    })}
              </div>
            )}
          </div>
        )}

        {event.status === 'confirmed' && (() => {
          const p = loadArtistProfile();
          return (
            <div className="status-message status-message-confirmed edm-confirmed-row">
              <span>✓ Confirmed with</span>
              <div className="edm-confirmed-artist">
                <div
                  className="edm-confirmed-avatar"
                  style={p.photo ? { backgroundImage: `url(${p.photo})`, backgroundSize: 'cover', backgroundPosition: `${p.photoX}% ${p.photoY}%` } : undefined}
                >
                  {!p.photo && (event.artistName || p.name).charAt(0).toUpperCase()}
                </div>
                <span className="edm-confirmed-name">{event.artistName || p.name}</span>
              </div>
            </div>
          );
        })()}

        <div className="modal-footer">
          {event.artistId && event.artistName && onMessageArtist && (
            <button className="btn-message-artist-event" onClick={() => onMessageArtist(event.artistId!, event.artistName!)}>
              ✉️ Message {event.artistName}
            </button>
          )}
          <button className="btn-delete-event" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Event'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
