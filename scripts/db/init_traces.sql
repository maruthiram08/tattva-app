-- Run this in your Vercel Data interface (Query Runner)
-- or via Vercel CLI if connected.

CREATE TABLE IF NOT EXISTS traces (
  id SERIAL PRIMARY KEY,
  trace_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data JSONB NOT NULL
);

-- Index for faster querying by time (e.g. recent traces)
CREATE INDEX IF NOT EXISTS idx_traces_timestamp ON traces(timestamp DESC);

-- Index for querying by trace_id
CREATE INDEX IF NOT EXISTS idx_traces_trace_id ON traces(trace_id);
