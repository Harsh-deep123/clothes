import React, { useEffect, useRef } from 'react';
import { ArrowRight, Heart, Sparkles } from 'lucide-react';
import { CATEGORIES } from '../data/products';
import { Product, ViewScreen } from '../types';
import { ProductBadges, ProductPrice } from './ProductPrice';
import { ProductRatingSummary } from './ProductRatingSummary';
import { useStorefrontProducts } from '../hooks/useCatalog';

interface HomeScreenProps {
  onNavigate: (screen: ViewScreen, category?: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuickView: (product: Product) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onSelectProduct,
  onQuickView,
  wishlist,
  onToggleWishlist,
}) => {
  const heroImage =
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=2400&q=80';
  const stageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const jacketRef = useRef<HTMLImageElement>(null);
  const teeRef = useRef<HTMLImageElement>(null);
  const jeansRef = useRef<HTMLImageElement>(null);
  const cargosRef = useRef<HTMLImageElement>(null);
  const shirtsRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const hero = heroRef.current;
    if (!stage || !hero) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onMove = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    const onLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const tick = (time: number) => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      const driftX = Math.sin(time / 3200) * 5.5;
      const driftY = Math.cos(time / 4100) * 3.5;
      const rotateY = driftX + currentX * 7;
      const rotateX = driftY - currentY * 5.5;
      const shiftX = driftX * 1.6 + currentX * 18;
      const shiftY = driftY * 1.2 + currentY * 12;
      stage.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(${shiftX}px, ${shiftY}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    hero.addEventListener('pointermove', onMove);
    hero.addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  const spotlightImage = '/images/new-standard-editorial.jpg';

  const products = useStorefrontProducts();
  const featuredBlazer = products.find((p) => p.id === 'architectural-blazer') || products[0];

  return (
    <main className="flex-grow">
      {/* Hero Section */}
      <section
        ref={heroRef}
        data-hero
        className="zayro-hero relative w-full h-[750px] min-h-[600px] flex items-center justify-center overflow-hidden [perspective:1400px]"
      >
        <div ref={stageRef} className="zayro-hero-stage absolute -inset-[12%] [transform-style:preserve-3d]">
          <div className="zayro-hero-depth absolute inset-[8%] bg-black/25 blur-3xl" />
          <div
            className="zayro-hero-plate absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${heroImage}')` }}
          />
          <div className="zayro-hero-sheen pointer-events-none absolute inset-0" />
        </div>
        <div className="absolute inset-0 bg-black/40 mix-blend-multiply" />

        <div className="zayro-hero-copy relative z-10 flex flex-col items-center text-center px-5 md:px-16 max-w-4xl mx-auto mt-16">
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
              className="zayro-btn-press bg-black text-white text-xs font-semibold uppercase px-8 py-4 tracking-[0.2em] hover:bg-neutral-800 transition-colors w-full sm:w-auto cursor-pointer"
            >
              Shop New Arrivals
            </button>
            <button
              id="hero-explore-collection"
              onClick={() => featuredBlazer && onSelectProduct(featuredBlazer)}
              className="zayro-btn-press bg-transparent border border-white text-white text-xs font-semibold uppercase px-8 py-4 tracking-[0.2em] hover:bg-white hover:text-black transition-colors w-full sm:w-auto cursor-pointer"
            >
              Explore Collection
            </button>
          </div>
        </div>
      </section>

      {/* Bento Grid: Shop by Category */}
      <section className="zayro-reveal py-20 md:py-28 px-5 md:px-16 max-w-[1440px] mx-auto">
        <h2 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl text-black mb-12 md:mb-16 text-center uppercase tracking-tight font-normal">
          Shop by Category
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[340px] md:auto-rows-[390px]">
          {/* Category 1: Jackets & Outerwear (Large 2x2) */}
          <div
            id="category-card-jackets"
            onClick={() => onNavigate('category', 'jackets')}
            className="relative group overflow-hidden md:col-span-2 md:row-span-2 bg-[#eeeeee] md:bg-[#A78F6D] cursor-pointer [perspective:1200px]"
            onPointerMove={(event) => {
              const img = jacketRef.current;
              if (!img || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
              const rect = event.currentTarget.getBoundingClientRect();
              const x = (event.clientX - rect.left) / rect.width - 0.5;
              const y = (event.clientY - rect.top) / rect.height - 0.5;
              const desktop = window.matchMedia('(min-width: 768px)').matches;
              const scale = desktop ? 0.92 : 1;
              img.style.transform = `rotateX(${(-y * 16).toFixed(2)}deg) rotateY(${(x * 20).toFixed(2)}deg) translateZ(28px) scale(${scale})`;
            }}
            onPointerLeave={() => {
              const img = jacketRef.current;
              if (!img) return;
              img.style.transform = window.matchMedia('(min-width: 768px)').matches ? 'scale(0.92)' : '';
            }}
          >
            <img
              ref={jacketRef}
              src={CATEGORIES[0].image}
              alt="Jackets & Outerwear"
              className="zayro-jacket-tilt absolute inset-0 w-full h-full object-cover md:object-contain md:object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-75 group-hover:opacity-85 transition-opacity" />
            <div className="absolute bottom-8 left-8 right-8">
              <span className="text-[11px] text-white/70 uppercase tracking-[0.2em] font-semibold mb-2 block">
                Editorial Tailoring
              </span>
              <h3 className="font-serif-luxury text-2xl md:text-4xl text-white mb-3">
                Jackets & Outerwear
              </h3>
              <div className="zayro-shop-cta inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-white border-b border-white pb-1 group-hover:opacity-75 transition-opacity">
                <span>Shop Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Category 2: T-Shirts */}
          <div
            id="category-card-tshirts"
            onClick={() => onNavigate('category', 't-shirts')}
            className="relative group overflow-hidden bg-[#eeeeee] cursor-pointer [perspective:1200px]"
            onPointerMove={(event) => {
              const img = teeRef.current;
              if (!img || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
              const rect = event.currentTarget.getBoundingClientRect();
              const x = (event.clientX - rect.left) / rect.width - 0.5;
              const y = (event.clientY - rect.top) / rect.height - 0.5;
              img.style.transform = `rotateX(${(-y * 16).toFixed(2)}deg) rotateY(${(x * 20).toFixed(2)}deg) translateZ(28px)`;
            }}
            onPointerLeave={() => {
              const img = teeRef.current;
              if (!img) return;
              img.style.transform = '';
            }}
          >
            <img
              ref={teeRef}
              src={CATEGORIES[1].image}
              alt="T-Shirts"
              className="zayro-card-tilt absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-65 group-hover:opacity-80 transition-opacity" />
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="font-serif-luxury text-xl md:text-2xl text-white mb-2">
                T-Shirts
              </h3>
              <span className="zayro-shop-cta text-[11px] uppercase tracking-[0.15em] font-semibold text-white/90 group-hover:underline inline-flex items-center gap-1.5">
                Shop Now
              </span>
            </div>
          </div>

          {/* Category 3: Jeans */}
          <div
            id="category-card-jeans"
            onClick={() => onNavigate('category', 'jeans')}
            className="relative group overflow-hidden bg-[#eeeeee] cursor-pointer [perspective:1200px]"
            onPointerMove={(event) => {
              const img = jeansRef.current;
              if (!img || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
              const rect = event.currentTarget.getBoundingClientRect();
              const x = (event.clientX - rect.left) / rect.width - 0.5;
              const y = (event.clientY - rect.top) / rect.height - 0.5;
              img.style.transform = `rotateX(${(-y * 16).toFixed(2)}deg) rotateY(${(x * 20).toFixed(2)}deg) translateZ(28px)`;
            }}
            onPointerLeave={() => {
              const img = jeansRef.current;
              if (!img) return;
              img.style.transform = '';
            }}
          >
            <img
              ref={jeansRef}
              src={CATEGORIES[2].image}
              alt="Jeans"
              className="zayro-card-tilt absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-65 group-hover:opacity-80 transition-opacity" />
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="font-serif-luxury text-xl md:text-2xl text-white mb-2">
                Jeans
              </h3>
              <span className="zayro-shop-cta text-[11px] uppercase tracking-[0.15em] font-semibold text-white/90 group-hover:underline inline-flex items-center gap-1.5">
                Shop Now
              </span>
            </div>
          </div>

          {/* Category 4: Cargos */}
          <div
            id="category-card-cargos"
            onClick={() => onNavigate('category', 'cargos')}
            className="relative group overflow-hidden bg-[#eeeeee] cursor-pointer [perspective:1200px]"
            onPointerMove={(event) => {
              const img = cargosRef.current;
              if (!img || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
              const rect = event.currentTarget.getBoundingClientRect();
              const x = (event.clientX - rect.left) / rect.width - 0.5;
              const y = (event.clientY - rect.top) / rect.height - 0.5;
              img.style.transform = `rotateX(${(-y * 16).toFixed(2)}deg) rotateY(${(x * 20).toFixed(2)}deg) translateZ(28px)`;
            }}
            onPointerLeave={() => {
              const img = cargosRef.current;
              if (!img) return;
              img.style.transform = '';
            }}
          >
            <img
              ref={cargosRef}
              src={CATEGORIES[3].image}
              alt="Cargos"
              className="zayro-card-tilt absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-65 group-hover:opacity-80 transition-opacity" />
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="font-serif-luxury text-xl md:text-2xl text-white mb-2">
                Cargos
              </h3>
              <span className="zayro-shop-cta text-[11px] uppercase tracking-[0.15em] font-semibold text-white/90 group-hover:underline inline-flex items-center gap-1.5">
                Shop Now
              </span>
            </div>
          </div>

          {/* Category 5: Shirts (2-col span on md) */}
          <div
            id="category-card-shirts"
            onClick={() => onNavigate('category', 'shirts')}
            className="relative group overflow-hidden md:col-span-2 bg-[#d6d0c8] cursor-pointer [perspective:1200px]"
            onPointerMove={(event) => {
              const stage = shirtsRef.current;
              if (!stage || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
              const rect = event.currentTarget.getBoundingClientRect();
              const x = (event.clientX - rect.left) / rect.width - 0.5;
              const y = (event.clientY - rect.top) / rect.height - 0.5;
              stage.style.transform = `rotateX(${(-y * 16).toFixed(2)}deg) rotateY(${(x * 20).toFixed(2)}deg) translateZ(28px)`;
            }}
            onPointerLeave={() => {
              const stage = shirtsRef.current;
              if (!stage) return;
              stage.style.transform = '';
            }}
          >
            <div
              ref={shirtsRef}
              className="zayro-card-tilt absolute inset-0 grid grid-cols-3"
            >
              <img
                src="/images/shirt-sage.jpg"
                alt="Sage shirt"
                className="w-full h-full object-cover object-top"
              />
              <img
                src="/images/shirt-green-plaid.jpg"
                alt="Green plaid shirt"
                className="w-full h-full object-cover object-top"
              />
              <img
                src="/images/shirt-brown-plaid.jpg"
                alt="Brown plaid shirt"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-70 group-hover:opacity-85 transition-opacity" />
            <div className="absolute bottom-8 left-8 right-8">
              <span className="text-[11px] text-white/70 uppercase tracking-[0.2em] font-semibold mb-2 block">
                Pure Giza & Egyptian Poplin
              </span>
              <h3 className="font-serif-luxury text-2xl md:text-3xl text-white mb-3">
                Shirts
              </h3>
              <div className="zayro-shop-cta inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-white border-b border-white pb-1 group-hover:opacity-75 transition-opacity">
                <span>Shop Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spotlight Feature: "The New Standard" */}
      <section className="zayro-reveal bg-white border-y border-[#cfc4c5]/30 py-16 md:py-24">
        <div className="max-w-[1440px] mx-auto px-5 md:px-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div
            className="w-full aspect-[4/5] bg-[#f3f3f4] overflow-hidden relative group [perspective:1200px]"
            onPointerMove={(event) => {
              const img = spotlightRef.current;
              if (!img || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
              const rect = event.currentTarget.getBoundingClientRect();
              const x = (event.clientX - rect.left) / rect.width - 0.5;
              const y = (event.clientY - rect.top) / rect.height - 0.5;
              img.style.transform = `rotateX(${(-y * 16).toFixed(2)}deg) rotateY(${(x * 20).toFixed(2)}deg) translateZ(28px)`;
            }}
            onPointerLeave={() => {
              const img = spotlightRef.current;
              if (!img) return;
              img.style.transform = '';
            }}
          >
            <img
              ref={spotlightRef}
              src={spotlightImage}
              alt="The New Standard Editorial"
              className="zayro-card-tilt w-full h-full object-cover"
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
                onClick={() => featuredBlazer && onSelectProduct(featuredBlazer)}
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
      <section className="zayro-reveal py-20 md:py-28 px-5 md:px-16 max-w-[1440px] mx-auto">
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
          {products.slice(0, 4).map((product) => (
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
                <ProductBadges product={product} />
                <button
                  type="button"
                  aria-label={wishlist.includes(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlist(product.id);
                  }}
                  className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all active:scale-90 ${
                    wishlist.includes(product.id)
                      ? 'bg-black text-white'
                      : 'bg-white/70 text-black hover:bg-white'
                  }`}
                >
                  <Heart
                    className="w-4 h-4"
                    fill={wishlist.includes(product.id) ? '#ffffff' : 'transparent'}
                  />
                </button>
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
                  <ProductRatingSummary productId={product.id} showEmpty className="mt-1" />
                  <p className="text-xs text-[#5d5f5f] mt-1">{product.subtitle}</p>
                </div>
                <ProductPrice product={product} className="text-sm font-semibold text-black" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
