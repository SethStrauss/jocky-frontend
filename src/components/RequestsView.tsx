import React, { useState } from 'react';
import { ArtistRequest, Event } from '../types';
import ArtistProfileModal from './ArtistProfileModal';
import './RequestsView.css';

// Mock artist requests grouped by event
const mockRequests: { [eventId: string]: ArtistRequest[] } = {
  '1': [
    {
      id: '1',
      eventId: '1',
      eventName: 'Friday Night Live',
      artistId: '1',
      artistName: 'DJ Terka',
      artistType: 'DJ',
      artistGenres: ['House', 'Techno'],
      artistRating: 4.9,
      artistReviewCount: 23,
      message: "I'd love to play at your venue! I specialize in underground house and techno, and I think my style would be perfect for Friday nights. I can bring my own equipment and have experience playing at similar venues like Berns and Debaser.",
      requestedAt: new Date(2026, 1, 19, 14, 30),
      status: 'pending'
    },
    {
      id: '2',
      eventId: '1',
      eventName: 'Friday Night Live',
      artistId: '3',
      artistName: 'Malcomba',
      artistType: 'DJ',
      artistGenres: ['Disco', 'Funk', 'Soul'],
      artistRating: 4.8,
      artistReviewCount: 18,
      message: "Hey! Disco and funk vibes would be amazing for Friday night. I have a huge vinyl collection and know how to get the crowd moving. Let me know!",
      requestedAt: new Date(2026, 1, 19, 16, 15),
      status: 'pending'
    },
  ],
  '2': [
    {
      id: '3',
      eventId: '2',
      eventName: 'Saturday Disco',
      artistId: '2',
      artistName: 'AronChupa',
      artistType: 'Producer & DJ',
      artistGenres: ['House', 'EDM', 'Pop'],
      artistRating: 5.0,
      artistReviewCount: 45,
      message: "This sounds like a great event! I can bring high energy and have a lot of experience with Saturday night crowds. Would love to discuss details!",
      requestedAt: new Date(2026, 1, 20, 10, 0),
      status: 'pending'
    },
  ]
};

// Mock events with requests
const mockEventsWithRequests: Event[] = [
  {
    id: '1',
    name: 'Friday Night Live',
    date: new Date(2026, 1, 28),
    startTime: '20:00',
    endTime: '23:00',
    danceFloor: '1',
    amount: 5000,
    notes: '',
    frequency: 'single',
    status: 'open',
    requestCount: 2
  },
  {
    id: '2',
    name: 'Saturday Disco',
    date: new Date(2026, 2, 1),
    startTime: '21:00',
    endTime: '01:00',
    danceFloor: '1',
    amount: 6000,
    notes: '',
    frequency: 'single',
    status: 'open',
    requestCount: 1
  }
];

const RequestsView: React.FC = () => {
  const [eventsWithRequests] = useState<Event[]>(mockEventsWithRequests);
  const [requests, setRequests] = useState(mockRequests);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);

  const handleAccept = (eventId: string, requestId: string, artistId: string, artistName: string) => {
    if (window.confirm(`Accept ${artistName} for this event?`)) {
      // Update request status
      setRequests(prev => ({
        ...prev,
        [eventId]: prev[eventId].map(r => 
          r.id === requestId ? { ...r, status: 'accepted' as const } : { ...r, status: 'declined' as const }
        )
      }));
      
      alert(`${artistName} has been booked! Event status changed to OFFERED.`);
    }
  };

  const handleDecline = (eventId: string, requestId: string, artistName: string) => {
    if (window.confirm(`Decline ${artistName}'s request?`)) {
      setRequests(prev => ({
        ...prev,
        [eventId]: prev[eventId].map(r => 
          r.id === requestId ? { ...r, status: 'declined' as const } : r
        )
      }));
      
      alert(`${artistName}'s request has been declined.`);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div className="requests-view">
      <h1 className="requests-title">Event Requests</h1>
      <p className="requests-subtitle">Artists requesting to play at your events</p>

      <div className="requests-content">
        {eventsWithRequests.length === 0 ? (
          <div className="empty-requests">
            <svg viewBox="0 0 24 24" fill="currentColor" className="empty-icon">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <p>No requests yet</p>
            <p className="empty-hint">Create an "Open for requests" event to start receiving artist requests</p>
          </div>
        ) : (
          <div className="events-list">
            {eventsWithRequests.map(event => (
              <div key={event.id} className="event-request-card">
                {/* Event Header */}
                <div className="event-request-header">
                  <div className="event-info">
                    <h2 className="event-name">{event.name}</h2>
                    <p className="event-details">
                      {formatDate(event.date)} • {event.startTime}-{event.endTime} • {event.amount.toLocaleString()} SEK
                    </p>
                  </div>
                  <div className="request-count-badge">
                    {requests[event.id]?.length || 0} request{requests[event.id]?.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Artist Requests as Chat Messages */}
                <div className="request-messages">
                  {requests[event.id]?.map(request => (
                    <div 
                      key={request.id} 
                      className={`request-message-thread ${request.status !== 'pending' ? 'resolved' : ''}`}
                    >
                      {/* Artist Message */}
                      <div className="message-from-artist">
                        <div className="message-avatar">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                        
                        <div className="message-content">
                          <div className="message-header">
                            <span className="message-sender">{request.artistName}</span>
                            <span className="message-time">{formatTime(request.requestedAt)}</span>
                          </div>
                          
                          <div className="message-bubble artist-bubble">
                            <p>{request.message}</p>
                          </div>
                          
                          <div className="message-meta">
                            <span className="artist-type-small">{request.artistType}</span>
                            <span className="separator">•</span>
                            {request.artistGenres.map((genre, i) => (
                              <span key={i}>
                                {genre}
                                {i < request.artistGenres.length - 1 && ', '}
                              </span>
                            ))}
                            {request.artistRating && (
                              <>
                                <span className="separator">•</span>
                                <span>⭐ {request.artistRating} ({request.artistReviewCount})</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Venue Response / Actions */}
                      {request.status === 'pending' ? (
                        <div className="message-actions-bar">
                          <button
                            className="btn-view-profile-small"
                            onClick={() => setSelectedArtist({
                              id: request.artistId,
                              name: request.artistName,
                              type: request.artistType,
                              genres: request.artistGenres,
                              location: 'Stockholm',
                              about: request.message,
                              rating: request.artistRating,
                              reviewCount: request.artistReviewCount,
                              priceRange: '5000-8000'
                            })}
                          >
                            View Profile
                          </button>
                          
                          <div className="action-buttons">
                            <button
                              className="btn-accept-small"
                              onClick={() => handleAccept(event.id, request.id, request.artistId, request.artistName)}
                            >
                              ✓ Accept Offer
                            </button>
                            <button
                              className="btn-decline-small"
                              onClick={() => handleDecline(event.id, request.id, request.artistName)}
                            >
                              ✗ Decline
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="message-from-venue">
                          <div className="message-content venue-content">
                            <div className="message-header">
                              <span className="message-sender">You</span>
                            </div>
                            
                            <div className="message-bubble venue-bubble">
                              {request.status === 'accepted' ? (
                                <p>✓ Accepted! Looking forward to working with you. I'll send more details soon.</p>
                              ) : (
                                <p>Thank you for your interest, but we've decided to go with another artist for this event.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedArtist && (
        <ArtistProfileModal
          artist={selectedArtist}
          onClose={() => setSelectedArtist(null)}
        />
      )}
    </div>
  );
};

export default RequestsView;
