import React from 'react';
import Image from 'next/image';
import { BrandItem } from '@/lib/constants/brands';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export interface BrandCardProps {
  brand: {
    id: string;
    name: string;
    category: 'Primary Steel' | 'Secondary Steel';
    tagline?: string | null;
    description?: string | null;
    logo?: string | null;
    features?: string[] | string | null;
  };
}

export function BrandCard({ brand }: BrandCardProps) {
  const featureList: string[] = Array.isArray(brand.features)
    ? brand.features
    : typeof brand.features === 'string'
    ? brand.features.split(',').map((f) => f.trim()).filter(Boolean)
    : [];

  return (
    <div className="rounded-xl bg-white border border-steel-200 p-6 shadow-card hover:shadow-card-hover hover:border-brand/40 transition-all duration-200 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-steel-100">
          <div className="flex items-center gap-4">
            <div className="relative w-28 h-14 bg-neutral-50 rounded-xl p-2 border border-steel-200/80 flex items-center justify-center flex-shrink-0 shadow-2xs overflow-hidden">
              {brand.logo ? (
                <Image
                  src={brand.logo}
                  alt={`${brand.name} Logo`}
                  fill
                  sizes="112px"
                  className="object-contain p-1 filter drop-shadow-2xs"
                />
              ) : (
                <div className="font-black text-xs text-steel-400 font-mono">NO LOGO</div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-accent group-hover:text-brand transition-colors">
                {brand.name}
              </h3>
              <span className="text-xs text-brand font-semibold block">
                {brand.tagline || 'Authorized Steel Producer'}
              </span>
            </div>
          </div>

          <span className="text-xs font-bold px-2.5 py-1 rounded bg-neutral text-steel-700 border border-steel-200">
            {brand.category}
          </span>
        </div>

        <p className="text-sm text-steel-700 leading-relaxed mb-5">
          {brand.description || 'Quality certified TMT reinforcement steel bars.'}
        </p>

        {featureList.length > 0 && (
          <div className="space-y-2 mb-6">
            {featureList.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-steel-800 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand flex-shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-steel-100 flex items-center justify-between">
        <span className="text-xs text-steel-500 font-medium">Salem Yard Stocked</span>
        <Button href="/live-stock" variant="outline" size="sm">
          <span>Live Stock</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
