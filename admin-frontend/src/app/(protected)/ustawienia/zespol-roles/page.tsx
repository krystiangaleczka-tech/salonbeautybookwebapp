'use client';

import { BadgeCheck, LockKeyhole, Loader2, ShieldHalf, UserPlus, Users2, X, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { subscribeToEmployees, createEmployee, updateEmployee, deleteEmployee, type Employee } from "@/lib/employees-service";
import { initializeEmployees } from "@/lib/init-employees";

const roleTemplates = [
  {
    name: "Właściciel",
    permissions: ["Fakturowanie", "Ustawienia globalne", "Raporty finansowe"],
  },
  {
    name: "Manager",
    permissions: ["Grafiki", "Zespół", "Powiadomienia"],
  },
  {
    name: "Recepcja",
    permissions: ["Kalendarz", "Klienci", "Szybkie blokady"],
  },
];

export default function TeamAndRolesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    isActive: true,
    userRole: "employee" as 'owner' | 'employee' | 'tester',
    googleCalendarEmail: "",
  });
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToEmployees(
      (fetchedEmployees) => {
        setEmployees(fetchedEmployees);
        setLoading(false);
      },
      (error) => {
        console.error("Nie udało się pobrać listy pracowników", error);
        setError("Nie udało się pobrać listy pracowników");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleInitializeEmployees = async () => {
    setLoading(true);
    const success = await initializeEmployees();
    if (success) {
      setFeedback("Pracownicy zostali pomyślnie zainicjalizowani.");
    } else {
      setError("Nie udało się zainicjalizować pracowników.");
    }
    setLoading(false);
  };

  const handleOpenForm = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        email: employee.email,
        phone: employee.phone || "",
        isActive: employee.isActive,
        userRole: employee.userRole || 'employee',
        googleCalendarEmail: employee.googleCalendarEmail || "",
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        isActive: true,
        userRole: "employee",
        googleCalendarEmail: "",
      });
    }
    setIsFormOpen(true);
    setFeedback(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingEmployee(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      isActive: true,
      userRole: "employee",
      googleCalendarEmail: "",
    });
    setFeedback(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setError("Wszystkie pola oznaczone gwiazdką są wymagane.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        if (editingEmployee) {
          await updateEmployee(editingEmployee.id, formData);
          setFeedback("Pracownik został zaktualizowany.");
        } else {
          await createEmployee(formData);
          setFeedback("Pracownik został dodany.");
        }
        handleCloseForm();
      } catch (error) {
        console.error("Błąd podczas zapisywania pracownika:", error);
        setError("Nie udało się zapisać pracownika. Spróbuj ponownie.");
      }
    });
  };

  const confirmDelete = (employeeId: string) => {
    setDeletingEmployeeId(employeeId);
    setIsDeleteConfirmOpen(true);
  };

  const handleDelete = () => {
    if (!deletingEmployeeId) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteEmployee(deletingEmployeeId);
        setFeedback("Pracownik został usunięty.");
        setIsDeleteConfirmOpen(false);
        setDeletingEmployeeId(null);
      } catch (error) {
        console.error("Błąd podczas usuwania pracownika:", error);
        setError("Nie udało się usunąć pracownika. Spróbuj ponownie.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {feedback ? (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          <BadgeCheck className="h-4 w-4" />
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <X className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      <section className="card rounded-2xl border border-border bg-card p-6 shadow-sm">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Zespół i role</h2>
              <p className="text-sm text-muted-foreground">
                Dodawaj członków zespołu, przypisuj zakres odpowiedzialności oraz włączaj uwierzytelnianie wieloskładnikowe dla wrażliwych ról.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {employees.length === 0 && (
              <button
                className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground"
                onClick={handleInitializeEmployees}
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Zainicjuj pracowników
              </button>
            )}
            <button
              className="btn-primary"
              onClick={() => handleOpenForm()}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Dodaj pracownika
            </button>
          </div>
        </header>

        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Imię i nazwisko</th>
                <th className="px-4 py-3">Rola</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Ładujemy pracowników...
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="text-sm text-muted-foreground">
                      {`Brak pracowników. Kliknij "Zainicjuj pracowników", aby dodać przykładowych pracowników.`}
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium text-foreground">{employee.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{employee.userRole}</td>
                    <td className="px-4 py-3 text-muted-foreground">{employee.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{employee.phone || "–"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                        employee.isActive
                          ? "bg-primary/10 text-primary"
                          : "bg-muted/50 text-muted-foreground"
                      }`}>
                        <BadgeCheck className="h-3.5 w-3.5" />
                        {employee.isActive ? "Aktywny" : "Nieaktywny"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-border p-1.5 text-foreground transition-transform hover:-translate-y-0.5 hover:bg-accent"
                          onClick={() => handleOpenForm(employee)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-destructive p-1.5 text-destructive transition-transform hover:-translate-y-0.5 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => confirmDelete(employee.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card grid gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div>
          <h3 className="text-base font-semibold text-foreground">Szablony ról</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Szablony definiują zestaw uprawnień, które możesz przypisać osobom w zespole. W kolejnych iteracjach dodamy szczegółową matrycę praw dostępu.
          </p>
          <div className="mt-4 space-y-4">
            {roleTemplates.map(({ name, permissions }) => (
              <div key={name} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">{name}</h4>
                  <button className="text-xs font-semibold text-primary hover:underline">Edytuj</button>
                </div>
                <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                  {permissions.map((permission) => (
                    <li key={permission}>{permission}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5">
          <h4 className="text-sm font-semibold text-primary">Bezpieczeństwo kont</h4>
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>
              Właściciele i administratorzy będą mieli obowiązkowe logowanie z 2FA – w planie SMS lub aplikacja OTP.
            </li>
            <li>
              Role operacyjne (recepcja) mogą mieć ograniczony dostęp do eksportów i edycji danych finansowych.
            </li>
            <li>
              Wskaźnik wdrożenia pokaże ilu członków zespołu ma aktywne MFA.
            </li>
          </ul>
          <button className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <LockKeyhole className="h-4 w-4" />
            Zobacz politykę bezpieczeństwa
          </button>
        </div>
      </section>

      {/* Formularz dodawania/edycji pracownika */}
      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                {editingEmployee ? "Edytuj pracownika" : "Dodaj pracownika"}
              </h2>
              <button
                type="button"
                onClick={handleCloseForm}
                className="rounded-md p-1 text-muted-foreground transition hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Imię i nazwisko *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Rola *
                </label>
                <input
                  type="text"
                  value={formData.userRole}
                  onChange={(e) => setFormData(prev => ({ ...prev, userRole: e.target.value as 'owner' | 'employee' | 'tester' }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Rola systemowa *
                </label>
                <select
                  value={formData.userRole}
                  onChange={(e) => setFormData(prev => ({ ...prev, userRole: e.target.value as 'owner' | 'employee' | 'tester' }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="employee">Pracownik</option>
                  <option value="owner">Właściciel</option>
                  <option value="tester">Tester</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Google Calendar
                </label>
                <input
                  type="email"
                  value={formData.googleCalendarEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, googleCalendarEmail: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  placeholder="email@gmail.com"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="isActive" className="ml-2 text-sm font-medium text-foreground">
                  Aktywny
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
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
                  ) : (
                    editingEmployee ? <Pencil className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />
                  )}
                  {editingEmployee ? "Zapisz zmiany" : "Dodaj pracownika"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modal potwierdzenia usunięcia */}
      {isDeleteConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl">
            <div className="flex items-center gap-3 border-b border-border px-6 py-4">
              <Trash2 className="h-5 w-5 text-destructive" />
              <h2 className="text-lg font-semibold text-foreground">Usuń pracownika</h2>
            </div>
            <div className="space-y-4 px-6 py-6 text-sm text-muted-foreground">
              <p>
                Czy na pewno chcesz usunąć tego pracownika? Tej operacji nie można cofnąć.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setDeletingEmployeeId(null);
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
                  Usuń
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
