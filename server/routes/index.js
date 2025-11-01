import express from 'express';
import leaderboard from '../handlers/leaderboard.js';
import activity from '../handlers/activity.js';
import performanceByEnv from '../handlers/performance-by-env.js';
import resultsOverTime from '../handlers/results-over-time.js';
import dailyRolloutsByModel from '../handlers/daily-rollouts-by-model.js';
import subnetOverview from '../handlers/subnet-overview.js';
import environments from '../handlers/environments.js';
import networkActivity from '../handlers/network-activity.js';
import environmentStats from '../handlers/environment-stats.js';
import minerEfficiency from '../handlers/miner-efficiency.js';
import topMinersByEnv from '../handlers/top-miners-by-env.js';
import scoreDistributionByEnv from '../handlers/score-distribution-by-env.js';
import latencyDistributionByEnv from '../handlers/latency-distribution-by-env.js';
import gpuMarketShare from '../handlers/gpu-market-share.js';
import minerEfficiencyCost from '../handlers/miner-efficiency-cost.js';
import liveEnrichment from '../handlers/live-enrichment.js';
import liveEnvLeaderboard from '../handlers/live-env-leaderboard.js';

const router = express.Router();

// API routes
router.get('/leaderboard', leaderboard);
router.get('/activity', activity);
router.get('/performance-by-env', performanceByEnv);
router.get('/results-over-time', resultsOverTime);
router.get('/daily-rollouts-by-model', dailyRolloutsByModel);
router.get('/subnet-overview', subnetOverview);
router.get('/environments', environments);
router.get('/network-activity', networkActivity);
router.get('/environment-stats', environmentStats);
router.get('/miner-efficiency', minerEfficiency);
router.get('/top-miners-by-env', topMinersByEnv);
router.get('/score-distribution-by-env', scoreDistributionByEnv);
router.get('/latency-distribution-by-env', latencyDistributionByEnv);
router.get('/gpu-market-share', gpuMarketShare);
router.get('/miner-efficiency-cost', minerEfficiencyCost);
router.post('/live-enrichment', liveEnrichment);
router.get('/live-env-leaderboard/:env', liveEnvLeaderboard);

export default router;

