'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PositionFormData, AcquisitionType, Position } from '@/lib/types';

interface PositionFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editPosition?: Position | null;
}

export function PositionForm({ open, onClose, onSuccess, editPosition }: PositionFormProps) {
  const [formData, setFormData] = useState<PositionFormData>({
    ticker: '',
    shares: 100,
    costBasis: 0,
    acquiredDate: new Date().toISOString().split('T')[0],
    acquisitionType: 'ASSIGNED_PUT',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editPosition) {
      setFormData({
        ticker: editPosition.ticker,
        shares: editPosition.shares,
        costBasis: editPosition.costBasis,
        acquiredDate: editPosition.acquiredDate.split('T')[0],
        acquisitionType: editPosition.acquisitionType,
        notes: editPosition.notes || '',
      });
    } else {
      setFormData({
        ticker: '',
        shares: 100,
        costBasis: 0,
        acquiredDate: new Date().toISOString().split('T')[0],
        acquisitionType: 'ASSIGNED_PUT',
        notes: '',
      });
    }
  }, [editPosition, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate shares are in lots of 100
    if (formData.shares % 100 !== 0) {
      setError('Shares must be in lots of 100');
      setIsSubmitting(false);
      return;
    }

    try {
      const url = editPosition ? `/api/positions/${editPosition.id}` : '/api/positions';
      const method = editPosition ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${editPosition ? 'update' : 'create'} position`);
      }

      onSuccess();
      if (!editPosition) {
        setFormData({
          ticker: '',
          shares: 100,
          costBasis: 0,
          acquiredDate: new Date().toISOString().split('T')[0],
          acquisitionType: 'ASSIGNED_PUT',
          notes: '',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editPosition ? 'update' : 'create'} position`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{editPosition ? 'Edit' : 'Add'} Stock Position</DialogTitle>
          <DialogDescription>
            {editPosition ? 'Update' : 'Record'} a stock position (in lots of 100 shares)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ticker" className="text-right">
                Ticker
              </Label>
              <Input
                id="ticker"
                className="col-span-3"
                placeholder="AAPL"
                value={formData.ticker}
                onChange={(e) =>
                  setFormData({ ...formData, ticker: e.target.value.toUpperCase() })
                }
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shares" className="text-right">
                Shares
              </Label>
              <Input
                id="shares"
                type="number"
                step="100"
                min="100"
                className="col-span-3"
                placeholder="100"
                value={formData.shares || ''}
                onChange={(e) =>
                  setFormData({ ...formData, shares: parseInt(e.target.value) })
                }
                required
              />
              <div className="col-start-2 col-span-3 text-xs text-muted-foreground">
                Must be in lots of 100 (100, 200, 300, etc.)
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="costBasis" className="text-right">
                Cost Basis
              </Label>
              <Input
                id="costBasis"
                type="number"
                step="0.01"
                className="col-span-3"
                placeholder="15000.00"
                value={formData.costBasis || ''}
                onChange={(e) =>
                  setFormData({ ...formData, costBasis: parseFloat(e.target.value) })
                }
                required
              />
              <div className="col-start-2 col-span-3 text-xs text-muted-foreground">
                Total cost basis for all shares
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="acquiredDate" className="text-right">
                Acquired Date
              </Label>
              <Input
                id="acquiredDate"
                type="date"
                className="col-span-3"
                value={formData.acquiredDate}
                onChange={(e) =>
                  setFormData({ ...formData, acquiredDate: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="acquisitionType" className="text-right">
                How Acquired
              </Label>
              <Select
                value={formData.acquisitionType}
                onValueChange={(value: AcquisitionType) =>
                  setFormData({ ...formData, acquisitionType: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASSIGNED_PUT">Put Assignment</SelectItem>
                  <SelectItem value="ASSIGNED_CALL">Call Assignment</SelectItem>
                  <SelectItem value="DIRECT_PURCHASE">Direct Purchase</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Input
                id="notes"
                className="col-span-3"
                placeholder="Optional notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (editPosition ? 'Updating...' : 'Adding...') : (editPosition ? 'Update Position' : 'Add Position')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
