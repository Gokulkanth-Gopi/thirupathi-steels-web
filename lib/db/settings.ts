import { query, execute } from './index';

export interface YardSettingRow {
  key: string;
  value: string;
  label?: string | null;
  category?: string | null;
  updated_at?: string;
}

export interface YardSettingsMap {
  yard_name: string;
  yard_location: string;
  phone_primary: string;
  phone_secondary: string;
  whatsapp_number: string;
  gstin: string;
  operating_hours: string;
  low_stock_threshold_kg: number;
  unit_of_storage: string;
  weighbridge_gate: string;
  weighbridge_status: string;
  dispatch_notes: string;
}

export const DEFAULT_YARD_SETTINGS: YardSettingsMap = {
  yard_name: 'Thirupathi Steels',
  yard_location: 'T.S. No: 153/3-A, Chennai Bye Pass Road, Seelanaickenpatti, Salem – 636 201, Tamil Nadu',
  phone_primary: '+91 90034 61089',
  phone_secondary: '+91 95973 90271',
  whatsapp_number: '919003461089',
  gstin: '33AAHFT1872C1ZF',
  operating_hours: 'Monday – Saturday: 8:30 AM – 7:30 PM (Sunday: On-Call)',
  low_stock_threshold_kg: 1500,
  unit_of_storage: 'Kilograms (kg)',
  weighbridge_gate: 'Gate 1 (Electronic Computerized Weighbridge)',
  weighbridge_status: 'Calibrated & Operational',
  dispatch_notes: 'Direct arterial highway access along Chennai Bye Pass for trailer flatbeds with instant computerized tare/gross printouts.',
};

/**
 * Retrieve all yard operational settings as a structured object
 */
export async function getYardSettings(): Promise<YardSettingsMap> {
  try {
    const rows = await query<YardSettingRow>(
      `SELECT key, value, label, category, updated_at FROM yard_settings`
    );

    const map: any = { ...DEFAULT_YARD_SETTINGS };

    for (const r of rows) {
      if (r.key === 'low_stock_threshold_kg') {
        const num = Number(r.value);
        map[r.key] = !isNaN(num) && num > 0 ? num : DEFAULT_YARD_SETTINGS.low_stock_threshold_kg;
      } else {
        map[r.key] = r.value;
      }
    }

    return map;
  } catch (error) {
    console.warn('Failed to fetch yard settings from database, using defaults:', error);
    return DEFAULT_YARD_SETTINGS;
  }
}

/**
 * Update one or more yard operational settings in PostgreSQL
 */
export async function updateYardSettings(
  updates: Partial<YardSettingsMap>
): Promise<YardSettingsMap> {
  const now = new Date().toISOString();

  for (const [key, val] of Object.entries(updates)) {
    if (val === undefined || val === null) continue;
    const strVal = String(val).trim();

    await execute(
      `INSERT INTO yard_settings (key, value, updated_at) 
       VALUES (?, ?, ?)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
      [key, strVal, now]
    );
  }

  return await getYardSettings();
}
