import { apiClient } from '../utils/api';

let localEvents = [];
let nextId = 1000;

export const eventService = {
  getEvents: async () => {
    try {
      const response = await apiClient('/events');
      return response.events || [];
    } catch (error) {
      return localEvents;
    }
  },

  createEvent: async (eventData) => {
    const newEvent = {
      id: String(nextId++),
      event_name: eventData.name,
      event_date: eventData.date.toISOString().split('T')[0],
      start_time: eventData.startTime,
      end_time: eventData.endTime,
      amount_sek: eventData.amount,
      notes: eventData.notes,
      frequency: eventData.frequency,
      status: 'created',
    };
    localEvents.push(newEvent);
    try {
      const response = await apiClient('/events', {
        method: 'POST',
        body: JSON.stringify({
          event_name: eventData.name,
          event_date: eventData.date.toISOString().split('T')[0],
          start_time: eventData.startTime,
          end_time: eventData.endTime,
          dance_floor_id: eventData.danceFloor ? parseInt(eventData.danceFloor) : null,
          amount_sek: eventData.amount,
          notes: eventData.notes,
          frequency: eventData.frequency,
          status: 'created',
        }),
      });
      if (response.event) {
        newEvent.id = response.event.id?.toString();
      }
    } catch (error) {
      // use local
    }
    return newEvent;
  },

  updateEvent: async (id, eventData) => {
    try {
      const response = await apiClient(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(eventData),
      });
      return response.event;
    } catch (error) {
      return { id, ...eventData };
    }
  },

  deleteEvent: async (id) => {
    localEvents = localEvents.filter(e => e.id !== id);
    try {
      await apiClient(`/events/${id}`, { method: 'DELETE' });
    } catch (error) {}
  },

  sendOfferToArtist: async (eventId, artistId) => {
    try {
      const response = await apiClient(`/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'offered', artist_id: parseInt(artistId) }),
      });
      return response.event;
    } catch (error) {
      return { status: 'offered' };
    }
  },
};
