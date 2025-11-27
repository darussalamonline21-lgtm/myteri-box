import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const ImageUpload = ({
    value,
    onChange,
    label = "Image",
    placeholder = "Upload an image",
    className = ""
}) => {
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (typeof value === 'string') {
            setPreview(value);
        } else if (value instanceof File) {
            const objectUrl = URL.createObjectURL(value);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else {
            setPreview(null);
        }
    }, [value]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("File size exceeds 5MB limit");
                return;
            }
            if (!file.type.match('image.*')) {
                alert("Please upload an image file");
                return;
            }
            onChange(file);
        }
    };

    const handleRemove = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("File size exceeds 5MB limit");
                return;
            }
            if (!file.type.match('image.*')) {
                alert("Please upload an image file");
                return;
            }
            onChange(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div className={`w-full ${className}`}>
            <label className="block text-sm font-semibold mb-2 text-gray-300">
                {label}
            </label>

            <div
                className={`relative border-2 border-dashed rounded-lg transition-all duration-200 ${preview
                        ? 'border-purple-500 bg-gray-800'
                        : 'border-gray-600 hover:border-purple-400 hover:bg-gray-800/50 bg-gray-900'
                    }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                />

                {preview ? (
                    <div className="relative group aspect-video w-full h-48 flex items-center justify-center overflow-hidden rounded-lg">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={handleRemove}
                                className="p-2 bg-red-600 rounded-full hover:bg-red-500 text-white transition-colors"
                                title="Remove image"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center h-48 cursor-pointer p-4"
                    >
                        <div className="p-3 bg-gray-800 rounded-full mb-3">
                            <Upload className="w-6 h-6 text-purple-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-300 text-center">
                            {placeholder}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 text-center">
                            SVG, PNG, JPG or GIF (max. 5MB)
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageUpload;
