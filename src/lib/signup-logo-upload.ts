import { supabase } from "@/integrations/supabase/client";

type SignupLogoKind = "college" | "institute";

type SignupLogoUploadResponse = {
  publicUrl?: string;
  error?: string;
};

export const uploadSignupLogo = async (kind: SignupLogoKind, file: File) => {
  const formData = new FormData();
  formData.append("kind", kind);
  formData.append("file", file);

  const { data, error } = await supabase.functions.invoke<SignupLogoUploadResponse>("signup-logo-upload", {
    body: formData,
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (!data?.publicUrl) throw new Error("Logo upload failed");

  return data.publicUrl;
};