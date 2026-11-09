// frontend/src/components/VideoInput.jsx
import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { vendorAPI } from '../api';
import { resolveAssetUrl } from '../utils/assets';

export default function VideoInput({ onUploaded, label = 'Upload video' }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await vendorAPI.uploadVideo(fd);
      onUploaded(res.data.url);
      toast.success('Video uploaded');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => !uploading && inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 hover:border-faz-orange rounded-lg p-4 w-full text-center transition"
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" /> Uploading…
          </div>
        ) : (
          <>
            <Upload className="w-5 h-5 mx-auto text-gray-400 mb-1" />
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-xs text-gray-400 mt-1">MP4, WEBM, MOV — up to 100 MB</p>
          </>
        )}
      </button>
    </div>
  );
}