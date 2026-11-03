import { query, execute } from './index';
import { Brand, NewBrand, Diameter, NewDiameter, GalleryImage, NewGalleryImage } from '@/db/schema';
import crypto from 'crypto';

// ============================================================================
// 1. DIAMETERS (SIZES) DATABASE HELPERS
// ============================================================================

export async function getAllDiameters(): Promise<Diameter[]> {
  const rows = await query<any>(
    'SELECT * FROM diameters ORDER BY display_order ASC, diameter_mm ASC'
  );
  return rows.map(mapDiameterRow);
}

export async function getActiveDiameters(): Promise<Diameter[]> {
  const rows = await query<any>(
    'SELECT * FROM diameters WHERE is_active = TRUE ORDER BY display_order ASC, diameter_mm ASC'
  );
  return rows.map(mapDiameterRow);
}

export async function getDiameterById(id: string): Promise<Diameter | null> {
  const rows = await query<any>('SELECT * FROM diameters WHERE id = ? LIMIT 1', [id]);
  if (!rows.length) return null;
  return mapDiameterRow(rows[0]);
}

export async function createDiameter(input: NewDiameter): Promise<Diameter> {
  const id = input.id || `d-${input.diameter_mm}mm`;
  const displayOrder = input.display_order ?? 10;
  const isActive = input.is_active !== false;
  const keyApps = Array.isArray(input.key_applications) 
    ? input.key_applications.join(', ') 
    : (input.key_applications || null);

  await execute(
    `INSERT INTO diameters (
      id, diameter_mm, weight_kg_per_meter, primary_use, description, image,
      standard_grades, key_applications, is_active, display_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      id,
      input.diameter_mm,
      input.weight_kg_per_meter,
      input.primary_use || null,
      input.description || null,
      input.image || null,
      input.standard_grades || 'Fe 550D, Fe 500D',
      keyApps,
      isActive,
      displayOrder,
    ]
  );

  const created = await getDiameterById(id);
  if (!created) throw new Error('Failed to retrieve newly created diameter size');
  return created;
}

export async function updateDiameter(id: string, updates: Partial<NewDiameter>): Promise<Diameter> {
  const existing = await getDiameterById(id);
  if (!existing) throw new Error(`Diameter size '${id}' not found`);

  const diameterMm = updates.diameter_mm ?? existing.diameter_mm;
  const weightKgPerMeter = updates.weight_kg_per_meter ?? existing.weight_kg_per_meter;
  const primaryUse = updates.primary_use !== undefined ? updates.primary_use : existing.primary_use;
  const description = updates.description !== undefined ? updates.description : existing.description;
  const image = updates.image !== undefined ? updates.image : existing.image;
  const standardGrades = updates.standard_grades !== undefined ? updates.standard_grades : existing.standard_grades;
  
  let keyApps = existing.key_applications;
  if (updates.key_applications !== undefined) {
    keyApps = Array.isArray(updates.key_applications) 
      ? updates.key_applications.join(', ') 
      : updates.key_applications;
  }

  const isActive = updates.is_active !== undefined ? updates.is_active : existing.is_active;
  const displayOrder = updates.display_order !== undefined ? updates.display_order : existing.display_order;

  const keyAppsStr = Array.isArray(keyApps) 
    ? keyApps.join(', ') 
    : (typeof keyApps === 'string' ? keyApps : null);

  await execute(
    `UPDATE diameters SET
      diameter_mm = ?,
      weight_kg_per_meter = ?,
      primary_use = ?,
      description = ?,
      image = ?,
      standard_grades = ?,
      key_applications = ?,
      is_active = ?,
      display_order = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      diameterMm,
      weightKgPerMeter,
      primaryUse || null,
      description || null,
      image || null,
      standardGrades || null,
      keyAppsStr,
      isActive,
      displayOrder,
      id,
    ]
  );

  const updated = await getDiameterById(id);
  if (!updated) throw new Error(`Failed to retrieve updated diameter size '${id}'`);
  return updated;
}

