import React, { useState, useRef, useEffect } from "react";
import { Button } from "@nextui-org/react";
import { Music, Play, Pause, ExternalLink } from "lucide-react";

interface MediaPreviewProps {
    imageUrl?: string;
    audioUrl?: string;
    compact?: boolean;
}

export function MediaPreview({ imageUrl, audioUrl, compact = false }: MediaPreviewProps) {
    if (!imageUrl && !audioUrl) return null;

    return (
        <div className={`flex flex-col gap-3 ${compact ? "" : "w-full"}`}>
            {imageUrl && (
                <div className={`relative group rounded-xl overflow-hidden bg-black/5 flex justify-center items-center ${compact ? "h-32" : "h-64"}`}>
                    <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="h-full w-full object-contain"
                    />
                    <a 
                        href={imageUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ExternalLink size={14} />
                    </a>
                </div>
            )}
            {audioUrl && (
                <AudioPlayer audioUrl={audioUrl} compact={compact} />
            )}
        </div>
    );
}

interface AudioPlayerProps {
    audioUrl: string;
    compact?: boolean;
}

export function AudioPlayer({ audioUrl, compact }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [audioUrl]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(err => console.error("Audio playback failed", err));
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className={`flex items-center gap-3 bg-default-100 p-2 rounded-xl border-2 border-default-200 ${compact ? "py-1.5" : ""}`}>
            <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                <Music size={compact ? 16 : 20} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase text-default-600 leading-none mb-1 tracking-wider">Audio Source</p>
                <p className="text-xs truncate font-bold text-foreground/80">{audioUrl}</p>
            </div>
            <Button 
                isIconOnly 
                size="sm" 
                variant="solid" 
                color={isPlaying ? "secondary" : "primary"}
                onClick={togglePlay}
                className="shrink-0 shadow-sm"
            >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </Button>
        </div>
    );
}
