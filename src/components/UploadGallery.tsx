import { useState, useEffect } from "react";
import heic2any from "heic2any";

// Improved conversion that supports HEIC → WebP + Canvas scale down
async function convertImageToWebP(file: File): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(
        `Starting conversion for: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
      );

      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();

      let sourceBlob: Blob = file;

      // Step 1: If it's HEIC, unpack it to an image type that the browser Canvas can read
      if (
        fileType === "image/heic" ||
        fileType === "image/heif" ||
        fileName.endsWith(".heic") ||
        fileName.endsWith(".heif")
      ) {
        console.log("🔄 Converting HEIC container to base image blob...");
        const result = await heic2any({
          blob: file,
          toType: "image/jpeg", // Convert to jpeg first so Canvas can process it safely
        });
        sourceBlob = Array.isArray(result) ? result[0] : result;
      }

      // Step 2: Run aggressive resize + compression via HTML5 Canvas
      const img = new Image();
      const url = URL.createObjectURL(sourceBlob);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Downscale matching target dimension to ensure it drops under 10MB easily
        const maxDimension = 1280;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("No canvas context found"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (blob) {
              console.log(
                `✅ Compressed to WebP: ${(blob.size / (1024 * 1024)).toFixed(2)} MB`,
              );
              resolve(blob);
            } else {
              reject(new Error("Conversion failed"));
            }
          },
          "image/webp",
          0.6, // Slightly reduced quality to 0.60 for safety margining
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image element into browser memory."));
      };

      img.src = url;
    } catch (err) {
      console.error("Conversion error:", err);
      reject(err);
    }
  });
}

async function uploadToCloudinary(
  file: File | Blob,
  uploadPreset: string,
  cloudName: string,
  options: any = {},
): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  if (options.publicId) formData.append("public_id", options.publicId);
  formData.append("tags", "gallery-ea");

  if (options.context) {
    formData.append("context", options.context);
  }

  const resourceType = options.resourceType || "image";
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    {
      method: "POST",
      body: formData,
    },
  );
  if (!response.ok) throw new Error(`Upload failed: ${await response.text()}`);
  return response.json();
}

function generatePublicId(uploaderName: string, imageName: string): string {
  const ts = Date.now();
  return `gallery-ea/${uploaderName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${imageName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${ts}`;
}

type UploadedItem = {
  id: string;
  imageName: string;
  uploaderName: string;
  uploadDate: string;
  cloudinaryUrl: string;
  format: string;
  isCloudinary: boolean;
  fileType: "image" | "video";
  publicId?: string;
};

type UploadGalleryProps = {
  onUploadSuccess?: () => void;
};

const STORAGE_KEY = "fotokenanganXIEA";
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

export function UploadGallery({ onUploadSuccess }: UploadGalleryProps) {
  const [imageName, setImageName] = useState("");
  const [uploaderName, setUploaderName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedItems, setUploadedItems] = useState<UploadedItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [cloudinaryConfigured, setCloudinaryConfigured] = useState(false);

  useEffect(() => {
    setCloudinaryConfigured(
      !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET),
    );
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUploadedItems(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load uploaded items:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uploadedItems));
  }, [uploadedItems]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !imageName.trim() || !uploaderName.trim()) {
      alert("Please fill in all fields and select a file");
      return;
    }

    const isImage = selectedFile.type.startsWith("image/");
    const isVideo = selectedFile.type.startsWith("video/");
    const isHeic =
      selectedFile.type === "image/heic" ||
      selectedFile.type === "image/heif" ||
      selectedFile.name.toLowerCase().endsWith(".heic") ||
      selectedFile.name.toLowerCase().endsWith(".heif");

    if (!isImage && !isVideo && !isHeic) {
      alert("Please select an image or video file");
      return;
    }

    setUploading(true);

    try {
      let uploadUrl = "";
      let fileType: "image" | "video" = isImage || isHeic ? "image" : "video";
      let publicId = "";

      if (cloudinaryConfigured) {
        let fileToUpload: File | Blob = selectedFile;

        if (isImage || isHeic) {
          // Both native images and HEIC pass through the multi-stage compressor
          const webpBlob = await convertImageToWebP(selectedFile);
          fileToUpload = new File([webpBlob], imageName + ".webp", {
            type: "image/webp",
          });
        }

        // Hard Block for anything still exceeding Cloudinary Free Limit (Videos or extreme edge cases)
        const finalSizeMB = fileToUpload.size / (1024 * 1024);
        if (finalSizeMB > 10) {
          throw new Error(
            `File size is ${finalSizeMB.toFixed(1)}MB, which exceeds Cloudinary's free tier 10MB limit. Videos cannot be compressed automatically by the client side.`,
          );
        }

        publicId = generatePublicId(uploaderName, imageName);
        const contextData = `uploader=${uploaderName.trim()}|title=${imageName.trim()}`;

        const cloudinaryResponse = await uploadToCloudinary(
          fileToUpload,
          CLOUDINARY_UPLOAD_PRESET,
          CLOUDINARY_CLOUD_NAME,
          {
            publicId,
            resourceType: isVideo ? "video" : "image",
            context: contextData,
          },
        );

        uploadUrl = cloudinaryResponse.secure_url;
        publicId = cloudinaryResponse.public_id || publicId;
      } else {
        const localSizeMB = selectedFile.size / (1024 * 1024);
        if (localSizeMB > 5) {
          throw new Error("File too large for local storage. Max 5MB.");
        }

        const reader = new FileReader();
        await new Promise((resolve, reject) => {
          reader.onload = () => {
            uploadUrl = reader.result as string;
            resolve(null);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      const newItem: UploadedItem = {
        id: Date.now().toString(),
        imageName: imageName.trim(),
        uploaderName: uploaderName.trim(),
        uploadDate: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        cloudinaryUrl: uploadUrl,
        format:
          isImage || isHeic
            ? "webp"
            : selectedFile.name.split(".").pop() || "mp4",
        isCloudinary: cloudinaryConfigured,
        fileType,
        publicId: publicId || undefined,
      };

      setUploadedItems([newItem, ...uploadedItems]);

      setImageName("");
      setUploaderName("");
      setSelectedFile(null);
      if (e.target instanceof HTMLFormElement) {
        e.target.reset();
      }

      alert(
        `${fileType === "image" ? "Image" : "Video"} uploaded successfully! 🎉\n\nTagged as: gallery-ea`,
      );

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        `Failed to upload: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {!cloudinaryConfigured && (
        <div className="mb-4 p-3 bg-yellow-100 border-2 border-yellow-500 rounded text-xs">
          <p className="font-bold text-yellow-800">
            ⚠️ Cloudinary not configured
          </p>
          <p className="text-yellow-700 mt-1">
            Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in
            .env file
          </p>
        </div>
      )}

      {cloudinaryConfigured && (
        <div className="mb-4 p-3 bg-green-100 border-2 border-green-500 rounded text-xs">
          <p className="font-bold text-green-800">☁️ Cloudinary Active</p>
          <p className="text-green-700 mt-1">
            Auto-Tagging to <strong>gallery-ea</strong> active. Max limit: 10MB.
          </p>
        </div>
      )}

      <div className="mb-6 pb-6 border-b-4 border-[#FF00FF]">
        <h3 className="text-lg font-bold text-[#FF00FF] mb-4">
          UPLOAD MOMEN BARU
        </h3>
        <form onSubmit={handleUpload} className="space-y-3">
          <div>
            <label className="block text-sm font-bold text-[#2D1B4E] mb-1">
              Nama Foto/Video
            </label>
            <input
              type="text"
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
              placeholder="contoh, Doksli Maul"
              className="w-full px-3 py-2 border-2 border-[#FF00FF] text-sm focus:outline-none focus:border-[#C44BFF]"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#2D1B4E] mb-1">
              Nama Kamu
            </label>
            <input
              type="text"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              placeholder="contoh, Mero"
              className="w-full px-3 py-2 border-2 border-[#FF00FF] text-sm focus:outline-none focus:border-[#C44BFF]"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#2D1B4E] mb-1">
              Pilih Foto atau Video
            </label>
            <input
              type="file"
              accept="image/*,video/*,.heic,.heif"
              onChange={handleFileChange}
              className="w-full text-sm"
              disabled={uploading}
            />
            {selectedFile && (
              <p className="text-xs text-[#8A2BE2] mt-1">
                ✓ {selectedFile.name} (
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full nes-btn is-primary font-bold"
          >
            {uploading ? "UPLOADING..." : "UPLOAD FILE"}
          </button>
        </form>
      </div>
    </div>
  );
}
