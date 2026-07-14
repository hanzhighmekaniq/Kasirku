import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Minus, Package, Plus, ShoppingCart, Sparkles } from "lucide-react";

import noodleImg from "@/assets/product-noodle.jpg";
import waterImg from "@/assets/product-water.jpg";
import sodaImg from "@/assets/product-soda.jpg";
import oilImg from "@/assets/product-oil.jpg";

export const Route = createFileRoute("/")({
  component: POSPage,
});

type Variant = { label: string; price: number; note?: string };
type Product = {
  id: string;
  name: string;
  brand: string;
  image: string;
  stock: number;
  tag?: string;
  variants: Variant[];
};

const PRODUCTS: Product[] = [
  {
    id: "mie",
    name: "Mie Instan Goreng",
    brand: "Sedaap Premium",
    image: noodleImg,
    stock: 42,
    tag: "Best Seller",
    variants: [
      { label: "1 Pcs", price: 3500 },
      { label: "1 Dus", price: 105000, note: "isi 40" },
      { label: "3 Dus", price: 300000, note: "hemat 5%" },
    ],
  },
  {
    id: "air",
    name: "Air Mineral 600ml",
    brand: "Aqualite",
    image: waterImg,
    stock: 8,
    tag: "Stok Menipis",
    variants: [
      { label: "1 Botol", price: 4000 },
      { label: "1 Dus", price: 48000, note: "isi 24" },
    ],
  },
  {
    id: "soda",
    name: "Minuman Soda Kaleng",
    brand: "FizzCo",
    image: sodaImg,
    stock: 0,
    variants: [
      { label: "1 Kaleng", price: 8000 },
      { label: "1 Dus", price: 180000, note: "isi 24" },
      { label: "3 Dus", price: 510000, note: "hemat 8%" },
    ],
  },
  {
    id: "minyak",
    name: "Minyak Goreng 1L",
    brand: "SunGold",
    image: oilImg,
    stock: 24,
    variants: [
      { label: "1 Botol", price: 18500 },
      { label: "1 Dus", price: 210000, note: "isi 12" },
    ],
  },
];

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

