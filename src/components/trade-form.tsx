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
import { TickerInput } from '@/components/ui/ticker-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TradeFormData, TradeType, TradeAction, Trade } from '@/lib/types';

interface TradeFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTrade?: Trade | null;
}

export function TradeForm({ open, onClose, onSuccess, editTrade }: TradeFormProps) {
  const [formData, setFormData] = useState<TradeFormData>({
    ticker: '',
    type: 'PUT',
    action: 'SELL_TO_OPEN',
    strike: 0,
    expiration: '',
    premium: 0,
    quantity: 1,
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editTrade) {
      setFormData({
        ticker: editTrade.ticker,
        type: editTrade.type,
        action: editTrade.action,
        strike: editTrade.strike,
        expiration: editTrade.expiration.split('T')[0], // Convert to date format
        premium: editTrade.premium,
        quantity: editTrade.quantity,
        notes: editTrade.notes || '',
      });
    } else {
      setFormData({
        ticker: '',
        type: 'PUT',
        action: 'SELL_TO_OPEN',
        strike: 0,
        expiration: '',
        premium: 0,
        quantity: 1,
        notes: '',
      });
    }
  }, [editTrade, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = editTrade ? `/api/trades/${editTrade.id}` : '/api/trades';
      const method = editTrade ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${editTrade ? 'update' : 'create'} trade`);
      }

      onSuccess();
      if (!editTrade) {
        setFormData({
          ticker: '',
          type: 'PUT',
          action: 'SELL_TO_OPEN',
          strike: 0,
          expiration: '',
          premium: 0,
          quantity: 1,
          notes: '',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editTrade ? 'update' : 'create'} trade`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editTrade ? 'Edit' : 'Add'} Option Trade</DialogTitle>
          <DialogDescription>
            {editTrade ? 'Update' : 'Record'} an option trade (put or call)
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
              <TickerInput
                id="ticker"
                className="col-span-3"
                placeholder="AAPL"
                value={formData.ticker}
                onChange={(value) =>
                  setFormData({ ...formData, ticker: value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Option Type
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
                  <SelectItem value="PUT">Put</SelectItem>
                  <SelectItem value="CALL">Call</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="action" className="text-right">
                Action
              </Label>
              <Select
                value={formData.action}
                onValueChange={(value: TradeAction) =>
                  setFormData({ ...formData, action: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SELL_TO_OPEN">Sell to Open (STO)</SelectItem>
                  <SelectItem value="BUY_TO_CLOSE">Buy to Close (BTC)</SelectItem>
                  <SelectItem value="BUY_TO_OPEN">Buy to Open (BTO)</SelectItem>
                  <SelectItem value="SELL_TO_CLOSE">Sell to Close (STC)</SelectItem>
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
                Premium (per share)
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
                Enter price per share (will be multiplied by 100 per contract)
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Contracts
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
                Each contract = 100 shares
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
              {isSubmitting ? (editTrade ? 'Updating...' : 'Adding...') : (editTrade ? 'Update Trade' : 'Add Trade')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
