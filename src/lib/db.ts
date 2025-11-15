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
      action TEXT NOT NULL DEFAULT 'SELL_TO_OPEN' CHECK(action IN ('SELL_TO_OPEN', 'BUY_TO_CLOSE', 'BUY_TO_OPEN', 'SELL_TO_CLOSE')),
      strike REAL NOT NULL,
      expiration TEXT NOT NULL,
      premium REAL NOT NULL,
      quantity INTEGER NOT NULL,
      open_date TEXT NOT NULL,
      close_date TEXT,
      close_premium REAL,
      close_method TEXT CHECK(close_method IN ('BUYBACK', 'ROLL', 'EXPIRED', 'ASSIGNED')),
      status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'CLOSED', 'ASSIGNED', 'EXPIRED', 'ROLLED')),
      notes TEXT,
      position_id TEXT,
      rolled_to_trade_id TEXT,
      rolled_from_trade_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL,
      FOREIGN KEY (rolled_to_trade_id) REFERENCES trades(id) ON DELETE SET NULL,
      FOREIGN KEY (rolled_from_trade_id) REFERENCES trades(id) ON DELETE SET NULL
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

    CREATE TABLE IF NOT EXISTS account_settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      total_capital REAL NOT NULL DEFAULT 0,
      cash_available REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS current_prices (
      ticker TEXT PRIMARY KEY,
      stock_price REAL,
      option_price REAL,
      strike REAL,
      expiration TEXT,
      option_type TEXT CHECK(option_type IN ('PUT', 'CALL')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_trades_ticker ON trades(ticker);
    CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
    CREATE INDEX IF NOT EXISTS idx_trades_expiration ON trades(expiration);
    CREATE INDEX IF NOT EXISTS idx_positions_ticker ON positions(ticker);
    CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
    CREATE INDEX IF NOT EXISTS idx_current_prices_ticker ON current_prices(ticker);

    -- Initialize default account settings if not exists
    INSERT OR IGNORE INTO account_settings (id, total_capital, cash_available)
    VALUES ('default', 0, 0);
  `);

  // Migrate existing database if needed
  migrateDatabase();
}

// Migrate existing database to add new columns
function migrateDatabase() {
  try {
    // Check if action column exists
    const columnsResult = db.prepare("PRAGMA table_info(trades)").all() as any[];
    const hasAction = columnsResult.some(col => col.name === 'action');

    if (!hasAction) {
      // Add new columns to existing trades table
      db.exec(`
        ALTER TABLE trades ADD COLUMN action TEXT DEFAULT 'SELL_TO_OPEN';
        ALTER TABLE trades ADD COLUMN close_method TEXT;
        ALTER TABLE trades ADD COLUMN rolled_to_trade_id TEXT;
        ALTER TABLE trades ADD COLUMN rolled_from_trade_id TEXT;
      `);

      // Update existing trades to set default action based on status
      db.prepare(`
        UPDATE trades
        SET action = CASE
          WHEN status = 'CLOSED' THEN 'SELL_TO_OPEN'
          ELSE 'SELL_TO_OPEN'
        END
        WHERE action IS NULL
      `).run();
    }
  } catch (error) {
    // Columns might already exist, ignore error
    console.log('Migration note:', error);
  }
}

// Initialize on import
initDatabase();

// Helper function to generate IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default db;
