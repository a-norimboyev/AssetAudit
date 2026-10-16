"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Upload, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { uploadItemPhotoAction } from "@/lib/actions/upload";

interface ItemPhotoManagerProps {
  itemId: string;
  currentPhotoUrl: string | null;
  itemName: string;
}

export function ItemPhotoManager({ itemId, currentPhotoUrl, itemName }: ItemPhotoManagerProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage({ text: "Faqat JPG, PNG yoki WEBP rasmlar qabul qilinadi.", success: false });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: "Rasm hajmi 2 MB dan oshmasligi kerak.", success: false });
      return;
    }

    setMessage(null);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  }

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await uploadItemPhotoAction(itemId, formData);
      if (res.success && res.photoUrl) {
        setPhotoUrl(res.photoUrl);
        setPreviewUrl(null);
        setMessage({ text: res.message, success: true });
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setMessage({ text: res.message, success: false });
      }
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Yuklashda server xatosi yuz berdi.",
        success: false,
      });
    } finally {
      setIsUploading(false);
    }
  }

  const activeDisplay = previewUrl || photoUrl;

  return (
    <div className="bg-white p-5 sm:p-6 rounded-[4px] border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Inventar Rasmi va Pasport Surati
          </h3>
        </div>
        {photoUrl && (
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[2px] border border-emerald-200">
            Biriktirilgan
          </span>
        )}
      </div>

      {message && (
        <div
          className={`p-3 rounded-[3px] text-xs flex items-center gap-2 ${
            message.success
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {message.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Rasm ko'rinishi / Placeholder */}
      <div className="relative w-full aspect-16/9 rounded-[3px] overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center">
        {activeDisplay ? (
          <Image
            src={activeDisplay}
            alt={itemName}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="text-center p-4 text-slate-400">
            <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Surat biriktirilmagan</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Admin orqali fotosurat yuklash mumkin</p>
          </div>
        )}
      </div>

      {/* Yuklash interfeysi */}
      <div className="pt-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          id={`photo-input-${itemId}`}
        />

        <div className="flex items-center gap-2">
          <label
            htmlFor={`photo-input-${itemId}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer transition shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>{activeDisplay ? "Suratni almashtirish" : "Fayl tanlash (Max 2MB)"}</span>
          </label>

          {previewUrl && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition shadow-xs disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saqlanmoqda...</span>
                </>
              ) : (
                <span>Yuklashni tasdiqlash</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
