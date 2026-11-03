/**
 * Supported TMT Product Diameters and Catalogue
 * Standard confirmed sizes: 8mm, 10mm, 12mm, 16mm, 20mm, 25mm
 */

export interface ProductCatalogueItem {
  id: string;
  diameterMm: number;
  name: string;
  category: string;
  standardGrades: string[];
  primaryUse: string;
  weightKgPerMeter: number;
  description: string;
  image: string;
  keyApplications: string[];
}

export const SUPPORTED_PRODUCTS: ProductCatalogueItem[] = [
  {
    id: 'tmt-8mm',
    diameterMm: 8,
    name: '8 mm TMT Rebars',
    category: 'TMT Reinforcement Steel',
    standardGrades: ['Fe 550D', 'Fe 500D'],
    primaryUse: 'Stirrups, Ties, Slab Reinforcement',
    weightKgPerMeter: 0.395,
    description:
      'High-bendability 8 mm TMT steel bar designed specifically for column ties, beam stirrups, and residential slab reinforcement with superior anti-cracking flexibility.',
    image: '/images/products/rebar-bundle.jpg',
    keyApplications: ['Column lateral ties', 'Beam shear stirrups', 'Roof & floor slabs', 'Parapet walls'],
  },
  {
    id: 'tmt-10mm',
    diameterMm: 10,
    name: '10 mm TMT Rebars',
    category: 'TMT Reinforcement Steel',
    standardGrades: ['Fe 550D', 'Fe 500D'],
    primaryUse: 'Slabs, Lintels, Chajjas',
    weightKgPerMeter: 0.617,
    description:
      'Versatile 10 mm TMT rebar offering the ideal balance between tensile strength and ductility. Primarily utilized for two-way slab meshes, staircases, and residential lintel beams.',
    image: '/images/products/rebar-bundle.jpg',
    keyApplications: ['Two-way RCC slabs', 'Cantilever chajjas', 'Staircase reinforcement', 'Lintel beams'],
  },
  {
    id: 'tmt-12mm',
    diameterMm: 12,
    name: '12 mm TMT Rebars',
    category: 'TMT Reinforcement Steel',
    standardGrades: ['Fe 550D', 'Fe 500D'],
    primaryUse: 'Beams, Columns, Foundations',
    weightKgPerMeter: 0.888,
    description:
      'The most widely specified structural rebar in construction. Engineered for primary longitudinal reinforcement in building columns, load-bearing frames, and plinth beams.',
    image: '/images/products/rebar-bundle.jpg',
    keyApplications: ['Primary column bars', 'Plinth & tie beams', 'Foundation footings', 'Retaining walls'],
  },
  {
    id: 'tmt-16mm',
    diameterMm: 16,
    name: '16 mm TMT Rebars',
    category: 'TMT Reinforcement Steel',
    standardGrades: ['Fe 550D', 'Fe 500D'],
    primaryUse: 'Heavy Columns, Girders, Multi-Storey RCC',
    weightKgPerMeter: 1.58,
    description:
      'Heavy-duty 16 mm TMT rebar designed for multi-storey residential and commercial load transfer. Features deep ribs for exceptional concrete anchorage and shear resistance.',
    image: '/images/products/rebar-bundle.jpg',
    keyApplications: ['Multi-storey columns', 'Heavy transfer girders', 'Combined footings', 'Water tank walls'],
  },
  {
    id: 'tmt-20mm',
    diameterMm: 20,
    name: '20 mm TMT Rebars',
    category: 'TMT Reinforcement Steel',
    standardGrades: ['Fe 550D', 'Fe 500D'],
    primaryUse: 'Heavy Infrastructure, Raft Foundations',
    weightKgPerMeter: 2.47,
    description:
      'High-mass 20 mm industrial rebar manufactured to withstand immense compressive and tensile stresses in basements, bridge culverts, and heavy commercial foundation rafts.',
    image: '/images/products/rebar-bundle.jpg',
    keyApplications: ['Raft foundation mats', 'Bridge piers & culverts', 'High-load commercial columns', 'Industrial slabs'],
  },
  {
    id: 'tmt-25mm',
    diameterMm: 25,
    name: '25 mm TMT Rebars',
    category: 'TMT Reinforcement Steel',
    standardGrades: ['Fe 550D', 'Fe 500D'],
    primaryUse: 'Critical Infrastructure & High-Rise Cores',
    weightKgPerMeter: 3.85,
    description:
      'Specialist 25 mm high-tensile rebar for mega-projects, civil infrastructure, pile caps, and heavy industrial plant foundations requiring certified seismic energy absorption.',
    image: '/images/products/rebar-bundle.jpg',
    keyApplications: ['Heavy pile caps', 'High-rise core shear walls', 'Highway infrastructure', 'Heavy machine foundations'],
  },
];
