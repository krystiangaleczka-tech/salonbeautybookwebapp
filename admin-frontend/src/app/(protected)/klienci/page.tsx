'use client';

import { useEffect, useMemo, useState, useTransition } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  deleteCustomer,
  subscribeToCustomers,
  createCustomer,
  updateCustomer,
  type Customer,
} from "@/lib/customers-service";
import {
  AlertCircle,
  Check,
  Filter,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";

interface CustomerFormState {
  fullName: string;
  phone: string;
  email: string;
  notes: string;
  lastVisit: string;
  blacklisted: boolean;
}

type FormMode = "create" | "edit";

const tableHeaders = [
  "",
  "Imię i nazwisko",
  "Telefon",
  "Email",
  "Ostatnia wizyta",
  "Notatki",
  "Czarna lista",
  "",
];

const initialFormState: CustomerFormState = {
  fullName: "",
  phone: "",
  email: "",
  notes: "",
  lastVisit: "",
  blacklisted: false,
};

function toDateInputValue(timestamp?: Customer["lastVisit"]): string {
  if (!timestamp) {
    return "";
  }
  const date = timestamp.toDate();
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
}

function formatTimestamp(timestamp?: Customer["lastVisit"]) {
  if (!timestamp) {
    return "–";
  }
  const date = timestamp.toDate();
  return date.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function ClientsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formState, setFormState] = useState<CustomerFormState>(initialFormState);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const unsubscribe = subscribeToCustomers(
      (nextCustomers) => {
        setCustomers(nextCustomers);
        setLoading(false);
        setError(null);
      },
      (subscribeError) => {
        console.error("Nie udało się pobrać listy klientów", subscribeError);
        setError("Nie udało się pobrać listy klientów. Odśwież stronę lub spróbuj ponownie później.");
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) {
      return customers;
    }
    const query = searchTerm.trim().toLowerCase();
    return customers.filter((customer) => {
      const values = [customer.fullName, customer.phone, customer.email, customer.notes];
      return values.some((value) => value?.toLowerCase().includes(query));
    });
  }, [customers, searchTerm]);

  const openCreateForm = () => {
    setFormMode("create");
    setFormState(initialFormState);
    setActiveCustomerId(null);
    setIsFormOpen(true);
    setFeedback(null);
  };

  const openEditForm = (customer: Customer) => {
    setFormMode("edit");
    setActiveCustomerId(customer.id);
    setFormState({
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email ?? "",
      notes: customer.notes ?? "",
      lastVisit: toDateInputValue(customer.lastVisit),
      blacklisted: Boolean(customer.blacklisted),
    });
    setIsFormOpen(true);
    setFeedback(null);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormState(initialFormState);
    setActiveCustomerId(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.fullName.trim() || !formState.phone.trim()) {
      setFeedback("Imię i nazwisko oraz numer telefonu są wymagane.");
      return;
    }

    const payload = {
      fullName: formState.fullName.trim(),
      phone: formState.phone.trim(),
      email: formState.email.trim() || undefined,
      notes: formState.notes.trim() || undefined,
      blacklisted: formState.blacklisted,
      lastVisit: formState.lastVisit ? new Date(formState.lastVisit) : null,
    };

    startTransition(async () => {
      try {
        if (formMode === "create") {
          await createCustomer(payload);
          setFeedback("Klient został dodany.");
        } else if (activeCustomerId) {
          await updateCustomer(activeCustomerId, payload);
          setFeedback("Dane klienta zostały zaktualizowane.");
        }
        closeForm();
      } catch (actionError) {
        console.error("Operacja na kliencie nie powiodła się", actionError);
        setFeedback("Nie udało się zapisać klienta. Spróbuj ponownie.");
      }
    });
  };

  const confirmDelete = (customer: Customer) => {
    setActiveCustomerId(customer.id);
    setFormState({
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email ?? "",
      notes: customer.notes ?? "",
      lastVisit: toDateInputValue(customer.lastVisit),
      blacklisted: Boolean(customer.blacklisted),
    });
    setIsDeleteConfirmOpen(true);
    setFeedback(null);
  };

  const handleDelete = () => {
    if (!activeCustomerId) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteCustomer(activeCustomerId);
        setFeedback("Klient został usunięty.");
      } catch (deleteError) {
        console.error("Nie udało się usunąć klienta", deleteError);
        setFeedback("Nie udało się usunąć klienta. Spróbuj ponownie.");
      } finally {
        setIsDeleteConfirmOpen(false);
        setActiveCustomerId(null);
      }
    });
  };

  return (
    <DashboardLayout
      active="clients"
      header={{
        title: "Klienci",
        subtitle: "Zarządzaj bazą kontaktów i działaniami follow-up",
      }}
    >
      <section className="space-y-6">
        <div className="card border border-border p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Szukaj klienta po imieniu, nazwisku, numerze telefonu lub emailu..."
                className="w-full rounded-lg border border-border bg-card px-10 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground"
              disabled
              title="Zaawansowane filtry w przygotowaniu"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtry
            </button>
            <button type="button" className="btn-primary" onClick={openCreateForm}>
              <UserPlus className="mr-2 h-4 w-4" />
              Dodaj klienta
            </button>
          </div>
        </div>

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

        <div className="card border border-border">
          <div className="grid grid-cols-[48px_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto_64px] items-center gap-4 border-b border-border px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tableHeaders.map((header, index) => (
              <span key={`${header}-${index}`}>{header}</span>
            ))}
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Ładujemy klientów z Firestore...
              </div>
            ) : null}
            {!loading && filteredCustomers.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                Brak klientów spełniających kryteria wyszukiwania. Dodaj nowy kontakt, aby rozpocząć pracę.
              </div>
            ) : null}
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="grid grid-cols-[48px_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto_64px] items-center gap-4 border-b border-border px-6 py-4 last:border-b-0 transition-colors hover:bg-muted/60"
              >
                <span className="text-xs text-muted-foreground">{customer.fullName ? customer.fullName[0]?.toUpperCase() : "?"}</span>
                <span className="font-medium text-foreground">{customer.fullName || "Bez nazwy"}</span>
                <span className="text-sm font-medium text-foreground">{customer.phone || "–"}</span>
                <span className="text-sm text-muted-foreground">{customer.email || "–"}</span>
                <span className="text-sm text-muted-foreground">{formatTimestamp(customer.lastVisit)}</span>
                <span className="text-sm text-muted-foreground">{customer.notes || "–"}</span>
                <span
                  className={`justify-self-start inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold leading-none min-w-[2.5rem] mr-8 ${
                    customer.blacklisted
                      ? "bg-destructive/10 text-destructive"
                      : "bg-emerald-500/10 text-emerald-600"
                  }`}
                >
                  {customer.blacklisted ? "Tak" : "Nie"}
                </span>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground"
                    onClick={() => openEditForm(customer)}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-destructive px-3 py-2 text-sm font-medium text-destructive transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => confirmDelete(customer)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {isFormOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                {formMode === "create" ? "Dodaj klienta" : "Edytuj klienta"}
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
                  <span className="font-medium text-foreground">Imię i nazwisko *</span>
                  <input
                    type="text"
                    value={formState.fullName}
                    onChange={(event) => setFormState((state) => ({ ...state, fullName: event.target.value }))}
                    className="rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-foreground">Telefon *</span>
                  <input
                    type="tel"
                    value={formState.phone}
                    onChange={(event) => setFormState((state) => ({ ...state, phone: event.target.value }))}
                    className="rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                    required
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-foreground">Email</span>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(event) => setFormState((state) => ({ ...state, email: event.target.value }))}
                    className="rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-foreground">Ostatnia wizyta</span>
                  <input
                    type="date"
                    value={formState.lastVisit}
                    onChange={(event) => setFormState((state) => ({ ...state, lastVisit: event.target.value }))}
                    className="rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-3 text-sm shadow-sm">
                  <input
                    type="checkbox"
                    checked={formState.blacklisted}
                    onChange={(event) =>
                      setFormState((state) => ({ ...state, blacklisted: event.target.checked }))
                    }
                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="flex flex-col gap-1">
                    <span className="font-medium text-foreground">Czarna lista</span>
                    <span className="text-xs text-muted-foreground">
                      Zablokuj klienta przed rezerwacją nowych wizyt.
                    </span>
                  </span>
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-foreground">Notatki</span>
                <textarea
                  value={formState.notes}
                  onChange={(event) => setFormState((state) => ({ ...state, notes: event.target.value }))}
                  className="min-h-[120px] rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                />
              </label>
              {feedback && isPending ? (
                <div className="text-sm text-muted-foreground">{feedback}</div>
              ) : null}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
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
                  {formMode === "create" ? "Dodaj klienta" : "Zapisz zmiany"}
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
              <h2 className="text-lg font-semibold text-foreground">Usuń klienta</h2>
            </div>
            <div className="space-y-4 px-6 py-6 text-sm text-muted-foreground">
              <p>
                Czy na pewno chcesz usunąć klienta <span className="font-semibold text-foreground">{formState.fullName}</span>? Tej operacji nie można cofnąć.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setActiveCustomerId(null);
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
                  Usuń klienta
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
