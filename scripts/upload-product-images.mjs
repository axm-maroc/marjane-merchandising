import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { fileURLToPath } from "url";
import { storagePut } from "../server/storage.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mapping des fichiers image aux noms de produits
const imageMapping = {
  "coca-cola-1.5l.jpg": "Coca-Cola 1.5L",
  "fanta-orange-1.5l.jpg": "Fanta Orange 1.5L",
  "lait-centrale-1l.jpg": "Lait Centrale Laitière 1L",
  "farine-1kg.jpg": "Farine 1kg",
  "huile-lesieur-1l.jpg": "Huile Lesieur 1L",
};

async function uploadProductImages() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log("🔄 Début de l'upload des images produits vers S3...\n");

    const uploadedImages = [];

    for (const [filename, productName] of Object.entries(imageMapping)) {
      try {
        const imagePath = path.join(__dirname, "..", "client", "public", "products", filename);
        
        if (!fs.existsSync(imagePath)) {
          console.log(`⚠️  Image non trouvée: ${filename}`);
          continue;
        }

        // Lire le fichier image
        const imageBuffer = fs.readFileSync(imagePath);
        
        console.log(`📤 Upload: ${productName}`);
        console.log(`   Fichier: ${filename} (${(imageBuffer.length / 1024).toFixed(2)} KB)`);

        // Uploader vers S3
        const fileKey = `products/${Date.now()}-${filename}`;
        const { url } = await storagePut(fileKey, imageBuffer, "image/jpeg");

        console.log(`   ✓ URL S3: ${url.substring(0, 60)}...`);

        // Récupérer le produit
        const [products] = await connection.execute(
          "SELECT id FROM products WHERE name = ?",
          [productName]
        );

        if (products.length === 0) {
          console.log(`   ⚠️  Produit non trouvé: ${productName}\n`);
          continue;
        }

        const product = products[0];

        // Mettre à jour l'URL de l'image dans la base de données
        await connection.execute(
          "UPDATE products SET photoUrl = ?, photoFileKey = ? WHERE id = ?",
          [url, fileKey, product.id]
        );

        console.log(`   ✓ Base de données mise à jour\n`);

        uploadedImages.push({
          productName,
          imageUrl: url,
          fileKey
        });

      } catch (error) {
        console.error(`❌ Erreur pour ${filename}:`, error.message);
      }
    }

    console.log("\n✅ Upload terminé!");
    console.log(`📊 ${uploadedImages.length} images uploadées et liées aux produits`);

    // Afficher le résumé
    if (uploadedImages.length > 0) {
      console.log("\n📋 Résumé des uploads:");
      uploadedImages.forEach(img => {
        console.log(`   • ${img.productName}: ${img.imageUrl.substring(0, 50)}...`);
      });
    }

    connection.end();
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
}

uploadProductImages();
