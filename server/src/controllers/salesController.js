import { SalesHistory } from "../models/SalesHistory.js";
import { Product } from "../models/Product.js";

export async function getSalesHistory(req, res, next) {
  try {
    const { productId, days = 90 } = req.query;
    const filter = {};

    if (productId) filter.productId = productId;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(days));
    filter.date = { $gte: cutoffDate };

    const sales = await SalesHistory.find(filter)
      .populate("productId", "name sku category")
      .sort({ date: 1 });

    return res.status(200).json({ success: true, count: sales.length, sales });
  } catch (error) {
    return next(error);
  }
}

export async function createSaleRecord(req, res, next) {
  try {
    const { productId, date, quantitySold } = req.body;
    const sale = await SalesHistory.create({
      productId,
      date: new Date(date),
      quantitySold
    });
    return res.status(201).json({ success: true, sale });
  } catch (error) {
    return next(error);
  }
}

export async function importSalesCsv(req, res, next) {
  try {
    const { csvData, records } = req.body;

    let itemsToInsert = [];

    if (Array.isArray(records)) {
      itemsToInsert = records.map((r) => ({
        productId: r.productId,
        date: new Date(r.date),
        quantitySold: Number(r.quantitySold)
      }));
    } else if (typeof csvData === "string") {
      // Parse CSV lines: productId/sku,date,quantitySold
      const lines = csvData.trim().split("\n");
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",").map((c) => c.trim());
        if (row.length < 3) continue;

        const prodIdentifier = row[0];
        const date = new Date(row[1]);
        const quantitySold = Number(row[2]);

        if (!isNaN(quantitySold)) {
          // Resolve sku if needed
          let pId = prodIdentifier;
          if (!prodIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
            const foundProduct = await Product.findOne({
              $or: [{ sku: prodIdentifier }, { name: prodIdentifier }]
            });
            if (foundProduct) pId = foundProduct._id;
          }

          itemsToInsert.push({ productId: pId, date, quantitySold });
        }
      }
    }

    if (itemsToInsert.length === 0) {
      return res.status(400).json({ success: false, message: "No valid sales records parsed" });
    }

    const inserted = await SalesHistory.insertMany(itemsToInsert, { ordered: false });
    return res.status(201).json({
      success: true,
      message: `Successfully imported ${inserted.length} sales history records`,
      count: inserted.length
    });
  } catch (error) {
    return next(error);
  }
}