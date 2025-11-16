'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AccountSettings } from '@/lib/types';
import { DollarSign, Wallet, Plus, Minus } from 'lucide-react';

export function AccountSettings() {
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState<number>(0);
  const [formData, setFormData] = useState({
    totalCapital: 0,
    cashAvailable: 0,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/account');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setFormData({
          totalCapital: data.totalCapital,
          cashAvailable: data.cashAvailable,
        });
      }
    } catch (error) {
      console.error('Failed to fetch account settings:', error);
      setError('Failed to load account settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update account settings');
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (settings) {
      setFormData({
        totalCapital: settings.totalCapital,
        cashAvailable: settings.cashAvailable,
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || transactionAmount <= 0) return;

    setIsSaving(true);
    setError(null);

    try {
      const newTotalCapital = settings.totalCapital + transactionAmount;
      const newCashAvailable = settings.cashAvailable + transactionAmount;

      const response = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalCapital: newTotalCapital,
          cashAvailable: newCashAvailable,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to deposit cash');
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      setShowDepositForm(false);
      setTransactionAmount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deposit cash');
    } finally {
      setIsSaving(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || transactionAmount <= 0) return;

    if (transactionAmount > settings.cashAvailable) {
      setError('Withdrawal amount exceeds available cash');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const newTotalCapital = settings.totalCapital - transactionAmount;
      const newCashAvailable = settings.cashAvailable - transactionAmount;

      const response = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalCapital: newTotalCapital,
          cashAvailable: newCashAvailable,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to withdraw cash');
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      setShowWithdrawForm(false);
      setTransactionAmount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw cash');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const calculateUtilization = () => {
    if (!settings || settings.totalCapital === 0) return 0;
    const capitalInUse = settings.totalCapital - settings.cashAvailable;
    return (capitalInUse / settings.totalCapital) * 100;
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading account settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capital</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {settings ? formatCurrency(settings.totalCapital) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Your total trading capital
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Available</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {settings ? formatCurrency(settings.cashAvailable) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for new trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capital Utilization</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateUtilization().toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {settings ? formatCurrency(settings.totalCapital - settings.cashAvailable) : '$0.00'} in use
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash Management</CardTitle>
          <CardDescription>
            Deposit or withdraw cash from your trading account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          {!showDepositForm && !showWithdrawForm ? (
            <div className="flex gap-2">
              <Button onClick={() => setShowDepositForm(true)} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Deposit Cash
              </Button>
              <Button onClick={() => setShowWithdrawForm(true)} variant="outline" className="flex-1">
                <Minus className="h-4 w-4 mr-2" />
                Withdraw Cash
              </Button>
            </div>
          ) : showDepositForm ? (
            <form onSubmit={handleDeposit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="depositAmount">Deposit Amount</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="1000.00"
                  value={transactionAmount || ''}
                  onChange={(e) => setTransactionAmount(parseFloat(e.target.value) || 0)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will increase both your total capital and available cash
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Processing...' : 'Confirm Deposit'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDepositForm(false);
                    setTransactionAmount(0);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="withdrawAmount">Withdrawal Amount</Label>
                <Input
                  id="withdrawAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={settings?.cashAvailable || 0}
                  placeholder="1000.00"
                  value={transactionAmount || ''}
                  onChange={(e) => setTransactionAmount(parseFloat(e.target.value) || 0)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Available to withdraw: {settings ? formatCurrency(settings.cashAvailable) : '$0.00'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Processing...' : 'Confirm Withdrawal'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowWithdrawForm(false);
                    setTransactionAmount(0);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Set your initial capital or adjust account balances
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">Total Capital</p>
                  <p className="text-sm text-muted-foreground">Your total trading capital</p>
                </div>
                <p className="text-lg font-semibold">
                  {settings ? formatCurrency(settings.totalCapital) : '$0.00'}
                </p>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">Cash Available</p>
                  <p className="text-sm text-muted-foreground">Available for new trades</p>
                </div>
                <p className="text-lg font-semibold">
                  {settings ? formatCurrency(settings.cashAvailable) : '$0.00'}
                </p>
              </div>

              <Button onClick={() => setIsEditing(true)} className="mt-4">
                Edit Settings
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="totalCapital">Total Capital</Label>
                <Input
                  id="totalCapital"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="100000.00"
                  value={formData.totalCapital || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, totalCapital: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Your total trading capital
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cashAvailable">Cash Available</Label>
                <Input
                  id="cashAvailable"
                  type="number"
                  step="0.01"
                  min="0"
                  max={formData.totalCapital}
                  placeholder="50000.00"
                  value={formData.cashAvailable || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, cashAvailable: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Available for new trades (cannot exceed total capital)
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
