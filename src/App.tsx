import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import supabase from './supabase';
import { Calendar, Building2, MessageCircle, List, CalendarDays, Clock, X } from 'lucide-react';
import DJProfile from './DJProfile';
import Navigation from './components/Navigation';
import CalendarView from './components/CalendarView';
import WeekView from './components/WeekView';
import ArtistsView from './components/ArtistsView';
import RequestsView from './components/RequestsView';
import HistoryView from './components/HistoryView';
import MarketplaceView from './components/MarketplaceView';
import MessagesView, { ensureChat, getUnreadCount, markAllRead } from './components/MessagesView';
import DJVenuesView from './components/DJVenuesView';
import { loadConnections } from './components/MarketplaceView';
import CreateEventWizard from './components/CreateEventWizard';
import EventDetailsModal from './components/EventDetailsModal';
import ArtistProfileModal from './components/ArtistProfileModal';
import BookArtistModal from './components/BookArtistModal';
import VenueProfile from './components/VenueProfile';
import DJOnboarding from './components/DJOnboarding';
import { Event, Artist } from './types';
import { getDJPhoto } from './utils/djPhoto';
import { loadVenueName } from './utils/venueProfile';
import { setCurrentSession } from './currentUser';
import {
  loadUserDataToLocalStorage, clearUserLocalStorage,
  upsertEvents, deleteEventDB, fetchAllDJProfiles, updateEventStatusDB, fetchAllVenueProfiles, venueProfileFromDB,
} from './services/db';
import './App.css';


let nextId = 100;

// ── Venue App ────────────────────────────────────────────────────────────────

