import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PlanogramData {
  name: string;
  storeName: string;
  location: string;
  version: number;
  salesTarget?: number;
  products: Array<{
    productName: string;
    quantity: number;
    facings: number;
    shelfLevel: number;
  }>;
}

export async function exportPlanogramToPDF(
  planogramData: PlanogramData,
  view2DElement: HTMLElement | null,
  view3DElement: HTMLElement | null
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Planogramme Marjane', margin, yPosition);
  yPosition += 10;

  // Store and location info
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Magasin: ${planogramData.storeName}`, margin, yPosition);
  yPosition += 7;
  pdf.text(`Emplacement: ${planogramData.location}`, margin, yPosition);
  yPosition += 7;
  pdf.text(`Planogramme: ${planogramData.name} (v${planogramData.version})`, margin, yPosition);
  yPosition += 7;

  if (planogramData.salesTarget) {
    pdf.text(`Objectif de vente: ${(planogramData.salesTarget / 100).toLocaleString()} DH`, margin, yPosition);
    yPosition += 7;
  }

  pdf.text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, margin, yPosition);
  yPosition += 12;

  // Separator line
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Vue 2D
  if (view2DElement) {
    try {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Vue 2D du Planogramme', margin, yPosition);
      yPosition += 8;

      const canvas = await html2canvas(view2DElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Check if image fits on current page
      if (yPosition + imgHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 10;
    } catch (error) {
      console.error('Error capturing 2D view:', error);
    }
  }

  // Vue 3D
  if (view3DElement) {
    try {
      // Add new page for 3D view
      pdf.addPage();
      yPosition = margin;

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Vue 3D du Planogramme', margin, yPosition);
      yPosition += 8;

      const canvas = await html2canvas(view3DElement, {
        scale: 2,
        backgroundColor: '#1e293b',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 10;
    } catch (error) {
      console.error('Error capturing 3D view:', error);
    }
  }

  // Products list
  pdf.addPage();
  yPosition = margin;

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Liste des Produits', margin, yPosition);
  yPosition += 10;

  // Table header
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  const colWidths = [80, 30, 30, 30];
  const colPositions = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];

  pdf.text('Produit', colPositions[0], yPosition);
  pdf.text('Niveau', colPositions[1], yPosition);
  pdf.text('Facings', colPositions[2], yPosition);
  pdf.text('Quantité', colPositions[3], yPosition);
  yPosition += 2;

  // Line under header
  pdf.setLineWidth(0.3);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // Table rows
  pdf.setFont('helvetica', 'normal');
  planogramData.products.forEach((product, index) => {
    if (yPosition > pageHeight - margin - 10) {
      pdf.addPage();
      yPosition = margin;
    }

    // Alternate row background
    if (index % 2 === 0) {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 7, 'F');
    }

    pdf.text(product.productName, colPositions[0], yPosition);
    pdf.text(`${product.shelfLevel + 1}`, colPositions[1], yPosition);
    pdf.text(`${product.facings}`, colPositions[2], yPosition);
    pdf.text(`${product.quantity}`, colPositions[3], yPosition);
    yPosition += 7;
  });

  // Summary
  yPosition += 10;
  if (yPosition > pageHeight - margin - 30) {
    pdf.addPage();
    yPosition = margin;
  }

  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'bold');
  pdf.text(`Total: ${planogramData.products.length} produits`, margin, yPosition);

  // Footer on last page
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `Page ${i} / ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    pdf.text(
      'Marjane - Optimisation Merchandising Omnicanal',
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  // Generate filename
  const filename = `Planogramme_${planogramData.storeName.replace(/\s+/g, '_')}_${planogramData.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

  // Save PDF
  pdf.save(filename);
}
