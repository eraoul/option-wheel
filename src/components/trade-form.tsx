'use client';

import { useState } from 'react';
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
import type { TradeFormData, TradeType } from '@/lib/types';

interface TradeFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TradeForm({ open, onClose, onSuccess }: TradeFormProps) {
  const [formData, setFormData] = useState<TradeFormData>({
    ticker: '',
    type: 'PUT',
    strike: 0,
    expiration: '',
    premium: 0,
    quantity: 1,
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create trade');
      }

      onSuccess();
      setFormData({
        ticker: '',
        type: 'PUT',
        strike: 0,
        expiration: '',
        premium: 0,
        quantity: 1,
        notes: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trade');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add Option Trade</DialogTitle>
          <DialogDescription>
            Record a new cash-secured put or covered call trade
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
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: TradeType) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUT">Cash-Secured Put (CSP)</SelectItem>
                  <SelectItem value="CALL">Covered Call (CC)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="strike" className="text-right">
                Strike
              </Label>
              <Input
                id="strike"
                type="number"
                step="0.01"
                className="col-span-3"
                placeholder="150.00"
                value={formData.strike || ''}
                onChange={(e) =>
                  setFormData({ ...formData, strike: parseFloat(e.target.value) })
                }
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expiration" className="text-right">
                Expiration
              </Label>
              <Input
                id="expiration"
                type="date"
                className="col-span-3"
                value={formData.expiration}
                onChange={(e) =>
                  setFormData({ ...formData, expiration: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="premium" className="text-right">
                Premium
              </Label>
              <Input
                id="premium"
                type="number"
                step="0.01"
                className="col-span-3"
                placeholder="2.50"
                value={formData.premium || ''}
                onChange={(e) =>
                  setFormData({ ...formData, premium: parseFloat(e.target.value) })
                }
                required
              />
              <div className="col-start-2 col-span-3 text-xs text-muted-foreground">
                Premium per share (will be multiplied by 100 shares per contract)
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                className="col-span-3"
                placeholder="1"
                value={formData.quantity || ''}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) })
                }
                required
              />
              <div className="col-start-2 col-span-3 text-xs text-muted-foreground">
                Number of contracts (each contract = 100 shares)
              </div>
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
              {isSubmitting ? 'Adding...' : 'Add Trade'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
