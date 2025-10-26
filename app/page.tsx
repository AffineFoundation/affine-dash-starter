import OverviewPage from '@/components/OverviewPage';

export const revalidate = 300;
import {
  fetchActivity,
  fetchEnvironmentStats,
  fetchGpuMarketShare,
  fetchMinerEfficiency,
  fetchMinerEfficiencyCost,
  fetchNetworkActivity,
  fetchSubnetOverview,
} from '@/lib/services/api';

function toErrorMessage(reason: unknown) {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === 'string') return reason;
  try {
    return JSON.stringify(reason);
  } catch {
    return 'Unknown error';
  }
}

export default async function HomePage() {
  const [
    historicalOverviewRes,
    networkActivityRes,
    environmentStatsRes,
    minerEfficiencyRes,
    gpuMarketShareRes,
    minerEfficiencyCostRes,
    activityFeedRes,
  ] = await Promise.allSettled([
    fetchSubnetOverview(),
    fetchNetworkActivity(),
    fetchEnvironmentStats(),
    fetchMinerEfficiency(),
    fetchGpuMarketShare(),
    fetchMinerEfficiencyCost(),
    fetchActivity(),
  ]);

  const historicalOverview =
    historicalOverviewRes.status === 'fulfilled'
      ? historicalOverviewRes.value
      : [];
  const historicalOverviewError =
    historicalOverviewRes.status === 'fulfilled'
      ? null
      : toErrorMessage(historicalOverviewRes.reason);

  const networkActivity =
    networkActivityRes.status === 'fulfilled' ? networkActivityRes.value : [];
  const networkActivityError =
    networkActivityRes.status === 'fulfilled'
      ? null
      : toErrorMessage(networkActivityRes.reason);

  const environmentStats =
    environmentStatsRes.status === 'fulfilled' ? environmentStatsRes.value : [];
  const environmentStatsError =
    environmentStatsRes.status === 'fulfilled'
      ? null
      : toErrorMessage(environmentStatsRes.reason);

  const minerEfficiency =
    minerEfficiencyRes.status === 'fulfilled' ? minerEfficiencyRes.value : [];
  const minerEfficiencyError =
    minerEfficiencyRes.status === 'fulfilled'
      ? null
      : toErrorMessage(minerEfficiencyRes.reason);

  const gpuMarketShare =
    gpuMarketShareRes.status === 'fulfilled' ? gpuMarketShareRes.value : [];
  const gpuMarketShareError =
    gpuMarketShareRes.status === 'fulfilled'
      ? null
      : toErrorMessage(gpuMarketShareRes.reason);

  const minerEfficiencyCost =
    minerEfficiencyCostRes.status === 'fulfilled'
      ? minerEfficiencyCostRes.value
      : [];
  const minerEfficiencyCostError =
    minerEfficiencyCostRes.status === 'fulfilled'
      ? null
      : toErrorMessage(minerEfficiencyCostRes.reason);

  const activityFeed =
    activityFeedRes.status === 'fulfilled' ? activityFeedRes.value : [];
  const activityFeedError =
    activityFeedRes.status === 'fulfilled'
      ? null
      : toErrorMessage(activityFeedRes.reason);

  return (
    <OverviewPage
      historicalOverview={historicalOverview}
      historicalOverviewError={historicalOverviewError}
      networkActivity={networkActivity}
      networkActivityError={networkActivityError}
      environmentStats={environmentStats}
      environmentStatsError={environmentStatsError}
      minerEfficiency={minerEfficiency}
      minerEfficiencyError={minerEfficiencyError}
      gpuMarketShare={gpuMarketShare}
      gpuMarketShareError={gpuMarketShareError}
      minerEfficiencyCost={minerEfficiencyCost}
      minerEfficiencyCostError={minerEfficiencyCostError}
      activityFeed={activityFeed}
      activityFeedError={activityFeedError}
    />
  );
}
