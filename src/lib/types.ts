export type TradeType = 'PUT' | 'CALL';
export type TradeStatus = 'OPEN' | 'CLOSED' | 'ASSIGNED' | 'EXPIRED' | 'ROLLED';
export type TradeAction = 'SELL_TO_OPEN' | 'BUY_TO_CLOSE' | 'BUY_TO_OPEN' | 'SELL_TO_CLOSE';
export type CloseMethod = 'BUYBACK' | 'ROLL' | 'EXPIRED' | 'ASSIGNED';
export type PositionStatus = 'OPEN' | 'SOLD';
export type AcquisitionType = 'ASSIGNED_PUT' | 'ASSIGNED_CALL' | 'DIRECT_PURCHASE';

export interface Trade {
  id: string;
  ticker: string;
  type: TradeType;
  action: TradeAction;
  strike: number;
  expiration: string; // ISO date string
  premium: number;
  quantity: number;
  openDate: string; // ISO date string
  closeDate?: string | null;
  closePremium?: number | null;
  closeMethod?: CloseMethod | null;
  status: TradeStatus;
  notes?: string | null;
  positionId?: string | null;
  rolledToTradeId?: string | null;
  rolledFromTradeId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  ticker: string;
  shares: number;
  costBasis: number;
  acquiredDate: string; // ISO date string
  soldDate?: string | null;
  soldPrice?: number | null;
  status: PositionStatus;
  acquisitionType: AcquisitionType;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TradeFormData {
  ticker: string;
  type: TradeType;
  action: TradeAction;
  strike: number;
  expiration: string;
  premium: number;
  quantity: number;
  notes?: string;
}

export interface ShareTransactionFormData {
  ticker: string;
  shares: number;
  pricePerShare: number;
  transactionDate: string;
  transactionType: 'BUY' | 'SELL';
  notes?: string;
}

export interface PositionFormData {
  ticker: string;
  shares: number;
  costBasis: number;
  acquiredDate: string;
  acquisitionType: AcquisitionType;
  notes?: string;
}

// Analytics types
export interface TickerMetrics {
  ticker: string;
  totalPremium: number;
  totalTrades: number;
  openPositions: number;
  realizedPnL: number;
  unrealizedPnL: number;
  annualizedReturn: number;
  avgDaysToExpiration: number;
  winRate: number;
}

export interface PortfolioMetrics {
  totalPremiumCollected: number;
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  totalCapitalDeployed: number;
  annualizedReturn: number;
  totalTrades: number;
  activeTrades: number;
  activePositions: number;
  winRate: number;
  avgPremiumPerTrade: number;
}
