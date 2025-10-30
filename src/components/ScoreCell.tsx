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
  return {
    min,
    max,
    minFormatted: minRaw,
    maxFormatted: maxRaw,
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
