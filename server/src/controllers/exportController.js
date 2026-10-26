import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { ProductionPlan } from "../models/ProductionPlan.js";

export async function exportPlanPdf(req, res, next) {
  try {
    const plans = await ProductionPlan.find()
      .populate("productId", "name sku unit category")
      .sort({ createdAt: -1 });

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=production-plan.pdf");

    doc.pipe(res);

    // Title
    doc.fontSize(20).text("Smart Food Production Optimizer", { align: "center" });
    doc.fontSize(12).fillColor("#1F6F5B").text("Adaptive Production Schedule & BOM Report", { align: "center" });
    doc.moveDown(1.5);

    doc.fillColor("#333333").fontSize(10).text(`Generated: ${new Date().toLocaleString("en-IN")}`);
    doc.moveDown(1);

    // Table Header
    doc.font("Helvetica-Bold");
    doc.text("Product", 40, doc.y, { width: 180 });
    doc.text("Quantity", 230, doc.y, { width: 80 });
    doc.text("Status", 320, doc.y, { width: 80 });
    doc.text("Risk", 410, doc.y, { width: 70 });
    doc.moveDown(0.5);
    doc.strokeColor("#cccccc").lineWidth(1).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font("Helvetica");
    for (const plan of plans) {
      if (doc.y > 700) {
        doc.addPage();
      }
      const prodName = plan.productId?.name || "Product";
      const qtyStr = `${plan.quantity} ${plan.productId?.unit || "kg"}`;
      const statusStr = plan.status.toUpperCase();
      const riskStr = `${plan.riskLevel.toUpperCase()} (${plan.riskScore})`;

      doc.text(prodName, 40, doc.y, { width: 180 });
      doc.text(qtyStr, 230, doc.y, { width: 80 });
      doc.text(statusStr, 320, doc.y, { width: 80 });
      doc.text(riskStr, 410, doc.y, { width: 70 });
      doc.moveDown(0.8);
    }

    doc.end();
  } catch (error) {
    return next(error);
  }
}

export async function exportPlanExcel(req, res, next) {
  try {
    const plans = await ProductionPlan.find()
      .populate("productId", "name sku unit category sellingPrice shelfLifeDays")
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Production Plan");

    sheet.columns = [
      { header: "Product SKU", key: "sku", width: 18 },
      { header: "Product Name", key: "name", width: 30 },
      { header: "Category", key: "category", width: 16 },
      { header: "Recommended Quantity", key: "quantity", width: 22 },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Status", key: "status", width: 14 },
      { header: "Risk Level", key: "riskLevel", width: 14 },
      { header: "Risk Score", key: "riskScore", width: 12 },
      { header: "Change Reason", key: "changeReason", width: 35 }
    ];

    plans.forEach((plan) => {
      sheet.addRow({
        sku: plan.productId?.sku || "",
        name: plan.productId?.name || "",
        category: plan.productId?.category || "",
        quantity: plan.quantity,
        unit: plan.productId?.unit || "kg",
        status: plan.status,
        riskLevel: plan.riskLevel,
        riskScore: plan.riskScore,
        changeReason: plan.changeReason
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=production-plan.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return next(error);
  }
}