export async function deleteDiameter(id: string): Promise<void> {
  // Check if any stock lot references this diameter
  const linkedLots = await query<{ count: string | number }>(
    'SELECT COUNT(*) as count FROM stock_lots WHERE diameter_id = ?',
    [id]
  );
  const count = Number(linkedLots[0]?.count || 0);
  if (count > 0) {
    throw new Error(`Cannot delete diameter '${id}': ${count} active stock lot(s) are referencing it. Deactivate it instead.`);
  }

  await execute('DELETE FROM diameters WHERE id = ?', [id]);
}

function mapDiameterRow(row: any): Diameter {
  return {
    id: row.id,
    diameter_mm: Number(row.diameter_mm),
    weight_kg_per_meter: Number(row.weight_kg_per_meter),
    primary_use: row.primary_use || null,
    description: row.description || null,
    image: row.image || null,
    standard_grades: row.standard_grades || 'Fe 550D, Fe 500D',
    key_applications: row.key_applications || null,
    is_active: Boolean(row.is_active),
    display_order: Number(row.display_order || 0),
    created_at: String(row.created_at || ''),
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

// ============================================================================
// 2. BRANDS DATABASE HELPERS
// ============================================================================

export async function getAllBrands(): Promise<Brand[]> {
  const rows = await query<any>('SELECT * FROM brands ORDER BY display_order ASC, name ASC');
  return rows.map(mapBrandRow);
}

export async function getActiveBrands(): Promise<Brand[]> {
  const rows = await query<any>(
    'SELECT * FROM brands WHERE is_active = TRUE ORDER BY display_order ASC, name ASC'
  );
  return rows.map(mapBrandRow);
}

export async function getBrandById(id: string): Promise<Brand | null> {
  const rows = await query<any>('SELECT * FROM brands WHERE id = ? LIMIT 1', [id]);
  if (!rows.length) return null;
  return mapBrandRow(rows[0]);
}

export async function createBrand(input: NewBrand): Promise<Brand> {
  const id = input.id || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const displayOrder = input.display_order ?? 10;
  const isActive = input.is_active !== false;
  const features = Array.isArray(input.features) ? input.features.join(', ') : (input.features || null);

  await execute(
    `INSERT INTO brands (
      id, name, category, tagline, description, features, logo, is_active, display_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      id,
      input.name,
      input.category,
      input.tagline || null,
      input.description || null,
      features,
      input.logo || null,
      isActive,
      displayOrder,
    ]
  );

  const created = await getBrandById(id);
  if (!created) throw new Error('Failed to retrieve newly created brand');
  return created;
}

export async function updateBrand(id: string, updates: Partial<NewBrand>): Promise<Brand> {
  const existing = await getBrandById(id);
  if (!existing) throw new Error(`Brand '${id}' not found`);

  const name = updates.name ?? existing.name;
  const category = updates.category ?? existing.category;
  const tagline = updates.tagline !== undefined ? updates.tagline : existing.tagline;
  const description = updates.description !== undefined ? updates.description : existing.description;
  
  let features = existing.features;
  if (updates.features !== undefined) {
    features = Array.isArray(updates.features) ? updates.features.join(', ') : updates.features;
  }

  const logo = updates.logo !== undefined ? updates.logo : existing.logo;
  const isActive = updates.is_active !== undefined ? updates.is_active : existing.is_active;
  const displayOrder = updates.display_order !== undefined ? updates.display_order : existing.display_order;

  const featuresStr = Array.isArray(features) 
    ? features.join(', ') 
    : (typeof features === 'string' ? features : null);

  await execute(
    `UPDATE brands SET
      name = ?,
      category = ?,
      tagline = ?,
      description = ?,
      features = ?,
      logo = ?,
      is_active = ?,
      display_order = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      name,
      category,
      tagline || null,
      description || null,
      featuresStr,
      logo || null,
      isActive,
      displayOrder,
      id,
    ]
  );

  const updated = await getBrandById(id);
  if (!updated) throw new Error(`Failed to retrieve updated brand '${id}'`);
  return updated;
}

export async function deleteBrand(id: string): Promise<void> {
  // Check if any stock lot references this brand
  const linkedLots = await query<{ count: string | number }>(
    'SELECT COUNT(*) as count FROM stock_lots WHERE brand_id = ?',
    [id]
  );
  const count = Number(linkedLots[0]?.count || 0);
  if (count > 0) {
    throw new Error(`Cannot delete brand '${id}': ${count} active stock lot(s) are referencing it. Deactivate it instead.`);
  }

  await execute('DELETE FROM brands WHERE id = ?', [id]);
}

function mapBrandRow(row: any): Brand {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    tagline: row.tagline || null,
    description: row.description || null,
    features: row.features || null,
    logo: row.logo || null,
    is_active: Boolean(row.is_active),
    display_order: Number(row.display_order || 0),
    created_at: String(row.created_at || ''),
    updated_at: String(row.updated_at || ''),
  };
}

