interface RankMedalProps {
  rank: number;
}

const medalConfig: Record<number, { emoji: string; color: string }> = {
  1: { emoji: '🥇', color: '#FFD700' },
  2: { emoji: '🥈', color: '#C0C0C0' },
  3: { emoji: '🥉', color: '#CD7F32' },
};

export default function RankMedal({ rank }: RankMedalProps) {
  const medal = medalConfig[rank];

  if (medal) {
    return (
      <span className="text-xl leading-none" role="img" aria-label={`Rank ${rank}`}>
        {medal.emoji}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-neutral-700 text-neutral-400 text-sm font-semibold">
      {rank}
    </span>
  );
}
