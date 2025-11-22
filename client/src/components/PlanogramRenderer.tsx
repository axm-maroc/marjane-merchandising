import React, { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  facings: number;
  shelfLevel: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  color?: string;
}

interface PlanogramRendererProps {
  products: Product[];
  width?: number;
  height?: number;
  view?: "2d" | "3d";
}

const colorPalette = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
  "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B88B", "#ABEBC6",
];

export function PlanogramRenderer2D({
  products,
  width = 800,
  height = 600,
}: Omit<PlanogramRendererProps, "view">) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Fond blanc
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);

    // Grille
    ctx.strokeStyle = "#E0E0E0";
    ctx.lineWidth = 1;
    for (let i = 0; i <= width; i += 100) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i <= height; i += 100) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // Dessiner les produits
    products.forEach((product, index) => {
      const color = product.color || colorPalette[index % colorPalette.length];
      
      // Boîte du produit
      ctx.fillStyle = color;
      ctx.fillRect(product.positionX, product.positionY, product.width, product.height);

      // Bordure
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 2;
      ctx.strokeRect(product.positionX, product.positionY, product.width, product.height);

      // Texte
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const textX = product.positionX + product.width / 2;
      const textY = product.positionY + product.height / 2 - 10;

      ctx.fillText(product.name.substring(0, 15), textX, textY);
      ctx.fillText(`${product.facings}x`, textX, textY + 15);
      ctx.fillText(`${product.quantity} u.`, textX, textY + 30);
    });

    // Légende des étagères
    ctx.fillStyle = "#333333";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    const shelvesSet = new Set(products.map(p => p.shelfLevel));
    const shelves = Array.from(shelvesSet).sort((a, b) => b - a);
    shelves.forEach((shelf, i) => {
      ctx.fillText(`Étagère ${shelf + 1}`, 10, 20 + i * 20);
    });
  }, [products, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-slate-300 rounded-lg bg-white"
    />
  );
}

export function PlanogramRenderer3D({
  products,
  width = 800,
  height = 600,
}: Omit<PlanogramRendererProps, "view">) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Fond dégradé
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#F0F0F0");
    gradient.addColorStop(1, "#E0E0E0");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Perspective 3D simple (isométrique)
    const isometricX = (x: number, z: number) => x - z * 0.5;
    const isometricY = (y: number, z: number) => y + z * 0.25;

    // Dessiner les produits avec effet 3D
    const sortedProducts = [...products].sort((a, b) => {
      const depthA = a.shelfLevel * 100 + a.positionX;
      const depthB = b.shelfLevel * 100 + b.positionX;
      return depthA - depthB;
    });

    sortedProducts.forEach((product, index) => {
      const color = product.color || colorPalette[index % colorPalette.length];
      const depth = 30;

      // Face avant
      ctx.fillStyle = color;
      const x1 = isometricX(product.positionX, 0) + 100;
      const y1 = isometricY(product.positionY, 0) + 150;
      ctx.fillRect(x1, y1, product.width * 0.8, product.height * 0.8);

      // Face supérieure (3D)
      ctx.fillStyle = lightenColor(color, 30);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + depth, y1 - depth * 0.5);
      ctx.lineTo(x1 + product.width * 0.8 + depth, y1 - depth * 0.5);
      ctx.lineTo(x1 + product.width * 0.8, y1);
      ctx.fill();

      // Face latérale (3D)
      ctx.fillStyle = darkenColor(color, 30);
      ctx.beginPath();
      ctx.moveTo(x1 + product.width * 0.8, y1);
      ctx.lineTo(x1 + product.width * 0.8 + depth, y1 - depth * 0.5);
      ctx.lineTo(x1 + product.width * 0.8 + depth, y1 + product.height * 0.8 - depth * 0.5);
      ctx.lineTo(x1 + product.width * 0.8, y1 + product.height * 0.8);
      ctx.fill();

      // Bordure
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x1, y1, product.width * 0.8, product.height * 0.8);

      // Texte
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const textX = x1 + (product.width * 0.8) / 2;
      const textY = y1 + (product.height * 0.8) / 2;

      ctx.fillText(product.name.substring(0, 12), textX, textY - 8);
      ctx.fillText(`${product.facings}x`, textX, textY + 5);
    });

    // Légende
    ctx.fillStyle = "#333333";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Vue 3D Isométrique", 10, 20);
  }, [products, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-slate-300 rounded-lg bg-white"
    />
  );
}

function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function darkenColor(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export function PlanogramVisualization({
  products,
  title = "Visualisation du Planogramme",
  description = "Vue 2D et 3D du planogramme",
}: {
  products: Product[];
  title?: string;
  description?: string;
}) {
  const [view, setView] = React.useState<"2d" | "3d">("2d");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView("2d")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                view === "2d"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              2D
            </button>
            <button
              onClick={() => setView("3d")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                view === "3d"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              3D
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>Aucun produit à afficher</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {view === "2d" ? (
              <PlanogramRenderer2D products={products} width={800} height={600} />
            ) : (
              <PlanogramRenderer3D products={products} width={800} height={600} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
