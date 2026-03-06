import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Event, Artist } from '../types';
import './CalendarView.css';

interface CalendarViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  events: Event[];
  onCreateEvent: (date: Date, time?: string) => void;
  onEventClick?: (event: Event, clickedDate?: Date) => void;
  onEventDateChange?: (eventId: string, newDate: Date) => void;
  viewMode: 'week' | 'month';
  onViewModeChange: (mode: 'week' | 'month') => void;
  onOpenBookArtist?: () => void;
  artists?: Artist[];
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function statusLabel(status?: string) {
  switch (status) {
    case 'open': return 'Interest check';
    case 'offered': return 'Booking request';
    case 'confirmed': return 'Confirmed';
    case 'declined': return 'Declined';
    default: return 'Created';
  }
}

const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  onDateChange,
  events,
  onCreateEvent,
  onEventClick,
  onEventDateChange,
  viewMode,
  onViewModeChange,
  onOpenBookArtist,
  artists,
}) => {
  const [displayMode, setDisplayMode] = useState<'list' | 'calendar'>('calendar');
  const [popupEvent, setPopupEvent] = useState<Event | null>(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag state (refs for handlers, state for rendering)
  const dragStartRef = useRef<{ event: Event; startX: number; startY: number } | null>(null);
  const draggingRef = useRef<{ event: Event; x: number; y: number } | null>(null);
  const dragOverDayRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const [dragState, setDragState] = useState<{ event: Event; x: number; y: number } | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const { event, startX, startY } = dragStartRef.current;
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (dist > 5 || draggingRef.current) {
        const next = { event, x: e.clientX, y: e.clientY };
        draggingRef.current = next;
        didDragRef.current = true;
        setDragState(next);
        setPopupEvent(null);
      }
    };
    const handleMouseUp = () => {
      if (draggingRef.current && dragOverDayRef.current !== null) {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dragOverDayRef.current);
        onEventDateChange?.(draggingRef.current.event.id, newDate);
      }
      dragStartRef.current = null;
      draggingRef.current = null;
      dragOverDayRef.current = null;
      setDragState(null);
      setDragOverDay(null);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [currentDate, onEventDateChange]);

  const showPopup = (ev: Event, el: HTMLElement) => {
    if (hideRef.current) clearTimeout(hideRef.current);
    const r = el.getBoundingClientRect();
    setPopupPos({
      x: Math.min(r.left, window.innerWidth - 350),
      y: r.bottom + 8,
    });
    setPopupEvent(ev);
  };

  const hidePopup = () => {
    hideRef.current = setTimeout(() => setPopupEvent(null), 80);
  };

  const keepPopup = () => {
    if (hideRef.current) clearTimeout(hideRef.current);
  };

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(i);
    return days;
  };

  const days = getDaysInMonth();
  const today = new Date();

  const goToPreviousMonth = () => onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNextMonth = () => onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => onDateChange(new Date());

  return (
    <div className="calendar-view">
      {/* Header */}
      <div className="calendar-header">
        <div className="calendar-header-left">
          <h1 className="calendar-title">Events</h1>
          <div className="view-mode-toggle">
            <button className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`} onClick={() => onViewModeChange('week')}>Week</button>
            <button className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => onViewModeChange('month')}>Month</button>
          </div>
        </div>
        <div className="calendar-header-right">
          <button className={`display-mode-btn ${displayMode === 'list' ? 'active' : ''}`} onClick={() => setDisplayMode('list')} title="List view">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
          </button>
          <button className={`display-mode-btn ${displayMode === 'calendar' ? 'active' : ''}`} onClick={() => setDisplayMode('calendar')} title="Calendar view">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
          </button>
          <button className="btn-book-artist" onClick={onOpenBookArtist}>Book artist</button>
          <button className="btn-create-event" onClick={() => onCreateEvent(currentDate)}>+ Create Event</button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="month-navigation">
        <h2 className="month-title">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
        <div className="month-controls">
          <button className="nav-arrow" onClick={goToPreviousMonth}>‹</button>
          <button className="btn-today" onClick={goToToday}>Today</button>
          <button className="nav-arrow" onClick={goToNextMonth}>›</button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid-container">
        <div className="calendar-grid">
          {weekDays.map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
          {days.map((day, index) => {
            const cellDate = day !== null ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
            const cellStr = cellDate
              ? `${cellDate.getFullYear()}-${String(cellDate.getMonth()+1).padStart(2,'0')}-${String(cellDate.getDate()).padStart(2,'0')}`
              : '';
            const dayEvents = cellDate ? events.filter(e => {
              if (e.selectedDates && e.selectedDates.length > 0) {
                return e.selectedDates.includes(cellStr);
              }
              const ed = new Date(e.date);
              return ed.getDate() === cellDate.getDate() && ed.getMonth() === cellDate.getMonth() && ed.getFullYear() === cellDate.getFullYear();
            }) : [];
            const isDragOver = dragState && dragOverDay === day && day !== null;
            return (
              <div
                key={index}
                className={`calendar-day-cell ${day === null ? 'empty' : ''} ${day !== null && day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear() ? 'today' : ''} ${isDragOver ? 'drag-over' : ''}`}
                onClick={() => { if (day !== null && !didDragRef.current) onCreateEvent(new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 12, 0, 0)); didDragRef.current = false; }}
                onMouseEnter={() => { if (draggingRef.current && day !== null) { dragOverDayRef.current = day; setDragOverDay(day); } }}
                onMouseLeave={() => { if (draggingRef.current) { dragOverDayRef.current = null; setDragOverDay(null); } }}
              >
                {day !== null && (
                  <>
                    <div className="day-number">{day}</div>
                    <div className="day-events">
                      {dayEvents.map(ev => (
                        <div
                          key={ev.id}
                          className={`event-badge event-status-${ev.status || 'created'} ${dragState?.event.id === ev.id ? 'is-dragging' : ''}`}
                          onMouseDown={(e) => { e.stopPropagation(); didDragRef.current = false; dragStartRef.current = { event: ev, startX: e.clientX, startY: e.clientY }; }}
                          onClick={(e) => { e.stopPropagation(); if (!didDragRef.current) onEventClick?.(ev, cellDate || undefined); didDragRef.current = false; }}
                          onMouseEnter={(e) => { if (!draggingRef.current) showPopup(ev, e.currentTarget); }}
                          onMouseLeave={hidePopup}
                        >
                          <span className="event-time">{ev.startTime}</span>
                          <span className="event-name">{ev.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Legend */}
      <div className="status-legend">
        <div className="legend-item legend-created">Created</div>
        <div className="legend-item legend-open">Open</div>
        <div className="legend-item legend-offered">Offered</div>
        <div className="legend-item legend-confirmed">Confirmed</div>
        <div className="legend-item legend-declined">Declined</div>
      </div>

      {/* Drag ghost */}
      {dragState && ReactDOM.createPortal(
        <div
          className={`event-drag-ghost event-status-${dragState.event.status || 'created'}`}
          style={{ position: 'fixed', left: dragState.x + 12, top: dragState.y - 16, pointerEvents: 'none', zIndex: 9999 }}
        >
          <span className="event-time">{dragState.event.startTime}</span>
          <span className="event-name">{dragState.event.name}</span>
        </div>,
        document.body
      )}

      {/* Popup portal */}
      {popupEvent && ReactDOM.createPortal(
        <EventPopup
          ev={popupEvent}
          x={popupPos.x}
          y={popupPos.y}
          onMouseEnter={keepPopup}
          onMouseLeave={hidePopup}
          onEdit={() => { setPopupEvent(null); onEventClick?.(popupEvent); }}
          artists={artists}
        />,
        document.body
      )}
    </div>
  );
};

function EventPopup({ ev, x, y, onMouseEnter, onMouseLeave, onEdit, artists: poolArtists }: {
  ev: Event; x: number; y: number;
  onMouseEnter: () => void; onMouseLeave: () => void; onEdit: () => void;
  artists?: Artist[];
}) {
  const artists = ev.status === 'confirmed'
    ? (ev.artistId ? [{ artistId: ev.artistId, artistName: ev.artistName || '' }] : [])
    : ev.status === 'offered'
    ? (ev.bookingRequests || [])
    : (ev.interestChecks || []);
  const d = new Date(ev.date);
  const dateStr = `${d.getDate()}. ${MONTHS[d.getMonth()]}`;

  return (
    <div
      className="event-popup"
      style={{ position: 'fixed', left: x, top: y }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="ep-header">
        <span className="ep-date">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          {dateStr}
        </span>
        <div className="ep-header-right">
          <span className={`ep-status ep-status-${ev.status || 'created'}`}>{statusLabel(ev.status)}</span>
          <button className="ep-edit" onClick={onEdit}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      </div>

      <div className="ep-title">{ev.venue} {ev.startTime} – {ev.endTime}</div>
      <div className="ep-subtitle">{ev.name}</div>

      {artists.length > 0 && (
        <>
          <div className="ep-divider" />
          <div className="ep-artists">
            {artists.map((a, i) => {
              const photo = poolArtists?.find(p => p.id === a.artistId)?.image || '';
              return (
              <div key={i} className="ep-artist-row">
                <div className="ep-avatar">
                  {photo
                    ? <img src={photo} alt={a.artistName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                    : a.artistName.charAt(0).toUpperCase()
                  }
                </div>
                <span className="ep-artist-name">{a.artistName}</span>
                <span className={`ep-dot ${
                  ev.status === 'confirmed' ? 'ep-dot-green'
                  : (a as any).djResponse === 'interested' ? 'ep-dot-blue'
                  : (a as any).djResponse === 'declined' ? 'ep-dot-red'
                  : ev.status === 'offered' ? 'ep-dot-blue'
                  : 'ep-dot-grey'
                }`} />
              </div>
              );
            })}
          </div>
        </>
      )}

      {ev.status === 'open' && (
        <button className="ep-action">Select artist to send offer to</button>
      )}
    </div>
  );
}

export default CalendarView;
