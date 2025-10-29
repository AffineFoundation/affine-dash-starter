import React from 'react';

interface ScoreCellProps {
  score: string | null | undefined;
}

const ScoreCell: React.FC<ScoreCellProps> = ({ score }) => {
  if (score == null || score === '') {
    return <span className="text-light-iron uppercase">N/A</span>;
  }

  const isBest = score.startsWith('*') && score.endsWith('*');
  const cleanScore = score.replace(/\*/g, '');
  const parts = cleanScore.split('/');

  if (parts.length < 3) {
    return <span>{cleanScore}</span>;
  }

  return (
    <span className={isBest ? 'font-bold text-yellow-500' : ''}>
      {cleanScore}
    </span>
  );
};

export default ScoreCell;
