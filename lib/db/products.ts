import { query, execute } from './index';
import { Product, NewProduct } from '@/db/schema';
import crypto from 'crypto';

/**
 * Get all active products, optionally filtered by category or brand
 */
export async function getActiveProducts(options?: {
  category?: string;
  brand?: string;
}): Promise<Product[]> {
  let sql = 'SELECT * FROM products WHERE is_active = 1';
  const params: (string | number)[] = [];

  if (options?.category) {
    sql += ' AND category = ?';
    params.push(options.category);
  }

  if (options?.brand) {
    sql += ' AND brand = ?';
    params.push(options.brand);
  }

  sql += ' ORDER BY brand ASC, name ASC';
  return query<Product>(sql, params);
}

/**
 * Get product by primary key ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const rows = await query<Product>('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

/**
 * Insert a new product safely
 */
export async function createProduct(input: NewProduct): Promise<Product> {
  const id = input.id || `prod_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO products (id, name, category, grade, brand, unit, description, image, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.category,
      input.grade,
      input.brand,
      input.unit || 'Tons',
      input.description || null,
      input.image || null,
      input.is_active === false ? 0 : 1,
      now,
      now,
    ]
  );

  const created = await getProductById(id);
  if (!created) throw new Error('Failed to retrieve newly created product');
  return created;
}

/**
 * Get distinct categories available in inventory
 */
export async function getDistinctCategories(): Promise<string[]> {
  const rows = await query<{ category: string }>(
    'SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category ASC'
  );
  return rows.map((r) => r.category);
}

/**
 * Get distinct brands available in inventory
 */
export async function getDistinctBrands(): Promise<string[]> {
  const rows = await query<{ brand: string }>(
    'SELECT DISTINCT brand FROM products WHERE is_active = 1 ORDER BY brand ASC'
  );
  return rows.map((r) => r.brand);
}
