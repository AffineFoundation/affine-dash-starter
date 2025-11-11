import React from 'react';

interface ScoreCellProps {
  score: string | null | undefined;
  highlight?: boolean;
}

export type EnvScoreStats = {
  min: number;
  max: number;
  minFormatted: string;
  maxFormatted: string;
  width: number;
  midpoint: number;
  widthFormatted: string;
  midpointFormatted: string;
};

export const getEnvScoreStats = (
  score: string | null | undefined,
): EnvScoreStats | null => {
  if (score == null || score === '') return null;
  const cleanScore = score.replace(/\*/g, '');
  const parts = cleanScore.split('/');
  if (parts.length < 3) return null;
  const rangePart = parts[1].replace(/\[|\]/g, '');
  const [minRaw, maxRaw] = rangePart.split(',').map((part) => part.trim());
  const min = parseFloat(minRaw);
  const max = parseFloat(maxRaw);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  const width = max - min;
  const midpoint = min + width / 2;
  const formatCI = (value: number) =>
    Number.isFinite(value) ? value.toFixed(3) : '—';
  return {
    min,
    max,
    minFormatted: minRaw,
    maxFormatted: maxRaw,
    width,
    midpoint,
    widthFormatted: formatCI(width),
    midpointFormatted: formatCI(midpoint),
  };
};

const ScoreCell: React.FC<ScoreCellProps> = ({ score, highlight }) => {
  if (score == null || score === '') {
    return <span className="text-light-iron uppercase">N/A</span>;
  }

  const fallbackHighlight = score.startsWith('*') && score.endsWith('*');
  const stats = getEnvScoreStats(score);
  const display =
    stats != null
      ? `${stats.minFormatted}-${stats.maxFormatted}`
      : score.replace(/\*/g, '');

  const shouldHighlight = highlight ?? fallbackHighlight;

  return (
    <span
      style={{ color: shouldHighlight ? '#d59b37' : undefined }}
      className={shouldHighlight ? 'font-semibold' : ''}
    >
      {display}
    </span>
  );
};

export default ScoreCell;
