import supabase from '../supabase';
import { Event } from '../types';

// ── Events ────────────────────────────────────────────────────────────────────

function dbToEvent(row: any): Event {
  return {
    id: row.id,
    name: row.name || '',
    date: new Date((row.date || '2026-01-01') + 'T12:00:00'),
    startTime: row.start_time || '',
    endTime: row.end_time || '',
    venue: row.venue || '',
    danceFloor: row.dance_floor || '',
    amount: row.amount || 0,
    notes: row.notes || '',
    frequency: (row.frequency || 'single') as 'single' | 'multiple',
    status: (row.status || 'created') as any,
    artistId: row.artist_id || undefined,
    artistName: row.artist_name || undefined,
    interestChecks: row.interest_checks || [],
    bookingRequests: row.booking_requests || [],
    selectedDates: row.selected_dates && row.selected_dates.length > 0 ? row.selected_dates : undefined,
    openForRequests: row.open_for_requests || false,
  };
}

function eventToDB(event: Event, venueId: string): any {
  const dateStr = event.date instanceof Date
    ? event.date.toISOString().split('T')[0]
    : String(event.date).split('T')[0];
  return {
    id: event.id,
    venue_id: venueId,
    name: event.name,
    date: dateStr,
    start_time: event.startTime,
    end_time: event.endTime,
    venue: event.venue || '',
    dance_floor: event.danceFloor || '',
    amount: event.amount || 0,
    notes: event.notes || '',
    frequency: event.frequency || 'single',
    status: event.status || 'created',
    artist_id: event.artistId || null,
    artist_name: event.artistName || null,
    interest_checks: event.interestChecks || [],
    booking_requests: event.bookingRequests || [],
    selected_dates: event.selectedDates || [],
    open_for_requests: event.openForRequests || false,
  };
}

export async function fetchEvents(venueId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('venue_id', venueId)
    .order('date', { ascending: true });
  if (error) { console.error('fetchEvents:', error); return []; }
  return (data || []).map(dbToEvent);
}

export async function upsertEvents(events: Event[], venueId: string): Promise<void> {
  if (events.length === 0) return;
  const { error } = await supabase.from('events').upsert(events.map(e => eventToDB(e, venueId)));
  if (error) console.error('upsertEvents:', error);
}

export async function deleteEventDB(eventId: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) console.error('deleteEventDB:', error);
}

export async function updateEventStatusDB(eventId: string, fields: Record<string, any>): Promise<void> {
  const { error } = await supabase.from('events').update(fields).eq('id', eventId);
  if (error) console.error('updateEventStatusDB:', error);
}

export async function fetchDJRelatedEvents(djId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .in('status', ['offered', 'open', 'confirmed']);
  if (error) { console.error('fetchDJRelatedEvents:', error); return []; }
  return (data || [])
    .filter((e: any) => {
      if (e.status === 'open') return (e.interest_checks || []).some((ic: any) => ic.artistId === djId);
      if (e.status === 'offered') return (e.booking_requests || []).some((br: any) => br.artistId === djId);
      if (e.status === 'confirmed') return e.artist_id === djId;
      return false;
    })
    .map(dbToEvent);
}

// ── Venue Profile ─────────────────────────────────────────────────────────────

export function venueProfileFromDB(row: any): any {
  return {
    companyName: row.company_name || '',
    address: row.address || '',
    openingHours: row.opening_hours || '',
    generalInfo: row.general_info || '',
    accountManager: row.account_manager || '',
    accountManagerPhone: row.account_manager_phone || '',
    gageRange: row.gage_range || '',
    artistTypes: row.artist_types || [],
    photo: row.photo || '',
    danceFloors: row.dance_floors || [],
  };
}

export async function fetchVenueProfile(userId: string): Promise<any | null> {
  const { data } = await supabase.from('venue_profiles').select('*').eq('id', userId).single();
  return data;
}

