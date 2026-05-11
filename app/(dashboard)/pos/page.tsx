"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  Camera,
  Smartphone,
  Search,
  Trash2,
  Pause,
  FolderOpen,
  Plus,
  Minus,
  X,
  Grid as GridIcon,
  List as ListIcon,
  Printer,
  Check,
  ExternalLink,
} from "lucide-react";
import QrDisplay from "@/components/ui/QrDisplay";
import { useSettings } from "@/contexts/SettingsContext";
import { usePDF } from "@/hooks/usePDF";
import { FloatingPopover } from "@/components/ui/FloatingPopover";

type ProductOption = {
  id: number;
  productId: string;
  name: string;
  sku: string | null;
  unit: string;
  salePrice: string;
  taxRate: string;
  status: string;
  imageUrl: string | null;
  category: { id: number; name: string } | null;
  stock: { quantity: number; threshold: number } | null;
};

type CategoryOption = { id: number; name: string };

type CustomerOption = {
  id: number;
  customerId: string;
  name: string;
  mobile: string;
  email: string | null;
};

type CartLine = {
  productId: number;
  productName: string;
  productCode: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  unit: string;
  stockQty: number | null;
};

type HeldOrder = {
  id: number;
  items: CartLine[];
  customerData: { id: number; name: string } | null;
  discount: number;
  notes: string | null;
  createdAt: string;
};

type SessionInfo = {
  sessionId: string;
  mobileUrl: string;
  expiresAt: string;
};

type SessionScan = {
  barcode: string;
  productId?: number;
  name?: string;
  at: string;
};

const PAYMENT_METHODS = ["Cash", "bKash", "Nagad", "Rocket", "Upay", "Bank", "Card"] as const;
const PAYMENT_STATUSES = ["paid", "partial", "unpaid"] as const;

