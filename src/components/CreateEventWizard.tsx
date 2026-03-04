import React, { useState, useRef } from 'react';
import { Event, Artist } from '../types';
import { getDJPhoto } from '../utils/djPhoto';
import DateRangePicker from './DateRangePicker';
import { getDJStraussListing, MarketplaceArtist } from './MarketplaceView';
import './CreateEventWizard.css';

interface CreateEventWizardProps {
  onClose: () => void;
  onCreate: (events: Event[], selectedArtists?: string[], pdfFile?: File) => void;
  initialDate: Date;
  initialTime?: string;
  artists: Artist[];
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
  artists
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
  const [venue] = useState('Sturehof');
  const [danceFloor, setDanceFloor] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Step 2: Invite Artists
  const [inviteMethod, setInviteMethod] = useState<'interest' | 'booking'>('interest');
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMarketplacePicker, setShowMarketplacePicker] = useState(false);
  const [marketplaceSearch, setMarketplaceSearch] = useState('');
  const [marketplaceSelected, setMarketplaceSelected] = useState<MarketplaceArtist[]>([]);
  const [marketplaceAdded, setMarketplaceAdded] = useState<Artist[]>([]);

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
      ? selectedArtists.map(id => ({ artistId: id, artistName: artists.find(a => a.id === id)?.name || id }))
      : undefined;
    const bookingRequests = inviteMethod === 'booking' && selectedArtists.length > 0
      ? selectedArtists.map(id => ({ artistId: id, artistName: artists.find(a => a.id === id)?.name || id }))
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

  const filteredArtists = allInviteArtists.filter(artist =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artist.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
      <div className="wizard-modal" onClick={(e) => e.stopPropagation()}>
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
            <div className="step-content">
              <div className="invite-method-tabs">
                <button className={`invite-tab ${inviteMethod === 'interest' ? 'active' : ''}`} onClick={() => setInviteMethod('interest')}>Interest check</button>
                <button className={`invite-tab ${inviteMethod === 'booking' ? 'active' : ''}`} onClick={() => setInviteMethod('booking')}>Booking request</button>
              </div>

              <div className="ce-search-row">
                <div className="search-box" style={{ flex: 1 }}>
                  <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                  <input type="text" className="search-input" placeholder="Search artist in marketplace" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <button className="btn-find-marketplace" onClick={() => setShowMarketplacePicker(true)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Find from marketplace
                </button>
              </div>

              <div className="artists-list">
                {filteredArtists.map(artist => {
                  const photo = artist.id === 'dj_strauss' ? getDJPhoto() : '';
                  return (
                    <label key={artist.id} className="artist-item">
                      <input type="checkbox" checked={selectedArtists.includes(artist.id)} onChange={() => toggleArtist(artist.id)} />
                      <div className="artist-avatar-small" style={photo ? { backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : undefined}>
                        {!photo && artist.name.charAt(0)}
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
            </div>
          )}

          {showMarketplacePicker && (() => {
            const allMarketplace: MarketplaceArtist[] = [];
            const filtered = allMarketplace.filter(a =>
              !marketplaceSearch || a.name.toLowerCase().includes(marketplaceSearch.toLowerCase())
            );
            const isSelected = (id: string) => marketplaceSelected.some(a => a.id === id);
            const toggle = (artist: MarketplaceArtist) => {
              setMarketplaceSelected(prev =>
                prev.some(a => a.id === artist.id) ? prev.filter(a => a.id !== artist.id) : [...prev, artist]
              );
            };
            return (
              <div className="mp-picker-overlay" onClick={() => setShowMarketplacePicker(false)}>
                <div className="mp-picker-modal" onClick={e => e.stopPropagation()}>
                  <div className="mp-picker-header">
                    <h3 className="mp-picker-title">Marketplace</h3>
                    <button className="modal-close" onClick={() => setShowMarketplacePicker(false)}>×</button>
                  </div>
                  <div className="mp-picker-search">
                    <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <input autoFocus className="search-input" placeholder="Search artists…" value={marketplaceSearch} onChange={e => setMarketplaceSearch(e.target.value)} />
                  </div>
                  <div className="mp-picker-list">
                    {filtered.map(artist => {
                      const photo = artist.id === 'dj_strauss' ? getDJPhoto() : '';
                      const selected = isSelected(artist.id);
                      return (
                        <div key={artist.id} className={`mp-picker-row ${selected ? 'mp-picker-row--selected' : ''}`} onClick={() => toggle(artist)}>
                          <div className="artist-avatar-small" style={photo ? { backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : undefined}>
                            {!photo && artist.name.charAt(0)}
                          </div>
                          <div className="artist-info-small">
                            <div className="artist-name-small">{artist.name}</div>
                            <div className="artist-genres-small">{artist.type}{artist.location ? ` · ${artist.location}` : ''}</div>
                            {artist.genres && artist.genres.length > 0 && <div className="artist-genres-small">{artist.genres.join(', ')}</div>}
                          </div>
                          <div className="mp-picker-check">
                            {selected && <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mp-picker-footer">
                    <button className="btn-back" onClick={() => setShowMarketplacePicker(false)}>Cancel</button>
                    <button
                      className="btn-next"
                      disabled={marketplaceSelected.length === 0}
                      onClick={() => {
                        const newArtists: Artist[] = marketplaceSelected.map(a => ({
                          id: a.id, name: a.name, type: a.type, location: a.location,
                          genres: a.genres || [], about: '', priceRange: a.priceRange,
                        }));
                        setMarketplaceAdded(prev => {
                          const ids = new Set(prev.map(a => a.id));
                          return [...prev, ...newArtists.filter(a => !ids.has(a.id))];
                        });
                        setSelectedArtists(prev => {
                          const ids = new Set(prev);
                          marketplaceSelected.forEach(a => ids.add(a.id));
                          return Array.from(ids);
                        });
                        setShowMarketplacePicker(false);
                        setMarketplaceSelected([]);
                        setMarketplaceSearch('');
                      }}
                    >
                      Add {marketplaceSelected.length > 0 ? marketplaceSelected.length : ''} artist{marketplaceSelected.length !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

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
