import { db, generateId } from './db';
import type {
  Trade,
  Position,
  TradeFormData,
  PositionFormData,
  TickerMetrics,
  PortfolioMetrics,
  AccountSettings,
  CurrentPrice,
  EnhancedPortfolioMetrics
} from './types';

// Trade Operations
export function createTrade(data: TradeFormData): Trade {
  const id = generateId();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO trades (id, ticker, type, action, strike, expiration, premium, quantity, open_date, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.ticker.toUpperCase(),
    data.type,
    data.action,
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
    closePremium,
    closeMethod: 'BUYBACK'
  });
}

export function closeTradeWithMethod(
  id: string,
  method: 'BUYBACK' | 'EXPIRED' | 'ASSIGNED',
  closePremium?: number,
  positionId?: string
): Trade {
  const updates: Partial<Trade> = {
    closeDate: new Date().toISOString(),
    closeMethod: method
  };

  if (method === 'BUYBACK' && closePremium !== undefined) {
    updates.closePremium = closePremium;
    updates.status = 'CLOSED';
  } else if (method === 'EXPIRED') {
    updates.status = 'EXPIRED';
    updates.closePremium = 0;
  } else if (method === 'ASSIGNED' && positionId) {
    updates.status = 'ASSIGNED';
    updates.positionId = positionId;
  }

  return updateTrade(id, updates);
}

export function rollTrade(
  oldTradeId: string,
  newTradeData: TradeFormData
): { oldTrade: Trade; newTrade: Trade } {
  // Create the new trade
  const newTrade = createTrade(newTradeData);

  // Update the old trade to mark it as rolled
  const oldTrade = updateTrade(oldTradeId, {
    status: 'ROLLED',
    closeDate: new Date().toISOString(),
    closeMethod: 'ROLL',
    rolledToTradeId: newTrade.id
  });

  // Link the new trade back to the old one
  updateTrade(newTrade.id, {
    rolledFromTradeId: oldTradeId
  });

  return { oldTrade, newTrade: getTrade(newTrade.id)! };
}

