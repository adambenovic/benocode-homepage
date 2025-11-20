// services/meetings.service.ts
import { PrismaClient, MeetingStatus } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  MeetingResponse,
  MeetingAvailabilityDto,
  UpdateAvailabilityDto,
  AvailableTimeSlot,
} from '../types/meetings.types';
import { EmailService } from './email.service';
import { randomBytes } from 'crypto';

export class MeetingsService {
  constructor(
    private prisma: PrismaClient,
    private emailService: EmailService
  ) { }

  async create(dto: CreateMeetingDto): Promise<MeetingResponse> {
    const scheduledAt = new Date(dto.scheduledAt);

    // Validate scheduled time is in the future
    if (scheduledAt <= new Date()) {
      throw new ValidationError('Meeting must be scheduled in the future');
    }

    // Check availability
    const isAvailable = await this.checkAvailability(scheduledAt, dto.duration || 30);
    if (!isAvailable) {
      throw new ValidationError('Selected time slot is not available');
    }

    // Generate confirmation token
    const confirmationToken = randomBytes(32).toString('hex');

    const meeting = await this.prisma.meeting.create({
      data: {
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        scheduledAt,
        duration: dto.duration || 30,
        timezone: dto.timezone || 'UTC',
        locale: (dto.locale as any) || 'EN', // Store user's language preference
        status: 'CONFIRMED',
        notes: dto.notes,
        confirmationToken,
      },
    });

    // Send confirmation email (async)
    this.emailService.sendMeetingConfirmation(meeting).catch((error) => {
      console.error('Failed to send meeting confirmation email:', error);
    });

    return this.mapToResponse(meeting);
  }

  async getAvailability(startDate: Date, endDate: Date): Promise<AvailableTimeSlot[]> {
    const availability = await this.prisma.meetingAvailability.findMany({
      where: { isActive: true },
    });

    const existingMeetings = await this.prisma.meeting.findMany({
      where: {
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: 'CANCELLED',
        },
      },
    });


