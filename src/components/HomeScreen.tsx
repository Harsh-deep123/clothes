import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { CATEGORIES, PRODUCTS } from '../data/products';
import { Product, ViewScreen } from '../types';

interface HomeScreenProps {
  onNavigate: (screen: ViewScreen, category?: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onSelectProduct,
  onQuickView,
}) => {
  const heroImage =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCoNTKR2w3IhKcW6dyF0UGYP2cyGcDVs7yiGoliDHklawXKsNyQgn79idpmxZehHh-2_BuFYyhINufju3dDfGz2PbiMvfwqd4J3ODeUy3DcEFKQewPq9fS-XIiEsLB4j2q5N0n1omEb-JHbVIh-JTiSL82qHbbPHia4VbPoEX7221RLPohJaOSNFG-fB_ThiqdCR2YfYCUhDaBRkdLE99FoUehZXTpwN4ykBT_8s0NN5YMdj3bCcKKe';

  const spotlightImage =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDOCDR0FJjVdaAr7HpOh6PdzopTe3W778rt3S7SRKqf7ulGYXBoHT2L5z8Ftp27SACa1aOGEpFIV2SQMcJQIBB4QFQ4TcyYqySMyVbzpHVmJHCyYZRBoNQbHHf6_uVi-EYTmNZK5DPN0GZdC55e53ALkMcus_467bLtoCEw2vmTfWrrxVG6xBWXHMW0j--zZyTfBEYj_CqgK8jjPzAuf17Ps0DY-QVXtvd6UtDS64dcfTWdip-dkSwi';

  const featuredBlazer = PRODUCTS.find((p) => p.id === 'architectural-blazer') || PRODUCTS[0];

  return (
    <main className="flex-grow">
      {/* Hero Section */}
      <section className="relative w-full h-[750px] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-100"
          style={{ backgroundImage: `url('${heroImage}')` }}
        />
        <div className="absolute inset-0 bg-black/35 mix-blend-multiply" />

        <div className="relative z-10 flex flex-col items-center text-center px-5 md:px-16 max-w-4xl mx-auto mt-16">
          <h1
            id="hero-title"
            className="font-serif-luxury text-4xl sm:text-6xl md:text-7xl lg:text-[76px] leading-[1.05] text-white mb-6 tracking-tight uppercase"
          >
            Define Your Style
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-10 max-w-2xl font-light leading-relaxed">
            Premium menswear designed for the way you move. Elevate your everyday aesthetic with our latest editorial collection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              id="hero-shop-new-arrivals"
              onClick={() => onNavigate('new-arrivals')}
              className="bg-black text-white text-xs font-semibold uppercase px-8 py-4 tracking-[0.2em] hover:bg-neutral-800 transition-colors w-full sm:w-auto cursor-pointer active:scale-95"
            >
              Shop New Arrivals
            </button>
            <button
              id="hero-explore-collection"
              onClick={() => onSelectProduct(featuredBlazer)}
              className="bg-transparent border border-white text-white text-xs font-semibold uppercase px-8 py-4 tracking-[0.2em] hover:bg-white hover:text-black transition-colors w-full sm:w-auto cursor-pointer active:scale-95"
            >
              Explore Collection
            </button>
          </div>
        </div>
      </section>

      {/* Bento Grid: Shop by Category */}
      <section className="py-20 md:py-28 px-5 md:px-16 max-w-[1440px] mx-auto">
        <h2 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl text-black mb-12 md:mb-16 text-center uppercase tracking-tight font-normal">
          Shop by Category
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[340px] md:auto-rows-[390px]">
          {/* Category 1: Jackets & Outerwear (Large 2x2) */}
          <div
            id="category-card-jackets"
            onClick={() => onNavigate('category', 'jackets')}
            className="relative group overflow-hidden md:col-span-2 md:row-span-2 bg-[#eeeeee] cursor-pointer"
          >
            <img
              src={CATEGORIES[0].image}
              alt="Jackets & Outerwear"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-75 group-hover:opacity-85 transition-opacity" />
            <div className="absolute bottom-8 left-8 right-8">
              <span className="text-[11px] text-white/70 uppercase tracking-[0.2em] font-semibold mb-2 block">
                Editorial Tailoring
              </span>
              <h3 className="font-serif-luxury text-2xl md:text-4xl text-white mb-3">
                Jackets & Outerwear
              </h3>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-white border-b border-white pb-1 group-hover:opacity-75 transition-opacity">
                <span>Shop Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Category 2: T-Shirts */}
          <div
            id="category-card-tshirts"
            onClick={() => onNavigate('category', 't-shirts')}
            className="relative group overflow-hidden bg-[#eeeeee] cursor-pointer"
          >
            <img
              src={CATEGORIES[1].image}
              alt="T-Shirts"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-65 group-hover:opacity-80 transition-opacity" />
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="font-serif-luxury text-xl md:text-2xl text-white mb-2">
                T-Shirts
              </h3>
              <span className="text-[11px] uppercase tracking-[0.15em] font-semibold text-white/90 group-hover:underline">
                Shop Now
              </span>
            </div>
          </div>

          {/* Category 3: Jeans */}
          <div
            id="category-card-jeans"
            onClick={() => onNavigate('category', 'jeans')}
            className="relative group overflow-hidden bg-[#eeeeee] cursor-pointer"
          >
            <img
              src={CATEGORIES[2].image}
              alt="Jeans"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-65 group-hover:opacity-80 transition-opacity" />
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="font-serif-luxury text-xl md:text-2xl text-white mb-2">
                Jeans
              </h3>
              <span className="text-[11px] uppercase tracking-[0.15em] font-semibold text-white/90 group-hover:underline">
                Shop Now
              </span>
            </div>
          </div>

          {/* Category 4: Cargos */}
          <div
            id="category-card-cargos"
            onClick={() => onNavigate('category', 'cargos')}
            className="relative group overflow-hidden bg-[#eeeeee] cursor-pointer"
          >
            <img
              src={CATEGORIES[3].image}
              alt="Cargos"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-65 group-hover:opacity-80 transition-opacity" />
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="font-serif-luxury text-xl md:text-2xl text-white mb-2">
                Cargos
              </h3>
              <span className="text-[11px] uppercase tracking-[0.15em] font-semibold text-white/90 group-hover:underline">
                Shop Now
              </span>
            </div>
          </div>

          {/* Category 5: Shirts (2-col span on md) */}
          <div
            id="category-card-shirts"
            onClick={() => onNavigate('category', 'shirts')}
            className="relative group overflow-hidden md:col-span-2 bg-[#eeeeee] cursor-pointer"
          >
            <img
              src={CATEGORIES[4].image}
              alt="Shirts"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-70 group-hover:opacity-85 transition-opacity" />
            <div className="absolute bottom-8 left-8 right-8">
              <span className="text-[11px] text-white/70 uppercase tracking-[0.2em] font-semibold mb-2 block">
                Pure Giza & Egyptian Poplin
              </span>
              <h3 className="font-serif-luxury text-2xl md:text-3xl text-white mb-3">
                Shirts
              </h3>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-white border-b border-white pb-1 group-hover:opacity-75 transition-opacity">
                <span>Shop Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spotlight Feature: "The New Standard" */}
      <section className="bg-white border-y border-[#cfc4c5]/30 py-16 md:py-24">
        <div className="max-w-[1440px] mx-auto px-5 md:px-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="w-full aspect-[4/5] bg-[#f3f3f4] overflow-hidden relative group">
            <img
              src={spotlightImage}
              alt="The New Standard Editorial"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="flex flex-col justify-center items-start md:pl-8">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-[#5d5f5f] mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Editorial Series 04</span>
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl text-black mb-6 leading-tight">
              The New Standard
            </h2>
            <p className="text-base text-[#5d5f5f] leading-relaxed mb-8 max-w-md">
              Redefining modern silhouettes through precision tailoring and uncompromising materials. Explore the latest additions to the ZAYRO collection.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                id="spotlight-blazer-btn"
                onClick={() => onSelectProduct(featuredBlazer)}
                className="bg-black text-white text-xs uppercase tracking-[0.2em] font-semibold px-8 py-4 hover:bg-neutral-800 transition-colors"
              >
                Explore Architectural Blazer
              </button>
              <button
                id="spotlight-new-arrivals-btn"
                onClick={() => onNavigate('new-arrivals')}
                className="border border-black text-black text-xs uppercase tracking-[0.2em] font-semibold px-8 py-4 hover:bg-black hover:text-white transition-colors"
              >
                View Lookbook
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Editorial Catalog Preview */}
      <section className="py-20 md:py-28 px-5 md:px-16 max-w-[1440px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div>
            <span className="text-[11px] text-[#5d5f5f] uppercase tracking-[0.2em] font-semibold block mb-2">
              Curated Selection
            </span>
            <h2 className="font-serif-luxury text-3xl md:text-4xl text-black tracking-tight">
              Latest Additions
            </h2>
          </div>
          <button
            onClick={() => onNavigate('new-arrivals')}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-semibold text-black border-b border-black pb-1 hover:opacity-60 transition-opacity"
          >
            <span>View All Arrivals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRODUCTS.slice(0, 4).map((product) => (
            <div
              key={product.id}
              id={`home-product-${product.id}`}
              className="group cursor-pointer flex flex-col"
              onClick={() => onSelectProduct(product)}
            >
              <div className="relative aspect-[3/4] bg-[#f3f3f4] overflow-hidden mb-4 border border-[#cfc4c5]/20">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                {product.isNew && (
                  <span className="absolute top-3 left-3 bg-black text-white text-[10px] uppercase font-bold tracking-widest px-2 py-0.5">
                    New
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickView(product);
                  }}
                  className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-xs text-black text-[11px] uppercase tracking-widest py-2.5 font-semibold opacity-0 group-hover:opacity-100 transition-opacity text-center hover:bg-black hover:text-white"
                >
                  Quick View
                </button>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-black group-hover:underline underline-offset-4">
                    {product.name}
                  </h3>
                  <p className="text-xs text-[#5d5f5f] mt-1">{product.subtitle}</p>
                </div>
                <span className="text-sm font-semibold text-black">${product.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
