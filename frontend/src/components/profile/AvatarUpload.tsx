"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Check, Loader2, Camera } from "lucide-react";
import Image from "next/image";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";

interface AvatarUploadProps {
    currentAvatar?: string;
    onUpload: (file: File) => Promise<void>;
}

export function AvatarUpload({ currentAvatar, onUpload }: AvatarUploadProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [crop, setCrop] = useState<Crop>({
        unit: "%",
        width: 50,
        height: 50,
        x: 25,
        y: 25,
    });
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            alert("Vui lòng chọn file ảnh");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("Kích thước ảnh không được vượt quá 5MB");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImage(reader.result as string);
            setIsModalOpen(true);
        };
        reader.readAsDataURL(file);
    };

    const getCroppedImg = async (): Promise<File | null> => {
        if (!imageRef.current || !completedCrop) return null;

        const canvas = document.createElement("canvas");
        const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
        const scaleY = imageRef.current.naturalHeight / imageRef.current.height;

        canvas.width = completedCrop.width;
        canvas.height = completedCrop.height;
        const ctx = canvas.getContext("2d");

        if (!ctx) return null;

        ctx.drawImage(
            imageRef.current,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            completedCrop.width,
            completedCrop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    resolve(null);
                    return;
                }
                const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
                resolve(file);
            }, "image/jpeg");
        });
    };

    const handleSave = async () => {
        setIsUploading(true);
        try {
            const croppedFile = await getCroppedImg();
            if (croppedFile) {
                await onUpload(croppedFile);
                setIsModalOpen(false);
                setSelectedImage(null);
            }
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Tải ảnh lên thất bại. Vui lòng thử lại.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setSelectedImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <>
            {/* Avatar Display */}
            <div className="relative group">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-blue-400 to-purple-500"
                >
                    {currentAvatar ? (
                        <Image
                            src={currentAvatar}
                            alt="Avatar"
                            fill
                            className="object-cover"
                            unoptimized
                            onError={(e) => {
                                // Fallback to default if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                            {/* Show first letter of name as default avatar */}
                            <span>👤</span>
                        </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="h-8 w-8 text-white" />
                    </div>
                </motion.div>

                {/* Upload Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                >
                    <Upload className="h-4 w-4" />
                </motion.button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* Crop Modal */}
            <AnimatePresence>
                {isModalOpen && selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                        onClick={handleCancel}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold">Cắt ảnh đại diện</h3>
                                <button
                                    onClick={handleCancel}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Crop Area */}
                            <div className="mb-4">
                                <ReactCrop
                                    crop={crop}
                                    onChange={(c) => setCrop(c)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={1}
                                    circularCrop
                                >
                                    <img
                                        ref={imageRef}
                                        src={selectedImage}
                                        alt="Crop preview"
                                        className="max-h-96 w-full object-contain"
                                    />
                                </ReactCrop>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={isUploading}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={isUploading || !completedCrop}
                                    className="gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Đang tải lên...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Lưu
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
