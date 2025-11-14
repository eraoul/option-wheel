'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Trade } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface TradeListProps {
  limit?: number;
  refreshKey?: number;
}

export function TradeList({ limit, refreshKey }: TradeListProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrades();
  }, [limit, refreshKey]);

  const fetchTrades = async () => {
    try {
      const response = await fetch('/api/trades');
      if (response.ok) {
        const data = await response.json();
        setTrades(limit ? data.slice(0, limit) : data);
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      OPEN: 'default',
      CLOSED: 'secondary',
      ASSIGNED: 'outline',
      EXPIRED: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const calculatePremiumCollected = (trade: Trade) => {
    return trade.premium * trade.quantity * 100;
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading trades...</div>;
  }

  if (trades.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No trades yet. Add your first trade to get started!
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticker</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Strike</TableHead>
          <TableHead>Expiration</TableHead>
          <TableHead>Premium</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Total Premium</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.map((trade) => (
          <TableRow key={trade.id}>
            <TableCell className="font-medium">{trade.ticker}</TableCell>
            <TableCell>
              <Badge variant={trade.type === 'PUT' ? 'default' : 'secondary'}>
                {trade.type}
              </Badge>
            </TableCell>
            <TableCell>${trade.strike}</TableCell>
            <TableCell>{formatDate(trade.expiration)}</TableCell>
            <TableCell>${trade.premium.toFixed(2)}</TableCell>
            <TableCell>{trade.quantity}</TableCell>
            <TableCell className="font-medium">
              {formatCurrency(calculatePremiumCollected(trade))}
            </TableCell>
            <TableCell>{getStatusBadge(trade.status)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
