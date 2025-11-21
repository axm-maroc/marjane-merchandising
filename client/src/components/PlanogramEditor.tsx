import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { GripVertical, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Product {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  facings: number;
  shelfLevel: number;
  positionX: number;
}

interface PlanogramEditorProps {
  products: Product[];
  onSave: (products: Product[]) => Promise<void>;
}

function SortableProduct({ product, onUpdate }: { 
  product: Product; 
  onUpdate: (id: number, field: keyof Product, value: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <div className="flex-1 grid grid-cols-5 gap-3 items-center">
        <div className="col-span-2">
          <p className="font-medium text-slate-900 text-sm">{product.productName}</p>
        </div>

        <div>
          <label className="text-xs text-slate-600 block mb-1">Quantité</label>
          <Input
            type="number"
            min="1"
            value={product.quantity}
            onChange={(e) => onUpdate(product.id, 'quantity', parseInt(e.target.value) || 1)}
            className="h-8 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-slate-600 block mb-1">Niveau</label>
          <Input
            type="number"
            min="0"
            max="5"
            value={product.shelfLevel}
            onChange={(e) => onUpdate(product.id, 'shelfLevel', parseInt(e.target.value) || 0)}
            className="h-8 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-slate-600 block mb-1">Position X</label>
          <Input
            type="number"
            min="0"
            value={product.positionX}
            onChange={(e) => onUpdate(product.id, 'positionX', parseInt(e.target.value) || 0)}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

export default function PlanogramEditor({ products: initialProducts, onSave }: PlanogramEditorProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isSaving, setIsSaving] = useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setProducts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = [...items];
        const [movedItem] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, movedItem);

        return newItems;
      });
    }
  };

  const handleUpdate = (id: number, field: keyof Product, value: number) => {
    setProducts((items) =>
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(products);
      toast.success('Planogramme sauvegardé avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Édition du Planogramme</h3>
            <p className="text-sm text-slate-600 mt-1">
              Glissez-déposez les produits pour réorganiser, modifiez les valeurs
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={products.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {products.map((product) => (
                <SortableProduct
                  key={product.id}
                  product={product}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {products.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p>Aucun produit dans ce planogramme</p>
            <p className="text-sm mt-2">Ajoutez des produits pour commencer</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
