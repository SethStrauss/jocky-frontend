import React, { useState, useRef } from 'react';
import { currentSession } from '../currentUser';
import { upsertDJProfile } from '../services/db';
import supabase from '../supabase';
import './DJOnboarding.css';

const ARTIST_TYPES = ['DJ', 'Live artist', 'Troubadour', 'Standup comedian', 'Quizmaster'];

interface DJOnboardingProps {
  onComplete: () => void;
}

const DJOnboarding: React.FC<DJOnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [city, setCity] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [photo, setPhoto] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleType = (t: string) =>
    setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const canNext = () => {
    if (step === 1) return fullName.trim() !== '' && city.trim() !== '';
    if (step === 2) return types.length > 0;
    return true;
  };

  const handleNext = async () => {
    if (step < 5) { setStep(s => s + 1); return; }
    // Save and complete
    const displayName = artistName.trim() || fullName.trim();
    const profileData = {
      name: displayName,
      bio,
      genres: [],
      category: types[0] || 'DJ',
      location: city,
      photo,
      photoX: 50,
      photoY: 50,
      price: '',
      spotify: '',
      youtube: '',
      manualGigs: [],
      pressKit: null,
    };
    const STORAGE_KEY = 'jocky_dj_profile';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profileData));
    if (currentSession?.userId) await upsertDJProfile(currentSession.userId, profileData);
    await supabase.auth.updateUser({ data: { onboarded: true } });
    onComplete();
  };

  return (
    <div className="onboarding">
      <div className="ob-logo">JOCKY</div>

      <div className="ob-body">
        <div className="ob-step">{step} / 5</div>

        {step === 1 && (
          <>
            <h1 className="ob-title">Welcome to Jocky</h1>
            <p className="ob-subtitle">Let's build your artist profile! Complete profiles get more gigs.</p>
            <div className="ob-field">
              <label className="ob-label">Full name*</label>
              <input className="ob-input" value={fullName} onChange={e => setFullName(e.target.value)} autoFocus />
            </div>
            <div className="ob-field">
              <label className="ob-label">Artist name</label>
              <input className="ob-input" value={artistName} onChange={e => setArtistName(e.target.value)} />
            </div>
            <div className="ob-field">
              <label className="ob-label">City*</label>
              <input className="ob-input" value={city} onChange={e => setCity(e.target.value)} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="ob-title">What type of artist are you?</h1>
            <p className="ob-subtitle">Select at least one. You can add more later.</p>
            <div className="ob-type-grid">
              {ARTIST_TYPES.map(t => (
                <button
                  key={t}
                  className={`ob-type-btn ${types.includes(t) ? 'selected' : ''}`}
                  onClick={() => toggleType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="ob-title">Upload a profile pic</h1>
            <p className="ob-subtitle">Artists with an image have a higher chance to be booked!</p>
            <div className="ob-photo-wrap" onClick={() => fileRef.current?.click()}>
              <div className="ob-photo-circle">
                {photo
                  ? <img src={photo} alt="profile" />
                  : (
                    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  )
                }
              </div>
              <div className="ob-photo-plus">+</div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="ob-title">Introduce yourself</h1>
            <p className="ob-subtitle">Introduce yourself with a short biography about who you are and your experiences.</p>
            <div className="ob-field">
              <label className="ob-label">About me*</label>
              <textarea
                className="ob-textarea"
                placeholder={`Hi, my name is ${fullName.split(' ')[0] || 'Axel'} and...`}
                value={bio}
                onChange={e => setBio(e.target.value)}
                autoFocus
              />
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h1 className="ob-title">Notifications</h1>
            <p className="ob-subtitle">Add your phone number to receive notifications about gigs.</p>
            <div className="ob-phone-row">
              <div className="ob-field" style={{ width: '100%' }}>
                <label className="ob-label">Phone number</label>
                <input
                  className="ob-input"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  type="tel"
                  autoFocus
                />
              </div>
              <button className="ob-request-code-btn">Request Code</button>
            </div>
          </>
        )}
      </div>

      <div className="ob-footer">
        {step > 1 && (
          <button className="ob-btn-back" onClick={() => setStep(s => s - 1)}>
            ← Back
          </button>
        )}
        <button className="ob-btn-next" onClick={handleNext} disabled={!canNext()}>
          {step === 5 ? 'Finish' : 'Next'} →
        </button>
      </div>
    </div>
  );
};

export default DJOnboarding;
