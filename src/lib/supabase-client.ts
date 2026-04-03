import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "wifme-bucket";

export const supabaseClient = createClient(supabaseUrl, supabaseKey);

export const compressImage = (file: File, quality = 0.5): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) return resolve(file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        
        canvas.toBlob((blob) => {
          if (!blob) return resolve(file);
          resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
        }, "image/jpeg", quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};
