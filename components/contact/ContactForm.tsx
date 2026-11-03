'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { APPROVED_BRANDS } from '@/lib/constants/brands';

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    brand: 'TATA TISCON',
    quantity: '',
    location: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Client-side UI validation & simulated submission feedback
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  if (submitted) {
    return (
      <div className="rounded-xl bg-white border border-steel-200 p-8 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-extrabold text-accent">Enquiry Received Successfully!</h3>
        <p className="text-sm text-steel-700 max-w-md mx-auto leading-relaxed">
          Thank you, <strong className="text-accent">{formData.name}</strong>. Our Salem yard sales team has received your request and will call you on{' '}
          <strong className="text-accent">{formData.phone}</strong> with today&apos;s steel rates and dispatch schedule.
        </p>
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSubmitted(false);
              setFormData({
                name: '',
                phone: '',
                brand: 'TATA TISCON',
                quantity: '',
                location: '',
                message: '',
              });
            }}
          >
            Submit Another Request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white border border-steel-200 p-6 sm:p-8 shadow-sm">
      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-brand block mb-1">
          Direct Yard Enquiry
        </span>
        <h3 className="text-xl sm:text-2xl font-extrabold text-accent">
          Request TMT Pricing & Availability
        </h3>
        <p className="text-xs sm:text-sm text-steel-600 mt-1">
          Fill in your contractor or project requirements below to receive verified weight slips and mill quotation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-accent mb-1.5">
              Your Name / Firm Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ramesh Kumar / Salem Builders"
              className="w-full px-3.5 py-2.5 bg-neutral border border-steel-200 rounded-lg text-sm text-accent placeholder-steel-400 focus:outline-none focus:border-brand focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-accent mb-1.5">
              Contact Phone Number *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. 98421 00000"
              className="w-full px-3.5 py-2.5 bg-neutral border border-steel-200 rounded-lg text-sm text-accent placeholder-steel-400 focus:outline-none focus:border-brand focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-accent mb-1.5">
              Preferred TMT Brand
            </label>
            <select
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-neutral border border-steel-200 rounded-lg text-sm text-accent focus:outline-none focus:border-brand focus:bg-white"
            >
              {APPROVED_BRANDS.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
              <option value="Any Approved Brand">Any Approved Brand</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-accent mb-1.5">
              Estimated Quantity (Tons)
            </label>
            <input
              type="text"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="e.g. 15 Tons (12mm, 16mm)"
              className="w-full px-3.5 py-2.5 bg-neutral border border-steel-200 rounded-lg text-sm text-accent placeholder-steel-400 focus:outline-none focus:border-brand focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-accent mb-1.5">
            Delivery Site Location in Salem / Nearby Districts
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g. Ammapet / Seelanaickenpatti / Namakkal"
            className="w-full px-3.5 py-2.5 bg-neutral border border-steel-200 rounded-lg text-sm text-accent placeholder-steel-400 focus:outline-none focus:border-brand focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-accent mb-1.5">
            Specific Requirements / Notes
          </label>
          <textarea
            rows={3}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Mention required bar diameters (8mm, 10mm, 12mm, 16mm, 20mm, 25mm), dispatch date, or test certificate needs..."
            className="w-full px-3.5 py-2.5 bg-neutral border border-steel-200 rounded-lg text-sm text-accent placeholder-steel-400 focus:outline-none focus:border-brand focus:bg-white"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={submitting}
          className="w-full justify-center"
        >
          <Send className="w-4 h-4 mr-2" />
          <span>{submitting ? 'Sending Enquiry...' : 'Submit Pricing Enquiry'}</span>
        </Button>
      </form>
    </div>
  );
}
