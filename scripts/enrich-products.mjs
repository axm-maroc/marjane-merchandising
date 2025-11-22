import mysql from "mysql2/promise";
import { storagePut } from "../server/storage.ts";

// Descriptions détaillées et enrichies pour chaque produit
const productEnrichment = {
  // Boissons
  "Coca-Cola 1.5L": {
    description: "Boisson gazeuse classique Coca-Cola 1.5L. Saveur riche et pétillante, parfaite pour les repas en famille. Contient du sucre et de la caféine. À conserver au frais.",
    category: "Boissons",
    imagePrompt: "Professional product photo of Coca-Cola 1.5L bottle on white background, high resolution, studio lighting, 1920x1080"
  },
  "Fanta Orange 1.5L": {
    description: "Boisson gazeuse Fanta Orange 1.5L. Saveur fruitée intense et rafraîchissante. Idéale pour les enfants et les occasions festives. Riche en sucre.",
    category: "Boissons",
    imagePrompt: "Professional product photo of Fanta Orange 1.5L bottle on white background, high resolution, studio lighting, 1920x1080"
  },
  "Sidi Ali 1.5L": {
    description: "Eau minérale naturelle Sidi Ali 1.5L. Source pure des montagnes du Moyen Atlas. Riche en minéraux essentiels. Hydratation optimale sans calories.",
    category: "Boissons",
    imagePrompt: "Professional product photo of Sidi Ali 1.5L water bottle on white background, high resolution, studio lighting, 1920x1080"
  },
  "Jus d'orange Tropicana 1L": {
    description: "Jus d'orange frais Tropicana 1L. 100% pur jus pressé sans sucre ajouté. Riche en vitamine C. À conserver au réfrigérateur après ouverture.",
    category: "Boissons",
    imagePrompt: "Professional product photo of Tropicana orange juice 1L bottle on white background, high resolution, studio lighting, 1920x1080"
  },

  // Produits laitiers
  "Beurre Président 250g": {
    description: "Beurre demi-sel Président 250g. Beurre de qualité supérieure fabriqué en France. Saveur riche et crémeuse. Parfait pour la cuisine et la pâtisserie.",
    category: "Produits laitiers",
    imagePrompt: "Professional product photo of Président butter 250g package on white background, high resolution, studio lighting, 1920x1080"
  },
  "Crème Centrale Laitière 200ml": {
    description: "Crème fraîche Centrale Laitière 200ml. Crème épaisse et onctueuse. Idéale pour les sauces, desserts et garnitures. À conserver au réfrigérateur.",
    category: "Produits laitiers",
    imagePrompt: "Professional product photo of Centrale Laitière cream 200ml bottle on white background, high resolution, studio lighting, 1920x1080"
  },
  "Fromage Président 200g": {
    description: "Fromage Président 200g. Fromage à pâte molle avec croûte fleurie. Saveur douce et crémeuse. Parfait pour les plateaux de fromage et apéritifs.",
    category: "Produits laitiers",
    imagePrompt: "Professional product photo of Président cheese 200g on white background, high resolution, studio lighting, 1920x1080"
  },
  "Lait Centrale Laitière 1L": {
    description: "Lait frais Centrale Laitière 1L. Lait entier pasteurisé. Source naturelle de calcium et protéines. Saveur riche et crémeuse.",
    category: "Produits laitiers",
    imagePrompt: "Professional product photo of Centrale Laitière milk 1L bottle on white background, high resolution, studio lighting, 1920x1080"
  },

  // Épicerie sèche
  "Pâtes Tria 500g": {
    description: "Pâtes Tria 500g. Pâtes de semoule de blé dur. Cuisson rapide (8-10 minutes). Texture al dente. Idéales pour tous les plats de pâtes.",
    category: "Épicerie sèche",
    imagePrompt: "Professional product photo of Tria pasta 500g box on white background, high resolution, studio lighting, 1920x1080"
  },
  "Riz Basmati 1kg": {
    description: "Riz Basmati 1kg. Riz long grain premium. Grains longs et séparés après cuisson. Saveur délicate et aromatique. Idéal pour les plats asiatiques.",
    category: "Épicerie sèche",
    imagePrompt: "Professional product photo of Basmati rice 1kg bag on white background, high resolution, studio lighting, 1920x1080"
  },
  "Farine 1kg": {
    description: "Farine de blé 1kg. Farine blanche premium pour la pâtisserie et la cuisine. Texture fine et homogène. Idéale pour le pain et les gâteaux.",
    category: "Épicerie sèche",
    imagePrompt: "Professional product photo of flour 1kg bag on white background, high resolution, studio lighting, 1920x1080"
  },
  "Huile Lesieur 1L": {
    description: "Huile de tournesol Lesieur 1L. Huile légère et neutre. Riche en acides gras insaturés. Idéale pour la cuisson et la friture.",
    category: "Épicerie sèche",
    imagePrompt: "Professional product photo of Lesieur oil 1L bottle on white background, high resolution, studio lighting, 1920x1080"
  },

  // Hygiène et beauté
  "Dentifrice Signal 75ml": {
    description: "Dentifrice Signal 75ml. Formule anti-caries avec fluor. Protège les dents et renforce l'émail. Saveur menthe fraîche. Recommandé par les dentistes.",
    category: "Hygiène et beauté",
    imagePrompt: "Professional product photo of Signal toothpaste 75ml tube on white background, high resolution, studio lighting, 1920x1080"
  },
  "Déodorant Rexona 150ml": {
    description: "Déodorant Rexona 150ml. Protection 48h contre la transpiration et les odeurs. Formule douce pour la peau sensible. Parfum frais et durable.",
    category: "Hygiène et beauté",
    imagePrompt: "Professional product photo of Rexona deodorant 150ml spray on white background, high resolution, studio lighting, 1920x1080"
  },
  "Gel douche Dove 250ml": {
    description: "Gel douche Dove 250ml. Formule douce et hydratante. Contient 1/4 de crème hydratante. Convient à tous les types de peau. Dermatologiquement testé.",
    category: "Hygiène et beauté",
    imagePrompt: "Professional product photo of Dove shower gel 250ml bottle on white background, high resolution, studio lighting, 1920x1080"
  },

  // Produits d'entretien
  "Javel Eau de Nil 1L": {
    description: "Javel Eau de Nil 1L. Désinfectant puissant pour le nettoyage. Tue 99.9% des bactéries. Idéale pour les surfaces et le linge blanc.",
    category: "Produits d'entretien",
    imagePrompt: "Professional product photo of Eau de Nil bleach 1L bottle on white background, high resolution, studio lighting, 1920x1080"
  },
  "Lessive Ariel 2kg": {
    description: "Lessive Ariel 2kg. Poudre de lessive haute performance. Élimine les taches tenaces. Efficace en eau froide et chaude. Parfum frais.",
    category: "Produits d'entretien",
    imagePrompt: "Professional product photo of Ariel laundry powder 2kg box on white background, high resolution, studio lighting, 1920x1080"
  },
  "Liquide vaisselle Pril 500ml": {
    description: "Liquide vaisselle Pril 500ml. Formule concentrée ultra-efficace. Coupe la graisse rapidement. Doux pour les mains. Parfum citron frais.",
    category: "Produits d'entretien",
    imagePrompt: "Professional product photo of Pril dish soap 500ml bottle on white background, high resolution, studio lighting, 1920x1080"
  },
  "Sacs poubelle 30L": {
    description: "Sacs poubelle 30L. Sacs résistants et étanches. Capacité 30 litres. Fermeture pratique avec lien. Parfait pour la maison et le bureau.",
    category: "Produits d'entretien",
    imagePrompt: "Professional product photo of garbage bags 30L box on white background, high resolution, studio lighting, 1920x1080"
  }
};

async function enrichProducts() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log("🔄 Début de l'enrichissement des produits...\n");

    for (const [productName, enrichmentData] of Object.entries(productEnrichment)) {
      try {
        // Récupérer le produit
        const [products] = await connection.execute(
          "SELECT id, name FROM products WHERE name = ?",
          [productName]
        );

        if (products.length === 0) {
          console.log(`⚠️  Produit non trouvé: ${productName}`);
          continue;
        }

        const product = products[0];
        console.log(`📝 Enrichissement: ${productName}`);

        // Mettre à jour la description
        await connection.execute(
          "UPDATE products SET description = ? WHERE id = ?",
          [enrichmentData.description, product.id]
        );

        console.log(`   ✓ Description ajoutée`);
        console.log(`   ✓ ${enrichmentData.description.substring(0, 60)}...\n`);
      } catch (error) {
        console.error(`❌ Erreur pour ${productName}:`, error.message);
      }
    }

    console.log("\n✅ Enrichissement terminé!");
    console.log(`📊 ${Object.keys(productEnrichment).length} produits enrichis avec des descriptions détaillées`);

    connection.end();
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
}

enrichProducts();
