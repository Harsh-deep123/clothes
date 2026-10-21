import React, { useEffect, useRef } from 'react';
import { ArrowRight, Heart, Package, RefreshCw, Sparkles, Truck } from 'lucide-react';
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

const DEPARTMENTS: { slug: string; name: string; note: string; image: string }[] = [
  {
    slug: 'jewellery',
    name: 'Jewellery & Accessories',
    note: 'Rings, chains and everyday pieces',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1400&q=80',
  },
  {
    slug: 'women',
    name: "Women's Clothing",
    note: 'Kurtis, sarees and ready-to-wear',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1400&q=80',
  },
  {
    slug: 'kitchen',
    name: 'Kitchen',
    note: 'Cookware, tiffins and essentials',
    image: 'https://images.unsplash.com/photo-1556912173-46c336c7fd55?auto=format&fit=crop&w=1400&q=80',
  },
  {
    slug: 't-shirts',
    name: 'T-Shirts',
    note: 'Everyday tees',
    image: '/images/black-tshirt.jpg',
  },
  {
    slug: 'shirts',
    name: 'Shirts',
    note: 'Casual and formal shirts',
    image: '/images/shirt-sage.jpg',
  },
  {
    slug: 'home-decor',
    name: 'Home & Decor',
    note: 'Pieces for living spaces',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=80',
  },
  {
    slug: 'health-beauty',
    name: 'Health & Beauty',
    note: 'Skincare, wellness and care',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1400&q=80',
  },
  {
    slug: 'stationery-office',
    name: 'Stationery & Office',
    note: 'Desk and study supplies',
    image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1400&q=80',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onSelectProduct,
  onQuickView,
  wishlist,
  onToggleWishlist,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const products = useStorefrontProducts();
  const latest = products.slice(0, 8);

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

  return (
    <main className="flex-grow">
      <section
        ref={heroRef}
        data-hero
        className="zayro-hero relative w-full h-[750px] min-h-[600px] flex items-center justify-center overflow-hidden [perspective:1400px]"
      >
        <div ref={stageRef} className="zayro-hero-stage absolute -inset-[12%] [transform-style:preserve-3d]">
          <div className="zayro-hero-depth absolute inset-[8%] bg-black/25 blur-3xl" />
          <div className="zayro-hero-plate absolute inset-0 grid grid-cols-2 md:grid-cols-4">
            {DEPARTMENTS.slice(0, 4).map((dept) => (
              <img
                key={dept.slug}
                src={dept.image}
                alt=""
                className="h-full w-full object-cover"
              />
            ))}
          </div>
          <div className="zayro-hero-sheen pointer-events-none absolute inset-0" />
        </div>
        <div className="absolute inset-0 bg-black/50 mix-blend-multiply" />

        <div className="zayro-hero-copy relative z-10 flex flex-col items-center text-center px-5 md:px-16 max-w-4xl mx-auto mt-16">
          <p className="text-[11px] sm:text-xs uppercase tracking-[0.35em] text-white/80 mb-4 font-semibold">
            Welcome to
          </p>
          <h1
            id="hero-title"
            className="font-serif-luxury text-4xl sm:text-6xl md:text-7xl lg:text-[76px] leading-[1.05] text-white mb-6 tracking-tight uppercase"
          >
            Zayro Store
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-10 max-w-2xl font-light leading-relaxed">
            Jewellery, clothing, kitchen, home and everyday essentials — all in one store.
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
              onClick={() => document.getElementById('home-departments')?.scrollIntoView({ behavior: 'smooth' })}
              className="zayro-btn-press bg-transparent border border-white text-white text-xs font-semibold uppercase px-8 py-4 tracking-[0.2em] hover:bg-white hover:text-black transition-colors w-full sm:w-auto cursor-pointer"
            >
              Browse Store
            </button>
          </div>
        </div>
      </section>

      <section className="border-b border-[#cfc4c5]/30 bg-white">
        <div className="max-w-[1440px] mx-auto px-5 md:px-16 py-8 md:py-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: Truck, title: 'Complimentary shipping', text: 'On eligible orders across India' },
            { icon: RefreshCw, title: 'Easy returns', text: 'Hassle-free returns on most items' },
            { icon: Package, title: 'Many aisles, one store', text: 'Shop clothing, home, kitchen and more' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-4">
              <item.icon className="w-5 h-5 stroke-[1.5] text-black mt-0.5 shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] font-semibold text-black">{item.title}</p>
                <p className="text-sm text-[#5d5f5f] mt-1">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="home-departments" className="zayro-reveal py-20 md:py-28 px-5 md:px-16 max-w-[1440px] mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <span className="text-[11px] text-[#5d5f5f] uppercase tracking-[0.2em] font-semibold block mb-3">
            Departments
          </span>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl text-black uppercase tracking-tight font-normal">
            Shop by Category
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept.slug}
              id={`category-card-${dept.slug}`}
              type="button"
              onClick={() => onNavigate('category', dept.slug)}
              className="relative group overflow-hidden bg-[#eeeeee] aspect-[3/4] text-left cursor-pointer"
            >
              <img
                src={dept.image}
                alt={dept.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              <div className="absolute bottom-5 left-4 right-4 md:bottom-6 md:left-5 md:right-5">
                <h3 className="font-serif-luxury text-lg sm:text-xl md:text-2xl text-white mb-1 leading-tight">
                  {dept.name}
                </h3>
                <p className="text-[11px] text-white/75 mb-2 hidden sm:block">{dept.note}</p>
                <span className="zayro-shop-cta inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] font-semibold text-white/90 group-hover:underline">
                  Shop now
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="zayro-reveal bg-white border-y border-[#cfc4c5]/30 py-16 md:py-24">
        <div className="max-w-[1440px] mx-auto px-5 md:px-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="grid grid-cols-2 gap-3">
            {DEPARTMENTS.slice(0, 4).map((dept) => (
              <button
                key={`spotlight-${dept.slug}`}
                type="button"
                onClick={() => onNavigate('category', dept.slug)}
                className="relative aspect-square overflow-hidden bg-[#f3f3f4] cursor-pointer group"
              >
                <img
                  src={dept.image}
                  alt={dept.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </button>
            ))}
          </div>
          <div className="flex flex-col justify-center items-start md:pl-8">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-[#5d5f5f] mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zayro Store</span>
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl text-black mb-6 leading-tight">
              Everything in one place
            </h2>
            <p className="text-base text-[#5d5f5f] leading-relaxed mb-8 max-w-md">
              From jewellery and clothing to kitchen and home, find everyday products across the store — added and updated from admin as you grow.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                id="spotlight-blazer-btn"
                onClick={() => document.getElementById('home-departments')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-black text-white text-xs uppercase tracking-[0.2em] font-semibold px-8 py-4 hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Browse Departments
              </button>
              <button
                id="spotlight-new-arrivals-btn"
                onClick={() => onNavigate('new-arrivals')}
                className="border border-black text-black text-xs uppercase tracking-[0.2em] font-semibold px-8 py-4 hover:bg-black hover:text-white transition-colors cursor-pointer"
              >
                New Arrivals
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="zayro-reveal py-20 md:py-28 px-5 md:px-16 max-w-[1440px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div>
            <span className="text-[11px] text-[#5d5f5f] uppercase tracking-[0.2em] font-semibold block mb-2">
              From the store
            </span>
            <h2 className="font-serif-luxury text-3xl md:text-4xl text-black tracking-tight">
              Latest Additions
            </h2>
          </div>
          <button
            onClick={() => onNavigate('new-arrivals')}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-semibold text-black border-b border-black pb-1 hover:opacity-60 transition-opacity cursor-pointer"
          >
            <span>View all products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {latest.map((product) => (
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

              <div className="flex justify-between items-start gap-2">
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
