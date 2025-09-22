import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { useDispatch } from "react-redux"
import { auth } from "@/lib/firebase"
import { setUser } from "@/store/authSlice"
import { AuthContext, type AuthContextValue } from "./auth-context"

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUserState] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUserState(authUser)
      dispatch(setUser(authUser))
      setLoading(false)
    })

    return unsubscribe
  }, [dispatch])

  const value: AuthContextValue = {
    user,
    loading,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
