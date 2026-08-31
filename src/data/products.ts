import { Product, CategoryInfo, CartItem } from '../types';

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'jackets',
    name: 'Jackets & Outerwear',
    slug: 'jackets',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC39Q3rgYykuZXYXC6jx6VQw_QTOvPXty-yUo5w4sBb2JtvviTBU0dWQuYTQ98mI6kdXXQQi2l_c8K7pNXXMvGghRKkJ5ln9qKiGoGpna0nIqUpqHKMRgwxAPFeC26oL3ARrFxSs8zyXmF7gPJRqpgihcdKk1lWd0bElchmsCcE3-viwOvNAQkccfD0Fv_sV6oJB_LAZznTAqLd-PeQrn6aIfPJn0aU9fFuMEM_25QSNGtv-0jLJ-cz',
    description: 'Structured tailoring and protective luxury outerwear',
    gridSpan: 'md:col-span-2 md:row-span-2'
  },
  {
    id: 't-shirts',
    name: 'T-Shirts',
    slug: 't-shirts',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHJ45gHZml6AzcXcvFtABLwg5qBR71tSUwBZFyca0QxgFH4PxpG1X7dI652rWepirb20TeJ4IbIeaeuomWN3q7cyVKm3hKRcO-sXKWBZQUFRbUrQ1_-O6hdN4IxK_cBel78lD-Qw1ldrWIme-UDHh2GFwdevrfj3ii5EfHDkgNu7fGsORckBzZnzh5imUPwX69pZTSDcz9LPthXKMMtpV-kKzz55x3xS9dEaH2u1mAa_BWLOO_ACMV',
    description: 'Heavyweight organic cottons with boxy architectural cuts',
    gridSpan: 'md:col-span-1'
  },
  {
    id: 'jeans',
    name: 'Jeans',
    slug: 'jeans',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDM0djLZ9XwgRk38hPT_FjSGNH_mJj9rvHKJKAiGeeBLNcKXWdWsOXZ1td62Vhh4DZsr69tTpPjZyf9vGRufBZeHnHd4Apqm1WsNTokVL1gyW0isKmxLnNP1pvmZCyTI02JkMcyiag4MCjoUhoKP2Lv8WvJzbfesgi-wQnFjB31s3td9EIzQa8SOkgU0kjRk7V-uqXVfISafxuGX1LIOX3Lpn4BPUmA6LXXt2Vkn2eUVQ-AKeMHfXvY',
    description: 'Japanese selvedge denim in raw indigo and charcoal washes',
    gridSpan: 'md:col-span-1'
  },
  {
    id: 'cargos',
    name: 'Cargos',
    slug: 'cargos',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2HXuPXpesZ6_qB5XnwfkBmpRnYuFb8nHFrS-dJtO6zhvox75ror-SWKSnyps_7GIpZSG1z6XQxcYh7fWO7gHYQAKLsJlSimZRAa2LzlZif_fvFj3YXDFatJplqaC80CqskY-W0057Hk-Ap-J9LN9I7EdA0p_Diqsz6M_JyREgwzfr7Y1irJqa8DAxBT0V2ZXORwhP1L3pNTBliSGe36QrWr9_LwpTn5X3Q3DaHebBhpW2DMrcXsMA',
    description: 'Tapered utilitarian trousers with recessed geometric pockets',
    gridSpan: 'md:col-span-1'
  },
  {
    id: 'shirts',
    name: 'Shirts',
    slug: 'shirts',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCI8W3i9LuGSh1v4ZXbzGSfL4HTXdHuPPES_tN7TOij8Sa2j1O4gwSNPFUEBtBNauE4rAsG6rRIG5Z1eTOchaPriM0vwpyYVoTylgFmPLb0CExja5sScy2avtMSXMb-E16wqhkg_6zyxkyWTzBMQdhefyWLp3HDMFFFQB0fxQW7jHbx175k2YZoE_Ew6tQrAkYYAAfnNfDASB-hmB86_6uIod84-H39ov07NgCdiFlAl6OmTPFA8GJL',
    description: 'Crisp poplins and technical silk-cotton blend button-downs',
    gridSpan: 'md:col-span-2'
  }
];

