var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/mongo.ts
async function getDb() {
  if (db) return db;
  if (connecting) return connecting;
  connecting = (async () => {
    try {
      const next = new import_mongodb.MongoClient(uri, { serverSelectionTimeoutMS: 4e3 });
      await next.connect();
      const database = next.db(dbName);
      await database.command({ ping: 1 });
      await database.collection("orders").createIndex({ id: 1 }, { unique: true });
      await database.collection("orders").createIndex({ number: 1 });
      await database.collection("orders").createIndex({ orderId: 1 }, { unique: true, sparse: true });
      await database.collection("orders").createIndex({ userId: 1 });
      await database.collection("orders").createIndex({ stripePaymentIntentId: 1 }, { unique: true, sparse: true });
      await database.collection("users").createIndex({ email: 1 }, { unique: true });
      await database.collection("users").createIndex({ id: 1 }, { unique: true });
      try {
        await database.collection("users").createIndex({ phone: 1 }, { unique: true, sparse: true });
      } catch (error) {
        console.error("[mongo] unique phone index skipped:", error instanceof Error ? error.message : error);
      }
      await database.collection("otp_challenges").createIndex({ id: 1 }, { unique: true });
      await database.collection("otp_challenges").createIndex({ email: 1, phone: 1 }, { unique: true });
      await database.collection("otp_challenges").createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
      await database.collection("products").createIndex({ id: 1 }, { unique: true });
      await database.collection("reviews").createIndex({ id: 1 }, { unique: true });
      await database.collection("reviews").createIndex({ productId: 1, createdAt: -1 });
      try {
        await database.collection("reviews").dropIndex("productId_1_userId_1");
      } catch {
      }
      try {
        await database.collection("reviews").createIndex(
          { productId: 1, orderId: 1, userId: 1 },
          {
            unique: true,
            name: "productId_1_orderId_1_userId_1",
            partialFilterExpression: { orderId: { $type: "string", $gt: "" } }
          }
        );
      } catch (error) {
        console.error("[mongo] review unique index:", error instanceof Error ? error.message : error);
      }
      await database.collection("reviews").createIndex({ status: 1 });
      await database.collection("return_requests").createIndex({ id: 1 }, { unique: true });
      client = next;
      db = database;
      return database;
    } catch (error) {
      console.error("[mongo] connection failed:", error instanceof Error ? error.message : error);
      client = null;
      db = null;
      return null;
    } finally {
      connecting = null;
    }
  })();
  return connecting;
}
async function mongoStatus() {
  const database = await getDb();
  return {
    connected: Boolean(database),
    uriHost: uri.replace(/\/\/([^@]+@)?/, "//"),
    db: dbName
  };
}
var import_mongodb, uri, dbName, client, db, connecting;
var init_mongo = __esm({
  "server/mongo.ts"() {
    import_mongodb = require("mongodb");
    uri = (process.env.MONGODB_URI || "mongodb://localhost:27017").trim();
    dbName = (process.env.MONGODB_DB || "clothes").trim() || "clothes";
    client = null;
    db = null;
    connecting = null;
  }
});

// src/data/products.ts
var PRODUCTS, INITIAL_CART;
var init_products = __esm({
  "src/data/products.ts"() {
    PRODUCTS = [
      {
        id: "architectural-blazer",
        name: "Architectural Blazer",
        subtitle: "Sharp geometric tailoring",
        price: 41999,
        category: "jackets",
        categoryLabel: "Jackets & Outerwear",
        breadcrumb: "Men / Tailoring / Blazers",
        images: [
          "https://lh3.googleusercontent.com/aida-public/AB6AXuC5O8AzwxQ2P3aX6-aCesgpon6WWCBzn2lqaUzjZgkOLUmGDVzOXHoLxp_pb8HODp2S24e1AjYYyU2m1-nLy1nLK703A5ZDkq9ObFaLhwIwlQzYwztTwX3mnoWFRo7pM12LsKdJbeeJrz5FyUEl89deKzPBtFJW6zPTP9NEgdwXSrtRIQkSTprKYA5oihNo-XPaWhII_DPntE4567PxpUkac-shggRgRtD7Tfoz8tEWebelr08nIdD3",
          "https://lh3.googleusercontent.com/aida-public/AB6AXuChlU5gX9Yo_CFYQOXzVImW1tG4IjTMWqFlrrRzJxb5-THfXkpKXgR54gOXoOWyov1oojeG82AkCeoUZeUhZkgGBc2cE2uoFYJ7T104HONy-1BXFAkzg5kd1v1X0aAX-goAvmuaT_m6ULMf17L7LsVUPYJLuA0mOOx2Lfx1IbU5nV-luOAQxEvKkm6QD42McJR6REhFQs2s36G_3GA2b4FKcacqse9qYsBcwbVN1vZaz0XlgPrb6hF8",
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDpWIwemSxVtV0zuOvRC0fu83tLtfVDdGWEUfosKn8sCpioFqSRMxBSHnpBODIcZDueaCcm9zINLCgpWvmhHh_TWXnY2TFsJoJV-HcMGVeLEImQ8MiWVEfUDAqv5EcKbRu_XX3fVQn6yiXy76UvANXio48yIKZcwP3na_0gV0GXAb7LM-FGLiyz12e9AyPX_2-crirGokkjJVnFBCYNn7ARKn3S8ku7phEM5mLCepbaghy-tghN8G9p"
        ],
        colors: [
          { name: "Onyx Black", hex: "#000000" },
          { name: "Slate Grey", hex: "#E4E4E7" }
        ],
        sizes: [
          { size: "S", available: true },
          { size: "M", available: true },
          { size: "L", available: true },
          { size: "XL", available: false }
        ],
        description: "A masterclass in modern tailoring. The Architectural Blazer is constructed with sharp, geometric precision, featuring structured shoulders and a minimalist hidden-button closure. Designed for a sleek, authoritative silhouette.",
        detailsAndCare: [
          "100% Premium Virgin Wool",
          "Cupro lining for smooth layering",
          "Hidden single-breasted closure",
          "Flapless besom pockets with interior passport slot",
          "Dry clean only"
        ],
        shippingAndReturns: "Complimentary express shipping on all orders. Returns accepted within 14 days of delivery in original condition.",
        isNew: true,
        material: "Virgin Wool"
      },
      {
        id: "structural-oversized-tee",
        name: "Structural Oversized Tee",
        subtitle: "100% Heavyweight Cotton",
        price: 6999,
        category: "t-shirts",
        categoryLabel: "T-Shirts",
        breadcrumb: "Men / Essentials / T-Shirts",
        images: [
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDx8eV5zusBiYyf-1f4FpgBDTAJEJhiXFdoRGLDC5jlfJPEgwgAgeJnBh2SIqVSX3FJAMZCXkjSesIHLdiPcaTqg2O73DbxbVTRf3BRWMaQjgATbhx79E9wNK9beAcpgnVA8i7Kd-6ZVl_rIr02cUk-TtRC_yNNmlGBBorMeMiGkxR8z8sMokedTMHPSIR7JkU64Gr9dVAy5sHb_DRAR4ncJ7ysfX0g3j2uUA0lqZ1YrnAUfARbBKYW",
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBHJ45gHZml6AzcXcvFtABLwg5qBR71tSUwBZFyca0QxgFH4PxpG1X7dI652rWepirb20TeJ4IbIeaeuomWN3q7cyVKm3hKRcO-sXKWBZQUFRbUrQ1_-O6hdN4IxK_cBel78lD-Qw1ldrWIme-UDHh2GFwdevrfj3ii5EfHDkgNu7fGsORckBzZnzh5imUPwX69pZTSDcz9LPthXKMMtpV-kKzz55x3xS9dEaH2u1mAa_BWLOO_ACMV"
        ],
        colors: [
          { name: "Onyx Black", hex: "#111111" },
          { name: "Optic White", hex: "#FFFFFF" },
          { name: "Washed Charcoal", hex: "#374151" }
        ],
        sizes: [
          { size: "S", available: true },
          { size: "M", available: true },
          { size: "L", available: true },
          { size: "XL", available: true }
        ],
        description: "Cut from a dense 280 GSM combed organic cotton with a drop-shoulder stance and reinforced ribbed collar. Engineered to maintain its boxy architecture wash after wash.",
        detailsAndCare: [
          "100% Combed Organic Cotton (280 GSM)",
          "Pre-shrunk, heavyweight drape",
          "Tonal coverstitch detailing",
          "Machine wash cold, lay flat to dry"
        ],
        shippingAndReturns: "Complimentary shipping on orders over \u20B912,499. Standard returns within 14 days.",
        isNew: false,
        material: "100% Heavyweight Cotton"
      },
      {
        id: "tailored-wool-overshirt",
        name: "Tailored Wool Overshirt",
        subtitle: "Italian Merino Blend",
        price: 17499,
        category: "jackets",
        categoryLabel: "Jackets & Outerwear",
        breadcrumb: "Men / Layering / Overshirts",
        images: [
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCiZ3B7TXQopk9agxKB-sfF5EsMmeB1G5A75DP2njc1T9aMFl_obGqLIVIFZtJmqyxExSUmbsJR-oPTw5o1f3HX9bT-HbUfCaYBPYSMRBFAhWXMR9YG_cGdNMTFMdhrfazZ3fA-eJwfCwhOqeDraPKvUTdb7ZrNRvaVaUHKLkcilzAjofSiI-z5GLUdOaVg2ugTlKD2DUCtcSuUEXAQlBJAhoUNAoMibqpOYfzKewxjdo8fKwLLZ5nL",
          "https://lh3.googleusercontent.com/aida-public/AB6AXuC39Q3rgYykuZXYXC6jx6VQw_QTOvPXty-yUo5w4sBb2JtvviTBU0dWQuYTQ98mI6kdXXQQi2l_c8K7pNXXMvGghRKkJ5ln9qKiGoGpna0nIqUpqHKMRgwxAPFeC26oL3ARrFxSs8zyXmF7gPJRqpgihcdKk1lWd0bElchmsCcE3-viwOvNAQkccfD0Fv_sV6oJB_LAZznTAqLd-PeQrn6aIfPJn0aU9fFuMEM_25QSNGtv-0jLJ-cz"
        ],
        colors: [
          { name: "Heather Grey", hex: "#D1D5DB" },
          { name: "Deep Navy", hex: "#1E293B" },
          { name: "Charcoal", hex: "#374151" }
        ],
        sizes: [
          { size: "S", available: true },
          { size: "M", available: true },
          { size: "L", available: true },
          { size: "XL", available: true }
        ],
        description: "An architectural transitional layer spun from an Italian merino wool blend. Features a structured point collar, horn buttons, and an oversized chest patch pocket.",
        detailsAndCare: [
          "75% Merino Wool, 25% Polyamide",
          "Custom dyed horn buttons",
          "Clean interior French seams",
          "Dry clean recommended"
        ],
        shippingAndReturns: "Complimentary standard shipping on all outerwear orders. Returns within 14 days.",
        isNew: true,
        material: "Italian Merino Blend"
      },
      {
        id: "pleated-wide-leg-trousers",
        name: "Pleated Wide-Leg Trousers",
        subtitle: "Relaxed Fit",
        price: 11999,
        category: "bottomwear",
        categoryLabel: "Bottomwear",
        breadcrumb: "Men / Trousers / Pleated",
        images: [
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAZ6ju28ly5f-3PyYh27dn-1vSVUcswTeTFPBMht7tWULnODs1Ae-5TFVMmt89icc-UuVHXUkRzLX20xZF7iBQnlpc5usBhBWGVKAxGYzIWvPR0U42ladokKPRlrGzVaQ_SDOtr7qkSvSfcbnIbTw1EC7R3M94s154Pdq6HiZk4fxoHdxs8j-2tseHbzjDWsD7zSpjhflaSIK_4r7lZRx5yXkH67N3Y9Uf51iILHlaLpjPRXAMmyaLn",
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCmdi0_Xi4APu_BJ4EP2CcpXYgfqIDVbhLF5RXqxQQmT1l0GdwnIcnXCkzyvUQALI7HmY01Vabw492MIB7CqZDzFhS9a4nXF98s7n382gn6PnkYw0EwOy7XBXCmMCSU3CIlZWt7yvtzhjb5Xbhtglj4dVmbFcnAx9LnIhWR-hMW5Y-l8qQr81PWvlFJgabBWKK0Gh-2JwN2j4FgCN8xZKro-zdXi044J__NH6HKIxVMl5P-UW-wyH9P"
        ],
        colors: [
          { name: "Charcoal Black", hex: "#262626" },
          { name: "Stone Grey", hex: "#9CA3AF" }
        ],
        sizes: [
          { size: "30", available: true },
          { size: "32", available: true },
          { size: "34", available: true },
          { size: "36", available: true }
        ],
        description: "Designed with dual forward pleats that cascade into an expansive, fluid drape. Tailored with a clean waistband, concealed hook-and-bar closure, and deep slash pockets.",
        detailsAndCare: [
          "60% Tencel, 40% Virgin Wool",
          "Double front pleats",
          "Curved waistband with internal curtain",
          "Dry clean or gentle cold wash"
        ],
        shippingAndReturns: "Complimentary shipping on orders over \u20B912,499. Returns within 14 days.",
        isNew: false,
        material: "Relaxed Fit"
      },
      {
        id: "crisp-poplin-button-down",
        name: "Crisp Poplin Button-Down",
        subtitle: "Hidden Placket",
        price: 8999,
        category: "shirts",
        categoryLabel: "Shirts",
        breadcrumb: "Men / Tailoring / Shirts",
        images: [
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCYL1FEylf6WDc1RnmoszR3yAvxksjezpHfHbUs4IHsS2n7Q9PHXcyASMkFBiHB4fWabaQXDw_9TUGNcIrDRi0OC_sq5bf14FcH5OVz3dMb44EMZdNBWGfIGxTdNX1XvEz7iICRUG8cWxo_1F1jg8f8F24eKYyEfbTd6tBsnXFrufeiIi2s2tk0ZOHIxbqSh37CHUr8trrdm6NNU8hJqPonBFrIxoW-3YV8VBxOhlbXnNZLdSR1zOCP",
          "https://lh3.googleusercontent.com/aida-public/AB6AXuALd9_tkemDK0nBp_Q3cUo82Vuec-rWk_8WZz4j_DwQrS4ViuUWFX5Pg2_24v_nZa9B1_8TL67xR-gguA4nRXAjI2NoUlaJRF8FLINWNy6oHx29jY91hpuApQWw7Mkrj5AWUBkOzIRDVk-FdCH6XIG11B2D1w0eCjM255igg_byF43XX0seQvhBGxHElWXITbdeq6pA-yZbbjivB3q1dfKm6LaIcnc9s-fAz7lEJuA2uuDqeIe4OhBs"
        ],
        colors: [
          { name: "Optic White", hex: "#FFFFFF" },
          { name: "Sky Blue", hex: "#93C5FD" },
          { name: "Powder Pink", hex: "#FBCFE8" }
        ],
        sizes: [
          { size: "15.0", available: true },
          { size: "15.5", available: true },
          { size: "16.0", available: true },
          { size: "16.5", available: true }
        ],
        description: "Woven from 120s two-ply Egyptian cotton for an ultra-smooth finish with natural lustre. Features a clean concealed placket and sharp spread collar.",
        detailsAndCare: [
          "100% Egyptian Poplin Cotton (120/2)",
          "Removable collar stays",
          "Concealed mother-of-pearl buttons",
          "Machine wash cold, hot iron when damp"
        ],
        shippingAndReturns: "Complimentary shipping on orders over \u20B912,499. Returns within 14 days.",
        isNew: false,
        material: "Hidden Placket"
      },
      {
        id: "poplin-structured-shirt",
        name: "Poplin Structured Shirt",
        subtitle: "Optic White Minimal Placket",
        price: 14999,
        category: "shirts",
        categoryLabel: "Shirts",
        breadcrumb: "Men / Tailoring / Shirts",
        images: [
          "https://lh3.googleusercontent.com/aida-public/AB6AXuALd9_tkemDK0nBp_Q3cUo82Vuec-rWk_8WZz4j_DwQrS4ViuUWFX5Pg2_24v_nZa9B1_8TL67xR-gguA4nRXAjI2NoUlaJRF8FLINWNy6oHx29jY91hpuApQWw7Mkrj5AWUBkOzIRDVk-FdCH6XIG11B2D1w0eCjM255igg_byF43XX0seQvhBGxHElWXITbdeq6pA-yZbbjivB3q1dfKm6LaIcnc9s-fAz7lEJuA2uuDqeIe4OhBs",
          "https://lh3.googleusercontent.com/aida-public/AB6AXuC4QFtUpvzA6D0n9qbASNNOWR1Ln0BCWm94ymGSK9a62zMHTu72OHGlVkKc9lLC1o41k-dz1XAiGTwEoagy3PXgKPFycje6pPkN5Dj6LUCfOuZpoNwWfGlQmsKGD6iiEvbqLMsAlMHvXW78p8rhdxAQz3NXYUfxqEJqomwp11m-n29OAeKXxWMYfM0Hl3YJysmiLI22uxI_HH4jCTKze2uFRnFPz6sDiQPRAcAkvfEjqMBJ4WLMZD96"
        ],
        colors: [
          { name: "Optic White", hex: "#FFFFFF" },
          { name: "Ice Blue", hex: "#E0F2FE" }
        ],
        sizes: [
          { size: "15.0", available: true },
          { size: "15.5", available: true },
          { size: "16.0", available: true },
          { size: "16.5", available: true }
        ],
        description: "A minimalist fashion classic with a structured, hidden-placket collar and reinforced cuffs. Clean geometric lines suitable for editorial styling or black-tie attire.",
        detailsAndCare: [
          "100% Giza Cotton Poplin",
          "Seamless front bib construction",
          "MOP buttons with cross-stitching",
          "Dry clean or cold machine wash"
        ],
        shippingAndReturns: "Complimentary shipping on orders over \u20B912,499.",
        isNew: false,
        material: "Poplin Cotton"
      },
      {
        id: "wide-leg-tailored-trousers",
        name: "Wide-Leg Tailored Trousers",
        subtitle: "Deep Slate Grey Drape",
        price: 24999,
        category: "bottomwear",
        categoryLabel: "Bottomwear",
        breadcrumb: "Men / Tailoring / Trousers",
        images: [
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCmdi0_Xi4APu_BJ4EP2CcpXYgfqIDVbhLF5RXqxQQmT1l0GdwnIcnXCkzyvUQALI7HmY01Vabw492MIB7CqZDzFhS9a4nXF98s7n382gn6PnkYw0EwOy7XBXCmMCSU3CIlZWt7yvtzhjb5Xbhtglj4dVmbFcnAx9LnIhWR-hMW5Y-l8qQr81PWvlFJgabBWKK0Gh-2JwN2j4FgCN8xZKro-zdXi044J__NH6HKIxVMl5P-UW-wyH9P"
        ],
        colors: [
          { name: "Deep Slate Grey", hex: "#4B5563" },
          { name: "Jet Black", hex: "#111827" }
        ],
        sizes: [
          { size: "30", available: true },
          { size: "32", available: true },
          { size: "34", available: true },
          { size: "36", available: true }
        ],
        description: "Tailored with sharp center-creases against a structured silhouette. High-key luxury drape, custom horn waist side-adjusters, and premium pocket lining.",
        detailsAndCare: [
          "100% High-Twist Tropical Wool",
          "Unfinished hems for custom tailoring",
          "Internal waist curtain with rubber grip",
          "Dry clean only"
        ],
        shippingAndReturns: "Complimentary shipping and tailoring consult included.",
        isNew: true,
        material: "Tropical Wool"
      },
      {
        id: "square-toe-chelsea-boots",
        name: "Square-Toe Chelsea Boots",
        subtitle: "Full-Grain Calfskin",
        price: 37999,
        category: "shoes",
        categoryLabel: "Footwear",
        breadcrumb: "Men / Footwear / Boots",
        images: [
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDAL-HZS39XIbeW8mQf81HOMH3IEl97m-4qMo3D6x7jj2ZY15-XJlZvukGaW5jTqoLtt6Y0hB8Q8B8ada7XXb7yXCgHdjDlZ9lnDq7sjvzyJmyuahejoCYaWUg9j36Nqe0vTByHz3XNut0NKKYfs-TeNbaockwOYShIn8OEB3Ygeq4ALN2D6C1k45xXGsw5cERo-xGih3qHsoNGHJ3XwgPvPqDicolzWKf64_tbwu7XstLGgwaJKbcO"
        ],
        colors: [
          { name: "Onyx Black", hex: "#000000" }
        ],
        sizes: [
          { size: "40 EU", available: true },
          { size: "41 EU", available: true },
          { size: "42 EU", available: true },
          { size: "43 EU", available: true },
          { size: "44 EU", available: true }
        ],
        description: "An architectural take on the Chelsea boot featuring a distinctive chiseled square toe, Goodyear welted sole, and tonal elasticated side gussets.",
        detailsAndCare: [
          "100% Italian Box Calf Leather",
          "Hand-stacked leather heel with Vibram rubber cap",
          "Goodyear welt construction (resolable)",
          "Made in Tuscany, Italy"
        ],
        shippingAndReturns: "Complimentary worldwide express shipping.",
        isNew: false,
        material: "Calfskin Leather"
      },
      {
        id: "linear-silver-cuff",
        name: "Linear Silver Cuff",
        subtitle: "925 Sterling Silver",
        price: 9999,
        category: "accessories",
        categoryLabel: "Accessories",
        breadcrumb: "Men / Accessories / Jewelry",
        images: [
          "https://lh3.googleusercontent.com/aida-public/AB6AXuB7ESDqCNnZTnBSRkPICzpXboN5kWF2AIRb3NLcCjR2uDiHlCjv88gywxRwO2P-oT6dcAjRVF8_W2XIf0DDgr38KIiQkzP2d2GnlywfIsPqeYnYYd90DvyoHzowkL5wZ24o2rSQIV9Tz1l_H0NuRsLFEZSwvOnP8HNDPVSnHFUM8QMIOkmvZ8tm3fcMq_28jmlebDuiWiWoGwcVeoy_FZqC8mAD-W0G_JUSVlQRd3OQJ29-2DdBr6Zt"
        ],
        colors: [
          { name: "Polished Silver", hex: "#E5E7EB" }
        ],
        sizes: [
          { size: "One Size", available: true }
        ],
        description: "A solid 925 sterling silver cuff bracelet hand-finished with mirror-polished exterior bevels and discreet internal laser-engraved ZAYRO hallmark.",
        detailsAndCare: [
          "Solid 925 Sterling Silver",
          "Adjustable tension fit",
          "Hypoallergenic, nickel-free",
          "Includes microfiber storage pouch"
        ],
        shippingAndReturns: "Complimentary gift packaging on all jewelry.",
        isNew: false,
        material: "925 Silver"
      },
      {
        id: "selvedge-denim-jeans",
        name: "Selvedge Raw Denim Jeans",
        subtitle: "14oz Kurabo Mills Indigo",
        price: 18499,
        category: "jeans",
        categoryLabel: "Jeans",
        breadcrumb: "Men / Denim / Selvedge",
        images: [
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDM0djLZ9XwgRk38hPT_FjSGNH_mJj9rvHKJKAiGeeBLNcKXWdWsOXZ1td62Vhh4DZsr69tTpPjZyf9vGRufBZeHnHd4Apqm1WsNTokVL1gyW0isKmxLnNP1pvmZCyTI02JkMcyiag4MCjoUhoKP2Lv8WvJzbfesgi-wQnFjB31s3td9EIzQa8SOkgU0kjRk7V-uqXVfISafxuGX1LIOX3Lpn4BPUmA6LXXt2Vkn2eUVQ-AKeMHfXvY"
        ],
        colors: [
          { name: "Raw Indigo", hex: "#1E3A8A" },
          { name: "Overdyed Black", hex: "#111827" }
        ],
        sizes: [
          { size: "30", available: true },
          { size: "32", available: true },
          { size: "34", available: true },
          { size: "36", available: true }
        ],
        description: "Woven on vintage shuttle looms using 100% long-staple cotton in Japan. Finished with copper donut buttons, hidden rivets, and classic pink selvedge ID line.",
        detailsAndCare: [
          "14oz Japanese Selvedge Denim",
          "Button fly with custom branded hardware",
          "Chain-stitched waistband and hem",
          "Wash inside out in cold water after 6 months wear"
        ],
        shippingAndReturns: "Complimentary shipping on all denim.",
        isNew: false,
        material: "Raw Selvedge Denim"
      },
      {
        id: "minimalist-urban-cargos",
        name: "Minimalist Urban Cargos",
        subtitle: "Water-repellent Stretch Twill",
        price: 15999,
        category: "cargos",
        categoryLabel: "Cargos",
        breadcrumb: "Men / Utility / Cargos",
        images: [
          "https://lh3.googleusercontent.com/aida-public/AB6AXuC2HXuPXpesZ6_qB5XnwfkBmpRnYuFb8nHFrS-dJtO6zhvox75ror-SWKSnyps_7GIpZSG1z6XQxcYh7fWO7gHYQAKLsJlSimZRAa2LzlZif_fvFj3YXDFatJplqaC80CqskY-W0057Hk-Ap-J9LN9I7EdA0p_Diqsz6M_JyREgwzfr7Y1irJqa8DAxBT0V2ZXORwhP1L3pNTBliSGe36QrWr9_LwpTn5X3Q3DaHebBhpW2DMrcXsMA"
        ],
        colors: [
          { name: "Concrete Grey", hex: "#6B7280" },
          { name: "Deep Olive", hex: "#374151" },
          { name: "Black", hex: "#0F172A" }
        ],
        sizes: [
          { size: "S", available: true },
          { size: "M", available: true },
          { size: "L", available: true },
          { size: "XL", available: true }
        ],
        description: "Clean utilitarian trousers engineered with flush, hidden magnetic snap cargo pockets. Cut in a subtle articulated taper for fluid mobility.",
        detailsAndCare: [
          "92% Technical Polyamide, 8% Elastane",
          "DWR water-repellent coating",
          "Concealed zippered security pockets",
          "Machine wash cold, quick dry"
        ],
        shippingAndReturns: "Complimentary express shipping on orders over \u20B912,499.",
        isNew: true,
        material: "Stretch Twill"
      }
    ];
    INITIAL_CART = [
      {
        id: "cart-1",
        productId: "architectural-blazer",
        product: PRODUCTS[0],
        selectedColor: "Onyx Black",
        selectedSize: "40R",
        quantity: 1,
        price: 41999
      },
      {
        id: "cart-2",
        productId: "poplin-structured-shirt",
        product: PRODUCTS[5],
        selectedColor: "Optic White",
        selectedSize: "15.5",
        quantity: 1,
        price: 14999
      }
    ];
  }
});

