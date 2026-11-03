/**
 * Verified Business Constants for Thirupathi Steels
 * Location: Salem, Tamil Nadu
 */

export const BUSINESS_INFO = {
  name: 'Thirupathi Steels',
  legalName: 'Thirupathi Steels',
  establishedYear: 2011,
  tagline: 'Quality TMT for a Stronger Tomorrow',
  description:
    'Established in 2011, Thirupathi Steels is Salem’s trusted TMT steel stockist and distributor, offering premium, authentic TMT rebars directly from certified manufacturers with verified live yard stock.',
  gstin: '33AAHFT1872C1ZF',
  address: {
    doorNo: 'T.S. No: 153/3-A',
    street: 'Chennai Bye Pass Road, Seelanaickenpatti',
    city: 'Salem',
    state: 'Tamil Nadu',
    postalCode: '636 201',
    full: 'T.S. No: 153/3-A, Chennai Bye Pass Road, Seelanaickenpatti, Salem – 636 201, Tamil Nadu',
  },
  phones: [
    { display: '+91 90034 61089', raw: '9003461089', tel: '+919003461089', isPrimary: true },
    { display: '+91 95973 90271', raw: '9597390271', tel: '+919597390271', isPrimary: false },
  ],
  whatsapp: {
    number: '919003461089',
    link: 'https://wa.me/919003461089?text=Hello%20Thirupathi%20Steels,%20I%20would%20like%20to%20enquire%20about%20TMT%20steel%20availability%20and%20pricing.',
  },
  operatingHours: {
    weekdays: 'Monday – Saturday: 8:30 AM – 7:30 PM',
    sunday: 'Sunday: Closed / Emergency Dispatch On-Call',
  },
  stats: [
    { label: 'Years of Trust', value: '15+', desc: 'Serving builders since 2011' },
    { label: 'Verified TMT Brands', value: '5+', desc: 'Primary & secondary producers' },
    { label: 'Standard Diameters', value: '8 – 25 mm', desc: 'Complete construction range' },
    { label: 'Salem Stockyard', value: '100% Physical', desc: 'Direct weighbridge verification' },
  ],
} as const;
