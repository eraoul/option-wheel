'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TickerMetrics } from '@/lib/types';

export function TickerAnalytics() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [tickerMetrics, setTickerMetrics] = useState<Record<string, TickerMetrics>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch all tickers
      const tickersResponse = await fetch('/api/analytics?type=tickers');
      if (tickersResponse.ok) {
        const tickerList = await tickersResponse.json();
        setTickers(tickerList);

        // Fetch metrics for each ticker
        const metricsPromises = tickerList.map(async (ticker: string) => {
          const response = await fetch(`/api/analytics?ticker=${ticker}`);
          if (response.ok) {
            const metrics = await response.json();
            return { ticker, metrics };
          }
          return null;
        });

        const results = await Promise.all(metricsPromises);
        const metricsMap: Record<string, TickerMetrics> = {};
        results.forEach((result) => {
          if (result) {
            metricsMap[result.ticker] = result.metrics;
          }
        });
        setTickerMetrics(metricsMap);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (tickers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data yet. Add some trades to see analytics by ticker.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance by Ticker</CardTitle>
          <CardDescription>
            Annualized returns and metrics for each ticker
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticker</TableHead>
                <TableHead className="text-right">Total Premium</TableHead>
                <TableHead className="text-right">Realized P&L</TableHead>
                <TableHead className="text-right">Annualized Return</TableHead>
                <TableHead className="text-right">Trades</TableHead>
                <TableHead className="text-right">Open Positions</TableHead>
                <TableHead className="text-right">Win Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickers.map((ticker) => {
                const metrics = tickerMetrics[ticker];
                if (!metrics) return null;

                return (
                  <TableRow key={ticker}>
                    <TableCell className="font-medium">{ticker}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(metrics.totalPremium)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={metrics.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(metrics.realizedPnL)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={metrics.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatPercent(metrics.annualizedReturn)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{metrics.totalTrades}</TableCell>
                    <TableCell className="text-right">{metrics.openPositions}</TableCell>
                    <TableCell className="text-right">
                      {metrics.winRate.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Individual Ticker Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {tickers.map((ticker) => {
          const metrics = tickerMetrics[ticker];
          if (!metrics) return null;

          return (
            <Card key={ticker}>
              <CardHeader>
                <CardTitle>{ticker}</CardTitle>
                <CardDescription>Detailed metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Premium:</span>
                  <span className="font-medium">{formatCurrency(metrics.totalPremium)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Realized P&L:</span>
                  <span className={`font-medium ${metrics.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(metrics.realizedPnL)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Annualized Return:</span>
                  <span className={`font-bold text-lg ${metrics.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(metrics.annualizedReturn)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Trades:</span>
                  <span className="font-medium">{metrics.totalTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Open Positions:</span>
                  <span className="font-medium">{metrics.openPositions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate:</span>
                  <span className="font-medium">{metrics.winRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Days to Expiration:</span>
                  <span className="font-medium">{metrics.avgDaysToExpiration.toFixed(0)} days</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
