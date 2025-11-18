// app/admin/leads/[id]/page.tsx
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi, Lead } from '@/lib/api/leads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { useUIStore } from '@/stores/uiStore';
import { LEAD_STATUS } from '@/lib/constants';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  const { data, isLoading } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => leadsApi.getById(leadId),
  });

  const updateMutation = useMutation({
    mutationFn: (status: Lead['status']) =>
      leadsApi.update(leadId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      addNotification({ type: 'success', message: 'Lead updated successfully' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => leadsApi.delete(leadId),
    onSuccess: () => {
      addNotification({ type: 'success', message: 'Lead deleted successfully' });
      router.push('/admin/leads');
    },
  });

  const handleStatusChange = (newStatus: Lead['status']) => {
    updateMutation.mutate(newStatus);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this lead?')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div>
        <p className="text-gray-600 dark:text-gray-400">Lead not found</p>
        <Button onClick={() => router.push('/admin/leads')} className="mt-4">
          Back to Leads
        </Button>
      </div>
    );
  }

  const lead = data.data;

  const statusOptions = [
    { value: LEAD_STATUS.NEW, label: 'New' },
    { value: LEAD_STATUS.CONTACTED, label: 'Contacted' },
    { value: LEAD_STATUS.QUALIFIED, label: 'Qualified' },
    { value: LEAD_STATUS.CLOSED, label: 'Closed' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lead Details</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/leads')}>
            Back
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={deleteMutation.isPending}
          >
            Delete Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
                <p className="text-gray-900 dark:text-white font-medium">{lead.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                  {lead.email}
                </a>
              </div>
              {lead.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Phone</label>
                  <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                    {lead.phone}
                  </a>
                </div>
              )}
              {lead.source && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Source</label>
                  <p className="text-gray-900 dark:text-white">{lead.source}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Message</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{lead.message}</p>
              </div>
            </CardContent>
          </Card>

          {lead.metadata && Object.keys(lead.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-sm">
                  {JSON.stringify(lead.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                label="Change Status"
                options={statusOptions}
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value as Lead['status'])}
                disabled={updateMutation.isPending}
              />
              <div className="mt-4">
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                    lead.status === LEAD_STATUS.NEW
                      ? 'bg-blue-100 text-blue-800'
                      : lead.status === LEAD_STATUS.CONTACTED
                      ? 'bg-yellow-100 text-yellow-800'
                      : lead.status === LEAD_STATUS.QUALIFIED
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {lead.status}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Created</label>
                <p className="text-gray-900 dark:text-white text-sm">
                  {new Date(lead.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Last Updated</label>
                <p className="text-gray-900 dark:text-white text-sm">
                  {new Date(lead.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

