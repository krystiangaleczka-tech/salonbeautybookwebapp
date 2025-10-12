'use client';

import { useEffect, useMemo, useState, useTransition } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  createService,
  deleteService,
  subscribeToServices,
  updateService,
  type ServiceRecord,
} from "@/lib/services-service";
import { subscribeToAppointments, type Appointment } from "@/lib/appointments-service";
import { getBubbleStyle, toneTextClass, type ToneKey } from "@/lib/dashboard-theme";
import {
  AlertCircle,
  Check,
  Crown,
  Filter,
  Loader2,
  Pencil,
  Plus,
  Scissors,
  Search,
  Star,
  Trash2,
  TrendingDown,
} from "lucide-react";

interface ServiceFormState {
  name: string;
  category: string;
  durationMin: string;
  price: string;
  bufferAfterMin: string;
  noParallel: boolean;
  tone: ToneKey;
  description: string;
  weeklyBookings: string;
  quarterlyBookings: string;
}

type FormMode = "create" | "edit";

const toneOptions: ToneKey[] = ["primary", "chart3", "chart4", "chart5", "accent", "destructive"];

const initialFormState: ServiceFormState = {
  name: "",
  category: "",
  durationMin: "60",
  price: "",
  bufferAfterMin: "",
  noParallel: false,
  tone: "primary",
  description: "",
  weeklyBookings: "",
  quarterlyBookings: "",
};

function formatDuration(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "–";
  }
  return `${minutes} min`;
}

function formatPrice(price?: number | null) {
  if (price === null || price === undefined || Number.isNaN(price)) {
    return "–";
  }
  return `${price.toFixed(2)} zł`;
}

function sanitizeNumberInput(value: string, fallback = 0) {
  if (!value.trim()) {
    return fallback;
  }
  const normalized = Number(value.replace(/,/g, "."));
  return Number.isFinite(normalized) ? normalized : fallback;
}

