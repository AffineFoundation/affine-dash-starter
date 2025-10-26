'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import OverviewTable from '@/components/OverviewTable';
import ActivityFeed from '@/components/ActivityFeed';
import { ParallaxLightBeams } from '@/components/ParallaxLightBeams';
import { ParallaxNoise } from '@/components/ParallaxNoise';
import { useTheme } from '@/hooks/useTheme';
import { useEnvironments } from '@/contexts/EnvironmentsContext';
import type {
  ActivityRow,
  EnvironmentStatsRow,
  GpuMarketShareRow,
  MinerEfficiencyCostRow,
  MinerEfficiencyRow,
  NetworkActivityRow,
  SubnetOverviewRow,
} from '@/lib/types';

function ChartFallback({ message }: { message: string }) {
  return (
    <div className="h-64 border-2 border-dashed border-light-300/60 rounded-none flex items-center justify-center bg-white/30">
      <span className="text-xs font-sans text-light-350">{message}</span>
    </div>
  );
}

type OverviewPageProps = {
  historicalOverview: SubnetOverviewRow[];
  historicalOverviewError?: string | null;
  networkActivity: NetworkActivityRow[];
  networkActivityError?: string | null;
  environmentStats: EnvironmentStatsRow[];
  environmentStatsError?: string | null;
  minerEfficiency: MinerEfficiencyRow[];
  minerEfficiencyError?: string | null;
  gpuMarketShare: GpuMarketShareRow[];
  gpuMarketShareError?: string | null;
  minerEfficiencyCost: MinerEfficiencyCostRow[];
  minerEfficiencyCostError?: string | null;
  activityFeed: ActivityRow[];
  activityFeedError?: string | null;
};

const NetworkActivityChart = dynamic(
  () => import('@/components/NetworkActivityChart'),
  {
    ssr: false,
    loading: () => (
      <ChartFallback message="Loading network activity chart…" />
    ),
  },
);
const EnvironmentStatsChart = dynamic(
  () => import('@/components/EnvironmentStatsChart'),
  {
    ssr: false,
    loading: () => (
      <ChartFallback message="Loading environment stats chart…" />
    ),
  },
);
const MinerEfficiencyChart = dynamic(
  () => import('@/components/MinerEfficiencyChart'),
  {
    ssr: false,
    loading: () => (
      <ChartFallback message="Loading miner efficiency chart…" />
    ),
  },
);
const GpuMarketShareDonut = dynamic(
  () => import('@/components/GpuMarketShareDonut'),
  {
    ssr: false,
    loading: () => (
      <ChartFallback message="Loading GPU market share chart…" />
    ),
  },
);
const CostPerformanceScatter = dynamic(
  () => import('@/components/CostPerformanceScatter'),
  {
    ssr: false,
    loading: () => (
      <ChartFallback message="Loading cost vs performance chart…" />
    ),
  },
);