function ProductCard({
  product,
  qty,
  selectedVariant,
  onSelectVariant,
  onInc,
  onDec,
  onAdd,
}: {
  product: Product;
  qty: number;
  selectedVariant: number;
  onSelectVariant: (i: number) => void;
  onInc: () => void;
  onDec: () => void;
  onAdd: () => void;
}) {
  const outOfStock = product.stock === 0;
  const low = product.stock > 0 && product.stock <= 10;
  const variant = product.variants[selectedVariant];

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 ${
        outOfStock ? "opacity-70" : ""
      }`}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/40">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={1024}
          height={1024}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
            outOfStock ? "grayscale" : ""
          }`}
        />

        {/* Stock badge */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              outOfStock
                ? "bg-destructive"
                : low
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            } ${!outOfStock ? "animate-pulse" : ""}`}
          />
          {outOfStock
            ? "Stok Habis"
            : low
              ? `Sisa ${product.stock}`
              : `Stok ${product.stock}`}
        </div>

        {/* Tag */}
        {product.tag && !outOfStock && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-md">
            <Sparkles className="h-3 w-3" />
            {product.tag}
          </div>
        )}

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px]">
            <span className="rounded-full bg-destructive px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-destructive-foreground shadow-lg">
              Habis
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {product.brand}
          </p>
          <h3 className="mt-0.5 line-clamp-1 font-semibold text-foreground">
            {product.name}
          </h3>
        </div>

        {/* Variant selector */}
        <div className="grid grid-cols-3 gap-1.5">
          {product.variants.map((v, i) => {
            const active = i === selectedVariant;
            return (
              <button
                key={v.label}
                onClick={() => onSelectVariant(i)}
                disabled={outOfStock}
                className={`relative flex flex-col items-center rounded-xl border px-1 py-1.5 text-[11px] font-medium transition-all disabled:cursor-not-allowed ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "border-border bg-background text-foreground hover:border-primary/60 hover:bg-accent"
                } ${product.variants.length < 3 ? "col-span-1" : ""}`}
              >
                <span className="flex items-center gap-1">
                  {i > 0 && <Package className="h-3 w-3" />}
                  {v.label}
                </span>
                {v.note && (
                  <span
                    className={`text-[9px] ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                  >
                    {v.note}
                  </span>
                )}
              </button>
            );
          })}
          {/* Fill grid if fewer than 3 variants */}
          {Array.from({ length: 3 - product.variants.length }).map((_, i) => (
            <div key={`empty-${i}`} className="hidden" />
          ))}
        </div>

        {/* Price */}
        <div className="flex items-end justify-between pt-1">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Harga
            </p>
            <p className="text-lg font-bold leading-tight text-foreground">
              {rupiah(variant.price)}
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground">/ {variant.label}</p>
        </div>

        {/* Action row */}
        <div className="mt-1 flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-border bg-background p-0.5">
            <button
              onClick={onDec}
              disabled={outOfStock || qty === 0}
              className="flex h-7 w-7 items-center justify-center rounded-full text-foreground transition hover:bg-accent disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-5 text-center text-sm font-semibold tabular-nums">
              {qty}
            </span>
            <button
              onClick={onInc}
              disabled={outOfStock}
              className="flex h-7 w-7 items-center justify-center rounded-full text-foreground transition hover:bg-accent disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={onAdd}
            disabled={outOfStock}
            className="group/btn flex flex-1 items-center justify-center gap-1.5 rounded-full bg-foreground px-3 py-2 text-xs font-semibold text-background shadow-sm transition-all hover:bg-foreground/90 hover:shadow-md disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
          >
            {outOfStock ? (
              "Tidak Tersedia"
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5 transition-transform group-hover/btn:-rotate-12" />
                Tambah
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function POSPage() {
  const [variants, setVariants] = useState<Record<string, number>>({});
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<{ id: string; qty: number; variant: number }[]>(
    [],
  );
  const [flash, setFlash] = useState<string | null>(null);

  const setVar = (id: string, i: number) =>
    setVariants((s) => ({ ...s, [id]: i }));
  const inc = (id: string) => setQtys((s) => ({ ...s, [id]: (s[id] ?? 0) + 1 }));
  const dec = (id: string) =>
    setQtys((s) => ({ ...s, [id]: Math.max(0, (s[id] ?? 0) - 1) }));

  const addToCart = (p: Product) => {
    const qty = qtys[p.id] ?? 1;
    const variant = variants[p.id] ?? 0;
    const finalQty = qty === 0 ? 1 : qty;
    setCart((c) => [...c, { id: p.id, qty: finalQty, variant }]);
    setQtys((s) => ({ ...s, [p.id]: 0 }));
    setFlash(p.name);
    setTimeout(() => setFlash(null), 1500);
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const p = PRODUCTS.find((x) => x.id === item.id);
      if (!p) return sum;
      return sum + p.variants[item.variant].price * item.qty;
    }, 0);
  }, [cart]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                Toko Sembako POS
              </h1>
              <p className="text-xs text-muted-foreground">
                Kasir cepat &middot; {PRODUCTS.length} produk aktif
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
            <ShoppingCart className="h-4 w-4 text-foreground" />
            <span className="text-sm font-semibold tabular-nums">{cartCount}</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              &middot; {rupiah(cartTotal)}
            </span>
          </div>
        </div>
      </header>

      {/* Toast */}
      {flash && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg">
            <Check className="h-4 w-4" />
            {flash} ditambahkan
          </div>
        </div>
      )}

      {/* Grid */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Menu Produk
            </h2>
            <p className="text-sm text-muted-foreground">
              Pilih varian kemasan lalu tambahkan ke keranjang
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PRODUCTS.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              qty={qtys[p.id] ?? 0}
              selectedVariant={variants[p.id] ?? 0}
              onSelectVariant={(i) => setVar(p.id, i)}
              onInc={() => inc(p.id)}
              onDec={() => dec(p.id)}
              onAdd={() => addToCart(p)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
