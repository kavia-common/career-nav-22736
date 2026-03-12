"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

export type FileUploaderProps = {
  accept?: string;
  maxSizeMb?: number;
  onFileSelected: (file: File) => void;
};

/**
 * PUBLIC_INTERFACE
 * Drag-and-drop file uploader with browse button.
 */
export function FileUploader({
  accept = ".pdf,.doc,.docx,.txt",
  maxSizeMb = 10,
  onFileSelected
}: FileUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const validate = (file: File) => {
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      return `File is too large. Max size is ${maxSizeMb}MB.`;
    }
    return null;
  };

  const handleFile = (file: File) => {
    const e = validate(file);
    if (e) {
      setError(e);
      return;
    }
    setError(null);
    onFileSelected(file);
  };

  return (
    <div>
      <div
        className={cn(
          "rounded-xl border border-dashed p-6 text-center transition-colors",
          isDragging ? "border-teal-500 bg-teal-50" : "border-zinc-300 bg-white"
        )}
        onDragOver={(ev) => {
          ev.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(ev) => {
          ev.preventDefault();
          setIsDragging(false);
          const file = ev.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
      >
        <p className="text-sm font-semibold text-zinc-900">Drag & drop your resume</p>
        <p className="mt-1 text-sm text-zinc-600">
          Accepted: {accept} • Up to {maxSizeMb}MB
        </p>

        <div className="mt-4 flex justify-center">
          <Button
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            Browse files
          </Button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {error && (
        <p className="mt-2 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
