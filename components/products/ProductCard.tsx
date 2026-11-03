import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductCatalogueItem } from '@/lib/constants/products';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export interface ProductCardProps {
  product: {
    id: string;
    diameterMm: number;
    name: string;
    category?: string;
    standardGrades?: string[] | string;
    primaryUse: string;
    weightKgPerMeter: number;
    description: string;
    image?: string;
    keyApplications?: string[] | string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const gradesText = Array.isArray(product.standardGrades)
    ? product.standardGrades.join(' / ')
    : product.standardGrades || 'Fe 550D / Fe 500D';

  const appsList: string[] = Array.isArray(product.keyApplications)
    ? product.keyApplications
    : typeof product.keyApplications === 'string'
    ? product.keyApplications.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const displayImage = product.image || '/images/products/rebar-bundle.jpg';

  return (
    <div className="rounded-xl bg-white border border-steel-200 overflow-hidden shadow-card hover:shadow-card-hover hover:border-brand/40 transition-all duration-200 flex flex-col group">
      {/* Product Image with Diameter Badge */}
      <div className="relative h-48 w-full bg-steel-100 overflow-hidden">
        <Image
          src={displayImage}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2.5 py-1 rounded bg-accent text-white text-xs font-mono font-bold shadow-sm">
            {product.diameterMm} mm
          </span>
          <span className="px-2.5 py-1 rounded bg-brand text-white text-xs font-semibold shadow-sm">
            {gradesText}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="text-xs font-bold uppercase tracking-wider text-brand mb-1">
          {product.category || 'TMT Reinforcement Steel'}
        </div>

        <h3 className="text-lg font-bold text-accent group-hover:text-brand transition-colors">
          {product.name}
        </h3>

        <p className="text-xs text-steel-500 font-mono mt-0.5 mb-2.5">
          Weight: ~{Number(product.weightKgPerMeter).toFixed(3)} kg/m • {product.primaryUse}
        </p>

        <p className="text-sm text-steel-700 leading-relaxed flex-grow line-clamp-3">
          {product.description}
        </p>

        {/* Applications list */}
        {appsList.length > 0 && (
          <div className="mt-4 pt-3 border-t border-steel-100">
            <span className="text-[11px] font-bold text-steel-600 uppercase tracking-wider block mb-1.5">
              Key Construction Uses:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {appsList.slice(0, 3).map((app, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2 py-0.5 bg-neutral rounded text-accent border border-steel-200"
                >
                  {app}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Card Action */}
        <div className="pt-4 mt-4 border-t border-steel-100 flex items-center justify-between">
          <span className="text-xs text-steel-500 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-4 h-4 text-brand" />
            <span>BIS Certified</span>
          </span>

          <Button href="/live-stock" variant="outline" size="sm">
            <span>Check Yard Stock</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
