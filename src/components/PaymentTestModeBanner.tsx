import { getPaddleEnvironment } from "@/lib/paddle";
import { useLanguage } from "@/contexts/LanguageContext";

export function PaymentTestModeBanner() {
  const { dir } = useLanguage();
  if (getPaddleEnvironment() !== "sandbox") return null;

  const isRtl = dir === "rtl";

  return (
    <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-sm text-orange-800" dir={dir}>
      {isRtl
        ? "جميع عمليات الدفع داخل المعاينة في وضع الاختبار."
        : "All payments made in the preview are in test mode."}{" "}
      <a
        href="https://docs.lovable.dev/features/payments#test-and-live-environments"
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-medium"
      >
        {isRtl ? "اقرأ المزيد" : "Read more"}
      </a>
    </div>
  );
}

export default PaymentTestModeBanner;
