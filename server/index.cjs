const express = require('express');
const cors = require('cors');
const compression = require('compression');

// Import all route handlers
const leaderboard = require('./routes/leaderboard.cjs');
const activity = require('./routes/activity.cjs');
const subnetOverview = require('./routes/subnet-overview.cjs');
const environments = require('./routes/environments.cjs');
const liveEnvLeaderboard = require('./routes/live-env-leaderboard.cjs');
const liveEnrichment = require('./routes/live-enrichment.cjs');
const performanceByEnv = require('./routes/performance-by-env.cjs');
const resultsOverTime = require('./routes/results-over-time.cjs');
const dailyRolloutsByModel = require('./routes/daily-rollouts-by-model.cjs');
const networkActivity = require('./routes/network-activity.cjs');
const environmentStats = require('./routes/environment-stats.cjs');
const minerEfficiency = require('./routes/miner-efficiency.cjs');
const topMinersByEnv = require('./routes/top-miners-by-env.cjs');
const scoreDistributionByEnv = require('./routes/score-distribution-by-env.cjs');
const latencyDistributionByEnv = require('./routes/latency-distribution-by-env.cjs');
const gpuMarketShare = require('./routes/gpu-market-share.cjs');
const minerEfficiencyCost = require('./routes/miner-efficiency-cost.cjs');
const debugExtraJson = require('./routes/debug-extra-json.cjs');
const rolloutsModel = require('./routes/rollouts-model.cjs');
const subnetPerformanceTrend = require('./routes/subnet-performance-trend.cjs');
const validatorSummary = require('./routes/validator-summary.cjs');
const weights = require('./routes/weights.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(compression()); // Enable gzip compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'affine-dashboard-api',
    port: PORT,
    uptime: process.uptime()
  });
});

// Register all API routes
app.get('/api/leaderboard', leaderboard);
app.get('/api/activity', activity);
app.get('/api/subnet-overview', subnetOverview);
app.get('/api/environments', environments);
app.post('/api/live-enrichment', liveEnrichment);
app.get('/api/performance-by-env', performanceByEnv);
app.get('/api/results-over-time', resultsOverTime);
app.get('/api/daily-rollouts-by-model', dailyRolloutsByModel);
app.get('/api/network-activity', networkActivity);
app.get('/api/environment-stats', environmentStats);
app.get('/api/miner-efficiency', minerEfficiency);
app.get('/api/top-miners-by-env', topMinersByEnv);
app.get('/api/score-distribution-by-env', scoreDistributionByEnv);
app.get('/api/latency-distribution-by-env', latencyDistributionByEnv);
app.get('/api/gpu-market-share', gpuMarketShare);
app.get('/api/miner-efficiency-cost', minerEfficiencyCost);
app.get('/api/debug-extra-json', debugExtraJson);
app.get('/api/rollouts/model', rolloutsModel);
app.get('/api/subnet/performance-trend', subnetPerformanceTrend);
app.get('/api/validator-summary', validatorSummary);
app.get('/api/weights', weights);

// Dynamic route: live environment leaderboard
app.get('/api/live-env-leaderboard/:env', liveEnvLeaderboard);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/leaderboard',
      'GET /api/activity',
      'GET /api/subnet-overview',
      'GET /api/environments',
      'POST /api/live-enrichment',
      'GET /api/performance-by-env',
      'GET /api/results-over-time',
      'GET /api/daily-rollouts-by-model',
      'GET /api/network-activity',
      'GET /api/environment-stats',
      'GET /api/miner-efficiency',
      'GET /api/top-miners-by-env',
      'GET /api/score-distribution-by-env',
      'GET /api/latency-distribution-by-env',
      'GET /api/gpu-market-share',
      'GET /api/miner-efficiency-cost',
      'GET /api/debug-extra-json',
      'GET /api/rollouts/model',
      'GET /api/subnet/performance-trend',
      'GET /api/validator-summary',
      'GET /api/weights',
      'GET /api/live-env-leaderboard/:env'
    ]
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error';
  const stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;

  res.status(500).json({
    error: 'Internal Server Error',
    message,
    stack,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
const server = app.listen(PORT, () => {
  console.log(`Affine Dashboard API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`PM2 Cluster Mode: ${process.env.NODE_APP_INSTANCE ? 'Worker ' + process.env.NODE_APP_INSTANCE : 'Master'}`);
});

// Handle graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }

    console.log('HTTP server closed');

    // Close database connections
    const { closePool } = require('./config/database.cjs');
    closePool().then(() => {
      console.log('Graceful shutdown completed');
      process.exit(0);
    }).catch((err) => {
      console.error('Error closing database connections:', err);
      process.exit(1);
    });
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;