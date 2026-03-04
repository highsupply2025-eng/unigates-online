import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const adminEmail = "admin";
  const adminPassword = "admin1993";

  // Check if admin already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const adminUser = existingUsers?.users?.find(u => u.email === adminEmail);

  if (adminUser) {
    // Ensure role exists
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", adminUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!existingRole) {
      await supabase.from("user_roles").insert({
        user_id: adminUser.id,
        role: "admin",
        approved: true,
      });
    }

    return new Response(JSON.stringify({ message: "Admin already exists", user_id: adminUser.id }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create admin user
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  });

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), { status: 400 });
  }

  // Create profile
  await supabase.from("profiles").insert({
    user_id: newUser.user.id,
    email: adminEmail,
    full_name: "Admin",
    phone: "0000000000",
    role: "admin",
  });

  // Create admin role
  await supabase.from("user_roles").insert({
    user_id: newUser.user.id,
    role: "admin",
    approved: true,
  });

  return new Response(JSON.stringify({ message: "Admin created successfully", user_id: newUser.user.id }), {
    headers: { "Content-Type": "application/json" },
  });
});
