import React, { useState, useRef } from 'react';
import './VenueProfile.css';

interface VenueProfileProps {
  onClose: () => void;
}

interface DanceFloor {
  id: string;
  name: string;
  description: string;
}

interface VenueData {
  companyName: string;
  address: string;
  openingHours: string;
  generalInfo: string;
  accountManager: string;
  accountManagerPhone: string;
  gageRange: string;
  artistTypes: string[];
  photo: string;
  danceFloors: DanceFloor[];
}

const ARTIST_TYPE_OPTIONS = ['Live artist', 'DJ', 'Troubadour', 'Quizmaster', 'Band', 'Comedian'];

const DEFAULT: VenueData = {
  companyName: '',
  address: '',
  openingHours: '',
  generalInfo: '',
  accountManager: '',
  accountManagerPhone: '',
  gageRange: '',
  artistTypes: [],
  photo: '',
  danceFloors: [
    { id: '1', name: 'Main Dining', description: '' },
    { id: '2', name: 'Upstairs', description: '' },
    { id: '3', name: 'Basement', description: '' },
  ],
};

function load(): VenueData {
  try {
    const s = localStorage.getItem('jocky_venue_profile');
    if (s) {
      const parsed = JSON.parse(s);
      // Migrate old string danceFloors to array
      if (!Array.isArray(parsed.danceFloors)) {
        delete parsed.danceFloors;
      }
      return { ...DEFAULT, ...parsed };
    }
  } catch {}
  return DEFAULT;
}