// server/orderId.ts
function generateOrderId(date = /* @__PURE__ */ new Date()) {
  const ymd = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, "X");
  return `ZAYRO-${ymd}-${rand}`;
}
var init_orderId = __esm({
  "server/orderId.ts"() {
  }
});

// server/stripeHandler.ts
function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
function cleanKey(value) {
  return value.trim().replace(/^['"]|['"]$/g, "");
}
function isSecretKey(value) {
  return /^(sk_test_|sk_live_|rk_test_|rk_live_)/.test(value);
}
function isPublishableKey(value) {
  return /^(pk_test_|pk_live_)/.test(value);
}
function publicStripeError(error) {
  const message = error instanceof Error ? error.message : "Stripe error";
  if (/invalid api key/i.test(message) || /no api key/i.test(message)) {
    return "Stripe keys are invalid. In Stripe \u2192 Developers \u2192 API keys, click Reveal on the Secret key and copy the full sk_test_ value. Copy the Publishable key that starts with pk_test_. Put both in .env and restart the server.";
  }
  return message.replace(/sk_(test|live)_[A-Za-z0-9]+/g, "sk_***").replace(/pk_(test|live)_[A-Za-z0-9]+/g, "pk_***");
}
function stripeClient() {
  const secret = cleanKey(process.env.STRIPE_SECRET_KEY || "");
  if (!secret || !isSecretKey(secret)) return null;
  return new import_stripe.default(secret, { apiVersion: "2026-08-26.dahlia" });
}
function amountToPaise(rupees) {
  return Math.round((Number(rupees) || 0) * 100);
}
async function verifyPaidIntent(paymentIntentId, expectedRupees) {
  const stripe = stripeClient();
  if (!stripe) throw new Error("Stripe is not configured.");
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (intent.status !== "succeeded") throw new Error("Stripe payment is not complete.");
  const expected = amountToPaise(expectedRupees);
  if (intent.amount !== expected || intent.currency !== "inr") {
    throw new Error("Paid amount does not match this order.");
  }
  return intent;
}
async function handleStripeApi(req, res) {
  try {
    const url = (req.url || "").split("?")[0];
    const method = (req.method || "GET").toUpperCase();
    const publishable = cleanKey(process.env.STRIPE_PUBLISHABLE_KEY || "");
    const secret = cleanKey(process.env.STRIPE_SECRET_KEY || "");
    if (url === "/api/stripe/config" && method === "GET") {
      json(res, 200, {
        publishableKey: isPublishableKey(publishable) ? publishable : "",
        configured: Boolean(stripeClient() && isPublishableKey(publishable))
      });
      return;
    }
    if (url === "/api/stripe/create-payment-intent" && method === "POST") {
      const stripe = stripeClient();
      if (secret && !isSecretKey(secret)) {
        json(res, 400, {
          error: "STRIPE_SECRET_KEY must start with sk_test_. The mk_\u2026 value is a dashboard ID. Click Reveal and copy the full secret key."
        });
        return;
      }
      if (publishable && !isPublishableKey(publishable)) {
        json(res, 400, {
          error: "STRIPE_PUBLISHABLE_KEY must start with pk_test_. Copy the Publishable key, not the mk_\u2026 ID."
        });
        return;
      }
      if (!stripe || !isPublishableKey(publishable)) {
        json(res, 503, {
          error: "Stripe is not configured. Add STRIPE_SECRET_KEY (sk_test_\u2026) and STRIPE_PUBLISHABLE_KEY (pk_test_\u2026) to .env and restart npm run dev."
        });
        return;
      }
      const payload = JSON.parse(await readBody(req) || "{}");
      const amount = amountToPaise(Number(payload.amount) || 0);
      if (amount < 50) {
        json(res, 400, { error: "Order total is too small for card payment." });
        return;
      }
      const intent = await stripe.paymentIntents.create({
        amount,
        currency: "inr",
        automatic_payment_methods: { enabled: true },
        metadata: {
          customerEmail: typeof payload.email === "string" ? payload.email : ""
        }
      });
      json(res, 200, { clientSecret: intent.client_secret, paymentIntentId: intent.id });
      return;
    }
    json(res, 404, { error: "Not found" });
  } catch (error) {
    json(res, 500, { error: publicStripeError(error) });
  }
}
var import_stripe;
var init_stripeHandler = __esm({
  "server/stripeHandler.ts"() {
    import_stripe = __toESM(require("stripe"), 1);
  }
});

// server/shopOrders.ts
var shopOrders_exports = {};
__export(shopOrders_exports, {
  addressLine: () => addressLine,
  createShopOrder: () => createShopOrder,
  getOrderByOrderId: () => getOrderByOrderId,
  listOrdersForUser: () => listOrdersForUser,
  normalizeDeliveryLocation: () => normalizeDeliveryLocation,
  seedProductsCollection: () => seedProductsCollection
});
function normalizeDeliveryLocation(raw, fallbackAddress) {
  if (!raw || typeof raw !== "object") return void 0;
  const row = raw;
  const latitude = Number(row.latitude);
  const longitude = Number(row.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return void 0;
  const address = typeof row.address === "string" && row.address.trim() || fallbackAddress.trim();
  return { latitude, longitude, address };
}
function addressLine(address) {
  return [address.address, address.city, address.state, address.postalCode, address.country].filter(Boolean).join(", ");
}
async function seedProductsCollection() {
  const db2 = await getDb();
  if (!db2) return;
  const collection = db2.collection("products");
  if (await collection.countDocuments() > 0) return;
  const docs = PRODUCTS.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    category: product.category,
    images: product.images,
    colors: product.colors,
    sizes: product.sizes,
    description: product.description,
    active: true
  }));
  if (docs.length) await collection.insertMany(docs);
}
async function createShopOrder(input) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database is unavailable.");
  if (!input.customerName.trim() || !input.customerEmail.trim() || !input.customerPhone.trim()) {
    throw new Error("Customer name, email, and phone are required.");
  }
  if (!input.shippingAddress.address.trim() || !input.shippingAddress.city.trim()) {
    throw new Error("Complete shipping address is required.");
  }
  if (!input.items.length) throw new Error("Order must include at least one product.");
  let stripePaymentIntentId = input.stripePaymentIntentId || "";
  let paymentMethod = input.paymentMethod || "Cash on Delivery";
  let paymentStatus = input.paymentStatus || "unpaid";
  if (paymentMethod === "stripe" || stripePaymentIntentId) {
    if (!stripePaymentIntentId) throw new Error("Stripe payment is required.");
    await verifyPaidIntent(stripePaymentIntentId, input.total);
    const existingPaid = await db2.collection("orders").findOne({ stripePaymentIntentId });
    if (existingPaid) throw new Error("This payment was already used.");
    paymentMethod = "stripe";
    paymentStatus = "paid";
  } else {
    paymentMethod = "cod";
    paymentStatus = "unpaid";
  }
  const collection = db2.collection("orders");
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  let lastError;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const orderId = generateOrderId();
    const order = {
      id: orderId,
      number: orderId,
      orderId,
      userId: input.userId || null,
      createdAt,
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
      customerPhoneE164: "",
      customerEmail: input.customerEmail.trim().toLowerCase(),
      deliveryAddress: addressLine(input.shippingAddress),
      shipping: input.shippingAddress,
      items: input.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      products: input.items,
      subtotal: input.subtotal,
      total: input.total,
      deliveryCharge: input.deliveryCharge,
      handlingCharge: input.handlingCharge || 0,
      paymentMethod,
      paymentStatus,
      stripePaymentIntentId: stripePaymentIntentId || void 0,
      orderStatus: "Order Confirmed",
      status: "Order Confirmed",
      trackingId: "",
      deliveryPartner: "",
      expectedDeliveryDate: "",
      statusHistory: [{ status: "Order Confirmed", timestamp: createdAt }],
      confirmationCallSent: false,
      confirmationCallStatus: "pending",
      whatsappMessageSent: false,
      whatsappMessageStatus: "pending",
      emailSent: false,
      emailStatus: "pending",
      ...input.deliveryLocation ? {
        deliveryLocation: {
          latitude: input.deliveryLocation.latitude,
          longitude: input.deliveryLocation.longitude,
          address: input.deliveryLocation.address || addressLine(input.shippingAddress)
        }
      } : {}
    };
    try {
      await collection.insertOne({ ...order });
      return order;
    } catch (error) {
      lastError = error;
      const code = error.code;
      if (code === 11e3) continue;
      throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Could not generate a unique order ID.");
}
async function listOrdersForUser(userId) {
  const db2 = await getDb();
  if (!db2) return [];
  const docs = await db2.collection("orders").find({ userId }).sort({ createdAt: -1 }).toArray();
  return docs.map((doc) => withoutMongoId(doc));
}
async function getOrderByOrderId(orderId, userId, email) {
  const order = await findStoredOrder(orderId) || await findStoredOrder(orderId.replace(/^ZAYRO-/, ""));
  if (!order) return null;
  if (order.userId) {
    if (!userId || order.userId !== userId) return null;
    return order;
  }
  if (email && order.customerEmail.toLowerCase() === email.toLowerCase()) return order;
  return null;
}
var init_shopOrders = __esm({
  "server/shopOrders.ts"() {
    init_products();
    init_orderId();
    init_mongo();
    init_orderStore();
    init_mongoCollections();
    init_stripeHandler();
  }
});

