import React, { useState } from 'react';
import { Event } from '../types';
import './HistoryView.css';

interface HistoryViewProps {
  events: Event[];
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function statusLabel(status?: string) {
  switch (status) {
    case 'confirmed': return 'Confirmed';
    case 'open': return 'Interest check';
    case 'offered': return 'Booking request';
    case 'declined': return 'Declined';
    default: return 'Created';
  }
}

const HistoryView: React.FC<HistoryViewProps> = ({ events }) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const goToPreviousMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const goToNextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthEvents = events.filter(e => {
    const d = new Date(e.date);
    d.setHours(0, 0, 0, 0);
    return d < today &&
      d.getMonth() === currentMonth.getMonth() &&
      d.getFullYear() === currentMonth.getFullYear();
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="history-view">
      <div className="history-header">
        <h1 className="history-title">History</h1>
        <div className="month-selector">
          <button className="month-nav-btn" onClick={goToPreviousMonth}>‹</button>
          <span className="current-month-label">
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button className="month-nav-btn" onClick={goToNextMonth}>›</button>
        </div>
        <span className="history-count">{monthEvents.length} event{monthEvents.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="history-content">
        {monthEvents.length === 0 ? (
          <div className="empty-history">
            <p>No events in {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}.</p>
          </div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Event</th>
                <th>Dance floor</th>
                <th>Artist</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {monthEvents.map(event => {
                const d = new Date(event.date);
                const dateStr = event.selectedDates && event.selectedDates.length > 1
                  ? `${event.selectedDates.length} dates`
                  : `${String(d.getDate()).padStart(2,'0')} ${MONTHS_SHORT[d.getMonth()]}`;
                const artists = [
                  ...(event.interestChecks || []),
                  ...(event.bookingRequests || []),
                ];
                if (event.artistName && artists.length === 0) {
                  artists.push({ artistId: event.artistId || '', artistName: event.artistName });
                }
                const artistDisplay = artists.length === 0 ? '—'
                  : artists.length === 1 ? artists[0].artistName
                  : `${artists[0].artistName} +${artists.length - 1}`;
                return (
                  <tr key={event.id}>
                    <td className="hist-date">{dateStr} · {event.startTime}–{event.endTime}</td>
                    <td className="hist-name">{event.name || 'Untitled Event'}</td>
                    <td>{event.danceFloor || event.venue || '—'}</td>
                    <td>{artistDisplay}</td>
                    <td>
                      <span className={`hist-status hist-status-${event.status || 'created'}`}>
                        {statusLabel(event.status)}
                      </span>
                    </td>
                    <td className="hist-amount">{event.amount ? `${event.amount.toLocaleString()} SEK` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HistoryView;