function VenueApp({ onLogout, userId }: { onLogout: () => void; userId: string }) {
  const [activeTab, setActiveTab] = useState<string>('events');
  const [venueName, setVenueName] = useState(loadVenueName);
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'jocky_venue_profile') setVenueName(loadVenueName());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  const [showVenueProfile, setShowVenueProfile] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBookArtistModal, setShowBookArtistModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedEventDate, setSelectedEventDate] = useState<Date | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');
  const [selectedDateTime, setSelectedDateTime] = useState<{date: Date, time?: string} | null>(null);
  const [events, setEvents] = useState<Event[]>(() => {
    try {
      const saved = localStorage.getItem('jocky_events');
      if (saved) {
        const parsed = JSON.parse(saved).map((e: any) => ({ ...e, date: new Date(e.date) }));
        // Find max existing numeric ID so nextId never collides
        const maxId = parsed.reduce((max: number, e: Event) => {
          const n = parseInt(e.id, 10);
          return isNaN(n) ? max : Math.max(max, n);
        }, nextId);
        nextId = maxId + 1;
        // Deduplicate: reassign IDs to any events sharing the same ID
        const seenIds = new Set<string>();
        const deduped = parsed.map((e: Event) => {
          if (seenIds.has(e.id)) {
            const newId = String(nextId++);
            return { ...e, id: newId };
          }
          seenIds.add(e.id);
          return e;
        });
        // Persist fixed data back to localStorage
        localStorage.setItem('jocky_events', JSON.stringify(deduped));
        return deduped;
      }
    } catch {}
    return [];
  });

  // Connected artists from the pool (accepted connections)
  const [poolArtists, setPoolArtists] = useState<Artist[]>(() =>
    loadConnections()
      .filter(c => c.venueId === userId && (c.status === 'accepted' || c.status === 'pending'))
      .map(c => ({
        id: c.artistId,
        name: c.artistName,
        type: c.artistType,
        location: c.artistLocation,
        genres: c.artistGenres,
        about: '',
        image: c.artistPhoto || '',
        status: c.status as 'accepted' | 'pending',
      }))
  );

  const [allDJProfilesCache, setAllDJProfilesCache] = useState<any[]>([]);

  const loadAndEnrichPoolArtists = useCallback(async () => {
    const fromConnections = loadConnections()
      .filter(c => c.venueId === userId && (c.status === 'accepted' || c.status === 'pending'))
      .map(c => ({
        id: c.artistId,
        name: c.artistName,
        type: c.artistType,
        location: c.artistLocation,
        genres: c.artistGenres,
        about: '',
        image: c.artistPhoto || '',
        status: c.status as 'accepted' | 'pending',
      }));
    const profiles = await fetchAllDJProfiles();
    setAllDJProfilesCache(profiles);
    setPoolArtists(fromConnections.map(artist => {
      const profile = profiles.find((p: any) => p.id === artist.id);
      return profile?.photo ? { ...artist, image: profile.photo } : artist;
    }));
  }, [userId]);

  useEffect(() => {
    loadAndEnrichPoolArtists();
    const handler = (e: StorageEvent) => {
      if (e.key === 'jocky_artist_connections') {
        loadAndEnrichPoolArtists();
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [userId, loadAndEnrichPoolArtists]); // eslint-disable-line react-hooks/exhaustive-deps

  const [unreadMessages, setUnreadMessages] = useState(() => getUnreadCount('venue'));

  useEffect(() => {
    const update = () => setUnreadMessages(getUnreadCount('venue'));
    update();
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);

  // Re-sync events when DJ side updates localStorage (e.g. accept/decline)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'jocky_events') {
        try {
          const parsed = JSON.parse(e.newValue || '[]');
          setEvents(parsed.map((ev: any) => ({ ...ev, date: new Date(ev.date) })));
        } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const refreshPoolArtists = () => { loadAndEnrichPoolArtists(); };


  const saveEvents = (updated: Event[]) => {
    setEvents(updated);
    localStorage.setItem('jocky_events', JSON.stringify(updated));
    upsertEvents(updated, userId);
  };

  const handleEventDateChange = (eventId: string, newDate: Date) => {
    saveEvents(events.map(e => e.id === eventId ? { ...e, date: newDate } : e));
  };

  const handleCreateEvent = (newEvents: Event[]) => {
    const stamped = newEvents.map(e => ({
      ...e,
      id: String(nextId++),
      status: e.status || 'created' as Event['status'],
    }));
    saveEvents([...events, ...stamped]);
    setShowCreateModal(false);
    setSelectedDateTime(null);
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'messages') {
      markAllRead('venue');
      setUnreadMessages(0);
    }
    setActiveTab(tab);
  };

  return (
    <div className="app">
      <Navigation activeTab={activeTab} onTabChange={(tab) => { setShowVenueProfile(false); handleTabChange(tab); }} onLogout={onLogout} onViewProfile={() => setShowVenueProfile(true)} unreadMessages={unreadMessages} venueName={venueName} />
      {showVenueProfile && <VenueProfile onClose={() => setShowVenueProfile(false)} />}
      {!showVenueProfile && activeTab === 'events' && (
        <>
          {viewMode === 'month' ? (
            <CalendarView currentDate={currentDate} onDateChange={setCurrentDate} events={events} onCreateEvent={(date, time) => { setSelectedDateTime({ date, time }); setShowCreateModal(true); }} onEventClick={(ev, date) => { setSelectedEvent(ev); setSelectedEventDate(date || null); }} onEventDateChange={handleEventDateChange} viewMode={viewMode} onViewModeChange={setViewMode} onOpenBookArtist={() => setShowBookArtistModal(true)} artists={poolArtists} />
          ) : (
            <WeekView currentDate={currentDate} onDateChange={setCurrentDate} events={events} onCreateEvent={(date, time) => { setSelectedDateTime({ date, time }); setShowCreateModal(true); }} onEventClick={(ev, date) => { setSelectedEvent(ev); setSelectedEventDate(date || null); }} viewMode={viewMode} onViewModeChange={setViewMode} artists={poolArtists} />
          )}
        </>
      )}
      {!showVenueProfile && activeTab === 'artists' && (
        <ArtistsView artists={poolArtists} onMessage={(artistId, artistName, venueName) => {
          ensureChat(artistId, artistName, venueName, userId);
          markAllRead('venue');
          setUnreadMessages(0);
          setActiveTab('messages');
        }} />
      )}
      {!showVenueProfile && activeTab === 'requests' && <RequestsView />}
      {!showVenueProfile && activeTab === 'history' && <HistoryView />}
      {!showVenueProfile && activeTab === 'marketplace' && <MarketplaceView onConnectionChange={refreshPoolArtists} />}
      {!showVenueProfile && activeTab === 'messages' && <MessagesView perspective="venue" userId={userId} />}
      {showCreateModal && <CreateEventWizard onClose={() => { setShowCreateModal(false); setSelectedDateTime(null); }} onCreate={handleCreateEvent} initialDate={selectedDateTime?.date || currentDate} initialTime={selectedDateTime?.time} artists={poolArtists} />}
      {selectedEvent && (
        <EventDetailsModal event={selectedEvent} clickedDate={selectedEventDate || undefined} onClose={() => { setSelectedEvent(null); setSelectedEventDate(null); }}
          onUpdate={(updatedEvent?: Event) => { if (updatedEvent) { saveEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e)); setSelectedEvent(updatedEvent); } }}
          onDelete={() => { deleteEventDB(selectedEvent.id); saveEvents(events.filter(e => e.id !== selectedEvent.id)); setSelectedEvent(null); setSelectedEventDate(null); }}
          onMessageArtist={() => { setSelectedEvent(null); setSelectedEventDate(null); setActiveTab('requests'); }}
          artists={poolArtists}
          djProfiles={allDJProfilesCache}
          onArtistClick={(artistId) => {
            const raw = allDJProfilesCache.find((p: any) => p.id === artistId);
            if (raw) {
              setSelectedArtist({ id: artistId, name: raw.name || '', type: raw.category || 'DJ', location: raw.location || '', genres: raw.genres || [], about: raw.bio || '', image: raw.photo || '', priceRange: raw.price || '' });
            } else {
              const pool = poolArtists.find(a => a.id === artistId);
              if (pool) setSelectedArtist(pool);
            }
          }} />
      )}
      {selectedArtist && <ArtistProfileModal artist={selectedArtist} onClose={() => setSelectedArtist(null)} onBookNow={() => { setSelectedArtist(null); setShowCreateModal(true); }} onMessage={() => { setSelectedArtist(null); setActiveTab('messages'); }} />}
      {showBookArtistModal && <BookArtistModal onClose={() => setShowBookArtistModal(false)} onBook={(selectedArtistIds, selectedEventIds, mode) => {
        if (selectedArtistIds.length > 0 && selectedEventIds.length > 0) {
          const resolveName = (id: string) => poolArtists.find(a => a.id === id)?.name || id;
          if (mode === 'interest') {
            const newChecks = selectedArtistIds.map(id => ({ artistId: id, artistName: resolveName(id) }));
            const updated = events.map(e =>
              selectedEventIds.includes(e.id)
                ? { ...e, status: 'open' as Event['status'], interestChecks: [...(e.interestChecks || []), ...newChecks] }
                : e
            );
            saveEvents(updated);
          } else {
            const newRequests = selectedArtistIds.map(id => ({ artistId: id, artistName: resolveName(id) }));
            const updated = events.map(e =>
              selectedEventIds.includes(e.id)
                ? { ...e, status: 'offered' as Event['status'], bookingRequests: [...(e.bookingRequests || []), ...newRequests] }
                : e
            );
            saveEvents(updated);
          }
        }
        setShowBookArtistModal(false);
      }} artists={poolArtists.filter(a => a.status === 'accepted')} events={events} />}
    </div>
  );
}

