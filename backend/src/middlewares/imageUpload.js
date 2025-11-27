import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Helper to ensure directory exists
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'public/uploads/others';

        // Determine folder based on route or field name
        if (req.baseUrl.includes('prizes') || req.path.includes('prizes')) {
            uploadPath = 'public/uploads/prizes';
        } else if (req.baseUrl.includes('boxes') || req.path.includes('boxes') || req.body.type === 'box') {
            uploadPath = 'public/uploads/boxes';
        }

        ensureDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-random-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-'); // Sanitize filename
        cb(null, `${uniqueSuffix}-${name}${ext}`);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only .png, .jpg, .jpeg and .webp format allowed!'));
    }
};

// Initialize multer
const uploadImage = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

export default uploadImage;
