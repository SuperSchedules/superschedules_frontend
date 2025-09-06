import React from 'react';

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}

export default function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const isCompleteDate = (v: string) => /^(\d{4})-(\d{2})-(\d{2})$/.test(v);
  const clampToToday = (v: string) => (v && v < todayStr ? todayStr : v);

  return (
    <div className="date-range-selector">
      <div className="date-range-inputs">
        <div className="date-input-group">
          <label htmlFor="date-from">From:</label>
          <input
            id="date-from"
            type="date"
            value={from}
            onChange={(e) => {
              onChange({ from: e.target.value, to });
            }}
            onBlur={() => {
              let v = from;
              if (!isCompleteDate(v)) v = todayStr;
              v = clampToToday(v);
              let newFrom = v;
              let newTo = to;
              if (newTo && newFrom && newFrom > newTo) newTo = newFrom;
              if (newFrom !== from || newTo !== to) onChange({ from: newFrom, to: newTo });
            }}
          />
        </div>
        <div className="date-input-group">
          <label htmlFor="date-to">To:</label>
          <input
            id="date-to"
            type="date"
            value={to}
            onChange={(e) => {
              onChange({ from, to: e.target.value });
            }}
            onBlur={() => {
              let v = to;
              if (!isCompleteDate(v)) v = todayStr;
              v = clampToToday(v);
              let newTo = v;
              let newFrom = from;
              if (newTo && newFrom && newTo < newFrom) newFrom = newTo;
              if (newFrom !== from || newTo !== to) onChange({ from: newFrom, to: newTo });
            }}
          />
        </div>
      </div>
    </div>
  );
}

