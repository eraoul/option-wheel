import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'option-wheel.db');
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      ticker TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('PUT', 'CALL')),
      strike REAL NOT NULL,
      expiration TEXT NOT NULL,
      premium REAL NOT NULL,
      quantity INTEGER NOT NULL,
      open_date TEXT NOT NULL,
      close_date TEXT,
      close_premium REAL,
      status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'CLOSED', 'ASSIGNED', 'EXPIRED')),
      notes TEXT,
      position_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS positions (
      id TEXT PRIMARY KEY,
      ticker TEXT NOT NULL,
      shares INTEGER NOT NULL,
      cost_basis REAL NOT NULL,
      acquired_date TEXT NOT NULL,
      sold_date TEXT,
      sold_price REAL,
      status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'SOLD')),
      acquisition_type TEXT NOT NULL CHECK(acquisition_type IN ('ASSIGNED_PUT', 'ASSIGNED_CALL', 'DIRECT_PURCHASE')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_trades_ticker ON trades(ticker);
    CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
    CREATE INDEX IF NOT EXISTS idx_trades_expiration ON trades(expiration);
    CREATE INDEX IF NOT EXISTS idx_positions_ticker ON positions(ticker);
    CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
  `);
}

// Initialize on import
initDatabase();

// Helper function to generate IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default db;