export async function upsertVenueProfile(userId: string, profile: any): Promise<void> {
  const { error } = await supabase.from('venue_profiles').upsert({
    id: userId,
    company_name: profile.companyName || '',
    address: profile.address || '',
    opening_hours: profile.openingHours || '',
    general_info: profile.generalInfo || '',
    account_manager: profile.accountManager || '',
    account_manager_phone: profile.accountManagerPhone || '',
    gage_range: profile.gageRange || '',
    artist_types: profile.artistTypes || [],
    photo: profile.photo || '',
    dance_floors: profile.danceFloors || [],
    updated_at: new Date().toISOString(),
  });
  if (error) console.error('upsertVenueProfile:', error);
}

// ── DJ Profile ────────────────────────────────────────────────────────────────

export function djProfileFromDB(row: any): any {
  return {
    name: row.name ?? '',
    bio: row.bio ?? '',
    genres: row.genres ?? [],
    category: row.category ?? 'Club DJ',
    location: row.location ?? '',
    photo: row.photo ?? '',
    photoX: row.photo_x ?? 50,
    photoY: row.photo_y ?? 50,
    price: row.price ?? '',
    spotify: row.spotify ?? '',
    youtube: row.youtube ?? '',
    manualGigs: row.manual_gigs ?? [],
    pressKit: row.press_kit ?? null,
  };
}

export async function fetchDJProfile(userId: string): Promise<any | null> {
  const { data } = await supabase.from('dj_profiles').select('*').eq('id', userId).single();
  return data;
}

