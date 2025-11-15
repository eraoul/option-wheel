'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface TickerInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

export function TickerInput({
  value,
  onChange,
  placeholder = "AAPL",
  required = false,
  className = "",
  id = "ticker"
}: TickerInputProps) {
  const [tickers, setTickers] = useState<string[]>([]);

  useEffect(() => {
    // Fetch available tickers for autocomplete
    fetch('/api/tickers')
      .then(res => res.json())
      .then(data => setTickers(data.tickers || []))
      .catch(err => console.error('Failed to fetch tickers:', err));
  }, []);

  return (
    <>
      <Input
        id={id}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        required={required}
        list={`${id}-datalist`}
        autoComplete="off"
      />
      <datalist id={`${id}-datalist`}>
        {tickers.map(ticker => (
          <option key={ticker} value={ticker} />
        ))}
      </datalist>
    </>
  );
}
