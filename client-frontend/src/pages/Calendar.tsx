import { useEffect, useMemo, useState, useTransition } from "react"
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from "firebase/firestore"
import { Plus, Search, UserPlus, Loader2, Check, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"
import {
  subscribeToCustomers,
  createQuickCustomer,
  type Customer,
} from "@/lib/customers"
import { subscribeToServices, type ServiceRecord } from "@/lib/services"
import { subscribeToStaff, type StaffRecord } from "@/lib/staff"
import { subscribeToBlocks, type BlockRecord } from "@/lib/blocks"
import {
  calculateEndTime,
  generateSlots,
  isSlotAvailable,
  type AppointmentSummary,
  type SlotSuggestion,
} from "@/lib/availability"
import { toneBadgeClass } from "@/lib/tone"

const MAX_AUTOCOMPLETE_RESULTS = 8
const SEARCH_DEBOUNCE_MS = 200
const MAX_SLOT_OPTIONS = 12
const DAYS_AHEAD = 7
const MIN_ADVANCE_MINUTES = 60

const bookingStatusOptions = [
  { value: "pending", label: "Oczekująca" },
  { value: "confirmed", label: "Potwierdzona" },
] as const

type CalendarStatus = "confirmed" | "pending" | "no-show" | "cancelled"

type AppointmentRecord = {
  id: string
  customerId?: string
  customerName: string
  serviceId: string
  staffId?: string
  staffName: string
  start: Date
  end: Date
  status: CalendarStatus
  price?: number | null
  notes?: string
}

const STATUS_LABEL: Record<CalendarStatus, string> = {
  confirmed: "Potwierdzona",
  pending: "Oczekująca",
  "no-show": "Nieobecność",
  cancelled: "Anulowana",
}

const STATUS_CLASS: Record<CalendarStatus, string> = {
  confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  "no-show": "bg-rose-100 text-rose-700 border-rose-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
}

function normalizeTimestamp(value: unknown): Date {
  if (value instanceof Timestamp) {
    return value.toDate()
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date
    }
  }
  return new Date()
}

function formatDateLong(date: Date) {
  return date.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function formatTimeRange(start: Date, end: Date) {
  return `${start.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}`
}

function formatPrice(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "Do ustalenia"
  }
  return `${value.toFixed(2)} zł`
}

