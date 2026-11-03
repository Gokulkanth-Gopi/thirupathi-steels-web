/**
 * Approved Brands for Thirupathi Steels
 * Approved: TATA TISCON, SURYADEV, AGNI, SSI TMT, JPR
 */

export interface BrandItem {
  id: string;
  name: string;
  category: 'Primary Steel' | 'Secondary Steel';
  tagline: string;
  description: string;
  logo: string;
  features: string[];
}

export const APPROVED_BRANDS: BrandItem[] = [
  {
    id: 'tata-tiscon',
    name: 'TATA TISCON',
    category: 'Primary Steel',
    tagline: 'Super Ductile Fe 550D Rebars',
    description:
      'India’s benchmark primary steel rebar engineered from virgin iron ore. Delivers supreme ductility, superior seismic resistance, and consistent rib geometry for high-rise infrastructure.',
    logo: '/images/brands/tata-tiscon.webp',
    features: ['Fe 550D Super Ductile', 'Virgin Iron Ore Base', 'BIS 1786 Certified'],
  },
  {
    id: 'suryadev',
    name: 'SURYADEV',
    category: 'Secondary Steel',
    tagline: 'High Tensile Fe 550D Rebars',
    description:
      'Engineered with advanced quenching and self-tempering technology, Suryadev TMT bars deliver excellent yield strength, high bendability, and superior corrosion resistance for construction.',
    logo: '/images/brands/suryadev.png',
    features: ['Fe 550D Grade', 'Thermex Quenching Tech', 'Optimal Rib Design'],
  },
  {
    id: 'agni',
    name: 'AGNI',
    category: 'Secondary Steel',
    tagline: 'Reliable South Indian Rebars',
    description:
      'A widely preferred South Indian brand renowned for its consistent thermal resistance, robust weldability, and balanced mechanical strength for all types of residential and commercial structures.',
    logo: '/images/brands/agni.svg',
    features: ['Fe 550D High Tensile', 'Excellent Weldability', 'High Fire Resistance'],
  },
  {
    id: 'ssi',
    name: 'SSI TMT',
    category: 'Secondary Steel',
    tagline: 'Quality TMT Steel Solutions',
    description:
      'Manufactured under strict process controls to ensure uniform tensile properties, superior concrete adhesion, and long-lasting structural integrity across various construction projects.',
    logo: '/images/brands/ssi.png',
    features: ['Fe 500D / 550D', 'Uniform Weight & Ribs', 'Cost-Effective Reliability'],
  },
  {
    id: 'chakraa',
    name: 'JPR',
    category: 'Secondary Steel',
    tagline: 'High Ductility Fe 550D Rebars',
    description:
      'High-grade reinforcement steel bars manufactured to meet Indian standard tolerances, offering optimal elongation, bendability, and dependable performance in civil foundations.',
    logo: '/images/brands/jpr.png',
    features: ['Fe 550D Standard', 'Enhanced Elongation', 'Strong Concrete Bonding'],
  },
];
