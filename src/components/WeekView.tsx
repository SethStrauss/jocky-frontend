import React, { useState } from 'react';
import { Event, Artist } from '../types';
import './WeekView.css';

interface WeekViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  events: Event[];
  onCreateEvent: (date: Date, time?: string) => void;
  onEventClick?: (event: Event, clickedDate?: Date) => void;
  viewMode: 'week' | 'month';
  onViewModeChange: (mode: 'week' | 'month') => void;
  artists?: Artist[];
}

const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  onDateChange,
  events,
  onCreateEvent,
  onEventClick,
  artists,
  viewMode,
  onViewModeChange
}) => {
  const [displayMode, setDisplayMode] = useState<'list' | 'calendar'>('calendar');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Time slots from 14:00 to 23:00
  const timeSlots = Array.from({ length: 10 }, (_, i) => 14 + i);

  // Get week number
  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Get days of current week (Monday to Sunday)
  const getWeekDays = () => {
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay() + 1; // First day is Monday
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(curr.setDate(first + i));
      week.push(day);
    }
    return week;
  };

  const weekDays = getWeekDays();
  const weekNumber = getWeekNumber(currentDate);

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    onDateChange(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date(2026, 1, 20)); // February 20th, 2026
  };

  return (
    <div className="week-view">
      {/* Header */}
      <div className="week-header">
        <div className="week-header-left">
          <h1 className="week-title">Events</h1>
          
          <div className="view-mode-toggle">
            <button
              className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => onViewModeChange('week')}
            >
              Week
            </button>
            <button
              className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => onViewModeChange('month')}
            >
              Month
            </button>
          </div>
        </div>

        <div className="week-header-right">
          <button
            className={`display-mode-btn ${displayMode === 'list' ? 'active' : ''}`}
            onClick={() => setDisplayMode('list')}
            title="List view"
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            className={`display-mode-btn ${displayMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setDisplayMode('calendar')}
            title="Calendar view"
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </button>

          <button className="btn-create-event" onClick={() => onCreateEvent(currentDate)}>
            <span className="plus-icon">+</span>
            Create Event
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="week-navigation">
        <h2 className="week-date-title">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()} / w.{weekNumber}
        </h2>

        <div className="week-controls">
          <button className="nav-arrow" onClick={goToPreviousWeek}>
            ‹
          </button>
          <button className="btn-today" onClick={goToToday}>
            Today
          </button>
          <button className="nav-arrow" onClick={goToNextWeek}>
            ›
          </button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="week-grid-container">
        <div className="week-grid">
          {/* Empty corner cell */}
          <div className="time-column-header"></div>

          {/* Day headers */}
          {weekDays.map((day, index) => (
            <div key={index} className="week-day-header">
              <div className="day-name">{weekDayNames[index]}</div>
              <div className="day-date">{day.getDate()}</div>
            </div>
          ))}

          {/* Time rows */}
          {timeSlots.map((hour) => (
            <React.Fragment key={hour}>
              {/* Time label */}
              <div className="time-label">
                {String(hour).padStart(2, '0')}:00
              </div>

              {/* Day cells */}
              {weekDays.map((day, dayIndex) => {
                const dayStr = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
                const cellEvents = events.filter(e => {
                  const eventHour = parseInt(e.startTime.split(':')[0]);
                  if (eventHour !== hour) return false;
                  if (e.selectedDates && e.selectedDates.length > 0) {
                    return e.selectedDates.includes(dayStr);
                  }
                  const eventDate = new Date(e.date);
                  return eventDate.getDate() === day.getDate() &&
                         eventDate.getMonth() === day.getMonth() &&
                         eventDate.getFullYear() === day.getFullYear();
                });

                return (
                  <div
                    key={`${hour}-${dayIndex}`}
                    className="week-time-cell"
                    onClick={() => {
                      // Create date with specific time to avoid timezone issues
                      const clickDate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0);
                      const timeStr = `${String(hour).padStart(2, '0')}:00`;
                      onCreateEvent(clickDate, timeStr);
                    }}
                  >
                    {cellEvents.map(event => {
                      const status = event.status || 'open';
                      const timeStr = (t: string) => t ? t.slice(0, 5) : '';
                      return (
                        <div 
                          key={event.id} 
                          className={`week-event-badge week-event-status-${status}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEventClick) onEventClick(event, day);
                          }}
                        >
                          {event.artistName && (
                            <div className="event-tooltip">
                              <div className="event-tooltip-avatar">🎧</div>
                              <div className="event-tooltip-name">{event.artistName}</div>
                            </div>
                          )}
                          <div className="week-event-top-row">
                            <div className="week-event-name">{event.name}</div>
                            {event.artistName && (() => {
                              const photo = artists?.find(a => a.id === event.artistId)?.image || '';
                              return (
                                <div className="week-event-dj-avatar" title={event.artistName}
                                  style={photo ? { backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : undefined}>
                                  {!photo && event.artistName.charAt(0).toUpperCase()}
                                </div>
                              );
                            })()}
                          </div>
                          <div className="week-event-time">{timeStr(event.startTime)} - {timeStr(event.endTime)}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekView;
