import React from 'react';
import Image from 'next/image';

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
}

export interface GalleryGridProps {
  items: GalleryItem[];
}

export function GalleryGrid({ items }: GalleryGridProps) {
  if (!items || items.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-xl border border-dashed border-steel-300">
        <p className="text-sm font-semibold text-accent">No gallery images available at this time.</p>
        <p className="text-xs text-steel-500 mt-1">Please check back soon for updated stockyard photographs.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl overflow-hidden bg-white border border-steel-200 shadow-card hover:shadow-card-hover hover:border-brand/40 transition-all duration-200 flex flex-col group"
        >
          <div className="relative h-60 w-full overflow-hidden bg-steel-100">
            <Image
              src={item.image}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 rounded bg-accent/90 text-white text-xs font-semibold shadow-sm backdrop-blur-sm">
                {item.category}
              </span>
            </div>
          </div>

          <div className="p-5 flex flex-col flex-grow">
            <h3 className="text-base font-bold text-accent group-hover:text-brand transition-colors">
              {item.title}
            </h3>
            <p className="text-xs text-steel-600 mt-2 leading-relaxed flex-grow">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
