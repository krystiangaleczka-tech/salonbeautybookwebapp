import React, { useEffect, useMemo, useState } from "react"
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, Timestamp } from "firebase/firestore"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"

const bookingSchema = z.object({
  clientName: z.string().min(2, "Podaj imię i nazwisko klientki"),
  serviceId: z.string().min(1, "Wybierz usługę"),
  staffName: z.string().min(2, "Podaj osobę wykonującą zabieg"),
  date: z.string().min(1, "Wybierz datę"),
  startTime: z.string().min(1, "Wybierz godzinę"),
  status: z.enum(["confirmed", "pending"]).default("pending"),
  price: z.string().optional(),
  notes: z.string().optional(),
})

type BookingFormValues = z.infer<typeof bookingSchema>

type CalendarStatus = "confirmed" | "pending" | "no-show" | "cancelled"

interface Service {
  id: string
  name: string
  durationMin: number
  bufferAfterMin?: number
  price?: string
}

interface Appointment {
  id: string
  serviceId: string
  clientName: string
  staffName: string
  start: string
  end: string
  status: CalendarStatus
  price?: string
  notes?: string
}

const STATUS_LABEL: Record<CalendarStatus, string> = {
  confirmed: "Potwierdzona",
  pending: "Oczekująca",
  "no-show": "Nieobecność",
  cancelled: "Anulowana",
}

const STATUS_STYLE: Record<CalendarStatus, string> = {
  confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  "no-show": "bg-rose-100 text-rose-700 border-rose-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
}

function toIsoString(value: unknown) {
  if (!value) {
    return new Date().toISOString()
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString()
  }

  if (typeof value === "string") {
    return value
  }

  if (typeof value === "number") {
    return new Date(value).toISOString()
  }

  if (typeof value === "object" && value !== null && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }

  return new Date().toISOString()
}

