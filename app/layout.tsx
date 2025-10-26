import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { fetchEnvironments } from '@/lib/services/api';

export const metadata: Metadata = {
  title: 'Affine Validator Dashboard',
  description:
    'High-performance validator analytics with static-first rendering and live insights.',
};

async function getInitialEnvironments() {
  try {
    return await fetchEnvironments();
  } catch (error) {
    console.error('Failed to preload environments', error);
    return [];
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialEnvironments = await getInitialEnvironments();
  return (
    <html lang="en">
      <body className="min-h-screen bg-light-75 text-light-500 antialiased">
        <Providers initialEnvironments={initialEnvironments}>{children}</Providers>
      </body>
    </html>
  );
}
