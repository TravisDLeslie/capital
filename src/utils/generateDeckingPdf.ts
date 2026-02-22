import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Area = {
  name: string;
  mode: "sqft" | "dimensions";
  input: string; // shown under "Size"
  baseSqft: number;
};

type PdfOptions = {
  logoUrl?: string;
  customerName?: string; // ✅ shown under title
  selectedProduct: string;
  pricePerFoot: number;
  boardLen: number; // ✅ selected board length
  areas: Area[];
  totals: {
    baseSqftTotal: number;
    sqftWithWaste: number;
    linearFeet: number; // ✅ used to compute # boards
    subtotal: number;
    delivery: number;
    taxable: number;
    tax: number;
    grandTotal: number;
  };
  fileName: string; // ✅ Capital_Lumber_Quote_001.pdf
};

function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

async function loadImageAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Logo fetch failed: ${res.status} ${res.statusText}`);
  const blob = await res.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("FileReader failed for logo"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

export async function generateDeckingPdf({
  logoUrl,
  customerName,
  selectedProduct,
  pricePerFoot,
  boardLen,
  areas,
  totals,
  fileName,
}: PdfOptions) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();

  let y = 40;

  // --- Logo (centered) ---
  if (logoUrl) {
    try {
      const dataUrl = await loadImageAsDataUrl(logoUrl);
      const format = dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";

      const logoWidth = 190;
      const logoHeight = 60;

      doc.addImage(
        dataUrl,
        format,
        (pageWidth - logoWidth) / 2,
        y,
        logoWidth,
        logoHeight
      );

      // ✅ extra margin below logo
      y += logoHeight + 34;
    } catch (e) {
      console.warn("Logo failed to load, exporting without logo.", e);
      y += 10;
    }
  }

  // --- Title ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Decking Quote", pageWidth / 2, y, { align: "center" });
  y += 22;

  // ✅ Customer name under title (centered)
  const cn = (customerName ?? "").trim();
  if (cn) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Customer: ${cn}`, pageWidth / 2, y, { align: "center" });
    y += 20;
  }

  // Date only (no pricing tier)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 40, y);
  y += 26;

  // --- Product ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Selected Product", 40, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(selectedProduct, 40, y);
  y += 14;

  doc.text(`Price per foot: ${money(pricePerFoot)}`, 40, y);
  y += 14;

  // ✅ Board length + board count
  const lf = Number(totals.linearFeet) || 0;
  const len = Number(boardLen) || 0;
  const boardsNeeded = lf > 0 && len > 0 ? Math.ceil(lf / len) : 0;

  doc.setFontSize(9);
  doc.text(`Board length selected: ${len}'`, 40, y);
  y += 12;

  doc.text(
    `Estimated boards (${len}'): ${boardsNeeded ? `${boardsNeeded} boards` : "—"}`,
    40,
    y
  );
  y += 18;

  // --- Areas table ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Areas", 40, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [["Area", "Size", "Sqft"]],
    body: areas.length
      ? areas.map((a) => [a.name, a.input, `${a.baseSqft} sqft`])
      : [["—", "—", "—"]],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [252, 44, 56], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 180 },
      1: { cellWidth: 280 },
      2: { cellWidth: 80, halign: "right" },
    },
    margin: { left: 40, right: 40 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 22;

  // --- Totals ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Totals", 40, finalY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const lines: Array<[string, string]> = [
    ["Total sqft (input)", `${totals.baseSqftTotal} sqft`],
    ["Sqft + 15% waste", `${totals.sqftWithWaste} sqft`],
    ['Linear feet (5.5" coverage)', `${totals.linearFeet} LF`],
    ["Material subtotal", money(totals.subtotal)],
    ["Delivery fee", money(totals.delivery)],
    ["Taxable total", money(totals.taxable)],
    ["Sales tax (6%)", money(totals.tax)],
    ["Grand total", money(totals.grandTotal)],
  ];

  let yy = finalY + 18;
  for (const [label, value] of lines) {
    doc.text(label, 40, yy);
    doc.text(value, pageWidth - 40, yy, { align: "right" });
    yy += 16;
  }

  doc.save(fileName);
}