function sanitizeOptionalNumber(value: string) {
  if (!value.trim()) {
    return null;
  }
  const normalized = Number(value.replace(/,/g, "."));
  return Number.isFinite(normalized) ? normalized : null;
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [formState, setFormState] = useState<ServiceFormState>(initialFormState);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);
  const [filterColor, setFilterColor] = useState<string>("all");
  const [filterDuration, setFilterDuration] = useState<string>("all");
  const [filterParallel, setFilterParallel] = useState<string>("all");

  useEffect(() => {
    let servicesLoaded = false;
    let appointmentsLoaded = false;
    
    const unsubscribeServices = subscribeToServices(
      (nextServices) => {
        setServices(nextServices);
        servicesLoaded = true;
        if (servicesLoaded && appointmentsLoaded) {
          setLoading(false);
          setError(null);
        }
      },
      (subscribeError) => {
        console.error("Nie udało się pobrać listy usług", subscribeError);
        setError("Nie udało się pobrać listy usług. Odśwież stronę lub spróbuj ponownie później.");
        setLoading(false);
      },
    );
    
    const unsubscribeAppointments = subscribeToAppointments(
      (nextAppointments) => {
        setAppointments(nextAppointments);
        appointmentsLoaded = true;
        if (servicesLoaded && appointmentsLoaded) {
          setLoading(false);
          setError(null);
        }
      },
      (subscribeError) => {
        console.error("Nie udało się pobrać listy wizyt", subscribeError);
        setError("Nie udało się pobrać listy wizyt. Odśwież stronę lub spróbuj ponownie później.");
        setLoading(false);
      },
    );

    return () => {
      unsubscribeServices();
      unsubscribeAppointments();
    };
  }, []);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    services.forEach((service) => {
      if (service.category) {
        unique.add(service.category);
      }
    });
    return Array.from(unique.values()).sort((a, b) => a.localeCompare(b));
  }, [services]);

  const filteredServices = useMemo(() => {
    let filtered = services;
    
    // Filtrowanie wg kategorii
    filtered = filtered.filter((service) => {
      return selectedCategory === "all" || service.category === selectedCategory;
    });
    
    // Filtrowanie wg koloru
    if (filterColor !== "all") {
      filtered = filtered.filter((service) => {
        return service.tone === filterColor;
      });
    }
    
    // Filtrowanie wg czasu trwania
    if (filterDuration !== "all") {
      filtered = filtered.filter((service) => {
        if (!service.durationMin) return false;
        
        if (filterDuration === "short") {
          return service.durationMin <= 30;
        } else if (filterDuration === "medium") {
          return service.durationMin >= 31 && service.durationMin <= 60;
        } else if (filterDuration === "long") {
          return service.durationMin >= 61;
        }
        return true;
      });
    }
    
    // Filtrowanie wg możliwości równoległych wizyt
    if (filterParallel !== "all") {
      filtered = filtered.filter((service) => {
        if (filterParallel === "parallel") {
          return !service.noParallel;
        } else if (filterParallel === "exclusive") {
          return service.noParallel;
        }
        return true;
      });
    }
    
    // Filtrowanie wg wyszukiwanej frazy
    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((service) => {
        const haystack = [service.name, service.category ?? "", service.description ?? ""].map((value) =>
          value.toLowerCase(),
        );
        return haystack.some((value) => value.includes(query));
      });
    }
    
    return filtered;
  }, [services, searchTerm, selectedCategory, filterColor, filterDuration, filterParallel]);

  const stats = useMemo(() => {
    if (services.length === 0) {
      return [
        {
          label: "Ilość usług",
          value: "0",
          meta: "Brak danych",
          tone: "primary" as ToneKey,
          icon: Scissors,
        },
        {
          label: "TOP usługa tygodnia",
          value: "–",
          meta: "Brak danych",
          tone: "chart3" as ToneKey,
          icon: Star,
        },
        {
          label: "LOW usługa tygodnia",
          value: "–",
          meta: "Brak danych",
          tone: "chart4" as ToneKey,
          icon: TrendingDown,
        },
        {
          label: "TOP usługa z 3 miesięcy",
          value: "–",
          meta: "Brak danych",
          tone: "chart5" as ToneKey,
          icon: Crown,
        },
      ];
    }

    // Obliczanie rzeczywistych statystyk na podstawie wizyt
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Początek tygodnia (niedziela)
    weekStart.setHours(0, 0, 0, 0);
    
    const quarterStart = new Date(now);
    quarterStart.setMonth(now.getMonth() - 3); // 3 miesiące wstecz
    quarterStart.setHours(0, 0, 0, 0);
    
    // Grupowanie wizyt według ID usług
    const serviceStats = new Map<string, { weekly: number; quarterly: number }>();
    
    // Inicjalizacja statystyk dla wszystkich usług
    services.forEach(service => {
      serviceStats.set(service.id, { weekly: 0, quarterly: 0 });
    });
    
    // Zliczanie wizyt dla każdej usługi
    appointments.forEach(appointment => {
      const appointmentDate = appointment.start.toDate();
      
      // Sprawdź czy wizita mieści się w ostatnim tygodniu
      if (appointmentDate >= weekStart && appointmentDate <= now) {
        const stats = serviceStats.get(appointment.serviceId);
        if (stats) {
          stats.weekly += 1;
        }
      }
      
      // Sprawdź czy wizuta mieści się w ostatnich 3 miesiącach
      if (appointmentDate >= quarterStart && appointmentDate <= now) {
        const stats = serviceStats.get(appointment.serviceId);
        if (stats) {
          stats.quarterly += 1;
        }
      }
    });
    
    // Znajdź usługi z najwyższą i najniższą liczbą rezerwacji w tygodniu
    let topWeeklyService: ServiceRecord | null = null;
    let lowWeeklyService: ServiceRecord | null = null;
    let topQuarterlyService: ServiceRecord | null = null;
    
    let maxWeekly = 0;
    let minWeekly = Infinity;
    let maxQuarterly = 0;
    
    services.forEach(service => {
      const stats = serviceStats.get(service.id);
      if (stats) {
        if (stats.weekly > maxWeekly) {
          maxWeekly = stats.weekly;
          topWeeklyService = service;
        }
        
        if (stats.weekly < minWeekly && stats.weekly > 0) {
          minWeekly = stats.weekly;
          lowWeeklyService = service;
        }
        
        if (stats.quarterly > maxQuarterly) {
          maxQuarterly = stats.quarterly;
          topQuarterlyService = service;
        }
      }
    });
    
    // Jeśli żadna usługa nie ma rezerwacji w tygodniu, znajdź taką z 0 rezerwacji
    if (minWeekly === Infinity) {
      lowWeeklyService = services.find(service => {
        const stats = serviceStats.get(service.id);
        return stats && stats.weekly === 0;
      }) || services[0];
    }

    const total = services.length.toString();

    return [
      {
        label: "Ilość usług",
        value: total,
        meta: "Aktywne w katalogu",
        tone: "primary" as ToneKey,
        icon: Scissors,
      },
      {
        label: "TOP usługa tygodnia",
        value: topWeeklyService?.name || "–",
        meta: `${maxWeekly} rezerwacji`,
        tone: "chart3" as ToneKey,
        icon: Star,
      },
      {
        label: "LOW usługa tygodnia",
        value: lowWeeklyService?.name || "–",
        meta: `${minWeekly === Infinity ? 0 : minWeekly} rezerwacji`,
        tone: "chart4" as ToneKey,
        icon: TrendingDown,
      },
      {
        label: "TOP usługa z 3 miesięcy",
        value: topQuarterlyService?.name || "–",
        meta: `${maxQuarterly} rezerwacji`,
        tone: "chart5" as ToneKey,
        icon: Crown,
      },
    ];
  }, [services, appointments]);

  const openCreateForm = () => {
    setFormMode("create");
    setFormState(initialFormState);
    setActiveServiceId(null);
    setIsFormOpen(true);
    setFeedback(null);
  };

  const openEditForm = (service: ServiceRecord) => {
    setFormMode("edit");
    setActiveServiceId(service.id);
    setFormState({
      name: service.name,
      category: service.category ?? "",
      durationMin: service.durationMin ? String(service.durationMin) : "60",
      price: service.price !== null && service.price !== undefined ? String(service.price) : "",
      bufferAfterMin:
        service.bufferAfterMin !== null && service.bufferAfterMin !== undefined
          ? String(service.bufferAfterMin)
          : "",
      noParallel: service.noParallel,
      tone: service.tone,
      description: service.description ?? "",
      weeklyBookings:
        service.weeklyBookings !== undefined && service.weeklyBookings !== null ? String(service.weeklyBookings) : "",
      quarterlyBookings:
        service.quarterlyBookings !== undefined && service.quarterlyBookings !== null
          ? String(service.quarterlyBookings)
          : "",
    });
    setIsFormOpen(true);
    setFeedback(null);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormState(initialFormState);
    setActiveServiceId(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.name.trim()) {
      setFeedback("Nazwa usługi jest wymagana.");
      return;
    }

    const durationValue = sanitizeNumberInput(formState.durationMin, 60);
    if (durationValue <= 0) {
      setFeedback("Czas trwania musi być dodatnią liczbą.");
      return;
    }

    const payload = {
      name: formState.name.trim(),
      category: formState.category.trim() || null,
      durationMin: durationValue,
      price: sanitizeOptionalNumber(formState.price),
      bufferAfterMin: sanitizeOptionalNumber(formState.bufferAfterMin),
      noParallel: formState.noParallel,
      tone: formState.tone,
      description: formState.description.trim() || null,
      weeklyBookings: sanitizeOptionalNumber(formState.weeklyBookings) ?? 0,
      quarterlyBookings: sanitizeOptionalNumber(formState.quarterlyBookings) ?? 0,
    };

    startTransition(async () => {
      try {
        if (formMode === "create") {
          await createService(payload);
          setFeedback("Usługa została dodana.");
        } else if (activeServiceId) {
          await updateService(activeServiceId, payload);
          setFeedback("Dane usługi zostały zaktualizowane.");
        }
        closeForm();
      } catch (actionError) {
        console.error("Operacja na usłudze nie powiodła się", actionError);
        setFeedback("Nie udało się zapisać usługi. Spróbuj ponownie.");
      }
    });
  };

  const confirmDelete = (service: ServiceRecord) => {
    setActiveServiceId(service.id);
    setFormState((state) => ({
      ...state,
      name: service.name,
    }));
    setIsDeleteConfirmOpen(true);
    setFeedback(null);
  };

  const handleDelete = () => {
    if (!activeServiceId) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteService(activeServiceId);
        setFeedback("Usługa została usunięta.");
      } catch (deleteError) {
        console.error("Nie udało się usunąć usługi", deleteError);
        setFeedback("Nie udało się usunąć usługi. Spróbuj ponownie.");
      } finally {
        setIsDeleteConfirmOpen(false);
        setActiveServiceId(null);
      }
    });
  };

  return (
    <DashboardLayout
      active="services"
      header={{
        title: "Usługi",
        subtitle: "Zarządzaj katalogiem zabiegów i dostępnością",
      }}
    >
      <section className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, meta, tone, icon: Icon }) => (
          <article key={label} className="card stat-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
                <p className={`text-sm font-medium ${toneTextClass[tone]}`}>{meta}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full" style={getBubbleStyle(tone)}>
                <Icon className={`h-6 w-6 ${toneTextClass[tone]}`} />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-6">
        <div className="card border border-border p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Szukaj usługi..."
                className="w-full rounded-lg border border-border bg-card px-10 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <select
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring lg:px-4"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              <option value="all">Kategorie</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition-transform duration-200 ease-out hover:-translate-y-0.5 lg:px-4 ${
                showFilters || filterColor !== "all" || filterDuration !== "all" || filterParallel !== "all"
                  ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                  : "border-border text-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-1 h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">Filtry</span>
            </button>
            <button type="button" className="btn-primary px-3 lg:px-4" onClick={openCreateForm}>
              <Plus className="mr-1 h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">Dodaj usługę</span>
              <span className="lg:hidden">Dodaj</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="card border border-border p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Kolor
                </label>
                <select
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  value={filterColor}
                  onChange={(event) => setFilterColor(event.target.value)}
                >
                  <option value="all">Wszystkie kolory</option>
                  <option value="primary">Primary</option>
                  <option value="chart3">Chart 3</option>
                  <option value="chart4">Chart 4</option>
                  <option value="chart5">Chart 5</option>
                  <option value="accent">Accent</option>
                  <option value="destructive">Destructive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Czas trwania
                </label>
                <select
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  value={filterDuration}
                  onChange={(event) => setFilterDuration(event.target.value)}
                >
                  <option value="all">Dowolny czas</option>
                  <option value="short">Do 30 min</option>
                  <option value="medium">31-60 min</option>
                  <option value="long">Powyżej 61 min</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Wizyty równoległe
                </label>
                <select
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  value={filterParallel}
                  onChange={(event) => setFilterParallel(event.target.value)}
                >
                  <option value="all">Wszystkie</option>
                  <option value="parallel">Równoległe dozwolone</option>
                  <option value="exclusive">Tylko pojedyncze</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    setFilterColor("all");
                    setFilterDuration("all");
                    setFilterParallel("all");
                  }}
                >
                  Wyczyść
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-primary bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-primary/20"
                  onClick={() => setShowFilters(false)}
                >
                  Zastosuj
                </button>
              </div>
            </div>
          </div>
        )}

        {feedback ? (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            <Check className="h-4 w-4" />
            {feedback}
          </div>
        ) : null}

        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}

        <div className="bg-card border border-border rounded-lg shadow-sm">
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_96px] items-center gap-4 border-b border-border px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Nazwa usługi</span>
              <span>Kategoria</span>
              <span>Czas</span>
              <span>Cena</span>
              <span className="text-right">Akcje</span>
            </div>
            <div className="max-h-[480px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ładujemy usługi z Firestore...
                </div>
              ) : null}
              {!loading && filteredServices.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                  Brak usług spełniających kryteria wyszukiwania. Dodaj nowy zabieg, aby rozpocząć pracę.
                </div>
              ) : null}
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_96px] items-center gap-4 border-b border-border px-6 py-4 last:border-b-0 transition-all duration-200 ease-out hover:bg-muted/60 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-foreground">{service.name || "Bez nazwy"}</span>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium"
                        style={getBubbleStyle(service.tone)}
                      >
                        <span className={toneTextClass[service.tone]}>Kolor: {service.tone}</span>
                      </span>
                      {service.noParallel ? <span>Brak równoległych wizyt</span> : <span>Równoległe dozwolone</span>}
                      {service.bufferAfterMin ? <span>Bufor: {service.bufferAfterMin} min</span> : null}
                      {(service.weeklyBookings ?? 0) > 0 ? (
                        <span>{service.weeklyBookings} rezerwacji/tydz.</span>
                      ) : null}
                    </div>
                    {service.description ? (
                      <p className="text-xs text-muted-foreground">{service.description}</p>
                    ) : null}
                  </div>
                  <span className="text-sm font-medium text-foreground">{service.category || "–"}</span>
                  <span className="text-sm text-muted-foreground">{formatDuration(service.durationMin)}</span>
                  <span className="text-sm text-muted-foreground">{formatPrice(service.price)}</span>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors duration-200 ease-out hover:bg-accent hover:text-accent-foreground"
                      onClick={() => openEditForm(service)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md border border-destructive px-3 py-2 text-sm font-medium text-destructive transition-colors duration-200 ease-out hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => confirmDelete(service)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile & Tablet Card View */}
          <div className="lg:hidden">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Ładujemy usługi z Firestore...
              </div>
            ) : null}
            {!loading && filteredServices.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                Brak usług spełniających kryteria wyszukiwania. Dodaj nowy zabieg, aby rozpocząć pracę.
              </div>
            ) : null}
            <div className="px-4 py-3 space-y-4 max-h-[600px] overflow-y-auto">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-card border border-border rounded-lg p-4 shadow-sm transition-all duration-200 ease-out hover:bg-muted/60 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground mr-3">
                        <Scissors className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{service.name || "Bez nazwy"}</h3>
                        <span
                          className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold leading-none mt-1"
                          style={getBubbleStyle(service.tone)}
                        >
                          <span className={toneTextClass[service.tone]}>{service.tone}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md border border-border p-2 text-sm font-medium text-foreground transition-colors duration-200 ease-out hover:bg-accent hover:text-accent-foreground"
                        onClick={() => openEditForm(service)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md border border-destructive p-2 text-sm font-medium text-destructive transition-colors duration-200 ease-out hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => confirmDelete(service)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-muted-foreground mr-2">📁</span>
                        <span className="font-medium text-foreground">Kategoria:</span>
                      </div>
                      <span className="text-foreground">{service.category || "Brak kategorii"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-muted-foreground mr-2">⏱️</span>
                        <span className="font-medium text-foreground">Czas:</span>
                      </div>
                      <span className="text-foreground">{formatDuration(service.durationMin)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-muted-foreground mr-2">💰</span>
                        <span className="font-medium text-foreground">Cena:</span>
                      </div>
                      <span className="text-foreground">{formatPrice(service.price)}</span>
                    </div>
                    {service.bufferAfterMin ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-2">⏰</span>
                          <span className="font-medium text-foreground">Bufor:</span>
                        </div>
                        <span className="text-foreground">{service.bufferAfterMin} min</span>
                      </div>
                    ) : null}
                    {service.noParallel ? (
                      <div className="flex items-center">
                        <span className="text-muted-foreground mr-2">🚫</span>
                        <span className="text-foreground">Brak równoległych wizyt</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="text-muted-foreground mr-2">✅</span>
                        <span className="text-foreground">Równoległe dozwolone</span>
                      </div>
                    )}
                    {(service.weeklyBookings ?? 0) > 0 ? (
                      <div className="flex items-center">
                        <span className="text-muted-foreground mr-2">📊</span>
                        <span className="text-foreground">{service.weeklyBookings} rezerwacji/tydz.</span>
                      </div>
                    ) : null}
                    {service.description ? (
                      <div className="flex items-start">
                        <span className="text-muted-foreground mr-2">📝</span>
                        <span className="text-foreground">{service.description}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {isFormOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                {formMode === "create" ? "Dodaj usługę" : "Edytuj usługę"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-md px-2 py-1 text-sm text-muted-foreground transition hover:bg-muted"
              >
                Zamknij
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-foreground">Nazwa usługi *</span>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(event) => setFormState((state) => ({ ...state, name: event.target.value }))}
                    className="rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-foreground">Kategoria</span>
                  <input
                    type="text"
                    value={formState.category}
                    onChange={(event) => setFormState((state) => ({ ...state, category: event.target.value }))}
                    className="rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-foreground">Czas trwania (min) *</span>
                  <input
                    type="number"
                    min="1"
                    value={formState.durationMin}
                    onChange={(event) => setFormState((state) => ({ ...state, durationMin: event.target.value }))}
                    className="rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-foreground">Cena (PLN)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.price}
                    onChange={(event) => setFormState((state) => ({ ...state, price: event.target.value }))}
                    className="rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-foreground">Bufor po wizycie (min)</span>
                  <input
                    type="number"
                    min="0"
                    value={formState.bufferAfterMin}
                    onChange={(event) => setFormState((state) => ({ ...state, bufferAfterMin: event.target.value }))}
                    className="rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-foreground">Kolor w kalendarzu</span>
                  <select
                    value={formState.tone}
                    onChange={(event) => setFormState((state) => ({ ...state, tone: event.target.value as ToneKey }))}
                    className="rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  >
                    {toneOptions.map((tone) => (
                      <option key={tone} value={tone}>
                        {tone}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={formState.noParallel}
                    onChange={(event) => setFormState((state) => ({ ...state, noParallel: event.target.checked }))}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  Nie pozwalaj na równoległe wizyty
                </label>
              </div>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-foreground">Opis</span>
                <textarea
                  value={formState.description}
                  onChange={(event) => setFormState((state) => ({ ...state, description: event.target.value }))}
                  className="min-h-[120px] rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-foreground">Rezerwacje tygodniowe</span>
                  <input
                    type="number"
                    min="0"
                    value={formState.weeklyBookings}
                    onChange={(event) => setFormState((state) => ({ ...state, weeklyBookings: event.target.value }))}
                    className="rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-foreground">Rezerwacje (3 miesiące)</span>
                  <input
                    type="number"
                    min="0"
                    value={formState.quarterlyBookings}
                    onChange={(event) => setFormState((state) => ({ ...state, quarterlyBookings: event.target.value }))}
                    className="rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                  disabled={isPending}
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-70"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : formMode === "create" ? (
                    <Plus className="h-4 w-4" />
                  ) : (
                    <Pencil className="h-4 w-4" />
                  )}
                  {formMode === "create" ? "Dodaj usługę" : "Zapisz zmiany"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isDeleteConfirmOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl">
            <div className="flex items-center gap-3 border-b border-border px-6 py-4">
              <Trash2 className="h-5 w-5 text-destructive" />
              <h2 className="text-lg font-semibold text-foreground">Usuń usługę</h2>
            </div>
            <div className="space-y-4 px-6 py-6 text-sm text-muted-foreground">
              <p>
                Czy na pewno chcesz usunąć usługę <span className="font-semibold text-foreground">{formState.name}</span>? Tej operacji nie można cofnąć.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setActiveServiceId(null);
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                  disabled={isPending}
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground shadow transition hover:bg-destructive/90 disabled:opacity-70"
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Usuń usługę
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
