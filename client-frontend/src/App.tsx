import { Provider } from "react-redux"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { store } from "./store"
import { AuthProvider } from "./contexts/AuthContext"
import ProtectedLayout from "./components/ProtectedLayout"
import Dashboard from "./pages/Dashboard"
import Login from "./pages/Login"
import Booking from "./pages/Booking"
import Customers from "./pages/Customers"
import Calendar from "./pages/Calendar"

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="*" element={<Dashboard />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </Provider>
  )
}

export default App