// server/mongoCollections.ts
function withoutMongoId(doc) {
  if (!doc) return null;
  const copy = { ...doc };
  delete copy._id;
  return copy;
}
async function readJsonFile(filePath) {
  try {
    const raw = await import_promises.default.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
async function migrateJsonIntoMongo() {
  const database = await getDb();
  if (!database) return;
  const orders = database.collection("orders");
  if (await orders.countDocuments() === 0) {
    const fromFile = await readJsonFile(import_path.default.resolve(process.cwd(), "data", "orders.json"));
    if (fromFile.length) {
      await orders.insertMany(fromFile);
    }
  }
  const returns = database.collection("return_requests");
  if (await returns.countDocuments() === 0) {
    const fromFile = await readJsonFile(
      import_path.default.resolve(process.cwd(), "data", "return-requests.json")
    );
    if (fromFile.length) {
      await returns.insertMany(fromFile);
    }
  }
  await Promise.resolve().then(() => (init_shopOrders(), shopOrders_exports)).then((mod) => mod.seedProductsCollection()).catch(() => void 0);
}
async function ordersCollection() {
  const database = await getDb();
  return database?.collection("orders") || null;
}
async function returnRequestsCollection() {
  const database = await getDb();
  return database?.collection("return_requests") || null;
}
var import_promises, import_path;
var init_mongoCollections = __esm({
  "server/mongoCollections.ts"() {
    import_promises = __toESM(require("fs/promises"), 1);
    import_path = __toESM(require("path"), 1);
    init_mongo();
  }
});

// server/orderStore.ts
async function ensureMigrated() {
  if (migrated) return;
  await migrateJsonIntoMongo();
  migrated = true;
}
async function ensureFileStore() {
  await import_promises2.default.mkdir(import_path2.default.dirname(STORE_PATH), { recursive: true });
  try {
    await import_promises2.default.access(STORE_PATH);
  } catch {
    await import_promises2.default.writeFile(STORE_PATH, "[]", "utf8");
  }
}
async function listFromFile() {
  await ensureFileStore();
  const raw = await import_promises2.default.readFile(STORE_PATH, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
async function saveToFile(orders) {
  await ensureFileStore();
  await import_promises2.default.writeFile(STORE_PATH, JSON.stringify(orders, null, 2), "utf8");
}
async function listStoredOrders() {
  await ensureMigrated();
  const collection = await ordersCollection();
  if (collection) {
    const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return docs.map((doc) => withoutMongoId(doc));
  }
  return listFromFile();
}
async function upsertStoredOrder(next) {
  await ensureMigrated();
  const collection = await ordersCollection();
  if (collection) {
    await collection.updateOne({ $or: [{ id: next.id }, { number: next.number }] }, { $set: next }, { upsert: true });
    return next;
  }
  const list = await listFromFile();
  const index = list.findIndex((item) => item.id === next.id || item.number === next.number);
  if (index >= 0) list[index] = next;
  else list.unshift(next);
  await saveToFile(list);
  return next;
}
async function findStoredOrder(idOrNumber) {
  await ensureMigrated();
  const collection = await ordersCollection();
  if (collection) {
    const doc = await collection.findOne({
      $or: [{ id: idOrNumber }, { number: idOrNumber }, { orderId: idOrNumber }]
    });
    return withoutMongoId(doc);
  }
  const list = await listFromFile();
  return list.find((item) => item.id === idOrNumber || item.number === idOrNumber || item.orderId === idOrNumber) || null;
}
async function updateStoredOrder(id, patch) {
  await ensureMigrated();
  const collection = await ordersCollection();
  if (collection) {
    const current = await collection.findOne({ $or: [{ id }, { number: id }, { orderId: id }] });
    if (!current) return null;
    const next = { ...withoutMongoId(current), ...patch };
    await collection.updateOne({ id: current.id }, { $set: next });
    return next;
  }
  const list = await listFromFile();
  const index = list.findIndex((item) => item.id === id || item.number === id || item.orderId === id);
  if (index < 0) return null;
  list[index] = { ...list[index], ...patch };
  await saveToFile(list);
  return list[index];
}
async function updateOrderTracking(id, patch) {
  const current = await findStoredOrder(id);
  if (!current) return null;
  const next = { ...current };
  if (typeof patch.trackingId === "string") next.trackingId = patch.trackingId.trim();
  if (typeof patch.deliveryPartner === "string") next.deliveryPartner = patch.deliveryPartner.trim();
  if (typeof patch.expectedDeliveryDate === "string") next.expectedDeliveryDate = patch.expectedDeliveryDate.trim();
  if (patch.status) {
    const status = patch.status;
    next.status = status;
    next.orderStatus = status;
    const history = [...current.statusHistory || []];
    const last = history[history.length - 1];
    if (!last || last.status !== status) {
      history.push({ status, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    }
    next.statusHistory = history;
  }
  return updateStoredOrder(current.id, {
    status: next.status,
    orderStatus: next.orderStatus,
    trackingId: next.trackingId,
    deliveryPartner: next.deliveryPartner,
    expectedDeliveryDate: next.expectedDeliveryDate,
    statusHistory: next.statusHistory
  });
}
async function listOrdersForDeliveryPerson(deliveryPersonId) {
  const list = await listStoredOrders();
  return list.filter((order) => order.deliveryPersonId === deliveryPersonId);
}
async function deliveryPersonStats(deliveryPersonId) {
  const assignedOrders = await listOrdersForDeliveryPerson(deliveryPersonId);
  const delivered = assignedOrders.filter((order) => {
    const status = (order.status || order.orderStatus || "").trim().toLowerCase();
    return status === "delivered";
  }).length;
  return {
    assigned: assignedOrders.length,
    delivered,
    pending: assignedOrders.length - delivered
  };
}
async function assignOrderDeliveryPerson(orderId, deliveryPersonId) {
  const current = await findStoredOrder(orderId);
  if (!current) return null;
  return updateStoredOrder(current.id, {
    deliveryPersonId,
    assignedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
var import_promises2, import_path2, STORE_PATH, migrated;
var init_orderStore = __esm({
  "server/orderStore.ts"() {
    import_promises2 = __toESM(require("fs/promises"), 1);
    import_path2 = __toESM(require("path"), 1);
    init_mongoCollections();
    STORE_PATH = import_path2.default.resolve(process.cwd(), "data", "orders.json");
    migrated = false;
  }
});

// scripts/vercel-api-entry.ts
var vercel_api_entry_exports = {};
__export(vercel_api_entry_exports, {
  default: () => handler
});
module.exports = __toCommonJS(vercel_api_entry_exports);

// server/jwt.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);

// server/roles.ts
function isSuperAdminRole(role) {
  return role === "admin" || role === "SUPER_ADMIN";
}

// server/jwt.ts
var SECRET = (process.env.JWT_SECRET || "zayro-dev-jwt-secret-change-me").trim();
function signAuthToken(payload) {
  return import_jsonwebtoken.default.sign(payload, SECRET, { expiresIn: "30d" });
}
function verifyAuthToken(token) {
  try {
    const decoded = import_jsonwebtoken.default.verify(token, SECRET);
    if (!decoded?.userId || !decoded?.email) return null;
    return { userId: decoded.userId, email: decoded.email, role: decoded.role };
  } catch {
    return null;
  }
}
function verifyAdminToken(token) {
  const payload = verifyAuthToken(token);
  if (!payload || !isSuperAdminRole(payload.role)) return null;
  return payload;
}
function bearerToken(header) {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) return "";
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

// server/adminOrderApi.ts
init_orderStore();

// src/lib/orderTracking.ts
var TRACKING_STEPS = [
  "Order Confirmed",
  "Order Processing",
  "Order Packed",
  "Shipped",
  "In Transit",
  "Out for Delivery",
  "Delivered"
];
var TRACKING_STATUSES = [...TRACKING_STEPS, "Cancelled"];
function isTrackingStatus(value) {
  return TRACKING_STATUSES.includes(value);
}

// server/reviewStore.ts
init_products();
var import_crypto = require("crypto");
var import_promises3 = __toESM(require("fs/promises"), 1);
var import_path3 = __toESM(require("path"), 1);
init_mongo();
init_mongoCollections();
init_orderStore();

// server/userStore.ts
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
init_mongo();
init_mongoCollections();

// server/indianPhone.ts
function normalizeIndianMobile(input) {
  const digits = input.replace(/\D/g, "");
  let ten = digits;
  if (digits.length === 12 && digits.startsWith("91")) ten = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) ten = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(ten)) return null;
  return `+91${ten}`;
}
function maskIndianMobile(e164) {
  const ten = e164.replace(/^\+91/, "");
  if (ten.length !== 10) return e164;
  return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
}
function indianMobileTenDigits(e164) {
  return e164.replace(/^\+91/, "");
}

// server/userStore.ts
function publicUser(user) {
  const { passwordHash: _pw, ...rest } = user;
  return rest;
}
async function users() {
  const db2 = await getDb();
  return db2?.collection("users") || null;
}
async function findUserByEmail(email) {
  const collection = await users();
  if (!collection) return null;
  const doc = await collection.findOne({ email: email.trim().toLowerCase() });
  return withoutMongoId(doc);
}
async function findUserById(id) {
  const collection = await users();
  if (!collection) return null;
  const doc = await collection.findOne({ id });
  return withoutMongoId(doc);
}
async function findUserByPhone(phone) {
  const collection = await users();
  if (!collection) return null;
  const e164 = normalizeIndianMobile(phone);
  if (!e164) return null;
  const ten = indianMobileTenDigits(e164);
  const doc = await collection.findOne({
    $or: [{ phone: e164 }, { phone: ten }, { phone: `91${ten}` }, { phone: `+91 ${ten}` }]
  });
  return withoutMongoId(doc);
}
async function createUser(input) {
  const collection = await users();
  if (!collection) return { error: "Database is unavailable.", status: 503 };
  const email = input.email.trim().toLowerCase();
  if (!input.fullName.trim() || input.fullName.trim().length < 2) {
    return { error: "Enter your full name.", status: 400 };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address.", status: 400 };
  }
  if (input.phone.trim().length < 8) {
    return { error: "Enter a valid phone number.", status: 400 };
  }
  if (input.password.length < 8) {
    return { error: "Password must be at least 8 characters.", status: 400 };
  }
  const phone = normalizeIndianMobile(input.phone) || input.phone.trim();
  const existing = await collection.findOne({ email });
  if (existing) return { error: "An account already exists for this email.", status: 409 };
  if (normalizeIndianMobile(input.phone)) {
    const byPhone = await findUserByPhone(phone);
    if (byPhone) return { error: "An account already exists for this phone number.", status: 409 };
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const user = {
    id: `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    fullName: input.fullName.trim(),
    email,
    phone,
    phoneVerified: false,
    passwordHash: await import_bcryptjs.default.hash(input.password, 10),
    shippingAddress: input.shippingAddress?.trim() || "",
    city: input.city?.trim() || "",
    state: input.state?.trim() || "",
    country: input.country?.trim() || "",
    postalCode: input.postalCode?.trim() || "",
    createdAt: now,
    updatedAt: now
  };
  try {
    await collection.insertOne({ ...user });
  } catch (error) {
    const code = error.code;
    if (code === 11e3) return { error: "An account already exists for this email or phone number.", status: 409 };
    throw error;
  }
  return { user: publicUser(user) };
}
async function createUserFromVerifiedSignup(input) {
  const collection = await users();
  if (!collection) return { error: "Database is unavailable.", status: 503 };
  const email = input.email.trim().toLowerCase();
  const phone = normalizeIndianMobile(input.phone);
  if (!phone) return { error: "Enter a valid 10-digit Indian mobile number.", status: 400 };
  const existingEmail = await collection.findOne({ email });
  if (existingEmail) return { error: "An account already exists for this email.", status: 409 };
  const existingPhone = await findUserByPhone(phone);
  if (existingPhone) return { error: "An account already exists for this phone number.", status: 409 };
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const user = {
    id: `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    fullName: input.fullName.trim(),
    email,
    phone,
    phoneVerified: true,
    passwordHash: input.passwordHash,
    shippingAddress: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    createdAt: now,
    updatedAt: now
  };
  try {
    await collection.insertOne({ ...user });
  } catch (error) {
    const code = error.code;
    if (code === 11e3) return { error: "An account already exists for this email or phone number.", status: 409 };
    throw error;
  }
  return { user: publicUser(user) };
}
async function verifyUser(email, password) {
  const collection = await users();
  if (!collection) return { error: "Database is unavailable.", status: 503 };
  const user = await findUserByEmail(email);
  if (!user) return { error: "No account found for this email.", status: 401 };
  const ok = await import_bcryptjs.default.compare(password, user.passwordHash);
  if (!ok) return { error: "Password does not match.", status: 401 };
  return { user: publicUser(user) };
}
async function updateUserProfile(userId, patch) {
  const collection = await users();
  if (!collection) return null;
  const current = await findUserById(userId);
  if (!current) return null;
  const next = {
    ...current,
    fullName: patch.fullName?.trim() || current.fullName,
    phone: patch.phone?.trim() || current.phone,
    shippingAddress: patch.shippingAddress ?? current.shippingAddress,
    city: patch.city ?? current.city,
    state: patch.state ?? current.state,
    country: patch.country ?? current.country,
    postalCode: patch.postalCode ?? current.postalCode,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await collection.updateOne({ id: userId }, { $set: next });
  return publicUser(next);
}
function isDeliveryPersonActive(status) {
  return (status || "Active").toUpperCase() === "ACTIVE";
}
function asDeliveryStatus(status) {
  return isDeliveryPersonActive(status) ? "Active" : "Inactive";
}
async function listDeliveryPersons() {
  const collection = await users();
  if (!collection) return [];
  const docs = await collection.find({ role: "DELIVERY_PERSON" }).sort({ fullName: 1 }).toArray();
  return docs.map((doc) => withoutMongoId(doc));
}
async function createDeliveryPerson(input) {
  const created = await createUser({
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    password: input.password
  });
  if ("error" in created) return created;
  const collection = await users();
  if (!collection) return { error: "Database is unavailable.", status: 503 };
  const status = input.status === "Inactive" ? "Inactive" : "Active";
  await collection.updateOne(
    { id: created.user.id },
    { $set: { role: "DELIVERY_PERSON", status, updatedAt: (/* @__PURE__ */ new Date()).toISOString() } }
  );
  const next = await findUserById(created.user.id);
  if (!next) return { error: "Could not create delivery person.", status: 500 };
  return { user: publicUser(next) };
}
async function updateDeliveryPerson(id, patch) {
  const collection = await users();
  if (!collection) return { error: "Database is unavailable.", status: 503 };
  const current = await findUserById(id);
  if (!current || current.role !== "DELIVERY_PERSON") return { error: "Delivery person not found.", status: 404 };
  const email = patch.email?.trim().toLowerCase();
  if (email && email !== current.email) {
    const taken = await findUserByEmail(email);
    if (taken) return { error: "An account already exists for this email.", status: 409 };
  }
  const next = {
    ...current,
    fullName: patch.fullName?.trim() || current.fullName,
    phone: patch.phone?.trim() || current.phone,
    email: email || current.email,
    status: patch.status || asDeliveryStatus(current.status),
    role: "DELIVERY_PERSON",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    passwordHash: patch.password ? await import_bcryptjs.default.hash(patch.password, 10) : current.passwordHash
  };
  await collection.updateOne({ id }, { $set: next });
  return publicUser(next);
}
async function deleteDeliveryPerson(id) {
  const collection = await users();
  if (!collection) return { error: "Database is unavailable.", status: 503 };
  const current = await findUserById(id);
  if (!current || current.role !== "DELIVERY_PERSON") return { error: "Delivery person not found.", status: 404 };
  await collection.deleteOne({ id });
  return { ok: true };
}

// server/reviewStore.ts
var MEDIA_DIR = import_path3.default.resolve(process.cwd(), "data", "review-media");
var MAX_IMAGES = 4;
var MAX_VIDEOS = 1;
var MAX_IMAGE_BYTES = 15e5;
var MAX_VIDEO_BYTES = 6e6;
function emptyBreakdown() {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}
async function reviews() {
  const db2 = await getDb();
  return db2?.collection("reviews") || null;
}
function publicReview(doc, voterId) {
  const { helpfulVoterIds, ...rest } = doc;
  return {
    ...rest,
    helpfulCount: doc.helpfulCount || 0,
    helpfulByMe: Boolean(voterId && (helpfulVoterIds || []).includes(voterId))
  };
}
function isApproved(doc) {
  return !doc.status || doc.status === "approved";
}
function orderHasProduct(order, productId) {
  if ((order.products || []).some((item) => item.productId === productId)) return true;
  if ((order.items || []).some((item) => item.productId === productId)) return true;
  const catalog = PRODUCTS.find((item) => item.id === productId);
  if (!catalog) return false;
  const name = catalog.name.trim().toLowerCase();
  if ((order.products || []).some((item) => (item.name || "").trim().toLowerCase() === name)) return true;
  return (order.items || []).some((item) => (item.name || "").trim().toLowerCase() === name);
}
function isOrderConfirmed(order) {
  const status = `${order.orderStatus || ""} ${order.status || ""}`.toLowerCase();
  if (status.includes("cancel")) return false;
  return true;
}
function customerOwnsOrder(order, userId, email) {
  if (userId && order.userId && order.userId === userId) return true;
  if (email && order.customerEmail && order.customerEmail.toLowerCase() === email.toLowerCase()) return true;
  return false;
}
function uniqueOrderProducts(order) {
  const seen = /* @__PURE__ */ new Set();
  const rows = [];
  const source = order.products && order.products.length ? order.products : (order.items || []).map((item) => ({ productId: item.productId, name: item.name, image: "" }));
  for (const item of source) {
    const productId = (item.productId || "").trim();
    if (!productId || seen.has(productId)) continue;
    seen.add(productId);
    rows.push({
      productId,
      name: (item.name || "Purchased item").trim(),
      image: ("image" in item && typeof item.image === "string" ? item.image : "") || ""
    });
  }
  return rows;
}
function productMetaFromOrder(order, productId) {
  const fromProducts = (order.products || []).find((item) => item.productId === productId);
  const fromItems = (order.items || []).find((item) => item.productId === productId);
  const catalog = PRODUCTS.find((item) => item.id === productId);
  return {
    productName: (fromProducts?.name || fromItems?.name || catalog?.name || "").trim(),
    productImage: (fromProducts?.image || catalog?.images?.[0] || "").trim()
  };
}
async function savePurchaseRating(input) {
  const productId = input.productId.trim();
  const orderId = input.orderId.trim();
  if (!productId || !orderId) return { error: "Product and order are required.", status: 400 };
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { error: "Rating must be between 1 and 5.", status: 400 };
  }
  const order = await findStoredOrder(orderId);
  const catalog = PRODUCTS.find((item) => item.id === productId);
  const productInOrder = order ? orderHasProduct(order, productId) : Boolean(catalog);
  if (!productInOrder) {
    return { error: "This rating must match a confirmed order.", status: 403 };
  }
  if (order && !isOrderConfirmed(order)) {
    return { error: "You can rate products after the order is confirmed.", status: 403 };
  }
  const savedOrderId = order?.orderId || order?.id || orderId;
  const collection = await reviews();
  if (!collection) return { error: "Database is unavailable.", status: 503 };
  const existing = await collection.findOne({ productId, orderId: savedOrderId });
  if (existing) {
    await collection.updateOne(
      { id: existing.id },
      {
        $set: {
          rating: input.rating,
          productName: existing.productName || catalog?.name || "",
          productImage: existing.productImage || catalog?.images?.[0] || ""
        }
      }
    );
    const updated = await collection.findOne({ id: existing.id });
    if (updated?.status === "approved" || !updated?.status) {
      await writeProductStats(await summarizeProduct(productId));
    }
    return { review: withoutMongoId(updated) };
  }
  let userId = (order?.userId || "").trim() || input.sessionUserId || `order:${savedOrderId}`;
  let userName = (order?.customerName || "").trim() || "Customer";
  if (input.sessionUserId) {
    const author = await resolveReviewAuthor(input.sessionUserId);
    if (!("error" in author)) {
      userId = author.userId;
      userName = author.userName.trim() || userName;
    }
  }
  const meta = order ? productMetaFromOrder(order, productId) : { productName: catalog?.name || "", productImage: catalog?.images?.[0] || "" };
  return createReview({
    productId,
    productName: meta.productName,
    productImage: meta.productImage,
    userId,
    userName,
    rating: input.rating,
    title: "",
    reviewText: "",
    orderId: savedOrderId,
    isVerifiedPurchase: Boolean(order),
    media: []
  });
}
async function findEligiblePurchase(input) {
  const collection = await reviews();
  const productId = input.productId.trim();
  const userId = input.userId?.trim() || "";
  const already = async (orderId) => {
    if (!collection || !userId || !orderId) return false;
    return Boolean(await collection.findOne({ productId, userId, orderId }));
  };
  if (input.orderId) {
    const order = await findStoredOrder(input.orderId);
    if (order && orderHasProduct(order, productId) && customerOwnsOrder(order, input.userId, input.email)) {
      const orderId = order.orderId || order.id;
      return { purchased: true, orderId, alreadyReviewed: await already(orderId) };
    }
    return { purchased: false, orderId: "", alreadyReviewed: false };
  }
  const list = await listStoredOrders();
  const matches = list.filter((order) => {
    if (!orderHasProduct(order, productId)) return false;
    return customerOwnsOrder(order, input.userId, input.email);
  });
  for (const order of matches) {
    const orderId = order.orderId || order.id;
    if (!await already(orderId)) return { purchased: true, orderId, alreadyReviewed: false };
  }
  if (matches.length) {
    const orderId = matches[0].orderId || matches[0].id;
    return { purchased: true, orderId, alreadyReviewed: true };
  }
  return { purchased: false, orderId: "", alreadyReviewed: false };
}
async function listPendingReviewsForOrder(input) {
  const order = await findStoredOrder(input.orderId);
  if (!order || !customerOwnsOrder(order, input.userId, input.email)) {
    return { error: "Order not found.", status: 404 };
  }
  const orderId = order.orderId || order.id;
  const paymentConfirmed = order.paymentStatus === "paid";
  if (!isOrderConfirmed(order)) {
    return { orderId, paymentConfirmed, items: [] };
  }
  const collection = await reviews();
  const items = [];
  for (const product of uniqueOrderProducts(order)) {
    const existing = collection && input.userId ? await collection.findOne({ productId: product.productId, userId: input.userId, orderId }) : null;
    if (!existing) items.push(product);
  }
  return { orderId, paymentConfirmed, items };
}
async function summarizeProduct(productId) {
  const collection = await reviews();
  const breakdown = emptyBreakdown();
  if (!collection) return { productId, averageRating: 0, totalReviews: 0, breakdown };
  const docs = (await collection.find({ productId }).toArray()).filter(isApproved);
  docs.forEach((doc) => {
    const rating = doc.rating;
    if (breakdown[rating] !== void 0) breakdown[rating] += 1;
  });
  const totalReviews = docs.length;
  const averageRating = totalReviews === 0 ? 0 : Math.round(docs.reduce((sum, doc) => sum + doc.rating, 0) / totalReviews * 10) / 10;
  return { productId, averageRating, totalReviews, breakdown };
}
async function writeProductStats(summary) {
  const db2 = await getDb();
  if (!db2) return;
  await db2.collection("products").updateOne(
    { id: summary.productId },
    { $set: { averageRating: summary.averageRating, totalReviews: summary.totalReviews } }
  );
}
async function listReviewSummaries() {
  const collection = await reviews();
  if (!collection) return [];
  const productIds = await collection.distinct("productId");
  return Promise.all(productIds.map((productId) => summarizeProduct(String(productId))));
}
async function listReviewsForProduct(productId, page = 1, limit = 5, voterId) {
  const collection = await reviews();
  const summary = await summarizeProduct(productId);
  if (!collection) return { reviews: [], total: 0, page, limit, summary };
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(20, Math.max(1, limit));
  const docs = await collection.find({ productId }).sort({ createdAt: -1 }).toArray();
  const approved = docs.map((doc) => withoutMongoId(doc)).filter(isApproved);
  const total = approved.length;
  const pageDocs = approved.slice((safePage - 1) * safeLimit, safePage * safeLimit);
  return {
    reviews: pageDocs.map((doc) => publicReview(doc, voterId)),
    total,
    page: safePage,
    limit: safeLimit,
    summary
  };
}
async function listAllReviewsForAdmin() {
  const collection = await reviews();
  if (!collection) return [];
  const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((doc) => withoutMongoId(doc));
}
function extForMime(mime) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "video/webm") return "webm";
  if (mime === "video/mp4") return "mp4";
  return "jpg";
}
async function saveReviewMedia(raw) {
  const items = Array.isArray(raw) ? raw : [];
  if (items.length > MAX_IMAGES + MAX_VIDEOS) {
    return { error: `You can attach up to ${MAX_IMAGES} photos and ${MAX_VIDEOS} video.`, status: 400 };
  }
  await import_promises3.default.mkdir(MEDIA_DIR, { recursive: true });
  const saved = [];
  let videos = 0;
  let images = 0;
  for (const item of items) {
    const row = item;
    const dataUrl = typeof row.dataUrl === "string" ? row.dataUrl : "";
    const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif)|video\/(?:mp4|webm));base64,([A-Za-z0-9+/=\s]+)$/i);
    if (!match) return { error: "Please upload JPEG, PNG, WebP, GIF, MP4, or WebM files only.", status: 400 };
    const mime = match[1].toLowerCase().replace("image/jpg", "image/jpeg");
    const kind = mime.startsWith("video/") ? "video" : "image";
    if (kind === "video") videos += 1;
    else images += 1;
    if (images > MAX_IMAGES) return { error: `You can attach up to ${MAX_IMAGES} photos.`, status: 400 };
    if (videos > MAX_VIDEOS) return { error: `You can attach up to ${MAX_VIDEOS} video.`, status: 400 };
    const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
    const max = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (buffer.length > max) {
      return { error: kind === "video" ? "Video must be under 6MB." : "Each photo must be under 1.5MB.", status: 400 };
    }
    const filename = `${(0, import_crypto.randomUUID)()}.${extForMime(mime)}`;
    await import_promises3.default.writeFile(import_path3.default.join(MEDIA_DIR, filename), buffer);
    saved.push({ url: `/api/reviews/media/${filename}`, kind, mime });
  }
  return saved;
}
async function readReviewMediaFile(filename) {
  if (!/^[a-f0-9-]+\.(jpg|jpeg|png|webp|gif|mp4|webm)$/i.test(filename)) return null;
  const filePath = import_path3.default.join(MEDIA_DIR, filename);
  try {
    const data = await import_promises3.default.readFile(filePath);
    const ext = import_path3.default.extname(filename).toLowerCase();
    const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : ext === ".gif" ? "image/gif" : ext === ".mp4" ? "video/mp4" : ext === ".webm" ? "video/webm" : "image/jpeg";
    return { data, mime };
  } catch {
    return null;
  }
}
async function createReview(input) {
  const collection = await reviews();
  if (!collection) return { error: "Database is unavailable.", status: 503 };
  const productId = input.productId.trim();
  const userId = input.userId.trim();
  const userName = input.userName.trim();
  const title = input.title.trim();
  const reviewText = input.reviewText.trim();
  if (!productId) return { error: "Product is required.", status: 400 };
  if (!userId || !userName) return { error: "Sign in to write a review.", status: 401 };
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { error: "Rating must be between 1 and 5.", status: 400 };
  }
  if (title && title.length < 3) return { error: "Title must be at least 3 characters.", status: 400 };
  if (title.length > 120) return { error: "Title is too long.", status: 400 };
  if (reviewText && reviewText.length < 8) return { error: "Please write a short review (at least 8 characters).", status: 400 };
  if (reviewText.length > 2e3) return { error: "Review is too long.", status: 400 };
  const orderId = input.orderId?.trim() || "";
  if (orderId) {
    const existing = await collection.findOne({ productId, userId, orderId });
    if (existing) return { error: "You have already reviewed this product for this order.", status: 409 };
  }
  const review = {
    id: (0, import_crypto.randomUUID)(),
    productId,
    productName: (input.productName || "").trim(),
    productImage: (input.productImage || "").trim(),
    userId,
    userName,
    rating: input.rating,
    title,
    reviewText,
    orderId,
    isVerifiedPurchase: input.isVerifiedPurchase,
    status: input.isVerifiedPurchase ? "approved" : "pending",
    media: input.media,
    helpfulCount: 0,
    helpfulVoterIds: [],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  try {
    await collection.insertOne({ ...review });
  } catch (error) {
    const code = error.code;
    if (code === 11e3) return { error: "You have already reviewed this product for this order.", status: 409 };
    throw error;
  }
  if (review.status === "approved") {
    await writeProductStats(await summarizeProduct(productId));
  }
  return { review };
}
async function markReviewHelpful(reviewId, userId) {
  const collection = await reviews();
  if (!collection) return { error: "Database is unavailable.", status: 503 };
  const current = await collection.findOne({ id: reviewId });
  if (!current || !isApproved(current)) return { error: "Review not found.", status: 404 };
  const voters = current.helpfulVoterIds || [];
  if (voters.includes(userId)) return { error: "You already marked this review as helpful.", status: 409 };
  const helpfulCount = (current.helpfulCount || 0) + 1;
  await collection.updateOne(
    { id: reviewId },
    { $set: { helpfulCount, helpfulVoterIds: [...voters, userId] } }
  );
  return { helpfulCount, helpfulByMe: true };
}
async function moderateReview(id, status) {
  const collection = await reviews();
  if (!collection) return { error: "Database is unavailable.", status: 503 };
  if (status !== "approved" && status !== "rejected" && status !== "pending") {
    return { error: "Invalid status.", status: 400 };
  }
  const current = await collection.findOne({ id });
  if (!current) return { error: "Review not found.", status: 404 };
  await collection.updateOne({ id }, { $set: { status } });
  await writeProductStats(await summarizeProduct(current.productId));
  const next = await collection.findOne({ id });
  return { review: withoutMongoId(next) };
}
async function resolveReviewAuthor(sessionUserId) {
  if (!sessionUserId) return { error: "Sign in to write a review.", status: 401 };
  const user = await findUserById(sessionUserId);
  if (!user) return { error: "Sign in to write a review.", status: 401 };
  return { userId: user.id, userName: user.fullName, email: user.email };
}

// server/adminOrderApi.ts
function json2(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
function readBody2(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
function str(value) {
  return typeof value === "string" ? value.trim() : "";
}
var ADMIN_EMAIL = (process.env.ADMIN_LOGIN_EMAIL || "admin@zayrocollection.com").trim().toLowerCase();
var ADMIN_PASSWORD = (process.env.ADMIN_LOGIN_PASSWORD || "ZayroAdmin#2026").trim();
function requireAdmin(req) {
  return verifyAdminToken(bearerToken(req.headers.authorization));
}
async function personWithStats(person) {
  const stats = await deliveryPersonStats(person.id);
  return {
    id: person.id,
    fullName: person.fullName,
    phone: person.phone,
    email: person.email,
    status: isDeliveryPersonActive(person.status) ? "Active" : "Inactive",
    role: "DELIVERY_PERSON",
    assigned: stats.assigned,
    delivered: stats.delivered,
    pending: stats.pending
  };
}
async function handleAdminOrderApi(req, res) {
  try {
    const url = (req.url || "").split("?")[0];
    const method = (req.method || "GET").toUpperCase();
    if (url === "/api/admin/login" && method === "POST") {
      const payload = JSON.parse(await readBody2(req) || "{}");
      const email = str(payload.email).toLowerCase();
      const password = typeof payload.password === "string" ? payload.password : "";
      if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        json2(res, 401, { error: "Invalid admin credentials." });
        return;
      }
      json2(res, 200, { token: signAuthToken({ userId: "admin", email, role: "admin" }) });
      return;
    }
    if (url === "/api/admin/reviews" && method === "GET") {
      if (!requireAdmin(req)) {
        json2(res, 401, { error: "Admin sign in required." });
        return;
      }
      json2(res, 200, { reviews: await listAllReviewsForAdmin() });
      return;
    }
    const reviewMod = url.match(/^\/api\/admin\/reviews\/([^/]+)$/);
    if (reviewMod && method === "PATCH") {
      if (!requireAdmin(req)) {
        json2(res, 401, { error: "Admin sign in required." });
        return;
      }
      const payload = JSON.parse(await readBody2(req) || "{}");
      const status = str(payload.status);
      if (status !== "approved" && status !== "rejected" && status !== "pending") {
        json2(res, 400, { error: "Invalid review status." });
        return;
      }
      const updated = await moderateReview(decodeURIComponent(reviewMod[1]), status);
      if ("error" in updated) {
        json2(res, updated.status, { error: updated.error });
        return;
      }
      json2(res, 200, { review: updated.review });
      return;
    }
    if (url === "/api/admin/delivery-persons" && method === "GET") {
      if (!requireAdmin(req)) {
        json2(res, 401, { error: "Admin sign in required." });
        return;
      }
      const people = await listDeliveryPersons();
      json2(res, 200, { deliveryPersons: await Promise.all(people.map(personWithStats)) });
      return;
    }
    if (url === "/api/admin/delivery-persons" && method === "POST") {
      if (!requireAdmin(req)) {
        json2(res, 401, { error: "Admin sign in required." });
        return;
      }
      const payload = JSON.parse(await readBody2(req) || "{}");
      const created = await createDeliveryPerson({
        fullName: str(payload.fullName),
        phone: str(payload.phone),
        email: str(payload.email),
        password: typeof payload.password === "string" ? payload.password : "",
        status: str(payload.status) === "Inactive" ? "Inactive" : "Active"
      });
      if ("error" in created) {
        json2(res, created.status, { error: created.error });
        return;
      }
      const person = await findUserById(created.user.id);
      json2(res, 201, { deliveryPerson: person ? await personWithStats(person) : created.user });
      return;
    }
    const personOrders = url.match(/^\/api\/admin\/delivery-persons\/([^/]+)\/orders$/);
    if (personOrders && method === "GET") {
      if (!requireAdmin(req)) {
        json2(res, 401, { error: "Admin sign in required." });
        return;
      }
      const person = await findUserById(decodeURIComponent(personOrders[1]));
      if (!person || person.role !== "DELIVERY_PERSON") {
        json2(res, 404, { error: "Delivery person not found." });
        return;
      }
      json2(res, 200, { orders: await listOrdersForDeliveryPerson(person.id) });
      return;
    }
    const personPatch = url.match(/^\/api\/admin\/delivery-persons\/([^/]+)$/);
    if (personPatch && method === "PATCH") {
      if (!requireAdmin(req)) {
        json2(res, 401, { error: "Admin sign in required." });
        return;
      }
      const payload = JSON.parse(await readBody2(req) || "{}");
      const updated = await updateDeliveryPerson(decodeURIComponent(personPatch[1]), {
        fullName: str(payload.fullName) || void 0,
        phone: str(payload.phone) || void 0,
        email: str(payload.email) || void 0,
        password: typeof payload.password === "string" && payload.password ? payload.password : void 0,
        status: str(payload.status) === "Inactive" ? "Inactive" : str(payload.status) === "Active" ? "Active" : void 0
      });
      if ("error" in updated) {
        json2(res, updated.status, { error: updated.error });
        return;
      }
      const person = await findUserById(updated.id);
      json2(res, 200, { deliveryPerson: person ? await personWithStats(person) : updated });
      return;
    }
    if (personPatch && method === "DELETE") {
      if (!requireAdmin(req)) {
        json2(res, 401, { error: "Admin sign in required." });
        return;
      }
      const deleted = await deleteDeliveryPerson(decodeURIComponent(personPatch[1]));
      if ("error" in deleted) {
        json2(res, deleted.status, { error: deleted.error });
        return;
      }
      json2(res, 200, { ok: true });
      return;
    }
    const assign = url.match(/^\/api\/admin\/orders\/([^/]+)\/assign$/);
    if (assign && method === "PATCH") {
      if (!requireAdmin(req)) {
        json2(res, 401, { error: "Admin sign in required." });
        return;
      }
      const orderId = decodeURIComponent(assign[1]);
      const existing = await findStoredOrder(orderId);
      if (!existing) {
        json2(res, 404, { error: "Order not found." });
        return;
      }
      const payload = JSON.parse(await readBody2(req) || "{}");
      const deliveryPersonId = str(payload.deliveryPersonId);
      const person = await findUserById(deliveryPersonId);
      if (!person || person.role !== "DELIVERY_PERSON") {
        json2(res, 400, { error: "Select an active delivery person." });
        return;
      }
      if (!isDeliveryPersonActive(person.status)) {
        json2(res, 400, { error: "Select an active delivery person." });
        return;
      }
      const updated = await assignOrderDeliveryPerson(existing.id, person.id);
      json2(res, 200, { order: updated, deliveryPerson: await personWithStats(person) });
      return;
    }
    const patch = url.match(/^\/api\/admin\/orders\/([^/]+)\/tracking$/);
    if (patch && method === "PATCH") {
      if (!requireAdmin(req)) {
        json2(res, 401, { error: "Admin sign in required." });
        return;
      }
      const orderId = decodeURIComponent(patch[1]);
      const existing = await findStoredOrder(orderId);
      if (!existing) {
        json2(res, 404, { error: "Order not found." });
        return;
      }
      const payload = JSON.parse(await readBody2(req) || "{}");
      const status = str(payload.status);
      if (status && !isTrackingStatus(status)) {
        json2(res, 400, { error: "Invalid order status." });
        return;
      }
      const updated = await updateOrderTracking(existing.id, {
        status: status || void 0,
        trackingId: typeof payload.trackingId === "string" ? str(payload.trackingId) : void 0,
        deliveryPartner: typeof payload.deliveryPartner === "string" ? str(payload.deliveryPartner) : void 0,
        expectedDeliveryDate: typeof payload.expectedDeliveryDate === "string" ? str(payload.expectedDeliveryDate) : void 0
      });
      json2(res, 200, { order: updated });
      return;
    }
    json2(res, 404, { error: "Not found" });
  } catch (error) {
    json2(res, 500, { error: error instanceof Error ? error.message : "Server error" });
  }
}

// server/chatApi.ts
var SYSTEM_PROMPT = `You are the ZAYRO Store assistant for a premium menswear e-commerce site.
Be concise, friendly, and professional. Help with products (jackets, t-shirts, shirts, jeans, cargos), sizing, shipping, returns, payments, and order tracking.
If the user wants to track an order, tell them to tap Track orders in the chat header or sign in to Account \u2192 Orders.
If they need a human, suggest WhatsApp from the footer, Contact page, or support@zayrocollection.com.
Do not invent order IDs, prices, or policies. Keep answers short (2\u20135 sentences).`;
function json3(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
function readBody3(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
function cleanKey2(value) {
  return value.trim().replace(/^['"]|['"]$/g, "");
}
function redact(text) {
  return text.replace(/sk-[A-Za-z0-9_\-]+/g, "sk-***").replace(/AIza[A-Za-z0-9_\-]+/g, "AIza***");
}
function geminiKey() {
  return cleanKey2(process.env.GEMINI_API_KEY || "");
}
function openaiKey() {
  return cleanKey2(process.env.OPENAI_API_KEY || "");
}
async function replyWithGemini(message, history) {
  const key = geminiKey();
  if (!key) return null;
  const preferred = process.env.GEMINI_MODEL?.trim();
  const models = preferred ? [preferred] : ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3-flash-preview"];
  const contents = [
    ...history.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content).slice(0, 2e3) }]
    })),
    { role: "user", parts: [{ text: message }] }
  ];
  let lastError = "Gemini failed";
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 350
        }
      })
    });
    const data = await response.json();
    if (!response.ok) {
      const msg = data.error?.message || `Gemini error (${response.status})`;
      lastError = `${model}: ${msg}`;
      if (/api key|permission|invalid|forbidden|401|403/i.test(msg)) {
        break;
      }
      continue;
    }
    const reply = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
    if (reply) return reply;
    lastError = `${model}: Empty reply from Gemini`;
  }
  throw new Error(lastError);
}
async function replyWithOpenAI(message, history) {
  const key = openaiKey();
  if (!key || !key.startsWith("sk-")) return null;
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").map((m) => ({ role: m.role, content: String(m.content).slice(0, 2e3) })),
    { role: "user", content: message }
  ];
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      messages,
      temperature: 0.6,
      max_tokens: 350
    })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI error (${response.status})`);
  }
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("Empty reply from ChatGPT");
  return reply;
}
async function handleChatApi(req, res) {
  try {
    const method = (req.method || "GET").toUpperCase();
    const hasGemini = Boolean(geminiKey());
    const hasOpenAI = Boolean(openaiKey() && openaiKey().startsWith("sk-"));
    if (method === "GET") {
      json3(res, 200, {
        ok: true,
        geminiConfigured: hasGemini,
        openaiConfigured: hasOpenAI,
        preferred: hasGemini ? "gemini" : hasOpenAI ? "openai" : null
      });
      return;
    }
    if (method !== "POST") {
      json3(res, 405, { error: "Method not allowed" });
      return;
    }
    if (!hasGemini && !hasOpenAI) {
      json3(res, 503, {
        error: "AI chat is not configured. Add GEMINI_API_KEY (or OPENAI_API_KEY) to .env and restart the server."
      });
      return;
    }
    const raw = await readBody3(req);
    let parsed = {};
    try {
      parsed = JSON.parse(raw || "{}");
    } catch {
      json3(res, 400, { error: "Invalid JSON body" });
      return;
    }
    const message = String(parsed.message || "").trim();
    if (!message) {
      json3(res, 400, { error: "Message is required" });
      return;
    }
    if (message.length > 2e3) {
      json3(res, 400, { error: "Message is too long" });
      return;
    }
    const history = Array.isArray(parsed.history) ? parsed.history.slice(-12) : [];
    let reply = null;
    let provider = null;
    let geminiError = "";
    let openaiError = "";
    if (hasGemini) {
      try {
        reply = await replyWithGemini(message, history);
        provider = "gemini";
      } catch (error) {
        geminiError = error instanceof Error ? error.message : "Gemini failed";
      }
    }
    const allowOpenAIFallback = process.env.OPENAI_CHAT_FALLBACK === "true";
    if (!reply && hasOpenAI && allowOpenAIFallback) {
      try {
        reply = await replyWithOpenAI(message, history);
        provider = "openai";
      } catch (error) {
        openaiError = error instanceof Error ? error.message : "OpenAI failed";
      }
    }
    if (!reply) {
      const parts = [
        hasGemini ? `Gemini: ${geminiError || "no reply"}` : null,
        hasOpenAI && allowOpenAIFallback ? `OpenAI: ${openaiError || "no reply"}` : null
      ].filter(Boolean);
      json3(res, 502, { error: redact(parts.join(" | ") || "AI reply failed") });
      return;
    }
    json3(res, 200, { reply, provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat failed";
    json3(res, 502, { error: redact(message) });
  }
}

// server/confirmationCall.ts
init_orderStore();

// server/orderMessage.ts
function formatInr(value) {
  return `\u20B9${(Number(value) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}
function formatAddress(address) {
  if (!address) return "\u2014";
  return [address.address, address.city, address.state, address.postalCode, address.country].filter(Boolean).join(", ");
}
function formatWhatsAppOrderMessage(input) {
  const name = input.customerName.trim() || "Customer";
  const products = (input.items.length ? input.items : [{ name: "Your items", quantity: 1, price: input.total }]).map(
    (item) => `Product Name: ${item.name}
Quantity: ${item.quantity}
Price: ${formatInr(item.price)}`
  ).join("\n\n");
  return `Hello ${name} \u{1F44B}

Thank you for visiting and shopping with ZAYRO Store! \u{1F6CD}\uFE0F

\u2705 Your order has been successfully confirmed!

\u{1F4E6} Order Number: ${input.number}

\u{1F6D2} Product Details:

${products}

\u{1F4B0} Total Order Amount: ${formatInr(input.total)}

\u{1F4CD} Delivery Address:
${input.address || "\u2014"}

Thank you for choosing ZAYRO Store \u2764\uFE0F

We will process your order soon and keep you updated regarding delivery.

\u2014 ZAYRO Store`;
}
function spokenOrderScript(input) {
  const name = input.customerName.trim() || "customer";
  const products = (input.items.length ? input.items : []).map((item) => {
    const line = (Number(item.price) || 0) * (Number(item.quantity) || 1);
    return `${item.name}, quantity ${item.quantity}, price ${line.toLocaleString("en-IN")} rupees`;
  });
  const productSpeech = products.length ? ` You ordered: ${products.join(". ")}.` : "";
  return `Hello ${name}, thank you for shopping with ZAYRO Store. Your order number ${input.number} has been successfully received.${productSpeech} Your order total is ${(Number(input.total) || 0).toLocaleString("en-IN")} rupees. We will process your order soon. Thank you for choosing ZAYRO Store.`;
}

// server/orderNotify.ts
var import_nodemailer = __toESM(require("nodemailer"), 1);

// server/phone.ts
function toE164(phone, defaultCountry = "91") {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  if (trimmed.startsWith("+") && digits.length >= 10) return `+${digits}`;
  if (digits.startsWith(defaultCountry) && digits.length === defaultCountry.length + 10) {
    return `+${digits}`;
  }
  if (digits.length === 10) return `+${defaultCountry}${digits}`;
  if (digits.startsWith("0") && digits.length === 11) {
    return `+${defaultCountry}${digits.slice(1)}`;
  }
  return `+${digits}`;
}
function isValidE164(phone) {
  return /^\+[1-9]\d{9,14}$/.test(phone);
}

// server/orderNotify.ts
function twilioAuth() {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  return { sid, token };
}
function mapWhatsAppStatus(status) {
  const value = status.toLowerCase();
  if (value === "delivered" || value === "read") return "delivered";
  if (value === "failed" || value === "undelivered") return "failed";
  if (value === "sent" || value === "queued" || value === "sending" || value === "accepted") return "sent";
  return "sent";
}
async function sendCustomerOrderEmail(order) {
  if (order.emailSent || order.emailStatus === "sent" || order.emailStatus === "failed") {
    return {};
  }
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) {
    return {
      emailSent: false,
      emailStatus: "failed",
      emailError: "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS."
    };
  }
  if (!order.customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.customerEmail)) {
    return {
      emailSent: false,
      emailStatus: "failed",
      emailError: "Customer email is missing or invalid."
    };
  }
  const text = formatWhatsAppOrderMessage({
    customerName: order.customerName,
    number: order.number,
    items: order.items || [],
    total: order.total,
    address: order.deliveryAddress || "\u2014"
  });
  const productRows = (order.items || []).map(
    (item) => `<tr><td style="padding:8px;border:1px solid #ddd">${item.name}</td><td style="padding:8px;border:1px solid #ddd">${item.quantity}</td><td style="padding:8px;border:1px solid #ddd">${formatInr(item.price)}</td></tr>`
  ).join("");
  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = import_nodemailer.default.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM?.trim() || user,
    to: order.customerEmail,
    subject: `ZAYRO Store order confirmed \xB7 ${order.number}`,
    text,
    html: `<p>Hello ${order.customerName || "Customer"},</p><p>Thank you for shopping with <strong>ZAYRO Store</strong>. Your order has been successfully confirmed.</p><p><strong>Order Number:</strong> ${order.number}</p><table style="border-collapse:collapse;font-family:sans-serif;font-size:14px"><tr><th style="padding:8px;border:1px solid #ddd;text-align:left">Product</th><th style="padding:8px;border:1px solid #ddd">Qty</th><th style="padding:8px;border:1px solid #ddd">Price</th></tr>${productRows}</table><p><strong>Total:</strong> ${formatInr(order.total)}</p><p><strong>Delivery address:</strong> ${order.deliveryAddress || "\u2014"}</p><p>We will process your order soon.<br/>\u2014 ZAYRO Store</p>`
  });
  return {
    emailSent: true,
    emailStatus: "sent",
    emailSentAt: (/* @__PURE__ */ new Date()).toISOString(),
    emailError: void 0
  };
}
async function sendMetaWhatsApp(toE164Phone, body) {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneId) return null;
  const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toE164Phone.replace(/^\+/, ""),
      type: "text",
      text: { body }
    })
  });
  const details = await response.text();
  if (!response.ok) {
    return { error: `WhatsApp Cloud API failed (${response.status}): ${details.slice(0, 280)}` };
  }
  try {
    const parsed = JSON.parse(details);
    return { sid: parsed.messages?.[0]?.id };
  } catch {
    return { sid: void 0 };
  }
}
async function sendCustomerOrderWhatsApp(order) {
  if (order.whatsappMessageSent || order.whatsappMessageStatus === "sent" || order.whatsappMessageStatus === "delivered" || order.whatsappMessageStatus === "failed") {
    return {};
  }
  const e164 = order.customerPhoneE164 || toE164(order.customerPhone);
  if (!isValidE164(e164)) {
    return {
      whatsappMessageSent: false,
      whatsappMessageStatus: "failed",
      whatsappError: "Invalid customer phone number for WhatsApp."
    };
  }
  const body = formatWhatsAppOrderMessage({
    customerName: order.customerName,
    number: order.number,
    items: order.items || [],
    total: order.total,
    address: order.deliveryAddress || "\u2014"
  });
  const cloud = await sendMetaWhatsApp(e164, body);
  if (cloud) {
    if (cloud.error) {
      return {
        whatsappMessageSent: false,
        whatsappMessageStatus: "failed",
        whatsappError: cloud.error
      };
    }
    return {
      whatsappMessageSent: true,
      whatsappMessageStatus: "sent",
      whatsappMessageId: cloud.sid,
      whatsappMessageSentAt: (/* @__PURE__ */ new Date()).toISOString(),
      whatsappError: void 0
    };
  }
  const { sid, token } = twilioAuth();
  const from = process.env.TWILIO_WHATSAPP_FROM?.trim();
  if (!sid || !token || !from) {
    return {
      whatsappMessageSent: false,
      whatsappMessageStatus: "failed",
      whatsappError: "WhatsApp is not configured. Set TWILIO_WHATSAPP_FROM with Twilio credentials, or WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID."
    };
  }
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({
    To: `whatsapp:${e164}`,
    From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
    Body: body
  });
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl && /^https?:\/\//.test(appUrl) && !appUrl.includes("MY_APP_URL")) {
    params.set("StatusCallback", `${appUrl.replace(/\/$/, "")}/api/twilio/message-status`);
  }
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });
  const details = await response.text();
  if (!response.ok) {
    return {
      whatsappMessageSent: false,
      whatsappMessageStatus: "failed",
      whatsappError: `Twilio WhatsApp failed (${response.status}): ${details.slice(0, 280)}`
    };
  }
  let messageSid;
  try {
    messageSid = JSON.parse(details).sid;
  } catch {
    messageSid = void 0;
  }
  return {
    whatsappMessageSent: true,
    whatsappMessageStatus: "sent",
    whatsappMessageId: messageSid,
    whatsappMessageSentAt: (/* @__PURE__ */ new Date()).toISOString(),
    whatsappError: void 0
  };
}
async function refreshWhatsAppFromTwilio(order) {
  if (!order.whatsappMessageId || order.whatsappMessageStatus === "delivered" || order.whatsappMessageStatus === "failed") {
    return {};
  }
  const { sid, token } = twilioAuth();
  if (!sid || !token || !order.whatsappMessageId) return {};
  if (!/^SM|^MM/.test(order.whatsappMessageId)) return {};
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages/${order.whatsappMessageId}.json`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  if (!response.ok) return {};
  const data = await response.json();
  if (!data.status) return {};
  const status = mapWhatsAppStatus(data.status);
  if (status === order.whatsappMessageStatus) return {};
  return {
    whatsappMessageStatus: status,
    whatsappMessageSent: status !== "failed",
    whatsappError: status === "failed" ? `Twilio WhatsApp status: ${data.status}` : void 0
  };
}

// server/confirmationCall.ts
var inFlight = /* @__PURE__ */ new Set();
function escapeXml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function twimlFor(input) {
  return `<Response><Say voice="alice" language="en-IN">${escapeXml(spokenOrderScript(input))}</Say></Response>`;
}
function callAlreadyAttempted(order) {
  return order.confirmationCallSent || order.confirmationCallStatus === "initiated" || order.confirmationCallStatus === "completed" || order.confirmationCallStatus === "failed";
}
function twilioAuth2() {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  return { sid, token, from };
}
function mapTwilioStatus(status) {
  const value = status.toLowerCase();
  if (value === "completed") return "completed";
  if (["busy", "failed", "no-answer", "canceled", "cancelled"].includes(value)) return "failed";
  return "initiated";
}
function baseRecord(input, existing) {
  const e164 = toE164(input.customerPhone);
  return {
    id: existing?.id || input.id,
    number: existing?.orderId || existing?.number || input.number,
    orderId: existing?.orderId || existing?.number || input.number,
    userId: existing?.userId,
    paymentMethod: existing?.paymentMethod,
    paymentStatus: existing?.paymentStatus,
    orderStatus: existing?.orderStatus,
    status: existing?.status,
    trackingId: existing?.trackingId,
    deliveryPartner: existing?.deliveryPartner,
    expectedDeliveryDate: existing?.expectedDeliveryDate,
    statusHistory: existing?.statusHistory,
    products: existing?.products,
    shipping: existing?.shipping,
    createdAt: existing?.createdAt || input.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerPhoneE164: e164,
    customerEmail: input.customerEmail || existing?.customerEmail || "",
    deliveryAddress: formatAddress(input.shippingAddress) || existing?.deliveryAddress || "",
    items: input.items?.length ? input.items : existing?.items || [],
    total: input.total,
    confirmationCallSent: existing?.confirmationCallSent || false,
    confirmationCallStatus: existing?.confirmationCallStatus || "pending",
    confirmationCallSid: existing?.confirmationCallSid,
    confirmationCallError: existing?.confirmationCallError,
    confirmationCallAt: existing?.confirmationCallAt,
    whatsappMessageSent: existing?.whatsappMessageSent || false,
    whatsappMessageStatus: existing?.whatsappMessageStatus || "pending",
    whatsappMessageSentAt: existing?.whatsappMessageSentAt,
    whatsappMessageId: existing?.whatsappMessageId,
    whatsappError: existing?.whatsappError,
    emailSent: existing?.emailSent || false,
    emailStatus: existing?.emailStatus || "pending",
    emailSentAt: existing?.emailSentAt,
    emailError: existing?.emailError
  };
}
async function refreshCallFromTwilio(order) {
  if (!order.confirmationCallSid || order.confirmationCallStatus === "completed" || order.confirmationCallStatus === "failed") {
    return order;
  }
  const { sid, token } = twilioAuth2();
  if (!sid || !token) return order;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls/${order.confirmationCallSid}.json`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  if (!response.ok) return order;
  const data = await response.json();
  if (!data.status) return order;
  const nextStatus = mapTwilioStatus(data.status);
  if (nextStatus === order.confirmationCallStatus) return order;
  return await updateStoredOrder(order.id, {
    confirmationCallStatus: nextStatus,
    confirmationCallSent: nextStatus !== "failed",
    confirmationCallError: nextStatus === "failed" ? `Twilio call status: ${data.status}` : void 0
  }) || order;
}
async function listOrdersWithLiveCallStatus() {
  const orders = await listStoredOrders();
  const updated = [];
  for (const order of orders) {
    try {
      const withCall = await refreshCallFromTwilio(order);
      const wa = await refreshWhatsAppFromTwilio(withCall);
      if (Object.keys(wa).length) {
        updated.push(await updateStoredOrder(withCall.id, wa) || withCall);
      } else {
        updated.push(withCall);
      }
    } catch {
      updated.push(order);
    }
  }
  return updated;
}
async function applyTwilioWhatsAppStatus(messageSid, twilioStatus) {
  const orders = await listStoredOrders();
  const match = orders.find((item) => item.whatsappMessageId === messageSid);
  if (!match) return null;
  const nextStatus = mapWhatsAppStatus(twilioStatus);
  return updateStoredOrder(match.id, {
    whatsappMessageStatus: nextStatus,
    whatsappMessageSent: nextStatus !== "failed",
    whatsappError: nextStatus === "failed" ? `Twilio WhatsApp status: ${twilioStatus}` : void 0
  });
}
async function applyTwilioCallStatus(callSid, twilioStatus) {
  const orders = await listStoredOrders();
  const match = orders.find((item) => item.confirmationCallSid === callSid);
  if (!match) return null;
  const nextStatus = mapTwilioStatus(twilioStatus);
  return updateStoredOrder(match.id, {
    confirmationCallStatus: nextStatus,
    confirmationCallSent: nextStatus !== "failed",
    confirmationCallError: nextStatus === "failed" ? `Twilio call status: ${twilioStatus}` : void 0
  });
}
async function placeVoiceCall(order, input) {
  if (callAlreadyAttempted(order)) return {};
  if (!isValidE164(order.customerPhoneE164)) {
    return {
      confirmationCallStatus: "failed",
      confirmationCallSent: false,
      confirmationCallError: "Invalid customer phone number for calling."
    };
  }
  const { sid, token, from } = twilioAuth2();
  if (!sid || !token || !from) {
    return {
      confirmationCallStatus: "failed",
      confirmationCallSent: false,
      confirmationCallError: "Twilio Voice is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER."
    };
  }
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({
    To: order.customerPhoneE164,
    From: from,
    Twiml: twimlFor(input)
  });
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl && /^https?:\/\//.test(appUrl) && !appUrl.includes("MY_APP_URL")) {
    params.set("StatusCallback", `${appUrl.replace(/\/$/, "")}/api/twilio/voice-status`);
    params.set("StatusCallbackEvent", "completed failed busy no-answer canceled");
  }
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });
  if (!response.ok) {
    const details = await response.text();
    return {
      confirmationCallStatus: "failed",
      confirmationCallSent: false,
      confirmationCallError: `Twilio Voice failed (${response.status}): ${details.slice(0, 280)}`
    };
  }
  const data = await response.json();
  return {
    confirmationCallSent: true,
    confirmationCallStatus: "initiated",
    confirmationCallSid: data.sid,
    confirmationCallAt: (/* @__PURE__ */ new Date()).toISOString(),
    confirmationCallError: void 0
  };
}
async function initiateConfirmationCall(input) {
  const lockKey = input.id || input.number;
  while (inFlight.has(lockKey)) {
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  inFlight.add(lockKey);
  try {
    const existing = await findStoredOrder(input.id) || await findStoredOrder(input.number);
    let order = await upsertStoredOrder(baseRecord(input, existing));
    try {
      order = await updateStoredOrder(order.id, await sendCustomerOrderEmail(order)) || order;
    } catch (error) {
      order = await updateStoredOrder(order.id, {
        emailSent: false,
        emailStatus: "failed",
        emailError: error instanceof Error ? error.message : "Email send failed"
      }) || order;
    }
    try {
      order = await updateStoredOrder(order.id, await placeVoiceCall(order, input)) || order;
    } catch (error) {
      order = await updateStoredOrder(order.id, {
        confirmationCallSent: false,
        confirmationCallStatus: "failed",
        confirmationCallError: error instanceof Error ? error.message : "Call failed"
      }) || order;
    }
    try {
      order = await updateStoredOrder(order.id, await sendCustomerOrderWhatsApp(order)) || order;
    } catch (error) {
      order = await updateStoredOrder(order.id, {
        whatsappMessageSent: false,
        whatsappMessageStatus: "failed",
        whatsappError: error instanceof Error ? error.message : "WhatsApp send failed"
      }) || order;
    }
    return await findStoredOrder(order.id) || order;
  } finally {
    inFlight.delete(lockKey);
  }
}

// server/confirmationCallHandler.ts
function json4(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
function readBody4(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
function str2(value) {
  return typeof value === "string" ? value.trim() : "";
}
async function handleOrderCallApi(req, res) {
  try {
    await handleInner(req, res);
  } catch (error) {
    if (!res.headersSent) {
      json4(res, 500, { error: error instanceof Error ? error.message : "Server error" });
    }
  }
}
async function handleInner(req, res) {
  const url = (req.url || "").split("?")[0];
  const method = (req.method || "GET").toUpperCase();
  if (url === "/api/orders" && method === "GET") {
    json4(res, 200, { orders: await listOrdersWithLiveCallStatus() });
    return;
  }
  if (url === "/api/orders/confirmation-call" && method === "POST") {
    let payload = {};
    try {
      payload = JSON.parse(await readBody4(req) || "{}");
    } catch {
      json4(res, 400, { error: "Invalid JSON body" });
      return;
    }
    const id = str2(payload.id);
    const number = str2(payload.number);
    const customerName = str2(payload.customerName);
    const customerPhone = str2(payload.customerPhone);
    const total = Number(payload.total);
    if (!id || !number || !customerPhone) {
      json4(res, 400, { error: "Order id, number, and customer phone are required." });
      return;
    }
    const items = Array.isArray(payload.items) ? payload.items.map((item) => {
      const row = item;
      return {
        name: str2(row.name) || "Item",
        quantity: Number(row.quantity) || 1,
        price: Number(row.price) || 0
      };
    }) : [];
    const shipping = payload.shippingAddress || {};
    const order = await initiateConfirmationCall({
      id,
      number,
      customerName,
      customerPhone,
      customerEmail: str2(payload.customerEmail),
      total: Number.isFinite(total) ? total : 0,
      createdAt: str2(payload.createdAt) || void 0,
      items,
      shippingAddress: {
        address: str2(shipping.address),
        city: str2(shipping.city),
        state: str2(shipping.state),
        postalCode: str2(shipping.postalCode),
        country: str2(shipping.country)
      }
    });
    json4(res, 200, { order });
    return;
  }
  if (url === "/api/twilio/voice-status" && method === "POST") {
    const raw = await readBody4(req);
    const params = new URLSearchParams(raw);
    const sid = params.get("CallSid") || "";
    const status = params.get("CallStatus") || "";
    if (!sid) {
      json4(res, 400, { error: "CallSid required" });
      return;
    }
    const order = await applyTwilioCallStatus(sid, status);
    json4(res, 200, { ok: true, order });
    return;
  }
  if (url === "/api/twilio/message-status" && method === "POST") {
    const raw = await readBody4(req);
    const params = new URLSearchParams(raw);
    const sid = params.get("MessageSid") || "";
    const status = params.get("MessageStatus") || "";
    if (!sid) {
      json4(res, 400, { error: "MessageSid required" });
      return;
    }
    const order = await applyTwilioWhatsAppStatus(sid, status);
    json4(res, 200, { ok: true, order });
    return;
  }
  json4(res, 404, { error: "Not found" });
}

// server/ipinfoLookup.ts
function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(",")[0].trim();
  }
  return (req.socket.remoteAddress || "").replace(/^::ffff:/, "");
}
function isPrivateIp(ip) {
  if (!ip || ip === "::1" || ip === "127.0.0.1" || ip === "localhost") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("169.254.")) return true;
  const parts = ip.split(".").map(Number);
  if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  return false;
}
async function handleIpinfoRequest(req, res) {
  const token = process.env.IPINFO_TOKEN?.trim();
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }
  if (!token) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: "IPINFO_TOKEN is not configured" }));
    return;
  }
  const ip = clientIp(req);
  const lookup = isPrivateIp(ip) ? "me" : ip;
  const url = `https://api.ipinfo.io/lite/${encodeURIComponent(lookup)}?token=${encodeURIComponent(token)}`;
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    const body = await response.text();
    res.statusCode = response.ok ? 200 : 502;
    res.end(body);
  } catch {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: "Location lookup failed" }));
  }
}