export function OverviewPage({
  historicalOverview,
  historicalOverviewError,
  networkActivity,
  networkActivityError,
  environmentStats,
  environmentStatsError,
  minerEfficiency,
  minerEfficiencyError,
  gpuMarketShare,
  gpuMarketShareError,
  minerEfficiencyCost,
  minerEfficiencyCostError,
  activityFeed,
  activityFeedError,
}: OverviewPageProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { environments } = useEnvironments();
  const [activeSection, setActiveSection] = React.useState<string>('');

  const networkActivityRef = React.useRef<HTMLDivElement | null>(null);
  const environmentStatsRef = React.useRef<HTMLDivElement | null>(null);
  const minerEfficiencyRef = React.useRef<HTMLDivElement | null>(null);
  const gpuMarketShareRef = React.useRef<HTMLDivElement | null>(null);
  const costPerformanceRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target;
            let newSection = '';
            if (target === networkActivityRef.current) newSection = 'network';
            else if (target === environmentStatsRef.current)
              newSection = 'environment';
            else if (target === minerEfficiencyRef.current)
              newSection = 'performance';
            else if (target === gpuMarketShareRef.current) newSection = 'gpu';
            else if (target === costPerformanceRef.current) newSection = 'cost';

            if (newSection) {
              setActiveSection(newSection);
            }
          }
        });
      },
      { threshold: 0.3, rootMargin: '-20% 0px -20% 0px' },
    );

    const refs = [
      networkActivityRef,
      environmentStatsRef,
      minerEfficiencyRef,
      gpuMarketShareRef,
      costPerformanceRef,
    ];
    refs.forEach((ref) => ref.current && observer.observe(ref.current));

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (
    ref: React.RefObject<HTMLDivElement>,
    sectionName: string,
  ) => {
    setActiveSection(sectionName);
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const captureRef = React.useRef(false);
  const bufferRef = React.useRef<string>('');
  const timeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const clearTimer = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const commit = () => {
      const buf = bufferRef.current;
      captureRef.current = false;
      bufferRef.current = '';
      clearTimer();
      if (!buf) return;
      const idx = parseInt(buf, 10);
      if (Number.isNaN(idx)) return;
      if (idx === 0) {
        router.push('/');
        return;
      }
      const targetIndex = idx - 1;
      if (targetIndex >= 0 && targetIndex < environments.length) {
        const envName = environments[targetIndex];
        router.push(`/environment/${encodeURIComponent(envName)}`);
      }
    };

    const shouldIgnore = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return true;
      const target = e.target as HTMLElement | null;
      if (!target) return false;
      const tag = target.tagName;
      const editable = (target as HTMLElement).isContentEditable;
      return (
        editable ||
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (tag === 'DIV' && target.getAttribute('role') === 'textbox')
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnore(e)) return;

      if (!captureRef.current) {
        if (e.key.toLowerCase() === 'n') {
          captureRef.current = true;
          bufferRef.current = '';
          clearTimer();
          e.preventDefault();
        }
        return;
      }

      if (/^\d$/.test(e.key)) {
        bufferRef.current += e.key;
        e.preventDefault();

        if (bufferRef.current.length >= 3) {
          commit();
          return;
        }
        clearTimer();
        timeoutRef.current = window.setTimeout(commit, 600);
      } else {
        if (bufferRef.current) {
          commit();
        } else {
          captureRef.current = false;
          bufferRef.current = '';
          clearTimer();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimer();
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [environments, router]);

  return (
    <div className="min-h-screen transition-colors duration-300 bg-light-sand text-light-smoke relative">
      <ParallaxLightBeams />
      <ParallaxNoise />
      <Header theme={theme} toggleTheme={toggleTheme} />
      <Hero />
      <main className="mt-16 px-5 pb-20 w-full">
        <div className="space-y-28">
          <OverviewTable
            theme={theme}
            historicalData={historicalOverview}
            historicalError={historicalOverviewError}
          />
          <div className="flex flex-col xl:flex-row gap-16">
            <aside className="w-full xl:w-60 xl:sticky top-5 self-start h-fit">
              <h3 className="font-mono uppercase text-xs leading-none tracking-wide">
                ENVIRONMENT OVERVIEW
              </h3>
              <ul className="space-y-2 uppercase mt-5 font-medium text-sm leading-none tracking-wide">
                <SectionLink
                  label="Network Activity & Performance"
                  active={activeSection === 'network'}
                  onClick={() => scrollToSection(networkActivityRef, 'network')}
                />
                <SectionLink
                  label="Environment Popularity & Difficulty"
                  active={activeSection === 'environment'}
                  onClick={() =>
                    scrollToSection(environmentStatsRef, 'environment')
                  }
                />
                <SectionLink
                  label="Performance vs. Latency"
                  active={activeSection === 'performance'}
                  onClick={() =>
                    scrollToSection(minerEfficiencyRef, 'performance')
                  }
                />
                <SectionLink
                  label="GPU Market Share"
                  active={activeSection === 'gpu'}
                  onClick={() => scrollToSection(gpuMarketShareRef, 'gpu')}
                />
                <SectionLink
                  label="Cost vs Performance"
                  active={activeSection === 'cost'}
                  onClick={() => scrollToSection(costPerformanceRef, 'cost')}
                />
              </ul>
            </aside>
            <div className="flex flex-col gap-8 w-full">
              <div ref={networkActivityRef} className="break-inside-avoid">
                <NetworkActivityChart
                  theme={theme}
                  data={networkActivity}
                  errorMessage={networkActivityError}
                />
              </div>
              <div ref={environmentStatsRef} className="break-inside-avoid">
                <EnvironmentStatsChart
                  theme={theme}
                  data={environmentStats}
                  errorMessage={environmentStatsError}
                />
              </div>
              <div ref={minerEfficiencyRef} className="break-inside-avoid">
                <MinerEfficiencyChart
                  theme={theme}
                  data={minerEfficiency}
                  errorMessage={minerEfficiencyError}
                />
              </div>
              <div ref={gpuMarketShareRef} className="break-inside-avoid">
                <GpuMarketShareDonut
                  theme={theme}
                  data={gpuMarketShare}
                  errorMessage={gpuMarketShareError}
                />
              </div>
              <div ref={costPerformanceRef} className="break-inside-avoid">
                <CostPerformanceScatter
                  theme={theme}
                  data={minerEfficiencyCost}
                  errorMessage={minerEfficiencyCostError}
                />
              </div>
              <ActivityFeed
                theme={theme}
                initialData={activityFeed}
                errorMessage={activityFeedError}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SectionLink({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li
      className={`flex items-center gap-2 transition-opacity duration-300 ease-out select-none ${
        active ? 'opacity-30 cursor-auto ' : 'cursor-pointer hover:opacity-30'
      }`}
      onClick={onClick}
    >
      <div
        className={`w-2 h-2 shrink-0 rounded-full bg-black transition-transform duration-300 ease-out ${
          active ? 'scale-100' : 'scale-0'
        }`}
      />
      {label}
    </li>
  );
}

export default OverviewPage;
