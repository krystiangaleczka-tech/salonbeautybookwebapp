"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Filter, Calendar, User, Scissors, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, X } from "lucide-react";
import { format, isAfter, isBefore, isEqual, startOfMonth, endOfMonth } from "date-fns";
import { pl } from "date-fns/locale";

export interface AppointmentFilter {
    search: string;
    dateRange: {
        from: Date | undefined;
        to: Date | undefined;
    };
    employees: string[];
    services: string[];
    statuses: string[];
    customers: string[];
}

export interface FilterPreset {
    id: string;
    name: string;
    filters: AppointmentFilter;
}

const statusOptions = [
    { value: "confirmed", label: "Potwierdzone", icon: CheckCircle, color: "text-green-600" },
    { value: "pending", label: "Oczekujące", icon: Clock, color: "text-yellow-600" },
    { value: "cancelled", label: "Anulowane", icon: XCircle, color: "text-red-600" },
    { value: "completed", label: "Zakończone", icon: CheckCircle, color: "text-blue-600" },
    { value: "no-show", label: "Nieobecność", icon: AlertCircle, color: "text-orange-600" },
];

interface AppointmentFiltersProps {
    filters: AppointmentFilter;
    onFiltersChange: (filters: AppointmentFilter) => void;
    appointments: any[];
    employees: any[];
    services: any[];
    customers: any[];
    onBatchAction: (action: string, appointmentIds: string[]) => void;
    selectedAppointments: string[];
    onSelectionChange: (appointmentIds: string[]) => void;
    onSavePreset?: (name: string, filters: AppointmentFilter) => void;
    onLoadPreset?: (preset: FilterPreset) => void;
    presets?: FilterPreset[];
}