// server/mongoHealth.ts
init_mongo();
async function handleMongoHealth(req, res) {
  const method = (req.method || "GET").toUpperCase();
  res.setHeader("Content-Type", "application/json");
  if (method !== "GET") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }
  const status = await mongoStatus();
  res.statusCode = status.connected ? 200 : 503;
  res.end(JSON.stringify(status));
}

// server/notifyAdmin.ts
var import_nodemailer2 = __toESM(require("nodemailer"), 1);
var ADMIN_EMAIL2 = (process.env.ADMIN_EMAIL || "harshdhiman613@gmail.com").trim();
var ADMIN_PHONE = (process.env.ADMIN_WHATSAPP || process.env.ADMIN_PHONE || "917681987334").replace(
  /\D/g,
  ""
);
function requestHeadline(request) {
  const kind = request.requestType === "replace" ? "Replace" : "Return";
  return `\u{1F6A8} New ${kind} Request`;
}
function formatAdminText(request) {
  const kind = request.requestType === "replace" ? "Replace" : "Return";
  return [
    requestHeadline(request),
    `Request Type: ${kind}`,
    `Order Number: ${request.orderNumber || "\u2014"}`,
    `Customer Name: ${request.customerName}`,
    `Customer Phone Number: ${request.customerPhone}`,
    `Customer Email: ${request.customerEmail}`,
    `Customer Complete Address: ${request.customerAddress || "\u2014"}`,
    `Product Name: ${request.productName || "\u2014"}`,
    `Product Details: ${request.productDetails || "\u2014"}`,
    `Reason for Return/Replacement: ${request.reason || "\u2014"}`,
    `Additional customer message: ${request.additionalMessage || "\u2014"}`,
    `Order matched: ${request.orderMatched ? "Yes" : "No"}`,
    `Request ID: ${request.id}`
  ].join("\n");
}
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function formatAdminHtml(request) {
  const rows = [
    ["Request Type", request.requestType === "replace" ? "Replace" : "Return"],
    ["Order Number", request.orderNumber || "\u2014"],
    ["Customer Name", request.customerName],
    ["Customer Phone Number", request.customerPhone],
    ["Customer Email", request.customerEmail],
    ["Customer Complete Address", request.customerAddress || "\u2014"],
    ["Product Name", request.productName || "\u2014"],
    ["Product Details", request.productDetails || "\u2014"],
    ["Reason for Return/Replacement", request.reason || "\u2014"],
    ["Additional customer message", request.additionalMessage || "\u2014"],
    ["Order matched", request.orderMatched ? "Yes" : "No"],
    ["Request ID", request.id]
  ];
  const table = rows.map(
    ([label, value]) => `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:600">${escapeHtml(label)}</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(value).replace(/\n/g, "<br/>")}</td></tr>`
  ).join("");
  return `<h2>${escapeHtml(requestHeadline(request))}</h2><table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">${table}</table>`;
}
async function sendAdminEmail(request) {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) {
    return {
      sent: false,
      error: "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS."
    };
  }
  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = import_nodemailer2.default.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM?.trim() || user,
    to: ADMIN_EMAIL2,
    replyTo: request.customerEmail,
    subject: `${requestHeadline(request)} \xB7 ${request.orderNumber || request.id}`,
    text: formatAdminText(request),
    html: formatAdminHtml(request)
  });
  return { sent: true };
}
async function sendTwilioMessage(to, from, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!sid || !token) {
    return { sent: false, error: "Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN." };
  }
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });
  if (!response.ok) {
    const details = await response.text();
    return { sent: false, error: `Twilio request failed (${response.status}): ${details.slice(0, 280)}` };
  }
  return { sent: true };
}
async function sendWhatsAppCloud(body) {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneId) return null;
  const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: ADMIN_PHONE,
      type: "text",
      text: { body }
    })
  });
  if (!response.ok) {
    const details = await response.text();
    return { sent: false, error: `WhatsApp Cloud API failed (${response.status}): ${details.slice(0, 280)}` };
  }
  return { sent: true };
}
async function notifyAdmin(request) {
  const text = formatAdminText(request);
  const notifications = {
    email: { sent: false },
    whatsapp: { sent: false },
    sms: { sent: false }
  };
  try {
    notifications.email = await sendAdminEmail(request);
  } catch (error) {
    notifications.email = { sent: false, error: error instanceof Error ? error.message : "Email send failed" };
  }
  try {
    const cloud = await sendWhatsAppCloud(text);
    if (cloud) {
      notifications.whatsapp = cloud;
    } else {
      const from = process.env.TWILIO_WHATSAPP_FROM?.trim();
      if (from) {
        notifications.whatsapp = await sendTwilioMessage(`whatsapp:${toE164(ADMIN_PHONE)}`, from, text);
      } else {
        notifications.whatsapp = {
          sent: false,
          error: "WhatsApp is not configured. Set WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID, or TWILIO_WHATSAPP_FROM with Twilio credentials."
        };
      }
    }
  } catch (error) {
    notifications.whatsapp = {
      sent: false,
      error: error instanceof Error ? error.message : "WhatsApp send failed"
    };
  }
  try {
    const smsFrom = process.env.TWILIO_FROM_NUMBER?.trim();
    if (smsFrom) {
      notifications.sms = await sendTwilioMessage(toE164(ADMIN_PHONE), smsFrom, text);
    } else if (!notifications.whatsapp.sent) {
      notifications.sms = {
        sent: false,
        error: "SMS is not configured. Set TWILIO_FROM_NUMBER with Twilio credentials as a fallback."
      };
    }
  } catch (error) {
    notifications.sms = { sent: false, error: error instanceof Error ? error.message : "SMS send failed" };
  }
  return notifications;
}

