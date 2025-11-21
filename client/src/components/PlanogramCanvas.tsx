import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, X } from "lucide-react";

interface Product {
  id: number;
  name: string;
  imageUrl: string;
  category: string;
}

interface PlacedProduct {
  productId: number;
  product: Product;
  x: number;
  y: number;
  width: number;
  height: number;
  shelfLevel: number;
}

interface PlanogramCanvasProps {
  products: Product[];
  placedProducts: PlacedProduct[];
  shelfWidth: number;
  shelfHeight: number;
  shelfLevels: number;
  onProductPlaced: (placement: PlacedProduct) => void;
  onProductRemoved: (productId: number) => void;
  onProductMoved: (productId: number, x: number, y: number, shelfLevel: number) => void;
}

export default function PlanogramCanvas({
  products,
  placedProducts,
  shelfWidth,
  shelfHeight,
  shelfLevels,
  onProductPlaced,
  onProductRemoved,
  onProductMoved,
}: PlanogramCanvasProps) {
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [hoveredShelf, setHoveredShelf] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const product = products.find((p) => p.id === event.active.id);
    if (product) {
      setActiveProduct(product);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProduct(null);
    setHoveredShelf(null);

    if (!over) return;

    // Check if dropping on shelf
    const shelfMatch = over.id.toString().match(/^shelf-(\d+)$/);
    if (shelfMatch) {
      const shelfLevel = parseInt(shelfMatch[1]);
      const product = products.find((p) => p.id === active.id);
      
      if (product) {
        // Check for collisions
        const proposedX = 0; // Start at left edge
        const proposedWidth = 100; // Default width
        const proposedHeight = 80; // Default height

        const hasCollision = placedProducts.some(
          (placed) =>
            placed.shelfLevel === shelfLevel &&
            !(
              proposedX + proposedWidth <= placed.x ||
              proposedX >= placed.x + placed.width
            )
        );

        if (!hasCollision) {
          // Find next available position
          let nextX = 0;
          const productsOnShelf = placedProducts
            .filter((p) => p.shelfLevel === shelfLevel)
            .sort((a, b) => a.x - b.x);

          for (const placed of productsOnShelf) {
            if (nextX + proposedWidth <= placed.x) {
              break;
            }
            nextX = placed.x + placed.width + 10; // 10px gap
          }

          // Check if fits on shelf
          if (nextX + proposedWidth <= shelfWidth) {
            onProductPlaced({
              productId: product.id,
              product,
              x: nextX,
              y: 0,
              width: proposedWidth,
              height: proposedHeight,
              shelfLevel,
            });
          }
        }
      }
    }

    // Check if moving existing product
    const movingMatch = over.id.toString().match(/^shelf-(\d+)$/);
    if (movingMatch && placedProducts.find((p) => p.productId === active.id)) {
      const newShelfLevel = parseInt(movingMatch[1]);
      const existingPlacement = placedProducts.find((p) => p.productId === active.id);
      
      if (existingPlacement) {
        onProductMoved(existingPlacement.productId, existingPlacement.x, existingPlacement.y, newShelfLevel);
      }
    }
  };

  const shelfLevelHeight = shelfHeight / shelfLevels;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Product List */}
      <div className="lg:col-span-1">
        <Card className="p-4">
          <h3 className="font-semibold text-lg mb-4">Produits Disponibles</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              {products.map((product) => {
                const isPlaced = placedProducts.some((p) => p.productId === product.id);
                return (
                  <div
                    key={product.id}
                    id={`product-${product.id}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      isPlaced
                        ? "border-green-200 bg-green-50 opacity-50"
                        : "border-slate-200 bg-white hover:border-blue-400 hover:shadow-md cursor-move"
                    }`}
                    draggable={!isPlaced}
                    onDragStart={(e) => {
                      if (!isPlaced) {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("productId", product.id.toString());
                      }
                    }}
                  >
                    <GripVertical className={`w-4 h-4 ${isPlaced ? "text-slate-300" : "text-slate-400"}`} />
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-12 h-12 object-contain rounded" 
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1599599810694-b5ac4dd0b2d7?w=400&h=400&fit=crop';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {product.category}
                      </Badge>
                    </div>
                    {isPlaced && (
                      <Badge className="bg-green-500">
                        Placé
                      </Badge>
                    )}
                  </div>
                );
              })}
            </DndContext>
          </div>
        </Card>
      </div>

      {/* Planogram Canvas */}
      <div className="lg:col-span-3">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Rayonnage Interactif</h3>
            <Badge variant="outline">
              {placedProducts.length} / {products.length} produits placés
            </Badge>
          </div>

          <div
            className="relative border-4 border-slate-300 rounded-lg bg-gradient-to-b from-slate-50 to-slate-100"
            style={{ width: `${shelfWidth}px`, height: `${shelfHeight}px` }}
          >
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              {/* Shelf Levels */}
              {Array.from({ length: shelfLevels }).map((_, level) => (
                <div
                  key={`shelf-${level}`}
                  id={`shelf-${level}`}
                  className={`absolute left-0 right-0 border-b-2 transition-colors ${
                    hoveredShelf === level ? "border-blue-400 bg-blue-50/50" : "border-slate-300"
                  }`}
                  style={{
                    top: `${level * shelfLevelHeight}px`,
                    height: `${shelfLevelHeight}px`,
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setHoveredShelf(level);
                  }}
                  onDragLeave={() => {
                    setHoveredShelf(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const productId = parseInt(e.dataTransfer.getData("productId"));
                    const product = products.find((p) => p.id === productId);
                    
                    if (product && !placedProducts.some((p) => p.productId === productId)) {
                      // Calculate position
                      let nextX = 0;
                      const proposedWidth = 100;
                      const proposedHeight = 80;
                      
                      const productsOnShelf = placedProducts
                        .filter((p) => p.shelfLevel === level)
                        .sort((a, b) => a.x - b.x);

                      for (const placed of productsOnShelf) {
                        if (nextX + proposedWidth <= placed.x) {
                          break;
                        }
                        nextX = placed.x + placed.width + 10;
                      }

                      if (nextX + proposedWidth <= shelfWidth) {
                        onProductPlaced({
                          productId: product.id,
                          product,
                          x: nextX,
                          y: 10,
                          width: proposedWidth,
                          height: proposedHeight,
                          shelfLevel: level,
                        });
                      }
                    }
                    setHoveredShelf(null);
                  }}
                >
                  <div className="absolute left-2 top-2 text-xs font-semibold text-slate-500">
                    Niveau {level + 1}
                  </div>

                  {/* Placed Products */}
                  {placedProducts
                    .filter((p) => p.shelfLevel === level)
                    .map((placement) => (
                      <div
                        key={`placed-${placement.productId}`}
                        className="absolute group"
                        style={{
                          left: `${placement.x}px`,
                          top: `${placement.y}px`,
                          width: `${placement.width}px`,
                          height: `${placement.height}px`,
                        }}
                      >
                        <div className="relative w-full h-full bg-white border-2 border-blue-400 rounded-lg shadow-md p-2 hover:shadow-lg transition-all">
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onProductRemoved(placement.productId)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <img
                            src={placement.product.imageUrl}
                            alt={placement.product.name}
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-1 rounded-b truncate">
                            {placement.product.name}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ))}

              <DragOverlay>
                {activeProduct && (
                  <div className="bg-white border-2 border-blue-500 rounded-lg shadow-xl p-3 w-32">
                    <img
                      src={activeProduct.imageUrl}
                      alt={activeProduct.name}
                      className="w-full h-20 object-contain mb-2"
                    />
                    <p className="text-xs font-medium text-center truncate">{activeProduct.name}</p>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>

          <div className="mt-4 text-sm text-slate-600">
            <p>💡 Glissez-déposez les produits depuis la liste vers le rayonnage</p>
            <p>💡 Les produits sont automatiquement positionnés sans collision</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
