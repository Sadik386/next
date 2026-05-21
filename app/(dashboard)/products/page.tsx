"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Pencil, Trash2, Plus, X, Search, Upload, ScanLine, Smartphone, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import BarcodeDisplay from "@/components/ui/BarcodeDisplay";
import QrDisplay from "@/components/ui/QrDisplay";

type Category = { id: number; name: string };
type Product = {
  id: number;
  productId: string;
  name: string;
  sku: string | null;
  unit: string;
  salePrice: string;
  costPrice: string;
  taxRate: string;
  description: string | null;
  imageUrl: string | null;
  status: string;
  categoryId: number | null;
  category: Category | null;
};

type MobileScanProduct = {
  id: number;
  productId: string;
  name: string;
  sku: string | null;
};

type MobileSessionInfo = { sessionId: string; mobileUrl: string; expiresAt: string };

const UNITS = ["Piece", "Kg", "Liter", "Box", "Pack", "Dozen", "Meter", "Set", "Pair", "Other"];

const emptyForm = {
  name: "",
  sku: "",
  categoryId: "" as string,
  unit: "Piece",
  salePrice: "",
  costPrice: "",
  taxRate: "0",
  description: "",
  imageUrl: "",
  status: "active",
};

function normalizeScanValue(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function findProductMatch(
  products: Product[],
  code: string,
  scannedProduct?: MobileScanProduct | null
) {
  const normalizedCode = normalizeScanValue(code);
  return products.find((p) => {
    if (scannedProduct?.id && p.id === scannedProduct.id) return true;
    return (
      normalizeScanValue(p.productId) === normalizedCode ||
      normalizeScanValue(p.sku) === normalizedCode ||
      normalizeScanValue(p.name) === normalizedCode
    );
  });
}

function getMobileSessionToken(sessionInfo: MobileSessionInfo) {
  try {
    return new URL(sessionInfo.mobileUrl).searchParams.get("token") ?? "";
  } catch {
    return "";
  }
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [barcodeTarget, setBarcodeTarget] = useState<Product | null>(null);
  const [scanQuery, setScanQuery] = useState("");
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const scanInputRef = useRef<HTMLInputElement | null>(null);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());

  const [mobileSession, setMobileSession] = useState<MobileSessionInfo | null>(null);
  const [mobileQr, setMobileQr] = useState<string | null>(null);
  const [mobileStatus, setMobileStatus] = useState<string>("waiting");
  const [showMobileModal, setShowMobileModal] = useState(false);
  const processedScanRef = useRef<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/products?${params}`);
    if (res.ok) {
      const data = await res.json();
      setProducts(data.items ?? []);
    }
    setLoading(false);
  }, [search]);

  const highlightParam = searchParams.get("highlight");
  useEffect(() => {
    if (highlightParam && products.length > 0) {
      const matched = products.find(
        (p) => normalizeScanValue(p.productId) === normalizeScanValue(highlightParam)
      );
      if (matched) {
        setHighlightId(matched.id);
        const row = document.getElementById(`product-row-${matched.id}`);
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => setHighlightId(null), 5000);
        }
      }
    }
  }, [products, highlightParam]);

  useEffect(() => {
    if (!highlightId) return;
    const row = rowRefs.current.get(highlightId);
    if (row) row.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => setHighlightId(null), 2000);
    return () => clearTimeout(timer);
  }, [highlightId, products]);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories ?? []);
    }
  }, []);

  const startMobileSession = useCallback(async () => {
    const res = await fetch("/api/scan/products/session", { method: "POST" });
    if (!res.ok) {
      toast.error("Failed to start mobile session");
      return;
    }
    const data: MobileSessionInfo = await res.json();
    setMobileSession(data);
    setMobileStatus("waiting");
    processedScanRef.current = null;
    setShowMobileModal(true);
    try {
      const QRCode = (await import("qrcode")).default;
      const qr = await QRCode.toDataURL(data.mobileUrl, { width: 220, margin: 1 });
      setMobileQr(qr);
    } catch {
      setMobileQr(null);
    }
  }, []);

  const endMobileSession = useCallback(() => {
    setMobileSession(null);
    setMobileQr(null);
    setShowMobileModal(false);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const t = setTimeout(loadProducts, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadProducts, search]);

  useEffect(() => {
    if (!mobileSession) return;
    let cancelled = false;

    async function poll() {
      try {
        const token = getMobileSessionToken(mobileSession!);
        const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
        const res = await fetch(`/api/scan/products/session/${mobileSession!.sessionId}${tokenParam}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setMobileStatus(data.status);
        if (data.scannedCode && data.scannedCode !== processedScanRef.current) {
          processedScanRef.current = data.scannedCode;
          const code = data.scannedCode.trim();
          const scannedProduct = (data.product ?? null) as MobileScanProduct | null;
          let match = findProductMatch(products, code, scannedProduct);
          if (!match) {
            const params = new URLSearchParams({ search: code, pageSize: "20" });
            const productRes = await fetch(`/api/products?${params}`);
            if (productRes.ok) {
              const productData = await productRes.json();
              const fetchedProducts = (productData.items ?? []) as Product[];
              if (fetchedProducts.length > 0) {
                setProducts(fetchedProducts);
                match = findProductMatch(fetchedProducts, code, scannedProduct);
              }
            }
          }
          if (match) {
            setSearch(code);
            setHighlightId(match.id);
            toast.success(`Found: ${match.name}`);
          } else {
            setSearch(code);
            toast.error(`No product found for "${code}"`);
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
  }, [mobileSession, products]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setNewCategoryName("");
    setDrawerOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku ?? "",
      categoryId: p.categoryId ? String(p.categoryId) : "",
      unit: p.unit,
      salePrice: String(p.salePrice),
      costPrice: String(p.costPrice),
      taxRate: String(p.taxRate),
      description: p.description ?? "",
      imageUrl: p.imageUrl ?? "",
      status: p.status,
    });
    setError(null);
    setNewCategoryName("");
    setDrawerOpen(true);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upload failed");
      return;
    }
    const data = await res.json();
    setForm((f) => ({ ...f, imageUrl: data.url }));
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setCreatingCategory(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setCreatingCategory(false);
    if (!res.ok) return;
    const data = await res.json();
    setCategories((cs) => {
      const exists = cs.find((c) => c.id === data.category.id);
      return exists ? cs : [...cs, data.category].sort((a, b) => a.name.localeCompare(b.name));
    });
    setForm((f) => ({ ...f, categoryId: String(data.category.id) }));
    setNewCategoryName("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("Product name is required");
    if (!form.categoryId) return setError("Category is required");
    if (!form.unit) return setError("Unit is required");
    if (form.salePrice === "" || form.costPrice === "")
      return setError("Sale and cost price are required");

    setSaving(true);
    const body = {
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      categoryId: Number(form.categoryId),
      unit: form.unit,
      salePrice: Number(form.salePrice),
      costPrice: Number(form.costPrice),
      taxRate: Number(form.taxRate || 0),
      description: form.description.trim() || null,
      imageUrl: form.imageUrl || null,
      status: form.status,
    };
    const url = editing ? `/api/products/${editing.id}` : "/api/products";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Save failed");
      return;
    }
    setDrawerOpen(false);
    loadProducts();
  }

  async function submitDeleteRequest() {
    if (!deleteTarget) return;
    if (!deleteReason.trim()) return;
    setDeleteSubmitting(true);
    const res = await fetch(`/api/products/${deleteTarget.id}/delete-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: deleteReason.trim() }),
    });
    setDeleteSubmitting(false);
    if (res.ok) {
      setDeleteTarget(null);
      setDeleteReason("");
    }
  }

  const filtered = useMemo(() => products, [products]);

  function handleScanSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = scanQuery.trim();
    if (!q) return;
    const match = findProductMatch(products, q);
    if (match) {
      setSearch(q);
      setHighlightId(match.id);
      const row = rowRefs.current.get(match.id);
      if (row) row.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setHighlightId(null), 2000);
    } else {
      setSearch(q);
    }
    setScanQuery("");
    scanInputRef.current?.focus();
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
            Products
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Manage your product catalog
          </p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>
          <Plus size={14} /> New Product
        </button>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "8px",
            padding: "8px 12px",
            flex: "1 1 280px",
            maxWidth: "360px",
          }}
        >
          <Search size={14} color="var(--text-muted)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, SKU"
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "13px",
              color: "var(--text-primary)",
              flex: 1,
            }}
          />
        </div>
        <form
          onSubmit={handleScanSubmit}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "8px",
            padding: "8px 12px",
            flex: "1 1 240px",
            maxWidth: "300px",
          }}
        >
          <ScanLine size={14} color="var(--text-muted)" />
          <input
            ref={scanInputRef}
            value={scanQuery}
            onChange={(e) => setScanQuery(e.target.value)}
            autoFocus
            placeholder="Scan to find product"
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "13px",
              color: "var(--text-primary)",
              flex: 1,
            }}
          />
        </form>
        <button
          onClick={startMobileSession}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid var(--card-border)",
            backgroundColor: "var(--card-bg)",
            color: "var(--text-primary)",
            fontSize: "13px",
            cursor: "pointer",
            marginLeft: "8px",
          }}
        >
          <Smartphone size={14} /> Mobile Scan
        </button>
      </div>

      <div
        style={{
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--input-bg)" }}>
              <Th>Product ID</Th>
              <Th>Image</Th>
              <Th>Name</Th>
              <Th>Category</Th>
              <Th>SKU</Th>
              <Th>Unit</Th>
              <Th align="right">Sale</Th>
              <Th align="right">Cost</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={10}
                  style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}
                >
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}
                >
                  No products yet. Click &ldquo;New Product&rdquo; to add one.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.id}
                  id={`product-row-${p.id}`}
                  ref={(el) => {
                    if (el) rowRefs.current.set(p.id, el);
                    else rowRefs.current.delete(p.id);
                  }}
                  style={{
                    borderTop: "1px solid var(--card-border)",
                    backgroundColor: highlightId === p.id ? "var(--brand-light)" : undefined,
                    transition: "background-color 200ms",
                  }}
                >
                  <Td mono>{p.productId}</Td>
                  <Td>
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt=""
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          objectFit: "cover",
                          border: "1px solid var(--card-border)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          backgroundColor: "var(--input-bg)",
                          border: "1px solid var(--card-border)",
                        }}
                      />
                    )}
                  </Td>
                  <Td>{p.name}</Td>
                  <Td>{p.category?.name ?? "—"}</Td>
                  <Td>{p.sku ?? "—"}</Td>
                  <Td>{p.unit}</Td>
                  <Td align="right">{Number(p.salePrice).toFixed(2)}</Td>
                  <Td align="right">{Number(p.costPrice).toFixed(2)}</Td>
                  <Td>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        backgroundColor: p.status === "active" ? "#dcfce7" : "#f3f4f6",
                        color: p.status === "active" ? "#166534" : "#6b7280",
                      }}
                    >
                      {p.status}
                    </span>
                  </Td>
                  <Td align="right">
                    <div style={{ display: "inline-flex", gap: "4px" }}>
                      <IconBtn onClick={() => setBarcodeTarget(p)} title="Show barcode">
                        <ScanLine size={13} />
                      </IconBtn>
                      <IconBtn onClick={() => openEdit(p)} title="Edit">
                        <Pencil size={13} />
                      </IconBtn>
                      <IconBtn
                        onClick={() => {
                          setDeleteTarget(p);
                          setDeleteReason("");
                        }}
                        title="Request delete"
                        danger
                      >
                        <Trash2 size={13} />
                      </IconBtn>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.3)",
              zIndex: 100,
            }}
          />
          <aside
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              height: "100vh",
              width: "480px",
              backgroundColor: "var(--card-bg)",
              borderLeft: "1px solid var(--card-border)",
              zIndex: 101,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--card-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                {editing ? "Edit Product" : "New Product"}
              </h2>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <X size={16} />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              style={{ flex: 1, overflowY: "auto", padding: "20px", display: "grid", gap: "12px" }}
            >
              <div>
                <Label>Image</Label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {form.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.imageUrl}
                      alt=""
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "8px",
                        objectFit: "cover",
                        border: "1px solid var(--card-border)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "8px",
                        backgroundColor: "var(--input-bg)",
                        border: "1px dashed var(--input-border)",
                      }}
                    />
                  )}
                  <label style={{ ...btnSecondary, cursor: "pointer" }}>
                    <Upload size={13} /> {uploading ? "Uploading..." : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(f);
                      }}
                    />
                  </label>
                  {form.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <Field
                label="Product Name"
                required
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              />

              <div>
                <Label required>Category</Label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                  <input
                    placeholder="Or create new category"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    style={{ ...inputStyle, fontSize: "12px", padding: "6px 8px" }}
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim() || creatingCategory}
                    style={{
                      ...btnSecondary,
                      padding: "6px 10px",
                      fontSize: "12px",
                      opacity: !newCategoryName.trim() || creatingCategory ? 0.5 : 1,
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              <Field
                label="SKU / Code"
                value={form.sku}
                onChange={(v) => setForm((f) => ({ ...f, sku: v }))}
                placeholder="Optional"
              />

              <div>
                <Label required>Unit</Label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  style={inputStyle}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field
                  label="Sale Price"
                  required
                  type="number"
                  value={form.salePrice}
                  onChange={(v) => setForm((f) => ({ ...f, salePrice: v }))}
                />
                <Field
                  label="Cost Price"
                  required
                  type="number"
                  value={form.costPrice}
                  onChange={(v) => setForm((f) => ({ ...f, costPrice: v }))}
                />
              </div>

              <Field
                label="Tax Rate (%)"
                type="number"
                value={form.taxRate}
                onChange={(v) => setForm((f) => ({ ...f, taxRate: v }))}
              />

              <div>
                <Label>Description</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <div>
                <Label>Status</Label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["active", "inactive"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, status: s }))}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid var(--input-border)",
                        backgroundColor:
                          form.status === s ? "var(--brand-light)" : "var(--input-bg)",
                        color: form.status === s ? "var(--brand)" : "var(--text-secondary)",
                        fontWeight: form.status === s ? 600 : 400,
                        fontSize: "13px",
                        cursor: "pointer",
                        textTransform: "capitalize",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#fee2e2",
                    color: "#991b1b",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                >
                  {error}
                </div>
              )}
            </form>
            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid var(--card-border)",
                display: "flex",
                gap: "8px",
                justifyContent: "flex-end",
              }}
            >
              <button type="button" onClick={() => setDrawerOpen(false)} style={btnSecondary}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}
              >
                {saving ? "Saving..." : editing ? "Save Changes" : "Create Product"}
              </button>
            </div>
          </aside>
        </>
      )}

      {barcodeTarget && (
        <>
          <div
            onClick={() => setBarcodeTarget(null)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
              zIndex: 110,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "var(--card-bg)",
              borderRadius: "12px",
              padding: "20px",
              width: "420px",
              maxWidth: "90vw",
              zIndex: 111,
              border: "1px solid var(--card-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                Product Barcode
              </h3>
              <button
                onClick={() => setBarcodeTarget(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <X size={16} />
              </button>
            </div>
            <BarcodeDisplay value={barcodeTarget.productId} label={barcodeTarget.name} />
          </div>
        </>
      )}

      {deleteTarget && (
        <>
          <div
            onClick={() => setDeleteTarget(null)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
              zIndex: 110,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "var(--card-bg)",
              borderRadius: "12px",
              padding: "20px",
              width: "440px",
              maxWidth: "90vw",
              zIndex: 111,
              border: "1px solid var(--card-border)",
            }}
          >
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "6px",
              }}
            >
              Request deletion of {deleteTarget.name}
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>
              An admin will review this request before the product is removed.
            </p>
            <Label required>Reason</Label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={3}
              placeholder="Why should this product be deleted?"
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                marginTop: "14px",
              }}
            >
              <button onClick={() => setDeleteTarget(null)} style={btnSecondary}>
                Cancel
              </button>
              <button
                onClick={submitDeleteRequest}
                disabled={!deleteReason.trim() || deleteSubmitting}
                style={{
                  ...btnPrimary,
                  backgroundColor: "#dc2626",
                  opacity: !deleteReason.trim() || deleteSubmitting ? 0.6 : 1,
                }}
              >
                {deleteSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
</>
      )}

      {showMobileModal && mobileSession && (
        <>
          <div
            onClick={endMobileSession}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.3)",
              zIndex: 100,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "var(--card-bg)",
              borderRadius: "12px",
              padding: "20px",
              width: "400px",
              maxWidth: "90vw",
              zIndex: 101,
              border: "1px solid var(--card-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                Mobile Scanner Session
              </h3>
              <button
                onClick={endMobileSession}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                Session: <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>{mobileSession.sessionId}</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {mobileStatus === "active" ? "Connected — waiting for scans…" : "Waiting for scan…"}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              {mobileQr && (
                <QrDisplay value={mobileQr} alt="QR for mobile scanner" />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Open this URL on a phone:
                </div>
                <div
                  style={{
                    fontSize: "11px",
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
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "var(--brand)",
                    textDecoration: "none",
                  }}
                >
                  <ExternalLink size={12} /> Open Mobile Page
                </a>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button onClick={endMobileSession} style={btnSecondary}>
                End Session
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "6px",
  border: "1px solid var(--input-border)",
  backgroundColor: "var(--input-bg)",
  fontSize: "13px",
  color: "var(--text-primary)",
  outline: "none",
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 12px",
  borderRadius: "7px",
  border: "none",
  backgroundColor: "var(--brand)",
  color: "white",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 12px",
  borderRadius: "7px",
  border: "1px solid var(--input-border)",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-primary)",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};

function Th({ children, align }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      style={{
        textAlign: align ?? "left",
        padding: "10px 12px",
        fontSize: "11px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "var(--text-muted)",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
  mono,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  mono?: boolean;
}) {
  return (
    <td
      style={{
        padding: "10px 12px",
        textAlign: align ?? "left",
        color: "var(--text-primary)",
        fontFamily: mono ? "ui-monospace, monospace" : undefined,
      }}
    >
      {children}
    </td>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: "26px",
        height: "26px",
        borderRadius: "6px",
        border: "1px solid var(--card-border)",
        backgroundColor: "transparent",
        cursor: "pointer",
        color: danger ? "#dc2626" : "var(--text-secondary)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: "12px",
        fontWeight: 500,
        color: "var(--text-secondary)",
        marginBottom: "5px",
      }}
    >
      {children}
      {required && <span style={{ color: "#dc2626" }}> *</span>}
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step={type === "number" ? "0.01" : undefined}
        style={inputStyle}
      />
    </div>
  );
}
