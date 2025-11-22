import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertCircle, TrendingUp, Eye } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    brand?: string | null;
    photoUrl?: string | null;
    description?: string | null;
    unitPrice?: number;
    width?: number | null;
    height?: number | null;
    depth?: number | null;
    weight?: number | null;
  };
  isSelected?: boolean;
  onSelect?: (productId: number) => void;
  variant?: "grid" | "list" | "compact";
  showDescription?: boolean;
}

export default function ProductCard({
  product,
  isSelected = false,
  onSelect,
  variant = "grid",
  showDescription = false,
}: ProductCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const handleClick = () => {
    if (onSelect) {
      onSelect(product.id);
    }
  };

  // Grid variant - used in CreatePlanogram
  if (variant === "grid") {
    return (
      <>
        <div
          onClick={handleClick}
          className={`group relative rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${
            isSelected
              ? "border-green-600 bg-green-50 shadow-md"
              : "border-slate-200 hover:border-green-300 hover:shadow-sm"
          }`}
        >
          {/* Photo du produit */}
          <div className="relative aspect-square bg-slate-100">
            {product.photoUrl ? (
              <img
                src={product.photoUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/400x400?text=Pas+de+photo";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Package className="w-16 h-16" />
              </div>
            )}

            {/* Badge de sélection */}
            {isSelected && (
              <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1.5">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}

            {/* Overlay hover */}
            <div
              className={`absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors ${
                isSelected ? "bg-green-600/10" : ""
              }`}
            />

            {/* Bouton détails */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(true);
              }}
              className="absolute top-2 left-2 bg-white/90 hover:bg-white text-slate-700 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Voir les détails"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {/* Informations du produit */}
          <div className="p-3">
            <div className="font-medium text-slate-900 line-clamp-2 mb-1">
              {product.name}
            </div>
            {product.brand && (
              <div className="text-xs text-slate-600 mb-2">{product.brand}</div>
            )}
            {product.unitPrice && (
              <div className="text-sm font-semibold text-green-600">
                {(product.unitPrice / 100).toFixed(2)} DH
              </div>
            )}
          </div>
        </div>

        {/* Dialog des détails */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{product.name}</DialogTitle>
              <DialogDescription>{product.brand}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Photo */}
              <div>
                {product.photoUrl ? (
                  <img
                    src={product.photoUrl}
                    alt={product.name}
                    className="w-full h-auto rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-full aspect-square bg-slate-100 rounded-lg flex items-center justify-center">
                    <Package className="w-16 h-16 text-slate-400" />
                  </div>
                )}
              </div>

              {/* Détails */}
              <div className="space-y-4">
                {product.unitPrice && (
                  <div>
                    <div className="text-sm text-slate-600">Prix unitaire</div>
                    <div className="text-2xl font-bold text-green-600">
                      {(product.unitPrice / 100).toFixed(2)} DH
                    </div>
                  </div>
                )}

                {product.description && (
                  <div>
                    <div className="text-sm text-slate-600 mb-2">Description</div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Dimensions */}
                {(product.width || product.height || product.depth) && (
                  <div>
                    <div className="text-sm text-slate-600 mb-2">Dimensions</div>
                    <div className="grid grid-cols-3 gap-2">
                      {product.width && (
                        <div className="bg-slate-50 p-2 rounded text-center">
                          <div className="text-xs text-slate-600">Largeur</div>
                          <div className="font-semibold text-slate-900">
                            {product.width} mm
                          </div>
                        </div>
                      )}
                      {product.height && (
                        <div className="bg-slate-50 p-2 rounded text-center">
                          <div className="text-xs text-slate-600">Hauteur</div>
                          <div className="font-semibold text-slate-900">
                            {product.height} mm
                          </div>
                        </div>
                      )}
                      {product.depth && (
                        <div className="bg-slate-50 p-2 rounded text-center">
                          <div className="text-xs text-slate-600">Profondeur</div>
                          <div className="font-semibold text-slate-900">
                            {product.depth} mm
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {product.weight && (
                  <div>
                    <div className="text-sm text-slate-600">Poids</div>
                    <div className="font-semibold text-slate-900">
                      {product.weight} g
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // List variant - used in planogram details
  if (variant === "list") {
    return (
      <Card className="border-slate-200 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Photo */}
            <div className="flex-shrink-0 w-24 h-24 bg-slate-100 rounded-lg overflow-hidden">
              {product.photoUrl ? (
                <img
                  src={product.photoUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-slate-400" />
                </div>
              )}
            </div>

            {/* Détails */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">
                {product.name}
              </h3>
              {product.brand && (
                <p className="text-sm text-slate-600">{product.brand}</p>
              )}
              {product.description && (
                <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                  {product.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                {product.unitPrice && (
                  <Badge variant="default" className="text-sm">
                    {(product.unitPrice / 100).toFixed(2)} DH
                  </Badge>
                )}
                {product.width && (
                  <span className="text-xs text-slate-600">
                    L: {product.width}mm
                  </span>
                )}
              </div>
            </div>

            {/* Action */}
            {onSelect && (
              <button
                onClick={handleClick}
                className={`flex-shrink-0 px-3 py-2 rounded-lg transition-colors ${
                  isSelected
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {isSelected ? "Sélectionné" : "Sélectionner"}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact variant - used in planogram 2D/3D view tooltips
  return (
    <div className="bg-white rounded-lg shadow-lg p-3 max-w-xs">
      {product.photoUrl && (
        <img
          src={product.photoUrl}
          alt={product.name}
          className="w-full h-24 object-cover rounded mb-2"
        />
      )}
      <h4 className="font-semibold text-sm text-slate-900 mb-1">
        {product.name}
      </h4>
      {product.brand && (
        <p className="text-xs text-slate-600 mb-2">{product.brand}</p>
      )}
      {product.unitPrice && (
        <div className="text-sm font-semibold text-green-600 mb-2">
          {(product.unitPrice / 100).toFixed(2)} DH
        </div>
      )}
      {product.description && (
        <p className="text-xs text-slate-600 line-clamp-2">
          {product.description}
        </p>
      )}
    </div>
  );
}
