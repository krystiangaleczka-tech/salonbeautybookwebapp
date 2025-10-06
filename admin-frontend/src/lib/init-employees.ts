import { createEmployee } from "@/lib/employees-service";

// Lista pracowników z pliku zespol-roles/page.tsx
const initialEmployees = [
  {
    name: "Maja Flak",
    role: "Właścicielka",
    email: "maja@salonmaja.pl",
    phone: "",
    isActive: true,
  },
  {
    name: "Ilona Flak",
    role: "Manager",
    email: "ilona@salonmaja.pl",
    phone: "",
    isActive: true,
  },
  {
    name: "Agnieszka Nowicka",
    role: "Stylistka",
    email: "agnieszka@salonmaja.pl",
    phone: "",
    isActive: true,
  },
];

// Funkcja do inicjalizacji pracowników w bazie danych
export async function initializeEmployees() {
  try {
    console.log("Inicjalizacja pracowników w bazie danych...");
    
    for (const employee of initialEmployees) {
      await createEmployee(employee);
      console.log(`Dodano pracownika: ${employee.name}`);
    }
    
    console.log("Zakończono inicjalizację pracowników.");
    return true;
  } catch (error) {
    console.error("Błąd podczas inicjalizacji pracowników:", error);
    return false;
  }
}