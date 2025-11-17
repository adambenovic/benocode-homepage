// app/admin/content/page.tsx
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi, Content } from '@/lib/api/content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useUIStore } from '@/stores/uiStore';
import Link from 'next/link';

export default function AdminContentPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  const { data, isLoading } = useQuery({
    queryKey: ['content', 'admin', page],
    queryFn: () => contentApi.getAllAdmin(page, 10),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const contents = data?.data || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text">Content Management</h1>
        <Link href="/admin/content/create">
          <Button>Create Content</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {contents.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-text-light">
              No content found
            </CardContent>
          </Card>
        ) : (
          contents.map((content) => {
            const enTranslation = content.translations.find((t) => t.locale === 'EN') || content.translations[0];
            const preview = enTranslation.value.length > 100 
              ? enTranslation.value.substring(0, 100) + '...' 
              : enTranslation.value;

            return (
              <Card key={content.key}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-text mb-2">{content.key}</h3>
                      <p className="text-sm text-text-light mb-2">Type: {content.type}</p>
                      <p className="text-text-light text-sm">{preview}</p>
                      <div className="mt-2">
                        <span className="text-xs text-text-light">
                          Translations: {content.translations.length} languages
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/content/${content.key}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-text-light">
            Page {page} of {data.meta.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
            disabled={page === data.meta.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