export function AppointmentFilters({
    filters,
    onFiltersChange,
    appointments,
    employees,
    services,
    customers,
    onBatchAction,
    selectedAppointments,
    onSelectionChange,
    onSavePreset,
    onLoadPreset,
    presets,
}: AppointmentFiltersProps) {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [showBatchActions, setShowBatchActions] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // Pobieranie unikalnych wartości dla filtrów
    const uniqueEmployees = useMemo(() => {
        // Pokaż wszystkich aktywnych pracowników, nie tylko tych z wizytami
        return employees.filter(emp => emp.isActive !== false);
    }, [employees]);

    const uniqueServices = useMemo(() => {
        const serviceIds = [...new Set(appointments.map(apt => apt.serviceId).filter(Boolean))];
        return services.filter(svc => serviceIds.includes(svc.id));
    }, [appointments, services]);

    const uniqueCustomers = useMemo(() => {
        const customerIds = [...new Set(appointments.map(apt => apt.customerId).filter(Boolean))];
        return customers.filter(cust => customerIds.includes(cust.id));
    }, [appointments, customers]);

    // Filtrowane wizyty
    const filteredAppointments = useMemo(() => {
        return appointments.filter(appointment => {
            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const customer = customers.find(c => c.id === appointment.customerId);
                const service = services.find(s => s.id === appointment.serviceId);
                const employee = employees.find(e => e.id === appointment.employeeId);
                
                const matchesSearch =
                    (customer && `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchLower)) ||
                    (service && service.name.toLowerCase().includes(searchLower)) ||
                    (employee && employee.name.toLowerCase().includes(searchLower)) ||
                    appointment.notes?.toLowerCase().includes(searchLower);
                
                if (!matchesSearch) return false;
            }

            // Date range filter
            if (filters.dateRange.from && isBefore(new Date(appointment.start), filters.dateRange.from)) {
                return false;
            }
            if (filters.dateRange.to && isAfter(new Date(appointment.start), filters.dateRange.to)) {
                return false;
            }

            // Employee filter
            if (filters.employees.length > 0 && !filters.employees.includes(appointment.employeeId)) {
                return false;
            }

            // Service filter
            if (filters.services.length > 0 && !filters.services.includes(appointment.serviceId)) {
                return false;
            }

            // Status filter
            if (filters.statuses.length > 0 && !filters.statuses.includes(appointment.status)) {
                return false;
            }

            // Customer filter
            if (filters.customers.length > 0 && !filters.customers.includes(appointment.customerId)) {
                return false;
            }

            return true;
        });
    }, [appointments, filters, customers, services, employees]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updateFilter = (key: keyof AppointmentFilter, value: any) => {
        onFiltersChange({
            ...filters,
            [key]: value,
        });
    };

    const removeSingleFilter = (key: keyof AppointmentFilter, valueToRemove: string) => {
        if (key === 'dateRange') {
            updateFilter(key, { from: undefined, to: undefined });
        } else if (key === 'search') {
            updateFilter(key, "");
        } else {
            const currentValue = filters[key] as string[];
            const newValue = currentValue.filter(item => item !== valueToRemove);
            updateFilter(key, newValue);
        }
    };

    const clearFilters = () => {
        onFiltersChange({
            search: "",
            dateRange: { from: undefined, to: undefined },
            employees: [],
            services: [],
            statuses: [],
            customers: [],
        });
    };



    const hasActiveFilters = useMemo(() => {
        return filters.search ||
               filters.dateRange.from ||
               filters.dateRange.to ||
               filters.employees.length > 0 ||
               filters.services.length > 0 ||
               filters.statuses.length > 0 ||
               filters.customers.length > 0;
    }, [filters]);

    return (
        <div className="space-y-4 appointment-filters">
            {/* Główny pasek wyszukiwania i akcji */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 items-center gap-2">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Szukaj wizyt..."
                                value={filters.search}
                                onChange={(e) => updateFilter("search", e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        
                        <div className="relative" ref={filterRef}>
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Filter className="h-4 w-4" />
                                Filtry
                                {hasActiveFilters && (
                                    <span className="ml-1 h-5 w-5 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center">
                                        {[
                                            filters.dateRange.from || filters.dateRange.to ? 1 : 0,
                                            filters.employees.length,
                                            filters.services.length,
                                            filters.statuses.length,
                                            filters.customers.length,
                                        ].reduce((a, b) => a + b, 0)}
                                    </span>
                                )}
                                <ChevronDown className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isFilterOpen && (
                                <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                    <div className="p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium text-gray-900">Filtry wizyt</h4>
                                            <div className="flex items-center gap-2">
                                                {hasActiveFilters && (
                                                    <button
                                                        onClick={clearFilters}
                                                        className="text-sm text-gray-500 hover:text-gray-700"
                                                    >
                                                        Wyczyść
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setIsFilterOpen(false)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <X className="h-8 w-8" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Zakres dat */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Zakres dat</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="date"
                                                    value={filters.dateRange.from ? format(filters.dateRange.from, "yyyy-MM-dd") : ""}
                                                    onChange={(e) => updateFilter("dateRange", { 
                                                        ...filters.dateRange, 
                                                        from: e.target.value ? new Date(e.target.value) : undefined 
                                                    })}
                                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <input
                                                    type="date"
                                                    value={filters.dateRange.to ? format(filters.dateRange.to, "yyyy-MM-dd") : ""}
                                                    onChange={(e) => updateFilter("dateRange", { 
                                                        ...filters.dateRange, 
                                                        to: e.target.value ? new Date(e.target.value) : undefined 
                                                    })}
                                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-200 pt-4">

                                            {/* Pracownicy */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Pracownicy</label>
                                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                                    {uniqueEmployees.map((employee) => (
                                                        <label key={employee.id} className="flex items-center space-x-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={filters.employees.includes(employee.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        updateFilter("employees", [...filters.employees, employee.id]);
                                                                    } else {
                                                                        updateFilter("employees", filters.employees.filter(id => id !== employee.id));
                                                                    }
                                                                }}
                                                                className="h-4 w-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                                                            />
                                                            <span className="text-sm text-gray-700">
                                                                {employee.name}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="border-t border-gray-200 pt-4 mt-4">

                                                {/* Usługi */}
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">Usługi</label>
                                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                                        {uniqueServices.map((service) => (
                                                            <label key={service.id} className="flex items-center space-x-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={filters.services.includes(service.id)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            updateFilter("services", [...filters.services, service.id]);
                                                                        } else {
                                                                            updateFilter("services", filters.services.filter(id => id !== service.id));
                                                                        }
                                                                    }}
                                                                    className="h-4 w-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                                                                />
                                                                <span className="text-sm text-gray-700">
                                                                    {service.name}
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="border-t border-gray-200 pt-4 mt-4">

                                                    {/* Statusy */}
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">Statusy</label>
                                                        <div className="space-y-2">
                                                            {statusOptions.map((status) => {
                                                                const Icon = status.icon;
                                                                return (
                                                                    <label key={status.value} className="flex items-center space-x-2 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={filters.statuses.includes(status.value)}
                                                                            onChange={(e) => {
                                                                                if (e.target.checked) {
                                                                                    updateFilter("statuses", [...filters.statuses, status.value]);
                                                                                } else {
                                                                                    updateFilter("statuses", filters.statuses.filter(s => s !== status.value));
                                                                                }
                                                                            }}
                                                                            className="h-4 w-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                                                                        />
                                                                        <div className="flex items-center gap-2">
                                                                            <Icon className={`h-4 w-4 ${status.color}`} />
                                                                            <span className="text-sm text-gray-700">
                                                                                {status.label}
                                                                            </span>
                                                                        </div>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
                            {filteredAppointments.length} / {appointments.length} wizyt
                        </span>
                        
                        {selectedAppointments.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                                    {selectedAppointments.length} wybranych
                                </span>
                                <button
                                    onClick={() => setShowBatchActions(!showBatchActions)}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Akcje masowe
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Batch actions */}
                {showBatchActions && selectedAppointments.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Akcje masowe:</span>
                            <button
                                onClick={() => onBatchAction("confirm", selectedAppointments)}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                            >
                                Potwierdź
                            </button>
                            <button
                                onClick={() => onBatchAction("cancel", selectedAppointments)}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={() => onBatchAction("complete", selectedAppointments)}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                            >
                                Zakończ
                            </button>
                            <button
                                onClick={() => onBatchAction("delete", selectedAppointments)}
                                className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50"
                            >
                                Usuń
                            </button>
                            <button
                                onClick={() => {
                                    onSelectionChange([]);
                                    setShowBatchActions(false);
                                }}
                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                            >
                                Wyczyść wybór
                            </button>
                        </div>
                    </div>
                )}

                {/* Active filters display */}
                {hasActiveFilters && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {filters.dateRange.from && (
                            <button
                                onClick={() => removeSingleFilter('dateRange', 'from')}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                <Calendar className="h-3 w-3" />
                                Od: {format(filters.dateRange.from, "dd.MM.yyyy")}
                                <X className="h-3 w-3 ml-1" />
                            </button>
                        )}
                        {filters.dateRange.to && (
                            <button
                                onClick={() => removeSingleFilter('dateRange', 'to')}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                <Calendar className="h-3 w-3" />
                                Do: {format(filters.dateRange.to, "dd.MM.yyyy")}
                                <X className="h-3 w-3 ml-1" />
                            </button>
                        )}
                        {filters.employees.map(empId => {
                            const emp = employees.find(e => e.id === empId);
                            return emp ? (
                                <button
                                    key={empId}
                                    onClick={() => removeSingleFilter('employees', empId)}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer"
                                >
                                    <User className="h-3 w-3" />
                                    {emp.name}
                                    <X className="h-3 w-3 ml-1" />
                                </button>
                            ) : null;
                        })}
                        {filters.services.map(serviceId => {
                            const service = services.find(s => s.id === serviceId);
                            return service ? (
                                <button
                                    key={serviceId}
                                    onClick={() => removeSingleFilter('services', serviceId)}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer"
                                >
                                    <Scissors className="h-3 w-3" />
                                    {service.name}
                                    <X className="h-3 w-3 ml-1" />
                                </button>
                            ) : null;
                        })}
                        {filters.statuses.map(status => {
                            const statusOption = statusOptions.find(s => s.value === status);
                            const Icon = statusOption?.icon;
                            return statusOption ? (
                                <button
                                    key={status}
                                    onClick={() => removeSingleFilter('statuses', status)}
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 ${statusOption.color} hover:bg-gray-200 transition-colors cursor-pointer`}
                                >
                                    <Icon className="h-3 w-3" />
                                    {statusOption.label}
                                    <X className="h-3 w-3 ml-1" />
                                </button>
                            ) : null;
                        })}
                    </div>
                )}
            </div>

        </div>
    );
}