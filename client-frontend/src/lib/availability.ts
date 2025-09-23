import type { ServiceRecord } from "@/lib/services"
import type { StaffRecord } from "@/lib/staff"
import type { BlockRecord } from "@/lib/blocks"

export interface AppointmentSummary {
  id: string
  staffId?: string
  staffName?: string
  start: Date
  end: Date
}

export interface SlotSuggestion {
  start: Date
  end: Date
  staffId: string
  reason?: string
}

const MIN_SLOT_MINUTES = 15

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number)
  if (Number.isFinite(hours) && Number.isFinite(minutes)) {
    return hours * 60 + minutes
  }
  return 0
}

function fromMinutes(base: Date, minutes: number) {
  const date = new Date(base)
  date.setHours(0, minutes, 0, 0)
  return date
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && startB < endA
}

function addMinutes(date: Date, minutes: number) {
  const next = new Date(date)
  next.setMinutes(next.getMinutes() + minutes)
  return next
}

export function calculateEndTime(start: Date, service: ServiceRecord) {
  const totalMinutes = service.durationMin + (service.bufferAfterMin ?? 0)
  return addMinutes(start, totalMinutes)
}

export function isSlotAvailable(params: {
  staff: StaffRecord
  service: ServiceRecord
  start: Date
  existingAppointments: AppointmentSummary[]
  blocks: BlockRecord[]
}) {
  const { staff, service, start, existingAppointments, blocks } = params
  const weekday = start.toLocaleDateString("en-CA", { weekday: "long" }).toLowerCase()
  const workingDay = staff.workingHours[weekday]
  if (!workingDay) {
    return { available: false, reason: "Poza godzinami pracy" }
  }
  const minutesFromMidnight = start.getHours() * 60 + start.getMinutes()
  const dayStart = toMinutes(workingDay.start)
  const dayEnd = toMinutes(workingDay.end)

  if (minutesFromMidnight < dayStart || minutesFromMidnight >= dayEnd) {
    return { available: false, reason: "Poza godzinami pracy" }
  }

  const end = calculateEndTime(start, service)
  const endMinutes = end.getHours() * 60 + end.getMinutes()

  if (endMinutes > dayEnd) {
    return { available: false, reason: "Wizyta wykracza poza godziny pracy" }
  }

  const hasBlockConflict = blocks.some((block) => overlaps(start, end, block.startTime, block.endTime))
  if (hasBlockConflict) {
    return { available: false, reason: "Termin jest zablokowany" }
  }

  const hasAppointmentConflict = existingAppointments.some((appt) => overlaps(start, end, appt.start, appt.end))
  if (hasAppointmentConflict) {
    return { available: false, reason: "Konflikt z inną wizytą" }
  }

  return { available: true }
}

export function generateSlots(params: {
  staff: StaffRecord
  service: ServiceRecord
  date: Date
  existingAppointments: AppointmentSummary[]
  blocks: BlockRecord[]
  limit?: number
}) {
  const { staff, service, date, existingAppointments, blocks, limit = 12 } = params
  const weekday = date.toLocaleDateString("en-CA", { weekday: "long" }).toLowerCase()
  const workingDay = staff.workingHours[weekday]
  if (!workingDay) {
    return []
  }

  const dayStart = toMinutes(workingDay.start)
  const dayEnd = toMinutes(workingDay.end)
  const slotStep = Math.max(MIN_SLOT_MINUTES, Math.min(service.durationMin, 30))

  const slots: SlotSuggestion[] = []

  for (let minutes = dayStart; minutes + service.durationMin <= dayEnd; minutes += slotStep) {
    const slotStart = fromMinutes(date, minutes)
    const validation = isSlotAvailable({
      staff,
      service,
      start: slotStart,
      existingAppointments,
      blocks,
    })

    if (validation.available) {
      slots.push({
        start: slotStart,
        end: calculateEndTime(slotStart, service),
        staffId: staff.id,
      })
      if (slots.length >= limit) {
        break
      }
    }
  }

  return slots
}
