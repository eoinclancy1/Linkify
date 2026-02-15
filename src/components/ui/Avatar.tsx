import Image from 'next/image';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<AvatarSize, { px: number; text: string }> = {
  sm: { px: 32, text: 'text-xs' },
  md: { px: 48, text: 'text-sm' },
  lg: { px: 64, text: 'text-base' },
  xl: { px: 128, text: 'text-2xl' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-linkify-green',
    'bg-blue-600',
    'bg-orange-600',
    'bg-purple-600',
    'bg-pink-600',
    'bg-teal-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const { px, text } = sizeMap[size];

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        className={`rounded-full object-cover ${className}`}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-white ${getColorFromName(name)} ${text} ${className}`}
      style={{ width: px, height: px }}
    >
      {getInitials(name)}
    </div>
  );
}
