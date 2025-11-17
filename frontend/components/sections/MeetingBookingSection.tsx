// components/sections/MeetingBookingSection.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { meetingsApi, AvailableSlot } from '@/lib/api/meetings';
import { useUIStore } from '@/stores/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  MEETING_CONSTANTS,
  VALIDATION_CONSTANTS,
  QUERY_CONSTANTS,
  ERROR_MESSAGES,
} from '@/lib/constants';
import { useLocale } from 'next-intl';

const meetingSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(VALIDATION_CONSTANTS.MIN_NAME_LENGTH, `Name must be at least ${VALIDATION_CONSTANTS.MIN_NAME_LENGTH} characters`),
  phone: z.string().optional(),
  scheduledAt: z.string().min(1, 'Please select a date and time'),
  duration: z.literal(30), // Fixed 30-minute consultations only
  timezone: z.string().default(MEETING_CONSTANTS.DEFAULT_TIMEZONE),
  notes: z.string().optional(),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

export const MeetingBookingSection: React.FC = () => {
  const t = useTranslations('meeting');
  const locale = useLocale();
  const addNotification = useUIStore((state) => state.addNotification);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Get available slots for the configured number of days
  // Use a stable date range that doesn't change - round to start of day for consistency
  // This ensures the query key is stable and data is shared across all component instances
  const dateRange = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0); // Round to start of day
    
    const end = new Date(start);
    end.setDate(end.getDate() + MEETING_CONSTANTS.AVAILABILITY_DAYS);
    
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, []); // Empty deps - only calculate once, stable across renders

  const { 
    data: availabilityData, 
    isLoading: availabilityLoading,
    isError: availabilityError,
    error: availabilityErrorData
  } = useQuery({
    queryKey: ['meetings', 'availability', dateRange.start, dateRange.end],
    queryFn: () =>
      meetingsApi.getAvailability(dateRange.start, dateRange.end),
    enabled: true,
    retry: QUERY_CONSTANTS.RETRY_COUNT,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if data exists in cache
    refetchOnReconnect: false,
    staleTime: QUERY_CONSTANTS.STALE_TIME,
    gcTime: QUERY_CONSTANTS.GC_TIME,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      duration: 30, // Fixed 30-minute consultations only
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || MEETING_CONSTANTS.DEFAULT_TIMEZONE,
    },
  });

  const mutation = useMutation({
    mutationFn: meetingsApi.create,
    onSuccess: () => {
      addNotification({
        type: 'success',
        message: t('success'),
      });
      reset();
      setSelectedDate('');
      setSelectedTime('');
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: error.response?.data?.error?.message || t('error'),
      });
    },
  });

  const onSubmit = async (data: MeetingFormData) => {
    if (!selectedDate || !selectedTime) {
      addNotification({
        type: 'error',
        message: t('error'),
      });
      return;
    }

    const scheduledAt = new Date(`${selectedDate}T${selectedTime}`).toISOString();
    await mutation.mutateAsync({
      ...data,
      duration: 30, // Fixed 30-minute consultations only
      scheduledAt,
    });
  };

  // Group available slots by date
  // Backend returns { date: "YYYY-MM-DD", time: "HH:mm", available: boolean }
  // We need to convert to ISO datetime strings for the frontend
  const slotsByDate: Record<string, Array<{ time: string; date: string; timeString: string }>> = {};
  availabilityData?.data?.forEach((slot: any) => {
    // Backend format: { date: "YYYY-MM-DD", time: "HH:mm", available: boolean }
    // Convert to ISO datetime string
    const dateStr = slot.date || new Date(slot.time).toISOString().split('T')[0];
    const timeStr = slot.time || new Date(slot.time).toTimeString().split(' ')[0].slice(0, 5);
    const isoDateTime = `${dateStr}T${timeStr}:00`;
    
    if (!slotsByDate[dateStr]) {
      slotsByDate[dateStr] = [];
    }
    slotsByDate[dateStr].push({
      time: isoDateTime,
      date: dateStr,
      timeString: timeStr,
    });
  });

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
    setValue('scheduledAt', '');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      setValue('scheduledAt', `${selectedDate}T${time}`);
    }
  };

  return (
    <section id="book-meeting" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">{t('title')}</h2>
          <p className="text-lg text-text-light">{t('description')}</p>
        </div>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{t('selectDateTime')}</CardTitle>
            </CardHeader>
            <CardContent>
              {availabilityLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : availabilityError ? (
                <div className="text-center py-8 text-red-600">
                  <p className="mb-2">{t('error')}</p>
                  <p className="text-sm text-text-light">
                    {availabilityErrorData instanceof Error 
                      ? availabilityErrorData.message 
                      : ERROR_MESSAGES.AVAILABILITY_LOAD_FAILED}
                  </p>
                </div>
              ) : availabilityData?.data && availabilityData.data.length > 0 ? (
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {Object.keys(slotsByDate).slice(0, MEETING_CONSTANTS.MAX_DISPLAYED_DATES).map((date) => (
                      <div key={date} className="border rounded-lg p-4">
                                <h3 className="font-semibold mb-2">
                                  {new Date(date).toLocaleDateString(locale, {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                  {slotsByDate[date].map((slot, idx) => {
                                    // slot.time is ISO datetime string, slot.timeString is HH:mm format
                                    const displayTime = slot.timeString || new Date(slot.time).toLocaleTimeString(locale, {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    });
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  handleDateSelect(date);
                                  handleTimeSelect(slot.time);
                                }}
                                className={`px-3 py-1 text-sm rounded ${
                                  selectedDate === date && selectedTime === slot.time
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                              >
                                {displayTime}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-text-light">
                  <p>{t('noSlots')}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label={t('name')}
                  {...register('name')}
                  error={errors.name?.message}
                  required
                />
                <Input
                  label={t('email')}
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  required
                />
                <Input
                  label={t('phone')}
                  type="tel"
                  {...register('phone')}
                  error={errors.phone?.message}
                />
                <Textarea
                  label={t('notes')}
                  {...register('notes')}
                  error={errors.notes?.message}
                  rows={4}
                />
                        {selectedDate && selectedTime && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-text-light">
                              {t('selected')}: {new Date(`${selectedDate}T${selectedTime}`).toLocaleString(locale)}
                            </p>
                          </div>
                        )}
                <Button type="submit" isLoading={isSubmitting} className="w-full" disabled={!selectedDate || !selectedTime}>
                  {t('book')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