// server/returnRequestStore.ts
var import_promises4 = __toESM(require("fs/promises"), 1);
var import_path4 = __toESM(require("path"), 1);
init_mongoCollections();
var STORE_PATH2 = import_path4.default.resolve(process.cwd(), "data", "return-requests.json");
var migrated2 = false;
async function ensureMigrated2() {
  if (migrated2) return;
  await migrateJsonIntoMongo();
  migrated2 = true;
}
async function ensureFileStore2() {
  await import_promises4.default.mkdir(import_path4.default.dirname(STORE_PATH2), { recursive: true });
  try {
    await import_promises4.default.access(STORE_PATH2);
  } catch {
    await import_promises4.default.writeFile(STORE_PATH2, "[]", "utf8");
  }
}
async function listFromFile2() {
  await ensureFileStore2();
  const raw = await import_promises4.default.readFile(STORE_PATH2, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
async function saveToFile2(requests) {
  await ensureFileStore2();
  await import_promises4.default.writeFile(STORE_PATH2, JSON.stringify(requests, null, 2), "utf8");
}
async function listReturnRequests() {
  await ensureMigrated2();
  const collection = await returnRequestsCollection();
  if (collection) {
    const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return docs.map((doc) => withoutMongoId(doc));
  }
  return listFromFile2();
}
async function addReturnRequest(request) {
  await ensureMigrated2();
  const collection = await returnRequestsCollection();
  if (collection) {
    await collection.insertOne({ ...request });
    return request;
  }
  const list = await listFromFile2();
  list.unshift(request);
  await saveToFile2(list);
  return request;
}
async function updateReturnRequestStatus(id, status) {
  await ensureMigrated2();
  const collection = await returnRequestsCollection();
  if (collection) {
    const current = await collection.findOne({ id });
    if (!current) return null;
    const next = { ...withoutMongoId(current), status };
    await collection.updateOne({ id }, { $set: { status } });
    return next;
  }
  const list = await listFromFile2();
  const index = list.findIndex((item) => item.id === id);
  if (index < 0) return null;
  list[index] = { ...list[index], status };
  await saveToFile2(list);
  return list[index];
}

// server/returnRequestHandler.ts
function json5(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
function readBody5(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
function asType(value) {
  return value === "replace" ? "replace" : "return";
}
function asStatus(value) {
  if (value === "pending" || value === "approved" || value === "rejected" || value === "completed") {
    return value;
  }
  return null;
}
function str3(value) {
  return typeof value === "string" ? value.trim() : "";
}
async function handleReturnRequestApi(req, res) {
  try {
    await handleReturnRequestApiInner(req, res);
  } catch (error) {
    if (!res.headersSent) {
      json5(res, 500, { error: error instanceof Error ? error.message : "Server error" });
    }
  }
}
async function handleReturnRequestApiInner(req, res) {
  const url = (req.url || "").split("?")[0];
  const method = (req.method || "GET").toUpperCase();
  if (url === "/api/return-requests" && method === "GET") {
    json5(res, 200, { requests: await listReturnRequests() });
    return;
  }
  if (url === "/api/return-requests" && method === "POST") {
    let payload = {};
    try {
      payload = JSON.parse(await readBody5(req) || "{}");
    } catch {
      json5(res, 400, { error: "Invalid JSON body" });
      return;
    }
    const customerName = str3(payload.customerName);
    const customerPhone = str3(payload.customerPhone);
    const customerEmail = str3(payload.customerEmail);
    const orderNumber = str3(payload.orderNumber);
    if (!customerName || !customerPhone || !customerEmail || !orderNumber) {
      json5(res, 400, { error: "Order number, name, phone, and email are required." });
      return;
    }
    const draft = {
      id: `RR-${Date.now().toString(36).toUpperCase()}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "pending",
      requestType: asType(payload.requestType),
      orderNumber,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress: str3(payload.customerAddress),
      productName: str3(payload.productName),
      productDetails: str3(payload.productDetails),
      reason: str3(payload.reason),
      additionalMessage: str3(payload.additionalMessage),
      orderMatched: Boolean(payload.orderMatched),
      notifications: {
        email: { sent: false },
        whatsapp: { sent: false },
        sms: { sent: false }
      }
    };
    draft.notifications = await notifyAdmin(draft);
    const saved = await addReturnRequest(draft);
    json5(res, 201, { request: saved });
    return;
  }
  const statusMatch = url.match(/^\/api\/return-requests\/([^/]+)\/status$/);
  if (statusMatch && method === "PATCH") {
    let payload = {};
    try {
      payload = JSON.parse(await readBody5(req) || "{}");
    } catch {
      json5(res, 400, { error: "Invalid JSON body" });
      return;
    }
    const status = asStatus(payload.status);
    if (!status) {
      json5(res, 400, { error: "Status must be pending, approved, rejected, or completed." });
      return;
    }
    const updated = await updateReturnRequestStatus(decodeURIComponent(statusMatch[1]), status);
    if (!updated) {
      json5(res, 404, { error: "Request not found" });
      return;
    }
    json5(res, 200, { request: updated });
    return;
  }
  json5(res, 404, { error: "Not found" });
}

// server/reviewApi.ts
function json6(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
function readBody6(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
function str4(value) {
  return typeof value === "string" ? value.trim() : "";
}
async function handleReviewApi(req, res) {
  try {
    const urlPath = (req.url || "").split("?")[0];
    const query = new URL(req.url || "", "http://localhost").searchParams;
    const method = (req.method || "GET").toUpperCase();
    const session = verifyAuthToken(bearerToken(req.headers.authorization));
    if (urlPath === "/api/reviews/summaries" && method === "GET") {
      json6(res, 200, { summaries: await listReviewSummaries() });
      return;
    }
    if (urlPath === "/api/reviews/pending" && method === "GET") {
      if (!session) {
        json6(res, 401, { error: "Sign in to review your purchase." });
        return;
      }
      const orderId = (query.get("orderId") || "").trim();
      if (!orderId) {
        json6(res, 400, { error: "Order is required." });
        return;
      }
      const author = await resolveReviewAuthor(session.userId);
      if ("error" in author) {
        json6(res, author.status, { error: author.error });
        return;
      }
      const pending = await listPendingReviewsForOrder({
        orderId,
        userId: session.userId,
        email: author.email || session.email
      });
      if ("error" in pending) {
        json6(res, pending.status, { error: pending.error });
        return;
      }
      json6(res, 200, pending);
      return;
    }
    const media = urlPath.match(/^\/api\/reviews\/media\/([^/]+)$/);
    if (media && method === "GET") {
      const file = await readReviewMediaFile(decodeURIComponent(media[1]));
      if (!file) {
        json6(res, 404, { error: "Media not found." });
        return;
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", file.mime);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.end(file.data);
      return;
    }
    if (urlPath === "/api/reviews" && method === "POST") {
      const payload = JSON.parse(await readBody6(req) || "{}");
      const productId = str4(payload.productId);
      const orderId = str4(payload.orderId);
      const rating = Math.round(Number(payload.rating));
      if (orderId) {
        const created2 = await savePurchaseRating({
          productId,
          orderId,
          rating,
          sessionUserId: session?.userId,
          sessionEmail: session?.email
        });
        if ("error" in created2) {
          json6(res, created2.status, { error: created2.error });
          return;
        }
        json6(res, 201, {
          review: created2.review,
          message: "Thank you for your feedback!"
        });
        return;
      }
      if (!session) {
        json6(res, 401, { error: "Sign in to write a review." });
        return;
      }
      const author = await resolveReviewAuthor(session.userId);
      if ("error" in author) {
        json6(res, author.status, { error: author.error });
        return;
      }
      const mediaResult = await saveReviewMedia(Array.isArray(payload.media) ? payload.media : []);
      if ("error" in mediaResult) {
        json6(res, mediaResult.status, { error: mediaResult.error });
        return;
      }
      const purchase = await findEligiblePurchase({
        productId,
        userId: session.userId,
        email: author.email || session.email,
        orderId
      });
      if (!purchase.purchased) {
        json6(res, 403, { error: "You can only review products you have purchased." });
        return;
      }
      if (purchase.alreadyReviewed) {
        json6(res, 409, { error: "You have already reviewed this product for this order." });
        return;
      }
      const created = await createReview({
        productId,
        userId: author.userId,
        userName: author.userName,
        rating,
        title: str4(payload.title),
        reviewText: str4(payload.reviewText),
        orderId: purchase.orderId,
        isVerifiedPurchase: true,
        media: mediaResult
      });
      if ("error" in created) {
        json6(res, created.status, { error: created.error });
        return;
      }
      json6(res, 201, {
        review: created.review,
        message: "Thank you for your feedback!"
      });
      return;
    }
    const helpful = urlPath.match(/^\/api\/reviews\/([^/]+)\/helpful$/);
    if (helpful && method === "POST") {
      if (!session) {
        json6(res, 401, { error: "Sign in to mark a review as helpful." });
        return;
      }
      const result = await markReviewHelpful(decodeURIComponent(helpful[1]), session.userId);
      if ("error" in result) {
        json6(res, result.status, { error: result.error });
        return;
      }
      json6(res, 200, result);
      return;
    }
    const byProduct = urlPath.match(/^\/api\/reviews\/([^/]+)$/);
    if (byProduct && method === "GET") {
      const productId = decodeURIComponent(byProduct[1]);
      if (productId === "summaries" || productId === "media" || productId === "pending") {
        json6(res, 404, { error: "Not found" });
        return;
      }
      const page = Number(query.get("page") || 1) || 1;
      const limit = Number(query.get("limit") || 5) || 5;
      json6(res, 200, await listReviewsForProduct(productId, page, limit, session?.userId));
      return;
    }
    json6(res, 404, { error: "Not found" });
  } catch (error) {
    json6(res, 500, { error: error instanceof Error ? error.message : "Server error" });
  }
}

// server/shopApi.ts
init_shopOrders();

// server/otpStore.ts
var import_crypto2 = require("crypto");
var import_bcryptjs2 = __toESM(require("bcryptjs"), 1);
init_mongo();

// server/twilioSms.ts
var import_twilio = __toESM(require("twilio"), 1);
function twilioFromNumber() {
  return (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER || "").trim();
}
function twilioSmsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() && process.env.TWILIO_AUTH_TOKEN?.trim() && twilioFromNumber()
  );
}
async function sendTwilioSms(toE1642, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = twilioFromNumber();
  if (!sid || !token || !from) {
    return {
      ok: false,
      error: "SMS is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER."
    };
  }
  try {
    const client2 = (0, import_twilio.default)(sid, token);
    await client2.messages.create({ to: toE1642, from, body });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send SMS.";
    const safe = /unverified|trial/i.test(message) ? "Could not send SMS to this number. If you are using a Twilio trial account, verify the number in Twilio first." : "Could not send the OTP SMS. Please try again.";
    return { ok: false, error: safe };
  }
}

// server/otpStore.ts
var OTP_TTL_MS = 5 * 60 * 1e3;
var MAX_ATTEMPTS = 5;
var RESEND_COOLDOWN_MS = 60 * 1e3;
function generateOtp() {
  return String((0, import_crypto2.randomInt)(0, 1e6)).padStart(6, "0");
}
async function challenges() {
  const db2 = await getDb();
  return db2?.collection("otp_challenges") || null;
}
async function sendRegistrationOtp(input) {
  const collection = await challenges();
  if (!collection) return { error: "Database is unavailable.", status: 503 };
  if (!twilioSmsConfigured()) {
    return {
      error: "SMS is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.",
      status: 503
    };
  }
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = normalizeIndianMobile(input.phone);
  if (fullName.length < 2) return { error: "Enter your full name.", status: 400 };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address.", status: 400 };
  if (!phone) return { error: "Enter a valid 10-digit Indian mobile number.", status: 400 };
  if (input.password.length < 8) return { error: "Password must be at least 8 characters.", status: 400 };
  const existingEmail = await findUserByEmail(email);
  if (existingEmail) return { error: "An account already exists for this email.", status: 409 };
  const existingPhone = await findUserByPhone(phone);
  if (existingPhone) return { error: "An account already exists for this phone number.", status: 409 };
  const now = Date.now();
  const current = await collection.findOne({ email, phone });
  if (current?.lastSentAt) {
    const elapsed = now - new Date(current.lastSentAt).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      return {
        error: `Please wait ${Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1e3)} seconds before requesting another OTP.`,
        status: 429
      };
    }
  }
  const otp = generateOtp();
  const otpHash = await import_bcryptjs2.default.hash(otp, 10);
  const passwordHash = await import_bcryptjs2.default.hash(input.password, 10);
  const expiresAt = new Date(now + OTP_TTL_MS);
  const id = current?.id || (0, import_crypto2.randomUUID)();
  const sms = await sendTwilioSms(phone, `Your ZAYRO Store verification code is ${otp}. It expires in 5 minutes.`);
  if (sms.ok === false) return { error: sms.error, status: 502 };
  const doc = {
    id,
    fullName,
    email,
    phone,
    passwordHash,
    otpHash,
    expiresAt: expiresAt.toISOString(),
    expireAt: expiresAt,
    attempts: 0,
    lastSentAt: new Date(now).toISOString()
  };
  await collection.updateOne({ email, phone }, { $set: doc }, { upsert: true });
  return { maskedPhone: maskIndianMobile(phone), resendAfterSeconds: 60 };
}
async function verifyRegistrationOtp(input) {
  const collection = await challenges();
  if (!collection) return { error: "Database is unavailable.", status: 503 };
  const email = input.email.trim().toLowerCase();
  const phone = normalizeIndianMobile(input.phone);
  const otp = input.otp.replace(/\D/g, "");
  if (!phone) return { error: "Enter a valid 10-digit Indian mobile number.", status: 400 };
  if (!/^\d{6}$/.test(otp)) return { error: "Invalid OTP. Please try again.", status: 400 };
  const challenge = await collection.findOne({ email, phone });
  if (!challenge) return { error: "OTP expired. Please request a new OTP.", status: 400 };
  if (Date.now() > new Date(challenge.expiresAt).getTime()) {
    await collection.deleteOne({ id: challenge.id });
    return { error: "OTP expired. Please request a new OTP.", status: 400 };
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    await collection.deleteOne({ id: challenge.id });
    return { error: "Too many incorrect attempts. Please request a new OTP.", status: 429 };
  }
  const ok = await import_bcryptjs2.default.compare(otp, challenge.otpHash);
  if (!ok) {
    const attempts = challenge.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await collection.deleteOne({ id: challenge.id });
      return { error: "Too many incorrect attempts. Please request a new OTP.", status: 429 };
    }
    await collection.updateOne({ id: challenge.id }, { $set: { attempts } });
    return { error: "Invalid OTP. Please try again.", status: 400 };
  }
  const created = await createUserFromVerifiedSignup({
    fullName: challenge.fullName,
    email: challenge.email,
    phone: challenge.phone,
    passwordHash: challenge.passwordHash
  });
  if ("error" in created) return created;
  await collection.deleteOne({ id: challenge.id });
  return { user: created.user };
}

// server/shopApi.ts
function json7(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
function readBody7(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
function str5(value) {
  return typeof value === "string" ? value.trim() : "";
}
function authUser(req) {
  const token = bearerToken(req.headers.authorization);
  if (!token) return null;
  return verifyAuthToken(token);
}
function withoutDeliveryAssignment(order) {
  const { deliveryPersonId: _id, assignedAt: _assigned, ...rest } = order;
  return rest;
}
async function handleShopApi(req, res) {
  try {
    await seedProductsCollection();
    await handleInner2(req, res);
  } catch (error) {
    if (!res.headersSent) {
      json7(res, 500, { error: error instanceof Error ? error.message : "Server error" });
    }
  }
}
async function handleInner2(req, res) {
  const url = (req.url || "").split("?")[0];
  const method = (req.method || "GET").toUpperCase();
  if (url === "/api/auth/send-otp" && method === "POST") {
    const payload = JSON.parse(await readBody7(req) || "{}");
    const result = await sendRegistrationOtp({
      fullName: str5(payload.fullName),
      email: str5(payload.email),
      phone: str5(payload.phone),
      password: typeof payload.password === "string" ? payload.password : ""
    });
    if ("error" in result) {
      json7(res, result.status, { error: result.error });
      return;
    }
    json7(res, 200, result);
    return;
  }
  if (url === "/api/auth/verify-otp" && method === "POST") {
    const payload = JSON.parse(await readBody7(req) || "{}");
    const result = await verifyRegistrationOtp({
      email: str5(payload.email),
      phone: str5(payload.phone),
      otp: str5(payload.otp)
    });
    if ("error" in result) {
      json7(res, result.status, { error: result.error });
      return;
    }
    json7(res, 201, {
      user: result.user,
      token: signAuthToken({ userId: result.user.id, email: result.user.email })
    });
    return;
  }
  if (url === "/api/auth/register" && method === "POST") {
    const payload = JSON.parse(await readBody7(req) || "{}");
    const result = await createUser({
      fullName: str5(payload.fullName),
      email: str5(payload.email),
      phone: str5(payload.phone),
      password: typeof payload.password === "string" ? payload.password : "",
      shippingAddress: str5(payload.shippingAddress),
      city: str5(payload.city),
      state: str5(payload.state),
      country: str5(payload.country),
      postalCode: str5(payload.postalCode)
    });
    if ("error" in result) {
      json7(res, result.status, { error: result.error });
      return;
    }
    json7(res, 201, {
      user: result.user,
      token: signAuthToken({ userId: result.user.id, email: result.user.email })
    });
    return;
  }
  if (url === "/api/auth/login" && method === "POST") {
    const payload = JSON.parse(await readBody7(req) || "{}");
    const result = await verifyUser(str5(payload.email), typeof payload.password === "string" ? payload.password : "");
    if ("error" in result) {
      json7(res, result.status, { error: result.error });
      return;
    }
    json7(res, 200, { user: result.user, token: signAuthToken({ userId: result.user.id, email: result.user.email }) });
    return;
  }
  if (url === "/api/auth/me" && method === "GET") {
    const session = authUser(req);
    if (!session) {
      json7(res, 401, { error: "Sign in required." });
      return;
    }
    const user = await findUserById(session.userId);
    if (!user) {
      json7(res, 401, { error: "Account not found." });
      return;
    }
    const { passwordHash: _pw, ...safe } = user;
    json7(res, 200, { user: safe });
    return;
  }
  if (url === "/api/auth/profile" && method === "PATCH") {
    const session = authUser(req);
    if (!session) {
      json7(res, 401, { error: "Sign in required." });
      return;
    }
    const payload = JSON.parse(await readBody7(req) || "{}");
    const user = await updateUserProfile(session.userId, {
      fullName: str5(payload.fullName) || void 0,
      phone: str5(payload.phone) || void 0,
      shippingAddress: str5(payload.shippingAddress),
      city: str5(payload.city),
      state: str5(payload.state),
      country: str5(payload.country),
      postalCode: str5(payload.postalCode)
    });
    if (!user) {
      json7(res, 404, { error: "Account not found." });
      return;
    }
    json7(res, 200, { user });
    return;
  }
  if (url === "/api/shop/orders" && method === "POST") {
    const payload = JSON.parse(await readBody7(req) || "{}");
    const session = authUser(req);
    const shipping = payload.shippingAddress || {};
    const items = Array.isArray(payload.items) ? payload.items : [];
    const shippingAddress = {
      address: str5(shipping.address),
      city: str5(shipping.city),
      state: str5(shipping.state),
      postalCode: str5(shipping.postalCode),
      country: str5(shipping.country)
    };
    const deliveryAddressLine = [shippingAddress.address, shippingAddress.city, shippingAddress.state, shippingAddress.postalCode, shippingAddress.country].filter(Boolean).join(", ");
    const order = await createShopOrder({
      userId: session?.userId || str5(payload.userId) || null,
      customerName: str5(payload.customerName),
      customerEmail: str5(payload.customerEmail),
      customerPhone: str5(payload.customerPhone),
      shippingAddress,
      items: items.map((item) => {
        const row = item;
        return {
          productId: str5(row.productId),
          name: str5(row.name) || "Item",
          image: str5(row.image) || void 0,
          selectedSize: str5(row.selectedSize) || void 0,
          selectedColor: str5(row.selectedColor) || void 0,
          quantity: Number(row.quantity) || 1,
          price: Number(row.price) || 0
        };
      }),
      subtotal: Number(payload.subtotal) || 0,
      deliveryCharge: Number(payload.deliveryCharge) || 0,
      handlingCharge: Number(payload.handlingCharge) || 0,
      discount: Number(payload.discount) || 0,
      total: Number(payload.total) || 0,
      paymentMethod: str5(payload.paymentMethod) || "cod",
      paymentStatus: str5(payload.paymentStatus) || "unpaid",
      stripePaymentIntentId: str5(payload.stripePaymentIntentId) || void 0,
      deliveryLocation: normalizeDeliveryLocation(payload.deliveryLocation, deliveryAddressLine)
    });
    json7(res, 201, { order });
    return;
  }
  if (url === "/api/shop/orders" && method === "GET") {
    const session = authUser(req);
    if (!session || session.role === "admin") {
      json7(res, 401, { error: "Sign in required." });
      return;
    }
    json7(res, 200, { orders: (await listOrdersForUser(session.userId)).map(withoutDeliveryAssignment) });
    return;
  }
  const tracking = url.match(/^\/api\/shop\/orders\/([^/]+)\/tracking$/);
  if (tracking && method === "GET") {
    const session = authUser(req);
    if (!session || session.role === "admin") {
      json7(res, 401, { error: "Sign in required." });
      return;
    }
    const order = await getOrderByOrderId(decodeURIComponent(tracking[1]), session.userId, session.email);
    if (!order) {
      json7(res, 404, { error: "Order not found." });
      return;
    }
    json7(res, 200, { order: withoutDeliveryAssignment(order) });
    return;
  }
  const byId = url.match(/^\/api\/shop\/orders\/([^/]+)$/);
  if (byId && method === "GET") {
    const session = authUser(req);
    if (!session || session.role === "admin") {
      json7(res, 401, { error: "Sign in required." });
      return;
    }
    const order = await getOrderByOrderId(decodeURIComponent(byId[1]), session.userId, session.email);
    if (!order) {
      json7(res, 404, { error: "Order not found." });
      return;
    }
    json7(res, 200, { order: withoutDeliveryAssignment(order) });
    return;
  }
  json7(res, 404, { error: "Not found" });
}

// scripts/vercel-api-entry.ts
init_stripeHandler();
function json8(res, status, body) {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
function resolveApiPath(req) {
  const fromQuery = req.query?.__path;
  if (typeof fromQuery === "string" && fromQuery.trim()) {
    return `/api/${fromQuery.replace(/^\/+/, "")}`;
  }
  if (Array.isArray(fromQuery) && fromQuery[0]) {
    return `/api/${String(fromQuery[0]).replace(/^\/+/, "")}`;
  }
  const raw = (req.url || "").split("?")[0] || "";
  if (raw.startsWith("/api/") && raw !== "/api" && !raw.endsWith("/index")) {
    return raw;
  }
  return raw.startsWith("/api") ? raw : `/api${raw}`;
}
async function handler(req, res) {
  try {
    const urlPath = resolveApiPath(req);
    const rawUrl = req.url || "";
    const search = rawUrl.includes("?") ? rawUrl.slice(rawUrl.indexOf("?")) : "";
    const cleanedSearch = search.replace(/[?&]__path=[^&]*/g, "").replace(/^\?&/, "?").replace(/^\?$/, "");
    req.url = `${urlPath}${cleanedSearch}`;
    if (urlPath === "/api/health") {
      json8(res, 200, { ok: true, path: urlPath });
      return;
    }
    if (urlPath === "/api/ipinfo") {
      await handleIpinfoRequest(req, res);
      return;
    }
    if (urlPath.startsWith("/api/stripe")) {
      await handleStripeApi(req, res);
      return;
    }
    if (urlPath.startsWith("/api/admin")) {
      await handleAdminOrderApi(req, res);
      return;
    }
    if (urlPath.startsWith("/api/reviews")) {
      await handleReviewApi(req, res);
      return;
    }
    if (urlPath.startsWith("/api/auth") || urlPath.startsWith("/api/shop")) {
      await handleShopApi(req, res);
      return;
    }
    if (urlPath.startsWith("/api/returns")) {
      await handleReturnRequestApi(req, res);
      return;
    }
    if (urlPath.startsWith("/api/order-call") || urlPath.includes("confirmation")) {
      await handleOrderCallApi(req, res);
      return;
    }
    if (urlPath.startsWith("/api/mongo")) {
      await handleMongoHealth(req, res);
      return;
    }
    if (urlPath.startsWith("/api/chat")) {
      await handleChatApi(req, res);
      return;
    }
    json8(res, 404, { error: `API route not found: ${urlPath}` });
  } catch (error) {
    json8(res, 500, {
      error: error instanceof Error ? error.message : "Server error"
    });
  }
}
