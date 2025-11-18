// app/admin/legal-pages/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { legalApi } from '@/lib/api/legal';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useUIStore } from '@/stores/uiStore';

const slugLabels: Record<string, string> = {
  gdpr: 'GDPR',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
};

export default function AdminLegalPagesPage() {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  const { data, isLoading } = useQuery({
    queryKey: ['legal-pages'],
    queryFn: () => legalApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: legalApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-pages'] });
      addNotification({ type: 'success', message: 'Legal page deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete legal page' });
    },
  });

  const handleDelete = (slug: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      deleteMutation.mutate(slug);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const legalPages = data?.data || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Legal Pages</h1>
        <Link href="/admin/legal-pages/create">
          <Button>Create Legal Page</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {legalPages.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-600 dark:text-gray-400">
              No legal pages found
            </CardContent>
          </Card>
        ) : (
          legalPages.map((page) => (
            <Card key={page.slug}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                      {slugLabels[page.slug] || page.slug}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Slug: {page.slug}</p>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Translations:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {page.translations.map((translation) => (
                          <div key={translation.locale} className="text-sm">
                            <span className="font-medium text-gray-900 dark:text-white">{translation.locale}:</span>{' '}
                            <span className="text-gray-600 dark:text-gray-400">{translation.title}</span>
                          </div>
                        ))}
                      </div>
                      {page.translations.length === 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">No translations available</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/legal-pages/${page.slug}`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => handleDelete(page.slug, slugLabels[page.slug] || page.slug)}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

