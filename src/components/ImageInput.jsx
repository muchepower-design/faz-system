// frontend/src/components/ImageInput.jsx
import { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { resolveAssetUrl } from '../utils/assets';

export default function ImageInput({
  label = 'Image',
  value,
  onChange,
  category = 'general',
  required = false,
  hint,
  className = '',
}) {
  const [mode, setMode] = useState('url');          // 'url' | 'upload'
  const [uploading, setUploading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setPreviewError(false);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', category);
      const res = await api.post('/uploads/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(res.data.url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header with label + mode toggle */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>

        <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-3 py-1 text-xs rounded-md flex items-center gap-1 transition ${
              mode === 'url' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LinkIcon className="w-3 h-3" /> URL
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-3 py-1 text-xs rounded-md flex items-center gap-1 transition ${
              mode === 'upload' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload className="w-3 h-3" /> Upload
          </button>
        </div>
      </div>

      {/* Mode-specific input */}
      {mode === 'url' ? (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => { onChange(e.target.value); setPreviewError(false); }}
          placeholder="https://example.com/image.jpg"
          required={required}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-faz-orange/30 focus:border-faz-orange"
        />
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 hover:border-faz-orange rounded-lg p-6 text-center cursor-pointer transition"
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" /> Uploading…
              </div>
            ) : (
              <>
                <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                <p className="text-sm text-gray-600">Click to choose or drag & drop</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP, GIF, AVIF — up to 10 MB</p>
              </>
            )}
          </div>

          {/* Hidden shim so HTML form validation passes when Upload mode is active */}
          {required && (
            <input
              tabIndex={-1}
              required
              value={value || ''}
              onChange={() => {}}
              className="absolute opacity-0 pointer-events-none w-0 h-0"
            />
          )}
        </div>
      )}

      {/* Preview */}
      {value && !previewError && (
        <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
          <img
            src={resolveAssetUrl(value)}
            alt="preview"
            className="w-16 h-16 object-cover rounded border border-gray-200"
            onError={() => setPreviewError(true)}
          />
          <p className="flex-1 min-w-0 text-xs text-gray-500 truncate">{value}</p>
          <button
            type="button"
            onClick={() => { onChange(''); setPreviewError(false); }}
            className="p-1 text-gray-400 hover:text-red-500"
            title="Clear image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {value && previewError && (
        <p className="text-xs text-red-500">Could not load preview — check the URL.</p>
      )}

      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}