export function assignTrade(id: string, positionId: string): Trade {
  return updateTrade(id, {
    status: 'ASSIGNED',
    closeMethod: 'ASSIGNED',
    closeDate: new Date().toISOString(),
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
    action: row.action || 'SELL_TO_OPEN',
    strike: row.strike,
    expiration: row.expiration,
    premium: row.premium,
    quantity: row.quantity,
    openDate: row.open_date,
    closeDate: row.close_date,
    closePremium: row.close_premium,
    closeMethod: row.close_method,
    status: row.status,
    notes: row.notes,
    positionId: row.position_id,
    rolledToTradeId: row.rolled_to_trade_id,
    rolledFromTradeId: row.rolled_from_trade_id,
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

// Account Settings Operations
export function getAccountSettings(): AccountSettings {
  const stmt = db.prepare('SELECT * FROM account_settings WHERE id = ?');
  const row = stmt.get('default') as any;
  return {
    id: row.id,
    totalCapital: row.total_capital,
    cashAvailable: row.cash_available,
    updatedAt: row.updated_at
  };
}

export function updateAccountSettings(totalCapital: number, cashAvailable: number): AccountSettings {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE account_settings 
    SET total_capital = ?, cash_available = ?, updated_at = ?
    WHERE id = 'default'
  `);
  stmt.run(totalCapital, cashAvailable, now);
  return getAccountSettings();
}

// Current Prices Operations
export function upsertCurrentPrice(ticker: string, data: Partial<CurrentPrice>): void {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO current_prices (ticker, stock_price, option_price, strike, expiration, option_type, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(ticker) DO UPDATE SET
      stock_price = COALESCE(excluded.stock_price, stock_price),
      option_price = COALESCE(excluded.option_price, option_price),
      strike = COALESCE(excluded.strike, strike),
      expiration = COALESCE(excluded.expiration, expiration),
      option_type = COALESCE(excluded.option_type, option_type),
      updated_at = excluded.updated_at
  `);
  stmt.run(
    ticker.toUpperCase(),
    data.stockPrice ?? null,
    data.optionPrice ?? null,
    data.strike ?? null,
    data.expiration ?? null,
    data.optionType ?? null,
    now
  );
}

export function getCurrentPrice(ticker: string): CurrentPrice | null {
  const stmt = db.prepare('SELECT * FROM current_prices WHERE ticker = ?');
  const row = stmt.get(ticker.toUpperCase()) as any;
  if (!row) return null;
  return {
    ticker: row.ticker,
    stockPrice: row.stock_price,
    optionPrice: row.option_price,
    strike: row.strike,
    expiration: row.expiration,
    optionType: row.option_type,
    updatedAt: row.updated_at
  };
}

export function getAllCurrentPrices(): CurrentPrice[] {
  const stmt = db.prepare('SELECT * FROM current_prices ORDER BY ticker');
  const rows = stmt.all() as any[];
  return rows.map(row => ({
    ticker: row.ticker,
    stockPrice: row.stock_price,
    optionPrice: row.option_price,
    strike: row.strike,
    expiration: row.expiration,
    optionType: row.option_type,
    updatedAt: row.updated_at
  }));
}

// Enhanced Portfolio Metrics with Cash Management
export function getEnhancedPortfolioMetrics(): EnhancedPortfolioMetrics {
  const basicMetrics = getPortfolioMetrics();
  const accountSettings = getAccountSettings();
  
  // Calculate cash used for CSPs (open put positions)
  const openPutTrades = getAllTrades().filter(t => 
    t.status === 'OPEN' && t.type === 'PUT' && t.action === 'SELL_TO_OPEN'
  );
  
  const cashUsedForCSPs = openPutTrades.reduce((sum, t) => {
    // Cash secured = strike price * quantity * 100 shares per contract
    return sum + (t.strike * t.quantity * 100);
  }, 0);

  const percentCashAvailable = accountSettings.totalCapital > 0 
    ? (accountSettings.cashAvailable / accountSettings.totalCapital) * 100
    : 0;

  const capitalUtilization = accountSettings.totalCapital > 0
    ? ((accountSettings.totalCapital - accountSettings.cashAvailable) / accountSettings.totalCapital) * 100
    : 0;

  return {
    ...basicMetrics,
    totalCapital: accountSettings.totalCapital,
    cashAvailable: accountSettings.cashAvailable,
    cashUsedForCSPs,
    percentCashAvailable,
    capitalUtilization
  };
}

// Calculate DTE (Days to Expiration)
export function calculateDTE(expirationDate: string): number {
  const now = new Date();
  const exp = new Date(expirationDate);
  const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

// Calculate unrealized P/L for a position
export function calculateUnrealizedPnL(position: Position): number {
  const currentPrice = getCurrentPrice(position.ticker);
  if (!currentPrice || !currentPrice.stockPrice) return 0;
  
  const currentValue = currentPrice.stockPrice * position.shares;
  const unrealizedPnL = currentValue - position.costBasis;
  return unrealizedPnL;
}

// Calculate unrealized P/L for an option trade
export function calculateTradeUnrealizedPnL(trade: Trade): number {
  if (trade.status !== 'OPEN') return 0;
  
  const currentPrice = getCurrentPrice(trade.ticker);
  if (!currentPrice) return 0;
  
  // For sold options (STO), we want the option to decrease in value
  // Unrealized P/L = premium collected - current option price
  if (trade.action === 'SELL_TO_OPEN' || trade.action === 'SELL_TO_CLOSE') {
    const collectedPremium = trade.premium * trade.quantity * 100;
    const currentValue = (currentPrice.optionPrice || 0) * trade.quantity * 100;
    return collectedPremium - currentValue;
  }
  
  // For bought options (BTO), we want the option to increase in value
  // Unrealized P/L = current option price - premium paid
  if (trade.action === 'BUY_TO_OPEN' || trade.action === 'BUY_TO_CLOSE') {
    const paidPremium = trade.premium * trade.quantity * 100;
    const currentValue = (currentPrice.optionPrice || 0) * trade.quantity * 100;
    return currentValue - paidPremium;
  }
  
  return 0;
}

// Calculate covered call allocation for a ticker
export function getCoveredCallAllocation(ticker: string): {
  totalShares: number;
  allocatedShares: number;
  unallocatedShares: number;
  totalLots: number;
  allocatedLots: number;
  unallocatedLots: number;
} {
  // Get all open positions for this ticker
  const openPositions = getPositionsByTicker(ticker).filter(p => p.status === 'OPEN');
  const totalShares = openPositions.reduce((sum, p) => sum + p.shares, 0);

  // Get all open CALL trades for this ticker (covered calls)
  const openCalls = getActiveTradesByTicker(ticker).filter(t => t.type === 'CALL' && t.action === 'SELL_TO_OPEN');
  const allocatedShares = openCalls.reduce((sum, t) => sum + (t.quantity * 100), 0);

  const unallocatedShares = Math.max(0, totalShares - allocatedShares);

  return {
    totalShares,
    allocatedShares,
    unallocatedShares,
    totalLots: totalShares / 100,
    allocatedLots: allocatedShares / 100,
    unallocatedLots: unallocatedShares / 100,
  };
}
