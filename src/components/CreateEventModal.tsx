import React, { useState } from 'react';
import { Event } from '../types';
import './CreateEventModal.css';

interface CreateEventModalProps {
  onClose: () => void;
  onCreate: (event: Event) => void;
  initialDate: Date;
  initialTime?: string;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  onClose,
  onCreate,
  initialDate,
  initialTime
}) => {
  const [eventName, setEventName] = useState('');
  const [frequency, setFrequency] = useState<'single' | 'multiple'>('single');
  const [eventDate, setEventDate] = useState(
    initialDate.toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState(initialTime || '20:00');
  const [endTime, setEndTime] = useState('23:00');
  const [danceFloor, setDanceFloor] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [openForRequests, setOpenForRequests] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newEvent: Event = {
      id: Date.now().toString(),
      name: eventName,
      date: new Date(eventDate),
      startTime,
      endTime,
      danceFloor,
      amount: parseFloat(amount) || 0,
      notes,
      frequency,
      status: openForRequests ? 'open' : 'offered',
      openForRequests,
    };

    onCreate(newEvent);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : 
                   day === 2 || day === 22 ? 'nd' : 
                   day === 3 || day === 23 ? 'rd' : 'th';
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${day}${suffix}, ${date.getFullYear()}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create new Event</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Event Name */}
          <div className="form-group">
            <label className="form-label">Event name</label>
            <input
              type="text"
              className="form-input"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
            />
          </div>

          {/* Frequency */}
          <div className="form-group">
            <label className="form-label">Frequency</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="frequency"
                  value="single"
                  checked={frequency === 'single'}
                  onChange={() => setFrequency('single')}
                />
                <span className="radio-text">Single event</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="frequency"
                  value="multiple"
                  checked={frequency === 'multiple'}
                  onChange={() => setFrequency('multiple')}
                />
                <span className="radio-text">Multiple events</span>
              </label>
            </div>
          </div>

          {/* Open for Artist Requests */}
          <div className="form-group">
            <label className="form-label">Booking Method</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="bookingMethod"
                  checked={openForRequests === true}
                  onChange={() => setOpenForRequests(true)}
                />
                <span className="radio-text">Post on marketplace</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="bookingMethod"
                  checked={openForRequests === false}
                  onChange={() => setOpenForRequests(false)}
                />
                <span className="radio-text">Invite specific artist</span>
              </label>
            </div>
          </div>

          {/* Artist Selection - Only show if "Invite specific artist" is selected */}
          {!openForRequests && (
            <div className="form-group">
              <label className="form-label">Select Artist</label>
              <select className="form-select" required>
                <option value="">Choose an artist...</option>
                <option value="1">DJ Terka - House, Techno</option>
                <option value="2">AronChupa - House, EDM</option>
                <option value="3">Malcomba - Disco, Funk</option>
              </select>
            </div>
          )}

          {/* Event Date */}
          <div className="form-group">
            <label className="form-label">Event date</label>
            <div className="date-display">
              {formatDate(eventDate)}
              <input
                type="date"
                className="date-input-hidden"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
              <svg className="calendar-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Start Time */}
          <div className="form-group">
            <label className="form-label">Start</label>
            <select
              className="form-select"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            >
              {Array.from({ length: 24 }, (_, i) => {
                const hour = String(i).padStart(2, '0');
                return (
                  <option key={hour} value={`${hour}:00`}>
                    {hour}:00
                  </option>
                );
              })}
            </select>
          </div>

          {/* End Time */}
          <div className="form-group">
            <label className="form-label">End</label>
            <select
              className="form-select"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            >
              {Array.from({ length: 24 }, (_, i) => {
                const hour = String(i).padStart(2, '0');
                return (
                  <option key={hour} value={`${hour}:00`}>
                    {hour}:00
                  </option>
                );
              })}
            </select>
          </div>

          {/* Dance Floor */}
          <div className="form-group">
            <label className="form-label">Dance floor</label>
            <select
              className="form-select"
              value={danceFloor}
              onChange={(e) => setDanceFloor(e.target.value)}
            >
              <option value="">Choose a dancefloor</option>
              <option value="main">Main Floor</option>
              <option value="vip">VIP Area</option>
              <option value="rooftop">Rooftop</option>
            </select>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label">Amount in SEK</label>
            <input
              type="number"
              className="form-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes about the event</label>
            <textarea
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button type="submit" className="btn-submit">
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
