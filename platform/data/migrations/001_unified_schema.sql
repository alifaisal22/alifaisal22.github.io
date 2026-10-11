BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'candidate',
  credits INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS interview_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  source_system TEXT NOT NULL CHECK (source_system IN ('career_pilot', 'intervuex', 'unified')),
  mode TEXT NOT NULL CHECK (mode IN ('technical', 'hr', 'non_technical', 'sprint')),
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'cancelled')),
  transcript TEXT,
  score REAL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sandbox_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES interview_sessions(id),
  event_type TEXT NOT NULL,
  language TEXT,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS proctoring_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES interview_sessions(id),
  signal_type TEXT NOT NULL,
  score REAL NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS job_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('saved', 'applied', 'interviewing', 'offered', 'rejected')),
  source_url TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS legacy_mappings (
  id TEXT PRIMARY KEY,
  source_system TEXT NOT NULL CHECK (source_system IN ('career_pilot', 'intervuex')),
  source_entity TEXT NOT NULL,
  source_id TEXT NOT NULL,
  unified_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

COMMIT;
