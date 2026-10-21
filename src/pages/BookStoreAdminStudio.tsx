import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Store, 
  BookOpen, 
  Tag, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  PlusCircle, 
  Trash2, 
  Download, 
  FileText, 
  Layers, 
  Building2, 
  Key, 
  ShieldCheck, 
  ExternalLink, 
  RefreshCw, 
  User, 
  Calendar, 
  Package, 
  Truck, 
  Lock, 
  Percent, 
  Check, 
  FileCheck, 
  Send, 
  BadgePercent, 
  CreditCard,
  QrCode,
  Loader2,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import { BookStoreDataStore } from "@/services/bookStoreDataStore";
import { NashrDataStore } from "@/services/nashrDataStore";
import { BookStoreItem, BookOrder, BookFormat } from "@/types/bookStore";
import { ManuscriptSubmission, BookSaleRecord } from "@/types/nashr";
import { BookSaleInvoiceModal } from "@/components/bookstore/BookSaleInvoiceModal";
import { generateOfficialBookSaleInvoiceSvg } from "@/services/bookSaleInvoiceHelper";
import { downloadFileOrDataUrl } from "@/services/nashrReceiptHelper";

export const BookStoreAdminStudio: React.FC = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get("tab") || "intake";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Data Stores State
  const [catalog, setCatalog] = useState<BookStoreItem[]>(BookStoreDataStore.getCatalog());
  const [orders, setOrders] = useState<BookOrder[]>(BookStoreDataStore.getOrders());
  const [allSubmissions, setAllSubmissions] = useState<ManuscriptSubmission[]>(NashrDataStore.getAllSubmissions());

  // Search & Filtering
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFormatFilter, setOrderFormatFilter] = useState("all");

  // Pricing & Store Publishing Modal
  const [selectedSubmissionForPricing, setSelectedSubmissionForPricing] = useState<ManuscriptSubmission | null>(null);
  const [pricingTitleAr, setPricingTitleAr] = useState("");
  const [pricingTitleEn, setPricingTitleEn] = useState("");
  const [pricingAuthorAr, setPricingAuthorAr] = useState("");
  const [pricingAuthorEn, setPricingAuthorEn] = useState("");
  const [pricingAuthorCode, setPricingAuthorCode] = useState("");
  const [pricingCategory, setPricingCategory] = useState("academic");
  const [pricingCategoryAr, setPricingCategoryAr] = useState("مراجع ودراسات أكاديمية");
  const [pricingCategoryEn, setPricingCategoryEn] = useState("Academic References");
  const [pricingDigitalPrice, setPricingDigitalPrice] = useState<number | string>(120);
  const [pricingPrintPrice, setPricingPrintPrice] = useState<number | string>(190);
  const [pricingStockPrint, setPricingStockPrint] = useState<number | string>(50);
  const [pricingIsbn, setPricingIsbn] = useState("");
  const [pricingBookCode, setPricingBookCode] = useState("");
  const [pricingDescriptionAr, setPricingDescriptionAr] = useState("");
  const [pricingDescriptionEn, setPricingDescriptionEn] = useState("");
  const [pricingPages, setPricingPages] = useState<number | string>(250);
  const [pricingCoverUrl, setPricingCoverUrl] = useState("");
  const [publishingToStore, setPublishingToStore] = useState(false);

  // Edit Catalog Item Price & Stock Modal
  const [editingBookItem, setEditingBookItem] = useState<BookStoreItem | null>(null);
  const [editItemDigitalPrice, setEditItemDigitalPrice] = useState<number | string>(100);
  const [editItemPrintPrice, setEditItemPrintPrice] = useState<number | string>(180);
  const [editItemStock, setEditItemStock] = useState<number | string>(30);

  // Manual / Test Order Creation Modal
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [orderSelectedBookId, setOrderSelectedBookId] = useState("");
  const [orderFormat, setOrderFormat] = useState<"digital" | "print">("digital");
  const [orderBuyerName, setOrderBuyerName] = useState("د. أحمد سلامة");
  const [orderBuyerEmail, setOrderBuyerEmail] = useState("buyer@unigates.edu");
  const [orderBuyerCity, setOrderBuyerCity] = useState("القاهرة، مصر");
  const [orderQuantity, setOrderQuantity] = useState<number | string>(1);
  const [creatingOrder, setCreatingOrder] = useState(false);

  // Preview File/Cover modals
  const [previewCoverUrl, setPreviewCoverUrl] = useState<string | null>(null);

  // Official Book Sale Invoice Modal State
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<BookOrder | null>(null);
  const [selectedSaleForInvoiceModal, setSelectedSaleForInvoiceModal] = useState<BookSaleRecord | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);

  // Synchronize tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setSearchParams({ tab: val });
  };

  const loadData = () => {
    setCatalog(BookStoreDataStore.getCatalog());
    setOrders(BookStoreDataStore.getOrders());
    setAllSubmissions(NashrDataStore.getAllSubmissions());
  };

  // Real-time synchronization
  useEffect(() => {
    const handleStorage = () => loadData();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Filter pending intake books from Nashr Platform
  // These are submissions that have status 'ready_for_pricing' or 'approved' without a store code
  const intakeSubmissions = allSubmissions.filter(
    (s) => s.status === "ready_for_pricing" || (s.status === "approved" && !s.storeBookCode)
  );

  // Check if a specific submission ID was requested via URL param (e.g., from Admin dashboard redirect)
  useEffect(() => {
    const targetSubId = searchParams.get("submissionId");
    if (targetSubId) {
      const found = allSubmissions.find((s) => s.id === targetSubId);
      if (found) {
        handleOpenPricingModal(found);
      }
    }
  }, [allSubmissions, searchParams]);

  // Open Pricing Modal
  const handleOpenPricingModal = (sub: ManuscriptSubmission) => {
    setSelectedSubmissionForPricing(sub);
    setPricingTitleAr(sub.title || "");
    setPricingTitleEn(sub.title || "");
    setPricingAuthorAr(sub.authorName || "");
    setPricingAuthorEn(sub.authorName || "");
    setPricingAuthorCode(sub.authorCode || "AUTH-2026-001");

    // Category mapping
    let catKey = "academic";
    let catAr = "مراجع ودراسات أكاديمية";
    let catEn = "Academic References";
    if (sub.category?.includes("تقنية") || sub.category?.includes("ذكاء")) {
      catKey = "technology";
      catAr = "الذكاء الاصطناعي والتقنية";
      catEn = "AI & Technology";
    } else if (sub.category?.includes("إدارة") || sub.category?.includes("اقتصاد")) {
      catKey = "business";
      catAr = "إدارة الأعمال والقيادة";
      catEn = "Business & Leadership";
    } else if (sub.category?.includes("أدب") || sub.category?.includes("رواية")) {
      catKey = "humanities";
      catAr = "العلوم الإنسانية واللغات";
      catEn = "Humanities";
    }
    setPricingCategory(catKey);
    setPricingCategoryAr(catAr);
    setPricingCategoryEn(catEn);

    // Default prices based on publish type
    if (sub.publishType === "digital") {
      setPricingDigitalPrice(90);
      setPricingPrintPrice(0);
    } else if (sub.publishType === "print") {
      setPricingDigitalPrice(0);
      setPricingPrintPrice(170);
    } else {
      setPricingDigitalPrice(120);
      setPricingPrintPrice(190);
    }

    setPricingStockPrint(sub.publishType === "digital" ? 0 : 50);
    setPricingPages(sub.pageCount || 240);
    setPricingDescriptionAr(sub.synopsis || "مؤلف أكاديمي محكم صادر عن دار عبيد للنشر والتوزيع.");
    setPricingDescriptionEn(sub.synopsis || "Peer-reviewed academic work published by Dar Obeid.");

    // Generate unique Book Code and ISBN
    const randomCode = `BK-DAR-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomIsbn = `978-977-${Math.floor(10 + Math.random() * 89)}-${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1 + Math.random() * 9)}`;
    setPricingBookCode(sub.storeBookCode || randomCode);
    setPricingIsbn(randomIsbn);

    const cover = sub.coverImageUrl || (typeof sub.coverImage === "string" && (sub.coverImage.startsWith("data:") || sub.coverImage.startsWith("http")) ? sub.coverImage : "") || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600";
    setPricingCoverUrl(cover);
  };

  // Submit Book to Live Book Store
  const handlePublishToStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmissionForPricing) return;

    setPublishingToStore(true);
    setTimeout(() => {
      const newBook: BookStoreItem = {
        id: `bk-${Date.now()}`,
        code: pricingBookCode,
        author_code: pricingAuthorCode,
        author_id: selectedSubmissionForPricing.authorId,
        submission_id: selectedSubmissionForPricing.id,
        title_ar: pricingTitleAr.trim(),
        title_en: pricingTitleEn.trim() || pricingTitleAr.trim(),
        author_ar: pricingAuthorAr.trim(),
        author_en: pricingAuthorEn.trim() || pricingAuthorAr.trim(),
        publisher_ar: "دار عبيد للنشر والتوزيع والطباعة",
        publisher_en: "Dar Obeid Publishing & Distribution",
        publisher_id: "pub-obeid-001",
        category: pricingCategory,
        category_ar: pricingCategoryAr,
        category_en: pricingCategoryEn,
        description_ar: pricingDescriptionAr.trim(),
        description_en: pricingDescriptionEn.trim(),
        price_digital: Number(pricingDigitalPrice) || 0,
        price_print: Number(pricingPrintPrice) || 0,
        currency: "EGP",
        pages: Number(pricingPages) || 200,
        format: selectedSubmissionForPricing.publishType || "both",
        cover_url: pricingCoverUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600",
        isbn: pricingIsbn,
        rating: 5.0,
        reviews_count: 1,
        publish_year: 2026,
        is_new: true,
        is_featured: true,
        stock_print: Number(pricingStockPrint) || 40,
        full_content_chapters: [
          {
            id: "ch-1",
            title_ar: "الفصل الأول: المقدمة التمهيدية والإطار النظري",
            title_en: "Chapter 1: Introduction & Theoretical Framework",
            content_ar: selectedSubmissionForPricing.synopsis || "مقدمة تمهيدية للمؤلف...",
            content_en: "Introductory chapter..."
          }
        ]
      };

      // 1. Add to Bookstore Catalog
      BookStoreDataStore.addBookToCatalog(newBook);

      // 2. Mark submission in NashrDataStore as published with its new book code
      NashrDataStore.updateSubmissionStatus(
        selectedSubmissionForPricing.id,
        "published",
        `🎉 تهانينا! تم تسعير كتابكم وطرحه رسمياً في متجر كتب UNIGATES برقم كود (${pricingBookCode}). أصبحت مبيعاتكم ونسب أرباحكم متصلة مباشرة بلوحة تحكمكم.`,
        pricingBookCode
      );

      loadData();
      setPublishingToStore(false);
      setSelectedSubmissionForPricing(null);

      toast({
        title: isRtl ? "🎉 تم نشر الكتاب رسمياً في متجر الكتب!" : "Book Published to Live Store!",
        description: isRtl 
          ? `أصبح الكتاب متاحاً للشراء في المتجر برمز (${pricingBookCode})، ومربوطاً بحساب المؤلف (${pricingAuthorCode}).`
          : `Book is now live for buyers with code ${pricingBookCode}.`
      });

      // Switch to Catalog Tab
      handleTabChange("catalog");
    }, 600);
  };

  // Save Catalog Item Price Update
  const handleSaveBookPriceEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBookItem) return;

    BookStoreDataStore.updateBookInCatalog(editingBookItem.id, {
      price_digital: Number(editItemDigitalPrice) || 0,
      price_print: Number(editItemPrintPrice) || 0,
      stock_print: Number(editItemStock) || 0
    });

    loadData();
    setEditingBookItem(null);
    toast({
      title: isRtl ? "تم تحديث التسعير والمخزون بنجاح" : "Pricing & Stock Updated",
      description: isRtl ? "تم تطبيق الأسعار الجديدة في واجهة متجر الكتب فورياً." : "New prices are live on store."
    });
  };

  // Create Manual / Test Order
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderSelectedBookId) {
      toast({
        title: isRtl ? "يرجى اختيار الكتاب" : "Select a book",
        variant: "destructive"
      });
      return;
    }

    const targetBook = catalog.find((b) => b.id === orderSelectedBookId || b.code === orderSelectedBookId);
    if (!targetBook) return;

    setCreatingOrder(true);
    setTimeout(() => {
      const qty = Number(orderQuantity) || 1;
      const unitPrice = orderFormat === "digital" ? targetBook.price_digital : targetBook.price_print;
      const subtotal = unitPrice * qty;
      const shippingFee = orderFormat === "print" ? 45 : 0;
      const platformFee = Math.round(subtotal * 0.20);
      const totalAmount = subtotal + shippingFee;
      const orderNumber = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

      const royaltyRate = orderFormat === "digital" ? 70 : 30;
      const authorRoyalty = Math.round(subtotal * (royaltyRate / 100));

      const newOrder: BookOrder = {
        id: `ord-${Date.now()}`,
        orderNumber,
        userId: `usr-${Date.now()}`,
        userName: orderBuyerName.trim(),
        userEmail: orderBuyerEmail.trim(),
        items: [
          {
            bookId: targetBook.id,
            bookCode: targetBook.code,
            bookTitle: targetBook.title_ar,
            bookCover: targetBook.cover_url,
            format: orderFormat,
            price: unitPrice,
            quantity: qty,
            authorCode: targetBook.author_code,
            authorName: targetBook.author_ar,
            authorRoyalty
          }
        ],
        subtotal,
        shippingFee,
        platformFee,
        totalAmount,
        currency: "EGP",
        status: "completed",
        paymentMethod: "instapay",
        createdAt: new Date().toISOString().split("T")[0],
        shippingAddress: orderFormat === "print" ? {
          fullName: orderBuyerName,
          phone: "01099887766",
          country: "مصر",
          city: orderBuyerCity,
          streetAddress: "شارع النصر، مبنى الأكاديمية",
          deliveryMethod: "express"
        } : undefined
      };

      // 1. Create order in BookStoreDataStore (which also auto-credits author royalties in NashrDataStore!)
      BookStoreDataStore.createOrder(newOrder);

      // If physical book, decrease stock
      if (orderFormat === "print" && typeof targetBook.stock_print === "number") {
        BookStoreDataStore.updateBookInCatalog(targetBook.id, {
          stock_print: Math.max(0, targetBook.stock_print - qty)
        });
      }

      loadData();
      setCreatingOrder(false);
      setShowCreateOrderModal(false);

      toast({
        title: isRtl ? "🎉 تم تسجيل طلب الشراء واحتساب أرباح المؤلف بنجاح!" : "Order Recorded & Royalties Credited!",
        description: isRtl 
          ? `تم قيد العملية (${orderNumber}) وإيداع حصة المؤلف (${authorRoyalty} ج.م) في حساب كود (${targetBook.author_code || "المؤلف"}).`
          : `Order ${orderNumber} created. Author credited ${authorRoyalty} EGP.`
      });
    }, 500);
  };

  // Open Official Book Sale Invoice Modal
  const handleViewOrderInvoice = (ord: BookOrder) => {
    setSelectedOrderForInvoice(ord);
    const item = ord.items && ord.items[0];
    const sale: BookSaleRecord = {
      id: ord.id,
      bookId: item?.bookId || "",
      bookTitle: item?.bookTitle || "كتاب من المتجر",
      bookCode: item?.bookCode || "BK-DAR-4491",
      authorId: "auth-2026-001",
      authorName: item?.authorName || "د. السيد المنشاوي",
      authorCode: item?.authorCode || "AUT-7890",
      format: (item?.format as "digital" | "print") || "digital",
      salePrice: ord.subtotal || item?.price || 0,
      authorRoyaltyPercentage: item?.format === "digital" ? 70 : 30,
      authorEarnings: item?.authorRoyalty || Math.round((ord.subtotal || 0) * (item?.format === "digital" ? 0.7 : 0.3)),
      date: ord.createdAt,
      orderNumber: ord.orderNumber,
      invoiceNumber: `INV-${ord.orderNumber.replace(/[^0-9]/g, "") || Date.now().toString().slice(-5)}`,
      buyerName: ord.userName,
      buyerEmail: ord.userEmail,
      buyerCity: ord.shippingAddress?.city || "القاهرة، مصر",
      paymentMethod: ord.paymentMethod || "instapay",
      quantity: item?.quantity || 1,
      status: ord.status
    };
    setSelectedSaleForInvoiceModal(sale);
    setShowInvoiceModal(true);
  };

  // Filter Catalog
  const filteredCatalog = catalog.filter((b) => {
    if (!b) return false;
    const q = (catalogSearch || "").trim().toLowerCase();
    const matchesCat = catalogCategory === "all" || b.category === catalogCategory;
    const matchesSearch =
      !q ||
      b.title_ar?.toLowerCase().includes(q) ||
      b.title_en?.toLowerCase().includes(q) ||
      b.author_ar?.toLowerCase().includes(q) ||
      b.code?.toLowerCase().includes(q) ||
      b.author_code?.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  // Filter Orders
  const filteredOrders = orders.filter((ord) => {
    if (!ord) return false;
    const q = (orderSearch || "").trim().toLowerCase();
    const matchesFormat =
      orderFormatFilter === "all" ||
      ord.items.some((it) => it.format === orderFormatFilter);
    const matchesSearch =
      !q ||
      ord.orderNumber.toLowerCase().includes(q) ||
      ord.userName.toLowerCase().includes(q) ||
      ord.items.some(
        (it) =>
          it.bookTitle.toLowerCase().includes(q) ||
          it.bookCode?.toLowerCase().includes(q) ||
          it.authorCode?.toLowerCase().includes(q)
      );
    return matchesFormat && matchesSearch;
  });

  // Financial Stats calculations
  const totalGrossRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const totalAuthorRoyaltiesCalculated = orders.reduce((acc, o) => {
    const orderAuthorShare = o.items.reduce((sum, it) => {
      if (typeof it.authorRoyalty === "number") return sum + it.authorRoyalty;
      const rate = it.format === "digital" ? 0.70 : 0.30;
      return sum + Math.round(it.price * rate * it.quantity);
    }, 0);
    return acc + orderAuthorShare;
  }, 0);

  const totalCopiesSold = orders.reduce((acc, o) => {
    return acc + o.items.reduce((sum, it) => sum + it.quantity, 0);
  }, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-500 selection:text-white" dir={dir}>
      
      {/* ── Top Navigation Bar ── */}
      <header className="border-b border-border/70 px-4 sm:px-8 py-3.5 bg-card/80 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 p-0.5 shadow-md flex items-center justify-center text-white font-black text-lg">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-foreground">UNIGATES</span>
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-black px-2 py-0.5">
                {isRtl ? "استوديو إدارة متجر الكتب" : "Bookstore Management Studio"}
              </Badge>
              <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] font-bold px-2 py-0.5">
                {isRtl ? "المرحلة الثانية • متجر ومبيعات" : "Phase 2 • Store & Sales"}
              </Badge>
            </div>
            <span className="text-[11px] block text-muted-foreground font-semibold">
              {isRtl ? "دار عبيد للنشر والتوزيع • المنظومة الرقمية الموحدة" : "Dar Obeid Publishing & Distribution"}
            </span>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Decoupled Navigation: Return to Unified Admin Overview */}
          <Link to="/admin/overview">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
            >
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{isRtl ? "المنظومة المركزية 🏛️" : "Central Hub 🏛️"}</span>
            </Button>
          </Link>

          {/* Direct link to View Live Book Store */}
          <Link to="/book-store" target="_blank" rel="noopener noreferrer">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border-border hover:bg-muted"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">{isRtl ? "عرض المتجر المباشر" : "Live Store"}</span>
            </Button>
          </Link>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData}
            className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border-border hover:bg-muted"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">{isRtl ? "تحديث" : "Refresh"}</span>
          </Button>

          <LanguageSelectorDropdown className="h-9 px-3" />
          <ThemeToggle className="h-9 w-9 p-0 rounded-xl" />
        </div>
      </header>

      {/* ── Main Dashboard Workspace ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-6">
        
        {/* Hero Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-background border-2 border-border/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 text-start">
            <Badge className="bg-amber-500 text-white font-black text-xs px-2.5 py-0.5">
              {isRtl ? "إدارة متجر الكتب والمبيعات المباشرة" : "Bookstore & Direct Sales Administration"}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {isRtl ? "استوديو إدارة وتسعير ومبيعات متجر كتب UNIGATES" : "UNIGATES Book Store Studio"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {isRtl 
                ? "استقبال المخطوطات والكتب المعتمدة من منصة النشر، وإكمال تسعير النسخ الرقمية والورقية ووصفها، وإطلاقها رسمياً في المتجر، مع التتبع الفوري لعمليات الشراء وأرباح المؤلفين."
                : "Manage intake from Publishing Board, set pricing, publish to store, and monitor customer orders and author royalty splits."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              onClick={() => setShowCreateOrderModal(true)}
              className="h-11 px-5 rounded-2xl font-black text-xs bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-lg shadow-amber-500/20 gap-2 cursor-pointer hover:scale-105 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{isRtl ? "تسجيل طلب بيع تجريبي 🛒" : "Simulate Store Order 🛒"}</span>
            </Button>
          </div>
        </div>

        {/* ── Top Metric KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Metric 1: Pending Intake Books */}
          <Card 
            onClick={() => handleTabChange("intake")}
            className="rounded-3xl border-2 border-border/80 hover:border-amber-500/50 transition-all p-5 bg-card cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">
                {isRtl ? "كتب واردة بانتظار التسعير" : "Pending Intake Books"}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                {intakeSubmissions.length}
              </span>
              <span className="text-[11px] font-bold text-muted-foreground">{isRtl ? "كتاب محال" : "books"}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {isRtl ? "بانتظار إعداد التسعير وإطلاقها بالمتجر" : "Ready for pricing & publishing"}
            </p>
          </Card>

          {/* Metric 2: Live Books in Catalog */}
          <Card 
            onClick={() => handleTabChange("catalog")}
            className="rounded-3xl border-2 border-border/80 hover:border-blue-500/50 transition-all p-5 bg-card cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">
                {isRtl ? "الكتب المعروضة في المتجر" : "Live Store Catalog"}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-foreground">
                {catalog.length}
              </span>
              <span className="text-[11px] font-bold text-muted-foreground">{isRtl ? "مؤلف منشور" : "titles"}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {isRtl ? "متاحة للشراء للقرّاء والمؤسسات" : "Active on bookstore catalog"}
            </p>
          </Card>

          {/* Metric 3: Total Orders */}
          <Card 
            onClick={() => handleTabChange("orders")}
            className="rounded-3xl border-2 border-border/80 hover:border-emerald-500/50 transition-all p-5 bg-card cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">
                {isRtl ? "عمليات الشراء والطلبات" : "Store Orders & Sales"}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {orders.length}
              </span>
              <span className="text-[11px] font-bold text-muted-foreground">{isRtl ? "طلب مكتمل" : "orders"}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {isRtl ? `${totalCopiesSold} نسخة مباعة (رقمي / ورقي)` : `${totalCopiesSold} copies sold`}
            </p>
          </Card>

          {/* Metric 4: Total Revenue & Author Royalties */}
          <Card 
            onClick={() => handleTabChange("analytics")}
            className="rounded-3xl border-2 border-border/80 hover:border-purple-500/50 transition-all p-5 bg-card cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">
                {isRtl ? "إجمالي مبيعات المتجر" : "Gross Store Revenue"}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-foreground">
                {totalGrossRevenue.toLocaleString()}
              </span>
              <span className="text-[11px] font-bold text-muted-foreground">EGP</span>
            </div>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-1">
              {isRtl ? `أرباح المؤلفين: ${totalAuthorRoyaltiesCalculated.toLocaleString()} ج.م` : `Author royalties: ${totalAuthorRoyaltiesCalculated} EGP`}
            </p>
          </Card>

        </div>

        {/* ── Main Tabbed Workspaces ── */}
        <Card className="rounded-3xl border-2 border-border/80 shadow-md bg-card overflow-hidden">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="p-3 bg-muted/30 border-b border-border/70 overflow-x-auto scrollbar-none">
              <TabsList className="bg-muted/50 p-1 rounded-2xl h-auto gap-1">
                
                {/* Tab 1: Intake from Publishing */}
                <TabsTrigger 
                  value="intake"
                  className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md font-bold text-xs sm:text-sm py-3 px-4 rounded-xl gap-2 transition-all"
                >
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>{isRtl ? "1. الكتب الواردة من النشر (بانتظار التسعير)" : "1. Pending Intake Books"}</span>
                  {intakeSubmissions.length > 0 && (
                    <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 h-4 font-black">
                      {intakeSubmissions.length}
                    </Badge>
                  )}
                </TabsTrigger>

                {/* Tab 2: Catalog Books */}
                <TabsTrigger 
                  value="catalog"
                  className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md font-bold text-xs sm:text-sm py-3 px-4 rounded-xl gap-2 transition-all"
                >
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span>{isRtl ? "2. كتالوج الكتب المعروضة في المتجر" : "2. Live Catalog"}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-bold border-border">
                    {catalog.length}
                  </Badge>
                </TabsTrigger>

                {/* Tab 3: Orders & Sales Ledger */}
                <TabsTrigger 
                  value="orders"
                  className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md font-bold text-xs sm:text-sm py-3 px-4 rounded-xl gap-2 transition-all"
                >
                  <ShoppingCart className="w-4 h-4 text-emerald-500" />
                  <span>{isRtl ? "3. عمليات الشراء والطلبات والمبيعات" : "3. Orders & Author Royalties"}</span>
                  {orders.length > 0 && (
                    <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 h-4 font-black">
                      {orders.length}
                    </Badge>
                  )}
                </TabsTrigger>

                {/* Tab 4: Analytics */}
                <TabsTrigger 
                  value="analytics"
                  className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md font-bold text-xs sm:text-sm py-3 px-4 rounded-xl gap-2 transition-all"
                >
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <span>{isRtl ? "4. التقارير والأداء المالي للمتجر" : "4. Store Analytics"}</span>
                </TabsTrigger>

              </TabsList>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* TAB 1: 📥 الكتب الواردة من النشر (بانتظار التسعير والنشر) */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <TabsContent value="intake" className="p-5 sm:p-6 space-y-6 m-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-foreground">
                    {isRtl ? "المخطوطات والكتب المعتمدة المحالة من إدارة النشر" : "Approved Books Transferred from Publishing"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRtl 
                      ? "هذه الكتب تمت الموافقة عليها أكاديمياً وإدارياً بدار عبيد، وبانتظار قيام إدارة المتجر بتحديد أسعار البيع واستكمال الوصف التسويقي لإطلاقها بالمتجر."
                      : "Approved submissions waiting for commercial pricing, store tags & description before public listing."}
                  </p>
                </div>
              </div>

              {intakeSubmissions.length === 0 ? (
                <div className="py-16 text-center rounded-3xl border-2 border-dashed border-border/80 bg-muted/20 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
                    ✓
                  </div>
                  <h4 className="font-black text-foreground text-sm">
                    {isRtl ? "لا توجد كتب واردة بانتظار التسعير حالياً" : "No pending intake books"}
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    {isRtl 
                      ? "تم تسعير ونشر جميع الكتب المعتمدة في المتجر بنجاح. عند قيام إدارة النشر بقبول مخطوطة جديدة ستظهر هنا فورياً."
                      : "All approved books are cataloged and priced."}
                  </p>
                  <div className="pt-2">
                    <Link to="/admin/dashboard">
                      <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1.5">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>{isRtl ? "الانتقال للوحة إدارة النشر لمراجعة المخطوطات ➔" : "Go to Publishing Admin"}</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {intakeSubmissions.map((sub) => (
                    <Card key={sub.id} className="rounded-3xl border-2 border-border/80 hover:border-amber-500/50 transition-all bg-card overflow-hidden flex flex-col justify-between">
                      <div className="p-5 space-y-4">
                        
                        {/* Header Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/60">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-muted-foreground">{sub.id}</span>
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold">
                              {sub.category}
                            </Badge>
                          </div>
                          <Badge className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5">
                            {isRtl ? "جاهز للتسعير والنشر 🏷️" : "Ready for Pricing"}
                          </Badge>
                        </div>

                        {/* Book Info with Cover */}
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-22 rounded-xl border border-border/80 overflow-hidden bg-slate-950 shrink-0 shadow-sm relative group">
                            {(sub.coverImageUrl || (sub.coverImage && (sub.coverImage.startsWith("data:") || sub.coverImage.startsWith("http")))) ? (
                              <img 
                                src={sub.coverImageUrl || sub.coverImage} 
                                alt="Cover" 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-amber-500 text-xs">
                                📖
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5 text-start flex-1 min-w-0">
                            <h4 className="font-black text-sm sm:text-base text-foreground leading-snug truncate">
                              {sub.title}
                            </h4>
                            
                            {/* Author info & authorCode */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-bold text-foreground">✍️ {sub.authorName}</span>
                              <Badge variant="outline" className="font-mono text-[10px] font-black text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/5">
                                {sub.authorCode}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                              <span>📄 {sub.pageCount} صفحة</span>
                              <span>•</span>
                              <span>🌐 {sub.language}</span>
                              <span>•</span>
                              <span>
                                {sub.publishType === "both" 
                                  ? "ورقي + رقمي" 
                                  : sub.publishType === "digital" 
                                  ? "رقمي فقط" 
                                  : "ورقي فقط"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Synopsis */}
                        <p className="text-xs text-muted-foreground line-clamp-3 bg-muted/20 p-2.5 rounded-xl border border-border/60 leading-relaxed">
                          {sub.synopsis}
                        </p>

                        {/* Attached Manuscript Info */}
                        {sub.manuscriptFile && (
                          <div className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/70 text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                              <span className="font-bold truncate text-[11px]">{sub.manuscriptFile.name}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono shrink-0">{sub.manuscriptFile.size}</span>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="p-4 bg-muted/30 border-t border-border/70 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-muted-foreground">
                          {isRtl ? `تاريخ الإحالة: ${sub.submissionDate}` : sub.submissionDate}
                        </span>

                        <Button
                          onClick={() => handleOpenPricingModal(sub)}
                          className="h-9 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-md gap-1.5 cursor-pointer hover:scale-105 transition-all"
                        >
                          <Tag className="w-3.5 h-3.5" />
                          <span>{isRtl ? "تسعير وإطلاق الكتاب بالمتجر 🚀" : "Price & Publish to Store 🚀"}</span>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* TAB 2: 📚 كتالوج الكتب المعروضة في المتجر (الكتب المنشورة) */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <TabsContent value="catalog" className="p-5 sm:p-6 space-y-6 m-0">
              
              {/* Search & Filter Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2" style={{ [isRtl ? "right" : "left"]: "0.75rem" }} />
                  <Input 
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder={isRtl ? "ابحث بالعنوان، كود الكتاب، أو كود المؤلف..." : "Search catalog..."}
                    className="h-10 rounded-xl text-xs bg-muted/20"
                    style={{ [isRtl ? "paddingRight" : "paddingLeft"]: "2.25rem" }}
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                  <Select value={catalogCategory} onValueChange={setCatalogCategory}>
                    <SelectTrigger className="h-10 w-44 rounded-xl text-xs bg-muted/20">
                      <SelectValue placeholder={isRtl ? "التصنيف" : "Category"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isRtl ? "جميع التصنيفات" : "All Categories"}</SelectItem>
                      <SelectItem value="academic">{isRtl ? "مراجع ودراسات أكاديمية" : "Academic"}</SelectItem>
                      <SelectItem value="technology">{isRtl ? "الذكاء الاصطناعي والتقنية" : "Technology"}</SelectItem>
                      <SelectItem value="business">{isRtl ? "إدارة الأعمال والقيادة" : "Business"}</SelectItem>
                      <SelectItem value="humanities">{isRtl ? "العلوم الإنسانية واللغات" : "Humanities"}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Link to="/book-store" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="h-10 px-3 rounded-xl text-xs font-bold gap-1.5 shrink-0">
                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                      <span>{isRtl ? "معاينة المتجر 🌐" : "Live Store"}</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Catalog Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCatalog.map((book) => {
                  // Calculate copies sold from orders
                  const bookOrders = orders.filter((o) => o.items.some((it) => it.bookId === book.id || it.bookCode === book.code));
                  const copiesSold = bookOrders.reduce((sum, o) => {
                    const matchedItems = o.items.filter((it) => it.bookId === book.id || it.bookCode === book.code);
                    return sum + matchedItems.reduce((s, it) => s + it.quantity, 0);
                  }, 0);

                  return (
                    <Card key={book.id} className="rounded-3xl border-2 border-border/80 hover:border-amber-500/40 transition-all bg-card overflow-hidden flex flex-col justify-between">
                      <div className="p-4 sm:p-5 space-y-3.5">
                        
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                            {book.code}
                          </span>
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                            {isRtl ? "معروض بالمتجر 🟢" : "Active Live"}
                          </Badge>
                        </div>

                        {/* Book Media & Info */}
                        <div className="flex items-start gap-3.5">
                          <img 
                            src={book.cover_url} 
                            alt={book.title_ar}
                            className="w-18 h-24 rounded-xl object-cover border border-border/80 shadow-sm shrink-0 bg-slate-950" 
                          />
                          <div className="space-y-1 text-start flex-1 min-w-0">
                            <h4 className="font-black text-sm text-foreground line-clamp-2 leading-snug">
                              {book.title_ar}
                            </h4>
                            <p className="text-xs text-muted-foreground font-semibold truncate">
                              ✍️ {book.author_ar}
                            </p>
                            {book.author_code && (
                              <Badge variant="outline" className="font-mono text-[10px] font-black text-blue-600 border-blue-500/40 bg-blue-500/5">
                                كود المؤلف: {book.author_code}
                              </Badge>
                            )}
                            <p className="text-[10px] text-muted-foreground truncate">
                              ISBN: {book.isbn}
                            </p>
                          </div>
                        </div>

                        {/* Pricing details */}
                        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-muted/30 border border-border/70 text-xs text-start">
                          <div>
                            <span className="text-[10px] text-muted-foreground block">{isRtl ? "النسخة الرقمية (E-Book):" : "Digital:"}</span>
                            <span className="font-black text-amber-600">{book.price_digital} EGP</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block">{isRtl ? "النسخة الورقية (مطبوع):" : "Print:"}</span>
                            <span className="font-black text-foreground">{book.price_print} EGP</span>
                          </div>
                        </div>

                        {/* Sales performance */}
                        <div className="flex items-center justify-between text-xs px-1 text-muted-foreground">
                          <span>{isRtl ? "المبيعات:" : "Sales:"} <strong className="text-foreground">{copiesSold} نسخة</strong></span>
                          <span>{isRtl ? "المخزون الورقي:" : "Stock:"} <strong className="text-foreground">{book.stock_print || 0}</strong></span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-3 bg-muted/20 border-t border-border/70 flex items-center justify-between gap-2">
                        <Link to={`/book-store?code=${book.code}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" className="h-8 px-2.5 text-xs font-bold text-muted-foreground hover:text-foreground gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isRtl ? "عرض بالمتجر" : "Store Page"}</span>
                          </Button>
                        </Link>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingBookItem(book);
                            setEditItemDigitalPrice(book.price_digital);
                            setEditItemPrintPrice(book.price_print);
                            setEditItemStock(book.stock_print || 0);
                          }}
                          className="h-8 px-3 rounded-xl text-xs font-black border-amber-500/40 text-amber-600 hover:bg-amber-500/10 gap-1.5"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{isRtl ? "تعديل التسعير والمخزون" : "Edit Price"}</span>
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* TAB 3: 🛒 عمليات الشراء والطلبات والمبيعات (Orders & Royalties) */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <TabsContent value="orders" className="p-5 sm:p-6 space-y-6 m-0">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-foreground">
                    {isRtl ? "سجل عمليات الشراء والطلبات المنفذة في المتجر" : "Customer Orders & Sales Records"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRtl 
                      ? "جميع عمليات البيع مسجلة تلقائياً ومربوطة بأكواد المؤلفين، مع احتساب فوري لنسبة المؤلف (70% رقمي / 30% ورقي) وإضافتها لرصيدهم."
                      : "Orders reflect instantly in author accounts linked by Author Code."}
                  </p>
                </div>

                <Button
                  onClick={() => setShowCreateOrderModal(true)}
                  className="h-9 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white gap-1.5 shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{isRtl ? "إضافة طلب بيع يدوي / تجريبي" : "Add Test Order"}</span>
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2" style={{ [isRtl ? "right" : "left"]: "0.75rem" }} />
                  <Input 
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder={isRtl ? "ابحث برقم الطلب، اسم المشتري، أو كود المؤلف..." : "Search orders..."}
                    className="h-10 rounded-xl text-xs bg-muted/20"
                    style={{ [isRtl ? "paddingRight" : "paddingLeft"]: "2.25rem" }}
                  />
                </div>

                <Select value={orderFormatFilter} onValueChange={setOrderFormatFilter}>
                  <SelectTrigger className="h-10 w-44 rounded-xl text-xs bg-muted/20">
                    <SelectValue placeholder={isRtl ? "صيغة الطلب" : "Format"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRtl ? "جميع الصيغ" : "All Formats"}</SelectItem>
                    <SelectItem value="digital">{isRtl ? "رقمي (E-Book)" : "Digital Only"}</SelectItem>
                    <SelectItem value="print">{isRtl ? "ورقي (مطبوع)" : "Print Only"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Orders Table */}
              <div className="rounded-3xl border-2 border-border/80 overflow-hidden bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start">
                    <thead className="bg-muted/40 border-b border-border/70 text-muted-foreground font-black">
                      <tr>
                        <th className="p-3.5 text-start">{isRtl ? "رقم الطلب" : "Order #"}</th>
                        <th className="p-3.5 text-start">{isRtl ? "الكتاب والمؤلف" : "Book & Author"}</th>
                        <th className="p-3.5 text-start">{isRtl ? "كود المؤلف" : "Author Code"}</th>
                        <th className="p-3.5 text-start">{isRtl ? "المشتري" : "Buyer"}</th>
                        <th className="p-3.5 text-start">{isRtl ? "الصيغة" : "Format"}</th>
                        <th className="p-3.5 text-start">{isRtl ? "القيمة الإجمالية" : "Gross"}</th>
                        <th className="p-3.5 text-start">{isRtl ? "حصة أرباح المؤلف" : "Author Share"}</th>
                        <th className="p-3.5 text-start">{isRtl ? "الحالة" : "Status"}</th>
                        <th className="p-3.5 text-center">{isRtl ? "الإجراءات / فاتورة البيع" : "Actions / Invoice"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-muted-foreground font-bold">
                            {isRtl ? "لا توجد طلبات تطابق معايير البحث." : "No orders found."}
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((ord) => {
                          const item = ord.items[0];
                          const rate = item?.format === "digital" ? 0.70 : 0.30;
                          const calculatedAuthorEarnings = typeof item?.authorRoyalty === "number" 
                            ? item.authorRoyalty 
                            : Math.round((item?.price || 0) * (item?.quantity || 1) * rate);

                          return (
                            <tr key={ord.id} className="hover:bg-muted/20 transition-colors">
                              
                              {/* Order # and Date */}
                              <td className="p-3.5 font-mono font-bold text-foreground">
                                <div className="space-y-0.5">
                                  <span>{ord.orderNumber}</span>
                                  <span className="text-[10px] text-muted-foreground block">{ord.createdAt}</span>
                                </div>
                              </td>

                              {/* Book Title */}
                              <td className="p-3.5 font-bold text-foreground max-w-[200px]">
                                <div className="space-y-0.5 truncate">
                                  <span className="truncate block" title={item?.bookTitle}>{item?.bookTitle || "كتاب المتجر"}</span>
                                  <span className="text-[10px] text-muted-foreground font-mono">{item?.bookCode || "BK-STORE"}</span>
                                </div>
                              </td>

                              {/* Author Code */}
                              <td className="p-3.5">
                                <Badge variant="outline" className="font-mono text-[10px] font-black text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/5">
                                  {item?.authorCode || "AUTH-2026-001"}
                                </Badge>
                              </td>

                              {/* Buyer Name */}
                              <td className="p-3.5">
                                <div className="space-y-0.5 text-muted-foreground">
                                  <span className="font-bold text-foreground block">{ord.userName}</span>
                                  <span className="text-[10px] block">{ord.userEmail}</span>
                                </div>
                              </td>

                              {/* Format */}
                              <td className="p-3.5">
                                <Badge className={
                                  item?.format === "digital" 
                                    ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px]"
                                    : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px]"
                                }>
                                  {item?.format === "digital" ? (isRtl ? "رقمي DRM (70%)" : "Digital (70%)") : (isRtl ? "ورقي مطبوع (30%)" : "Print (30%)")}
                                </Badge>
                              </td>

                              {/* Gross Amount */}
                              <td className="p-3.5 font-black text-foreground">
                                {ord.totalAmount} EGP
                              </td>

                              {/* Author Royalty */}
                              <td className="p-3.5 font-black text-emerald-600 dark:text-emerald-400">
                                +{calculatedAuthorEarnings} EGP
                              </td>

                              {/* Status */}
                              <td className="p-3.5">
                                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] font-black">
                                  {isRtl ? "مكتمل ومودع ✅" : "Completed"}
                                </Badge>
                              </td>

                              {/* Invoice Actions */}
                              <td className="p-3.5 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewOrderInvoice(ord)}
                                    className="h-7 px-2.5 text-[11px] font-bold rounded-lg gap-1 border-primary/30 hover:border-primary text-primary hover:bg-primary/10 shadow-sm"
                                    title={isRtl ? "عرض فاتورة البيع الرسمية" : "View Invoice"}
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>{isRtl ? "الفاتورة" : "Invoice"}</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const itm = ord.items && ord.items[0];
                                      const saleRec: BookSaleRecord = {
                                        id: ord.id,
                                        bookId: itm?.bookId || "",
                                        bookTitle: itm?.bookTitle || "كتاب من المتجر",
                                        bookCode: itm?.bookCode || "BK-DAR-4491",
                                        authorId: "auth-2026-001",
                                        authorName: itm?.authorName || "د. السيد المنشاوي",
                                        authorCode: itm?.authorCode || "AUT-7890",
                                        format: (itm?.format as "digital" | "print") || "digital",
                                        salePrice: ord.subtotal || itm?.price || 0,
                                        authorRoyaltyPercentage: itm?.format === "digital" ? 70 : 30,
                                        authorEarnings: itm?.authorRoyalty || Math.round((ord.subtotal || 0) * (itm?.format === "digital" ? 0.7 : 0.3)),
                                        date: ord.createdAt,
                                        orderNumber: ord.orderNumber,
                                        invoiceNumber: `INV-${ord.orderNumber.replace(/[^0-9]/g, "") || Date.now().toString().slice(-5)}`,
                                        buyerName: ord.userName,
                                        buyerEmail: ord.userEmail,
                                        buyerCity: ord.shippingAddress?.city || "القاهرة، مصر",
                                        paymentMethod: ord.paymentMethod || "instapay",
                                        quantity: itm?.quantity || 1,
                                        status: ord.status
                                      };
                                      const svgContent = generateOfficialBookSaleInvoiceSvg(saleRec, ord);
                                      downloadFileOrDataUrl(`BookSaleInvoice-${ord.orderNumber}.svg`, svgContent);
                                      toast({
                                        title: isRtl ? "📥 تم تنزيل الفاتورة بنجاح" : "Invoice Downloaded",
                                        description: `${ord.orderNumber}`
                                      });
                                    }}
                                    className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                    title={isRtl ? "تحميل الفاتورة مباشرة بصيغة SVG" : "Download SVG Invoice"}
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* TAB 4: 📊 المؤشرات والأداء المالي لمتجر الكتب */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <TabsContent value="analytics" className="p-5 sm:p-6 space-y-6 m-0">
              <div>
                <h3 className="text-base sm:text-lg font-black text-foreground">
                  {isRtl ? "التقرير المالي والأداء التجاري لمتجر كتب دار عبيد" : "Financial Performance & Sales Analytics"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "موجز حركة المبيعات وتوزيع الإيرادات بين حصة المؤلفين والمنصة." : "Overview of revenue splits and sales performance."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="p-5 rounded-3xl bg-muted/30 border border-border/80 space-y-2 text-start">
                  <span className="text-xs font-bold text-muted-foreground">{isRtl ? "إجمالي مبيعات الكتب (Gross Revenue)" : "Gross Revenue"}</span>
                  <div className="text-2xl font-black text-foreground">{totalGrossRevenue.toLocaleString()} EGP</div>
                  <p className="text-[11px] text-muted-foreground">{isRtl ? "عبر جميع قنوات الدفع (إنستاباي، فيزا، فودافون كاش)" : "Across all payment gateways"}</p>
                </div>

                <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-start">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{isRtl ? "إجمالي مستحقات المؤلفين (Author Royalties)" : "Author Royalties"}</span>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalAuthorRoyaltiesCalculated.toLocaleString()} EGP</div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">{isRtl ? "مودعة في أرصدة المؤلفين المعتمدين وجاهزة للسحب" : "Credited to author accounts for payout"}</p>
                </div>

                <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-start">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{isRtl ? "صافي حصة المنصة والطباعة (Publisher Net)" : "Publisher Net"}</span>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{(totalGrossRevenue - totalAuthorRoyaltiesCalculated).toLocaleString()} EGP</div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">{isRtl ? "عوائد المنصة ومصروفات الإنتاج والطباعة والشحن" : "Platform fee & production share"}</p>
                </div>

              </div>

              {/* Best Selling Titles List */}
              <Card className="rounded-3xl border-2 border-border/80 p-5 space-y-4">
                <h4 className="font-black text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{isRtl ? "أبرز الكتب مبيعاً في متجر UNIGATES" : "Bestselling Titles"}</span>
                </h4>

                <div className="divide-y divide-border/60">
                  {catalog.slice(0, 5).map((b, idx) => (
                    <div key={b.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center font-black text-xs">
                          {idx + 1}
                        </div>
                        <div className="text-start">
                          <span className="font-bold text-foreground block">{b.title_ar}</span>
                          <span className="text-[11px] text-muted-foreground">{b.author_ar} • {b.code}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-bold text-[11px]">
                          {b.price_digital} / {b.price_print} EGP
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

            </TabsContent>

          </Tabs>
        </Card>

      </main>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: 🏷️ نافذة تسعير وإعداد الكتاب المحال وإطلاقه في المتجر */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog 
        open={!!selectedSubmissionForPricing} 
        onOpenChange={(open) => !open && setSelectedSubmissionForPricing(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 space-y-4" dir={dir}>
          {selectedSubmissionForPricing && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-500" />
                  <span>{isRtl ? "تسعير وتجهيز الكتاب وإطلاقه في متجر الكتب" : "Price & Publish to Book Store"}</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {isRtl 
                    ? "تحديد أسعار النسخ (الرقمية والورقية) وربط كود المؤلف وتحديد المخزون لإتاحة الكتاب فورياً للجمهور."
                    : "Configure commercial price, royalty binding, and inventory for live store release."}
                </DialogDescription>
              </DialogHeader>

              {/* Author & Submission Binding Callout */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5 text-start">
                  <span className="text-[11px] text-muted-foreground block">{isRtl ? "المؤلف المعتمد وكود الربط المالي:" : "Accredited Author:"}</span>
                  <span className="font-bold text-foreground">{pricingAuthorAr}</span>
                </div>
                <Badge className="bg-amber-500 text-white font-mono text-xs font-black px-2.5 py-1">
                  كود المؤلف: {pricingAuthorCode}
                </Badge>
              </div>

              <form onSubmit={handlePublishToStore} className="space-y-4 text-start">
                
                {/* Titles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{isRtl ? "عنوان الكتاب (بالعربية) *" : "Title (Arabic) *"}</Label>
                    <Input 
                      value={pricingTitleAr}
                      onChange={(e) => setPricingTitleAr(e.target.value)}
                      required
                      className="h-10 rounded-xl text-xs bg-muted/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{isRtl ? "عنوان الكتاب (بالإنجليزية / الترويجي)" : "Title (English)"}</Label>
                    <Input 
                      value={pricingTitleEn}
                      onChange={(e) => setPricingTitleEn(e.target.value)}
                      className="h-10 rounded-xl text-xs bg-muted/20"
                    />
                  </div>
                </div>

                {/* Category & ISBN & Code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{isRtl ? "تصنيف المتجر *" : "Category *"}</Label>
                    <Select value={pricingCategory} onValueChange={(val) => {
                      setPricingCategory(val);
                      if (val === "academic") {
                        setPricingCategoryAr("مراجع ودراسات أكاديمية");
                        setPricingCategoryEn("Academic References");
                      } else if (val === "technology") {
                        setPricingCategoryAr("الذكاء الاصطناعي والتقنية");
                        setPricingCategoryEn("AI & Technology");
                      } else if (val === "business") {
                        setPricingCategoryAr("إدارة الأعمال والقيادة");
                        setPricingCategoryEn("Business & Leadership");
                      } else {
                        setPricingCategoryAr("العلوم الإنسانية واللغات");
                        setPricingCategoryEn("Humanities");
                      }
                    }}>
                      <SelectTrigger className="h-10 rounded-xl text-xs bg-muted/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academic">مراجع ودراسات أكاديمية</SelectItem>
                        <SelectItem value="technology">الذكاء الاصطناعي والتقنية</SelectItem>
                        <SelectItem value="business">إدارة الأعمال والقيادة</SelectItem>
                        <SelectItem value="humanities">العلوم الإنسانية واللغات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{isRtl ? "كود الكتاب بالمتجر *" : "Book Code *"}</Label>
                    <Input 
                      value={pricingBookCode}
                      onChange={(e) => setPricingBookCode(e.target.value)}
                      required
                      className="h-10 rounded-xl font-mono text-xs bg-muted/20 font-bold text-amber-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{isRtl ? "رقم الإيداع الدولي (ISBN) *" : "ISBN *"}</Label>
                    <Input 
                      value={pricingIsbn}
                      onChange={(e) => setPricingIsbn(e.target.value)}
                      required
                      className="h-10 rounded-xl font-mono text-xs bg-muted/20"
                    />
                  </div>
                </div>

                {/* Pricing Block with Live Royalty Preview */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span>{isRtl ? "تسعير النسخ ونسب أرباح المؤلف المعتمدة:" : "Pricing & Royalty Split:"}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">{isRtl ? "70% للرقمي • 30% للورقي" : "70% Digital / 30% Print"}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Digital Price */}
                    <div className="p-3 rounded-xl bg-background border border-border/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold">{isRtl ? "سعر النسخة الرقمية (E-Book)" : "Digital Price"}</Label>
                        <span className="text-[10px] text-purple-600 font-bold">ربح المؤلف 70%</span>
                      </div>
                      <div className="relative">
                        <Input 
                          type="number"
                          value={pricingDigitalPrice}
                          onChange={(e) => setPricingDigitalPrice(e.target.value)}
                          className="h-9 rounded-lg text-xs"
                        />
                        <span className="absolute top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground" style={{ [isRtl ? "left" : "right"]: "0.5rem" }}>EGP</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {isRtl ? `حصة المؤلف لكل نسخة رقمية: ${Math.round(Number(pricingDigitalPrice) * 0.70)} ج.م` : `Author gets: ${Math.round(Number(pricingDigitalPrice) * 0.70)} EGP`}
                      </p>
                    </div>

                    {/* Print Price */}
                    <div className="p-3 rounded-xl bg-background border border-border/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold">{isRtl ? "سعر النسخة الورقية المطبوعة" : "Print Price"}</Label>
                        <span className="text-[10px] text-blue-600 font-bold">ربح المؤلف 30%</span>
                      </div>
                      <div className="relative">
                        <Input 
                          type="number"
                          value={pricingPrintPrice}
                          onChange={(e) => setPricingPrintPrice(e.target.value)}
                          className="h-9 rounded-lg text-xs"
                        />
                        <span className="absolute top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground" style={{ [isRtl ? "left" : "right"]: "0.5rem" }}>EGP</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {isRtl ? `حصة المؤلف لكل نسخة ورقية: ${Math.round(Number(pricingPrintPrice) * 0.30)} ج.م` : `Author gets: ${Math.round(Number(pricingPrintPrice) * 0.30)} EGP`}
                      </p>
                    </div>

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold">{isRtl ? "المخزون الأولي المتاح للطباعة الورقية" : "Print Stock"}</Label>
                      <Input 
                        type="number"
                        value={pricingStockPrint}
                        onChange={(e) => setPricingStockPrint(e.target.value)}
                        className="h-8 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold">{isRtl ? "عدد الصفحات الفعلي" : "Pages"}</Label>
                      <Input 
                        type="number"
                        value={pricingPages}
                        onChange={(e) => setPricingPages(e.target.value)}
                        className="h-8 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Marketing Synopsis */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">{isRtl ? "الوصف التسويقي المعروض للقرّاء في صفحة الكتاب بالمتجر *" : "Store Marketing Description *"}</Label>
                  <Textarea 
                    value={pricingDescriptionAr}
                    onChange={(e) => setPricingDescriptionAr(e.target.value)}
                    required
                    rows={3}
                    className="rounded-xl text-xs bg-muted/20 border-border"
                  />
                </div>

                <DialogFooter className="gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setSelectedSubmissionForPricing(null)}
                    className="rounded-xl text-xs font-bold"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={publishingToStore}
                    className="rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-md gap-2"
                  >
                    {publishingToStore ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{isRtl ? "نشر الكتاب رسمياً في متجر الكتب 🚀" : "Publish to Store Now 🚀"}</span>
                  </Button>
                </DialogFooter>

              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: ✏️ نافذة تعديل تسعير ومخزون كتاب معروض */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog 
        open={!!editingBookItem} 
        onOpenChange={(open) => !open && setEditingBookItem(null)}
      >
        <DialogContent className="max-w-md rounded-3xl p-6 space-y-4" dir={dir}>
          {editingBookItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-black flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-500" />
                  <span>{isRtl ? "تعديل التسعير والمخزون في المتجر" : "Edit Price & Stock"}</span>
                </DialogTitle>
                <DialogDescription className="text-xs truncate">
                  {editingBookItem.title_ar} ({editingBookItem.code})
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSaveBookPriceEdit} className="space-y-4 text-start">
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">{isRtl ? "سعر النسخة الرقمية (EGP)" : "Digital Price"}</Label>
                  <Input 
                    type="number"
                    value={editItemDigitalPrice}
                    onChange={(e) => setEditItemDigitalPrice(e.target.value)}
                    required
                    className="h-10 rounded-xl text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">{isRtl ? `حصة المؤلف 70% = ${Math.round(Number(editItemDigitalPrice) * 0.70)} ج.م` : ""}</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">{isRtl ? "سعر النسخة الورقية (EGP)" : "Print Price"}</Label>
                  <Input 
                    type="number"
                    value={editItemPrintPrice}
                    onChange={(e) => setEditItemPrintPrice(e.target.value)}
                    required
                    className="h-10 rounded-xl text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">{isRtl ? `حصة المؤلف 30% = ${Math.round(Number(editItemPrintPrice) * 0.30)} ج.م` : ""}</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">{isRtl ? "الكمية المتاحة في المخزن (للطباعة الورقية)" : "Print Stock"}</Label>
                  <Input 
                    type="number"
                    value={editItemStock}
                    onChange={(e) => setEditItemStock(e.target.value)}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                {/* Live Author Royalty Card */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-primary/5 to-emerald-500/10 border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="flex items-center gap-1.5 text-foreground">
                      <BadgePercent className="w-4 h-4 text-amber-500" />
                      <span>{isRtl ? "احتساب أرباح المؤلف المباشرة" : "Live Author Royalties"}</span>
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10">
                      {editingBookItem.author_code || "AUT-7890"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-background/80 border border-border/60">
                      <div className="text-[10px] text-muted-foreground">{isRtl ? "النسخة الرقمية (70%)" : "Digital (70%)"}</div>
                      <div className="text-sm font-black text-purple-600 dark:text-purple-400">
                        {Math.round(Number(editItemDigitalPrice || 0) * 0.70)} EGP
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-background/80 border border-border/60">
                      <div className="text-[10px] text-muted-foreground">{isRtl ? "النسخة الورقية (30%)" : "Print (30%)"}</div>
                      <div className="text-sm font-black text-blue-600 dark:text-blue-400">
                        {Math.round(Number(editItemPrintPrice || 0) * 0.30)} EGP
                      </div>
                    </div>
                  </div>
                  <p className="text-[10.5px] text-muted-foreground leading-relaxed">
                    {isRtl 
                      ? "⚡ سيتم تحديث الأسعار فوراً في صفحة متجر الكتب ولوحة تحكم المؤلف مع إرسال إشعار رسمي للمؤلف."
                      : "⚡ Price updates are instantly pushed to the bookstore and author dashboard."}
                  </p>
                </div>

                <DialogFooter className="gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingBookItem(null)} 
                    className="rounded-xl text-xs font-bold"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button 
                    type="submit" 
                    className="rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isRtl ? "حفظ التحديثات" : "Save Changes"}</span>
                  </Button>
                </DialogFooter>

              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: 🛒 نافذة تسجيل عملية بيع / طلب تجريبي واحتساب أرباح المؤلف */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showCreateOrderModal} onOpenChange={setShowCreateOrderModal}>
        <DialogContent className="max-w-lg rounded-3xl p-6 space-y-4" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-500" />
              <span>{isRtl ? "تسجيل عملية بيع تجريبية في المتجر" : "Record Test Store Order"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isRtl 
                ? "تتيح هذه النافذة محاكاة عملية شراء قارئ لأي كتاب بالمتجر، والتحقق فورياً من قيد أرباح المؤلف في حسابه المالي."
                : "Simulate a book purchase to verify author royalty crediting in real time."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOrder} className="space-y-4 text-start">
            
            {/* Book Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{isRtl ? "اختر الكتاب المشترى من المتجر *" : "Select Book *"}</Label>
              <Select value={orderSelectedBookId} onValueChange={setOrderSelectedBookId}>
                <SelectTrigger className="h-10 rounded-xl text-xs bg-muted/20 font-bold">
                  <SelectValue placeholder={isRtl ? "اختر كتاباً..." : "Choose a book..."} />
                </SelectTrigger>
                <SelectContent>
                  {catalog.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.title_ar} ({b.code}) • كود المؤلف: {b.author_code || "عام"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Format & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{isRtl ? "صيغة الشراء *" : "Format *"}</Label>
                <Select value={orderFormat} onValueChange={(v: "digital" | "print") => setOrderFormat(v)}>
                  <SelectTrigger className="h-10 rounded-xl text-xs bg-muted/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digital">{isRtl ? "رقمي E-Book (نسبة المؤلف 70%)" : "Digital (70%)"}</SelectItem>
                    <SelectItem value="print">{isRtl ? "ورقي مطبوع (نسبة المؤلف 30%)" : "Print (30%)"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{isRtl ? "الكمية المطلوبة *" : "Quantity *"}</Label>
                <Input 
                  type="number"
                  min="1"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  required
                  className="h-10 rounded-xl text-xs bg-muted/20"
                />
              </div>
            </div>

            {/* Buyer Info */}
            <div className="space-y-3 p-3.5 rounded-2xl bg-muted/30 border border-border/70 text-xs">
              <span className="font-bold text-foreground block">👤 {isRtl ? "بيانات المشتري:" : "Buyer Details:"}</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input 
                  value={orderBuyerName}
                  onChange={(e) => setOrderBuyerName(e.target.value)}
                  placeholder="اسم المشتري"
                  className="h-9 rounded-lg text-xs"
                />
                <Input 
                  value={orderBuyerEmail}
                  onChange={(e) => setOrderBuyerEmail(e.target.value)}
                  placeholder="البريد الإلكتروني"
                  className="h-9 rounded-lg text-xs"
                />
              </div>
              <Input 
                value={orderBuyerCity}
                onChange={(e) => setOrderBuyerCity(e.target.value)}
                placeholder="المدينة / العنوان"
                className="h-9 rounded-lg text-xs"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateOrderModal(false)}
                className="rounded-xl text-xs font-bold"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </Button>
              <Button 
                type="submit" 
                disabled={creatingOrder}
                className="rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {creatingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isRtl ? "تنفيذ الشراء وقيد أرباح المؤلف ➔" : "Execute Order & Credit Author ➔"}</span>
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: 📄 معاينة وطباعة وتنزيل فاتورة مبيعات الكتاب الرسمية */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <BookSaleInvoiceModal
        open={showInvoiceModal}
        onOpenChange={setShowInvoiceModal}
        sale={selectedSaleForInvoiceModal}
        order={selectedOrderForInvoice}
        isRtl={isRtl}
      />

    </div>
  );
};

export default BookStoreAdminStudio;
