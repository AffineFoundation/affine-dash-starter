import express from 'express';
const router = express.Router();

import leaderboardHandler from './leaderboard.js';
import activityHandler from './activity.js';
import performanceByEnvHandler from './performance-by-env.js';
import resultsOverTimeHandler from './results-over-time.js';
import dailyRolloutsByModelHandler from './daily-rollouts-by-model.js';
import subnetOverviewHandler from './subnet-overview.js';
import environmentsHandler from './environments.js';
import networkActivityHandler from './network-activity.js';
import environmentStatsHandler from './environment-stats.js';
import minerEfficiencyHandler from './miner-efficiency.js';
import topMinersByEnvHandler from './top-miners-by-env.js';
import scoreDistributionByEnvHandler from './score-distribution-by-env.js';
import latencyDistributionByEnvHandler from './latency-distribution-by-env.js';
import gpuMarketShareHandler from './gpu-market-share.js';
import minerEfficiencyCostHandler from './miner-efficiency-cost.js';
import liveEnvLeaderboardHandler from './live-env-leaderboard.js';
import liveEnrichmentHandler from './live-enrichment.js';

router.get('/leaderboard', leaderboardHandler);
router.get('/activity', activityHandler);
router.get('/performance-by-env', performanceByEnvHandler);
router.get('/results-over-time', resultsOverTimeHandler);
router.get('/daily-rollouts-by-model', dailyRolloutsByModelHandler);
router.get('/subnet-overview', subnetOverviewHandler);
router.get('/environments', environmentsHandler);
router.get('/network-activity', networkActivityHandler);
router.get('/environment-stats', environmentStatsHandler);
router.get('/miner-efficiency', minerEfficiencyHandler);
router.get('/top-miners-by-env', topMinersByEnvHandler);
router.get('/score-distribution-by-env', scoreDistributionByEnvHandler);
router.get('/latency-distribution-by-env', latencyDistributionByEnvHandler);
router.get('/gpu-market-share', gpuMarketShareHandler);
router.get('/miner-efficiency-cost', minerEfficiencyCostHandler);

router.get('/live-env-leaderboard/:env', liveEnvLeaderboardHandler);

router.post('/live-enrichment', liveEnrichmentHandler);

export default router;