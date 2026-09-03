import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { verifyWebhook, EventName, type PaddleEnv } from "../_shared/paddle.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

const INSTITUTION_PRODUCTS: Record<string, "college" | "school"> = {
  university_platform_plan: "college",
  school_platform_plan: "school",
};

function planFromPriceId(priceId: string): "monthly" | "annual" {
  return priceId.endsWith("_annual") ? "annual" : "monthly";
}

/** Activate the institution plan and extend its students' subscriptions. */
async function applyInstitutionBusinessLogic(params: {
  productId: string;
  priceId: string;
  institutionType: string | null;
  institutionId: string | null;
}) {
  const { productId, priceId, institutionType, institutionId } = params;
  if (!INSTITUTION_PRODUCTS[productId] || !institutionId || !institutionType) return;

  const plan = planFromPriceId(priceId);
  const supabase = getSupabase();

  const { error: planError } = await supabase.rpc("set_institution_subscription_plan", {
    _institution_type: institutionType,
    _institution_id: institutionId,
    _subscription_plan: plan,
  });
  if (planError) console.error("set_institution_subscription_plan failed:", planError);

  // Extend student subscriptions for every member of this institution's departments.
  const months = plan === "annual" ? 12 : 1;
  const { data: departments } = await supabase
    .from("departments")
    .select("id")
    .eq("institution_id", institutionId)
    .eq("institution_type", institutionType);

  const departmentIds = ((departments ?? []) as { id: string }[]).map((d) => d.id);
  if (departmentIds.length === 0) return;

  const { data: members } = await supabase
    .from("department_members")
    .select("id")
    .in("department_id", departmentIds);

  for (const member of members ?? []) {
    const { error } = await supabase.rpc("renew_student_subscription", {
      _department_member_id: (member as { id: string }).id,
      _months: months,
    });
    if (error) console.error("renew_student_subscription failed:", error);
  }
}

async function sendConfirmationEmail(userId: string, priceId: string) {
  const supabase = getSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("user_id", userId)
    .maybeSingle();

  const email = (profile as { email?: string } | null)?.email;
  if (!email) return;

  const name = (profile as { full_name?: string } | null)?.full_name ?? "";
  const plan = planFromPriceId(priceId) === "annual" ? "السنوية" : "الشهرية";

  const { error } = await supabase.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      to: email,
      subject: "تأكيد الاشتراك — UNIGATES",
      label: "subscription_confirmation",
      purpose: "transactional",
      html:
        `<div dir="rtl" style="font-family:Cairo,Arial,sans-serif">` +
        `<h2>تم تفعيل اشتراكك</h2>` +
        `<p>مرحبًا ${name}،</p>` +
        `<p>تم تأكيد الدفع وتفعيل خطتك ${plan} على منصة UNIGATES.</p>` +
        `</div>`,
      message_id: `sub-${userId}-${priceId}-${Date.now()}`,
    },
  });
  if (error) console.error("enqueue_email failed:", error);
}

async function upsertSubscription(data: any, env: PaddleEnv, statusOverride?: string) {
  const { id, customerId, items, status, currentBillingPeriod, customData, scheduledChange } = data;

  const userId = customData?.userId;
  if (!userId) {
    console.error("No userId in customData — cannot attribute subscription");
    return null;
  }

  const item = items?.[0];
  const priceId = item?.price?.importMeta?.externalId;
  const productId = item?.product?.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn("Skipping subscription: missing importMeta.externalId", {
      rawPriceId: item?.price?.id,
      rawProductId: item?.product?.id,
    });
    return null;
  }

  const record = {
    user_id: userId,
    paddle_subscription_id: id,
    paddle_customer_id: customerId,
    product_id: productId,
    price_id: priceId,
    status: statusOverride ?? status,
    quantity: item?.quantity ?? 1,
    institution_type: customData?.institutionType ?? null,
    institution_id: customData?.institutionId ?? null,
    current_period_start: currentBillingPeriod?.startsAt ?? null,
    current_period_end: currentBillingPeriod?.endsAt ?? null,
    cancel_at_period_end: scheduledChange?.action === "cancel",
    environment: env,
    updated_at: new Date().toISOString(),
  };

  const { error } = await getSupabase()
    .from("subscriptions")
    .upsert(record, { onConflict: "paddle_subscription_id" });
  if (error) console.error("subscriptions upsert failed:", error);

  return record;
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.eventType) {
    case EventName.SubscriptionCreated: {
      const record = await upsertSubscription(event.data, env);
      if (record) {
        // Purchase business logic: activate plan, extend students, notify.
        await applyInstitutionBusinessLogic({
          productId: record.product_id,
          priceId: record.price_id,
          institutionType: record.institution_type,
          institutionId: record.institution_id,
        });
        await sendConfirmationEmail(record.user_id, record.price_id);
      }
      break;
    }
    case EventName.SubscriptionUpdated: {
      // Covers upgrades/downgrades and dunning (past_due) — access always
      // runs to the end of the paid period, so we only refresh stored state.
      const record = await upsertSubscription(event.data, env);
      if (record && ["active", "trialing"].includes(record.status)) {
        await applyInstitutionBusinessLogic({
          productId: record.product_id,
          priceId: record.price_id,
          institutionType: record.institution_type,
          institutionId: record.institution_id,
        });
      }
      break;
    }
    case EventName.SubscriptionCanceled: {
      // Keep current_period_end untouched: access continues until it passes.
      const { error } = await getSupabase()
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("paddle_subscription_id", (event.data as { id: string }).id)
        .eq("environment", env);
      if (error) console.error("cancel update failed:", error);
      break;
    }
    default:
      console.log("Unhandled event:", event.eventType);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const url = new URL(req.url);
  const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
  try {
    await handleWebhook(req, env);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
