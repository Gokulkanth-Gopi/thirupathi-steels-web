import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { BUSINESS_INFO } from '@/lib/constants/business';
import { Phone, MessageCircle } from 'lucide-react';

export interface CTASectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
}

export function CTASection({
  title = 'Ready to Order TMT Steel for Your Project?',
  subtitle = 'Get in touch with our Salem sales and yard dispatch desk for transparent weight slips, authentic mill test certificates, and prompt site delivery.',
  className,
  ...props
}: CTASectionProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-accent text-white p-8 sm:p-12 border border-steel-700/80 shadow-md relative overflow-hidden',
        className
      )}
      {...props}
    >
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand/15 blur-2xl rounded-full pointer-events-none -mr-16 -mt-16" />

      <div className="relative z-10 max-w-2xl space-y-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand text-white">
          Thirupathi Steels • Salem
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-steel-200 leading-relaxed">{subtitle}</p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button href={BUSINESS_INFO.whatsapp.link} variant="whatsapp" size="md">
            <MessageCircle className="w-4 h-4 mr-1.5" />
            <span>WhatsApp Enquiry</span>
          </Button>

          <Button href={`tel:${BUSINESS_INFO.phones[0].tel}`} variant="primary" size="md">
            <Phone className="w-4 h-4 mr-1.5" />
            <span>Call: {BUSINESS_INFO.phones[0].display}</span>
          </Button>

          <Button href="/live-stock" variant="outline" size="md" className="bg-transparent text-white border-white/40 hover:bg-white/10 hover:text-white">
            <span>Check Live Yard Stock</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
