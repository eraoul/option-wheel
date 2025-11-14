import { db, generateId } from './db';
import type {
  Trade,
  Position,
  TradeFormData,
  PositionFormData,
  TickerMetrics,
  PortfolioMetrics
} from './types';

// Trade Operations
export function createTrade(data: TradeFormData): Trade {
  const id = generateId();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO trades (id, ticker, type, strike, expiration, premium, quantity, open_date, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.ticker.toUpperCase(),
    data.type,
    data.strike,
    data.expiration,
    data.premium,
    data.quantity,
    now,
    data.notes || null,
    now,
    now
  );

  return getTrade(id)!;
}

export function getTrade(id: string): Trade | undefined {
  const stmt = db.prepare('SELECT * FROM trades WHERE id = ?');
  const row = stmt.get(id) as any;
  return row ? mapTradeFromDb(row) : undefined;
}

export function getAllTrades(): Trade[] {
  const stmt = db.prepare('SELECT * FROM trades ORDER BY open_date DESC');
  const rows = stmt.all() as any[];
  return rows.map(mapTradeFromDb);
}

export function getTradesByTicker(ticker: string): Trade[] {
  const stmt = db.prepare('SELECT * FROM trades WHERE ticker = ? ORDER BY open_date DESC');
  const rows = stmt.all(ticker.toUpperCase()) as any[];
  return rows.map(mapTradeFromDb);
}

export function getActiveTradesByTicker(ticker: string): Trade[] {
  const stmt = db.prepare('SELECT * FROM trades WHERE ticker = ? AND status = ? ORDER BY expiration ASC');
  const rows = stmt.all(ticker.toUpperCase(), 'OPEN') as any[];
  return rows.map(mapTradeFromDb);
}

