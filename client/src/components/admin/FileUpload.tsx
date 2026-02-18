import React, { useState, useRef, ChangeEvent } from "react";
import { Button } from "@nextui-org/react";
import { Upload, Loader2 } from "lucide-react";
import imageCompression from "browser-image-compression";
import { useUploadMediaMutation } from "../../store/api/quizzesApi";

interface FileUploadProps {
    onUpload: (url: string) => void;
    label: string;
    accept?: string;
    folder?: string;
}

export function FileUpload({ onUpload, label, accept = "*/*", folder = "misc" }: FileUploadProps) {
    const [uploadMedia, { isLoading }] = useUploadMediaMutation();
    const [compressionProgress, setCompressionProgress] = useState(0);
    const [isCompressing, setIsCompressing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        let file = e.target.files?.[0];
        if (!file) return;

        // Client-side compression for images
        if (file.type.startsWith("image/")) {
            setIsCompressing(true);
            setCompressionProgress(0);
            try {
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                    onProgress: (p: number) => setCompressionProgress(Math.round(p)),
                };
                file = await imageCompression(file, options);
            } catch (error) {
                console.error("Compression error:", error);
            } finally {
                setIsCompressing(false);
            }
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        try {
            const result: any = await uploadMedia(formData).unwrap();
            onUpload(result.url);
        } catch (err: any) {
            alert("Upload failed: " + (err.data?.message || err.error));
        }
    };

    return (
        <div className="flex flex-col gap-1">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept={accept}
            />
            <div className="flex items-center gap-2">
                <Button 
                    size="sm" 
                    variant="flat" 
                    color="secondary" 
                    startContent={(isLoading || isCompressing) ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                    onClick={() => fileInputRef.current?.click()}
                    isLoading={isLoading || isCompressing}
                    className="w-fit font-bold"
                >
                    {isCompressing ? `Compressing ${compressionProgress}%...` : label}
                </Button>
            </div>
        </div>
    );
}
