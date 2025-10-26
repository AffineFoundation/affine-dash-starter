import EnvironmentPage from '@/components/EnvironmentPage';
import {
  fetchLatencyDistributionByEnv,
  fetchScoreDistributionByEnv,
  fetchSubnetOverview,
  fetchEnvironments,
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

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const envs = await fetchEnvironments();
    return envs.map((env) => ({ envName: encodeURIComponent(env) }));
  } catch {
    return [];
  }
}

type EnvironmentRouteProps = {
  params: {
    envName: string;
  };
};

export default async function EnvironmentRoute({
  params,
}: EnvironmentRouteProps) {
  const decodedEnv = decodeURIComponent(params.envName || '');
  const env = decodedEnv.toUpperCase();

  const [overviewRes, scoreRes, latencyRes] = await Promise.allSettled([
    fetchSubnetOverview(),
    fetchScoreDistributionByEnv(env),
    fetchLatencyDistributionByEnv(env),
  ]);

  const historicalData =
    overviewRes.status === 'fulfilled' ? overviewRes.value : [];
  const historicalError =
    overviewRes.status === 'fulfilled'
      ? null
      : toErrorMessage(overviewRes.reason);

  const scoreDistribution =
    scoreRes.status === 'fulfilled' ? scoreRes.value : [];
  const scoreDistributionError =
    scoreRes.status === 'fulfilled'
      ? null
      : toErrorMessage(scoreRes.reason);

  const latencyDistribution =
    latencyRes.status === 'fulfilled' ? latencyRes.value : [];
  const latencyDistributionError =
    latencyRes.status === 'fulfilled'
      ? null
      : toErrorMessage(latencyRes.reason);

  return (
    <EnvironmentPage
      envName={env}
      historicalData={historicalData}
      historicalError={historicalError}
      scoreDistribution={scoreDistribution}
      scoreDistributionError={scoreDistributionError}
      latencyDistribution={latencyDistribution}
      latencyDistributionError={latencyDistributionError}
    />
  );
}
