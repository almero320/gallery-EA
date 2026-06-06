import "dotenv/config";
import express from "express";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import { networkInterfaces } from "os";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "doh7wc75d",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ─── GET ALL MEDIA (Images + Videos) ─────────────────────────────
app.get("/api/media", async (req, res) => {
  try {
    const [imageResult, videoResult] = await Promise.all([
      cloudinary.api.resources({
        type: "upload",
        resource_type: "image",
        max_results: 100,
        tags: true,
        context: true,
      }),
      cloudinary.api.resources({
        type: "upload",
        resource_type: "video",
        max_results: 100,
        tags: true,
        context: true,
      }),
    ]);

    const images = imageResult.resources.map((res: any) => ({
      id: `img-${res.public_id}-${res.version}`,
      publicId: res.public_id,
      type: "image" as const,
      title:
        res.context?.custom?.title ||
        res.public_id.split("/").pop() ||
        "Untitled",
      date: res.created_at
        ? new Date(res.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "",
      uploader: res.context?.custom?.uploader || "Cloudinary Upload",
      imageData: res.secure_url,
      fileType: "image" as const,
      source: "cloudinary" as const,
      tags: res.tags || [],
    }));

    const videos = videoResult.resources.map((res: any) => ({
      id: `vid-${res.public_id}-${res.version}`,
      publicId: res.public_id,
      type: "video" as const,
      title:
        res.context?.custom?.title ||
        res.public_id.split("/").pop() ||
        "Untitled",
      date: res.created_at
        ? new Date(res.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "",
      uploader: res.context?.custom?.uploader || "Cloudinary Upload",
      imageData: res.secure_url,
      fileType: "video" as const,
      source: "cloudinary" as const,
      tags: res.tags || [],
    }));

    const all = [...images, ...videos].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    res.json({
      success: true,
      count: all.length,
      images: images.length,
      videos: videos.length,
      data: all,
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ─── GET MEDIA BY TAG ────────────────────────────────────────────
app.get("/api/media/tag/:tag", async (req, res) => {
  try {
    const { tag } = req.params;

    const result = await cloudinary.api.resources_by_tag(tag, {
      resource_type: "image",
      max_results: 100,
      tags: true,
      context: true,
    });

    const videoResult = await cloudinary.api.resources_by_tag(tag, {
      resource_type: "video",
      max_results: 100,
      tags: true,
      context: true,
    });

    const items = [...result.resources, ...videoResult.resources].map(
      (res: any) => ({
        id: `${res.resource_type}-${res.public_id}-${res.version}`,
        publicId: res.public_id,
        type: res.resource_type === "video" ? "video" : ("image" as const),
        title:
          res.context?.custom?.title ||
          res.public_id.split("/").pop() ||
          "Untitled",
        date: res.created_at
          ? new Date(res.created_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "",
        uploader: res.context?.custom?.uploader || "Cloudinary Upload",
        imageData: res.secure_url,
        fileType: res.resource_type === "video" ? "video" : ("image" as const),
        source: "cloudinary" as const,
        tags: res.tags || [],
      }),
    );

    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error("Error fetching by tag:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ─── SEARCH MEDIA ──────────────────────────────────────────────
app.get("/api/media/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q)
      return res
        .status(400)
        .json({ success: false, error: "Query parameter 'q' is required" });

    const result = await cloudinary.search
      .expression(q as string)
      .sort_by("created_at", "desc")
      .max_results(100)
      .execute();

    const items = result.resources.map((res: any) => ({
      id: `${res.resource_type}-${res.public_id}-${res.version}`,
      publicId: res.public_id,
      type: res.resource_type === "video" ? "video" : ("image" as const),
      title:
        res.context?.custom?.title ||
        res.public_id.split("/").pop() ||
        "Untitled",
      date: res.created_at
        ? new Date(res.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "",
      uploader: res.context?.custom?.uploader || "Cloudinary Upload",
      imageData: res.secure_url,
      fileType: res.resource_type === "video" ? "video" : ("image" as const),
      source: "cloudinary" as const,
      tags: res.tags || [],
    }));

    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error("Error searching media:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ─── DELETE MEDIA FROM CLOUDINARY ──────────────────────────────────
// Express wildcard pattern ":publicId(*)" handles nested folder paths with slashes gracefully
app.delete("/api/media/:publicId(*)", async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);
    console.log(`🗑️ Request received to delete: ${publicId}`);

    if (!publicId) {
      return res.status(400).json({
        success: false,
        error: "Missing required publicId parameter.",
      });
    }

    // Attempt deleting as an image resource type first
    let cloudResponse = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });

    // If it wasn't found as an image, try dropping it as a video resource type
    if (cloudResponse.result !== "ok") {
      cloudResponse = await cloudinary.uploader.destroy(publicId, {
        resource_type: "video",
      });
    }

    if (cloudResponse.result === "ok") {
      console.log(`✅ Asset successfully deleted from Cloudinary: ${publicId}`);
      return res.json({
        success: true,
        message: "Asset successfully deleted from Cloudinary",
      });
    } else {
      console.warn(
        `⚠️ Cloudinary responded with: ${JSON.stringify(cloudResponse)}`,
      );
      return res.status(404).json({
        success: false,
        error: `Asset not found or already deleted on Cloudinary. Result: ${cloudResponse.result}`,
      });
    }
  } catch (error) {
    console.error("Error executing destroy action:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown internal server crash during delete operation",
    });
  }
});

// ─── HEALTH CHECK ──────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "oh7wc75d",
    message: "Backend is ready for home network access",
    timestamp: new Date().toISOString(),
  });
});

export default app;
