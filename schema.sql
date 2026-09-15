CREATE TABLE IF NOT EXISTS portfolio_projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quote_enquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  organisation TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity TEXT NOT NULL DEFAULT '',
  timeframe TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_portfolio_created_at ON portfolio_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON quote_enquiries(created_at DESC);