export default function PosPage() {
  const { currency, settings, brandColor } = useSettings();

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [scanInput, setScanInput] = useState("");
  const scanInputRef = useRef<HTMLInputElement | null>(null);
  const customerSearchRef = useRef<HTMLInputElement | null>(null);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountMode, setDiscountMode] = useState<"fixed" | "percent">("fixed");
  const [discountValue, setDiscountValue] = useState<string>("0");

  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [paymentStatus, setPaymentStatus] = useState<(typeof PAYMENT_STATUSES)[number]>("paid");
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [cashTendered, setCashTendered] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraReaderRef = useRef<any>(null);

  const [mobileSession, setMobileSession] = useState<SessionInfo | null>(null);
  const [mobileQr, setMobileQr] = useState<string | null>(null);
  const [mobileStatus, setMobileStatus] = useState<string>("waiting");
  const processedScanRef = useRef<Set<string>>(new Set());

  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [showHeldDrawer, setShowHeldDrawer] = useState(false);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{
    id: number;
    orderId: string;
    totalAmount: string;
    paidAmount: string;
    paymentMethod: string | null;
    paymentStatus: string;
    items: { productName: string; quantity: number; unitPrice: string; totalPrice: string }[];
    customer: { name: string; customerId: string };
    createdAt: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { downloadPDF, printPDF, isLoading } = usePDF();

  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/products?pageSize=200");
    if (!res.ok) return;
    const data = await res.json();
    setProducts(data.items ?? []);
  }, []);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    if (!res.ok) return;
    const data = await res.json();
    setCategories(data.categories ?? []);
  }, []);

  const loadCustomers = useCallback(async () => {
    const res = await fetch("/api/customers?pageSize=200");
    if (!res.ok) return;
    const data = await res.json();
    setCustomers(data.items ?? []);
  }, []);

  const loadHeld = useCallback(async () => {
    const res = await fetch("/api/pos/held-orders");
    if (!res.ok) return;
    const data = await res.json();
    setHeldOrders(data.items ?? []);
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadCustomers();
    loadHeld();
  }, [loadProducts, loadCategories, loadCustomers, loadHeld]);

  useEffect(() => {
    scanInputRef.current?.focus();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCategory !== "all" && (p.category?.id ?? null) !== activeCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.productId.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, search, activeCategory]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers.slice(0, 20);
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.customerId.toLowerCase().includes(q) ||
          (c.mobile ?? "").includes(q)
      )
      .slice(0, 20);
  }, [customers, customerSearch]);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, l) => acc + l.quantity * l.unitPrice, 0);
    const tax = cart.reduce(
      (acc, l) => acc + (l.quantity * l.unitPrice * (l.taxRate || 0)) / 100,
      0
    );
    const discount =
      discountMode === "percent"
        ? (subtotal * (Number(discountValue) || 0)) / 100
        : Number(discountValue) || 0;
    const total = Math.max(0, subtotal + tax - discount);
    return { subtotal, tax, discount, total };
  }, [cart, discountMode, discountValue]);

  const balanceDue = useMemo(() => {
    if (paymentStatus !== "partial") return 0;
    return Math.max(0, totals.total - (Number(paidAmount) || 0));
  }, [paymentStatus, totals.total, paidAmount]);

  const change = useMemo(() => {
    if (paymentStatus !== "paid" || paymentMethod !== "Cash") return 0;
    return Math.max(0, (Number(cashTendered) || 0) - totals.total);
  }, [paymentStatus, paymentMethod, cashTendered, totals.total]);

  const addToCart = useCallback((product: ProductOption, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) =>
          l.productId === product.id
            ? { ...l, quantity: l.quantity + qty }
            : l
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          productCode: product.productId,
          sku: product.sku,
          quantity: qty,
          unitPrice: Number(product.salePrice),
          taxRate: Number(product.taxRate ?? 0),
          unit: product.unit,
          stockQty: product.stock?.quantity ?? null,
        },
      ];
    });
  }, []);

  const flashFeedback = useCallback((ok: boolean, text: string) => {
    setFeedback({ ok, text });
    setTimeout(() => setFeedback((f) => (f && f.text === text ? null : f)), 2000);
  }, []);

  const handleScan = useCallback(
    (rawCode: string) => {
      const code = rawCode.trim();
      if (!code) return;
      const product = products.find(
        (p) => p.sku === code || p.productId === code
      );
      if (!product) {
        flashFeedback(false, `No product found for "${code}"`);
        return;
      }
      if ((product.stock?.quantity ?? 0) <= 0) {
        flashFeedback(false, `${product.name} is out of stock`);
        return;
      }
      addToCart(product);
      flashFeedback(true, `Added ${product.name}`);
    },
    [products, addToCart, flashFeedback]
  );

  function onScanSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!scanInput.trim()) return;
    handleScan(scanInput);
    setScanInput("");
    scanInputRef.current?.focus();
  }

  function updateCartQty(productId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.productId === productId
            ? { ...l, quantity: Math.max(1, l.quantity + delta) }
            : l
        )
        .filter((l) => l.quantity > 0)
    );
  }

  function removeCartLine(productId: number) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

  function clearCart() {
    setCart([]);
    setDiscountValue("0");
    setNotes("");
    setPaidAmount("");
    setCashTendered("");
    setPaymentStatus("paid");
    setPaymentMethod("Cash");
    setCustomerId(null);
    setCustomerSearch("");
  }

  // ----- camera modal -----
  useEffect(() => {
    if (!cameraOpen) return;
    let stopped = false;
    let reader: any = null;

    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/library");
        reader = new BrowserMultiFormatReader();
        cameraReaderRef.current = reader;
        const video = cameraVideoRef.current;
        if (!video) return;
        await reader.decodeFromVideoDevice(null, video, (result: any) => {
          if (stopped) return;
          if (result) {
            handleScan(result.getText());
          }
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Camera error";
        flashFeedback(false, msg);
        setCameraOpen(false);
      }
    })();

    return () => {
      stopped = true;
      cameraReaderRef.current?.reset();
      cameraReaderRef.current = null;
    };
  }, [cameraOpen, handleScan, flashFeedback]);

  // ----- mobile session -----
  async function startMobileSession() {
    const res = await fetch("/api/pos/session", { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      flashFeedback(false, data.error ?? "Failed to start mobile session");
      return;
    }
    const data: SessionInfo = await res.json();
    setMobileSession(data);
    setMobileStatus("waiting");
    processedScanRef.current = new Set();
    try {
      const QRCode = (await import("qrcode")).default;
      const qr = await QRCode.toDataURL(data.mobileUrl, { width: 220, margin: 1 });
      setMobileQr(qr);
    } catch {
      setMobileQr(null);
    }
  }

  async function endMobileSession() {
    if (!mobileSession) return;
    await fetch(`/api/pos/session/${mobileSession.sessionId}`, { method: "DELETE" });
    setMobileSession(null);
    setMobileQr(null);
  }

  useEffect(() => {
    if (!mobileSession) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/pos/session/${mobileSession!.sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setMobileStatus(data.status);
        if (Array.isArray(data.scans)) {
          for (const scan of data.scans as SessionScan[]) {
            const key = `${scan.barcode}|${scan.at}`;
            if (processedScanRef.current.has(key)) continue;
            processedScanRef.current.add(key);
            handleScan(scan.barcode);
          }
        }
      } catch {
        // ignore
      }
    }

    poll();
    const interval = setInterval(poll, 1500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [mobileSession, handleScan]);

  // ----- hold / load -----
  async function holdCurrent() {
    if (cart.length === 0) {
      flashFeedback(false, "Cart is empty");
      return;
    }
    const res = await fetch("/api/pos/held-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart,
        customerData: customerId
          ? { id: customerId, name: customers.find((c) => c.id === customerId)?.name ?? "" }
          : null,
        discount: Number(discountValue) || 0,
        notes,
      }),
    });
    if (res.ok) {
      flashFeedback(true, "Order held");
      clearCart();
      loadHeld();
    } else {
      flashFeedback(false, "Failed to hold order");
    }
  }

  function loadHeldOrder(h: HeldOrder) {
    setCart(h.items);
    setDiscountValue(String(h.discount ?? 0));
    setNotes(h.notes ?? "");
    if (h.customerData?.id) setCustomerId(h.customerData.id);
    setShowHeldDrawer(false);
    fetch(`/api/pos/held-orders/${h.id}`, { method: "DELETE" }).then(loadHeld);
  }

  async function deleteHeldOrder(id: number) {
    await fetch(`/api/pos/held-orders/${id}`, { method: "DELETE" });
    loadHeld();
  }

  // ----- checkout -----
  async function performCheckout() {
    if (cart.length === 0) return;
    setSubmitting(true);
    const body = {
      customerId,
      items: cart.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      })),
      discountAmount: totals.discount,
      paymentMethod,
      paymentStatus,
      paidAmount:
        paymentStatus === "paid"
          ? totals.total
          : paymentStatus === "unpaid"
          ? 0
          : Number(paidAmount) || 0,
      notes,
    };
    const res = await fetch("/api/pos/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      flashFeedback(false, data.error ?? "Checkout failed");
      return;
    }
    const data = await res.json();
    const order = data.order;
    setCompletedOrder({
      id: order.id,
      orderId: order.orderId,
      totalAmount: String(order.totalAmount),
      paidAmount: String(order.paidAmount),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      items: order.items.map((i: { productName: string; quantity: number; unitPrice: string; totalPrice: string }) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: String(i.unitPrice),
        totalPrice: String(i.totalPrice),
      })),
      customer: order.customer ?? { name: "Walk-in customer", customerId: "WALK-IN" },
      createdAt: order.createdAt,
    });
    setCheckoutOpen(true);
    loadProducts();
  }

  function finishOrder() {
    setCheckoutOpen(false);
    setCompletedOrder(null);
    clearCart();
    scanInputRef.current?.focus();
  }

  function printDocument(kind: "receipt" | "invoice") {
    if (!completedOrder) return;
    const w = window.open("", "_blank", "width=400,height=600");
    if (!w) return;
    w.document.write(buildPrintHtml(kind, completedOrder, settings, currency, brandColor));
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 200);
  }

  // ----- keyboard shortcuts -----
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const editing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";
      if (e.key === "F1") {
        e.preventDefault();
        scanInputRef.current?.focus();
      } else if (e.key === "F2") {
        e.preventDefault();
        customerSearchRef.current?.focus();
        setShowCustomerDropdown(true);
      } else if (e.key === "F9") {
        e.preventDefault();
        holdCurrent();
      } else if (e.key === "F10") {
        e.preventDefault();
        setShowHeldDrawer(true);
      } else if (e.key === "Escape") {
        if (cameraOpen) setCameraOpen(false);
        else if (checkoutOpen) finishOrder();
        else if (showHeldDrawer) setShowHeldDrawer(false);
        else if (mobileSession) endMobileSession();
        else if (editing) (target as HTMLInputElement).blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOpen, checkoutOpen, showHeldDrawer, mobileSession, cart, customerId, discountValue, notes, customers]);

  return (
    <div style={{ display: "flex", gap: "16px", alignItems: "stretch", height: "calc(100vh - 96px)", overflow: "hidden" }}>
      {/* LEFT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "14px", minWidth: 0, overflowY: "auto" }}>
        <div>
          <h1 style={pageTitle}>Point of Sale</h1>
          <p style={pageSubtitle}>
            Use scanner input or manual entry — tap items, scan barcodes, or pair a phone.
          </p>
        </div>

        {/* Scan / Input */}
        <div style={cardStyle}>
          <div style={cardHeader}>
            <span style={cardLabel}>SCAN / INPUT</span>
            <span style={hintText}>USB scanner supported. Press F1 to focus.</span>
          </div>
          <form onSubmit={onScanSubmit} style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <input
              ref={scanInputRef}
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Scan or type SKU / product code…"
              style={{ ...inputStyle, flex: 1 }}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              style={iconAction}
              title="Use device camera"
            >
              <Camera size={14} /> Camera
            </button>
            <button
              type="button"
              onClick={mobileSession ? endMobileSession : startMobileSession}
              style={{ ...iconAction, backgroundColor: mobileSession ? "rgba(196,151,58,0.18)" : undefined }}
              title="Pair phone"
            >
              <Smartphone size={14} /> Mobile
            </button>
          </form>
          {feedback && (
            <div
              style={{
                marginTop: "8px",
                fontSize: "12px",
                color: feedback.ok ? "#16a34a" : "#dc2626",
              }}
            >
              {feedback.text}
            </div>
          )}
        </div>

        {/* Mobile Session panel */}
        {mobileSession && (
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={cardLabel}>MOBILE SCANNER SESSION</div>
                <div style={{ fontSize: "13px", marginTop: "4px" }}>
                  Session:{" "}
                  <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>
                    {mobileSession.sessionId}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                  ●{" "}
                  {mobileStatus === "active"
                    ? "Connected — waiting for scans…"
                    : mobileStatus === "expired"
                    ? "Session ended"
                    : "Waiting for first scan…"}
                </div>
              </div>
              <button onClick={endMobileSession} style={btnGhost} title="End session">
                <X size={14} /> End Session
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginTop: "12px" }}>
              {mobileQr && (
                <QrDisplay value={mobileQr} alt="QR for mobile scanner" />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Open this URL on a phone:
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    fontFamily: "ui-monospace, monospace",
                    wordBreak: "break-all",
                    backgroundColor: "var(--input-bg)",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    marginTop: "4px",
                  }}
                >
                  {mobileSession.mobileUrl}
                </div>
                <a
                  href={mobileSession.mobileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...btnGhost, marginTop: "8px", display: "inline-flex", textDecoration: "none" }}
                >
                  <ExternalLink size={12} /> Open Mobile Page
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code, SKU…"
              style={{ ...inputStyle, border: "none", padding: "4px 0", flex: 1 }}
            />
            <div style={{ display: "inline-flex", gap: "4px" }}>
              <button
                onClick={() => setViewMode("grid")}
                style={{ ...toggleBtn, ...(viewMode === "grid" ? toggleActive : {}) }}
                title="Grid view"
              >
                <GridIcon size={14} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                style={{ ...toggleBtn, ...(viewMode === "list" ? toggleActive : {}) }}
                title="List view"
              >
                <ListIcon size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <CategoryTab
            label="All"
            active={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
          />
          {categories.map((c) => (
            <CategoryTab
              key={c.id}
              label={c.name}
              active={activeCategory === c.id}
              onClick={() => setActiveCategory(c.id)}
            />
          ))}
        </div>

        {/* Products */}
        <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
          {viewMode === "grid" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: "10px",
              }}
            >
              {filteredProducts.map((p) => {
                const out = (p.stock?.quantity ?? 0) <= 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => !out && addToCart(p)}
                    disabled={out}
                    style={{
                      ...productCard,
                      opacity: out ? 0.5 : 1,
                      cursor: out ? "not-allowed" : "pointer",
                    }}
                  >
                    <div style={productThumb}>
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.name}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="80px"
                        />
                      ) : (
                        <span style={{ fontSize: "20px", color: "var(--text-muted)" }}>
                          {p.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginTop: "6px" }}>
                      {p.name}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand)" }}>
                        {currency} {Number(p.salePrice).toFixed(2)}
                      </span>
                      <StockBadge product={p} />
                    </div>
                  </button>
                );
              })}
              {filteredProducts.length === 0 && (
                <div style={{ gridColumn: "1 / -1", color: "var(--text-muted)", padding: "24px", textAlign: "center" }}>
                  No products match this filter.
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {filteredProducts.map((p) => {
                const out = (p.stock?.quantity ?? 0) <= 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => !out && addToCart(p)}
                    disabled={out}
                    style={{ ...productListRow, opacity: out ? 0.5 : 1, cursor: out ? "not-allowed" : "pointer" }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {p.name}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {p.productId}
                        {p.sku ? ` · SKU ${p.sku}` : ""}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <StockBadge product={p} />
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand)" }}>
                        {currency} {Number(p.salePrice).toFixed(2)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT (cart) */}
      <aside style={cartCol}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
            Cart ({cart.length} items)
          </h2>
          <div style={{ display: "inline-flex", gap: "4px" }}>
            <button onClick={clearCart} style={smallGhost} title="Clear">
              <Trash2 size={12} />
            </button>
            <button onClick={holdCurrent} style={smallGhost} title="Hold (F9)">
              <Pause size={12} />
            </button>
            <button onClick={() => setShowHeldDrawer(true)} style={smallGhost} title="Load (F10)">
              <FolderOpen size={12} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          {cart.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "12px", padding: "16px", textAlign: "center" }}>
              Cart is empty. Scan or click a product to start.
            </div>
          ) : (
            cart.map((line) => (
              <div key={line.productId} style={cartRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {line.productName}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                    {line.productCode}
                    {line.sku ? ` · ${line.sku}` : ""}
                  </div>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <button onClick={() => updateCartQty(line.productId, -1)} style={qtyBtn} title="Decrease">
                    <Minus size={11} />
                  </button>
                  <input
                    type="number"
                    value={line.quantity}
                    onChange={(e) => {
                      const v = Math.max(1, Number(e.target.value) || 1);
                      setCart((prev) =>
                        prev.map((l) => (l.productId === line.productId ? { ...l, quantity: v } : l))
                      );
                    }}
                    style={qtyInput}
                  />
                  <button onClick={() => updateCartQty(line.productId, 1)} style={qtyBtn} title="Increase">
                    <Plus size={11} />
                  </button>
                </div>
                <div style={{ width: "70px", textAlign: "right", fontSize: "12px", fontWeight: 600 }}>
                  {(line.quantity * line.unitPrice).toFixed(2)}
                </div>
                <button
                  onClick={() => removeCartLine(line.productId)}
                  style={removeBtn}
                  title="Remove"
                >
                  <X size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Discount */}
        <div style={discountWrap}>
          <div style={{ display: "inline-flex", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--card-border)" }}>
            <button
              onClick={() => setDiscountMode("fixed")}
              style={{ ...discountToggle, ...(discountMode === "fixed" ? discountToggleActive : {}) }}
            >
              {currency}
            </button>
            <button
              onClick={() => setDiscountMode("percent")}
              style={{ ...discountToggle, ...(discountMode === "percent" ? discountToggleActive : {}) }}
            >
              %
            </button>
          </div>
          <input
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Discount"
          />
        </div>

        {/* Summary */}
        <div style={summaryWrap}>
          <SummaryRow label="Subtotal" value={totals.subtotal} currency={currency} />
          <SummaryRow label="Discount" value={-totals.discount} currency={currency} />
          <SummaryRow label="Tax" value={totals.tax} currency={currency} />
          <SummaryRow label="Total" value={totals.total} currency={currency} bold />
        </div>

        {/* Customer */}
        <div style={{ position: "relative", marginTop: "10px" }}>
          <Label>Customer</Label>
          <input
            ref={customerSearchRef}
            value={
              customerId
                ? customers.find((c) => c.id === customerId)?.name ?? ""
                : customerSearch
            }
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setCustomerId(null);
              setShowCustomerDropdown(true);
            }}
            onFocus={() => setShowCustomerDropdown(true)}
            placeholder="Walk-in customer"
            style={inputStyle}
          />
          {showCustomerDropdown && (
            <div style={dropdown}>
              <button
                style={dropdownItem}
                onClick={() => {
                  setCustomerId(null);
                  setCustomerSearch("");
                  setShowCustomerDropdown(false);
                }}
              >
                Walk-in customer
              </button>
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  style={dropdownItem}
                  onClick={() => {
                    setCustomerId(c.id);
                    setCustomerSearch("");
                    setShowCustomerDropdown(false);
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                    {c.customerId} · {c.mobile}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div style={{ marginTop: "10px" }}>
          <Label>Payment Method</Label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid var(--card-border)", backgroundColor: "var(--input-bg)", color: "var(--text-primary)", fontSize: "13px" }}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Payment Status */}
        <div style={{ marginTop: "10px" }}>
          <Label>Payment Status</Label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as "paid"|"partial"|"unpaid")}
            style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid var(--card-border)", backgroundColor: "var(--input-bg)", color: "var(--text-primary)", fontSize: "13px", textTransform: "capitalize" }}
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s} style={{ textTransform: "capitalize" }}>{s}</option>
            ))}
          </select>
        </div>

        {paymentStatus === "partial" && (
          <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div>
              <Label>Amount Paid</Label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <Label>Balance Due</Label>
              <input value={balanceDue.toFixed(2)} readOnly style={{ ...inputStyle, opacity: 0.7 }} />
            </div>
          </div>
        )}

        {paymentStatus === "paid" && paymentMethod === "Cash" && (
          <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div>
              <Label>Cash Tendered</Label>
              <input
                type="number"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <Label>Change</Label>
              <input value={change.toFixed(2)} readOnly style={{ ...inputStyle, opacity: 0.7 }} />
            </div>
          </div>
        )}

        <div style={{ marginTop: "10px" }}>
          <Label>Notes</Label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
            style={inputStyle}
          />
        </div>

        <button
          onClick={performCheckout}
          disabled={cart.length === 0 || submitting}
          style={{
            ...checkoutBtn,
            opacity: cart.length === 0 || submitting ? 0.6 : 1,
          }}
        >
          {submitting
            ? "Processing…"
            : `Checkout ${currency} ${totals.total.toFixed(2)}`}
        </button>
      </aside>

      {/* Camera modal */}
      {cameraOpen && (
        <>
          <div onClick={() => setCameraOpen(false)} style={modalOverlay} />
          <div style={cameraModal}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Camera Scanner</h3>
              <button onClick={() => setCameraOpen(false)} style={smallGhost}>
                <X size={14} />
              </button>
            </div>
            <video
              ref={cameraVideoRef}
              style={{ width: "100%", borderRadius: "8px", backgroundColor: "#000" }}
              muted
              playsInline
            />
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
              Point the camera at a barcode. Items add to the cart automatically.
            </p>
          </div>
        </>
      )}

      {/* Held orders drawer */}
      {showHeldDrawer && (
        <>
          <div onClick={() => setShowHeldDrawer(false)} style={modalOverlay} />
          <aside style={heldDrawer}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderBottom: "1px solid var(--card-border)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600 }}>Held Orders</h3>
              <button onClick={() => setShowHeldDrawer(false)} style={smallGhost}>
                <X size={14} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
              {heldOrders.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center", padding: "16px" }}>
                  No held orders.
                </div>
              ) : (
                heldOrders.map((h) => {
                  const total = h.items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
                  return (
                    <div key={h.id} style={heldRow}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "12px", fontWeight: 600 }}>
                          {h.customerData?.name ?? "Walk-in"} · {h.items.length} item(s)
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {new Date(h.createdAt).toLocaleString()} · {currency} {total.toFixed(2)}
                        </div>
                      </div>
                      <button onClick={() => loadHeldOrder(h)} style={btnPrimarySmall}>
                        Load
                      </button>
                      <button onClick={() => deleteHeldOrder(h.id)} style={smallGhost} title="Discard">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </>
      )}

      {/* Checkout receipt modal */}
      {checkoutOpen && completedOrder && (
        <>
          <div style={modalOverlay} />
          <div style={receiptModal}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                Order {completedOrder.orderId} complete
              </h3>
              <button onClick={finishOrder} style={smallGhost}>
                <X size={14} />
              </button>
            </div>
            <div style={receiptPreview}>
              <div style={{ textAlign: "center", marginBottom: "10px" }}>
                <div style={{ fontSize: "16px", fontWeight: 700 }}>{settings?.businessName ?? "Accoraze"}</div>
                {settings?.tagline && <div style={{ fontSize: "11px", color: "#6b7280" }}>{settings.tagline}</div>}
              </div>
              <div style={{ fontSize: "11px", color: "#374151", marginBottom: "8px" }}>
                <div>Order: {completedOrder.orderId}</div>
                <div>Customer: {completedOrder.customer.name}</div>
                <div>Date: {new Date(completedOrder.createdAt).toLocaleString()}</div>
                <div>Payment: {completedOrder.paymentMethod ?? "—"} ({completedOrder.paymentStatus})</div>
              </div>
              <table style={{ width: "100%", fontSize: "11px", borderTop: "1px dashed #d1d5db", borderBottom: "1px dashed #d1d5db" }}>
                <tbody>
                  {completedOrder.items.map((it, i) => (
                    <tr key={i}>
                      <td style={{ padding: "4px 0" }}>
                        {it.productName} × {it.quantity}
                      </td>
                      <td style={{ padding: "4px 0", textAlign: "right" }}>
                        {Number(it.totalPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontWeight: 700 }}>
                <span>Total</span>
                <span>
                  {currency} {Number(completedOrder.totalAmount).toFixed(2)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#374151" }}>
                <span>Paid</span>
                <span>
                  {currency} {Number(completedOrder.paidAmount).toFixed(2)}
                </span>
              </div>
              {settings?.invoiceFooter && (
                <div style={{ textAlign: "center", marginTop: "10px", fontSize: "10px", color: "#6b7280" }}>
                  {settings.invoiceFooter}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "12px", justifyContent: "flex-end" }}>
              {completedOrder && (
                <>
                  <FloatingPopover
                    trigger={
                      <button style={btnSecondary}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10 9 9 9 8 9"/>
                        </svg> Invoice
                      </button>
                    }
                    items={[
                      {
                        label: "Download PDF",
                        icon: (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                        ),
                        onClick: () => downloadPDF(`/api/pdf/invoice/${completedOrder.id}`, `invoice-${completedOrder.orderId}.pdf`, `inv-pos-dl-${completedOrder.id}`),
                        disabled: isLoading(`inv-pos-dl-${completedOrder.id}`),
                      },
                      {
                        label: "Print Invoice",
                        icon: (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 6 2 18 2 18 9"/>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                            <rect x="6" y="14" width="12" height="8"/>
                          </svg>
                        ),
                        onClick: () => printPDF(`/api/pdf/invoice/${completedOrder.id}`, `inv-pos-print-${completedOrder.id}`),
                        disabled: isLoading(`inv-pos-print-${completedOrder.id}`),
                      },
                    ]}
                    width={180}
                  />
                  <FloatingPopover
                    trigger={
                      <button style={btnSecondary}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="1" y="3" width="15" height="13"/>
                          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                          <circle cx="5.5" cy="18.5" r="2.5"/>
                          <circle cx="18.5" cy="18.5" r="2.5"/>
                        </svg> Receipt
                      </button>
                    }
                    items={[
                      {
                        label: "Download PDF",
                        icon: (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                        ),
                        onClick: () => downloadPDF(`/api/pdf/receipt/${completedOrder.id}`, `receipt-${completedOrder.orderId}.pdf`, `rec-pos-dl-${completedOrder.id}`),
                        disabled: isLoading(`rec-pos-dl-${completedOrder.id}`),
                      },
                      {
                        label: "Print Receipt",
                        icon: (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 6 2 18 2 18 9"/>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                            <rect x="6" y="14" width="12" height="8"/>
                          </svg>
                        ),
                        onClick: () => printPDF(`/api/pdf/receipt/${completedOrder.id}`, `rec-pos-print-${completedOrder.id}`),
                        disabled: isLoading(`rec-pos-print-${completedOrder.id}`),
                      },
                    ]}
                    width={180}
                  />
                </>
              )}
              <button onClick={finishOrder} style={btnPrimarySmall}>
                <Check size={14} /> Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StockBadge({ product }: { product: ProductOption }) {
  const qty = product.stock?.quantity ?? 0;
  const threshold = product.stock?.threshold ?? 10;
  let color = { bg: "#dcfce7", fg: "#166534" };
  let label = `${qty} in stock`;
  if (qty <= 0) {
    color = { bg: "#fee2e2", fg: "#991b1b" };
    label = "Out of stock";
  } else if (qty <= threshold) {
    color = { bg: "#fef3c7", fg: "#92400e" };
    label = `Low (${qty})`;
  }
  return (
    <span
      style={{
        fontSize: "10px",
        fontWeight: 600,
        backgroundColor: color.bg,
        color: color.fg,
        padding: "2px 6px",
        borderRadius: "999px",
      }}
    >
      {label}
    </span>
  );
}

function CategoryTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 12px",
        borderRadius: "999px",
        border: "1px solid var(--card-border)",
        backgroundColor: active ? "var(--brand)" : "var(--card-bg)",
        color: active ? "#fff" : "var(--text-secondary)",
        fontSize: "12px",
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function SummaryRow({
  label,
  value,
  currency,
  bold,
}: {
  label: string;
  value: number;
  currency: string;
  bold?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "12px",
        padding: "3px 0",
        fontWeight: bold ? 700 : 400,
        color: bold ? "var(--text-primary)" : "var(--text-secondary)",
        borderTop: bold ? "1px dashed var(--card-border)" : "none",
        marginTop: bold ? "4px" : 0,
        paddingTop: bold ? "6px" : "3px",
      }}
    >
      <span>{label}</span>
      <span>
        {currency} {Math.abs(value).toFixed(2)}
        {value < 0 ? "" : ""}
      </span>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: "11px",
        fontWeight: 500,
        color: "var(--text-secondary)",
        marginBottom: "4px",
      }}
    >
      {children}
    </label>
  );
}

function buildPrintHtml(
  kind: "receipt" | "invoice",
  order: NonNullable<{
    orderId: string;
    totalAmount: string;
    paidAmount: string;
    paymentMethod: string | null;
    paymentStatus: string;
    items: { productName: string; quantity: number; unitPrice: string; totalPrice: string }[];
    customer: { name: string; customerId: string };
    createdAt: string;
  }>,
  settings: { businessName: string; tagline: string | null; address: string | null; phone: string | null; invoiceFooter: string | null } | null,
  currency: string,
  brandColor: string
): string {
  const title = kind === "invoice" ? "Invoice" : "Receipt";
  const widthRule = kind === "invoice" ? "max-width:600px;margin:0 auto;" : "width:280px;";
  const itemsHtml = order.items
    .map(
      (i) => `
        <tr>
          <td style="padding:4px 0;">${escapeHtml(i.productName)}</td>
          <td style="padding:4px 0;text-align:right;">${i.quantity}</td>
          <td style="padding:4px 0;text-align:right;">${Number(i.unitPrice).toFixed(2)}</td>
          <td style="padding:4px 0;text-align:right;">${Number(i.totalPrice).toFixed(2)}</td>
        </tr>`
    )
    .join("");
  return `<!doctype html>
<html><head><title>${title} ${order.orderId}</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 12px; color:#111; padding: 16px; ${widthRule} }
  h1 { font-size: 16px; margin: 0; color: ${brandColor}; }
  .muted { color:#666; font-size: 11px; }
  table { width:100%; border-collapse:collapse; margin-top:8px; font-size:11px; }
  thead td { border-bottom:1px solid #999; font-weight:600; padding:4px 0; }
  tfoot td { padding:4px 0; }
  .right { text-align:right; }
  .total { border-top:1px solid #999; font-weight:700; }
</style>
</head><body>
  <div style="text-align:center;margin-bottom:12px;">
    <h1>${escapeHtml(settings?.businessName ?? "Accoraze")}</h1>
    ${settings?.tagline ? `<div class="muted">${escapeHtml(settings.tagline)}</div>` : ""}
    ${settings?.address ? `<div class="muted">${escapeHtml(settings.address)}</div>` : ""}
    ${settings?.phone ? `<div class="muted">${escapeHtml(settings.phone)}</div>` : ""}
  </div>
  <div class="muted">${title} #${order.orderId}</div>
  <div class="muted">Date: ${new Date(order.createdAt).toLocaleString()}</div>
  <div class="muted">Customer: ${escapeHtml(order.customer.name)}</div>
  <div class="muted">Payment: ${escapeHtml(order.paymentMethod ?? "—")} (${order.paymentStatus})</div>
  <table>
    <thead>
      <tr>
        <td>Item</td>
        <td class="right">Qty</td>
        <td class="right">Price</td>
        <td class="right">Total</td>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
    <tfoot>
      <tr class="total">
        <td colspan="3" class="right">Total</td>
        <td class="right">${currency} ${Number(order.totalAmount).toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="3" class="right">Paid</td>
        <td class="right">${currency} ${Number(order.paidAmount).toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>
  ${settings?.invoiceFooter ? `<div class="muted" style="margin-top:14px;text-align:center;">${escapeHtml(settings.invoiceFooter)}</div>` : ""}
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const pageTitle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  color: "var(--text-primary)",
  marginBottom: "2px",
};
const pageSubtitle: React.CSSProperties = {
  fontSize: "13px",
  color: "var(--text-secondary)",
  marginBottom: "0",
};
const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "10px",
  padding: "12px",
};
const cardHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const cardLabel: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.05em",
  color: "var(--text-muted)",
  textTransform: "uppercase",
};
const hintText: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--text-muted)",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "7px",
  border: "1px solid var(--input-border)",
  backgroundColor: "var(--input-bg)",
  fontSize: "13px",
  color: "var(--text-primary)",
  outline: "none",
};
const iconAction: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "8px 12px",
  borderRadius: "7px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  fontSize: "12px",
  color: "var(--text-primary)",
  cursor: "pointer",
};
const btnGhost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "5px 10px",
  borderRadius: "6px",
  border: "1px solid var(--card-border)",
  backgroundColor: "transparent",
  color: "var(--text-secondary)",
  fontSize: "12px",
  cursor: "pointer",
};
const toggleBtn: React.CSSProperties = {
  width: "26px",
  height: "26px",
  borderRadius: "6px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-secondary)",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};
const toggleActive: React.CSSProperties = {
  backgroundColor: "var(--brand)",
  color: "#fff",
  borderColor: "var(--brand)",
};
const productCard: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  textAlign: "left",
  padding: "10px",
  borderRadius: "10px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
};
const productThumb: React.CSSProperties = {
  width: "100%",
  aspectRatio: "1/1",
  borderRadius: "8px",
  backgroundColor: "var(--input-bg)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};
const productListRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
};
const cartCol: React.CSSProperties = {
  width: "380px",
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "10px",
  padding: "14px",
  height: "100%",
  overflowY: "auto",
};
const cartRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px",
  borderRadius: "8px",
  backgroundColor: "var(--input-bg)",
};
const qtyBtn: React.CSSProperties = {
  width: "22px",
  height: "22px",
  borderRadius: "5px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};
const qtyInput: React.CSSProperties = {
  width: "36px",
  textAlign: "center",
  padding: "2px 4px",
  borderRadius: "5px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  fontSize: "12px",
};
const removeBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
};
const smallGhost: React.CSSProperties = {
  width: "26px",
  height: "26px",
  borderRadius: "6px",
  border: "1px solid var(--card-border)",
  backgroundColor: "transparent",
  cursor: "pointer",
  color: "var(--text-secondary)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};
const discountWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "10px",
};
const discountToggle: React.CSSProperties = {
  padding: "6px 10px",
  fontSize: "12px",
  border: "none",
  backgroundColor: "transparent",
  color: "var(--text-secondary)",
  cursor: "pointer",
};
const discountToggleActive: React.CSSProperties = {
  backgroundColor: "var(--brand)",
  color: "#fff",
};
const summaryWrap: React.CSSProperties = {
  border: "1px solid var(--card-border)",
  borderRadius: "8px",
  padding: "8px 12px",
  backgroundColor: "var(--input-bg)",
  marginTop: "10px",
};
const dropdown: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "8px",
  marginTop: "4px",
  maxHeight: "180px",
  overflowY: "auto",
  zIndex: 10,
};
const dropdownItem: React.CSSProperties = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: "8px 10px",
  fontSize: "12px",
  border: "none",
  borderBottom: "1px solid var(--card-border)",
  backgroundColor: "transparent",
  textAlign: "left",
  cursor: "pointer",
};
const pill: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: "999px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-secondary)",
  fontSize: "12px",
  cursor: "pointer",
};
const pillActive: React.CSSProperties = {
  backgroundColor: "var(--brand)",
  color: "#fff",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "var(--brand)",
};
const checkoutBtn: React.CSSProperties = {
  marginTop: "14px",
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  backgroundColor: "var(--brand)",
  color: "#fff",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
};
const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  zIndex: 200,
};
const cameraModal: React.CSSProperties = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "440px",
  maxWidth: "90vw",
  backgroundColor: "var(--card-bg)",
  borderRadius: "12px",
  padding: "16px",
  zIndex: 201,
  border: "1px solid var(--card-border)",
};
const heldDrawer: React.CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  height: "100vh",
  width: "420px",
  maxWidth: "100vw",
  backgroundColor: "var(--card-bg)",
  borderLeft: "1px solid var(--card-border)",
  display: "flex",
  flexDirection: "column",
  zIndex: 201,
};
const heldRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px",
  borderRadius: "8px",
  backgroundColor: "var(--input-bg)",
  marginBottom: "8px",
};
const btnPrimarySmall: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "6px 12px",
  borderRadius: "6px",
  border: "none",
  backgroundColor: "var(--brand)",
  color: "#fff",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};
const btnSecondary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "8px 12px",
  borderRadius: "7px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-primary)",
  fontSize: "12px",
  cursor: "pointer",
};
const receiptModal: React.CSSProperties = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "440px",
  maxWidth: "92vw",
  backgroundColor: "var(--card-bg)",
  borderRadius: "12px",
  padding: "16px",
  zIndex: 201,
  border: "1px solid var(--card-border)",
};
const receiptPreview: React.CSSProperties = {
  backgroundColor: "#fff",
  color: "#111",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "14px",
};



