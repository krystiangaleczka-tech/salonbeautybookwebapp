"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { AuthContext } from "./auth-context";
import { Employee, subscribeToEmployees, createEmployee } from "@/lib/employees-service";

interface EmployeeContextType {
    currentEmployee: Employee | null;
    allEmployees: Employee[];
    isLoading: boolean;
    error: Error | null;
    canViewAllEmployees: boolean;
    filteredEmployees: Employee[];
    setCurrentEmployee: (employee: Employee | null) => void;
    refreshEmployees: () => void;
    // Metody pomocnicze
    getEmployeeWorkingHours: (employee: Employee) => any[];
    getEmployeesWithGoogleCalendar: () => Employee[];
    getEmployeeGoogleCalendarId: (employee: Employee) => string | undefined;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

interface EmployeeProviderProps {
    children: ReactNode;
}

export function EmployeeProvider({ children }: EmployeeProviderProps) {
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Sprawdź czy użytkownik może widzieć wszystkich pracowników (używamy userRole)
    const canViewAllEmployees = currentEmployee?.userRole === 'owner' || 
                               currentEmployee?.userRole === 'tester';

    // Filtrowani pracownicy na podstawie uprawnień systemowych (userRole)
    const filteredEmployees = canViewAllEmployees
        ? allEmployees.filter(emp => emp.isActive !== false) // Wszyscy aktywni
        : currentEmployee
            ? [currentEmployee] // Tylko siebie
            : [];

    // Subskrypcja do pracowników
    useEffect(() => {
        if (!user) {
            setAllEmployees([]);
            setCurrentEmployee(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        const unsubscribe = subscribeToEmployees(
            (employees) => {
                console.log('📋 Załadowano pracowników:', employees.length);
                console.log('📋 Lista pracowników:', employees.map(e => ({
                    id: e.id,
                    name: e.name,
                    email: e.email,
                    userRole: e.userRole,
                    isActive: e.isActive
                })));
                
                setAllEmployees(employees);
                
                // Znajdź pracownika powiązanego z aktualnym użytkownikiem
                const userEmployee = employees.find(emp => emp.email === user.email);
                
                console.log('👤 Email użytkownika:', user.email);
                console.log('👤 Znaleziony pracownik:', userEmployee ? {
                    id: userEmployee.id,
                    name: userEmployee.name,
                    email: userEmployee.email,
                    userRole: userEmployee.userRole
                } : 'NIE ZNALEZIONO');
                
                // Jeśli nie znaleziono pracownika i użytkownik to admin@admin.com, utwórz go
                if (!userEmployee && user.email === 'admin@admin.com') {
                    console.log('🔧 Tworzę pracownika admin@admin.com...');
                    createEmployee({
                        name: 'Administrator',
                        email: 'admin@admin.com',
                        userRole: 'owner',
                        isActive: true,
                        phone: '',
                        googleCalendarId: '',
                        workingHours: [],
                        personalBuffers: {},
                        defaultBuffer: 0
                    }).then(() => {
                        console.log('✅ Utworzono pracownika admin@admin.com z rolą owner');
                        // Odśwież listę pracowników po utworzeniu
                        setTimeout(() => {
                            console.log('🔄 Odświeżam listę pracowników...');
                            refreshEmployees();
                        }, 1000);
                    }).catch((error) => {
                        console.error('❌ Błąd tworzenia pracownika admin:', error);
                    });
                }
                
                setCurrentEmployee(userEmployee || null);
                
                // Dodatkowe logi po zaktualizowaniu stanu
                const canViewAll = userEmployee?.userRole === 'owner' || userEmployee?.userRole === 'tester';
                const filtered = canViewAll
                    ? employees.filter(emp => emp.isActive !== false)
                    : userEmployee
                        ? [userEmployee]
                        : [];
                
                console.log('🔐 Uprawnienia użytkownika:', {
                    userRole: userEmployee?.userRole,
                    canViewAllEmployees: canViewAll,
                    filteredEmployeesCount: filtered.length,
                    filteredEmployees: filtered.map(e => ({ id: e.id, name: e.name, email: e.email }))
                });
                
                setIsLoading(false);
            },
            (err) => {
                console.error('❌ Błąd ładowania pracowników:', err);
                setError(err);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const refreshEmployees = useCallback(() => {
        if (user) {
            setIsLoading(true);
            const unsubscribe = subscribeToEmployees(
                (employees) => {
                    setAllEmployees(employees);
                    const userEmployee = employees.find(emp => emp.email === user.email);
                    setCurrentEmployee(userEmployee || null);
                    setIsLoading(false);
                },
                (err) => {
                    setError(err);
                    setIsLoading(false);
                }
            );
            return unsubscribe;
        }
    }, [user]);

    // Metody pomocnicze
    const getEmployeeWorkingHours = (employee: Employee) => {
        return employee.workingHours || [];
    };

    const getEmployeesWithGoogleCalendar = () => {
        return allEmployees.filter(emp => emp.googleCalendarId && emp.isActive);
    };

    const getEmployeeGoogleCalendarId = (employee: Employee) => {
        return employee.googleCalendarId;
    };

    const value: EmployeeContextType = {
        currentEmployee,
        allEmployees,
        isLoading,
        error,
        canViewAllEmployees,
        filteredEmployees,
        setCurrentEmployee,
        refreshEmployees,
        getEmployeeWorkingHours,
        getEmployeesWithGoogleCalendar,
        getEmployeeGoogleCalendarId,
    };

    return (
        <EmployeeContext.Provider value={value}>
            {children}
        </EmployeeContext.Provider>
    );
}

export function useEmployee() {
    const context = useContext(EmployeeContext);
    if (context === undefined) {
        throw new Error("useEmployee must be used within an EmployeeProvider");
    }
    return context;
}