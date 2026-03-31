import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// AWS S3 client
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Allowed image MIME types
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Multer-S3 upload middleware
export const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    // Remove ACL if your bucket has ACLs disabled (Block Public Access settings)
    // acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueKey = `food-images/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, uniqueKey);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
    }
  },
});

/**
 * Extract the S3 key from a full S3 URL and generate a pre-signed URL
 * valid for 1 hour so private objects are viewable in the browser.
 */
export const getS3ImageUrl = async (imageFieldValue) => {
  if (!imageFieldValue) return null;

  try {
    // Extract key from full S3 URL like https://bucket.s3.region.amazonaws.com/food-images/xxx.jpg
    let key = imageFieldValue;
    if (imageFieldValue.startsWith("http")) {
      const url = new URL(imageFieldValue);
      // key is the pathname without leading slash
      key = url.pathname.slice(1);
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (err) {
    console.error("❌ Failed to generate S3 pre-signed URL:", err.message);
    return imageFieldValue; // fallback to original URL
  }
};
