import supabase from '../supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { dbToEvent, chatFromDB, connFromDB } from './db';

let channels: RealtimeChannel[] = [];

function dispatch(key: string, newValue: string) {
  localStorage.setItem(key, newValue);
  window.dispatchEvent(new StorageEvent('storage', { key, newValue }));
}

function mergeEvents(incoming: any): void {
  try {
    const current: any[] = JSON.parse(localStorage.getItem('jocky_events') || '[]');
    const evt = dbToEvent(incoming);
    const serialized = { ...evt, date: (evt.date as Date).toISOString() };
    const idx = current.findIndex(e => e.id === evt.id);
    const updated = idx >= 0
      ? current.map(e => e.id === evt.id ? serialized : e)
      : [...current, serialized];
    dispatch('jocky_events', JSON.stringify(updated));
  } catch (err) {
    console.error('[Realtime] mergeEvents:', err);
  }
}

function removeEvent(id: string): void {
  try {
    const current: any[] = JSON.parse(localStorage.getItem('jocky_events') || '[]');
    dispatch('jocky_events', JSON.stringify(current.filter(e => e.id !== id)));
  } catch {}
}

function mergeChat(incoming: any): void {
  try {
    const current: any[] = JSON.parse(localStorage.getItem('jocky_chats') || '[]');
    const chat = chatFromDB(incoming);
    const idx = current.findIndex(c => c.id === chat.id);
    const updated = idx >= 0 ? current.map(c => c.id === chat.id ? chat : c) : [...current, chat];
    dispatch('jocky_chats', JSON.stringify(updated));
  } catch (err) {
    console.error('[Realtime] mergeChat:', err);
  }
}

function mergeConnection(incoming: any): void {
  try {
    const current: any[] = JSON.parse(localStorage.getItem('jocky_artist_connections') || '[]');
    const conn = connFromDB(incoming);
    const idx = current.findIndex(c => c.id === conn.id);
    const updated = idx >= 0 ? current.map(c => c.id === conn.id ? conn : c) : [...current, conn];
    dispatch('jocky_artist_connections', JSON.stringify(updated));
  } catch (err) {
    console.error('[Realtime] mergeConnection:', err);
  }
}

export function subscribeRealtime(userId: string, role: 'venue' | 'dj'): void {
  unsubscribeRealtime();

  if (role === 'venue') {
    const eventsChannel = supabase
      .channel(`events-venue-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `venue_id=eq.${userId}` }, payload => {
        if (payload.eventType === 'DELETE') removeEvent((payload.old as any).id);
        else mergeEvents(payload.new);
      })
      .subscribe();

    const chatsChannel = supabase
      .channel(`chats-venue-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats', filter: `venue_id=eq.${userId}` }, payload => {
        if (payload.eventType !== 'DELETE') mergeChat(payload.new);
      })
      .subscribe();

    const connsChannel = supabase
      .channel(`connections-venue-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections', filter: `venue_id=eq.${userId}` }, payload => {
        if (payload.eventType !== 'DELETE') mergeConnection(payload.new);
      })
      .subscribe();

    channels = [eventsChannel, chatsChannel, connsChannel];

  } else {
    // DJ: filter events client-side (server-side JSONB filtering not available without RLS)
    const eventsChannel = supabase
      .channel(`events-dj-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, payload => {
        if (payload.eventType === 'DELETE') return;
        const row = payload.new as any;
        const isRelevant =
          row.artist_id === userId ||
          (row.interest_checks || []).some((ic: any) => ic.artistId === userId) ||
          (row.booking_requests || []).some((br: any) => br.artistId === userId);
        if (isRelevant) mergeEvents(row);
      })
      .subscribe();

    const chatsChannel = supabase
      .channel(`chats-dj-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats', filter: `artist_id=eq.${userId}` }, payload => {
        if (payload.eventType !== 'DELETE') mergeChat(payload.new);
      })
      .subscribe();

    const connsChannel = supabase
      .channel(`connections-dj-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections', filter: `artist_id=eq.${userId}` }, payload => {
        if (payload.eventType !== 'DELETE') mergeConnection(payload.new);
      })
      .subscribe();

    channels = [eventsChannel, chatsChannel, connsChannel];
  }
}

export function unsubscribeRealtime(): void {
  channels.forEach(ch => supabase.removeChannel(ch));
  channels = [];
}
