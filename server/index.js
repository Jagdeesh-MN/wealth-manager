import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';

const app = express();
const PORT = 3001;

const DATA_DIR = path.join(os.homedir(), '.wealth-manager');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

const INITIAL_STATE = { snapshots: [], activeSnapshotId: null };

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_STATE, null, 2));
    console.log(`Created data file at ${DATA_FILE}`);
  }
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return INITIAL_STATE;
  }
}

function writeState(state) {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, DATA_FILE); // atomic on same filesystem
}

ensureDataFile();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/state', (_req, res) => {
  res.json(readState());
});

app.post('/api/state', (req, res) => {
  try {
    writeState(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to save state:', err);
    res.status(500).json({ error: 'Failed to save' });
  }
});

app.get('/api/export/json', (_req, res) => {
  const date = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Disposition', `attachment; filename="wealth-data-${date}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.send(fs.readFileSync(DATA_FILE));
});

const server = app.listen(PORT, () => {
  console.log(`WealthTracker server running on http://localhost:${PORT}`);
  console.log(`Data file: ${DATA_FILE}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Kill the old process and retry.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
