import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, MapPin, Phone, User, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Stores() {
  const { data: stores, isLoading } = trpc.stores.list.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Gestion des Magasins</h1>
              <p className="text-slate-600 mt-1">Gérez vos magasins Marjane</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-600 mt-4">Chargement des magasins...</p>
          </div>
        ) : stores && stores.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <Link key={store.id} href={`/stores/${store.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-slate-200">
                  <CardHeader className="bg-gradient-to-br from-blue-50 to-blue-100 border-b border-blue-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl text-slate-900 mb-2">{store.name}</CardTitle>
                        <CardDescription className="text-slate-700">
                          <div className="flex items-start gap-2 mb-2">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                            <span className="text-sm">{store.address}, {store.city}</span>
                          </div>
                        </CardDescription>
                      </div>
                      <Store className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {store.surface && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Surface</span>
                          <span className="font-semibold text-slate-900">{store.surface.toLocaleString()} m²</span>
                        </div>
                      )}
                      {store.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-4 h-4" />
                          <span>{store.phone}</span>
                        </div>
                      )}
                      {store.managerName && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <User className="w-4 h-4" />
                          <span>{store.managerName}</span>
                        </div>
                      )}
                    </div>
                    <Button variant="default" className="w-full mt-4">
                      Voir les détails →
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-slate-200">
            <CardContent className="py-12 text-center">
              <Store className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun magasin</h3>
              <p className="text-slate-600">Aucun magasin n'est disponible pour le moment</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