export async function upsertDJProfile(userId: string, profile: any): Promise<void> {
  const { error } = await supabase.from('dj_profiles').upsert({
    id: userId,
    name: profile.name || '',
    bio: profile.bio || '',
    genres: profile.genres || [],
    category: profile.category || 'Club DJ',
    location: profile.location || '',
    photo: profile.photo || '',
    photo_x: profile.photoX || 50,
    photo_y: profile.photoY || 50,
    price: profile.price || '',
    spotify: profile.spotify || '',
    youtube: profile.youtube || '',
    manual_gigs: profile.manualGigs || [],
    press_kit: profile.pressKit || null,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error('upsertDJProfile:', error);
}

export async function fetchAllDJProfiles(): Promise<any[]> {
  const { data, error } = await supabase.from('dj_profiles').select('*');
  if (error) { console.error('fetchAllDJProfiles:', error); return []; }
  return data || [];
}

// ── Connections ───────────────────────────────────────────────────────────────

export function connFromDB(row: any): any {
  return {
    id: row.id,
    artistId: row.artist_id,
    artistName: row.artist_name,
    artistType: row.artist_type,
    artistLocation: row.artist_location,
    artistGenres: row.artist_genres || [],
    venueId: row.venue_id,
    venueName: row.venue_name,
    status: row.status,
    requestedAt: row.requested_at,
  };
}

export async function fetchConnectionsForVenue(venueId: string): Promise<any[]> {
  const { data, error } = await supabase.from('connections').select('*').eq('venue_id', venueId);
  if (error) { console.error('fetchConnectionsForVenue:', error); return []; }
  return (data || []).map(connFromDB);
}

export async function fetchConnectionsForDJ(djId: string): Promise<any[]> {
  const { data, error } = await supabase.from('connections').select('*').eq('artist_id', djId);
  if (error) { console.error('fetchConnectionsForDJ:', error); return []; }
  return (data || []).map(connFromDB);
}

export async function createConnectionDB(conn: any): Promise<void> {
  const { error } = await supabase.from('connections').insert({
    id: conn.id,
    artist_id: conn.artistId,
    artist_name: conn.artistName,
    artist_type: conn.artistType,
    artist_location: conn.artistLocation,
    artist_genres: conn.artistGenres || [],
    venue_id: conn.venueId,
    venue_name: conn.venueName,
    status: conn.status || 'pending',
    requested_at: conn.requestedAt || new Date().toISOString(),
  });
  if (error) console.error('createConnectionDB:', error);
}

export async function updateConnectionStatusDB(connId: string, status: string): Promise<void> {
  const { error } = await supabase.from('connections').update({ status }).eq('id', connId);
  if (error) console.error('updateConnectionStatusDB:', error);
}

export async function removeConnectionDB(connId: string): Promise<void> {
  const { error } = await supabase.from('connections').delete().eq('id', connId);
  if (error) console.error('removeConnectionDB:', error);
}

// ── Chats ─────────────────────────────────────────────────────────────────────

export function chatFromDB(row: any): any {
  return {
    id: row.id,
    venueId: row.venue_id,
    artistId: row.artist_id,
    eventId: row.artist_id,
    eventName: '',
    venueName: row.venue_name || '',
    artistName: row.artist_name || '',
    acceptedAt: row.updated_at || new Date().toISOString(),
    messages: row.messages || [],
    venueUnread: row.venue_unread || 0,
    djUnread: row.dj_unread || 0,
  };
}

export async function fetchChatsForVenue(venueId: string): Promise<any[]> {
  const { data, error } = await supabase.from('chats').select('*').eq('venue_id', venueId);
  if (error) { console.error('fetchChatsForVenue:', error); return []; }
  return (data || []).map(chatFromDB);
}

export async function fetchChatsForDJ(djId: string): Promise<any[]> {
  const { data, error } = await supabase.from('chats').select('*').eq('artist_id', djId);
  if (error) { console.error('fetchChatsForDJ:', error); return []; }
  return (data || []).map(chatFromDB);
}

export async function upsertChatDB(chat: any): Promise<void> {
  const { error } = await supabase.from('chats').upsert({
    id: chat.id,
    venue_id: chat.venueId,
    artist_id: chat.artistId,
    artist_name: chat.artistName || '',
    venue_name: chat.venueName || '',
    messages: chat.messages || [],
    venue_unread: chat.venueUnread || 0,
    dj_unread: chat.djUnread || 0,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error('upsertChatDB:', error);
}

// ── Bootstrap: load all user data into localStorage on login ──────────────────

function dispatch(key: string) {
  window.dispatchEvent(new StorageEvent('storage', { key }));
}

export async function loadUserDataToLocalStorage(userId: string, role: 'venue' | 'dj'): Promise<void> {
  if (role === 'venue') {
    const [events, profile, conns, chats] = await Promise.all([
      fetchEvents(userId),
      fetchVenueProfile(userId),
      fetchConnectionsForVenue(userId),
      fetchChatsForVenue(userId),
    ]);
    localStorage.setItem('jocky_events', JSON.stringify(events));
    if (profile) {
      localStorage.setItem('jocky_venue_profile', JSON.stringify(venueProfileFromDB(profile)));
      dispatch('jocky_venue_profile');
    }
    localStorage.setItem('jocky_artist_connections', JSON.stringify(conns));
    dispatch('jocky_artist_connections');
    localStorage.setItem('jocky_chats', JSON.stringify(chats));
    dispatch('jocky_chats');
  } else {
    const [profile, conns, chats, djEvents] = await Promise.all([
      fetchDJProfile(userId),
      fetchConnectionsForDJ(userId),
      fetchChatsForDJ(userId),
      fetchDJRelatedEvents(userId),
    ]);
    if (profile) {
      localStorage.setItem('jocky_dj_profile', JSON.stringify(djProfileFromDB(profile)));
      dispatch('jocky_dj_profile');
    }
    localStorage.setItem('jocky_artist_connections', JSON.stringify(conns));
    dispatch('jocky_artist_connections');
    localStorage.setItem('jocky_chats', JSON.stringify(chats));
    dispatch('jocky_chats');
    localStorage.setItem('jocky_events', JSON.stringify(djEvents));
    dispatch('jocky_events');
  }
}

export function clearUserLocalStorage() {
  localStorage.removeItem('jocky_events');
  localStorage.removeItem('jocky_artist_connections');
  localStorage.removeItem('jocky_chats');
  localStorage.removeItem('jocky_venue_profile');
  localStorage.removeItem('jocky_dj_profile');
}
