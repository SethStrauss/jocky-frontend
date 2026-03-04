import React, { useState, useEffect, useRef } from 'react';
import './DateRangePicker.css';

interface DateRangePickerProps {
  selectedDates: string[];
  onSelectedDatesChange: (dates: string[]) => void;
  onClose: () => void;
  onClear?: () => void;
}

const DAY_LABELS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function toStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}


function localStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDatesInRange(a: string, b: string): string[] {
  const dates: string[] = [];
  const lo = a < b ? a : b;
  const hi = a < b ? b : a;
  // Parse as local midnight to avoid UTC timezone shift
  const [ly, lm, ld] = lo.split('-').map(Number);
  const [hy, hm, hd] = hi.split('-').map(Number);
  const cur = new Date(ly, lm - 1, ld);
  const end = new Date(hy, hm - 1, hd);
  while (cur <= end) {
    dates.push(localStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  selectedDates, onSelectedDatesChange, onClose, onClear,
}) => {
  const today = new Date();
  const initYear = selectedDates.length > 0 ? parseInt(selectedDates[0].split('-')[0]) : today.getFullYear();
  const initMonth = selectedDates.length > 0 ? parseInt(selectedDates[0].split('-')[1]) - 1 : today.getMonth();

  const [leftYear, setLeftYear] = useState(initYear);
  const [leftMonth, setLeftMonth] = useState(initMonth);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const [dragAction, setDragAction] = useState<'add' | 'remove'>('add');

  // Refs to avoid stale closures in window mouseup handler
  const isDraggingRef = useRef(isDragging);
  const dragStartRef = useRef(dragStart);
  const dragEndRef = useRef(dragEnd);
  const dragActionRef = useRef(dragAction);
  const selectedDatesRef = useRef(selectedDates);
  isDraggingRef.current = isDragging;
  dragStartRef.current = dragStart;
  dragEndRef.current = dragEnd;
  dragActionRef.current = dragAction;
  selectedDatesRef.current = selectedDates;

  const goBack = () => {
    const d = new Date(leftYear, leftMonth - 1, 1);
    setLeftYear(d.getFullYear()); setLeftMonth(d.getMonth());
  };
  const goForward = () => {
    const d = new Date(leftYear, leftMonth + 1, 1);
    setLeftYear(d.getFullYear()); setLeftMonth(d.getMonth());
  };

  const dragPreviewDates = isDragging && dragStart && dragEnd
    ? new Set(getDatesInRange(dragStartRef.current ?? dragStart, dragEndRef.current ?? dragEnd))
    : new Set<string>();

  const handleMouseDown = (dateStr: string, e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartRef.current = dateStr;
    dragEndRef.current = dateStr;
    const action = selectedDates.includes(dateStr) ? 'remove' : 'add';
    dragActionRef.current = action;
    setIsDragging(true);
    setDragStart(dateStr);
    setDragEnd(dateStr);
    setDragAction(action);
  };

  const handleMouseEnter = (dateStr: string) => {
    if (isDraggingRef.current) {
      dragEndRef.current = dateStr;
      setDragEnd(dateStr);
    }
  };

  useEffect(() => {
    const handleWindowMouseUp = () => {
      if (!isDraggingRef.current) return;
      const start = dragStartRef.current;
      const end = dragEndRef.current;
      if (start && end) {
        const range = getDatesInRange(start, end);
        const current = selectedDatesRef.current;
        if (dragActionRef.current === 'add') {
          const merged = Array.from(new Set([...current, ...range])).sort();
          onSelectedDatesChange(merged);
        } else {
          onSelectedDatesChange(current.filter(d => !range.includes(d)));
        }
      }
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    };
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => window.removeEventListener('mouseup', handleWindowMouseUp);
  }, [onSelectedDatesChange]);

  const renderMonth = (year: number, month: number) => {
    const cells = getCalendarDays(year, month);
    return (
      <div className="drp-month">
        <div className="drp-month-title">{MONTH_NAMES[month]} {year}</div>
        <div className="drp-day-headers">
          {DAY_LABELS.map(l => <div key={l} className="drp-day-header">{l}</div>)}
        </div>
        <div className="drp-days-grid">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="drp-cell drp-cell--empty" />;
            const d = toStr(year, month, day);
            const isSelected = selectedDates.includes(d);
            const inPreview = dragPreviewDates.has(d);
            const previewAdding = inPreview && dragAction === 'add' && !isSelected;
            const previewRemoving = inPreview && dragAction === 'remove' && isSelected;
            const finalSelected = isSelected && !previewRemoving;
            return (
              <div
                key={i}
                className={[
                  'drp-cell',
                  finalSelected ? 'drp-cell--selected' : '',
                  previewAdding ? 'drp-cell--preview-add' : '',
                  previewRemoving ? 'drp-cell--preview-remove' : '',
                ].filter(Boolean).join(' ')}
                onMouseDown={(e) => handleMouseDown(d, e)}
                onMouseEnter={() => handleMouseEnter(d)}
              >
                <span className="drp-day-num">{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="drp-container" onClick={e => e.stopPropagation()}>
      <div className="drp-calendars">
        <button className="drp-nav drp-nav--left" onMouseDown={e => e.preventDefault()} onClick={goBack}>‹</button>
        {renderMonth(leftYear, leftMonth)}
        <button className="drp-nav drp-nav--right" onMouseDown={e => e.preventDefault()} onClick={goForward}>›</button>
      </div>
      <div className="drp-footer">
        <span className="drp-count">{selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected</span>
        <button className="drp-clear" onClick={() => { onSelectedDatesChange([]); onClear?.(); }}>Clear all</button>
        <button className="drp-close" onClick={onClose}>Done</button>
      </div>
    </div>
  );
};

export default DateRangePicker;