export function updateTrade(id: string, data: Partial<Trade>): Trade {
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${dbKey} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return getTrade(id)!;

  fields.push('updated_at = ?');
  values.push(now, id);

  const stmt = db.prepare(`UPDATE trades SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getTrade(id)!;
}

export function closeTrade(id: string, closePremium: number): Trade {
  return updateTrade(id, {
    status: 'CLOSED',
    closeDate: new Date().toISOString(),
    closePremium
  });
}

export function assignTrade(id: string, positionId: string): Trade {
  return updateTrade(id, {
    status: 'ASSIGNED',
    positionId
  });
}

export function deleteTrade(id: string): void {
  const stmt = db.prepare('DELETE FROM trades WHERE id = ?');
  stmt.run(id);
}

// Position Operations
export function createPosition(data: PositionFormData): Position {
  const id = generateId();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO positions (id, ticker, shares, cost_basis, acquired_date, acquisition_type, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.ticker.toUpperCase(),
    data.shares,
    data.costBasis,
    data.acquiredDate,
    data.acquisitionType,
    data.notes || null,
    now,
    now
  );

  return getPosition(id)!;
}

export function getPosition(id: string): Position | undefined {
  const stmt = db.prepare('SELECT * FROM positions WHERE id = ?');
  const row = stmt.get(id) as any;
  return row ? mapPositionFromDb(row) : undefined;
}

export function getAllPositions(): Position[] {
  const stmt = db.prepare('SELECT * FROM positions ORDER BY acquired_date DESC');
  const rows = stmt.all() as any[];
  return rows.map(mapPositionFromDb);
}

export function getPositionsByTicker(ticker: string): Position[] {
  const stmt = db.prepare('SELECT * FROM positions WHERE ticker = ? ORDER BY acquired_date DESC');
  const rows = stmt.all(ticker.toUpperCase()) as any[];
  return rows.map(mapPositionFromDb);
}

export function getOpenPositions(): Position[] {
  const stmt = db.prepare('SELECT * FROM positions WHERE status = ? ORDER BY acquired_date DESC');
  const rows = stmt.all('OPEN') as any[];
  return rows.map(mapPositionFromDb);
}

export function updatePosition(id: string, data: Partial<Position>): Position {
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${dbKey} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return getPosition(id)!;

  fields.push('updated_at = ?');
  values.push(now, id);

  const stmt = db.prepare(`UPDATE positions SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getPosition(id)!;
}

export function sellPosition(id: string, soldPrice: number, soldDate?: string): Position {
  return updatePosition(id, {
    status: 'SOLD',
    soldPrice,
    soldDate: soldDate || new Date().toISOString()
  });
}

export function deletePosition(id: string): void {
  const stmt = db.prepare('DELETE FROM positions WHERE id = ?');
  stmt.run(id);
}

// Analytics Operations
export function getTickerMetrics(ticker: string): TickerMetrics {
  const trades = getTradesByTicker(ticker);
  const positions = getPositionsByTicker(ticker);

  const totalPremium = trades.reduce((sum, t) => {
    const collected = t.premium * t.quantity * 100; // Premium is per share, 100 shares per contract
    const paid = (t.closePremium || 0) * t.quantity * 100;
    return sum + collected - paid;
  }, 0);

  const openTrades = trades.filter(t => t.status === 'OPEN');
  const closedTrades = trades.filter(t => t.status === 'CLOSED' || t.status === 'EXPIRED');
  const winningTrades = closedTrades.filter(t => {
    const collected = t.premium * t.quantity * 100;
    const paid = (t.closePremium || 0) * t.quantity * 100;
    return collected > paid;
  });

  const realizedPnL = closedTrades.reduce((sum, t) => {
    const collected = t.premium * t.quantity * 100;
    const paid = (t.closePremium || 0) * t.quantity * 100;
    return sum + collected - paid;
  }, 0);

  // Calculate unrealized P&L from open positions
  const unrealizedPnL = positions
    .filter(p => p.status === 'OPEN')
    .reduce((sum, p) => {
      // For now, unrealized P&L is 0 until we add current price tracking
      return sum;
    }, 0);

  // Calculate annualized return
  const totalCapital = positions.reduce((sum, p) => sum + p.costBasis, 0);
  const avgDaysInTrade = calculateAvgDaysInTrade(trades);
  const annualizedReturn = totalCapital > 0 && avgDaysInTrade > 0
    ? ((totalPremium + realizedPnL) / totalCapital) * (365 / avgDaysInTrade) * 100
    : 0;

  return {
    ticker: ticker.toUpperCase(),
    totalPremium,
    totalTrades: trades.length,
    openPositions: positions.filter(p => p.status === 'OPEN').length,
    realizedPnL,
    unrealizedPnL,
    annualizedReturn,
    avgDaysToExpiration: calculateAvgDaysToExpiration(openTrades),
    winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0
  };
}

export function getPortfolioMetrics(): PortfolioMetrics {
  const allTrades = getAllTrades();
  const allPositions = getAllPositions();

  const totalPremiumCollected = allTrades.reduce((sum, t) => {
    return sum + (t.premium * t.quantity * 100);
  }, 0);

  const closedTrades = allTrades.filter(t => t.status === 'CLOSED' || t.status === 'EXPIRED');
  const totalRealizedPnL = closedTrades.reduce((sum, t) => {
    const collected = t.premium * t.quantity * 100;
    const paid = (t.closePremium || 0) * t.quantity * 100;
    return sum + collected - paid;
  }, 0);

  const totalUnrealizedPnL = 0; // Will implement with price tracking

  const totalCapitalDeployed = allPositions.reduce((sum, p) => sum + p.costBasis, 0);

  const avgDaysInTrade = calculateAvgDaysInTrade(allTrades);
  const annualizedReturn = totalCapitalDeployed > 0 && avgDaysInTrade > 0
    ? ((totalPremiumCollected + totalRealizedPnL) / totalCapitalDeployed) * (365 / avgDaysInTrade) * 100
    : 0;

  const winningTrades = closedTrades.filter(t => {
    const collected = t.premium * t.quantity * 100;
    const paid = (t.closePremium || 0) * t.quantity * 100;
    return collected > paid;
  });

  return {
    totalPremiumCollected,
    totalRealizedPnL,
    totalUnrealizedPnL,
    totalCapitalDeployed,
    annualizedReturn,
    totalTrades: allTrades.length,
    activeTrades: allTrades.filter(t => t.status === 'OPEN').length,
    activePositions: allPositions.filter(p => p.status === 'OPEN').length,
    winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
    avgPremiumPerTrade: allTrades.length > 0 ? totalPremiumCollected / allTrades.length : 0
  };
}

export function getAllTickers(): string[] {
  const stmt = db.prepare('SELECT DISTINCT ticker FROM trades UNION SELECT DISTINCT ticker FROM positions ORDER BY ticker');
  const rows = stmt.all() as any[];
  return rows.map(r => r.ticker);
}

// Helper functions
function mapTradeFromDb(row: any): Trade {
  return {
    id: row.id,
    ticker: row.ticker,
    type: row.type,
    strike: row.strike,
    expiration: row.expiration,
    premium: row.premium,
    quantity: row.quantity,
    openDate: row.open_date,
    closeDate: row.close_date,
    closePremium: row.close_premium,
    status: row.status,
    notes: row.notes,
    positionId: row.position_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapPositionFromDb(row: any): Position {
  return {
    id: row.id,
    ticker: row.ticker,
    shares: row.shares,
    costBasis: row.cost_basis,
    acquiredDate: row.acquired_date,
    soldDate: row.sold_date,
    soldPrice: row.sold_price,
    status: row.status,
    acquisitionType: row.acquisition_type,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function calculateAvgDaysToExpiration(trades: Trade[]): number {
  if (trades.length === 0) return 0;

  const now = new Date();
  const totalDays = trades.reduce((sum, t) => {
    const expDate = new Date(t.expiration);
    const days = Math.max(0, Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    return sum + days;
  }, 0);

  return totalDays / trades.length;
}

function calculateAvgDaysInTrade(trades: Trade[]): number {
  const completedTrades = trades.filter(t => t.closeDate);
  if (completedTrades.length === 0) return 0;

  const totalDays = completedTrades.reduce((sum, t) => {
    const openDate = new Date(t.openDate);
    const closeDate = new Date(t.closeDate!);
    const days = Math.ceil((closeDate.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24));
    return sum + days;
  }, 0);

  return totalDays / completedTrades.length;
}
