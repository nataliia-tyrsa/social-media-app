import express from "express";
import { Request, Response } from "express";
import multer, { StorageEngine } from "multer";
import path from "path";
import fs from "fs";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

const uploadDir = path.resolve(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const storage: StorageEngine = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    cb(null, uploadDir);
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

router.post("/", protect, upload.single("image"), (req: MulterRequest, res: Response) => {
  console.log('Upload request received:', {
    hasFile: !!req.file,
    body: req.body,
    headers: req.headers['content-type']
  });
  
  if (!req.file) {
    console.error("Upload failed: no file provided");
    return res.status(400).json({ error: "No file uploaded" });
  }

  const url = `http://localhost:3000/uploads/${req.file.filename}`;
  console.log("Image uploaded successfully:", {
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size,
    url: url
  });
  res.status(200).json({ url });
});

router.post("/avatar", protect, upload.single("avatar"), (req: MulterRequest, res: Response) => {
  if (!req.file) {
    console.error("Avatar upload failed: no file provided");
    return res.status(400).json({ error: "No file uploaded" });
  }

  const url = `http://localhost:3000/uploads/${req.file.filename}`;
  console.log("Avatar uploaded:", req.file.filename);
  res.status(200).json({ url });
});

router.post("/post", protect, upload.single("image"), (req: MulterRequest, res: Response) => {
  if (!req.file) {
    console.error("Post upload failed: no file provided");
    return res.status(400).json({ error: "No file uploaded" });
  }

  const url = `http://localhost:3000/uploads/${req.file.filename}`;
  console.log("Post uploaded:", req.file.filename, req.body.caption);
  res.status(200).json({ url, caption: req.body.caption });
});

export default router;
