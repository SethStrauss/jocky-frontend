import React, { useState } from 'react';
import './HistoryView.css';

const HistoryView: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="history-view">
      <div className="history-header">
        <h1 className="history-title">History</h1>

        <div className="month-selector">
          <button className="month-nav-btn" onClick={goToPreviousMonth}>
            ‹
          </button>
          <span className="current-month-label">
            {monthNames[currentMonth.getMonth()]}
          </span>
          <button className="month-nav-btn" onClick={goToNextMonth}>
            ›
          </button>
        </div>
      </div>

      <div className="history-content">
        <div className="empty-history">
          <p>No events in this month.</p>
        </div>
      </div>
    </div>
  );
};

export default HistoryView;
