import { Provider } from "react-redux"
import { store } from "./store"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import Layout from "./components/Layout"
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
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/calendar" element={<Calendar />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </Router>
    </Provider>
  )
}

export default App