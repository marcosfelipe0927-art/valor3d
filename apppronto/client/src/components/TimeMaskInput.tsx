import React, { useState } from 'react';
import { Input } from '@/components/ui/input';

interface TimeMaskInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDarkMode?: boolean;
}

export const TimeMaskInput: React.FC<TimeMaskInputProps> = ({
  value,
  onChange,
  placeholder = "00:00",
  isDarkMode = false,
}) => {
  const [displayValue, setDisplayValue] = useState(value === '0' ? '' : value);

  const formatTimeInput = (input: string): string => {
    // Remove tudo que não é número
    const numbers = input.replace(/\D/g, '');
    
    if (numbers.length === 0) return '';
    if (numbers.length === 1) return numbers;
    if (numbers.length === 2) return numbers;
    
    // Formata como HH:mm
    const hours = numbers.substring(0, 2);
    const minutes = numbers.substring(2, 4);
    
    return `${hours}:${minutes}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatTimeInput(input);
    setDisplayValue(formatted);

    // Converte para valor decimal (horas.minutos)
    if (formatted.includes(':')) {
      const [hours, minutes] = formatted.split(':');
      const totalHours = parseInt(hours) + parseInt(minutes) / 60;
      onChange(totalHours.toString());
    } else if (formatted) {
      onChange(formatted);
    } else {
      onChange('0');
    }
  };

  React.useEffect(() => {
    if (value === '0' || value === '') {
      setDisplayValue('');
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permite apenas números, backspace, delete, tab
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'];
    if (!/\d/.test(e.key) && !allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <Input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      maxLength={5}
      className={`mt-1 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
    />
  );
};
