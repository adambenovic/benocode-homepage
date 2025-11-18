// app/admin/dashboard/page.tsx
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api/leads';
import { meetingsApi } from '@/lib/api/meetings';
import { testimonialsApi } from '@/lib/api/testimonials';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { PAGINATION_CONSTANTS, LEAD_STATUS } from '@/lib/constants';

export default function AdminDashboardPage() {
  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads', 'stats'],
    queryFn: () => leadsApi.getAll(1, PAGINATION_CONSTANTS.STATS_PAGE_SIZE),
  });

  const { data: meetingsData, isLoading: meetingsLoading } = useQuery({
    queryKey: ['meetings', 'stats'],
    queryFn: () => meetingsApi.getAll(1, PAGINATION_CONSTANTS.STATS_PAGE_SIZE),
  });

  const { data: testimonialsData, isLoading: testimonialsLoading } = useQuery({
    queryKey: ['testimonials', 'stats'],
    queryFn: () => testimonialsApi.getAllAdmin(1, PAGINATION_CONSTANTS.STATS_PAGE_SIZE),
  });

  const isLoading = leadsLoading || meetingsLoading || testimonialsLoading;

  const stats = [
    {
      title: 'Total Leads',
      value: leadsData?.meta?.total || 0,
      href: '/admin/leads',
      color: 'bg-blue-500',
    },
    {
      title: 'New Leads',
      value: leadsData?.data?.filter((l) => l.status === LEAD_STATUS.NEW).length || 0,
      href: `/admin/leads?status=${LEAD_STATUS.NEW}`,
      color: 'bg-green-500',
    },
    {
      title: 'Meetings',
      value: meetingsData?.meta?.total || 0,
      href: '/admin/meetings',
      color: 'bg-purple-500',
    },
    {
      title: 'Testimonials',
      value: testimonialsData?.meta?.total || 0,
      href: '/admin/testimonials',
      color: 'bg-orange-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
                <Link href={stat.href}>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

