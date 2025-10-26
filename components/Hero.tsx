'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEnvironments } from '@/contexts/EnvironmentsContext';
import RedIndicator from './RedIndicator';

export default function Hero() {
  const {
    environments,
    loading: envLoading,
    error: envError,
  } = useEnvironments();
  const pathname = usePathname();

  const sidebarItemClass = (active: boolean) => {
    const base =
      'rounded-full px-6 py-3 text-sm transition-colors duration-500 uppercase font-medium tracking-wide leading-[80%]'
    if (active) {
      return `${base} bg-black text-white`
    }
    return `${base} text-light-smoke`
  }

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <div className="px-5 flex justify-between items-center">
      <div className="flex items-start gap-3">
        <h1 className="uppercase text-7xl leading-[80%]">Dashboard</h1>

        <RedIndicator text="Live" live />
      </div>

      <nav className="flex items-center gap-2 bg-white p-[10px] rounded-full border border-black/6">
        <Link
          href="/"
          className={sidebarItemClass(isActive('/'))}
          title="Press N then 0 to switch to Overview"
        >
          Overview
        </Link>

        {envLoading && <div className={sidebarItemClass(false)}>Loading…</div>}

        {!envLoading && envError && (
          <div className={sidebarItemClass(false)}>Error</div>
        )}

        {!envLoading &&
          !envError &&
          environments.map((env, i) => (
            <Link
              key={env}
              href={`/environment/${encodeURIComponent(env)}`}
              className={sidebarItemClass(
                isActive(`/environment/${encodeURIComponent(env)}`),
              )}
              title={`Press N then ${i + 1} to switch to ${env}`}
            >
              {env}
            </Link>
          ))}

        <span
          className="rounded-full px-6 py-3 text-sm transition-colors duration-500 uppercase font-medium tracking-wide leading-[80%] text-light-smoke bg-light-sand"
          title=""
        >
          See more (4)
        </span>
      </nav>
    </div>
  )
}
