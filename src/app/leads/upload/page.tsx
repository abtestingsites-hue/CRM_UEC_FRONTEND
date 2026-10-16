"use client";

import React, { useState } from 'react';
import { UploadCloud, File, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function LeadUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    // Get actual User ID from localStorage
    let userId = 'admin-id';
    try {
      const userStr = localStorage.getItem('crm_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user.id;
      }
    } catch (err) { console.warn('[UI Exception Swallowed Fixed]:', err); }

    formData.append('uploadedById', userId);

    try {
      const res = await apiFetch(`/api/v1/leads/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setUploadResult(data);
    } catch (error) {
      console.error(error);
      setUploadResult({ error: 'Failed to upload file' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upload Leads</h1>
          <p className="text-slate-400 text-sm mt-1">Import lead datasets via Excel (.xlsx) or CSV files.</p>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${file ? 'border-primary bg-primary/5' : 'border-[#333] hover:border-primary/50 bg-[#111]'}`}
        >
          <input aria-label="Upload lead CSV or Excel file" type="file"
            id="file-upload"
            className="hidden"
            accept=".xlsx,.csv"
            onChange={(e) => e.target.files && setFile(e.target.files[0])}
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
            {file ? (
              <File className="w-12 h-12 text-primary mb-4" />
            ) : (
              <UploadCloud className="w-12 h-12 text-slate-500 mb-4" />
            )}

            <h3 className="text-lg font-medium mb-1">
              {file ? file.name : 'Drag & drop your file here'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {file ? `${(file.size / 1024).toFixed(2)} KB` : 'Supports: .xlsx, .csv (Max 10MB)'}
            </p>

            <div className="px-6 py-2 bg-[#222] hover:bg-[#333] border border-[#444] rounded-lg text-sm font-medium transition-colors">
              {file ? 'Change File' : 'Browse Files'}
            </div>
          </label>
        </div>

        {file && (
          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg ${isUploading ? 'bg-primary/50 text-white/50 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'}`}
            >
              {isUploading ? 'Uploading & Processing...' : 'Upload Dataset'}
            </button>
          </div>
        )}

        {uploadResult && (
          <div className={`p-6 rounded-xl border ${uploadResult.success ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <div className="flex items-center gap-3 mb-4">
              {uploadResult.success ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              ) : (
                <AlertCircle className="w-6 h-6 text-rose-500" />
              )}
              <h3 className={`text-lg font-medium ${uploadResult.success ? 'text-emerald-500' : 'text-rose-500'}`}>
                {uploadResult.success ? 'Upload Complete' : 'Upload Failed'}
              </h3>
            </div>

            {uploadResult.success && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#111] p-4 rounded-lg border border-[#222]">
                  <p className="text-slate-400 text-sm mb-1">Successful Rows</p>
                  <p className="text-2xl font-bold text-emerald-500">{uploadResult.successfulRows}</p>
                </div>
                <div className="bg-[#111] p-4 rounded-lg border border-[#222]">
                  <p className="text-slate-400 text-sm mb-1">Failed Rows</p>
                  <p className="text-2xl font-bold text-rose-500">{uploadResult.failedRows}</p>
                </div>
              </div>
            )}

            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="mt-4 bg-[#111] border border-[#222] rounded-lg p-4 max-h-48 overflow-y-auto custom-scrollbar">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Error Log:</h4>
                <ul className="space-y-1">
                  {uploadResult.errors.map((err: any, i: number) => (
                    <li key={i} className="text-xs text-rose-400">Row {err.row}: {err.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