// ── DJ App ───────────────────────────────────────────────────────────────────

type GigStatus = 'interest_check_unavailable' | 'interest_check_interested' | 'new_gig' | 'offer_pending' | 'confirmed';

type Request = {
  id: string;
  venueName: string;
  eventName: string;
  danceFloor?: string;
  notes?: string;
  date: string;
  selectedDates?: string[];
  startTime: string;
  endTime: string;
  amount: number;
  gigStatus: GigStatus;
};

function toDateStr(d: any): string {
  if (typeof d === 'string') return d.split('T')[0];
  return new Date(d).toISOString().split('T')[0];
}

function loadRequestsFromStorage(djId?: string): Request[] {
  try {
    const saved = localStorage.getItem('jocky_events');
    if (saved) {
      const events = JSON.parse(saved);
      return events
        .filter((e: any) => {
          if (e.status !== 'offered' && e.status !== 'open') return false;
          if (djId) {
            // If we have a real DJ ID, only show events where this DJ is involved
            if (e.status === 'open') {
              const ic = (e.interestChecks || []).find((c: any) => c.artistId === djId);
              if (!ic) return false;
              if (ic.djResponse === 'declined') return false;
            }
            if (e.status === 'offered') {
              const br = (e.bookingRequests || []).find((c: any) => c.artistId === djId);
              if (!br) return false;
            }
          }
          return true;
        })
        .map((e: any) => {
          const djCheck = e.status === 'open'
            ? (e.interestChecks || []).find((ic: any) => ic.artistId === (djId || 'dj_strauss'))
            : null;
          return {
            id: e.id,
            venueName: e.venue || 'Unknown Venue',
            eventName: e.name || 'Untitled Event',
            danceFloor: e.danceFloor,
            notes: e.notes,
            date: toDateStr(e.date),
            selectedDates: e.selectedDates,
            startTime: e.startTime,
            endTime: e.endTime,
            amount: e.amount,
            gigStatus: (djCheck?.djResponse === 'interested' ? 'offer_pending' : e.status === 'open' ? 'interest_check_interested' : 'new_gig') as GigStatus,
          };
        });
    }
  } catch {}
  return [];
}

