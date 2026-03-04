import React from 'react';
import './DJProfile.css';

interface DJProfileProps {
  onClose: () => void;
}

const DJProfile: React.FC<DJProfileProps> = ({ onClose }) => {
  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">DS</div>
        </div>
        <div className="profile-hero-info">
          <h1 className="profile-name">DJ Strauss</h1>
          <p className="profile-meta">DJ • Stockholm, Sweden</p>
          <div className="profile-badges">
            <span className="profile-badge">✓ Identity verified</span>
            <span className="profile-badge">↩ Flexible cancellation</span>
          </div>
        </div>
      </div>

      <div className="profile-body">
        <div className="profile-main">
          <section className="profile-section">
            <p className="profile-bio">
              Stockholm-based DJ with 5+ years of experience in House, Techno and Tech House. Known for high-energy sets and reading the crowd perfectly. Available for clubs, private events and festivals.
            </p>
          </section>

          <section className="profile-section">
            <h3 className="profile-section-title">Genres</h3>
            <div className="profile-tags">
              <span className="profile-tag">House</span>
              <span className="profile-tag">Techno</span>
              <span className="profile-tag">Tech House</span>
            </div>
          </section>

          <section className="profile-section">
            <h3 className="profile-section-title">Category</h3>
            <div className="profile-tags">
              <span className="profile-tag">Club DJ</span>
            </div>
          </section>

          <section className="profile-section">
            <h3 className="profile-section-title">Serviceable Locations</h3>
            <p className="profile-location">📍 Stockholm, Sweden</p>
          </section>

          <section className="profile-section">
            <h3 className="profile-section-title">Cancellation Policy</h3>
            <p className="profile-bio">Full refund 14 days prior to event start time. Deposit refund for cancellations at least 7 days before. No refunds within 7 days of event.</p>
          </section>
        </div>

      </div>

      <button className="profile-back" onClick={onClose}>← Back</button>
    </div>
  );
};

export default DJProfile;
