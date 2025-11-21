import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Download, Printer, ArrowLeft, ExternalLink, Copy, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import QRCodeStyling from "qr-code-styling";
import { useEffect } from "react";
import { APP_LOGO } from "@/const";

export default function FeedbackAdmin() {
  const [copiedStoreId, setCopiedStoreId] = useState<number | null>(null);

  // Charger les magasins
  const { data: stores } = trpc.stores.list.useQuery();

  // Charger les statistiques NPS par magasin
  const storeStats = stores?.map(store => {
    const { data: npsData } = trpc.kpis.npsScore.useQuery({ storeId: store.id });
    return { store, npsData };
  });

  const getFeedbackUrl = (storeId: number) => {
    return `${window.location.origin}/feedback/${storeId}`;
  };

  const copyToClipboard = (storeId: number) => {
    const url = getFeedbackUrl(storeId);
    navigator.clipboard.writeText(url);
    setCopiedStoreId(storeId);
    setTimeout(() => setCopiedStoreId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container py-6">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/kpis">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Retour aux KPIs
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <QrCode className="w-8 h-8 text-indigo-600" />
                QR Codes Feedback Client
              </h1>
              <p className="text-slate-600 mt-1">
                Générez et téléchargez les QR codes pour collecter les avis NPS en magasin
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores?.map((store) => {
            const stats = storeStats?.find(s => s.store.id === store.id)?.npsData;
            
            return (
              <QRCodeCard
                key={store.id}
                store={store}
                stats={stats}
                feedbackUrl={getFeedbackUrl(store.id)}
                onCopy={() => copyToClipboard(store.id)}
                isCopied={copiedStoreId === store.id}
              />
            );
          })}
        </div>

        {/* Instructions */}
        <Card className="mt-8 border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-600" />
              Comment utiliser les QR codes ?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                1
              </div>
              <p>
                <strong>Téléchargez</strong> le QR code du magasin en cliquant sur le bouton "Télécharger PNG"
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                2
              </div>
              <p>
                <strong>Imprimez</strong> le QR code et placez-le à un endroit visible (caisse, accueil, sortie)
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                3
              </div>
              <p>
                Les clients <strong>scannent le QR code</strong> avec leur smartphone et donnent leur avis
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                4
              </div>
              <p>
                Les données sont <strong>automatiquement collectées</strong> et visibles dans les KPIs stratégiques
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

interface QRCodeCardProps {
  store: any;
  stats: any;
  feedbackUrl: string;
  onCopy: () => void;
  isCopied: boolean;
}

function QRCodeCard({ store, stats, feedbackUrl, onCopy, isCopied }: QRCodeCardProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    if (!qrCodeRef.current) return;

    // Créer le QR code stylisé
    qrCodeInstance.current = new QRCodeStyling({
      width: 300,
      height: 300,
      data: feedbackUrl,
      margin: 10,
      qrOptions: {
        typeNumber: 0,
        mode: "Byte",
        errorCorrectionLevel: "H",
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.4,
        margin: 5,
      },
      dotsOptions: {
        type: "rounded",
        color: "#4f46e5", // indigo-600
      },
      backgroundOptions: {
        color: "#ffffff",
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: "#4f46e5",
      },
      cornersDotOptions: {
        type: "dot",
        color: "#4f46e5",
      },
    });

    qrCodeInstance.current.append(qrCodeRef.current);
  }, [feedbackUrl]);

  const handleDownload = () => {
    if (qrCodeInstance.current) {
      qrCodeInstance.current.download({
        name: `qr-feedback-${store.name.replace(/\s+/g, "-").toLowerCase()}`,
        extension: "png",
      });
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${store.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              text-align: center;
              border: 2px solid #e2e8f0;
              border-radius: 12px;
              padding: 40px;
              max-width: 500px;
            }
            h1 {
              color: #1e293b;
              margin-bottom: 10px;
              font-size: 28px;
            }
            h2 {
              color: #4f46e5;
              margin-bottom: 20px;
              font-size: 22px;
            }
            .qr-code {
              margin: 30px 0;
            }
            .instructions {
              color: #64748b;
              font-size: 16px;
              line-height: 1.6;
              margin-top: 20px;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Donnez votre avis !</h1>
            <h2>${store.name}</h2>
            <div class="qr-code">
              ${qrCodeRef.current?.innerHTML || ""}
            </div>
            <div class="instructions">
              <p><strong>Scannez ce QR code</strong> avec votre smartphone</p>
              <p>pour partager votre expérience</p>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <Card className="border-slate-200 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="truncate">{store.name}</span>
          {stats && (
            <Badge variant={stats.npsScore >= 50 ? "default" : "secondary"}>
              NPS: {stats.npsScore}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-sm">
          {store.city} · {stats?.totalResponses || 0} avis
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* QR Code */}
        <div className="bg-white p-4 rounded-lg border-2 border-slate-200 flex justify-center">
          <div ref={qrCodeRef} className="w-full max-w-[300px]" />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            PNG
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </Button>
        </div>

        {/* URL */}
        <div className="flex gap-2">
          <Button
            onClick={onCopy}
            variant="ghost"
            size="sm"
            className="flex-1 gap-2 text-xs justify-start"
          >
            {isCopied ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="truncate">{feedbackUrl}</span>
              </>
            )}
          </Button>
          <Button
            onClick={() => window.open(feedbackUrl, "_blank")}
            variant="ghost"
            size="sm"
            className="gap-1"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>

        {/* Statistiques */}
        {stats && stats.totalResponses > 0 && (
          <div className="grid grid-cols-3 gap-2 text-xs text-center pt-2 border-t">
            <div className="p-2 bg-emerald-50 rounded">
              <div className="font-bold text-emerald-700">{stats.promoters}</div>
              <div className="text-slate-600">Promoteurs</div>
            </div>
            <div className="p-2 bg-slate-50 rounded">
              <div className="font-bold text-slate-700">{stats.passives}</div>
              <div className="text-slate-600">Passifs</div>
            </div>
            <div className="p-2 bg-red-50 rounded">
              <div className="font-bold text-red-700">{stats.detractors}</div>
              <div className="text-slate-600">Détracteurs</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
