'use client';

import Image from 'next/image';
import { Play, Heart } from 'lucide-react';
import { useState, useCallback } from 'react';

interface FeaturedHitCardProps {
  label: string;
  authorName: string;
  authorTitle: string;
  authorAvatar: string;
  textContent: string;
  likes: number;
  postUrl: string;
}

export default function FeaturedHitCard({
  label,
  authorName,
  authorTitle,
  authorAvatar,
  textContent,
  likes,
  postUrl,
}: FeaturedHitCardProps) {
  const [isImageLight, setIsImageLight] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    try {
      const canvas = document.createElement('canvas');
      // Sample a small region from the top-left where the label sits
      const sampleW = Math.min(200, img.naturalWidth);
      const sampleH = Math.min(80, img.naturalHeight);
      canvas.width = sampleW;
      canvas.height = sampleH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, sampleW, sampleH, 0, 0, sampleW, sampleH);
      const { data } = ctx.getImageData(0, 0, sampleW, sampleH);
      let totalBrightness = 0;
      const pixelCount = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        totalBrightness += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      }
      setIsImageLight(totalBrightness / pixelCount > 160);
    } catch {
      // CORS or other errors — keep default (dark text on light assumption won't apply)
    }
  }, []);

  const truncated = textContent.length > 100
    ? textContent.slice(0, 100).trimEnd() + '...'
    : textContent;

  return (
    <a
      href={postUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 min-w-0 group block"
    >
      <div className="bg-surface rounded-xl overflow-hidden hover:bg-elevated transition-all duration-300">
        {/* Image section */}
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={authorAvatar}
            alt={authorName}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 50vw"
            onLoad={onImageLoad}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Label */}
          <p className={`absolute top-4 left-4 text-xs font-bold uppercase tracking-wider ${isImageLight ? 'text-black' : 'text-white'}`}>
            {label}
          </p>

          {/* Play button on hover */}
          <div className="absolute bottom-4 right-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-linkify-green flex items-center justify-center shadow-xl shadow-black/50 hover:scale-105 hover:bg-linkify-green-hover transition-transform">
              <Play className="w-5 h-5 text-black fill-black ml-0.5" />
            </div>
          </div>
        </div>

        {/* Text section */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-white truncate">{authorName}</h3>

          <div className="flex items-center gap-3 mt-1.5">
            <span className="inline-flex items-center gap-1 text-sm text-neutral-400">
              <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
              {likes.toLocaleString()} reactions
            </span>
            {authorTitle && (
              <>
                <span className="text-neutral-600">&middot;</span>
                <span className="text-sm text-neutral-500 truncate">{authorTitle}</span>
              </>
            )}
          </div>

          <p className="text-sm text-neutral-400 mt-3 leading-relaxed">{truncated}</p>
        </div>
      </div>
    </a>
  );
}
