import multer from 'multer';

// Configure multer to store files in memory as buffer
const storage = multer.memoryStorage();

// File filter to only allow CSV files
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        cb(null, true);
    } else {
        cb(new Error('Only CSV files are allowed'), false);
    }
};

// Configure multer with size limit (5MB)
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
    }
});

export default upload;
