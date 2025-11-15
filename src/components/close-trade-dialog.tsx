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
import type { Trade, CloseMethod } from '@/lib/types';

interface CloseTradeDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trade: Trade;
}

export function CloseTradeDialog({ open, onClose, onSuccess, trade }: CloseTradeDialogProps) {
  const [closeMethod, setCloseMethod] = useState<CloseMethod>('BUYBACK');
  const [closePremium, setClosePremium] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/trades/${trade.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'closeWithMethod',
          closeMethod,
          closePremium: closeMethod === 'BUYBACK' ? closePremium : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to close trade');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close trade');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Close Trade</DialogTitle>
          <DialogDescription>
            Close {trade.ticker} ${trade.strike} {trade.type}
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
              <Label htmlFor="closeMethod" className="text-right">
                Close Method
              </Label>
              <Select
                value={closeMethod}
                onValueChange={(value: CloseMethod) => setCloseMethod(value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUYBACK">Buy Back / Sell Shares</SelectItem>
                  <SelectItem value="EXPIRED">Let Expire Worthless</SelectItem>
                  <SelectItem value="ASSIGNED">Mark as Assigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {closeMethod === 'BUYBACK' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="closePremium" className="text-right">
                  Close Premium (per share)
                </Label>
                <Input
                  id="closePremium"
                  type="number"
                  step="0.01"
                  className="col-span-3"
                  placeholder="1.25"
                  value={closePremium || ''}
                  onChange={(e) => setClosePremium(parseFloat(e.target.value))}
                  required
                />
                <div className="col-start-2 col-span-3 text-xs text-muted-foreground">
                  Enter price per share paid to close the position
                </div>
              </div>
            )}

            {closeMethod === 'EXPIRED' && (
              <div className="col-span-4 text-sm text-muted-foreground bg-muted p-3 rounded-md">
                This will mark the trade as expired worthless. Premium collected: ${(trade.premium * trade.quantity * 100).toFixed(2)}
              </div>
            )}

            {closeMethod === 'ASSIGNED' && (
              <div className="col-span-4 text-sm text-muted-foreground bg-muted p-3 rounded-md">
                This will mark the trade as assigned. You should create a position entry for the {trade.quantity * 100} shares.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Closing...' : 'Close Trade'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
