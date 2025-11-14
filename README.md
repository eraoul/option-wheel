# Option Wheel Tracker

A comprehensive web application for tracking option wheel trading strategies, including cash-secured puts (CSP) and covered calls (CC).

## Features

### Core Functionality
- **Trade Management**: Add and track cash-secured puts and covered calls
- **Position Tracking**: Monitor stock positions acquired through assignments (tracked in 100-share lots)
- **Portfolio Analytics**: View comprehensive metrics across your entire portfolio
- **Per-Ticker Analytics**: Detailed performance metrics for each ticker symbol

### Key Metrics
- **Annualized Returns**: Calculated both per-ticker and portfolio-wide
- **Win Rate**: Percentage of profitable closed trades
- **Realized P&L**: Profit/loss from closed positions
- **Total Premium Collected**: Sum of all premiums from option trades
- **Active Positions**: Real-time tracking of open trades and stock positions

### User Interface
- **Dashboard**: Overview of portfolio performance with quick actions
- **Trades Tab**: Comprehensive list of all option trades with filtering
- **Positions Tab**: Track stock holdings in 100-share lots
- **Analytics Tab**: Detailed per-ticker performance analysis
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **UI Library**: shadcn/ui components
- **Styling**: Tailwind CSS 4
- **Database**: SQLite with better-sqlite3
- **React**: Version 19 with Server Components

## Database Schema

### Trades Table
- Tracks individual option contracts (puts and calls)
- Records: strike price, expiration, premium, quantity, status
- Supports: OPEN, CLOSED, ASSIGNED, EXPIRED statuses

### Positions Table
- Tracks stock positions in 100-share lots
- Records: cost basis, acquisition method, shares held
- Acquisition types: Put Assignment, Call Assignment, Direct Purchase

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
option-wheel/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── trades/       # Trade CRUD endpoints
│   │   │   ├── positions/    # Position CRUD endpoints
│   │   │   └── analytics/    # Analytics endpoints
│   │   ├── page.tsx          # Main dashboard
│   │   └── layout.tsx        # Root layout
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── trade-form.tsx    # Add trade dialog
│   │   ├── position-form.tsx # Add position dialog
│   │   ├── trade-list.tsx    # Trade table
│   │   ├── position-list.tsx # Position table
│   │   └── ticker-analytics.tsx # Analytics view
│   └── lib/
│       ├── db.ts             # Database initialization
│       ├── db-operations.ts  # CRUD operations
│       ├── types.ts          # TypeScript types
│       └── utils.ts          # Utility functions
└── option-wheel.db           # SQLite database (gitignored)
```

## API Routes

### Trades
- `GET /api/trades` - Get all trades
- `GET /api/trades?ticker=AAPL` - Get trades for a ticker
- `POST /api/trades` - Create new trade
- `PATCH /api/trades/[id]` - Update trade
- `DELETE /api/trades/[id]` - Delete trade

### Positions
- `GET /api/positions` - Get all positions
- `GET /api/positions?status=open` - Get open positions
- `POST /api/positions` - Create new position
- `PATCH /api/positions/[id]` - Update position
- `DELETE /api/positions/[id]` - Delete position

### Analytics
- `GET /api/analytics` - Get portfolio metrics
- `GET /api/analytics?ticker=AAPL` - Get ticker-specific metrics
- `GET /api/analytics?type=tickers` - Get list of all tickers

## Usage Examples

### Adding a Cash-Secured Put
1. Click "Add Trade" button
2. Enter ticker symbol (e.g., AAPL)
3. Select "Cash-Secured Put (CSP)"
4. Enter strike price, expiration date, and premium per share
5. Specify quantity (number of contracts)
6. Add optional notes

### Recording a Put Assignment
1. After a put expires ITM and shares are assigned
2. Click "Add Position"
3. Enter ticker and shares (must be in 100s)
4. Enter total cost basis
5. Select "Put Assignment" as acquisition type

### Viewing Analytics
- Navigate to Analytics tab
- View annualized returns for each ticker
- See win rates, total premium, and P&L by ticker
- Compare performance across your portfolio

## Annualized Returns Calculation

The application calculates annualized returns using:
- Total premium collected and realized P&L
- Capital deployed (cost basis of positions)
- Average days in trades
- Formula: `(Total Return / Capital) * (365 / Avg Days) * 100`

## Share Tracking

All stock positions are tracked in **lots of 100 shares**, which aligns with standard options contracts:
- 1 option contract = 100 shares
- When assigned, positions are automatically created in 100-share increments
- This ensures accurate tracking of option wheel cycles

## Development

### Code Quality
- TypeScript for type safety
- ESLint for code linting
- Biome for formatting

### Database
- SQLite for simple, file-based storage
- Better-sqlite3 for synchronous operations
- Automatic schema initialization on first run

## Future Enhancements

Potential features for future versions:
- Real-time stock price integration
- Profit/loss charts and visualizations
- Tax reporting and export functionality
- Mobile app version
- Multi-user support with authentication
- Automated trade import from brokers

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
