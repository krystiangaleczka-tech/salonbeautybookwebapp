"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Users, User, Check } from "lucide-react";
import { useEmployee } from "@/contexts/employee-context";

interface EmployeeSelectorProps {
    selectedEmployeeId?: string;
    onEmployeeChange: (employeeId: string) => void;
    disabled?: boolean;
    showAllOption?: boolean;
    placeholder?: string;
}

export function EmployeeSelector({
    selectedEmployeeId,
    onEmployeeChange,
    disabled = false,
    showAllOption = false,
    placeholder = "Wybierz pracownika"
}: EmployeeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { 
        filteredEmployees, 
        currentEmployee, 
        canViewAllEmployees,
        isLoading 
    } = useEmployee();

    // Przygotuj opcje selektora na podstawie uprawnień
    const options = useMemo(() => {
        const opts = [];
        
        // Dodaj opcję "Wszyscy pracownicy" tylko dla owner/tester
        if (showAllOption && canViewAllEmployees) {
            opts.push({
                id: "all",
                name: "Wszyscy pracownicy",
                role: "Wszyscy",
                email: "",
                isActive: true,
                userRole: "owner" as const
            });
        }
        
        // Dodaj przefiltrowanych pracowników
        filteredEmployees.forEach(emp => {
            opts.push(emp);
        });
        
        return opts;
    }, [filteredEmployees, canViewAllEmployees, showAllOption]);

    // Znajdź aktualnie wybraną opcję
    const selectedOption = useMemo(() => {
        return options.find(opt => opt.id === selectedEmployeeId) || null;
    }, [options, selectedEmployeeId]);

    // Obsługa wyboru pracownika
    const handleSelect = (employeeId: string) => {
        onEmployeeChange(employeeId);
        setIsOpen(false);
    };

    // Jeśli dane się ładują, pokaż loader
    if (isLoading) {
        return (
            <div className="relative">
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    <Users className="h-4 w-4 text-gray-400 animate-pulse" />
                    <span className="text-sm text-gray-500">Ładowanie...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`flex items-center gap-2 w-full px-3 py-2 border rounded-lg text-left transition-colors ${
                    disabled 
                        ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed" 
                        : "border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                }`}
            >
                {selectedOption ? (
                    <>
                        <div className="flex items-center gap-2">
                            {selectedOption.id === "all" ? (
                                <Users className="h-4 w-4 text-blue-600" />
                            ) : (
                                <User className="h-4 w-4 text-gray-600" />
                            )}
                            <span className="text-sm font-medium">
                                {selectedOption.name}
                            </span>
                            {selectedOption.id !== "all" && (
                                <span className="text-xs text-gray-500">
                                    ({selectedOption.role})
                                </span>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{placeholder}</span>
                    </>
                )}
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ml-auto ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && !disabled && (
                <>
                    {/* Overlay */}
                    <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Dropdown */}
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                        {options.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                                Brak dostępnych pracowników
                            </div>
                        ) : (
                            options.map((employee) => (
                                <button
                                    key={employee.id}
                                    type="button"
                                    onClick={() => handleSelect(employee.id)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                                        selectedOption?.id === employee.id ? "bg-blue-50 text-blue-700" : "text-gray-900"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 flex-1">
                                        {employee.id === "all" ? (
                                            <Users className="h-4 w-4 text-blue-600" />
                                        ) : (
                                            <User className="h-4 w-4 text-gray-600" />
                                        )}
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">
                                                {employee.name}
                                            </span>
                                            {employee.id !== "all" && (
                                                <span className="text-xs text-gray-500">
                                                    {employee.role}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {selectedOption?.id === employee.id && (
                                        <Check className="h-4 w-4 text-blue-600" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}