import React, { useState, useRef } from 'react';
import { Upload, File, X, Info } from 'lucide-react';

interface UploadBoxProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  label?: string;
  helperText?: string;
}

export default function UploadBox({
  onFilesSelected,
  accept = '.pdf,image/*',
  multiple = true,
  maxSizeMB = 100,
  label = 'Select files or drop them here',
  helperText = 'PDF, Images, Word, Excel, slide decks up to 100MB'
}: UploadBoxProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFileList, setSelectedFileList] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files) as File[];
      processFiles(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      processFiles(files);
    }
  };

  const processFiles = (files: File[]) => {
    // Basic file filtering
    const validFiles = files.filter((f) => {
      const sizeMB = f.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        alert(`File "${f.name}" exceeds the size limit of ${maxSizeMB}MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const updatedList = multiple ? [...selectedFileList, ...validFiles] : [validFiles[0]];
      setSelectedFileList(updatedList);
      onFilesSelected(updatedList);
    }
  };

  const removeFile = (index: number) => {
    const updated = [...selectedFileList];
    updated.splice(index, 1);
    setSelectedFileList(updated);
    onFilesSelected(updated);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Main Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
          isDragActive
            ? 'border-blue-550 bg-blue-50/50 scale-[0.99] shadow-inner shadow-blue-500/5'
            : 'border-slate-200 bg-blue-50/10 hover:border-blue-400 hover:bg-blue-50/20'
        }`}
        id="drag-drop-container"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-3">
          <Upload size={22} className="text-blue-600" />
        </div>

        <h4 className="font-sans text-base font-bold text-slate-900">{label}</h4>
        <p className="mt-2 font-mono text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          {helperText}
        </p>

        {/* Dynamic secure privacy banner */}
        <div className="mt-8 flex items-center space-x-1.5 rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-100 max-w-md">
          <Info size={13} className="text-blue-600 shrink-0" />
          <p className="font-sans text-[10px] text-slate-500 leading-none">
            Your files are TLS-protected and auto-deleted from our nodes after 1 hour.
          </p>
        </div>
      </div>

      {/* Selected File Grid List */}
      {selectedFileList.length > 0 && (
        <div className="mt-6 space-y-3.5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="font-sans text-xs font-bold uppercase tracking-wider text-gray-400">
              Staged Documents ({selectedFileList.length})
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {selectedFileList.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                    <File size={16} />
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="truncate font-sans text-xs font-bold text-gray-800">{file.name}</p>
                    <p className="font-mono text-[10px] text-gray-400">{formatSize(file.size)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
