import React from 'react';
import { Artist } from '../types';
import { loadVenueName } from '../utils/venueProfile';
import './ArtistProfileModal.css';

interface ArtistProfileModalProps {
  artist: Artist;
  onClose: () => void;
  onBookNow?: (artistId: string) => void;
  onMessage?: (artistId: string) => void;
}

const ArtistProfileModal: React.FC<ArtistProfileModalProps> = ({
  artist,
  onClose,
  onBookNow,
  onMessage
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="artist-profile-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="artist-profile-header">
          <div className="artist-profile-avatar-large">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          
          <div className="artist-profile-info">
            <h2 className="artist-profile-name">{artist.name}</h2>
            <p className="artist-profile-type">{artist.type}</p>
            
            {artist.rating && (
              <div className="artist-rating">
                <span className="stars">{'⭐'.repeat(Math.round(artist.rating))}</span>
                <span className="rating-text">
                  {artist.rating.toFixed(1)} ({artist.reviewCount || 0} reviews)
                </span>
              </div>
            )}
          </div>

          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Details Grid */}
        <div className="artist-profile-body">
          <div className="profile-section">
            <div className="profile-row">
              <span className="profile-label">📍 Location:</span>
              <span className="profile-value">{artist.location}</span>
            </div>

            {artist.priceRange && (
              <div className="profile-row">
                <span className="profile-label">💰 Price Range:</span>
                <span className="profile-value">{artist.priceRange} SEK</span>
              </div>
            )}

            {artist.experience && (
              <div className="profile-row">
                <span className="profile-label">🎵 Experience:</span>
                <span className="profile-value">{artist.experience}</span>
              </div>
            )}
          </div>

          {/* Genres */}
          {artist.genres && artist.genres.length > 0 && (
            <div className="profile-section">
              <h3 className="section-title">Genres</h3>
              <div className="genre-tags-large">
                {artist.genres.map((genre, i) => (
                  <span key={i} className="genre-tag-large">{genre}</span>
                ))}
              </div>
            </div>
          )}

          {/* About */}
          <div className="profile-section">
            <h3 className="section-title">About</h3>
            <p className="artist-bio">{artist.about}</p>
          </div>

          {/* Availability Calendar (Placeholder) */}
          <div className="profile-section">
            <h3 className="section-title">Availability</h3>
            <div className="availability-placeholder">
              <p>📅 Availability calendar coming soon</p>
              <p className="availability-note">
                Currently shows available most weekends
              </p>
            </div>
          </div>

          {/* Past Gigs (Placeholder) */}
          <div className="profile-section">
            <h3 className="section-title">Past Gigs</h3>
            <div className="past-gigs">
              <div className="past-gig-item">
                <span className="gig-venue">{loadVenueName()}</span>
                <span className="gig-date">Feb 15, 2026</span>
                <span className="gig-rating">⭐⭐⭐⭐⭐</span>
              </div>
              <div className="past-gig-item">
                <span className="gig-venue">Berns</span>
                <span className="gig-date">Feb 1, 2026</span>
                <span className="gig-rating">⭐⭐⭐⭐⭐</span>
              </div>
              <div className="past-gig-item">
                <span className="gig-venue">Debaser</span>
                <span className="gig-date">Jan 20, 2026</span>
                <span className="gig-rating">⭐⭐⭐⭐</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="artist-profile-footer">
          {onMessage && (
            <button
              className="btn-message-artist"
              onClick={() => {
                onMessage(artist.id);
                onClose();
              }}
            >
              💬 Message
            </button>
          )}
          
          {onBookNow && (
            <button
              className="btn-modal-book"
              onClick={() => {
                onBookNow(artist.id);
                onClose();
              }}
            >
              Book Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtistProfileModal;
