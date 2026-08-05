import React, { useState } from 'react';

const formatTimeHHMM = (val) => {
  if (!val) return '';
  const parts = val.split(':');
  if (parts.length >= 2) {
    return `${parts[0].substring(0, 2).padStart(2, '0')}:${parts[1].substring(0, 2).padStart(2, '0')}`;
  }
  return val;
};

const TimePicker = ({ value, onChange, onBlur, placeholder = "00:00", className = "" }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [internalValue, setInternalValue] = useState(formatTimeHHMM(value) || '');

  if (value !== prevValue) {
    setPrevValue(value);
    setInternalValue(formatTimeHHMM(value) || '');
  }

  const handleChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    if (val.length > 4) val = val.substring(0, 4);

    if (val.length > 2) {
      val = val.substring(0, 2) + ':' + val.substring(2);
    }

    setInternalValue(val);
    
    // Basic format validation HH:MM
    if (val.length === 5) {
      const [hours, minutes] = val.split(':').map(Number);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        onChange(val);
      }
    } else if (val === '') {
      onChange('');
    }
  };

  return (
    <input
      type="text"
      value={internalValue}
      onChange={handleChange}
      onBlur={onBlur}
      placeholder={placeholder}
      maxLength={5}
      className={`px-4 py-3 bg-[#f4ebf6] border-b-2 border-transparent focus:border-[#631660] transition-all outline-none rounded-t-lg font-mono font-bold text-center text-lg ${className}`}
    />
  );
};

export default TimePicker;
