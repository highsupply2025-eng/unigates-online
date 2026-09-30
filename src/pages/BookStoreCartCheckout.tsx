import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  BookOpen, 
  Package, 
  Sparkles,
  MapPin,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartBack } from "@/hooks/use-smart-back";
import { BookStoreDataStore } from "@/services/bookStoreDataStore";
import { CartItem, ShippingAddress, BookOrder } from "@/types/bookStore";
import SiteFooter from "@/components/SiteFooter";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";

export const BookStoreCartCheckout: React.FC = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const navigate = useNavigate();
  const goBack = useSmartBack("/book-store");

  const currentSession = BookStoreDataStore.getCurrentSession();
  const [cart, setCart] = useState<CartItem[]>(BookStoreDataStore.getCart());
  const [deliveryMethod, setDeliveryMethod] = useState<"standard" | "express" | "vip_doorstep">("express");
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "instapay" | "fawry" | "vodafone_cash" | "cod">("credit_card");

  // Shipping form fields
  const [fullName, setFullName] = useState("أحمد مصطفى كامل");
  const [phone, setPhone] = useState("+20 100 123 4567");
  const [country, setCountry] = useState("جمهورية مصر العربية");
  const [city, setCity] = useState("القاهرة");
  const [streetAddress, setStreetAddress] = useState("شارع التحرير - الدقي");
  const [isProcessing, setIsProcessing] = useState(false);

  const hasPhysicalBooks = cart.some((item) => item.format === "print");

  const subtotal = cart.reduce((sum, item) => {
    const price = item.format === "digital" ? item.book.price_digital : item.book.price_print;
    return sum + price * item.quantity;
  }, 0);

  const shippingFee = !hasPhysicalBooks
    ? 0
    : deliveryMethod === "express"
    ? 45
    : deliveryMethod === "vip_doorstep"
    ? 75
    : 30;

  const total = subtotal + shippingFee;

  const handleUpdateQuantity = (bookId: string, format: "digital" | "print", delta: number) => {
    const item = cart.find((i) => i.book.id === bookId && i.format === format);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      BookStoreDataStore.removeFromCart(bookId, format);
    } else {
      item.quantity = newQty;
      BookStoreDataStore.addToCart(item.book, format, delta);
    }
    setCart(BookStoreDataStore.getCart());
  };

  const handleRemove = (bookId: string, format: "digital" | "print") => {
    BookStoreDataStore.removeFromCart(bookId, format);
    setCart(BookStoreDataStore.getCart());
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    const orderNumber = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: BookOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      userId: "reader-demo",
      userEmail: "reader@unigates.online",
      userName: fullName || "قارئ متميز",
      items: cart.map((item) => ({
        bookId: item.book.id,
        bookTitle: item.book.title_ar,
        bookCover: item.book.cover_url,
        format: item.format,
        price: item.format === "digital" ? item.book.price_digital : item.book.price_print,
        quantity: item.quantity,
        publisherId: item.book.publisher_id,
        publisherName: item.book.publisher_ar,
      })),
      subtotal,
      shippingFee,
      platformFee: Math.round(subtotal * 0.20), // 20% platform share
      totalAmount: total,
      currency: "EGP",
      status: "completed",
      paymentMethod,
      shippingAddress: hasPhysicalBooks
        ? {
            fullName,
            phone,
            country,
            city,
            streetAddress,
            deliveryMethod,
          }
        : undefined,
      createdAt: new Date().toLocaleString(),
    };

    // 1. Save to orders
    BookStoreDataStore.createOrder(newOrder);

    // 2. Add digital books to Reader Library
    cart.forEach((item) => {
      if (item.format === "digital") {
        BookStoreDataStore.addPurchasedBook(item.book, "digital", orderNumber, item.book.price_digital);
      }
      // Record publisher sales with 80% / 20% split
      const gross = (item.format === "digital" ? item.book.price_digital : item.book.price_print) * item.quantity;
      BookStoreDataStore.addPublisherSale({
        id: `sale-${Date.now()}-${item.book.id}`,
        orderNumber,
        orderDate: new Date().toLocaleString(),
        bookId: item.book.id,
        bookTitle: item.book.title_ar,
        buyerName: fullName || "قارئ متميز",
        format: item.format,
        quantity: item.quantity,
        grossAmount: gross,
        platformShare: Math.round(gross * 0.20), // 20%
        publisherShare: Math.round(gross * 0.80), // 80%
        status: "completed",
      });
    });

    // 3. Clear cart
    BookStoreDataStore.clearCart();
    setCart([]);
    setIsProcessing(false);

    toast({
      title: isRtl ? "تمت عملية الشراء بنجاح! 🎉" : "Order Placed Successfully! 🎉",
      description: hasPhysicalBooks
        ? isRtl
          ? "تم حجز الكتب الورقية وتجهيز الشحن، والكتب الرقمية أصبحت متاحة في مكتبتك فوراً."
          : "Your physical order is dispatched and digital copies are in your library."
        : isRtl
        ? "أصبحت الكتب متاحة في مكتبتك الرقمية ويمكنك قراءتها الآن بأمان."
        : "Your e-books are ready to read in your DRM library.",
    });

    navigate("/book-store/reader-dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      {/* Top Header */}
      <header className="border-b border-border/40 px-4 sm:px-8 py-3.5 bg-card/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              className="font-bold gap-1.5 h-9 px-2.5 sm:px-3 border-border/80 text-foreground hover:bg-muted rounded-xl"
              title={isRtl ? "رجوع لمتجر الكتب" : "Back to Store"}
            >
              {isRtl ? <ArrowRight className="w-4 h-4 text-amber-500" /> : <ArrowLeft className="w-4 h-4 text-amber-500" />}
              <span>{isRtl ? "رجوع" : "Back"}</span>
            </Button>

            <Link to="/book-store" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 shadow-md flex items-center justify-center text-white">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-black text-foreground">UNIGATES</span>
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {isRtl ? "سلة الشراء وإتمام الدفع" : "Cart & Checkout"}
                </p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelectorDropdown className="h-9 px-3" />
            <ThemeToggle className="h-9 w-9 p-0 rounded-xl" />
          </div>
        </div>
      </header>

      {/* Main Cart & Checkout Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8">
        {!currentSession ? (
          <Card className="text-center p-10 sm:p-14 max-w-lg mx-auto border-amber-500/30 shadow-lg bg-card/90">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2">
              {isRtl ? "سلة الشراء تتطلب تسجيل الدخول" : "Login Required"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {isRtl
                ? "لإتمام عمليات الشراء، حفظ الكتب المشفرة في مكتبتك الرقمية (DRM)، وتتبع الشحن، يرجى تسجيل الدخول بحساب القارئ أو إنشاء حساب جديد."
                : "To place orders, access DRM-encrypted e-books, and track shipping, please sign in or create an account."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/book-store/login" className="w-full sm:w-auto">
                <Button className="w-full font-bold bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-md">
                  <span>{isRtl ? "تسجيل الدخول" : "Sign In"}</span>
                </Button>
              </Link>
              <Link to="/book-store/signup" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full font-bold border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10">
                  <span>{isRtl ? "إنشاء حساب جديد" : "Create Account"}</span>
                </Button>
              </Link>
            </div>
            <div className="mt-6 pt-4 border-t border-border/40">
              <Button variant="ghost" size="sm" onClick={goBack} className="text-xs font-bold text-muted-foreground gap-1">
                {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                <span>{isRtl ? "العودة لمتجر الكتب" : "Back to Store"}</span>
              </Button>
            </div>
          </Card>
        ) : cart.length === 0 ? (
          <Card className="text-center p-16 border-dashed">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-black text-foreground mb-2">
              {isRtl ? "سلة الشراء فارغة حالياً" : "Your Cart is Empty"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              {isRtl
                ? "تصفح متجر الكتب وأضف الكتب الرقمية أو الورقية للشراء."
                : "Browse our book store and add digital or print books."}
            </p>
            <Link to="/book-store/browse">
              <Button className="font-bold bg-amber-600 hover:bg-amber-700 text-white gap-2">
                <BookOpen className="w-4 h-4" />
                <span>{isRtl ? "تصفح متجر الكتب" : "Browse Books"}</span>
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Cart Items + Shipping */}
            <div className="lg:col-span-7 space-y-6">
              {/* Cart Items List */}
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-black text-foreground flex items-center justify-between">
                  <span>{isRtl ? "عناصر السلة" : "Cart Items"}</span>
                  <Badge variant="secondary">{cart.length} {isRtl ? "كتاب" : "items"}</Badge>
                </h3>

                <div className="space-y-4 divide-y divide-border/40">
                  {cart.map((item) => (
                    <div key={`${item.book.id}-${item.format}`} className="pt-4 first:pt-0 flex gap-4 items-start">
                      <img
                        src={item.book.cover_url}
                        alt={item.book.title_ar}
                        className="w-16 h-24 object-cover rounded-xl shadow-xs shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-black text-foreground line-clamp-2">
                            {isRtl ? item.book.title_ar : item.book.title_en}
                          </h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(item.book.id, item.format)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-500 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isRtl ? item.book.author_ar : item.book.author_en}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            className={
                              item.format === "digital"
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px]"
                                : "bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[10px]"
                            }
                          >
                            {item.format === "digital" ? (isRtl ? "نسخة رقمية DRM" : "Digital DRM") : (isRtl ? "نسخة ورقية مطبوعة" : "Physical Print")}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2 border border-border/60 rounded-lg p-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUpdateQuantity(item.book.id, item.format, -1)}
                              className="h-6 w-6 rounded"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-xs font-bold px-2">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUpdateQuantity(item.book.id, item.format, 1)}
                              className="h-6 w-6 rounded"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                            {(item.format === "digital" ? item.book.price_digital : item.book.price_print) * item.quantity} EGP
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Shipping Address (if physical print selected) */}
              {hasPhysicalBooks && (
                <Card className="p-6 space-y-4 border-blue-500/30">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-500" />
                    <h3 className="text-base font-black text-foreground">
                      {isRtl ? "بيانات الشحن والتوصيل المنزلي" : "Shipping & Delivery Address"}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <Label className="font-bold">{isRtl ? "الاسم بالكامل *" : "Full Name *"}</Label>
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-9 text-xs rounded-lg" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold">{isRtl ? "رقم الهاتف للتوصيل *" : "Phone Number *"}</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 text-xs rounded-lg" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold">{isRtl ? "المدينة / المحافظة *" : "City / State *"}</Label>
                      <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-9 text-xs rounded-lg" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold">{isRtl ? "العنوان التفصيلي *" : "Detailed Street Address *"}</Label>
                      <Input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} className="h-9 text-xs rounded-lg" />
                    </div>
                  </div>

                  {/* Delivery Speed Options */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <Label className="font-bold text-xs">{isRtl ? "خيارات سرعة الشحن:" : "Delivery Speed:"}</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod("standard")}
                        className={`p-3 rounded-xl border text-start text-xs transition-all ${
                          deliveryMethod === "standard"
                            ? "border-amber-500 bg-amber-500/10 font-bold"
                            : "border-border/60 hover:border-border"
                        }`}
                      >
                        <p className="font-bold">{isRtl ? "شحن عادي" : "Standard"}</p>
                        <p className="text-[10px] text-muted-foreground">{isRtl ? "خلال 3-4 أيام • 30 EGP" : "3-4 days • 30 EGP"}</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryMethod("express")}
                        className={`p-3 rounded-xl border text-start text-xs transition-all ${
                          deliveryMethod === "express"
                            ? "border-amber-500 bg-amber-500/10 font-bold"
                            : "border-border/60 hover:border-border"
                        }`}
                      >
                        <p className="font-bold text-amber-600">{isRtl ? "شحن سريع إكسبريس" : "Express Delivery"}</p>
                        <p className="text-[10px] text-muted-foreground">{isRtl ? "خلال 24-48 ساعة • 45 EGP" : "24-48 hrs • 45 EGP"}</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryMethod("vip_doorstep")}
                        className={`p-3 rounded-xl border text-start text-xs transition-all ${
                          deliveryMethod === "vip_doorstep"
                            ? "border-amber-500 bg-amber-500/10 font-bold"
                            : "border-border/60 hover:border-border"
                        }`}
                      >
                        <p className="font-bold">{isRtl ? "توصيل VIP فوري" : "VIP Same Day"}</p>
                        <p className="text-[10px] text-muted-foreground">{isRtl ? "نفس اليوم • 75 EGP" : "Same day • 75 EGP"}</p>
                      </button>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Right: Payment & Summary */}
            <div className="lg:col-span-5 space-y-6">
              {/* Payment Methods */}
              <Card className="p-6 space-y-4">
                <h3 className="text-base font-black text-foreground">
                  {isRtl ? "طريقة الدفع الآمن" : "Payment Method"}
                </h3>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("credit_card")}
                    className={`w-full p-3 rounded-xl border text-start text-xs flex items-center justify-between ${
                      paymentMethod === "credit_card"
                        ? "border-amber-500 bg-amber-500/10 font-bold"
                        : "border-border/60"
                    }`}
                  >
                    <span>{isRtl ? "بطاقة بنكية / فيزا / ماستركارد" : "Credit/Debit Card (Visa/Mastercard)"}</span>
                    <CreditCard className="w-4 h-4 text-amber-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("instapay")}
                    className={`w-full p-3 rounded-xl border text-start text-xs flex items-center justify-between ${
                      paymentMethod === "instapay"
                        ? "border-amber-500 bg-amber-500/10 font-bold"
                        : "border-border/60"
                    }`}
                  >
                    <span>{isRtl ? "انستا باي (InstaPay)" : "InstaPay Direct"}</span>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("vodafone_cash")}
                    className={`w-full p-3 rounded-xl border text-start text-xs flex items-center justify-between ${
                      paymentMethod === "vodafone_cash"
                        ? "border-amber-500 bg-amber-500/10 font-bold"
                        : "border-border/60"
                    }`}
                  >
                    <span>{isRtl ? "فودافون كاش / محافظ إلكترونية" : "Vodafone Cash & Wallets"}</span>
                    <Lock className="w-4 h-4 text-amber-500" />
                  </button>

                  {hasPhysicalBooks && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={`w-full p-3 rounded-xl border text-start text-xs flex items-center justify-between ${
                        paymentMethod === "cod"
                          ? "border-amber-500 bg-amber-500/10 font-bold"
                          : "border-border/60"
                      }`}
                    >
                      <span>{isRtl ? "الدفع عند الاستلام (COD)" : "Cash On Delivery (COD)"}</span>
                      <Truck className="w-4 h-4 text-blue-500" />
                    </button>
                  )}
                </div>
              </Card>

              {/* Order Summary & Pay Button */}
              <Card className="p-6 space-y-4 bg-card/80 border-amber-500/30">
                <h3 className="text-base font-black text-foreground">
                  {isRtl ? "ملخص الطلب والفاتورة" : "Order Summary"}
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{isRtl ? "المجموع الفرعي للكتب:" : "Subtotal:"}</span>
                    <span className="font-bold text-foreground">{subtotal} EGP</span>
                  </div>
                  {hasPhysicalBooks && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>{isRtl ? "رسوم الشحن والتوصيل:" : "Shipping Fee:"}</span>
                      <span className="font-bold text-foreground">{shippingFee} EGP</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{isRtl ? "حماية المحتوى DRM:" : "DRM Encryption Protection:"}</span>
                    <span className="font-bold text-emerald-600">{isRtl ? "مجاناً 100%" : "Free"}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between text-sm font-black">
                    <span>{isRtl ? "الإجمالي النهائي:" : "Total Amount:"}</span>
                    <span className="text-xl text-amber-600 dark:text-amber-400">{total} EGP</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full h-12 text-sm font-black bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-600 hover:to-red-700 text-white shadow-xl shadow-amber-500/25 rounded-xl gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isRtl ? `إتمام الدفع (${total} EGP)` : `Complete Payment (${total} EGP)`}</span>
                </Button>

                <p className="text-[10px] text-muted-foreground text-center">
                  {isRtl
                    ? "🔒 دفع آمن ومشفر 256-bit • الكتب الرقمية تتاح فوراً في مكتبتك."
                    : "🔒 256-bit secure checkout • Digital books unlock instantly."}
                </p>
              </Card>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
};
export default BookStoreCartCheckout;
