"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthContext } from "./auth-context";
import { Employee, subscribeToEmployees } from "@/lib/employees-service";

interface EmployeeContextType {
    currentEmployee: Employee | null;
    allEmployees: Employee[];
    isLoading: boolean;
    error: Error | null;
    canViewAllEmployees: boolean;
    filteredEmployees: Employee[];
    setCurrentEmployee: (employee: Employee | null) => void;
    refreshEmployees: () => void;
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

    // Sprawdź czy użytkownik może widzieć wszystkich pracowników
    const canViewAllEmployees = currentEmployee?.userRole === 'owner' || 
                               currentEmployee?.userRole === 'tester';

    // Filtrowani pracownicy na podstawie uprawnień
    const filteredEmployees = canViewAllEmployees 
        ? allEmployees 
        : currentEmployee 
            ? [currentEmployee] 
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
                setAllEmployees(employees);
                
                // Znajdź pracownika powiązanego z aktualnym użytkownikiem
                const userEmployee = employees.find(emp => emp.email === user.email);
                setCurrentEmployee(userEmployee || null);
                
                setIsLoading(false);
            },
            (err) => {
                setError(err);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const refreshEmployees = () => {
        // Subskrypcja automatycznie się odświeży, ale możemy wymusić reload
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