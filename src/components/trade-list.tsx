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
import type { Trade, CurrentPrice } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Pencil, Repeat, X } from 'lucide-react';
import { TradeForm } from './trade-form';
import { CloseTradeDialog } from './close-trade-dialog';
import { RollTradeDialog } from './roll-trade-dialog';

interface TradeListProps {
  limit?: number;
  refreshKey?: number;
}

export function TradeList({ limit, refreshKey }: TradeListProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [prices, setPrices] = useState<Record<string, CurrentPrice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [closingTrade, setClosingTrade] = useState<Trade | null>(null);
  const [rollingTrade, setRollingTrade] = useState<Trade | null>(null);

  useEffect(() => {
    fetchData();
  }, [limit, refreshKey]);

  const fetchData = async () => {
    try {
      // Fetch trades
      const tradesResponse = await fetch('/api/trades');
      if (tradesResponse.ok) {
        const data = await tradesResponse.json();
        setTrades(limit ? data.slice(0, limit) : data);

        // Fetch prices for all tickers
        const pricesResponse = await fetch('/api/prices');
        if (pricesResponse.ok) {
          const pricesData = await pricesResponse.json();
          const pricesMap: Record<string, CurrentPrice> = {};
          pricesData.forEach((price: CurrentPrice) => {
            pricesMap[price.ticker] = price;
          });
          setPrices(pricesMap);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    setEditingTrade(null);
    setClosingTrade(null);
    setRollingTrade(null);
    fetchData();
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
      ROLLED: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      SELL_TO_OPEN: 'bg-green-100 text-green-800',
      BUY_TO_CLOSE: 'bg-red-100 text-red-800',
      BUY_TO_OPEN: 'bg-blue-100 text-blue-800',
      SELL_TO_CLOSE: 'bg-orange-100 text-orange-800',
    };
    const labels: Record<string, string> = {
      SELL_TO_OPEN: 'STO',
      BUY_TO_CLOSE: 'BTC',
      BUY_TO_OPEN: 'BTO',
      SELL_TO_CLOSE: 'STC',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[action] || 'bg-gray-100 text-gray-800'}`}>
        {labels[action] || action}
      </span>
    );
  };

  const calculatePremiumCollected = (trade: Trade) => {
    return trade.premium * trade.quantity * 100;
  };

  const calculateNetPnL = (trade: Trade) => {
    const collected = trade.premium * trade.quantity * 100;
    const paid = (trade.closePremium || 0) * trade.quantity * 100;
    return collected - paid;
  };

  const calculateDTE = (expirationDate: string) => {
    const now = new Date();
    const exp = new Date(expirationDate);
    const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const calculateUnrealizedPnL = (trade: Trade) => {
    if (trade.status !== 'OPEN') return null;

    const price = prices[trade.ticker];
    if (!price || !price.optionPrice) return null;

    // For SELL_TO_OPEN: profit if current price < premium collected
    // For BUY_TO_OPEN: profit if current price > premium paid
    const premiumValue = trade.premium * trade.quantity * 100;
    const currentValue = price.optionPrice * trade.quantity * 100;

    let unrealizedPnL: number;
    if (trade.action === 'SELL_TO_OPEN' || trade.action === 'SELL_TO_CLOSE') {
      // Sold option: profit if current price is lower
      unrealizedPnL = premiumValue - currentValue;
    } else {
      // Bought option: profit if current price is higher
      unrealizedPnL = currentValue - premiumValue;
    }

    return unrealizedPnL;
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
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Strike</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>DTE</TableHead>
              <TableHead>Premium</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Unrealized P/L</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => {
              const dte = calculateDTE(trade.expiration);
              const unrealizedPnL = calculateUnrealizedPnL(trade);

              return (
                <TableRow key={trade.id}>
                  <TableCell className="font-medium">{trade.ticker}</TableCell>
                  <TableCell>
                    <Badge variant={trade.type === 'PUT' ? 'default' : 'secondary'}>
                      {trade.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{getActionBadge(trade.action)}</TableCell>
                  <TableCell>${trade.strike}</TableCell>
                  <TableCell>{formatDate(trade.expiration)}</TableCell>
                  <TableCell>{dte}d</TableCell>
                  <TableCell>${trade.premium.toFixed(2)}</TableCell>
                  <TableCell>{trade.quantity}</TableCell>
                  <TableCell className="font-medium">
                    <div>{formatCurrency(calculatePremiumCollected(trade))}</div>
                    {trade.closePremium !== null && trade.closePremium !== undefined && (
                      <div className={`text-xs ${calculateNetPnL(trade) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        P/L: {formatCurrency(calculateNetPnL(trade))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {unrealizedPnL !== null ? (
                      <span className={unrealizedPnL >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {formatCurrency(unrealizedPnL)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(trade.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTrade(trade)}
                        title="Edit trade"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {trade.status === 'OPEN' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRollingTrade(trade)}
                            title="Roll trade"
                          >
                            <Repeat className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setClosingTrade(trade)}
                            title="Close trade"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Trade Dialog */}
      <TradeForm
        open={!!editingTrade}
        onClose={() => setEditingTrade(null)}
        onSuccess={handleSuccess}
        editTrade={editingTrade}
      />

      {/* Close Trade Dialog */}
      {closingTrade && (
        <CloseTradeDialog
          open={true}
          onClose={() => setClosingTrade(null)}
          onSuccess={handleSuccess}
          trade={closingTrade}
        />
      )}

      {/* Roll Trade Dialog */}
      {rollingTrade && (
        <RollTradeDialog
          open={true}
          onClose={() => setRollingTrade(null)}
          onSuccess={handleSuccess}
          trade={rollingTrade}
        />
      )}
    </>
  );
}
