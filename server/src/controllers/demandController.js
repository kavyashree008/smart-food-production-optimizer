import { Product } from "../models/Product.js";
import { SalesHistory } from "../models/SalesHistory.js";
import { Festival } from "../models/Festival.js";
import { generateDemandForecast } from "../services/planningEngine/forecast.js";

export async function getDemandAnalysis(req, res, next) {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const [sales, festivals] = await Promise.all([
      SalesHistory.find({ productId }).sort({ date: 1 }),
      Festival.find()
    ]);

    const quantities = sales.map((s) => s.quantitySold);
    
    // Calculate mean and standard deviation for anomaly detection (Z-score > 2.5)
    let mean = 0;
    let stdDev = 1;
    if (quantities.length > 0) {
      mean = quantities.reduce((a, b) => a + b, 0) / quantities.length;
      const variance = quantities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / quantities.length;
      stdDev = Math.sqrt(variance) || 1;
    }

    const historyWithAnomalies = sales.map((s) => {
      const zScore = (s.quantitySold - mean) / stdDev;
      return {
        date: s.date,
        quantity: s.quantitySold,
        quantitySold: s.quantitySold,
        isAnomaly: Math.abs(zScore) >= 2.5,
        zScore: Number(zScore.toFixed(2))
      };
    });

    // Run dual forecast model
    const forecast = generateDemandForecast({
      salesHistory: sales,
      horizonDays: 7,
      festivals,
      productCategory: product.category
    });

    // Build 7-day forecast series with confidence band (+/- 12%)
    const today = new Date();
    const forecastSeries = forecast.dailyForecast.map((val, idx) => {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + idx + 1);
      const lowerVal = Math.max(1, Math.round(val * 0.88));
      const upperVal = Math.round(val * 1.12);
      return {
        date: targetDate,
        day: `Day +${idx + 1}`,
        forecast: val,
        predictedQuantity: val,
        lower: lowerVal,
        confidenceLower: lowerVal,
        upper: upperVal,
        confidenceUpper: upperVal
      };
    });

    return res.status(200).json({
      success: true,
      product: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        category: product.category,
        sellingPrice: product.sellingPrice
      },
      method: forecast.chosenMethod,
      forecastMethod: forecast.chosenMethod,
      mape: forecast.mape,
      accuracyPercent: forecast.accuracyPercent,
      forecastAccuracy: {
        mape: forecast.mape,
        accuracyPct: forecast.accuracyPercent
      },
      festivalMultiplier: forecast.festivalMultiplier || 1.0,
      totalForecastQuantity: forecast.totalForecastQuantity,
      history: historyWithAnomalies,
      forecast: forecastSeries,
      forecastSeries,
      festivals
    });
  } catch (error) {
    return next(error);
  }
}