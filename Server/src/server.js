require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

const usersRouter = require('./routes/users.routes');
const backupCodesRouter = require('./routes/backupCodes.routes');
const mongodbRouter = require('./routes/mongodb.routes');
const mailboxRouter = require('./routes/mailbox.routes');
const { createAdminDirectoryClient } = require('./lib/googleAuth');
const { connectToMongoDB, testMongoDBConnection } = require('./lib/mongodb');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/health', async (req, res) => {
  const mongoStatus = await testMongoDBConnection();
  res.json({ 
    ok: true, 
    uptime: process.uptime(),
    mongodb: mongoStatus ? 'connected' : 'disconnected',
    test: 'MongoDB integration test'
  });
});

// Health check with Admin SDK
app.get('/health/admin', async (req, res, next) => {
  try {
    const subject = process.env.GOOGLE_IMPERSONATE_SUBJECT;
    let clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    try {
      if (!clientEmail && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const fs = require('fs');
        const path = require('path');
        const p = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        const json = JSON.parse(fs.readFileSync(p, 'utf8'));
        clientEmail = json.client_email;
      }
    } catch (_) {}

    const admin = createAdminDirectoryClient();
    // Try a lightweight call: get current customer or list first user
    const { data } = await admin.users.list({ customer: 'my_customer', maxResults: 1, orderBy: 'email' });
    res.json({ ok: true, adminAuth: true, subject, clientEmail, sample: data.users ? data.users[0]?.primaryEmail : null });
  } catch (err) {
    const subject = process.env.GOOGLE_IMPERSONATE_SUBJECT;
    let clientEmail = process.env.GOOGLE_CLIENT_EMAIL || null;
    res.status(500).json({ ok: false, adminAuth: false, subject, clientEmail, error: err.message, code: err.code });
  }
});

// Routes
app.use('/api/users', usersRouter);
app.use('/api/backup-codes', backupCodesRouter);
app.use('/api/mongodb', mongodbRouter);
app.use('/api/mailbox', mailboxRouter);

// Error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

// Start server
const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Connect to MongoDB first
    await connectToMongoDB();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
      console.log(`📊 MongoDB connected successfully`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();