export const PRODUCTS: Product[] = [
  {
    id: 'architectural-blazer',
    name: 'Architectural Blazer',
    subtitle: 'Sharp geometric tailoring',
    price: 495,
    category: 'jackets',
    categoryLabel: 'Jackets & Outerwear',
    breadcrumb: 'Men / Tailoring / Blazers',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC5O8AzwxQ2P3aX6-aCesgpon6WWCBzn2lqaUzjZgkOLUmGDVzOXHoLxp_pb8HODp2S24e1AjYYyU2m1-nLy1nLK703A5ZDkq9ObFaLhwIwlQzYwztTwX3mnoWFRo7pM12LsKdJbeeJrz5FyUEl89deKzPBtFJW6zPTP9NEgdwXSrtRIQkSTprKYA5oihNo-XPaWhII_DPntE4567PxpUkac-shggRgRtD7Tfoz8tEWebelr08nIdD3',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuChlU5gX9Yo_CFYQOXzVImW1tG4IjTMWqFlrrRzJxb5-THfXkpKXgR54gOXoOWyov1oojeG82AkCeoUZeUhZkgGBc2cE2uoFYJ7T104HONy-1BXFAkzg5kd1v1X0aAX-goAvmuaT_m6ULMf17L7LsVUPYJLuA0mOOx2Lfx1IbU5nV-luOAQxEvKkm6QD42McJR6REhFQs2s36G_3GA2b4FKcacqse9qYsBcwbVN1vZaz0XlgPrb6hF8',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDpWIwemSxVtV0zuOvRC0fu83tLtfVDdGWEUfosKn8sCpioFqSRMxBSHnpBODIcZDueaCcm9zINLCgpWvmhHh_TWXnY2TFsJoJV-HcMGVeLEImQ8MiWVEfUDAqv5EcKbRu_XX3fVQn6yiXy76UvANXio48yIKZcwP3na_0gV0GXAb7LM-FGLiyz12e9AyPX_2-crirGokkjJVnFBCYNn7ARKn3S8ku7phEM5mLCepbaghy-tghN8G9p'
    ],
    colors: [
      { name: 'Onyx Black', hex: '#000000' },
      { name: 'Slate Grey', hex: '#E4E4E7' }
    ],
    sizes: [
      { size: 'S', available: true },
      { size: 'M', available: true },
      { size: 'L', available: true },
      { size: 'XL', available: false }
    ],
    description: 'A masterclass in modern tailoring. The Architectural Blazer is constructed with sharp, geometric precision, featuring structured shoulders and a minimalist hidden-button closure. Designed for a sleek, authoritative silhouette.',
    detailsAndCare: [
      '100% Premium Virgin Wool',
      'Cupro lining for smooth layering',
      'Hidden single-breasted closure',
      'Flapless besom pockets with interior passport slot',
      'Dry clean only'
    ],
    shippingAndReturns: 'Complimentary express shipping on all orders. Returns accepted within 14 days of delivery in original condition.',
    isNew: true,
    material: 'Virgin Wool'
  },
  {
    id: 'structural-oversized-tee',
    name: 'Structural Oversized Tee',
    subtitle: '100% Heavyweight Cotton',
    price: 85,
    category: 't-shirts',
    categoryLabel: 'T-Shirts',
    breadcrumb: 'Men / Essentials / T-Shirts',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDx8eV5zusBiYyf-1f4FpgBDTAJEJhiXFdoRGLDC5jlfJPEgwgAgeJnBh2SIqVSX3FJAMZCXkjSesIHLdiPcaTqg2O73DbxbVTRf3BRWMaQjgATbhx79E9wNK9beAcpgnVA8i7Kd-6ZVl_rIr02cUk-TtRC_yNNmlGBBorMeMiGkxR8z8sMokedTMHPSIR7JkU64Gr9dVAy5sHb_DRAR4ncJ7ysfX0g3j2uUA0lqZ1YrnAUfARbBKYW',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBHJ45gHZml6AzcXcvFtABLwg5qBR71tSUwBZFyca0QxgFH4PxpG1X7dI652rWepirb20TeJ4IbIeaeuomWN3q7cyVKm3hKRcO-sXKWBZQUFRbUrQ1_-O6hdN4IxK_cBel78lD-Qw1ldrWIme-UDHh2GFwdevrfj3ii5EfHDkgNu7fGsORckBzZnzh5imUPwX69pZTSDcz9LPthXKMMtpV-kKzz55x3xS9dEaH2u1mAa_BWLOO_ACMV'
    ],
    colors: [
      { name: 'Onyx Black', hex: '#111111' },
      { name: 'Optic White', hex: '#FFFFFF' },
      { name: 'Washed Charcoal', hex: '#374151' }
    ],
    sizes: [
      { size: 'S', available: true },
      { size: 'M', available: true },
      { size: 'L', available: true },
      { size: 'XL', available: true }
    ],
    description: 'Cut from a dense 280 GSM combed organic cotton with a drop-shoulder stance and reinforced ribbed collar. Engineered to maintain its boxy architecture wash after wash.',
    detailsAndCare: [
      '100% Combed Organic Cotton (280 GSM)',
      'Pre-shrunk, heavyweight drape',
      'Tonal coverstitch detailing',
      'Machine wash cold, lay flat to dry'
    ],
    shippingAndReturns: 'Complimentary shipping on orders over $150. Standard returns within 14 days.',
    isNew: false,
    material: '100% Heavyweight Cotton'
  },
  {
    id: 'tailored-wool-overshirt',
    name: 'Tailored Wool Overshirt',
    subtitle: 'Italian Merino Blend',
    price: 210,
    category: 'jackets',
    categoryLabel: 'Jackets & Outerwear',
    breadcrumb: 'Men / Layering / Overshirts',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCiZ3B7TXQopk9agxKB-sfF5EsMmeB1G5A75DP2njc1T9aMFl_obGqLIVIFZtJmqyxExSUmbsJR-oPTw5o1f3HX9bT-HbUfCaYBPYSMRBFAhWXMR9YG_cGdNMTFMdhrfazZ3fA-eJwfCwhOqeDraPKvUTdb7ZrNRvaVaUHKLkcilzAjofSiI-z5GLUdOaVg2ugTlKD2DUCtcSuUEXAQlBJAhoUNAoMibqpOYfzKewxjdo8fKwLLZ5nL',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC39Q3rgYykuZXYXC6jx6VQw_QTOvPXty-yUo5w4sBb2JtvviTBU0dWQuYTQ98mI6kdXXQQi2l_c8K7pNXXMvGghRKkJ5ln9qKiGoGpna0nIqUpqHKMRgwxAPFeC26oL3ARrFxSs8zyXmF7gPJRqpgihcdKk1lWd0bElchmsCcE3-viwOvNAQkccfD0Fv_sV6oJB_LAZznTAqLd-PeQrn6aIfPJn0aU9fFuMEM_25QSNGtv-0jLJ-cz'
    ],
    colors: [
      { name: 'Heather Grey', hex: '#D1D5DB' },
      { name: 'Deep Navy', hex: '#1E293B' },
      { name: 'Charcoal', hex: '#374151' }
    ],
    sizes: [
      { size: 'S', available: true },
      { size: 'M', available: true },
      { size: 'L', available: true },
      { size: 'XL', available: true }
    ],
    description: 'An architectural transitional layer spun from an Italian merino wool blend. Features a structured point collar, horn buttons, and an oversized chest patch pocket.',
    detailsAndCare: [
      '75% Merino Wool, 25% Polyamide',
      'Custom dyed horn buttons',
      'Clean interior French seams',
      'Dry clean recommended'
    ],
    shippingAndReturns: 'Complimentary standard shipping on all outerwear orders. Returns within 14 days.',
    isNew: true,
    material: 'Italian Merino Blend'
  },
  {
    id: 'pleated-wide-leg-trousers',
    name: 'Pleated Wide-Leg Trousers',
    subtitle: 'Relaxed Fit',
    price: 145,
    category: 'bottomwear',
    categoryLabel: 'Bottomwear',
    breadcrumb: 'Men / Trousers / Pleated',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAZ6ju28ly5f-3PyYh27dn-1vSVUcswTeTFPBMht7tWULnODs1Ae-5TFVMmt89icc-UuVHXUkRzLX20xZF7iBQnlpc5usBhBWGVKAxGYzIWvPR0U42ladokKPRlrGzVaQ_SDOtr7qkSvSfcbnIbTw1EC7R3M94s154Pdq6HiZk4fxoHdxs8j-2tseHbzjDWsD7zSpjhflaSIK_4r7lZRx5yXkH67N3Y9Uf51iILHlaLpjPRXAMmyaLn',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCmdi0_Xi4APu_BJ4EP2CcpXYgfqIDVbhLF5RXqxQQmT1l0GdwnIcnXCkzyvUQALI7HmY01Vabw492MIB7CqZDzFhS9a4nXF98s7n382gn6PnkYw0EwOy7XBXCmMCSU3CIlZWt7yvtzhjb5Xbhtglj4dVmbFcnAx9LnIhWR-hMW5Y-l8qQr81PWvlFJgabBWKK0Gh-2JwN2j4FgCN8xZKro-zdXi044J__NH6HKIxVMl5P-UW-wyH9P'
    ],
    colors: [
      { name: 'Charcoal Black', hex: '#262626' },
      { name: 'Stone Grey', hex: '#9CA3AF' }
    ],
    sizes: [
      { size: '30', available: true },
      { size: '32', available: true },
      { size: '34', available: true },
      { size: '36', available: true }
    ],
    description: 'Designed with dual forward pleats that cascade into an expansive, fluid drape. Tailored with a clean waistband, concealed hook-and-bar closure, and deep slash pockets.',
    detailsAndCare: [
      '60% Tencel, 40% Virgin Wool',
      'Double front pleats',
      'Curved waistband with internal curtain',
      'Dry clean or gentle cold wash'
    ],
    shippingAndReturns: 'Complimentary shipping on orders over $150. Returns within 14 days.',
    isNew: false,
    material: 'Relaxed Fit'
  },
  {
    id: 'crisp-poplin-button-down',
    name: 'Crisp Poplin Button-Down',
    subtitle: 'Hidden Placket',
    price: 110,
    category: 'shirts',
    categoryLabel: 'Shirts',
    breadcrumb: 'Men / Tailoring / Shirts',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCYL1FEylf6WDc1RnmoszR3yAvxksjezpHfHbUs4IHsS2n7Q9PHXcyASMkFBiHB4fWabaQXDw_9TUGNcIrDRi0OC_sq5bf14FcH5OVz3dMb44EMZdNBWGfIGxTdNX1XvEz7iICRUG8cWxo_1F1jg8f8F24eKYyEfbTd6tBsnXFrufeiIi2s2tk0ZOHIxbqSh37CHUr8trrdm6NNU8hJqPonBFrIxoW-3YV8VBxOhlbXnNZLdSR1zOCP',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuALd9_tkemDK0nBp_Q3cUo82Vuec-rWk_8WZz4j_DwQrS4ViuUWFX5Pg2_24v_nZa9B1_8TL67xR-gguA4nRXAjI2NoUlaJRF8FLINWNy6oHx29jY91hpuApQWw7Mkrj5AWUBkOzIRDVk-FdCH6XIG11B2D1w0eCjM255igg_byF43XX0seQvhBGxHElWXITbdeq6pA-yZbbjivB3q1dfKm6LaIcnc9s-fAz7lEJuA2uuDqeIe4OhBs'
    ],
    colors: [
      { name: 'Optic White', hex: '#FFFFFF' },
      { name: 'Sky Blue', hex: '#93C5FD' },
      { name: 'Powder Pink', hex: '#FBCFE8' }
    ],
    sizes: [
      { size: '15.0', available: true },
      { size: '15.5', available: true },
      { size: '16.0', available: true },
      { size: '16.5', available: true }
    ],
    description: 'Woven from 120s two-ply Egyptian cotton for an ultra-smooth finish with natural lustre. Features a clean concealed placket and sharp spread collar.',
    detailsAndCare: [
      '100% Egyptian Poplin Cotton (120/2)',
      'Removable collar stays',
      'Concealed mother-of-pearl buttons',
      'Machine wash cold, hot iron when damp'
    ],
    shippingAndReturns: 'Complimentary shipping on orders over $150. Returns within 14 days.',
    isNew: false,
    material: 'Hidden Placket'
  },
  {
    id: 'poplin-structured-shirt',
    name: 'Poplin Structured Shirt',
    subtitle: 'Optic White Minimal Placket',
    price: 185,
    category: 'shirts',
    categoryLabel: 'Shirts',
    breadcrumb: 'Men / Tailoring / Shirts',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuALd9_tkemDK0nBp_Q3cUo82Vuec-rWk_8WZz4j_DwQrS4ViuUWFX5Pg2_24v_nZa9B1_8TL67xR-gguA4nRXAjI2NoUlaJRF8FLINWNy6oHx29jY91hpuApQWw7Mkrj5AWUBkOzIRDVk-FdCH6XIG11B2D1w0eCjM255igg_byF43XX0seQvhBGxHElWXITbdeq6pA-yZbbjivB3q1dfKm6LaIcnc9s-fAz7lEJuA2uuDqeIe4OhBs',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC4QFtUpvzA6D0n9qbASNNOWR1Ln0BCWm94ymGSK9a62zMHTu72OHGlVkKc9lLC1o41k-dz1XAiGTwEoagy3PXgKPFycje6pPkN5Dj6LUCfOuZpoNwWfGlQmsKGD6iiEvbqLMsAlMHvXW78p8rhdxAQz3NXYUfxqEJqomwp11m-n29OAeKXxWMYfM0Hl3YJysmiLI22uxI_HH4jCTKze2uFRnFPz6sDiQPRAcAkvfEjqMBJ4WLMZD96'
    ],
    colors: [
      { name: 'Optic White', hex: '#FFFFFF' },
      { name: 'Ice Blue', hex: '#E0F2FE' }
    ],
    sizes: [
      { size: '15.0', available: true },
      { size: '15.5', available: true },
      { size: '16.0', available: true },
      { size: '16.5', available: true }
    ],
    description: 'A minimalist fashion classic with a structured, hidden-placket collar and reinforced cuffs. Clean geometric lines suitable for editorial styling or black-tie attire.',
    detailsAndCare: [
      '100% Giza Cotton Poplin',
      'Seamless front bib construction',
      'MOP buttons with cross-stitching',
      'Dry clean or cold machine wash'
    ],
    shippingAndReturns: 'Complimentary shipping on orders over $150.',
    isNew: false,
    material: 'Poplin Cotton'
  },
  {
    id: 'wide-leg-tailored-trousers',
    name: 'Wide-Leg Tailored Trousers',
    subtitle: 'Deep Slate Grey Drape',
    price: 290,
    category: 'bottomwear',
    categoryLabel: 'Bottomwear',
    breadcrumb: 'Men / Tailoring / Trousers',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCmdi0_Xi4APu_BJ4EP2CcpXYgfqIDVbhLF5RXqxQQmT1l0GdwnIcnXCkzyvUQALI7HmY01Vabw492MIB7CqZDzFhS9a4nXF98s7n382gn6PnkYw0EwOy7XBXCmMCSU3CIlZWt7yvtzhjb5Xbhtglj4dVmbFcnAx9LnIhWR-hMW5Y-l8qQr81PWvlFJgabBWKK0Gh-2JwN2j4FgCN8xZKro-zdXi044J__NH6HKIxVMl5P-UW-wyH9P'
    ],
    colors: [
      { name: 'Deep Slate Grey', hex: '#4B5563' },
      { name: 'Jet Black', hex: '#111827' }
    ],
    sizes: [
      { size: '30', available: true },
      { size: '32', available: true },
      { size: '34', available: true },
      { size: '36', available: true }
    ],
    description: 'Tailored with sharp center-creases against a structured silhouette. High-key luxury drape, custom horn waist side-adjusters, and premium pocket lining.',
    detailsAndCare: [
      '100% High-Twist Tropical Wool',
      'Unfinished hems for custom tailoring',
      'Internal waist curtain with rubber grip',
      'Dry clean only'
    ],
    shippingAndReturns: 'Complimentary shipping and tailoring consult included.',
    isNew: true,
    material: 'Tropical Wool'
  },
  {
    id: 'square-toe-chelsea-boots',
    name: 'Square-Toe Chelsea Boots',
    subtitle: 'Full-Grain Calfskin',
    price: 450,
    category: 'shoes',
    categoryLabel: 'Footwear',
    breadcrumb: 'Men / Footwear / Boots',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDAL-HZS39XIbeW8mQf81HOMH3IEl97m-4qMo3D6x7jj2ZY15-XJlZvukGaW5jTqoLtt6Y0hB8Q8B8ada7XXb7yXCgHdjDlZ9lnDq7sjvzyJmyuahejoCYaWUg9j36Nqe0vTByHz3XNut0NKKYfs-TeNbaockwOYShIn8OEB3Ygeq4ALN2D6C1k45xXGsw5cERo-xGih3qHsoNGHJ3XwgPvPqDicolzWKf64_tbwu7XstLGgwaJKbcO'
    ],
    colors: [
      { name: 'Onyx Black', hex: '#000000' }
    ],
    sizes: [
      { size: '40 EU', available: true },
      { size: '41 EU', available: true },
      { size: '42 EU', available: true },
      { size: '43 EU', available: true },
      { size: '44 EU', available: true }
    ],
    description: 'An architectural take on the Chelsea boot featuring a distinctive chiseled square toe, Goodyear welted sole, and tonal elasticated side gussets.',
    detailsAndCare: [
      '100% Italian Box Calf Leather',
      'Hand-stacked leather heel with Vibram rubber cap',
      'Goodyear welt construction (resolable)',
      'Made in Tuscany, Italy'
    ],
    shippingAndReturns: 'Complimentary worldwide express shipping.',
    isNew: false,
    material: 'Calfskin Leather'
  },
  {
    id: 'linear-silver-cuff',
    name: 'Linear Silver Cuff',
    subtitle: '925 Sterling Silver',
    price: 120,
    category: 'accessories',
    categoryLabel: 'Accessories',
    breadcrumb: 'Men / Accessories / Jewelry',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB7ESDqCNnZTnBSRkPICzpXboN5kWF2AIRb3NLcCjR2uDiHlCjv88gywxRwO2P-oT6dcAjRVF8_W2XIf0DDgr38KIiQkzP2d2GnlywfIsPqeYnYYd90DvyoHzowkL5wZ24o2rSQIV9Tz1l_H0NuRsLFEZSwvOnP8HNDPVSnHFUM8QMIOkmvZ8tm3fcMq_28jmlebDuiWiWoGwcVeoy_FZqC8mAD-W0G_JUSVlQRd3OQJ29-2DdBr6Zt'
    ],
    colors: [
      { name: 'Polished Silver', hex: '#E5E7EB' }
    ],
    sizes: [
      { size: 'One Size', available: true }
    ],
    description: 'A solid 925 sterling silver cuff bracelet hand-finished with mirror-polished exterior bevels and discreet internal laser-engraved ZAYRO hallmark.',
    detailsAndCare: [
      'Solid 925 Sterling Silver',
      'Adjustable tension fit',
      'Hypoallergenic, nickel-free',
      'Includes microfiber storage pouch'
    ],
    shippingAndReturns: 'Complimentary gift packaging on all jewelry.',
    isNew: false,
    material: '925 Silver'
  },
  {
    id: 'selvedge-denim-jeans',
    name: 'Selvedge Raw Denim Jeans',
    subtitle: '14oz Kurabo Mills Indigo',
    price: 220,
    category: 'jeans',
    categoryLabel: 'Jeans',
    breadcrumb: 'Men / Denim / Selvedge',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDM0djLZ9XwgRk38hPT_FjSGNH_mJj9rvHKJKAiGeeBLNcKXWdWsOXZ1td62Vhh4DZsr69tTpPjZyf9vGRufBZeHnHd4Apqm1WsNTokVL1gyW0isKmxLnNP1pvmZCyTI02JkMcyiag4MCjoUhoKP2Lv8WvJzbfesgi-wQnFjB31s3td9EIzQa8SOkgU0kjRk7V-uqXVfISafxuGX1LIOX3Lpn4BPUmA6LXXt2Vkn2eUVQ-AKeMHfXvY'
    ],
    colors: [
      { name: 'Raw Indigo', hex: '#1E3A8A' },
      { name: 'Overdyed Black', hex: '#111827' }
    ],
    sizes: [
      { size: '30', available: true },
      { size: '32', available: true },
      { size: '34', available: true },
      { size: '36', available: true }
    ],
    description: 'Woven on vintage shuttle looms using 100% long-staple cotton in Japan. Finished with copper donut buttons, hidden rivets, and classic pink selvedge ID line.',
    detailsAndCare: [
      '14oz Japanese Selvedge Denim',
      'Button fly with custom branded hardware',
      'Chain-stitched waistband and hem',
      'Wash inside out in cold water after 6 months wear'
    ],
    shippingAndReturns: 'Complimentary shipping on all denim.',
    isNew: false,
    material: 'Raw Selvedge Denim'
  },
  {
    id: 'minimalist-urban-cargos',
    name: 'Minimalist Urban Cargos',
    subtitle: 'Water-repellent Stretch Twill',
    price: 195,
    category: 'cargos',
    categoryLabel: 'Cargos',
    breadcrumb: 'Men / Utility / Cargos',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC2HXuPXpesZ6_qB5XnwfkBmpRnYuFb8nHFrS-dJtO6zhvox75ror-SWKSnyps_7GIpZSG1z6XQxcYh7fWO7gHYQAKLsJlSimZRAa2LzlZif_fvFj3YXDFatJplqaC80CqskY-W0057Hk-Ap-J9LN9I7EdA0p_Diqsz6M_JyREgwzfr7Y1irJqa8DAxBT0V2ZXORwhP1L3pNTBliSGe36QrWr9_LwpTn5X3Q3DaHebBhpW2DMrcXsMA'
    ],
    colors: [
      { name: 'Concrete Grey', hex: '#6B7280' },
      { name: 'Deep Olive', hex: '#374151' },
      { name: 'Black', hex: '#0F172A' }
    ],
    sizes: [
      { size: 'S', available: true },
      { size: 'M', available: true },
      { size: 'L', available: true },
      { size: 'XL', available: true }
    ],
    description: 'Clean utilitarian trousers engineered with flush, hidden magnetic snap cargo pockets. Cut in a subtle articulated taper for fluid mobility.',
    detailsAndCare: [
      '92% Technical Polyamide, 8% Elastane',
      'DWR water-repellent coating',
      'Concealed zippered security pockets',
      'Machine wash cold, quick dry'
    ],
    shippingAndReturns: 'Complimentary express shipping on orders over $150.',
    isNew: true,
    material: 'Stretch Twill'
  }
];

export const INITIAL_CART: CartItem[] = [
  {
    id: 'cart-1',
    productId: 'architectural-blazer',
    product: PRODUCTS[0],
    selectedColor: 'Onyx Black',
    selectedSize: '40R',
    quantity: 1,
    price: 495
  },
  {
    id: 'cart-2',
    productId: 'poplin-structured-shirt',
    product: PRODUCTS[5],
    selectedColor: 'Optic White',
    selectedSize: '15.5',
    quantity: 1,
    price: 185
  }
];
