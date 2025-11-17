// app/admin/meetings/page.tsx
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingsApi, Meeting } from '@/lib/api/meetings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { useUIStore } from '@/stores/uiStore';

export default function AdminMeetingsPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  const statusOptions = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['meetings', 'admin', page],
    queryFn: () => meetingsApi.getAll(page, 10),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Meeting['status'] }) =>
      meetingsApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      addNotification({ type: 'success', message: 'Meeting updated successfully' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: meetingsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      addNotification({ type: 'success', message: 'Meeting cancelled successfully' });
    },
  });

  const handleStatusChange = (meetingId: string, newStatus: Meeting['status']) => {
    updateMutation.mutate({ id: meetingId, status: newStatus });
  };

  const handleDelete = (meetingId: string) => {
    if (confirm('Are you sure you want to cancel this meeting?')) {
      deleteMutation.mutate(meetingId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const meetings = data?.data || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text">Meetings</h1>
        <Button onClick={() => window.location.href = '/admin/meetings/availability'}>
          Manage Availability
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                    Scheduled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {meetings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-text-light">
                      No meetings found
                    </td>
                  </tr>
                ) : (
                  meetings.map((meeting) => (
                    <tr key={meeting.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">
                        {meeting.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">{meeting.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">
                        {new Date(meeting.scheduledAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">
                        {meeting.duration} min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Select
                          options={statusOptions}
                          value={meeting.status}
                          onChange={(e) => handleStatusChange(meeting.id, e.target.value as Meeting['status'])}
                          className="w-32"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button variant="danger" size="sm" onClick={() => handleDelete(meeting.id)}>
                          Cancel
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
