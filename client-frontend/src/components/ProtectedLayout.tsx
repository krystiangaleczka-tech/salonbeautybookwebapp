import React from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import Layout from "./Layout"
import { useAuth } from "@/contexts/AuthContext"

const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <span className="text-sm text-gray-500">Ładowanie...</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

export default ProtectedLayout