function loadUpcomingFromStorage(djId?: string): Request[] {
  try {
    const saved = localStorage.getItem('jocky_events');
    if (saved) {
      const events = JSON.parse(saved);
      return events
        .filter((e: any) => {
          if (e.status !== 'confirmed') return false;
          if (djId && e.artist_id && e.artist_id !== djId) return false;
          return true;
        })
        .map((e: any) => ({
          id: e.id,
          venueName: e.venue || 'Unknown Venue',
          eventName: e.name || 'Untitled Event',
          danceFloor: e.danceFloor,
          notes: e.notes,
          date: toDateStr(e.date),
          selectedDates: e.selectedDates,
          startTime: e.startTime,
          endTime: e.endTime,
          amount: e.amount,
          gigStatus: 'confirmed' as GigStatus,
        }));
    }
  } catch {}
  return [];
}

function updateEventStatusInStorage(id: string, status: string, venueId?: string) {
  try {
    const saved = localStorage.getItem('jocky_events');
    if (saved) {
      const events = JSON.parse(saved);
      const updated = events.map((e: any) => e.id === id ? { ...e, status } : e);
      localStorage.setItem('jocky_events', JSON.stringify(updated));
      if (venueId) {
        // Sync updated event to Supabase
        const evt = updated.find((e: any) => e.id === id);
        if (evt) upsertEvents([evt], venueId);
      }
    }
  } catch {}
}


function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
}
function fmtTime(s: string, e: string) {
  return `${s.replace(':', '.')}-${e.replace(':', '.')}`;
}

// ── Request Details Modal ─────────────────────────────────────────────────────

