import { Hourglass, ListChecks, SlidersHorizontal, Clock, User, Loader2, Save } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { subscribeToEmployees, updateEmployeeBuffers, type Employee } from "@/lib/employees-service";
import { subscribeToServices, type ServiceRecord } from "@/lib/services-service";

const bufferRules = [
  {
    service: "Manicure hybrydowy",
    before: "10 min",
    after: "5 min",
    override: "Tak",
  },
  {
    service: "Zabieg nawilżający",
    before: "15 min",
    after: "10 min",
    override: "Nie",
  },
  {
    service: "Konsultacja premium",
    before: "20 min",
    after: "15 min",
    override: "Tak",
  },
];

export default function BuffersPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [employeeBuffers, setEmployeeBuffers] = useState<Record<string, number>>({});
  const [defaultBuffer, setDefaultBuffer] = useState<number>(0);

  useEffect(() => {
    // Pobierz listę pracowników
    const unsubscribeEmployees = subscribeToEmployees(
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

    // Pobierz listę usług
    const unsubscribeServices = subscribeToServices(
      (fetchedServices) => {
        setServices(fetchedServices);
      },
      (error) => {
        console.error("Nie udało się pobrać listy usług", error);
        setError("Nie udało się pobrać listy usług");
      }
    );

    return () => {
      unsubscribeEmployees();
      unsubscribeServices();
    };
  }, []);

  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setDefaultBuffer(employee.defaultBuffer);
      setEmployeeBuffers(employee.personalBuffers);
    }
  };

  const handleDefaultBufferChange = (value: number) => {
    setDefaultBuffer(value);
  };

  const handleServiceBufferChange = (serviceId: string, value: number) => {
    setEmployeeBuffers(prev => ({
      ...prev,
      [serviceId]: value
    }));
  };

  const saveEmployeeBuffers = () => {
    if (!selectedEmployee) {
      setError("Wybierz pracownika");
      return;
    }

    setError(null);
    setSuccess(null);
    
    startTransition(async () => {
      try {
        await updateEmployeeBuffers(selectedEmployee, {
          defaultBuffer,
          personalBuffers: employeeBuffers
        });
        setSuccess("Bufory czasowe zostały zaktualizowane.");
      } catch (error) {
        console.error("Błąd podczas aktualizacji buforów:", error);
        setError("Nie udało się zaktualizować buforów. Spróbuj ponownie.");
      }
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      {/* Sekcja globalnych buforów - istniejący kod */}
      <section className="card rounded-2xl border border-border bg-card p-6 shadow-sm">
        <header className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Hourglass className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Bufory czasowe</h2>
            <p className="text-sm text-muted-foreground">
              Ustal domyślne przerwy przed i po każdej usłudze, by uniknąć spiętrzeń w grafiku i przygotować stanowisko.
            </p>
          </div>
        </header>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background p-4">
            <h3 className="text-sm font-semibold text-foreground">Domyślne bufory salonu</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Zastosuj globalny bufor dla wszystkich usług. Może zostać nadpisany na poziomie pojedynczego zabiegu.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <label className="flex flex-col gap-2 font-medium text-foreground">
                Przed usługą
                <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring">
                  <option>5 min</option>
                  <option>10 min</option>
                  <option>15 min</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 font-medium text-foreground">
                Po usłudze
                <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring">
                  <option>5 min</option>
                  <option>10 min</option>
                  <option>15 min</option>
                </select>
              </label>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4">
            <h3 className="text-sm font-semibold text-foreground">Strategia</h3>
            <ul className="mt-2 list-inside list-disc space-y-2 text-sm text-muted-foreground">
              <li>Bufor przed wizytą daje czas na przygotowanie stanowiska i dezynfekcję.</li>
              <li>Bufor po wizycie jest potrzebny do płatności i porządkowania.</li>
              <li>Wyjątki per usługa: np. zabiegi SPA mogą mieć wydłużone przygotowanie.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Usługa</th>
                <th className="px-4 py-3">Bufor przed</th>
                <th className="px-4 py-3">Bufor po</th>
                <th className="px-4 py-3">Nadpisanie</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {bufferRules.map(({ service, before, after, override }) => (
                <tr key={service} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium text-foreground">{service}</td>
                  <td className="px-4 py-3 text-muted-foreground">{before}</td>
                  <td className="px-4 py-3 text-muted-foreground">{after}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{override}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-semibold text-primary hover:underline">Edytuj</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Nowa secja: Bufory czasowe per pracownik */}
      <section className="card rounded-2xl border border-border bg-card p-6 shadow-sm">
        <header className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Bufory czasowe pracowników</h2>
            <p className="text-sm text-muted-foreground">
              Każdy pracownik może mieć indywidualne ustawienia buforów czasowych dla usług.
            </p>
          </div>
        </header>

        {error ? (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            {success}
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Wybierz pracownika
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
              disabled={loading}
            >
              <option value="">Wybierz pracownika</option>
              {employees.filter(emp => emp.isActive).map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} ({employee.role})
                </option>
              ))}
            </select>
          </div>

          {selectedEmployee ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-background p-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Domyślny buffer czasowy
                </h3>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Buffer po usługach (minuty)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={defaultBuffer}
                    onChange={(e) => handleDefaultBufferChange(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ten buffer będzie stosowany dla wszystkich usług, które nie mają indywidualnego ustawienia.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <h3 className="text-sm font-semibold text-foreground">Bufory per usługa</h3>
                <p className="mt-1 text-xs text-muted-foreground mb-3">
                  Ustaw indywidualne bufory czasowe dla konkretnych usług.
                </p>
                <div className="space-y-3">
                  {services.map((service) => (
                    <div key={service.id} className="grid grid-cols-2 gap-3">
                      <div className="text-sm font-medium text-foreground">{service.name}</div>
                      <div>
                        <input
                          type="number"
                          min="0"
                          max="60"
                          value={employeeBuffers[service.id] || defaultBuffer}
                          onChange={(e) => handleServiceBufferChange(service.id, Number(e.target.value))}
                          className="w-full rounded-lg border border-border bg-background px-3 py-1 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                          placeholder={defaultBuffer.toString()}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={saveEmployeeBuffers}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-70"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Zapisz bufory
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/40 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Wybierz pracownika, aby zarządzać jego indywidualnymi ustawieniami buforów czasowych.
              </p>
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-6">
        <div className="card rounded-2xl border border-border bg-card p-6 shadow-sm">
          <header className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ListChecks className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Priorytety</h3>
              <p className="text-sm text-muted-foreground">
                Ustal kolejność stosowania buforów: globalny → pracownik → usługa.
              </p>
            </div>
          </header>
          <p className="mt-4 text-sm text-muted-foreground">
            Wersja PRD zakłada wizualizację na osi czasu oraz symulację wpływu na dostępne sloty w kalendarzu.
          </p>
        </div>
        <div className="card rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <p>
              Dodajemy też reguły inteligentne: automatyczne wydłużanie bufora po zabiegach łączonych lub w okresach największego obciążenia.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
