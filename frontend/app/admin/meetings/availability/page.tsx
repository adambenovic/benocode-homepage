// app/admin/meetings/availability/page.tsx
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingsApi, MeetingAvailability } from '@/lib/api/meetings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { useUIStore } from '@/stores/uiStore';
import { useForm } from 'react-hook-form';

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export default function MeetingsAvailabilityPage() {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  const dayOptions = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['meetings', 'availability'],
    queryFn: async () => {
      // This GET request will set the CSRF token cookie and return it in headers
      const result = await meetingsApi.getAvailabilityConfig();
      // Log CSRF token for debugging
      console.log('CSRF token should be set after GET request');
      return result;
    },
  });

  React.useEffect(() => {
    if (data?.data) {
      setSlots(
        data.data.map((a) => ({
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          isActive: a.isActive,
        }))
      );
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (availability: AvailabilitySlot[]) =>
      meetingsApi.updateAvailability({
        availability: availability.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isActive: s.isActive ?? true,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', 'availability'] });
      addNotification({
        type: 'success',
        message: 'Availability updated successfully',
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || 'Failed to update availability';
      addNotification({
        type: 'error',
        message: errorMessage,
      });
    },
  });

  const addSlot = () => {
    setSlots([...slots, { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true }]);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: any) => {
    const updated = [...slots];
    updated[index] = { ...updated[index], [field]: value };
    setSlots(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(slots);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-text mb-6">Meeting Availability</h1>
      <Card>
        <CardHeader>
          <CardTitle>Configure Available Time Slots</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {slots.length === 0 ? (
              <p className="text-text-light text-center py-8">No availability slots configured</p>
            ) : (
              slots.map((slot, index) => (
                <div key={index} className="border p-4 rounded-lg space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-text">Slot {index + 1}</h3>
                    <Button type="button" variant="danger" size="sm" onClick={() => removeSlot(index)}>
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Select
                      label="Day of Week"
                      options={dayOptions}
                      value={slot.dayOfWeek.toString()}
                      onChange={(e) => updateSlot(index, 'dayOfWeek', parseInt(e.target.value))}
                    />
                    <Input
                      label="Start Time"
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                      required
                    />
                    <Input
                      label="End Time"
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                      required
                    />
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id={`active-${index}`}
                        checked={slot.isActive}
                        onChange={(e) => updateSlot(index, 'isActive', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor={`active-${index}`} className="text-sm text-text">
                        Active
                      </label>
                    </div>
                  </div>
                </div>
              ))
            )}

            <Button type="button" variant="outline" onClick={addSlot}>
              Add Time Slot
            </Button>

            <div className="flex gap-4 pt-4">
              <Button type="submit" isLoading={mutation.isPending}>
                Save Availability
              </Button>
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

