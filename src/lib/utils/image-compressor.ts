export interface ImageCompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export async function compressImage(
  file: File,
  options: ImageCompressOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 512,
    maxHeight = 512,
    quality = 0.85,
    mimeType = "image/webp",
  } = options;

  return new Promise<Blob>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Faylni oqishda xatolik yuz berdi"));

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Rasmni yuklashda xatolik yuz berdi"));

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context yaratilmadi"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Rasmni siqish amalga oshmadi"));
            }
          },
          mimeType,
          quality
        );
      };

      if (typeof reader.result === "string") {
        img.src = reader.result;
      }
    };

    reader.readAsDataURL(file);
  });
}

export async function uploadCompressedImage(
  file: File,
  folder: "logos" | "avatars" = "logos"
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const compressedBlob = await compressImage(file, {
      maxWidth: 512,
      maxHeight: 512,
      quality: 0.85,
      mimeType: "image/webp",
    });

    const formData = new FormData();
    const safeName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `${safeName || "image"}.webp`;

    formData.append("file", compressedBlob, fileName);
    formData.append("folder", folder);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      return {
        success: false,
        error: errData?.error || "Serverga yuklashda xatolik yuz berdi",
      };
    }

    const data = await response.json();
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Rasm yuklashda xatolik";
    return { success: false, error: message };
  }
}
