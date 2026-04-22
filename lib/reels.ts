import { supabase } from "@/lib/supabase";
import type { Reel } from "@/lib/types";

export async function getActiveReels(): Promise<Reel[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("reels")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: false });

  if (error) {
    console.error("Failed to fetch active reels:", error);
    return [];
  }

  return (data ?? []) as Reel[];
}

export async function getAllReels(): Promise<Reel[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("reels")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: false });

  if (error) {
    console.error("Failed to fetch all reels:", error);
    return [];
  }

  return (data ?? []) as Reel[];
}

export async function uploadReelVideo(
  file: File
): Promise<{ filePath: string; publicUrl: string }> {
  if (!supabase) {
    throw new Error("Supabase client topilmadi");
  }

  const fileExt = file.name.split(".").pop() || "mp4";
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${fileExt}`;
  const filePath = `videos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("reels")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Failed to upload reel video:", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from("reels").getPublicUrl(filePath);

  return {
    filePath,
    publicUrl: data.publicUrl,
  };
}

export async function createReel(payload: {
  title?: string;
  video_url: string;
  is_active?: boolean;
  sort_order?: number;
}) {
  if (!supabase) {
    throw new Error("Supabase client topilmadi");
  }

  const { data, error } = await supabase
    .from("reels")
    .insert({
      title: payload.title ?? null,
      video_url: payload.video_url,
      is_active: payload.is_active ?? true,
      sort_order: payload.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create reel:", error);
    throw error;
  }

  return data;
}

export async function updateReel(
  id: number,
  payload: Partial<{
    title: string | null;
    video_url: string;
    is_active: boolean;
    sort_order: number;
  }>
) {
  if (!supabase) {
    throw new Error("Supabase client topilmadi");
  }

  const { data, error } = await supabase
    .from("reels")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update reel:", error);
    throw error;
  }

  return data;
}

export async function deleteReel(id: number) {
  if (!supabase) {
    throw new Error("Supabase client topilmadi");
  }

  const { error } = await supabase.from("reels").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete reel:", error);
    throw error;
  }

  return true;
}