// app/admin/testimonials/page.tsx
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { testimonialsApi } from '@/lib/api/testimonials';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useUIStore } from '@/stores/uiStore';
import Link from 'next/link';

export default function AdminTestimonialsPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  const { data, isLoading } = useQuery({
    queryKey: ['testimonials', 'admin', page],
    queryFn: () => testimonialsApi.getAllAdmin(page, 10),
  });

  const deleteMutation = useMutation({
    mutationFn: testimonialsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      addNotification({ type: 'success', message: 'Testimonial deleted successfully' });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this testimonial?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const testimonials = data?.data || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text">Testimonials</h1>
        <Link href="/admin/testimonials/create">
          <Button>Create Testimonial</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {testimonials.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-text-light">
              No testimonials found
            </CardContent>
          </Card>
        ) : (
          testimonials.map((testimonial) => {
            const enTranslation = testimonial.translations.find((t) => t.locale === 'EN') || testimonial.translations[0];
            return (
              <Card key={testimonial.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-text-light mb-2 italic">&quot;{enTranslation.content}&quot;</p>
                      <p className="font-semibold text-text">{enTranslation.author}</p>
                      {enTranslation.company && (
                        <p className="text-sm text-text-light">{enTranslation.company}</p>
                      )}
                      <div className="mt-2">
                        <span className="text-xs text-text-light">Order: {testimonial.order}</span>
                        <span className="ml-4 text-xs text-text-light">
                          Status: {testimonial.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/testimonials/${testimonial.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(testimonial.id)}>
                        Delete
                      </Button>
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

