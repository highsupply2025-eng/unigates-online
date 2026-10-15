import { describe, it, expect, beforeEach, vi } from "vitest";
import { PADDLE_ACTIVE_PRODUCTS, getPaddleEnvironment } from "@/lib/paddle";
import { PaddleProductGateway } from "@/services/paddleProductGateway";
import { PaddleProvisioningService } from "@/services/paddleProvisioningService";
import { NashrDataStore } from "@/services/nashrDataStore";
import { BookStoreDataStore } from "@/services/bookStoreDataStore";

describe("Live Production Paddle Products Gateway", () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = {};
    const mockStorageImpl = {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, val: string) => { mockStorage[key] = String(val); },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { mockStorage = {}; },
      key: (_index: number) => null,
      length: 0,
    };
    globalThis.localStorage = mockStorageImpl as any;
    globalThis.sessionStorage = mockStorageImpl as any;
  });

  it("should have all 4 official products configured with correct names and IDs", () => {
    expect(PADDLE_ACTIVE_PRODUCTS.EBOOKS.name).toBe("Unigates E-Books");
    expect(PADDLE_ACTIVE_PRODUCTS.EBOOKS.id).toBe("unigates_ebooks");

    expect(PADDLE_ACTIVE_PRODUCTS.PHYSICAL_BOOKS.name).toBe("Unigates Physical Books");
    expect(PADDLE_ACTIVE_PRODUCTS.PHYSICAL_BOOKS.id).toBe("unigates_physical_books");

    expect(PADDLE_ACTIVE_PRODUCTS.PUBLISHING_SERVICES.name).toBe("Unigates Publishing Services");
    expect(PADDLE_ACTIVE_PRODUCTS.PUBLISHING_SERVICES.id).toBe("unigates_publishing_services");

    expect(PADDLE_ACTIVE_PRODUCTS.COURSES_PLATFORM.name).toBe("Unigates Courses Platform");
    expect(PADDLE_ACTIVE_PRODUCTS.COURSES_PLATFORM.id).toBe("unigates_courses_platform");
  });

  it("should detect live production environment from token", () => {
    const env = getPaddleEnvironment();
    expect(env).toBe("live");
  });

  it("should correctly handle fulfillment for Unigates Publishing Services invoice", async () => {
    // Create an unpaid invoice
    const inv = NashrDataStore.createInvoice({
      authorId: "auth-live-test",
      manuscriptId: "ms-live-test",
      manuscriptTitle: "كتاب الأبحاث المتقدمة",
      amount: 150,
      currency: "USD",
      status: "unpaid",
      description: "خدمات تحكيم ونشر أكاديمي"
    });

    expect(inv.status).toBe("unpaid");

    // Simulate Paddle checkout.completed webhook / event payload
    await PaddleProvisioningService.onCheckoutComplete({
      id: "txn_live_pub_12345",
      custom_data: {
        productContext: PADDLE_ACTIVE_PRODUCTS.PUBLISHING_SERVICES.name,
        productId: PADDLE_ACTIVE_PRODUCTS.PUBLISHING_SERVICES.id,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        userId: "auth-live-test",
      }
    });

    const updated = NashrDataStore.getAllInvoices().find(i => i.id === inv.id);
    expect(updated?.status).toBe("paid");
  });

  it("should correctly handle fulfillment for Bookstore orders", async () => {
    const orderNumber = "ORD-TEST-9999";
    BookStoreDataStore.createOrder({
      id: "ord-test-999",
      orderNumber,
      userId: "reader-test",
      userEmail: "reader@test.com",
      userName: "قارئ تجريبي",
      items: [],
      subtotal: 50,
      shippingFee: 0,
      platformFee: 10,
      totalAmount: 50,
      currency: "USD",
      status: "pending",
      paymentMethod: "credit_card",
      createdAt: new Date().toISOString()
    });

    await PaddleProvisioningService.onCheckoutComplete({
      id: "txn_live_book_12345",
      custom_data: {
        productContext: PADDLE_ACTIVE_PRODUCTS.EBOOKS.name,
        productId: PADDLE_ACTIVE_PRODUCTS.EBOOKS.id,
        orderNumber,
        userId: "reader-test",
      }
    });

    const order = BookStoreDataStore.getOrders().find(o => o.orderNumber === orderNumber);
    expect(order?.status).toBe("completed");
  });
});