const VenueProfile: React.FC<VenueProfileProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'settings' | 'dancefloors'>('settings');
  const [data, setData] = useState<VenueData>(load);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Dance floor editing state
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [editingFloor, setEditingFloor] = useState<DanceFloor | null>(null);
  const [addingFloor, setAddingFloor] = useState(false);
  const [newFloor, setNewFloor] = useState({ name: '', description: '' });

  const update = (patch: Partial<VenueData>) => {
    const next = { ...data, ...patch };
    setData(next);
    localStorage.setItem('jocky_venue_profile', JSON.stringify(next));
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update({ photo: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const toggleArtistType = (type: string) => {
    const types = data.artistTypes.includes(type)
      ? data.artistTypes.filter(t => t !== type)
      : [...data.artistTypes, type];
    update({ artistTypes: types });
  };

  const saveFloorEdit = () => {
    if (!editingFloor) return;
    const danceFloors = data.danceFloors.map(f => f.id === editingFloor.id ? editingFloor : f);
    update({ danceFloors });
    setEditingFloorId(null);
    setEditingFloor(null);
  };

  const deleteFloor = (id: string) => {
    update({ danceFloors: data.danceFloors.filter(f => f.id !== id) });
  };

  const addFloor = () => {
    if (!newFloor.name.trim()) return;
    const floor: DanceFloor = { id: Date.now().toString(), name: newFloor.name.trim(), description: newFloor.description };
    update({ danceFloors: [...data.danceFloors, floor] });
    setNewFloor({ name: '', description: '' });
    setAddingFloor(false);
  };

  return (
    <div className="vp-page">
      <div className="vp-header">
        <button className="vp-back" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <h1 className="vp-title">Profile</h1>
        <div className="vp-tabs">
          <button className={`vp-tab ${tab === 'dancefloors' ? 'active' : ''}`} onClick={() => setTab('dancefloors')}>Dance Floors</button>
          <button className={`vp-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>Settings</button>
        </div>
        <div style={{ flex: 1 }} />
        {tab === 'settings' && (
          <button className="vp-btn-change-image" onClick={() => fileRef.current?.click()}>Change image</button>
        )}
        {tab === 'dancefloors' && (
          <button className="vp-btn-add-floor" onClick={() => setAddingFloor(true)}>+ Add dance floor</button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
      </div>

      {tab === 'settings' && (
        <div className="vp-settings-body">
          <div className="vp-form-grid">
            {/* Left column */}
            <div className="vp-form-col">
              <div className="vp-field">
                <label className="vp-field-label">Company name</label>
                <input className="vp-field-input" value={data.companyName} onChange={e => update({ companyName: e.target.value })} />
              </div>
              <div className="vp-field">
                <label className="vp-field-label">Address</label>
                <input className="vp-field-input" placeholder="Street address" value={data.address} onChange={e => update({ address: e.target.value })} />
              </div>
              <div className="vp-field">
                <label className="vp-field-label">Opening hours</label>
                <input className="vp-field-input" placeholder="e.g. 12:00 - 03:00" value={data.openingHours} onChange={e => update({ openingHours: e.target.value })} />
              </div>
              <div className="vp-field">
                <label className="vp-field-label">General information</label>
                <textarea className="vp-field-input vp-field-textarea" placeholder="Additional info about your venue..." value={data.generalInfo} onChange={e => update({ generalInfo: e.target.value })} />
              </div>
            </div>

            {/* Right column */}
            <div className="vp-form-col">
              <div className="vp-field">
                <label className="vp-field-label">Account manager</label>
                <input className="vp-field-input" value={data.accountManager} onChange={e => update({ accountManager: e.target.value })} />
              </div>
              <div className="vp-field">
                <label className="vp-field-label">Account manager phone</label>
                <input className="vp-field-input" value={data.accountManagerPhone} onChange={e => update({ accountManagerPhone: e.target.value })} />
              </div>
              <div className="vp-field">
                <label className="vp-field-label">Gage range in SEK</label>
                <input className="vp-field-input" value={data.gageRange} onChange={e => update({ gageRange: e.target.value })} />
              </div>
              <div className="vp-field">
                <label className="vp-field-label">Type of artists</label>
                <div className="vp-type-picker" onClick={() => setShowTypeDropdown(v => !v)}>
                  <span className="vp-type-placeholder">Select artist type</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                {showTypeDropdown && (
                  <div className="vp-type-dropdown">
                    {ARTIST_TYPE_OPTIONS.map(type => (
                      <div key={type} className={`vp-type-option ${data.artistTypes.includes(type) ? 'selected' : ''}`} onClick={() => toggleArtistType(type)}>
                        {data.artistTypes.includes(type) && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 4" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        {type}
                      </div>
                    ))}
                  </div>
                )}
                {data.artistTypes.length > 0 && (
                  <div className="vp-type-tags">
                    {data.artistTypes.map(type => (
                      <span key={type} className="vp-type-tag">
                        {type}
                        <button onClick={() => toggleArtistType(type)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Image */}
            <div className="vp-image-col">
              <div className="vp-image-box" onClick={() => fileRef.current?.click()}>
                {data.photo
                  ? <img src={data.photo} alt="venue" className="vp-image" />
                  : <div className="vp-image-placeholder">{data.companyName.charAt(0)}</div>
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'dancefloors' && (
        <div className="vp-floors-body">
          <div className="vp-floors-list">
            {data.danceFloors.map(floor => (
              <div key={floor.id} className="vp-floor-row">
                {editingFloorId === floor.id ? (
                  <div className="vp-floor-edit-row">
                    <input
                      className="vp-field-input vp-floor-name-input"
                      value={editingFloor?.name || ''}
                      onChange={e => setEditingFloor(f => f ? { ...f, name: e.target.value } : f)}
                      placeholder="Floor name"
                      autoFocus
                    />
                    <input
                      className="vp-field-input vp-floor-desc-input"
                      value={editingFloor?.description || ''}
                      onChange={e => setEditingFloor(f => f ? { ...f, description: e.target.value } : f)}
                      placeholder="Description"
                    />
                    <button className="vp-floor-save-btn" onClick={saveFloorEdit}>Save</button>
                    <button className="vp-floor-cancel-btn" onClick={() => { setEditingFloorId(null); setEditingFloor(null); }}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <div className="vp-floor-info">
                      <span className="vp-floor-name">{floor.name}</span>
                      {floor.description && <span className="vp-floor-desc">{floor.description}</span>}
                    </div>
                    <div className="vp-floor-actions">
                      <button className="vp-floor-btn" onClick={() => { setEditingFloorId(floor.id); setEditingFloor({ ...floor }); }} title="Edit">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="vp-floor-btn vp-floor-btn--delete" onClick={() => deleteFloor(floor.id)} title="Delete">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {addingFloor && (
              <div className="vp-floor-row">
                <div className="vp-floor-edit-row">
                  <input
                    className="vp-field-input vp-floor-name-input"
                    value={newFloor.name}
                    onChange={e => setNewFloor(f => ({ ...f, name: e.target.value }))}
                    placeholder="Floor name"
                    autoFocus
                  />
                  <input
                    className="vp-field-input vp-floor-desc-input"
                    value={newFloor.description}
                    onChange={e => setNewFloor(f => ({ ...f, description: e.target.value }))}
                    placeholder="Description"
                  />
                  <button className="vp-floor-save-btn" onClick={addFloor}>Add</button>
                  <button className="vp-floor-cancel-btn" onClick={() => { setAddingFloor(false); setNewFloor({ name: '', description: '' }); }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueProfile;