const Calendar = () => {
  const { user } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [services, setServices] = useState<ServiceRecord[]>([])
  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [blocksByStaff, setBlocksByStaff] = useState<Record<string, BlockRecord[]>>({})
  const [customerError, setCustomerError] = useState<string | null>(null)
  const [servicesError, setServicesError] = useState<string | null>(null)
  const [staffError, setStaffError] = useState<string | null>(null)
  const [appointmentsLoaded, setAppointmentsLoaded] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerSearchDebounced, setCustomerSearchDebounced] = useState("")
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPhone, setNewCustomerPhone] = useState("")
  const [newCustomerEmail, setNewCustomerEmail] = useState("")
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<SlotSuggestion | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<typeof bookingStatusOptions[number]["value"]>("pending")
  const [notes, setNotes] = useState("")
  const [priceOverride, setPriceOverride] = useState("")
  const [isSubmitting, startSubmitTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribeCustomers = subscribeToCustomers(
      (records) => {
        setCustomers(records)
        setCustomerError(null)
      },
      (error) => {
        console.error("Nie udało się pobrać klientów", error)
        setCustomerError("Nie udało się pobrać klientów")
      },
    )

    const unsubscribeServices = subscribeToServices(
      (records) => {
        setServices(records)
        setServicesError(null)
      },
      (error) => {
        console.error("Nie udało się pobrać usług", error)
        setServicesError("Nie udało się pobrać usług")
      },
    )

    const unsubscribeStaff = subscribeToStaff(
      (records) => {
        setStaff(records.filter((member) => member.isActive !== false))
        setStaffError(null)
      },
      (error) => {
        console.error("Nie udało się pobrać personelu", error)
        setStaffError("Nie udało się pobrać personelu")
      },
    )

    const appointmentsQuery = query(collection(db, "appointments"), orderBy("start"))
    const unsubscribeAppointments = onSnapshot(
      appointmentsQuery,
      (snapshot) => {
        const records = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data() as DocumentData
          const start = normalizeTimestamp(data.start ?? data.startTime)
          const end = normalizeTimestamp(data.end ?? data.endTime ?? calculateEndTime(start, {
            id: data.serviceId ?? "",
            name: "",
            durationMin: typeof data.durationMin === "number" ? data.durationMin : 60,
            price: null,
            bufferAfterMin: typeof data.bufferAfterMin === "number" ? data.bufferAfterMin : 0,
            noParallel: Boolean(data.noParallel ?? false),
            tone: "primary",
          }))
          return {
            id: docSnapshot.id,
            customerId: typeof data.customerId === "string" ? data.customerId : undefined,
            customerName: typeof data.clientName === "string" ? data.clientName : "Klient",
            serviceId: typeof data.serviceId === "string" ? data.serviceId : "",
            staffId: typeof data.staffId === "string" ? data.staffId : undefined,
            staffName: typeof data.staffName === "string" ? data.staffName : "Zespół",
            start,
            end,
            status: (typeof data.status === "string" ? data.status : "pending") as CalendarStatus,
            price:
              typeof data.price === "number"
                ? data.price
                : typeof data.price === "string"
                  ? Number(data.price)
                  : null,
            notes: typeof data.notes === "string" ? data.notes : undefined,
          } satisfies AppointmentRecord
        })
        setAppointments(records)
        setAppointmentsLoaded(true)
      },
      (error) => {
        console.error("Nie udało się pobrać wizyt", error)
        setAppointmentsLoaded(true)
      },
    )

    return () => {
      unsubscribeCustomers()
      unsubscribeServices()
      unsubscribeStaff()
      unsubscribeAppointments()
    }
  }, [])

  useEffect(() => {
    const timers: NodeJS.Timeout[] = []
    const handle = setTimeout(() => {
      setCustomerSearchDebounced(customerSearch)
    }, SEARCH_DEBOUNCE_MS)
    timers.push(handle)
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [customerSearch])

  useEffect(() => {
    if (!staff.length) {
      setBlocksByStaff({})
      return
    }

    const unsubscribers: Array<() => void> = []
    const blocksAccumulator: Record<string, BlockRecord[]> = {}

    staff.forEach((member) => {
      const unsubscribe = subscribeToBlocks(
        member.id,
        (records) => {
          blocksAccumulator[member.id] = records
          setBlocksByStaff((prev) => ({ ...prev, [member.id]: records }))
        },
        (error) => {
          console.error(`Nie udało się pobrać blokad dla ${member.id}`, error)
        },
      )
      unsubscribers.push(unsubscribe)
    })

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
    }
  }, [staff])

  useEffect(() => {
    if (!isModalOpen) {
      return
    }
    setSubmitSuccess(null)
    setSubmitError(null)
  }, [isModalOpen])

  useEffect(() => {
    if (!isModalOpen) {
      return
    }

    const preferredCustomer = customers.find((customer) => customer.id === selectedCustomerId)

    if (!preferredCustomer) {
      const recent = customers.slice(0, 1)
      if (recent.length > 0) {
        setSelectedCustomerId(recent[0].id)
      }
    }
  }, [customers, isModalOpen, selectedCustomerId])

  useEffect(() => {
    if (!isModalOpen) {
      return
    }
    if (!selectedCustomerId) {
      setSelectedServiceId(null)
      return
    }
    const customer = customers.find((record) => record.id === selectedCustomerId)
    if (!customer) {
      setSelectedServiceId(null)
      return
    }
    const favoriteServiceId = customer.preferences?.favoriteServices?.[0]
    if (favoriteServiceId && services.some((service) => service.id === favoriteServiceId)) {
      setSelectedServiceId((prev) => prev ?? favoriteServiceId)
    }
  }, [selectedCustomerId, customers, services, isModalOpen])

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) ?? null,
    [customers, selectedCustomerId],
  )

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  )

  const staffForService = useMemo(() => {
    if (!selectedService) {
      return []
    }
    return staff.filter((member) => {
      if (!member.services.length) {
        return true
      }
      return member.services.includes(selectedService.id)
    })
  }, [staff, selectedService])

  const appointmentSummaries = useMemo<AppointmentSummary[]>(
    () =>
      appointments.map((appointment) => ({
        id: appointment.id,
        staffId: appointment.staffId,
        staffName: appointment.staffName,
        start: appointment.start,
        end: appointment.end,
      })),
    [appointments],
  )

  const slotOptions = useMemo(() => {
    if (!selectedService) {
      return []
    }
    const now = new Date()
    now.setMinutes(now.getMinutes() + MIN_ADVANCE_MINUTES)

    const options: SlotSuggestion[] = []

    staffForService.forEach((member) => {
      for (let dayOffset = 0; dayOffset <= DAYS_AHEAD; dayOffset += 1) {
        const checkDate = new Date()
        checkDate.setHours(0, 0, 0, 0)
        checkDate.setDate(checkDate.getDate() + dayOffset)

        if (dayOffset === 0 && now.getHours() === 23 && now.getMinutes() > 30) {
          continue
        }

        const filteredAppointments = appointmentSummaries.filter((summary) => {
          const matchesStaff = summary.staffId
            ? summary.staffId === member.id
            : summary.staffName === member.fullName
          return matchesStaff && summary.start.toDateString() === checkDate.toDateString()
        })
        const blocks = blocksByStaff[member.id] ?? []

        const generated = generateSlots({
          staff: member,
          service: selectedService,
          date: checkDate,
          existingAppointments: filteredAppointments,
          blocks,
          limit: Math.ceil(MAX_SLOT_OPTIONS / Math.max(1, staffForService.length)),
        }).filter((slot) => slot.start >= now)

        options.push(...generated)
        if (options.length >= MAX_SLOT_OPTIONS) {
          break
        }
      }
    })

    return options
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, MAX_SLOT_OPTIONS)
  }, [selectedService, staffForService, appointmentSummaries, blocksByStaff])

  useEffect(() => {
    if (!selectedService || !slotOptions.length) {
      return
    }
    const preferredStaff = selectedCustomer?.preferences?.preferredStaffId
    let initialSlot = slotOptions[0]
    if (preferredStaff) {
      const preferredSlot = slotOptions.find((slot) => slot.staffId === preferredStaff)
      if (preferredSlot) {
        initialSlot = preferredSlot
      }
    }
    setSelectedSlot((prev) => prev ?? initialSlot)
    setSelectedStaffId((prev) => prev ?? initialSlot.staffId)
  }, [slotOptions, selectedCustomer, selectedService])

  const filteredCustomers = useMemo(() => {
    if (!customerSearchDebounced.trim()) {
      return customers.slice(0, MAX_AUTOCOMPLETE_RESULTS)
    }
    const needle = customerSearchDebounced.trim().toLowerCase()
    return customers
      .filter((customer) => {
        const stack = [customer.fullName, customer.phone ?? "", customer.email ?? ""]
        return stack.some((value) => value.toLowerCase().includes(needle))
      })
      .slice(0, MAX_AUTOCOMPLETE_RESULTS)
  }, [customers, customerSearchDebounced])

  const servicesByCategory = useMemo(() => {
    const grouped = new Map<string, ServiceRecord[]>()
    services.forEach((serviceRecord) => {
      const key = serviceRecord.category ?? "Pozostałe"
      const bucket = grouped.get(key) ?? []
      bucket.push(serviceRecord)
      grouped.set(key, bucket)
    })
    return Array.from(grouped.entries()).map(([category, records]) => ({
      category,
      records: records.sort((a, b) => a.name.localeCompare(b.name)),
    }))
  }, [services])

  const steps = [
    {
      title: "Wybierz klienta",
      description: "Wybierz istniejącego klienta lub dodaj nowy kontakt",
      completed: Boolean(selectedCustomerId),
    },
    {
      title: "Wybierz usługę",
      description: "Dobierz zabieg i specjalistkę",
      completed: Boolean(selectedServiceId),
    },
    {
      title: "Wybierz termin",
      description: "Wybierz wolny slot, sprawdzimy dostępność",
      completed: Boolean(selectedSlot && selectedStaffId),
    },
  ]

  const canSubmit = Boolean(selectedCustomer && selectedService && selectedSlot && selectedStaffId)

  const handleResetModal = () => {
    setStepIndex(0)
    setCustomerSearch("")
    setCustomerSearchDebounced("")
    setSelectedCustomerId(null)
    setNewCustomerName("")
    setNewCustomerPhone("")
    setNewCustomerEmail("")
    setSelectedServiceId(null)
    setSelectedStaffId(null)
    setSelectedSlot(null)
    setSelectedStatus("pending")
    setNotes("")
    setPriceOverride("")
    setSubmitError(null)
    setSubmitSuccess(null)
  }

  const handleOpenModal = () => {
    handleResetModal()
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    handleResetModal()
  }

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) {
      setCustomerError("Podaj imię i nazwisko")
      return
    }
    try {
      await createQuickCustomer({
        fullName: newCustomerName.trim(),
        phone: newCustomerPhone.trim() || undefined,
        email: newCustomerEmail.trim() || undefined,
      })
      setCustomerError(null)
      setNewCustomerName("")
      setNewCustomerPhone("")
      setNewCustomerEmail("")
      setCustomerSearch("")
    } catch (error) {
      console.error("Nie udało się dodać klienta", error)
      setCustomerError("Nie udało się dodać klienta")
    }
  }

  const slotValidation = useMemo(() => {
    if (!selectedService || !selectedSlot) {
      return null
    }
    const staffRecord = staff.find((member) => member.id === selectedSlot.staffId)
    if (!staffRecord) {
      return { available: false, reason: "Brak danych o personelu" }
    }
    const relatedAppointments = appointmentSummaries.filter((summary) => summary.staffId === (staffRecord.id || staffRecord.fullName))
    const blocks = blocksByStaff[staffRecord.id] ?? []
    return isSlotAvailable({
      staff: staffRecord,
      service: selectedService,
      start: selectedSlot.start,
      existingAppointments: relatedAppointments,
      blocks,
    })
  }, [selectedSlot, selectedService, staff, appointmentSummaries, blocksByStaff])

  const handleConfirmBooking = () => {
    if (!selectedCustomer || !selectedService || !selectedSlot || !selectedStaffId) {
      setSubmitError("Uzupełnij wszystkie kroki rezerwacji")
      return
    }

    const staffRecord = staff.find((member) => member.id === selectedStaffId)
    if (!staffRecord) {
      setSubmitError("Nie znaleziono wybranego personelu")
      return
    }

    if (slotValidation && !slotValidation.available) {
      setSubmitError(slotValidation.reason ?? "Wybrany termin nie jest dostępny")
      return
    }

    const now = new Date()
    if (selectedSlot.start.getTime() - now.getTime() < MIN_ADVANCE_MINUTES * 60 * 1000) {
      setSubmitError("Termin musi być oddalony co najmniej o godzinę")
      return
    }

    const appointmentPayload = {
      customerId: selectedCustomer.id,
      clientName: selectedCustomer.fullName,
      customerPhone: selectedCustomer.phone ?? "",
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      staffId: staffRecord.id,
      staffName: staffRecord.fullName,
      start: selectedSlot.start,
      end: calculateEndTime(selectedSlot.start, selectedService),
      status: selectedStatus,
      price: priceOverride.trim() ? Number(priceOverride) : selectedService.price ?? null,
      notes: notes.trim(),
      createdAt: serverTimestamp(),
      createdBy: user?.uid ?? null,
    }

    startSubmitTransition(async () => {
      try {
        await addDoc(collection(db, "appointments"), appointmentPayload)
        setSubmitError(null)
        setSubmitSuccess("Rezerwacja została utworzona")
        handleCloseModal()
      } catch (error) {
        console.error("Nie udało się zapisać rezerwacji", error)
        setSubmitError("Nie udało się zapisać rezerwacji")
      }
    })
  }

  const loading = !appointmentsLoaded || !services.length || !customers.length
  const servicesLookup = useMemo(() => new Map(services.map((service) => [service.id, service])), [services])

  const upcomingAppointments = useMemo(() => {
    return [...appointments]
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 12)
  }, [appointments])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kalendarz</h1>
          <p className="mt-1 text-sm text-gray-600">
            Zarządzaj wizytami i dodawaj rezerwacje w trzech krokach.
          </p>
        </div>
        <Button onClick={handleOpenModal} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" />
          Dodaj rezerwację
        </Button>
      </div>

      {submitSuccess ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {submitSuccess}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Ładujemy dane kalendarza...
        </div>
      ) : null}

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Nadchodzące wizyty</h2>
        </div>
        <div className="mt-4 space-y-3">
          {!loading && upcomingAppointments.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
              Brak zaplanowanych wizyt. Dodaj pierwszą rezerwację, aby wypełnić kalendarz.
            </p>
          ) : null}
          {upcomingAppointments.map((appointment) => {
            const service = servicesLookup.get(appointment.serviceId)
            return (
              <div key={appointment.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{appointment.customerName}</p>
                    <p className="text-sm text-gray-600">{service?.name ?? "Usługa"}</p>
                  </div>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${STATUS_CLASS[appointment.status]}`}>
                    {STATUS_LABEL[appointment.status]}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 text-sm text-gray-600 md:grid-cols-3">
                  <div>
                    <p className="font-medium text-gray-700">Termin</p>
                    <p>{formatDateLong(appointment.start)}</p>
                    <p className="text-gray-500">{formatTimeRange(appointment.start, appointment.end)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Specjalistka</p>
                    <p>{appointment.staffName}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Cena</p>
                    <p>{formatPrice(appointment.price)}</p>
                  </div>
                </div>
                {appointment.notes ? <p className="mt-3 text-sm text-gray-500">Notatki: {appointment.notes}</p> : null}
              </div>
            )
          })}
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Nowa rezerwacja</h2>
                <p className="text-sm text-gray-500">Krok {stepIndex + 1} z 3</p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-md px-2 py-1 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              >
                Zamknij
              </button>
            </div>

            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <ol className="grid gap-3 md:grid-cols-3">
                {steps.map((step, index) => (
                  <li key={step.title} className="flex items-start gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        index === stepIndex
                          ? "bg-indigo-600 text-white"
                          : step.completed
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {step.completed && index !== stepIndex ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="px-6 py-6">
              {stepIndex === 0 ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      placeholder="Szukaj klienta po imieniu, telefonie, emailu..."
                      value={customerSearch}
                      onChange={(event) => setCustomerSearch(event.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-10 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  {customerError ? (
                    <p className="text-sm text-red-600">{customerError}</p>
                  ) : null}

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">Szybki wybór</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => {
                            setSelectedCustomerId(customer.id)
                            setStepIndex(1)
                          }}
                          className={`rounded-xl border px-4 py-3 text-left shadow-sm transition ${
                            customer.id === selectedCustomerId
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 bg-white hover:border-indigo-300"
                          }`}
                        >
                          <p className="text-sm font-semibold text-gray-900">{customer.fullName || "Bez nazwy"}</p>
                          <p className="text-xs text-gray-500">{customer.phone || customer.email || "Brak danych kontaktowych"}</p>
                          {customer.preferences?.favoriteServices?.length ? (
                            <p className="mt-1 text-xs text-indigo-600">
                              Ulubione usługi: {customer.preferences.favoriteServices.length}
                            </p>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-800">Dodaj nowego klienta</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <input
                        type="text"
                        placeholder="Imię i nazwisko"
                        value={newCustomerName}
                        onChange={(event) => setNewCustomerName(event.target.value)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      />
                      <input
                        type="text"
                        placeholder="Telefon"
                        value={newCustomerPhone}
                        onChange={(event) => setNewCustomerPhone(event.target.value)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={newCustomerEmail}
                        onChange={(event) => setNewCustomerEmail(event.target.value)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      />
                    </div>
                    <Button
                      onClick={handleCreateCustomer}
                      type="button"
                      className="mt-3 bg-gray-900 hover:bg-gray-800"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Dodaj klienta
                    </Button>
                  </div>
                </div>
              ) : null}

              {stepIndex === 1 ? (
                <div className="space-y-5">
                  {servicesError ? <p className="text-sm text-red-600">{servicesError}</p> : null}
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStepIndex(0)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Wróć do klientów
                    </button>
                    {selectedServiceId ? (
                      <button
                        type="button"
                        onClick={() => setStepIndex(2)}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-500"
                      >
                        Dalej
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-5">
                    {servicesByCategory.map(({ category, records }) => (
                      <div key={category} className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-800">{category}</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                          {records.map((service) => (
                            <button
                              key={service.id}
                              type="button"
                              onClick={() => {
                                setSelectedServiceId(service.id)
                                setStepIndex(2)
                              }}
                              className={`rounded-xl border px-4 py-3 text-left shadow-sm transition ${
                                service.id === selectedServiceId
                                  ? "border-indigo-500 bg-indigo-50"
                                  : "border-gray-200 bg-white hover:border-indigo-300"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{service.name}</p>
                                  {service.description ? (
                                    <p className="mt-1 text-xs text-gray-500">{service.description}</p>
                                  ) : null}
                                </div>
                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${toneBadgeClass[service.tone]}`}>
                                  {service.tone}
                                </span>
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                <span>Czas: {service.durationMin} min</span>
                                {service.bufferAfterMin ? <span>Bufor: {service.bufferAfterMin} min</span> : null}
                                <span>Cena: {service.price ? `${service.price} zł` : "wg cennika"}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {stepIndex === 2 ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStepIndex(1)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Wróć do usług
                    </button>
                  </div>

                  {staffError ? <p className="text-sm text-red-600">{staffError}</p> : null}

                  {slotOptions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
                      Brak wolnych terminów w najbliższych dniach. Spróbuj zmienić usługę lub osobę wykonującą.
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {slotOptions.map((slot) => {
                        const staffRecord = staff.find((member) => member.id === slot.staffId)
                        return (
                          <button
                            key={`${slot.staffId}-${slot.start.toISOString()}`}
                            type="button"
                            onClick={() => {
                              setSelectedSlot(slot)
                              setSelectedStaffId(slot.staffId)
                            }}
                            className={`rounded-xl border px-4 py-3 text-left shadow-sm transition ${
                              selectedSlot && slot.start.getTime() === selectedSlot.start.getTime() && slot.staffId === selectedStaffId
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-gray-200 bg-white hover:border-indigo-300"
                            }`}
                          >
                            <p className="text-sm font-semibold text-gray-900">
                              {staffRecord?.fullName ?? "Specjalistka"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDateLong(slot.start)}
                            </p>
                            <p className="text-sm text-gray-700">{formatTimeRange(slot.start, slot.end)}</p>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {slotValidation && !slotValidation.available ? (
                    <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      {slotValidation.reason ?? "Wybrany termin wymaga weryfikacji"}
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Status rezerwacji
                        <select
                          value={selectedStatus}
                          onChange={(event) => setSelectedStatus(event.target.value as typeof bookingStatusOptions[number]["value"])}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        >
                          {bookingStatusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Cena (opcjonalnie)
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={priceOverride}
                          onChange={(event) => setPriceOverride(event.target.value)}
                          placeholder="Pozostaw puste, aby użyć ceny usługi"
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                      </label>
                    </div>
                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                      Notatki (opcjonalnie)
                      <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        className="min-h-[120px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      />
                    </label>
                  </div>

                  {submitError ? (
                    <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {submitError}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      Anuluj
                    </button>
                    <Button
                      type="button"
                      onClick={handleConfirmBooking}
                      disabled={!canSubmit || isSubmitting}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Zapisz rezerwację
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Calendar
