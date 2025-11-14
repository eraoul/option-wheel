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
import type { Position } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface PositionListProps {
  status?: 'open' | 'all';
  refreshKey?: number;
}

export function PositionList({ status = 'all', refreshKey }: PositionListProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPositions();
  }, [status, refreshKey]);

  const fetchPositions = async () => {
    try {
      const url = status === 'open' ? '/api/positions?status=open' : '/api/positions';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPositions(data);
      }
    } catch (error) {
      console.error('Failed to fetch positions:', error);
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticker</TableHead>
          <TableHead>Shares</TableHead>
          <TableHead>Cost Basis</TableHead>
          <TableHead>Cost/Share</TableHead>
          <TableHead>Acquired</TableHead>
          <TableHead>How Acquired</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {positions.map((position) => (
          <TableRow key={position.id}>
            <TableCell className="font-medium">{position.ticker}</TableCell>
            <TableCell>{position.shares.toLocaleString()}</TableCell>
            <TableCell>{formatCurrency(position.costBasis)}</TableCell>
            <TableCell>${calculateCostPerShare(position).toFixed(2)}</TableCell>
            <TableCell>{formatDate(position.acquiredDate)}</TableCell>
            <TableCell>{getAcquisitionBadge(position.acquisitionType)}</TableCell>
            <TableCell>
              <Badge variant={position.status === 'OPEN' ? 'default' : 'secondary'}>
                {position.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
