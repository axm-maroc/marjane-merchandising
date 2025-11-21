import * as XLSX from 'xlsx';
import { getDb } from './db';
import { planogramProducts, products } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Format CSV/XLSX standard pour l'import/export de planogrammes
 * Colonnes: Produit, SKU, Quantité, Facings, Niveau, Position
 */

export interface PlanogramProductRow {
  produit: string;
  sku: string;
  quantite: number;
  facings: number;
  niveau: number;
  position: number;
}

/**
 * Exporte un planogramme au format CSV
 */
export async function exportPlanogramToCSV(planogramId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Récupérer les produits du planogramme
  const planogramProductsData = await db
    .select({
      productName: products.name,
      sku: products.sku,
      quantity: planogramProducts.quantity,
      facings: planogramProducts.facings,
      shelfLevel: planogramProducts.shelfLevel,
      positionX: planogramProducts.positionX,
    })
    .from(planogramProducts)
    .innerJoin(products, eq(planogramProducts.productId, products.id))
    .where(eq(planogramProducts.planogramId, planogramId));

  // Créer le contenu CSV
  const headers = ['Produit', 'SKU', 'Quantité', 'Facings', 'Niveau', 'PositionX'];
  const rows = planogramProductsData.map(p => [
    p.productName,
    p.sku || '',
    p.quantity,
    p.facings,
    p.shelfLevel,
    p.positionX,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Exporte un planogramme au format XLSX
 */
export async function exportPlanogramToXLSX(planogramId: number): Promise<Buffer> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Récupérer les produits du planogramme
  const planogramProductsData = await db
    .select({
      productName: products.name,
      sku: products.sku,
      brand: products.brand,
      categoryId: products.categoryId,
      quantity: planogramProducts.quantity,
      facings: planogramProducts.facings,
      shelfLevel: planogramProducts.shelfLevel,
      positionX: planogramProducts.positionX,
    })
    .from(planogramProducts)
    .innerJoin(products, eq(planogramProducts.productId, products.id))
    .where(eq(planogramProducts.planogramId, planogramId));

  // Créer le workbook
  const workbook = XLSX.utils.book_new();

  // Créer la feuille avec les données
  const worksheetData = [
    ['Produit', 'SKU', 'Marque', 'Catégorie', 'Quantité', 'Facings', 'Niveau', 'PositionX'],
    ...planogramProductsData.map(p => [
      p.productName,
      p.sku || '',
      p.brand || '',
      p.categoryId || '',
      p.quantity,
      p.facings,
      p.shelfLevel,
      p.positionX,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Ajuster la largeur des colonnes
  worksheet['!cols'] = [
    { wch: 30 }, // Produit
    { wch: 15 }, // SKU
    { wch: 15 }, // Marque
    { wch: 15 }, // Catégorie
    { wch: 10 }, // Quantité
    { wch: 10 }, // Facings
    { wch: 10 }, // Niveau
    { wch: 10 }, // Position
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Planogramme');

  // Convertir en buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return buffer;
}

/**
 * Importe des produits depuis un fichier CSV
 */
export async function importProductsFromCSV(
  planogramId: number,
  csvContent: string
): Promise<{ success: boolean; imported: number; errors: string[] }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const errors: string[] = [];
  let imported = 0;

  try {
    // Parser le CSV
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error("Fichier CSV vide ou invalide");
    }

    // Ignorer la ligne d'en-tête
    const dataLines = lines.slice(1);

    // Récupérer tous les produits pour la correspondance
    const allProducts = await db.select().from(products);

    // Supprimer les produits existants du planogramme
    await db.delete(planogramProducts).where(eq(planogramProducts.planogramId, planogramId));

    // Importer chaque ligne
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      const columns = line.split(',').map(col => col.trim());
      if (columns.length < 6) {
        errors.push(`Ligne ${i + 2}: Format invalide (${columns.length} colonnes au lieu de 6)`);
        continue;
      }

      const [productName, sku, quantityStr, facingsStr, levelStr, positionXStr] = columns;

      // Trouver le produit par nom ou SKU
      const product = allProducts.find(
        p => p.name === productName || p.sku === sku
      );

      if (!product) {
        errors.push(`Ligne ${i + 2}: Produit "${productName}" (SKU: ${sku}) introuvable`);
        continue;
      }

      // Parser les valeurs numériques
      const quantity = parseInt(quantityStr, 10);
      const facings = parseInt(facingsStr, 10);
      const shelfLevel = parseInt(levelStr, 10);
      const positionX = parseInt(positionXStr, 10);

      if (isNaN(quantity) || isNaN(facings) || isNaN(shelfLevel) || isNaN(positionX)) {
        errors.push(`Ligne ${i + 2}: Valeurs numériques invalides`);
        continue;
      }

      // Insérer le produit dans le planogramme
      await db.insert(planogramProducts).values({
        planogramId,
        productId: product.id,
        quantity,
        facings,
        shelfLevel,
        positionX,
      });

      imported++;
    }

    return {
      success: true,
      imported,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      imported: 0,
      errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
    };
  }
}

/**
 * Importe des produits depuis un fichier XLSX
 */
export async function importProductsFromXLSX(
  planogramId: number,
  fileBuffer: Buffer
): Promise<{ success: boolean; imported: number; errors: string[] }> {
  try {
    // Lire le fichier XLSX
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    // Prendre la première feuille
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error("Aucune feuille trouvée dans le fichier XLSX");
    }

    const worksheet = workbook.Sheets[sheetName];

    // Convertir en CSV
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);

    // Utiliser la fonction d'import CSV
    return await importProductsFromCSV(planogramId, csvContent);
  } catch (error) {
    return {
      success: false,
      imported: 0,
      errors: [error instanceof Error ? error.message : 'Erreur lors de la lecture du fichier XLSX'],
    };
  }
}
