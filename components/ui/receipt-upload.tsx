"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ReceiptUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  groupId: string;
}

export function ReceiptUpload({ value, onChange, groupId }: ReceiptUploadProps) {
  const t = useTranslations("expenseModal");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const compressImage = useCallback((file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) {
            height = (height / width) * MAX;
            width = MAX;
          } else {
            width = (width / height) * MAX;
            height = MAX;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
          "image/jpeg",
          0.8
        );
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 10 * 1024 * 1024) return; // 10MB raw limit

      setUploading(true);
      setProgress(10);

      try {
        const compressed = await compressImage(file);
        setProgress(40);

        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `${groupId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        // Dynamic import to avoid SSR issues
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        setProgress(60);

        const { error } = await supabase.storage
          .from("receipts")
          .upload(fileName, compressed, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (error) throw error;

        setProgress(90);

        const { data: urlData } = supabase.storage
          .from("receipts")
          .getPublicUrl(fileName);

        onChange(urlData.publicUrl);
        setProgress(100);
      } catch (err) {
        console.error("Receipt upload failed:", err);
        onChange(null);
      } finally {
        setTimeout(() => {
          setUploading(false);
          setProgress(0);
        }, 500);
      }
    },
    [groupId, compressImage, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      e.target.value = "";
    },
    [uploadFile]
  );

  const removeReceipt = useCallback(() => {
    onChange(null);
  }, [onChange]);

  return (
    <div className="mb-3">
      <label className="mb-1 block text-sm font-medium text-text-primary">
        {t("receipt")} <span className="text-xs font-normal text-text-tertiary">({t("optional")})</span>
      </label>

      <AnimatePresence mode="wait">
        {value ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative group rounded-xl border border-border overflow-hidden"
          >
            <img
              src={value}
              alt="Receipt"
              className="w-full h-32 object-cover"
            />
            <button
              type="button"
              onClick={removeReceipt}
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-negative/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent px-3 py-2">
              <span className="text-xs font-medium text-white/90">{t("receiptAttached")}</span>
            </div>
          </motion.div>
        ) : uploading ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-dashed border-border bg-surface-2/50 p-4"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-text-secondary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{t("uploading")}</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <motion.div
                    className="h-full rounded-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border-2 border-dashed p-4 transition-all",
                dragOver
                  ? "border-blue-500 bg-blue-500/5"
                  : "border-border bg-surface-2/30 hover:border-border-2 hover:bg-surface-2/50"
              )}
            >
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                dragOver ? "bg-blue-500/10" : "bg-surface-2"
              )}>
                {dragOver ? (
                  <Upload className="h-5 w-5 text-blue-500" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-text-tertiary" />
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-text-primary">
                  {t("addReceipt")}
                </p>
                <p className="text-xs text-text-tertiary">
                  {t("receiptHint")}
                </p>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