    const slots: AvailableTimeSlot[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const dayAvailability = availability.filter((a) => a.dayOfWeek === dayOfWeek);

      for (const avail of dayAvailability) {
        const [startHour, startMinute] = avail.startTime.split(':').map(Number);
        const [endHour, endMinute] = avail.endTime.split(':').map(Number);

        const slotStart = new Date(currentDate);
        slotStart.setHours(startHour, startMinute, 0, 0);

        const slotEnd = new Date(currentDate);
        slotEnd.setHours(endHour, endMinute, 0, 0);

        // Generate 30-minute slots
        let currentSlot = new Date(slotStart);
        while (currentSlot < slotEnd) {
          const slotEndTime = new Date(currentSlot);
          slotEndTime.setMinutes(slotEndTime.getMinutes() + 30);

          // Check if slot conflicts with existing meetings
          // A slot conflicts if any part of it overlaps with a booked meeting
          const hasConflict = existingMeetings.some((meeting: any) => {
            const meetingStart = new Date(meeting.scheduledAt);
            const meetingEnd = new Date(meetingStart);
            meetingEnd.setMinutes(meetingEnd.getMinutes() + meeting.duration);

            // Normalize to milliseconds for accurate comparison
            const slotStartMs = currentSlot.getTime();
            const slotEndMs = slotEndTime.getTime();
            const meetingStartMs = meetingStart.getTime();
            const meetingEndMs = meetingEnd.getTime();

            const conflicts = (
              (slotStartMs >= meetingStartMs && slotStartMs < meetingEndMs) ||
              (slotEndMs > meetingStartMs && slotEndMs <= meetingEndMs) ||
              (slotStartMs <= meetingStartMs && slotEndMs >= meetingEndMs) ||
              (meetingStartMs <= slotStartMs && meetingEndMs >= slotEndMs)
            );

            return conflicts;
          });

          if (!hasConflict && currentSlot >= new Date()) {
            slots.push({
              date: currentDate.toISOString().split('T')[0],
              time: currentSlot.toISOString(), // Return full ISO timestamp instead of just HH:mm
              available: true,
            });
          }

          currentSlot.setMinutes(currentSlot.getMinutes() + 30);
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  async getAll(skip?: number, take?: number): Promise<{ data: MeetingResponse[]; total: number }> {
    const [meetings, total] = await Promise.all([
      this.prisma.meeting.findMany({
        skip,
        take,
        orderBy: {
          scheduledAt: 'desc',
        },
      }),
      this.prisma.meeting.count(),
    ]);

    return {
      data: meetings.map(this.mapToResponse),
      total,
    };
  }

  async getById(id: string): Promise<MeetingResponse> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      throw new NotFoundError('Meeting');
    }

    return this.mapToResponse(meeting);
  }

  async update(id: string, dto: UpdateMeetingDto): Promise<MeetingResponse> {
    const existing = await this.prisma.meeting.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Meeting');
    }

    const updateData: any = {};
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === 'CANCELLED') {
        updateData.cancelledAt = new Date();
      }
    }
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const meeting = await this.prisma.meeting.update({
      where: { id },
      data: updateData,
    });

    return this.mapToResponse(meeting);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.meeting.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Meeting');
    }

    await this.prisma.meeting.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
  }

  async getAvailabilityConfig(): Promise<any[]> {
    const availability = await this.prisma.meetingAvailability.findMany({
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return availability.map((a) => ({
      id: a.id,
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
      isActive: a.isActive,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
  }

  async updateAvailability(dto: UpdateAvailabilityDto): Promise<void> {
    // Validate no overlapping time slots for the same day
    this.validateNoOverlaps(dto.availability);

    // Validate startTime < endTime for each slot
    for (const slot of dto.availability) {
      const [startHour, startMinute] = slot.startTime.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      if (startMinutes >= endMinutes) {
        throw new ValidationError(
          `Invalid time range for ${this.getDayName(slot.dayOfWeek)}: start time (${slot.startTime}) must be before end time (${slot.endTime})`
        );
      }
    }

    // Delete all existing availability
    await this.prisma.meetingAvailability.deleteMany({});

    // Create new availability
    await this.prisma.meetingAvailability.createMany({
      data: dto.availability.map((a) => ({
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        isActive: a.isActive ?? true,
      })),
    });
  }

  private validateNoOverlaps(availability: MeetingAvailabilityDto[]): void {
    // Group by dayOfWeek
    const byDay: Record<number, MeetingAvailabilityDto[]> = {};
    for (const slot of availability) {
      if (!byDay[slot.dayOfWeek]) {
        byDay[slot.dayOfWeek] = [];
      }
      byDay[slot.dayOfWeek].push(slot);
    }

    // Check for overlaps within each day
    for (const [dayOfWeek, slots] of Object.entries(byDay)) {
      const day = parseInt(dayOfWeek);
      const dayName = this.getDayName(day);

      // Sort slots by start time
      const sortedSlots = [...slots].sort((a, b) => {
        const [aHour, aMin] = a.startTime.split(':').map(Number);
        const [bHour, bMin] = b.startTime.split(':').map(Number);
        return aHour * 60 + aMin - (bHour * 60 + bMin);
      });

      // Check each slot against subsequent slots
      for (let i = 0; i < sortedSlots.length; i++) {
        const slot1 = sortedSlots[i];
        const [start1Hour, start1Min] = slot1.startTime.split(':').map(Number);
        const [end1Hour, end1Min] = slot1.endTime.split(':').map(Number);
        const start1Minutes = start1Hour * 60 + start1Min;
        const end1Minutes = end1Hour * 60 + end1Min;

        for (let j = i + 1; j < sortedSlots.length; j++) {
          const slot2 = sortedSlots[j];
          const [start2Hour, start2Min] = slot2.startTime.split(':').map(Number);
          const [end2Hour, end2Min] = slot2.endTime.split(':').map(Number);
          const start2Minutes = start2Hour * 60 + start2Min;
          const end2Minutes = end2Hour * 60 + end2Min;

          // Check for overlap: two ranges overlap if one starts before the other ends
          if (
            (start1Minutes < end2Minutes && end1Minutes > start2Minutes) ||
            (start2Minutes < end1Minutes && end2Minutes > start1Minutes)
          ) {
            throw new ValidationError(
              `Overlapping time slots detected for ${dayName}: ${slot1.startTime}-${slot1.endTime} overlaps with ${slot2.startTime}-${slot2.endTime}`
            );
          }
        }
      }
    }
  }

  private getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || `Day ${dayOfWeek}`;
  }

  private async checkAvailability(scheduledAt: Date, duration: number): Promise<boolean> {
    const dayOfWeek = scheduledAt.getDay();
    const time = `${scheduledAt.getHours().toString().padStart(2, '0')}:${scheduledAt.getMinutes().toString().padStart(2, '0')}`;

    // Check if time falls within available slots
    const availability = await this.prisma.meetingAvailability.findFirst({
      where: {
        dayOfWeek,
        isActive: true,
        startTime: { lte: time },
        endTime: { gte: time },
      },
    });

    if (!availability) {
      return false;
    }

    // Check for conflicts with existing meetings
    const meetingEnd = new Date(scheduledAt);
    meetingEnd.setMinutes(meetingEnd.getMinutes() + duration);

    const conflicts = await this.prisma.meeting.findFirst({
      where: {
        AND: [
          {
            scheduledAt: {
              lt: meetingEnd,
            },
          },
          {
            OR: [
              {
                scheduledAt: {
                  gte: scheduledAt,
                },
              },
              {
                scheduledAt: {
                  lt: scheduledAt,
                },
              },
            ],
          },
          {
            status: {
              not: 'CANCELLED',
            },
          },
        ],
      },
    });

    if (conflicts) {
      const conflictEnd = new Date(conflicts.scheduledAt);
      conflictEnd.setMinutes(conflictEnd.getMinutes() + conflicts.duration);

      // Check if there's an overlap
      if (
        (scheduledAt >= conflicts.scheduledAt && scheduledAt < conflictEnd) ||
        (meetingEnd > conflicts.scheduledAt && meetingEnd <= conflictEnd) ||
        (scheduledAt <= conflicts.scheduledAt && meetingEnd >= conflictEnd)
      ) {
        return false;
      }
    }

    return true;
  }

  private mapToResponse(meeting: any): MeetingResponse {
    return {
      id: meeting.id,
      email: meeting.email,
      name: meeting.name,
      phone: meeting.phone ?? undefined,
      scheduledAt: meeting.scheduledAt,
      duration: meeting.duration,
      timezone: meeting.timezone,
      locale: meeting.locale,
      status: meeting.status,
      notes: meeting.notes ?? undefined,
      confirmationToken: meeting.confirmationToken,
      cancelledAt: meeting.cancelledAt ?? undefined,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    };
  }
}

