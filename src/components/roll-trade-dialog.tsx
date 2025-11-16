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
import type { Trade, TradeFormData } from '@/lib/types';

interface RollTradeDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trade: Trade;
}

export function RollTradeDialog({ open, onClose, onSuccess, trade }: RollTradeDialogProps) {
  const [newStrike, setNewStrike] = useState<number>(trade.strike);
  const [newExpiration, setNewExpiration] = useState<string>('');
  const [newPremium, setNewPremium] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const newTradeData: TradeFormData = {
        ticker: trade.ticker,
        type: trade.type,
        action: trade.action,
        strike: newStrike,
        expiration: newExpiration,
        premium: newPremium,
        quantity: trade.quantity,
        notes: notes || `Rolled from ${trade.strike} ${new Date(trade.expiration).toLocaleDateString()}`,
      };

      const response = await fetch(`/api/trades/${trade.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'roll',
          newTradeData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to roll trade');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to roll trade');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Roll Trade</DialogTitle>
          <DialogDescription>
            Roll {trade.ticker} ${trade.strike} {trade.type} (expires {new Date(trade.expiration).toLocaleDateString()})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="bg-muted p-3 rounded-md text-sm">
              <div className="font-medium mb-1">Current Trade:</div>
              <div className="text-muted-foreground">
                ${trade.strike} {trade.type} • Expires: {new Date(trade.expiration).toLocaleDateString()} • Premium: ${trade.premium}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newStrike" className="text-right">
                New Strike
              </Label>
              <Input
                id="newStrike"
                type="number"
                step="0.01"
                className="col-span-3"
                value={newStrike || ''}
                onChange={(e) => setNewStrike(parseFloat(e.target.value))}
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newExpiration" className="text-right">
                New Expiration
              </Label>
              <Input
                id="newExpiration"
                type="date"
                className="col-span-3"
                value={newExpiration}
                onChange={(e) => setNewExpiration(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newPremium" className="text-right">
                New Premium (per share)
              </Label>
              <Input
                id="newPremium"
                type="number"
                step="0.01"
                className="col-span-3"
                placeholder="2.50"
                value={newPremium || ''}
                onChange={(e) => setNewPremium(parseFloat(e.target.value))}
                required
              />
              <div className="col-start-2 col-span-3 text-xs text-muted-foreground">
                Enter net premium per share for the rolled position
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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Rolling...' : 'Roll Trade'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