// ============================================================================
// 3. GALLERY IMAGES DATABASE HELPERS
// ============================================================================

export async function getAllGalleryImages(): Promise<GalleryImage[]> {
  const rows = await query<any>(
    'SELECT * FROM gallery_images ORDER BY display_order ASC, created_at DESC'
  );
  return rows.map(mapGalleryRow);
}

export async function getActiveGalleryImages(): Promise<GalleryImage[]> {
  const rows = await query<any>(
    'SELECT * FROM gallery_images WHERE is_active = TRUE ORDER BY display_order ASC, created_at DESC'
  );
  return rows.map(mapGalleryRow);
}

export async function getGalleryImageById(id: string): Promise<GalleryImage | null> {
  const rows = await query<any>('SELECT * FROM gallery_images WHERE id = ? LIMIT 1', [id]);
  if (!rows.length) return null;
  return mapGalleryRow(rows[0]);
}

export async function createGalleryImage(input: NewGalleryImage): Promise<GalleryImage> {
  const id = input.id || `gal_${crypto.randomUUID()}`;
  const displayOrder = input.display_order ?? 10;
  const isActive = input.is_active !== false;

  await execute(
    `INSERT INTO gallery_images (
      id, title, category, image_url, description, display_order, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      id,
      input.title,
      input.category || 'Yard Infrastructure',
      input.image_url,
      input.description || null,
      displayOrder,
      isActive,
    ]
  );

  const created = await getGalleryImageById(id);
  if (!created) throw new Error('Failed to retrieve newly created gallery image');
  return created;
}

export async function updateGalleryImage(
  id: string,
  updates: Partial<NewGalleryImage>
): Promise<GalleryImage> {
  const existing = await getGalleryImageById(id);
  if (!existing) throw new Error(`Gallery image '${id}' not found`);

  const title = updates.title ?? existing.title;
  const category = updates.category ?? existing.category;
  const imageUrl = updates.image_url ?? existing.image_url;
  const description = updates.description !== undefined ? updates.description : existing.description;
  const displayOrder = updates.display_order !== undefined ? updates.display_order : existing.display_order;
  const isActive = updates.is_active !== undefined ? updates.is_active : existing.is_active;

  await execute(
    `UPDATE gallery_images SET
      title = ?,
      category = ?,
      image_url = ?,
      description = ?,
      display_order = ?,
      is_active = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [title, category, imageUrl, description || null, displayOrder, isActive, id]
  );

  const updated = await getGalleryImageById(id);
  if (!updated) throw new Error(`Failed to retrieve updated gallery image '${id}'`);
  return updated;
}

export async function deleteGalleryImage(id: string): Promise<void> {
  await execute('DELETE FROM gallery_images WHERE id = ?', [id]);
}

function mapGalleryRow(row: any): GalleryImage {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    image_url: row.image_url,
    description: row.description || null,
    display_order: Number(row.display_order || 0),
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at || ''),
    updated_at: String(row.updated_at || ''),
  };
}
