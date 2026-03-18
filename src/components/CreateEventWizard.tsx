import React, { useState, useRef, useEffect } from 'react';
import { Event, Artist } from '../types';
import DateRangePicker from './DateRangePicker';
import { MarketplaceArtist } from './MarketplaceView';
import { loadVenueName } from '../utils/venueProfile';
import './CreateEventWizard.css';

interface CreateEventWizardProps {
  onClose: () => void;
  onCreate: (events: Event[], selectedArtists?: string[], pdfFile?: File) => void;
  initialDate: Date;
  initialTime?: string;
  artists: Artist[];
  allDJProfiles?: any[];
}


const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const WEEKDAY_JS: Record<string, number> = { Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0 };

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

const CreateEventWizard: React.FC<CreateEventWizardProps> = ({
  onClose,
  onCreate,
  initialDate,
  initialTime,
  artists,
  allDJProfiles = [],
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Event Details
  const [eventName, setEventName] = useState('');
  const [frequency, setFrequency] = useState<'single' | 'multiple'>('single');
  const [eventDate, setEventDate] = useState(initialDate.toISOString().split('T')[0]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [rangeStart, setRangeStart] = useState(initialDate.toISOString().split('T')[0]);
  const [rangeEnd, setRangeEnd] = useState(initialDate.toISOString().split('T')[0]);
  const [weekdays, setWeekdays] = useState<string[]>([]);

  const toStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const getWeekdayDates = (day: string, start: string, end: string): string[] => {
    if (!start || !end) return [];
    const [sy, sm, sd] = start.split('-').map(Number);
    const [ey, em, ed] = end.split('-').map(Number);
    const s = new Date(sy, sm - 1, sd);
    const e = new Date(ey, em - 1, ed);
    if (s > e) return [];
    const jsDay = WEEKDAY_JS[day];
    const result: string[] = [];
    const cur = new Date(s);
    while (cur <= e) {
      if (cur.getDay() === jsDay) result.push(toStr(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  };
  const [startTime, setStartTime] = useState(initialTime || '20:00');
  const [endTime, setEndTime] = useState('23:00');
  const [venue] = useState(loadVenueName());
  const [danceFloor, setDanceFloor] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Step 2: Invite Artists
  const [inviteMethod, setInviteMethod] = useState<'interest' | 'booking'>('interest');
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [marketplaceAdded, setMarketplaceAdded] = useState<Artist[]>([]);
  const [allMarketplaceArtists, setAllMarketplaceArtists] = useState<MarketplaceArtist[]>([]);
  const [activeSource, setActiveSource] = useState<'my' | 'marketplace'>('my');
  const [previewArtist, setPreviewArtist] = useState<{id:string,name:string,type:string,location:string,genres:string[],image?:string} | null>(null);
  const [inviteTypeFilter, setInviteTypeFilter] = useState('');
  const [inviteLocFilter, setInviteLocFilter] = useState('');
  const [inviteSearch, setInviteSearch] = useState('');

  useEffect(() => {
    const profiles = allDJProfiles.length > 0 ? allDJProfiles : [];
    setAllMarketplaceArtists(profiles.filter((p: any) => p.name).map((p: any) => ({
      id: p.id,
      name: p.name,
      type: p.category || 'Club DJ',
      location: p.location || '',
      genres: p.genres || [],
      priceRange: p.price ? `${p.price}` : undefined,
      photo: p.photo || '',
    })));
  }, [allDJProfiles]);

  // Step 3: Attach PDF
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const dateInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' :
                   day === 2 || day === 22 ? 'nd' :
                   day === 3 || day === 23 ? 'rd' : 'th';
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${day}${suffix}, ${date.getFullYear()}`;
  };

  const handleNext = () => { if (currentStep < 3) setCurrentStep(currentStep + 1); };
  const handleBack = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const toggleWeekday = (day: string) => {
    const active = weekdays.includes(day);
    const dates = getWeekdayDates(day, rangeStart, rangeEnd);
    if (active) {
      setWeekdays(prev => prev.filter(w => w !== day));
      setSelectedDates(prev => prev.filter(d => !dates.includes(d)));
    } else {
      setWeekdays(prev => [...prev, day]);
      setSelectedDates(prev => Array.from(new Set([...prev, ...dates])).sort());
    }
  };

  const handleCreate = () => {
    const interestChecks = inviteMethod === 'interest' && selectedArtists.length > 0
      ? selectedArtists.map(id => ({ artistId: id, artistName: allInviteArtists.find(a => a.id === id)?.name || id }))
      : undefined;
    const bookingRequests = inviteMethod === 'booking' && selectedArtists.length > 0
      ? selectedArtists.map(id => ({ artistId: id, artistName: allInviteArtists.find(a => a.id === id)?.name || id }))
      : undefined;

    const status = selectedArtists.length === 0 ? 'created' : inviteMethod === 'interest' ? 'open' : 'offered';

    const dates = frequency === 'multiple' && selectedDates.length > 0
      ? selectedDates
      : [eventDate];

    const newEvents: Event[] = dates.map((d, i) => {
      const [y, m, day] = d.split('-').map(Number);
      return {
        id: (Date.now() + i).toString(),
        name: eventName || 'Untitled Gig',
        date: new Date(y, m - 1, day),
        startTime,
        endTime,
        venue,
        danceFloor,
        amount: parseFloat(amount) || 0,
        notes,
        frequency: 'single' as const,
        status: status as Event['status'],
        openForRequests: inviteMethod === 'interest',
        interestChecks,
        bookingRequests,
      };
    });

    onCreate(newEvents, selectedArtists, uploadedFile || undefined);
  };

  const toggleArtist = (artistId: string) => {
    setSelectedArtists(prev =>
      prev.includes(artistId) ? prev.filter(id => id !== artistId) : [...prev, artistId]
    );
  };

  const allInviteArtists: Artist[] = [
    ...artists,
    ...marketplaceAdded.filter(a => !artists.some(p => p.id === a.id)),
  ];

  const getInitials = (name: string) => {
    const parts = name.replace(/([a-z])([A-Z])/g, '$1 $2').split(/\s+/).filter(Boolean);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const inviteDisplayArtists = activeSource === 'my'
    ? artists.filter(a =>
        !inviteSearch ||
        a.name.toLowerCase().includes(inviteSearch.toLowerCase())
      )
    : allMarketplaceArtists
        .filter(a => !inviteSearch || a.name.toLowerCase().includes(inviteSearch.toLowerCase()))
        .filter(a => !inviteTypeFilter || a.type.toLowerCase().includes(inviteTypeFilter.toLowerCase()))
        .filter(a => !inviteLocFilter || a.location === inviteLocFilter)
        .map(a => ({ id: a.id, name: a.name, type: a.type || '', location: a.location || '', genres: a.genres || [], about: '', image: a.photo || '' } as Artist));

  const handleInviteCardClick = (artist: Artist) => {
    if (activeSource === 'marketplace' && !artists.some(p => p.id === artist.id)) {
      setMarketplaceAdded(prev => prev.some(a => a.id === artist.id) ? prev : [...prev, artist]);
    }
    toggleArtist(artist.id);
    setPreviewArtist(artist);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setUploadedFile(e.target.files[0]);
  };

  const calendarIcon = (
    <svg viewBox="0 0 20 20" fill="currentColor" className="ce-calendar-icon">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
  );

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const h = i.toString().padStart(2, '0');
    return <option key={h} value={`${h}:00`}>{`${h}:00`}</option>;
  });

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`wizard-modal${currentStep === 2 ? ' wizard-modal--wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="wizard-header">
          <h2 className="wizard-title">Create new Event</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="wizard-steps">
          <div className={`wizard-step ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`} onClick={() => setCurrentStep(1)}>
            <div className="step-number">1</div>
            <div className="step-label">Event details</div>
          </div>
          <div className={`wizard-step ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`} onClick={() => setCurrentStep(2)}>
            <div className="step-number">2</div>
            <div className="step-label">Invite artists</div>
          </div>
          <div className={`wizard-step ${currentStep === 3 ? 'active' : ''}`} onClick={() => setCurrentStep(3)}>
            <div className="step-number">3</div>
            <div className="step-label">Attach PDF</div>
          </div>
        </div>

        <div className="wizard-content">
          {currentStep === 1 && (
            <div className="step-content">

              {/* Event name */}
              <div className="ce-row">
                <label className="ce-label">Event name</label>
                <input type="text" className="ce-input" placeholder="e.g. Friday Night Live" value={eventName} onChange={(e) => setEventName(e.target.value)} />
              </div>

              {/* Frequency */}
              <div className="ce-row">
                <label className="ce-label">Frequency</label>
                <div className="ce-radios">
                  <label className="ce-radio-label">
                    <input type="radio" checked={frequency === 'single'} onChange={() => setFrequency('single')} />
                    <span>Single event</span>
                  </label>
                  <label className="ce-radio-label">
                    <input type="radio" checked={frequency === 'multiple'} onChange={() => setFrequency('multiple')} />
                    <span>Multiple events</span>
                  </label>
                </div>
              </div>

              {/* Event date (single) */}
              {frequency === 'single' && (
                <div className="ce-row">
                  <label className="ce-label">Event date</label>
                  <div className="ce-date-field" onClick={(e) => { e.stopPropagation(); dateInputRef.current?.showPicker(); }}>
                    <span>{formatDate(eventDate)}</span>
                    {calendarIcon}
                    <input ref={dateInputRef} type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} style={{ position: 'absolute', bottom: 0, left: 0, width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }} />
                  </div>
                </div>
              )}

              {/* Multi-date picker (multiple) */}
              {frequency === 'multiple' && (
                <>
                  <div className="ce-row">
                    <label className="ce-label">From</label>
                    <div className="ce-date-field" onClick={(e) => { e.stopPropagation(); (e.currentTarget.querySelector('input') as HTMLInputElement)?.showPicker(); }}>
                      <span>{formatDate(rangeStart)}</span>
                      {calendarIcon}
                      <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)} style={{ position: 'absolute', bottom: 0, left: 0, width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }} />
                    </div>
                  </div>

                  <div className="ce-row">
                    <label className="ce-label">To</label>
                    <div className="ce-date-field" onClick={(e) => { e.stopPropagation(); (e.currentTarget.querySelector('input') as HTMLInputElement)?.showPicker(); }}>
                      <span>{formatDate(rangeEnd)}</span>
                      {calendarIcon}
                      <input type="date" value={rangeEnd} min={rangeStart} onChange={e => setRangeEnd(e.target.value)} style={{ position: 'absolute', bottom: 0, left: 0, width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }} />
                    </div>
                  </div>

                  <div className="ce-row">
                    <label className="ce-label">Weekdays</label>
                    <div className="ce-weekdays">
                      {WEEKDAYS.map(day => (
                        <button
                          key={day}
                          type="button"
                          className={`ce-day-pill ${weekdays.includes(day) ? 'ce-day-pill--active' : ''}`}
                          onClick={() => toggleWeekday(day)}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="ce-row ce-row--top">
                    <label className="ce-label" style={{ paddingTop: 11 }}>Pick dates</label>
                    <div style={{ flex: 1 }}>
                      <div className="ce-date-field" onClick={(e) => { e.stopPropagation(); setShowRangePicker(v => !v); }}>
                        <span>{selectedDates.length > 0 ? `${selectedDates.length} date${selectedDates.length !== 1 ? 's' : ''} selected` : 'Click to pick individual dates'}</span>
                        {calendarIcon}
                      </div>
                      {showRangePicker && (
                        <DateRangePicker
                          selectedDates={selectedDates}
                          onSelectedDatesChange={setSelectedDates}
                          onClose={() => setShowRangePicker(false)}
                          onClear={() => { setSelectedDates([]); setWeekdays([]); }}
                        />
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Start time */}
              <div className="ce-row">
                <label className="ce-label">Start</label>
                <select className="ce-select" value={startTime} onChange={(e) => setStartTime(e.target.value)}>{timeOptions}</select>
              </div>

              {/* End time */}
              <div className="ce-row">
                <label className="ce-label">End</label>
                <select className="ce-select" value={endTime} onChange={(e) => setEndTime(e.target.value)}>{timeOptions}</select>
              </div>

              {/* Dance floor */}
              <div className="ce-row">
                <label className="ce-label">Dance floor</label>
                <select className="ce-select" value={danceFloor} onChange={(e) => setDanceFloor(e.target.value)}>
                  <option value="">Choose a dancefloor</option>
                  {loadDanceFloors().map(f => (
                    <option key={f.id} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="ce-row">
                <label className="ce-label">Amount in SEK</label>
                <input type="number" className="ce-input" placeholder="" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>

              {/* Notes */}
              <div className="ce-row ce-row--top">
                <label className="ce-label">Notes about the event</label>
                <textarea className="ce-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

            </div>
          )}

          {currentStep === 2 && (
            <div className="invite-layout">
              {/* LEFT PANEL */}
              <div className="invite-panel-left">
                {/* Top bar */}
                <div className="invite-top-bar">
                  <span className="invite-events-label">EVENTS:</span>
                  <div className="invite-date-chips">
                    {(frequency === 'multiple' && selectedDates.length > 0 ? selectedDates : [eventDate]).slice(0, 3).map(d => {
                      const [y, m, day] = d.split('-').map(Number);
                      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                      return <span key={d} className="invite-date-chip">{`${day} ${months[m-1]} ${y}`}</span>;
                    })}
                    {frequency === 'multiple' && selectedDates.length > 3 && (
                      <span className="invite-date-chip">+{selectedDates.length - 3} more</span>
                    )}
                  </div>
                  <div className="invite-top-actions">
                    <button className="invite-btn-secondary">
                      <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                      Check availability
                    </button>
                    <button
                      className={`invite-btn-mode ${inviteMethod === 'booking' ? 'invite-btn-mode--orange' : 'invite-btn-mode--blue'}`}
                      onClick={() => setInviteMethod(m => m === 'interest' ? 'booking' : 'interest')}
                    >
                      {inviteMethod === 'booking' ? '⚡ Send offer' : 'Interest check'}
                    </button>
                  </div>
                </div>

                {/* Info banner */}
                <div className={`invite-banner ${inviteMethod === 'booking' ? 'invite-banner--orange' : 'invite-banner--blue'}`}>
                  <strong>{inviteMethod === 'booking' ? 'Send offer:' : 'Interest check:'}</strong>
                  {inviteMethod === 'booking'
                    ? ' Binding booking offer. First artist to accept gets the gig. Send to many — first-come, first-booked.'
                    : ' Non-binding check to see if artists are available before committing.'}
                </div>

                {/* Source tabs */}
                <div className="invite-source-tabs">
                  <button className={`invite-source-tab ${activeSource === 'my' ? 'active' : ''}`} onClick={() => setActiveSource('my')}>My artists</button>
                  <button className={`invite-source-tab ${activeSource === 'marketplace' ? 'active' : ''}`} onClick={() => setActiveSource('marketplace')}>🛒 Marketplace</button>
                </div>

                {/* Filters */}
                <div className="invite-filters-row">
                  {activeSource === 'marketplace' && (
                    <>
                      <select className="invite-filter-select" value={inviteTypeFilter} onChange={e => setInviteTypeFilter(e.target.value)}>
                        <option value="">Type of artist</option>
                        <option value="DJ">DJ</option>
                        <option value="Live">Live artist</option>
                      </select>
                      <select className="invite-filter-select" value={inviteLocFilter} onChange={e => setInviteLocFilter(e.target.value)}>
                        <option value="">Location</option>
                        <option value="Stockholm">Stockholm</option>
                        <option value="Göteborg">Göteborg</option>
                      </select>
                    </>
                  )}
                  <span className="invite-artist-count">{inviteDisplayArtists.length} artists</span>
                  <input
                    className="invite-search"
                    placeholder="Search..."
                    value={inviteSearch}
                    onChange={e => setInviteSearch(e.target.value)}
                  />
                </div>

                {/* My artists — checkbox list */}
                {activeSource === 'my' && (
                  <div className="invite-my-list">
                    {inviteDisplayArtists.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF', fontSize: 13 }}>No artists in your pool yet.</div>
                    ) : inviteDisplayArtists.map(artist => {
                      const isSelected = selectedArtists.includes(artist.id);
                      return (
                        <label key={artist.id} className={`artist-item${isSelected ? ' artist-item--checked' : ''}`}>
                          <input type="checkbox" checked={isSelected} onChange={() => handleInviteCardClick(artist)} />
                          <div className="artist-avatar-small" style={artist.image ? { backgroundImage: `url(${artist.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
                            {!artist.image && artist.name.charAt(0)}
                          </div>
                          <div className="artist-info-small">
                            <div className="artist-name-small">{artist.name}</div>
                            <div className="artist-genres-small">{artist.type}{artist.location ? ` · ${artist.location}` : ''}</div>
                            {artist.genres.length > 0 && <div className="artist-genres-small">{artist.genres.join(', ')}</div>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Marketplace — photo cards grid */}
                {activeSource === 'marketplace' && (
                  <div className="invite-cards-grid">
                    {inviteDisplayArtists.length === 0 ? (
                      <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px', color: '#9CA3AF', fontSize: 13 }}>No artists found.</div>
                    ) : inviteDisplayArtists.map(artist => {
                      const isSelected = selectedArtists.includes(artist.id);
                      return (
                        <div
                          key={artist.id}
                          className={`marketplace-card${isSelected ? ' invite-card--selected' : ''}`}
                          onClick={() => handleInviteCardClick(artist)}
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
                          </div>
                          {isSelected && <div className="invite-card-check">✓</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RIGHT PANEL */}
              <div className="invite-panel-right">
                <div className="invite-preview-area">
                  {previewArtist ? (
                    <div className="invite-preview">
                      <div className="invite-preview-img">
                        {previewArtist.image
                          ? <img src={previewArtist.image} alt={previewArtist.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : <span>{getInitials(previewArtist.name)}</span>
                        }
                      </div>
                      <div className="invite-preview-name">{previewArtist.name}</div>
                      <div className="invite-preview-meta">{previewArtist.type}{previewArtist.location ? ` · ${previewArtist.location}` : ''}</div>
                      {previewArtist.genres.length > 0 && <div className="invite-preview-genres">{previewArtist.genres.join(', ')}</div>}
                    </div>
                  ) : (
                    <div className="invite-preview-placeholder">Select an artist to preview their profile</div>
                  )}
                </div>

                <div className="invite-selected-section">
                  <div className="invite-selected-label">SELECTED</div>
                  {selectedArtists.length === 0 ? (
                    <div className="invite-selected-empty">None yet — click artists to select</div>
                  ) : (
                    <div className="invite-selected-list">
                      {selectedArtists.map(id => {
                        const a = allInviteArtists.find(x => x.id === id);
                        return a ? (
                          <div key={id} className="invite-selected-row">
                            <span className="invite-selected-name">{a.name}</span>
                            <button className="invite-selected-remove" onClick={() => toggleArtist(id)}>×</button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-content step-upload">
              <div className="upload-area" onClick={() => document.getElementById('file-upload')?.click()}>
                <div className="upload-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 15v3H6v-3H4v3c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-3h-2zm-1-4l-1.41-1.41L13 12.17V4h-2v8.17L8.41 9.59 7 11l5 5 5-5z"/>
                  </svg>
                </div>
                <p className="upload-text">Click to upload documents</p>
                <p className="upload-hint">PDF, DOCX up to 10MB</p>
                <input id="file-upload" type="file" accept=".pdf,.docx" onChange={handleFileUpload} style={{ display: 'none' }} />
              </div>
              {uploadedFile && (
                <div className="uploaded-file">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>
                  <span>{uploadedFile.name}</span>
                  <button onClick={() => setUploadedFile(null)}>×</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="wizard-footer">
          {currentStep > 1 && <button className="btn-back" onClick={handleBack}>Back</button>}
          <div className="footer-spacer"></div>
          {currentStep < 3 ? (
            <button className="btn-next" onClick={handleNext}>Next step</button>
          ) : (
            <button className="btn-create" onClick={handleCreate}>Create Event</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateEventWizard;
