import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { RawMaterial } from "../models/RawMaterial.js";
import { Batch } from "../models/Batch.js";
import { Recipe } from "../models/Recipe.js";
import { SalesHistory } from "../models/SalesHistory.js";
import { Order } from "../models/Order.js";
import { ProductionPlan } from "../models/ProductionPlan.js";
import { Alert } from "../models/Alert.js";
import { WasteLog } from "../models/WasteLog.js";
import { Festival } from "../models/Festival.js";
import { Simulation } from "../models/Simulation.js";
import { AuditLog } from "../models/AuditLog.js";

async function seed() {
  console.log("Connecting to database at", env.MONGO_URI);
  await mongoose.connect(env.MONGO_URI);

  console.log("Clearing existing collections...");
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    RawMaterial.deleteMany({}),
    Batch.deleteMany({}),
    Recipe.deleteMany({}),
    SalesHistory.deleteMany({}),
    Order.deleteMany({}),
    ProductionPlan.deleteMany({}),
    Alert.deleteMany({}),
    WasteLog.deleteMany({}),
    Festival.deleteMany({}),
    Simulation.deleteMany({}),
    AuditLog.deleteMany({})
  ]);

  console.log("Seeding Users...");
  const salt = 10;
  const adminHash = await bcrypt.hash("Admin@123", salt);
  const managerHash = await bcrypt.hash("Manager@123", salt);
  const staffHash = await bcrypt.hash("Staff@123", salt);

  const [adminUser, managerUser, staffUser] = await User.create([
    {
      name: "Rajesh Sharma (Admin)",
      email: "admin@smartfood.com",
      passwordHash: adminHash,
      role: "admin"
    },
    {
      name: "Priya Nair (Production Manager)",
      email: "manager@smartfood.com",
      passwordHash: managerHash,
      role: "manager"
    },
    {
      name: "Vikram Patil (Line Lead)",
      email: "staff@smartfood.com",
      passwordHash: staffHash,
      role: "staff"
    }
  ]);

  console.log("Seeding Raw Materials...");
  const rawMaterialsData = [
    { name: "All Purpose Flour (Maida)", unit: "kg", supplier: "Krishna Agro Mills", leadTimeDays: 2, reorderLevel: 500, costPerUnit: 34 },
    { name: "Whole Wheat Flour (Atta)", unit: "kg", supplier: "Aashirwad Grain Supply", leadTimeDays: 2, reorderLevel: 450, costPerUnit: 40 },
    { name: "Refined White Sugar", unit: "kg", supplier: "Balrampur Sugar Mills", leadTimeDays: 3, reorderLevel: 400, costPerUnit: 42 },
    { name: "Pure Cow Ghee", unit: "kg", supplier: "Nandini Karnataka Dairy", leadTimeDays: 3, reorderLevel: 150, costPerUnit: 540 },
    { name: "Pasteurized Butter", unit: "kg", supplier: "Amul Anand Dairy", leadTimeDays: 2, reorderLevel: 120, costPerUnit: 420 },
    { name: "Skimmed Milk Powder", unit: "kg", supplier: "Verka Punjab Dairy", leadTimeDays: 4, reorderLevel: 80, costPerUnit: 290 },
    { name: "Bengal Gram Flour (Besan)", unit: "kg", supplier: "Rajdhani Agro Pulses", leadTimeDays: 2, reorderLevel: 250, costPerUnit: 88 },
    { name: "Whole Cashew Nuts (W320)", unit: "kg", supplier: "Mangalore Dry Fruits", leadTimeDays: 5, reorderLevel: 100, costPerUnit: 780 },
    { name: "Fine Rice Flour", unit: "kg", supplier: "Ponni Grain Mills", leadTimeDays: 2, reorderLevel: 300, costPerUnit: 44 },
    { name: "Refined Sunflower Oil", unit: "kg", supplier: "Fortune Agro Refineries", leadTimeDays: 2, reorderLevel: 350, costPerUnit: 135 },
    { name: "Green Cardamom Powder", unit: "kg", supplier: "Idukki Spices Co.", leadTimeDays: 5, reorderLevel: 15, costPerUnit: 2400 },
    { name: "Active Dry Yeast", unit: "kg", supplier: "Angel Industrial Yeast", leadTimeDays: 3, reorderLevel: 30, costPerUnit: 320 },
    { name: "White Sesame & Cumin Blend", unit: "kg", supplier: "Gujarat Spices Ltd", leadTimeDays: 3, reorderLevel: 50, costPerUnit: 195 },
    { name: "Food Grade Leavening Agent", unit: "kg", supplier: "Rex Fine Chemicals", leadTimeDays: 4, reorderLevel: 25, costPerUnit: 140 }
  ];

  const rawMaterials = await RawMaterial.create(rawMaterialsData);
  const rawMap = {};
  rawMaterials.forEach((rm) => {
    rawMap[rm.name] = rm;
  });

  console.log("Seeding Raw Material Batches (FEFO)...");
  const now = new Date();
  
  // Date helpers
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  const daysFromNow = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  const batchesData = [
    // CRITICAL DEMO BATCH: Pasteurized butter expiring in 3 days!
    {
      rawMaterialId: rawMap["Pasteurized Butter"]._id,
      batchNo: "BAT-BUTTER-001",
      quantity: 250,
      remainingQty: 220,
      receivedDate: daysAgo(22),
      expiryDate: daysFromNow(3), // EXPIRING IN 3 DAYS!
      costPerUnit: 420,
      status: "active"
    },
    {
      rawMaterialId: rawMap["Pasteurized Butter"]._id,
      batchNo: "BAT-BUTTER-002",
      quantity: 400,
      remainingQty: 400,
      receivedDate: daysAgo(5),
      expiryDate: daysFromNow(40),
      costPerUnit: 420,
      status: "active"
    },
    // Maida batches
    {
      rawMaterialId: rawMap["All Purpose Flour (Maida)"]._id,
      batchNo: "BAT-MAIDA-001",
      quantity: 600,
      remainingQty: 340,
      receivedDate: daysAgo(15),
      expiryDate: daysFromNow(60),
      costPerUnit: 34,
      status: "active"
    },
    {
      rawMaterialId: rawMap["All Purpose Flour (Maida)"]._id,
      batchNo: "BAT-MAIDA-002",
      quantity: 800,
      remainingQty: 800,
      receivedDate: daysAgo(2),
      expiryDate: daysFromNow(120),
      costPerUnit: 34,
      status: "active"
    },
    // Atta batches
    {
      rawMaterialId: rawMap["Whole Wheat Flour (Atta)"]._id,
      batchNo: "BAT-ATTA-001",
      quantity: 500,
      remainingQty: 280,
      receivedDate: daysAgo(10),
      expiryDate: daysFromNow(45),
      costPerUnit: 40,
      status: "active"
    },
    {
      rawMaterialId: rawMap["Whole Wheat Flour (Atta)"]._id,
      batchNo: "BAT-ATTA-002",
      quantity: 600,
      remainingQty: 600,
      receivedDate: daysAgo(1),
      expiryDate: daysFromNow(90),
      costPerUnit: 40,
      status: "active"
    },
    // Sugar batches
    {
      rawMaterialId: rawMap["Refined White Sugar"]._id,
      batchNo: "BAT-SUGAR-001",
      quantity: 600,
      remainingQty: 450,
      receivedDate: daysAgo(20),
      expiryDate: daysFromNow(180),
      costPerUnit: 42,
      status: "active"
    },
    // Pure Cow Ghee
    {
      rawMaterialId: rawMap["Pure Cow Ghee"]._id,
      batchNo: "BAT-GHEE-001",
      quantity: 200,
      remainingQty: 140,
      receivedDate: daysAgo(15),
      expiryDate: daysFromNow(75),
      costPerUnit: 540,
      status: "active"
    },
    // Besan
    {
      rawMaterialId: rawMap["Bengal Gram Flour (Besan)"]._id,
      batchNo: "BAT-BESAN-001",
      quantity: 350,
      remainingQty: 210,
      receivedDate: daysAgo(12),
      expiryDate: daysFromNow(50),
      costPerUnit: 88,
      status: "active"
    },
    // Cashew Nuts (Expiring in 6 days - Secondary watch)
    {
      rawMaterialId: rawMap["Whole Cashew Nuts (W320)"]._id,
      batchNo: "BAT-CASHEW-001",
      quantity: 120,
      remainingQty: 85,
      receivedDate: daysAgo(40),
      expiryDate: daysFromNow(6), // EXPIRING IN 6 DAYS!
      costPerUnit: 780,
      status: "active"
    },
    {
      rawMaterialId: rawMap["Whole Cashew Nuts (W320)"]._id,
      batchNo: "BAT-CASHEW-002",
      quantity: 200,
      remainingQty: 200,
      receivedDate: daysAgo(4),
      expiryDate: daysFromNow(150),
      costPerUnit: 780,
      status: "active"
    },
    // Rice Flour
    {
      rawMaterialId: rawMap["Fine Rice Flour"]._id,
      batchNo: "BAT-RICE-001",
      quantity: 400,
      remainingQty: 320,
      receivedDate: daysAgo(8),
      expiryDate: daysFromNow(80),
      costPerUnit: 44,
      status: "active"
    },
    // Sunflower Oil
    {
      rawMaterialId: rawMap["Refined Sunflower Oil"]._id,
      batchNo: "BAT-OIL-001",
      quantity: 500,
      remainingQty: 410,
      receivedDate: daysAgo(6),
      expiryDate: daysFromNow(120),
      costPerUnit: 135,
      status: "active"
    },
    // Milk Powder
    {
      rawMaterialId: rawMap["Skimmed Milk Powder"]._id,
      batchNo: "BAT-MILK-001",
      quantity: 150,
      remainingQty: 95,
      receivedDate: daysAgo(14),
      expiryDate: daysFromNow(60),
      costPerUnit: 290,
      status: "active"
    },
    // Cardamom Powder
    {
      rawMaterialId: rawMap["Green Cardamom Powder"]._id,
      batchNo: "BAT-CARDAMOM-001",
      quantity: 25,
      remainingQty: 18,
      receivedDate: daysAgo(30),
      expiryDate: daysFromNow(90),
      costPerUnit: 2400,
      status: "active"
    },
    // Yeast
    {
      rawMaterialId: rawMap["Active Dry Yeast"]._id,
      batchNo: "BAT-YEAST-001",
      quantity: 50,
      remainingQty: 38,
      receivedDate: daysAgo(10),
      expiryDate: daysFromNow(45),
      costPerUnit: 320,
      status: "active"
    },
    // Sesame Seeds
    {
      rawMaterialId: rawMap["White Sesame & Cumin Blend"]._id,
      batchNo: "BAT-SESAME-001",
      quantity: 70,
      remainingQty: 52,
      receivedDate: daysAgo(15),
      expiryDate: daysFromNow(100),
      costPerUnit: 195,
      status: "active"
    },
    // Leavening Agent
    {
      rawMaterialId: rawMap["Food Grade Leavening Agent"]._id,
      batchNo: "BAT-BAKING-001",
      quantity: 40,
      remainingQty: 31,
      receivedDate: daysAgo(18),
      expiryDate: daysFromNow(160),
      costPerUnit: 140,
      status: "active"
    }
  ];

  await Batch.create(batchesData);

  console.log("Seeding Products...");
  const productsData = [
    {
      name: "Butter Cashew Cookies",
      sku: "PROD-BUTTER-COOKIE",
      unit: "kg",
      category: "Biscuits",
      shelfLifeDays: 60,
      safetyStock: 80,
      currentStock: 45,
      productionRatePerHour: 60,
      sellingPrice: 320
    },
    {
      name: "Premium Milk Rusk",
      sku: "PROD-RUSK",
      unit: "kg",
      category: "Bakery",
      shelfLifeDays: 45,
      safetyStock: 120,
      currentStock: 70,
      productionRatePerHour: 80,
      sellingPrice: 180
    },
    {
      name: "Whole Wheat Sandwich Bread",
      sku: "PROD-WHEAT-BREAD",
      unit: "kg",
      category: "Bakery",
      shelfLifeDays: 5,
      safetyStock: 150,
      currentStock: 90,
      productionRatePerHour: 100,
      sellingPrice: 60
    },
    {
      name: "Traditional Butter Murukku",
      sku: "PROD-MURUKKU",
      unit: "kg",
      category: "Snacks",
      shelfLifeDays: 40,
      safetyStock: 100,
      currentStock: 60,
      productionRatePerHour: 50,
      sellingPrice: 260
    },
    {
      name: "Special Ghee Mysore Pak",
      sku: "PROD-MYSORE-PAK",
      unit: "kg",
      category: "Sweets",
      shelfLifeDays: 25,
      safetyStock: 60,
      currentStock: 30,
      productionRatePerHour: 40,
      sellingPrice: 650
    },
    {
      name: "Royal Kaju Katli",
      sku: "PROD-KAJU-KATLI",
      unit: "kg",
      category: "Sweets",
      shelfLifeDays: 20,
      safetyStock: 50,
      currentStock: 25,
      productionRatePerHour: 35,
      sellingPrice: 980
    },
    {
      name: "Methi Masala Khakhra",
      sku: "PROD-KHAKHRA",
      unit: "kg",
      category: "Snacks",
      shelfLifeDays: 90,
      safetyStock: 90,
      currentStock: 85,
      productionRatePerHour: 55,
      sellingPrice: 210
    },
    {
      name: "Instant Gulab Jamun Mix",
      sku: "PROD-GULAB-MIX",
      unit: "kg",
      category: "Packaged Foods",
      shelfLifeDays: 180,
      safetyStock: 100,
      currentStock: 110,
      productionRatePerHour: 75,
      sellingPrice: 290
    },
    {
      name: "Cardamom Nankhatai",
      sku: "PROD-NANKHATAI",
      unit: "kg",
      category: "Biscuits",
      shelfLifeDays: 60,
      safetyStock: 70,
      currentStock: 40,
      productionRatePerHour: 50,
      sellingPrice: 340
    }
  ];

  const products = await Product.create(productsData);
  const prodMap = {};
  products.forEach((p) => {
    prodMap[p.name] = p;
  });

  console.log("Seeding Recipes (BOM)...");
  const recipesData = [
    // Butter Cashew Cookies: Heavy on Butter and Cashew
    {
      productId: prodMap["Butter Cashew Cookies"]._id,
      yieldPerBatch: 100,
      ingredients: [
        { rawMaterialId: rawMap["All Purpose Flour (Maida)"]._id, qtyPerUnit: 0.45 },
        { rawMaterialId: rawMap["Pasteurized Butter"]._id, qtyPerUnit: 0.28 },
        { rawMaterialId: rawMap["Refined White Sugar"]._id, qtyPerUnit: 0.20 },
        { rawMaterialId: rawMap["Whole Cashew Nuts (W320)"]._id, qtyPerUnit: 0.12 },
        { rawMaterialId: rawMap["Food Grade Leavening Agent"]._id, qtyPerUnit: 0.01 }
      ]
    },
    // Premium Milk Rusk
    {
      productId: prodMap["Premium Milk Rusk"]._id,
      yieldPerBatch: 100,
      ingredients: [
        { rawMaterialId: rawMap["All Purpose Flour (Maida)"]._id, qtyPerUnit: 0.60 },
        { rawMaterialId: rawMap["Refined White Sugar"]._id, qtyPerUnit: 0.22 },
        { rawMaterialId: rawMap["Skimmed Milk Powder"]._id, qtyPerUnit: 0.08 },
        { rawMaterialId: rawMap["Pasteurized Butter"]._id, qtyPerUnit: 0.06 },
        { rawMaterialId: rawMap["Active Dry Yeast"]._id, qtyPerUnit: 0.02 },
        { rawMaterialId: rawMap["Green Cardamom Powder"]._id, qtyPerUnit: 0.005 }
      ]
    },
    // Whole Wheat Bread
    {
      productId: prodMap["Whole Wheat Sandwich Bread"]._id,
      yieldPerBatch: 100,
      ingredients: [
        { rawMaterialId: rawMap["Whole Wheat Flour (Atta)"]._id, qtyPerUnit: 0.70 },
        { rawMaterialId: rawMap["Refined White Sugar"]._id, qtyPerUnit: 0.05 },
        { rawMaterialId: rawMap["Refined Sunflower Oil"]._id, qtyPerUnit: 0.04 },
        { rawMaterialId: rawMap["Active Dry Yeast"]._id, qtyPerUnit: 0.025 }
      ]
    },
    // Traditional Butter Murukku
    {
      productId: prodMap["Traditional Butter Murukku"]._id,
      yieldPerBatch: 100,
      ingredients: [
        { rawMaterialId: rawMap["Fine Rice Flour"]._id, qtyPerUnit: 0.65 },
        { rawMaterialId: rawMap["Bengal Gram Flour (Besan)"]._id, qtyPerUnit: 0.15 },
        { rawMaterialId: rawMap["Pasteurized Butter"]._id, qtyPerUnit: 0.12 },
        { rawMaterialId: rawMap["White Sesame & Cumin Blend"]._id, qtyPerUnit: 0.05 },
        { rawMaterialId: rawMap["Refined Sunflower Oil"]._id, qtyPerUnit: 0.08 }
      ]
    },
    // Special Ghee Mysore Pak
    {
      productId: prodMap["Special Ghee Mysore Pak"]._id,
      yieldPerBatch: 100,
      ingredients: [
        { rawMaterialId: rawMap["Bengal Gram Flour (Besan)"]._id, qtyPerUnit: 0.35 },
        { rawMaterialId: rawMap["Pure Cow Ghee"]._id, qtyPerUnit: 0.38 },
        { rawMaterialId: rawMap["Refined White Sugar"]._id, qtyPerUnit: 0.32 }
      ]
    },
    // Royal Kaju Katli
    {
      productId: prodMap["Royal Kaju Katli"]._id,
      yieldPerBatch: 100,
      ingredients: [
        { rawMaterialId: rawMap["Whole Cashew Nuts (W320)"]._id, qtyPerUnit: 0.65 },
        { rawMaterialId: rawMap["Refined White Sugar"]._id, qtyPerUnit: 0.35 },
        { rawMaterialId: rawMap["Pure Cow Ghee"]._id, qtyPerUnit: 0.02 },
        { rawMaterialId: rawMap["Green Cardamom Powder"]._id, qtyPerUnit: 0.005 }
      ]
    },
    // Methi Masala Khakhra
    {
      productId: prodMap["Methi Masala Khakhra"]._id,
      yieldPerBatch: 100,
      ingredients: [
        { rawMaterialId: rawMap["Whole Wheat Flour (Atta)"]._id, qtyPerUnit: 0.75 },
        { rawMaterialId: rawMap["Refined Sunflower Oil"]._id, qtyPerUnit: 0.10 },
        { rawMaterialId: rawMap["White Sesame & Cumin Blend"]._id, qtyPerUnit: 0.04 }
      ]
    },
    // Instant Gulab Jamun Mix
    {
      productId: prodMap["Instant Gulab Jamun Mix"]._id,
      yieldPerBatch: 100,
      ingredients: [
        { rawMaterialId: rawMap["Skimmed Milk Powder"]._id, qtyPerUnit: 0.50 },
        { rawMaterialId: rawMap["All Purpose Flour (Maida)"]._id, qtyPerUnit: 0.40 },
        { rawMaterialId: rawMap["Pure Cow Ghee"]._id, qtyPerUnit: 0.08 },
        { rawMaterialId: rawMap["Food Grade Leavening Agent"]._id, qtyPerUnit: 0.02 }
      ]
    },
    // Cardamom Nankhatai
    {
      productId: prodMap["Cardamom Nankhatai"]._id,
      yieldPerBatch: 100,
      ingredients: [
        { rawMaterialId: rawMap["All Purpose Flour (Maida)"]._id, qtyPerUnit: 0.40 },
        { rawMaterialId: rawMap["Bengal Gram Flour (Besan)"]._id, qtyPerUnit: 0.15 },
        { rawMaterialId: rawMap["Pure Cow Ghee"]._id, qtyPerUnit: 0.25 },
        { rawMaterialId: rawMap["Refined White Sugar"]._id, qtyPerUnit: 0.22 },
        { rawMaterialId: rawMap["Green Cardamom Powder"]._id, qtyPerUnit: 0.01 }
      ]
    }
  ];

  await Recipe.create(recipesData);

  console.log("Seeding 90 Days of Sales History with Seasonality and Festival Spikes...");
  const salesHistoryRecords = [];

  const baseSalesVolume = {
    "Butter Cashew Cookies": 50,
    "Premium Milk Rusk": 75,
    "Whole Wheat Sandwich Bread": 110,
    "Traditional Butter Murukku": 45,
    "Special Ghee Mysore Pak": 35,
    "Royal Kaju Katli": 28,
    "Methi Masala Khakhra": 40,
    "Instant Gulab Jamun Mix": 30,
    "Cardamom Nankhatai": 35
  };

  for (let d = 89; d >= 0; d--) {
    const saleDate = daysAgo(d);
    const dayOfWeek = saleDate.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Check if within festival window:
    // E.g., simulate Diwali spike around 30 to 22 days ago
    const isDiwali = d >= 22 && d <= 30;
    // Pongal / Sankranti spike around 70 to 65 days ago
    const isPongal = d >= 65 && d <= 70;

    for (const prod of products) {
      const base = baseSalesVolume[prod.name] || 40;
      let multiplier = 1.0;

      // Weekend bump
      if (isWeekend) multiplier *= 1.35;

      // Festival multiplier
      if (isDiwali) {
        if (prod.category === "Sweets") multiplier *= 3.2;
        if (prod.category === "Biscuits") multiplier *= 2.0;
      }

      if (isPongal) {
        if (prod.category === "Snacks") multiplier *= 2.6;
        if (prod.category === "Sweets") multiplier *= 1.8;
      }

      // Add random noise (+/- 15%)
      const noise = 0.85 + Math.random() * 0.3;
      const finalQuantity = Math.round(base * multiplier * noise);

      salesHistoryRecords.push({
        productId: prod._id,
        date: saleDate,
        quantitySold: Math.max(5, finalQuantity)
      });
    }
  }

  await SalesHistory.insertMany(salesHistoryRecords);
  console.log(`Inserted ${salesHistoryRecords.length} sales history records.`);

  console.log("Seeding Confirmed Orders (including big demo order)...");
  const ordersData = [
    // CRITICAL DEMO ORDER: Big Butter Cookies order due in 3 days!
    {
      orderNo: "ORD-2026-1042",
      customer: "Reliance Fresh Distribution Hub",
      items: [{ productId: prodMap["Butter Cashew Cookies"]._id, qty: 200 }],
      dueDate: daysFromNow(3),
      priority: "urgent",
      status: "confirmed"
    },
    {
      orderNo: "ORD-2026-1043",
      customer: "D-Mart Central Supermarkets",
      items: [
        { productId: prodMap["Premium Milk Rusk"]._id, qty: 150 },
        { productId: prodMap["Traditional Butter Murukku"]._id, qty: 120 }
      ],
      dueDate: daysFromNow(4),
      priority: "high",
      status: "confirmed"
    },
    {
      orderNo: "ORD-2026-1044",
      customer: "BigBasket Mega Fulfillment",
      items: [
        { productId: prodMap["Whole Wheat Sandwich Bread"]._id, qty: 180 },
        { productId: prodMap["Methi Masala Khakhra"]._id, qty: 80 }
      ],
      dueDate: daysFromNow(2),
      priority: "urgent",
      status: "in_production"
    },
    {
      orderNo: "ORD-2026-1045",
      customer: "Nilgiris Dairy & Bakery Stores",
      items: [{ productId: prodMap["Special Ghee Mysore Pak"]._id, qty: 75 }],
      dueDate: daysFromNow(5),
      priority: "normal",
      status: "confirmed"
    },
    {
      orderNo: "ORD-2026-1046",
      customer: "Zepto Quick Commerce Hub",
      items: [
        { productId: prodMap["Royal Kaju Katli"]._id, qty: 60 },
        { productId: prodMap["Cardamom Nankhatai"]._id, qty: 90 }
      ],
      dueDate: daysFromNow(3),
      priority: "high",
      status: "confirmed"
    },
    {
      orderNo: "ORD-2026-1047",
      customer: "Blinkit Regional Warehouse",
      items: [
        { productId: prodMap["Whole Wheat Sandwich Bread"]._id, qty: 120 },
        { productId: prodMap["Butter Cashew Cookies"]._id, qty: 80 }
      ],
      dueDate: daysFromNow(1),
      priority: "urgent",
      status: "confirmed"
    },
    {
      orderNo: "ORD-2026-1048",
      customer: "More Retail Hypermarkets",
      items: [
        { productId: prodMap["Instant Gulab Jamun Mix"]._id, qty: 140 },
        { productId: prodMap["Traditional Butter Murukku"]._id, qty: 90 }
      ],
      dueDate: daysFromNow(6),
      priority: "normal",
      status: "pending"
    },
    {
      orderNo: "ORD-2026-1049",
      customer: "Spencers Retail South",
      items: [{ productId: prodMap["Premium Milk Rusk"]._id, qty: 110 }],
      dueDate: daysFromNow(7),
      priority: "low",
      status: "confirmed"
    },
    {
      orderNo: "ORD-2026-1050",
      customer: "Nature's Basket Organic Stores",
      items: [{ productId: prodMap["Methi Masala Khakhra"]._id, qty: 130 }],
      dueDate: daysFromNow(8),
      priority: "normal",
      status: "confirmed"
    },
    {
      orderNo: "ORD-2026-1051",
      customer: "Metro Cash & Carry",
      items: [
        { productId: prodMap["Royal Kaju Katli"]._id, qty: 80 },
        { productId: prodMap["Special Ghee Mysore Pak"]._id, qty: 100 }
      ],
      dueDate: daysFromNow(9),
      priority: "high",
      status: "confirmed"
    }
  ];

  await Order.create(ordersData);

  console.log("Seeding Indian Festivals Calendar...");
  const festivalsData = [
    {
      name: "Diwali Grand Sweets & Snacking",
      startDate: daysAgo(30),
      endDate: daysAgo(22),
      demandMultiplier: 3.2,
      productCategories: ["Sweets", "Biscuits", "Snacks"]
    },
    {
      name: "Pongal & Makar Sankranti Harvest",
      startDate: daysAgo(70),
      endDate: daysAgo(65),
      demandMultiplier: 2.5,
      productCategories: ["Snacks", "Sweets"]
    },
    {
      name: "Holi Festival of Colors",
      startDate: daysFromNow(12),
      endDate: daysFromNow(16),
      demandMultiplier: 2.2,
      productCategories: ["Sweets", "Snacks"]
    }
  ];

  await Festival.create(festivalsData);

  console.log("Seeding Sample Waste Logs...");
  const wasteLogsData = [
    {
      itemType: "raw_material",
      itemId: rawMap["Skimmed Milk Powder"]._id,
      quantity: 15,
      reason: "expired",
      cost: 15 * 290,
      date: daysAgo(18)
    },
    {
      itemType: "raw_material",
      itemId: rawMap["Refined Sunflower Oil"]._id,
      quantity: 10,
      reason: "spillage",
      cost: 10 * 135,
      date: daysAgo(10)
    },
    {
      itemType: "product",
      itemId: prodMap["Whole Wheat Sandwich Bread"]._id,
      quantity: 25,
      reason: "process_defect",
      cost: 25 * 38,
      date: daysAgo(4)
    }
  ];

  await WasteLog.create(wasteLogsData);

  console.log("Seeding Live Demo Alerts...");
  const alertsData = [
    {
      type: "expiry",
      severity: "critical",
      message: "Batch BAT-BUTTER-001 (Pasteurized Butter, 220 kg) expires in 3 days! Allocate to production immediately to avoid ₹92,400 waste.",
      relatedId: rawMap["Pasteurized Butter"]._id,
      isRead: false
    },
    {
      type: "delivery",
      severity: "critical",
      message: "Urgent Order ORD-2026-1042 (Reliance Fresh, 200 kg Butter Cashew Cookies) due in 3 days. High priority production required.",
      relatedId: prodMap["Butter Cashew Cookies"]._id,
      isRead: false
    },
    {
      type: "shortage",
      severity: "warning",
      message: "Safety stock breach warning: Royal Kaju Katli current stock (25 kg) is below safety stock threshold (50 kg).",
      relatedId: prodMap["Royal Kaju Katli"]._id,
      isRead: false
    }
  ];

  await Alert.create(alertsData);

  console.log("Seeding Initial Audit Logs...");
  await AuditLog.create([
    {
      user: "System",
      action: "DATABASE_INITIALIZED",
      entity: "Seed Data",
      after: { status: "Success", timestamp: new Date() }
    }
  ]);

  console.log("==================================================");
  console.log("DEMO DATA SEEDED SUCCESSFULLY!");
  console.log("Demo Credentials:");
  console.log("  Admin:   admin@smartfood.com   / Admin@123");
  console.log("  Manager: manager@smartfood.com / Manager@123");
  console.log("  Staff:   staff@smartfood.com   / Staff@123");
  console.log("Demo Story:");
  console.log("  1. Butter batch BAT-BUTTER-001 (220 kg) expires in 3 days.");
  console.log("  2. Urgent order ORD-2026-1042 arrives for 200 kg Butter Cookies.");
  console.log("  3. FEFO allocates BAT-BUTTER-001 first, consuming 56 kg of butter, saving it from expiry!");
  console.log("==================================================");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});