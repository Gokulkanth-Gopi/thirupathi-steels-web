import React from 'react';
import { BUSINESS_INFO } from '@/lib/constants/business';
import { MapPin, Phone, MessageCircle, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ContactInfoCard() {
  return (
    <div className="space-y-6">
      {/* Salem Yard Address Card */}
      <div className="rounded-xl bg-white border border-steel-200 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Physical Yard Location
            </span>
            <h3 className="text-lg font-bold text-accent">Salem Stockyard & Office</h3>
            <p className="text-sm text-steel-700 leading-relaxed pt-1">
              {BUSINESS_INFO.address.full}
            </p>
            <p className="text-xs text-steel-500 pt-1">
              Located right on the main bypass corridor for easy truck and trailer turnaround.
            </p>
          </div>
        </div>
      </div>

      {/* Verified Phone & WhatsApp Helplines */}
      <div className="rounded-xl bg-white border border-steel-200 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div className="space-y-2 flex-grow">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Direct Telephone Numbers
            </span>
            <h3 className="text-lg font-bold text-accent">Speak With Sales Desk</h3>

            <div className="space-y-1.5 pt-1">
              <a
                href={`tel:${BUSINESS_INFO.phones[0].tel}`}
                className="flex items-center justify-between p-2 rounded-lg bg-neutral hover:bg-steel-100 transition-colors text-sm font-bold text-accent cursor-pointer"
              >
                <span>Primary: {BUSINESS_INFO.phones[0].display}</span>
                <span className="text-xs text-brand font-medium">Click to Call</span>
              </a>

              <a
                href={`tel:${BUSINESS_INFO.phones[1].tel}`}
                className="flex items-center justify-between p-2 rounded-lg bg-neutral hover:bg-steel-100 transition-colors text-sm font-bold text-accent cursor-pointer"
              >
                <span>Secondary: {BUSINESS_INFO.phones[1].display}</span>
                <span className="text-xs text-brand font-medium">Click to Call</span>
              </a>
            </div>

            <div className="pt-2">
              <Button href={BUSINESS_INFO.whatsapp.link} variant="whatsapp" size="sm" className="w-full justify-center">
                <MessageCircle className="w-4 h-4 mr-2" />
                <span>Chat on WhatsApp: +91 90034 61089</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Yard Operating Hours & Business Registry */}
      <div className="rounded-xl bg-white border border-steel-200 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 text-sm flex-grow">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Weighbridge Timings
            </span>
            <h3 className="text-lg font-bold text-accent">Operating Hours</h3>
            <p className="text-steel-700">{BUSINESS_INFO.operatingHours.weekdays}</p>
            <p className="text-xs text-amber-700 font-medium">{BUSINESS_INFO.operatingHours.sunday}</p>

            <div className="pt-3 border-t border-steel-100 text-xs text-steel-500 space-y-0.5">
              <p><strong className="text-accent">GSTIN:</strong> {BUSINESS_INFO.gstin}</p>
              <p><strong className="text-accent">Established:</strong> {BUSINESS_INFO.establishedYear}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
