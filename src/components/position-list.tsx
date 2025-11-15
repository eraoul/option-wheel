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
import type { Position, CurrentPrice } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import { PositionForm } from './position-form';

interface PositionListProps {
  status?: 'open' | 'all';
  refreshKey?: number;
}

export function PositionList({ status = 'all', refreshKey }: PositionListProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [prices, setPrices] = useState<Record<string, CurrentPrice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);

  useEffect(() => {
    fetchData();
  }, [status, refreshKey]);

  const fetchData = async () => {
    try {
      // Fetch positions
      const posUrl = status === 'open' ? '/api/positions?status=open' : '/api/positions';
      const posResponse = await fetch(posUrl);
      if (posResponse.ok) {
        const posData = await posResponse.json();
        setPositions(posData);

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
    setEditingPosition(null);
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

  const getAcquisitionBadge = (type: string) => {
    const labels: Record<string, string> = {
      ASSIGNED_PUT: 'Put Assignment',
      ASSIGNED_CALL: 'Call Assignment',
      DIRECT_PURCHASE: 'Direct Purchase',
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  const calculateCostPerShare = (position: Position) => {
    return position.costBasis / position.shares;
  };

  const calculateDaysHeld = (position: Position) => {
    const acquired = new Date(position.acquiredDate);
    const now = new Date();
    const days = Math.floor((now.getTime() - acquired.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const calculateUnrealizedPnL = (position: Position) => {
    const price = prices[position.ticker];
    if (!price || !price.stockPrice) return null;

    const currentValue = price.stockPrice * position.shares;
    const unrealizedPnL = currentValue - position.costBasis;
    const percentChange = (unrealizedPnL / position.costBasis) * 100;

    return { unrealizedPnL, percentChange, currentPrice: price.stockPrice };
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading positions...</div>;
  }

  if (positions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No {status === 'open' ? 'open ' : ''}positions yet.
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
              <TableHead>Shares</TableHead>
              <TableHead>Cost/Share</TableHead>
              <TableHead>Current Price</TableHead>
              <TableHead>Days Held</TableHead>
              <TableHead>Cost Basis</TableHead>
              <TableHead>Current Value</TableHead>
              <TableHead>Unrealized P/L</TableHead>
              <TableHead>% Gain/Loss</TableHead>
              <TableHead>How Acquired</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((position) => {
              const pnlData = calculateUnrealizedPnL(position);
              const daysHeld = calculateDaysHeld(position);
              const costPerShare = calculateCostPerShare(position);

              return (
                <TableRow key={position.id}>
                  <TableCell className="font-medium">{position.ticker}</TableCell>
                  <TableCell>{position.shares.toLocaleString()}</TableCell>
                  <TableCell>${costPerShare.toFixed(2)}</TableCell>
                  <TableCell>
                    {pnlData ? (
                      <span>${pnlData.currentPrice.toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{daysHeld}d</TableCell>
                  <TableCell>{formatCurrency(position.costBasis)}</TableCell>
                  <TableCell>
                    {pnlData ? (
                      formatCurrency(pnlData.currentPrice * position.shares)
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {pnlData ? (
                      <span className={pnlData.unrealizedPnL >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {formatCurrency(pnlData.unrealizedPnL)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {pnlData ? (
                      <span className={pnlData.percentChange >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {pnlData.percentChange >= 0 ? '+' : ''}{pnlData.percentChange.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getAcquisitionBadge(position.acquisitionType)}</TableCell>
                  <TableCell>
                    <Badge variant={position.status === 'OPEN' ? 'default' : 'secondary'}>
                      {position.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPosition(position)}
                      title="Edit position"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Position Dialog */}
      <PositionForm
        open={!!editingPosition}
        onClose={() => setEditingPosition(null)}
        onSuccess={handleSuccess}
        editPosition={editingPosition}
      />
    </>
  );
}
