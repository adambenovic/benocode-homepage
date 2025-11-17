// components/admin/FileUpload.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { uploadApi } from '@/lib/api/upload';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useTranslations } from 'next-intl';

interface FileUploadProps {
  onUploadSuccess?: (file: { filename: string; path: string }) => void;
  accept?: string;
  maxSize?: number; // in MB
}

export function FileUpload({ onUploadSuccess, accept, maxSize = 5 }: FileUploadProps) {
  const t = useTranslations('admin');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { register, handleSubmit, watch, reset } = useForm<{ file: FileList }>();

  const file = watch('file')?.[0];

  // Generate preview for images
  if (file && file.type.startsWith('image/') && !preview) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  const onSubmit = async (data: { file: FileList }) => {
    if (!data.file || data.file.length === 0) {
      setError('Please select a file');
      return;
    }

    const fileToUpload = data.file[0];

    // Validate file size
    if (fileToUpload.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const result = await uploadApi.uploadFile(fileToUpload);
      setPreview(null);
      reset();
      onUploadSuccess?.(result.data);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('uploadFile')}
        </label>
        <input
          type="file"
          {...register('file', { required: true })}
          accept={accept}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
          disabled={uploading}
        />
        {file && (
          <p className="mt-2 text-sm text-gray-600">
            Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
        {preview && (
          <div className="mt-4">
            <img
              src={preview}
              alt="Preview"
              className="max-w-xs max-h-48 rounded-md border"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <Button type="submit" disabled={uploading || !file}>
        {uploading ? (
          <>
            <Spinner className="mr-2" />
            {t('uploading')}
          </>
        ) : (
          t('upload')
        )}
      </Button>
    </form>
  );
}