function RequestDetailsModal({ req, onClose }: { req: Request; onClose: () => void }) {
  return (
    <div className="rd-overlay" onClick={onClose}>
      <div className="rd-modal" onClick={e => e.stopPropagation()}>
        <div className="rd-header">
          <div>
            <div className="rd-title">{req.eventName}</div>
            <div className="rd-venue">{req.venueName}{req.danceFloor ? ` · ${req.danceFloor}` : ''}</div>
          </div>
          <button className="rd-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="rd-body">
          <div className="rd-row rd-row--dates">
            <span className="rd-label">{req.selectedDates && req.selectedDates.length > 1 ? 'Dates' : 'Date'}</span>
            {req.selectedDates && req.selectedDates.length > 1 ? (
              <span className="rd-value rd-dates-list">
                {req.selectedDates.map(d => {
                  const [y, m, day] = d.split('-').map(Number);
                  return new Date(y, m - 1, day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                }).map((s, i) => <span key={i} className="rd-date-chip">{s}</span>)}
              </span>
            ) : (
              <span className="rd-value">{fmtDate(req.date)}</span>
            )}
          </div>
          <div className="rd-row">
            <span className="rd-label">Time</span>
            <span className="rd-value">{fmtTime(req.startTime, req.endTime)}</span>
          </div>
          <div className="rd-row">
            <span className="rd-label">Amount</span>
            <span className="rd-value">{req.amount.toLocaleString()} SEK</span>
          </div>
          <div className="rd-row">
            <span className="rd-label">Type</span>
            <span className="rd-value">
              {req.gigStatus === 'new_gig' || req.gigStatus === 'confirmed'
                ? 'Booking request'
                : req.gigStatus === 'interest_check_interested' || req.gigStatus === 'interest_check_unavailable'
                ? 'Interest check'
                : 'Offer pending'}
            </span>
          </div>
          {req.danceFloor && (
            <div className="rd-row">
              <span className="rd-label">Floor</span>
              <span className="rd-value">{req.danceFloor}</span>
            </div>
          )}
          {req.notes && (
            <div className="rd-row rd-row--notes">
              <span className="rd-label">Notes</span>
              <span className="rd-value">{req.notes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Login Page ────────────────────────────────────────────────────────────────

function LoginPage() {
  const [role, setRole] = useState<'dj' | 'venue' | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { role } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="login-page">
        <div className="login-box">
          <div className="login-logo">JOCKY</div>
          <p className="login-sub">The platform connecting venues and artists</p>
          <div className="login-options">
            <button className="login-btn" onClick={() => setRole('venue')}>
              <span>🏛</span>
              <div>
                <div className="login-btn-title">I'm a Venue</div>
                <div className="login-btn-desc">Book artists for your events</div>
              </div>
            </button>
            <button className="login-btn" onClick={() => setRole('dj')}>
              <span>🎧</span>
              <div>
                <div className="login-btn-title">I'm an Artist</div>
                <div className="login-btn-desc">Find gigs and manage bookings</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">JOCKY</div>
        <p className="login-sub">{role === 'venue' ? 'Venue login' : 'Artist login'}</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            className="login-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <div className="login-error">{error}</div>}
          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>
        <button className="login-toggle" onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); }}>
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
        <button className="login-back" onClick={() => { setRole(null); setError(''); }}>← Back</button>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [userType, setUserType] = useState<'dj' | 'venue' | null>(null);
  const [activeTab, setActiveTab] = useState<'events' | 'venues' | 'messages'>('events');
  const [eventTab, setEventTab] = useState<'requests' | 'upcoming'>('requests');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [requests, setRequests] = useState<Request[]>([]);
  const [upcoming, setUpcoming] = useState<Request[]>([]);
  const [djUnread, setDjUnread] = useState(0);
  const [pendingVenueRequests, setPendingVenueRequests] = useState(0);
  const [venueProfiles, setVenueProfiles] = useState<any[]>([]);

  useEffect(() => {
    fetchAllVenueProfiles().then(profiles => {
      setVenueProfiles(profiles.map(venueProfileFromDB).map((p: any, i: number) => ({ ...p, id: profiles[i].id })));
    });
  }, []);

  useEffect(() => {
    const update = () => setDjUnread(getUnreadCount('dj'));
    update();
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);

  useEffect(() => {
    const update = () => {
      if (session) {
        setPendingVenueRequests(
          loadConnections().filter(c => c.artistId === session.user.id && c.status === 'pending').length
        );
      }
    };
    update();
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, [session]);

  // Close user menu when clicking outside
  useEffect(() => {
    if (!showUserMenu) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showUserMenu]);

  // Pick up new requests created by the venue side (cross-tab)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'jocky_events' && session) {
        const uid = session.user.id;
        setRequests(loadRequestsFromStorage(uid));
        setUpcoming(loadUpcomingFromStorage(uid));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [session]);

  // Supabase auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      const role = s?.user?.user_metadata?.role ?? null;
      setSession(s);
      setUserType(role);
      if (s && role) {
        setCurrentSession({ userId: s.user.id, role });
        loadUserDataToLocalStorage(s.user.id, role).then(() => {
          if (role === 'dj') {
            setRequests(loadRequestsFromStorage(s.user.id));
            setUpcoming(loadUpcomingFromStorage(s.user.id));
            setDjUnread(getUnreadCount('dj'));
            setPendingVenueRequests(
              loadConnections().filter(c => c.artistId === s.user.id && c.status === 'pending').length
            );
          }
        });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const role = session?.user?.user_metadata?.role ?? null;
      if (session && role) {
        setCurrentSession({ userId: session.user.id, role });
        loadUserDataToLocalStorage(session.user.id, role).then(() => {
          if (role === 'dj') {
            setRequests(loadRequestsFromStorage(session.user.id));
            setUpcoming(loadUpcomingFromStorage(session.user.id));
            setDjUnread(getUnreadCount('dj'));
            setPendingVenueRequests(
              loadConnections().filter(c => c.artistId === session.user.id && c.status === 'pending').length
            );
          }
        });
      } else {
        setCurrentSession(null);
        clearUserLocalStorage();
      }
      setSession(session);
      setUserType(role);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Re-load requests and unread counts when DJ logs in
  useEffect(() => {
    if (session && userType === 'dj') {
      const uid = session.user.id;
      setRequests(loadRequestsFromStorage(uid));
      setUpcoming(loadUpcomingFromStorage(uid));
      setDjUnread(getUnreadCount('dj'));
      setPendingVenueRequests(
        loadConnections().filter(c => c.artistId === uid && c.status === 'pending').length
      );
    }
  }, [session, userType]);

  if (session === undefined) return <div className="login-page"><div style={{ color: 'white', margin: 'auto' }}>Loading…</div></div>;
  if (!session) return <LoginPage />;

  const djUserId = session.user.id;

  const handleAccept = (id: string) => {
    const req = requests.find(r => r.id === id);
    if (req) {
      const confirmed = { ...req, gigStatus: 'confirmed' as GigStatus };
      setUpcoming(prev => [...prev, confirmed]);
      setRequests(prev => prev.filter(r => r.id !== id));
      updateEventStatusInStorage(id, 'confirmed');
      // Sync to Supabase so venue sees confirmed status on next login
      const djName = (() => { try { return JSON.parse(localStorage.getItem('jocky_dj_profile') || '{}').name || ''; } catch { return ''; } })();
      updateEventStatusDB(id, { status: 'confirmed', artist_id: djUserId, artist_name: djName });
    }
  };

  const handleDecline = (id: string) => {
    const req = requests.find(r => r.id === id);
    if (req?.gigStatus === 'interest_check_interested') {
      try {
        const saved = localStorage.getItem('jocky_events');
        if (saved) {
          const evs = JSON.parse(saved);
          const updated = evs.map((e: any) => e.id === id ? {
            ...e,
            interestChecks: (e.interestChecks || []).map((ic: any) =>
              ic.artistId === djUserId ? { ...ic, djResponse: 'declined' } : ic
            ),
          } : e);
          localStorage.setItem('jocky_events', JSON.stringify(updated));
          const updatedEvent = updated.find((e: any) => e.id === id);
          if (updatedEvent) updateEventStatusDB(id, { interest_checks: updatedEvent.interestChecks });
        }
      } catch {}
    } else {
      updateEventStatusInStorage(id, 'declined');
      updateEventStatusDB(id, { status: 'declined' });
    }
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleInterestYes = (id: string) => {
    try {
      const saved = localStorage.getItem('jocky_events');
      if (saved) {
        const evs = JSON.parse(saved);
        const updated = evs.map((e: any) => e.id === id ? {
          ...e,
          interestChecks: (e.interestChecks || []).map((ic: any) =>
            ic.artistId === djUserId ? { ...ic, djResponse: 'interested' } : ic
          ),
        } : e);
        localStorage.setItem('jocky_events', JSON.stringify(updated));
        const updatedEvent = updated.find((e: any) => e.id === id);
        if (updatedEvent) updateEventStatusDB(id, { interest_checks: updatedEvent.interestChecks });
      }
    } catch {}
    setRequests(prev => prev.map(r => r.id === id ? { ...r, gigStatus: 'offer_pending' as GigStatus } : r));
  };

  const handleLogout = () => { setShowUserMenu(false); setActiveTab('events'); supabase.auth.signOut(); };

  if (userType === 'venue') return <VenueApp onLogout={handleLogout} userId={session.user.id} />;

  if (!session.user.user_metadata?.onboarded) return <DJOnboarding onComplete={() => {}} />;

  return (
    <div className="dj-app">
      <nav className="dj-nav">
        <div className="dj-logo" style={{cursor:'pointer'}} onClick={() => { setShowProfile(false); setActiveTab('events'); }}>JOCKY</div>
        <div className="dj-nav-tabs">
          <button className={`dj-nav-tab ${!showProfile && activeTab === 'events' ? 'active' : ''}`} onClick={() => { setShowProfile(false); setActiveTab('events'); }}>
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <Calendar size={16} />
              {requests.filter(r => r.gigStatus === 'interest_check_interested' || r.gigStatus === 'new_gig').length > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -6, background: '#ef4444', color: 'white', fontSize: 9, fontWeight: 700, minWidth: 13, height: 13, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2px', lineHeight: 1 }}>
                  {requests.filter(r => r.gigStatus === 'interest_check_interested' || r.gigStatus === 'new_gig').length > 99 ? '99+' : requests.filter(r => r.gigStatus === 'interest_check_interested' || r.gigStatus === 'new_gig').length}
                </span>
              )}
            </span>
            {' '}Events
          </button>
          <button className={`dj-nav-tab ${!showProfile && activeTab === 'venues' ? 'active' : ''}`} onClick={() => { setShowProfile(false); setActiveTab('venues'); }}>
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <Building2 size={16} />
              {pendingVenueRequests > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -6, background: '#ef4444', color: 'white', fontSize: 9, fontWeight: 700, minWidth: 13, height: 13, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2px', lineHeight: 1 }}>
                  {pendingVenueRequests > 99 ? '99+' : pendingVenueRequests}
                </span>
              )}
            </span>
            {' '}Venues
          </button>
          <button className={`dj-nav-tab ${!showProfile && activeTab === 'messages' ? 'active' : ''}`} onClick={() => { setShowProfile(false); setActiveTab('messages'); markAllRead('dj'); setDjUnread(0); }}>
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <MessageCircle size={16} />
              {djUnread > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -8, background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700, minWidth: 16, height: 16, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', lineHeight: 1 }}>
                  {djUnread > 99 ? '99+' : djUnread}
                </span>
              )}
            </span>
            {' '}Messages
          </button>
        </div>
        <div className="dj-user-menu" ref={userMenuRef}>
          <div className="dj-user-pill" onClick={() => setShowUserMenu(p => !p)}>
            <div className="dj-user-avatar">
              {getDJPhoto()
                ? <img src={getDJPhoto()} alt="DJ" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : 'DS'
              }
            </div>
            <div className="dj-user-chevron">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 5L7 9L11 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          {showUserMenu && (
            <div className="dj-dropdown">
              <button className="dj-dropdown-item" onClick={() => { setShowUserMenu(false); setShowProfile(true); }}>View Profile</button>
              <button className="dj-dropdown-item" onClick={handleLogout}>Log Out</button>
            </div>
          )}
        </div>
      </nav>

      {!showProfile && activeTab === 'events' && (
        <div className="ec-page">
          <div className="ec-header">
            <h1 className="ec-title">Events</h1>
            <div className="ec-tabs">
              <button className={`ec-tab ${eventTab === 'requests' ? 'active' : ''}`} onClick={() => setEventTab('requests')}>Requests</button>
              <button className={`ec-tab ${eventTab === 'upcoming' ? 'active' : ''}`} onClick={() => setEventTab('upcoming')}>Upcoming</button>
            </div>
            <div className="ec-view-icons">
              <button className="dj-icon-btn"><List size={16} /></button>
              <button className="dj-icon-btn"><Calendar size={16} /></button>
            </div>
          </div>

          <div className="ec-grid">
            {eventTab === 'requests' && (requests.length === 0
              ? <p className="dj-empty">No pending requests</p>
              : requests.map(req => (
                <div key={req.id} className="ec-card">
                  <div className="ec-card-top">
                    <div className="ec-meta">
                      <span className="ec-date">
                        <CalendarDays size={13} />
                        {req.selectedDates && req.selectedDates.length > 1
                          ? `${req.selectedDates.length} dates`
                          : fmtDate(req.date)}
                      </span>
                      <span className="ec-time"><Clock size={13} />{fmtTime(req.startTime, req.endTime)}</span>
                      {req.gigStatus === 'new_gig'
                        ? <span className="ec-badge ec-badge--new">New gig</span>
                        : <span className="ec-badge ec-badge--interest">Interest check</span>}
                    </div>
                    <button className="ec-details" onClick={() => setSelectedRequest(req)}>Details →</button>
                  </div>

                  <div className="ec-venue">{req.venueName}</div>
                  <div className="ec-amount">{req.amount.toLocaleString()} SEK</div>

                  {req.gigStatus === 'interest_check_unavailable' && (
                    <>
                      <p className="ec-desc">This gig is no longer available</p>
                      <div className="ec-actions">
                        <button className="ec-btn ec-btn--outline" onClick={() => handleDecline(req.id)}>Delete</button>
                      </div>
                    </>
                  )}
                  {req.gigStatus === 'offer_pending' && (
                    <p className="ec-desc">You will receive an offer if the venue decides to book you for this event</p>
                  )}
                  {req.gigStatus === 'interest_check_interested' && (
                    <>
                      <p className="ec-desc">Are you interested in this gig?</p>
                      <div className="ec-actions">
                        <button className="ec-btn ec-btn--outline" onClick={() => handleDecline(req.id)}>No</button>
                        <button className="ec-btn ec-btn--blue" onClick={() => handleInterestYes(req.id)}>Yes</button>
                      </div>
                    </>
                  )}
                  {req.gigStatus === 'new_gig' && (
                    <>
                      <p className="ec-desc">Would you like to accept this gig?</p>
                      <div className="ec-actions">
                        <button className="ec-btn ec-btn--outline" onClick={() => handleDecline(req.id)}>Cancel gig</button>
                        <button className="ec-btn ec-btn--red" onClick={() => handleAccept(req.id)}>Accept</button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}

            {eventTab === 'upcoming' && (upcoming.length === 0
              ? <p className="dj-empty">No upcoming events</p>
              : upcoming.map(req => (
                <div key={req.id} className="ec-card">
                  <div className="ec-card-top">
                    <div className="ec-meta">
                      <span className="ec-date">
                        <CalendarDays size={13} />
                        {req.selectedDates && req.selectedDates.length > 1
                          ? `${req.selectedDates.length} dates`
                          : fmtDate(req.date)}
                      </span>
                      <span className="ec-time"><Clock size={13} />{fmtTime(req.startTime, req.endTime)}</span>
                      <span className="ec-badge ec-badge--confirmed">Confirmed</span>
                    </div>
                    <button className="ec-details" onClick={() => setSelectedRequest(req)}>Details →</button>
                  </div>
                  <div className="ec-venue">{req.venueName}</div>
                  <div className="ec-amount">{req.amount.toLocaleString()} SEK</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!showProfile && activeTab === 'venues' && (
        <DJVenuesView
          userId={djUserId}
          venueProfiles={venueProfiles}
          onMessage={(artistId, artistName, venueName, venueId) => {
            ensureChat(artistId, artistName, venueName, venueId);
            setShowProfile(false);
            setActiveTab('messages');
          }}
          onConnectionChange={() => setPendingVenueRequests(
            loadConnections().filter(c => c.artistId === djUserId && c.status === 'pending').length
          )}
        />
      )}
      {!showProfile && activeTab === 'messages' && <MessagesView perspective="dj" userId={djUserId} />}
      {showProfile && <DJProfile onClose={() => setShowProfile(false)} />}

      {selectedRequest && <RequestDetailsModal req={selectedRequest} onClose={() => setSelectedRequest(null)} />}
    </div>
  );
}

export default App;
