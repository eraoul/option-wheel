'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TradeForm } from '@/components/trade-form';
import { PositionForm } from '@/components/position-form';
import { TradeList } from '@/components/trade-list';
import { PositionList } from '@/components/position-list';
import { TickerAnalytics } from '@/components/ticker-analytics';
import { AccountSettings } from '@/components/account-settings';
import type { PortfolioMetrics } from '@/lib/types';
import { PlusCircle, TrendingUp, DollarSign, Target, Percent } from 'lucide-react';

export default function Home() {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'trades' | 'positions' | 'analytics' | 'settings'>('overview');
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [showPositionForm, setShowPositionForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchMetrics();
  }, [refreshKey]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/analytics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const handleTradeAdded = () => {
    setShowTradeForm(false);
    setRefreshKey(prev => prev + 1);
  };

  const handlePositionAdded = () => {
    setShowPositionForm(false);
    setRefreshKey(prev => prev + 1);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold">Option Wheel Tracker</h1>
          <p className="text-muted-foreground">Track your cash-secured puts and covered calls</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
            className="rounded-b-none"
          >
            Overview
          </Button>
          <Button
            variant={activeTab === 'trades' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('trades')}
            className="rounded-b-none"
          >
            Trades
          </Button>
          <Button
            variant={activeTab === 'positions' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('positions')}
            className="rounded-b-none"
          >
            Positions
          </Button>
          <Button
            variant={activeTab === 'analytics' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('analytics')}
            className="rounded-b-none"
          >
            Analytics
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('settings')}
            className="rounded-b-none"
          >
            Settings
          </Button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Portfolio Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Premium</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics ? formatCurrency(metrics.totalPremiumCollected) : '$0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Collected from {metrics?.totalTrades || 0} trades
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Realized P&L</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics ? formatCurrency(metrics.totalRealizedPnL) : '$0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From closed trades
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Annualized Return</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics ? formatPercent(metrics.annualizedReturn) : '0.00%'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Portfolio-wide
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics ? `${metrics.winRate.toFixed(1)}%` : '0.0%'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.activeTrades || 0} active trades
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4">
              <Button onClick={() => setShowTradeForm(true)} size="lg">
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Trade
              </Button>
              <Button onClick={() => setShowPositionForm(true)} variant="outline" size="lg">
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Position
              </Button>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Trades</CardTitle>
                <CardDescription>Your latest option trades</CardDescription>
              </CardHeader>
              <CardContent>
                <TradeList limit={5} refreshKey={refreshKey} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Positions</CardTitle>
                <CardDescription>Stock positions from assignments (100 share lots)</CardDescription>
              </CardHeader>
              <CardContent>
                <PositionList status="open" refreshKey={refreshKey} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trades Tab */}
        {activeTab === 'trades' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">All Trades</h2>
              <Button onClick={() => setShowTradeForm(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Trade
              </Button>
            </div>
            <TradeList refreshKey={refreshKey} />
          </div>
        )}

        {/* Positions Tab */}
        {activeTab === 'positions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">All Positions</h2>
              <Button onClick={() => setShowPositionForm(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Position
              </Button>
            </div>
            <PositionList refreshKey={refreshKey} />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics by Ticker</h2>
            <TickerAnalytics />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Account Settings</h2>
            <AccountSettings />
          </div>
        )}
      </main>

      {/* Trade Form Dialog */}
      {showTradeForm && (
        <TradeForm
          open={showTradeForm}
          onClose={() => setShowTradeForm(false)}
          onSuccess={handleTradeAdded}
        />
      )}

      {/* Position Form Dialog */}
      {showPositionForm && (
        <PositionForm
          open={showPositionForm}
          onClose={() => setShowPositionForm(false)}
          onSuccess={handlePositionAdded}
        />
      )}
    </div>
  );
}
