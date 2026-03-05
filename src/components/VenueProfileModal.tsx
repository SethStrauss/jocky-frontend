import React from 'react';
import ReactDOM from 'react-dom';
import './VenueProfileModal.css';

interface VenueProfileModalProps {
  profile: any;
  venueName: string;
  onClose: () => void;
}

const VenueProfileModal: React.FC<VenueProfileModalProps> = ({ profile, venueName, onClose }) => {
  const modal = (
    <div className="vpm-overlay" onClick={onClose}>
      <div className="vpm-modal" onClick={e => e.stopPropagation()}>
        <button className="vpm-close" onClick={onClose}>×</button>

        <div className="vpm-hero">
          {profile?.photo
            ? <img src={profile.photo} alt={venueName} className="vpm-hero-img" />
            : <div className="vpm-hero-placeholder">{venueName.charAt(0)}</div>
          }
          <div className="vpm-hero-name">{profile?.companyName || venueName}</div>
          {profile?.address && <div className="vpm-hero-address">{profile.address}</div>}
        </div>

        {profile ? (
          <div className="vpm-body">
            {profile.openingHours && (
              <div className="vpm-row">
                <span className="vpm-label">Opening hours</span>
                <span className="vpm-value">{profile.openingHours}</span>
              </div>
            )}
            {profile.gageRange && (
              <div className="vpm-row">
                <span className="vpm-label">Gage range</span>
                <span className="vpm-value">{profile.gageRange} SEK</span>
              </div>
            )}
            {profile.artistTypes?.length > 0 && (
              <div className="vpm-row">
                <span className="vpm-label">Artist types</span>
                <span className="vpm-value">{profile.artistTypes.join(', ')}</span>
              </div>
            )}
            {profile.generalInfo && (
              <div className="vpm-row vpm-row--block">
                <span className="vpm-label">About</span>
                <p className="vpm-bio">{profile.generalInfo}</p>
              </div>
            )}
            {profile.accountManager && (
              <div className="vpm-row">
                <span className="vpm-label">Contact</span>
                <span className="vpm-value">
                  {profile.accountManager}
                  {profile.accountManagerPhone && ` · ${profile.accountManagerPhone}`}
                </span>
              </div>
            )}
            {profile.danceFloors?.length > 0 && (
              <div className="vpm-row vpm-row--block">
                <span className="vpm-label">Dance floors</span>
                <div className="vpm-floors">
                  {profile.danceFloors.map((f: any) => (
                    <div key={f.id} className="vpm-floor">
                      <span className="vpm-floor-name">{f.name}</span>
                      {f.description && <span className="vpm-floor-desc">{f.description}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="vpm-empty">No profile information available yet.</div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

export default VenueProfileModal;