function formatDateLabel(iso: string) {
  const date = new Date(iso)
  return date.toLocaleDateString("pl-PL", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
}

function formatTimeRange(startIso: string, endIso: string) {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const formatter = new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" })
  return `${formatter.format(start)} – ${formatter.format(end)}`
}

const INITIAL_DATE = new Date()

const defaultFormValues: BookingFormValues = {
  clientName: "",
  serviceId: "",
  staffName: "",
  date: INITIAL_DATE.toISOString().slice(0, 10),
  startTime: INITIAL_DATE.toISOString().slice(11, 16),
  status: "pending",
  price: "",
  notes: "",
}

const Calendar: React.FC = () => {
  const { user } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [servicesLoaded, setServicesLoaded] = useState(false)
  const [appointmentsLoaded, setAppointmentsLoaded] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: defaultFormValues,
  })

  const selectedServiceId = watch("serviceId")
  const selectedService = useMemo(() => services.find((service) => service.id === selectedServiceId), [services, selectedServiceId])

  useEffect(() => {
    if (user?.displayName) {
      setValue("staffName", user.displayName, { shouldDirty: false })
    }
  }, [user, setValue])

  useEffect(() => {
    const servicesRef = collection(db, "services")
    const unsubscribeServices = onSnapshot(
      servicesRef,
      (snapshot) => {
        const fetchedServices: Service[] = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            name: typeof data.name === "string" && data.name.trim() ? data.name : "Usługa",
            durationMin: Number(data.durationMin ?? data.duration ?? 60),
            bufferAfterMin: typeof data.bufferAfterMin === "number" ? data.bufferAfterMin : undefined,
            price: typeof data.price === "string" ? data.price : undefined,
          }
        })
        setServices(fetchedServices)
        setServicesLoaded(true)
      },
      (error) => {
        console.error("Nie udało się pobrać listy usług", error)
        setServicesLoaded(true)
      }
    )

    const appointmentsRef = query(collection(db, "appointments"), orderBy("start"))
    const unsubscribeAppointments = onSnapshot(
      appointmentsRef,
      (snapshot) => {
        const fetchedAppointments: Appointment[] = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            serviceId: typeof data.serviceId === "string" ? data.serviceId : "",
            clientName: typeof data.clientName === "string" ? data.clientName : "Klient",
            staffName: typeof data.staffName === "string" ? data.staffName : "Pracownik",
            start: toIsoString(data.start),
            end: toIsoString(data.end),
            status: (typeof data.status === "string" ? data.status : "pending") as CalendarStatus,
            price: typeof data.price === "string" ? data.price : undefined,
            notes: typeof data.notes === "string" ? data.notes : undefined,
          }
        })
        setAppointments(fetchedAppointments)
        setAppointmentsLoaded(true)
      },
      (error) => {
        console.error("Nie udało się pobrać wizyt", error)
        setAppointmentsLoaded(true)
      }
    )

    return () => {
      unsubscribeServices()
      unsubscribeAppointments()
    }
  }, [])

  const loading = !servicesLoaded || !appointmentsLoaded
  const servicesLookup = useMemo(() => new Map(services.map((service) => [service.id, service])), [services])

  const upcomingAppointments = useMemo(() => {
    return [...appointments]
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 12)
  }, [appointments])

  const openModal = () => {
    setSubmitError(null)
    setSubmitSuccess(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSubmitError(null)
    reset({
      ...defaultFormValues,
      staffName: user?.displayName ?? "",
    })
  }

  const onSubmit = async (values: BookingFormValues) => {
    const targetService = servicesLookup.get(values.serviceId)
    const startDate = new Date(`${values.date}T${values.startTime}`)
    if (Number.isNaN(startDate.getTime())) {
      setSubmitError("Nieprawidłowy termin rozpoczęcia")
      return
    }

    const duration = targetService?.durationMin ?? 60
    const buffer = targetService?.bufferAfterMin ?? 0
    const endDate = new Date(startDate.getTime() + (duration + buffer) * 60_000)

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await addDoc(collection(db, "appointments"), {
        serviceId: values.serviceId,
        clientName: values.clientName,
        staffName: values.staffName,
        status: values.status,
        start: Timestamp.fromDate(startDate),
        end: Timestamp.fromDate(endDate),
        price: values.price ?? "",
        notes: values.notes ?? "",
        createdAt: serverTimestamp(),
        createdBy: user?.uid ?? null,
      })

      setSubmitSuccess("Rezerwacja została dodana do kalendarza")
      setIsSubmitting(false)
      setIsModalOpen(false)
      reset({
        ...defaultFormValues,
        staffName: values.staffName,
      })
    } catch (error) {
      console.error("Nie udało się zapisać rezerwacji", error)
      setSubmitError("Nie udało się zapisać rezerwacji. Spróbuj ponownie.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kalendarz</h1>
          <p className="mt-1 text-sm text-gray-600">Zarządzaj wizytami i dodawaj nowe rezerwacje w kilku kliknięciach.</p>
        </div>
        <Button onClick={openModal} disabled={services.length === 0} className="bg-indigo-600 hover:bg-indigo-700">
          Dodaj usługę
        </Button>
      </div>

      {submitSuccess ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {submitSuccess}
        </div>
      ) : null}
      {services.length === 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Brak zdefiniowanych usług w Firestore. Dodaj wpisy do kolekcji <code className="font-mono">services</code>, aby umożliwić rezerwacje.
        </div>
      ) : null}

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Nadchodzące wizyty</h2>
          {loading ? <span className="text-sm text-gray-500">Ładowanie danych...</span> : null}
        </div>
        <div className="mt-4 space-y-3">
          {!loading && upcomingAppointments.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
              Brak zaplanowanych wizyt. Dodaj pierwszą rezerwację, aby wypełnić kalendarz.
            </p>
          ) : null}
          {upcomingAppointments.map((appointment) => {
            const service = servicesLookup.get(appointment.serviceId)
            const serviceLabel = service?.name ?? "Usługa"
            const statusClass = STATUS_STYLE[appointment.status]
            return (
              <div key={appointment.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{appointment.clientName}</p>
                    <p className="text-sm text-gray-600">{serviceLabel}</p>
                  </div>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}>
                    {STATUS_LABEL[appointment.status]}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 text-sm text-gray-600 md:grid-cols-3">
                  <div>
                    <p className="font-medium text-gray-700">Termin</p>
                    <p>{formatDateLabel(appointment.start)}</p>
                    <p className="text-gray-500">{formatTimeRange(appointment.start, appointment.end)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Specjalistka</p>
                    <p>{appointment.staffName}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Cena</p>
                    <p>{appointment.price && appointment.price.trim() ? appointment.price : service?.price ?? "Do ustalenia"}</p>
                  </div>
                </div>
                {appointment.notes ? (
                  <p className="mt-3 text-sm text-gray-500">Notatki: {appointment.notes}</p>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Nowa rezerwacja</h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Zamknij"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-5">
              <div className="space-y-1">
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
                  Klientka
                </label>
                <input
                  id="clientName"
                  type="text"
                  {...register("clientName")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Anna Kowalska"
                />
                {errors.clientName ? <p className="text-xs text-rose-600">{errors.clientName.message}</p> : null}
              </div>

              <div className="space-y-1">
                <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700">
                  Usługa
                </label>
                <select
                  id="serviceId"
                  {...register("serviceId")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Wybierz usługę</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} • {service.durationMin} min
                    </option>
                  ))}
                </select>
                {errors.serviceId ? <p className="text-xs text-rose-600">{errors.serviceId.message}</p> : null}
                {selectedService ? (
                  <p className="text-xs text-gray-500">
                    Czas trwania: {selectedService.durationMin} min
                    {selectedService.bufferAfterMin ? ` + ${selectedService.bufferAfterMin} min bufora` : ""}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Data
                  </label>
                  <input
                    id="date"
                    type="date"
                    {...register("date")}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  {errors.date ? <p className="text-xs text-rose-600">{errors.date.message}</p> : null}
                </div>
                <div className="space-y-1">
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                    Godzina rozpoczęcia
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    {...register("startTime")}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  {errors.startTime ? <p className="text-xs text-rose-600">{errors.startTime.message}</p> : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="staffName" className="block text-sm font-medium text-gray-700">
                    Specjalistka
                  </label>
                  <input
                    id="staffName"
                    type="text"
                    {...register("staffName")}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="Maja Flak"
                  />
                  {errors.staffName ? <p className="text-xs text-rose-600">{errors.staffName.message}</p> : null}
                </div>
                <div className="space-y-1">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    {...register("status")}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="pending">Oczekująca</option>
                    <option value="confirmed">Potwierdzona</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Cena (opcjonalnie)
                  </label>
                  <input
                    id="price"
                    type="text"
                    {...register("price")}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="145 zł"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notatki (opcjonalnie)
                  </label>
                  <input
                    id="notes"
                    type="text"
                    {...register("notes")}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="Preferencje klientki"
                  />
                </div>
              </div>

              {submitError ? <p className="text-sm text-rose-600">{submitError}</p> : null}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={closeModal} className="text-gray-600 hover:text-gray-800">
                  Anuluj
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                  {isSubmitting ? "Zapisywanie..." : "Dodaj rezerwację"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Calendar
