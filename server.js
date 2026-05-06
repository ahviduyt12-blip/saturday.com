// ===== SATURDAY PLATFORM — SERVER =====
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend files
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// Import all routes from one file
const { authRouter, userRouter, taxRouter, activationRouter, withdrawRouter, vipRouter, adminRouter } = require('./routes/all-routes');

// Mount routes
app.use('/api/auth',       authRouter);
app.use('/api/user',       userRouter);
app.use('/api/tax',        taxRouter);
app.use('/api/activation', activationRouter);
app.use('/api/withdraw',   withdrawRouter);
app.use('/api/vip',        vipRouter);
app.use('/api/admin',      adminRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', platform: 'Saturday' }));

// Catch all
app.get('/{*path}', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ message: 'Not found' });
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   🌟  Saturday Platform Running          ║
║   🌐  http://localhost:${PORT}              ║
║   👑  http://localhost:${PORT}/admin/       ║
║   phone   : 01718158600                  ║
║   password: admin123                     ║
╚══════════════════════════════════════════╝
  `);
});

module.exports = app;
