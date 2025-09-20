import React from "react"
import { Calendar, Users, Clock, TrendingUp } from "lucide-react"

const Dashboard: React.FC = () => {
  const stats = [
    {
      name: "Dzisiejsze wizyty",
      value: "12",
      change: "+2",
      changeType: "positive" as const,
      icon: Calendar,
    },
    {
      name: "Aktywni klienci",
      value: "248",
      change: "+12",
      changeType: "positive" as const,
      icon: Users,
    },
    {
      name: "Średni czas wizyty",
      value: "45 min",
      change: "-5 min",
      changeType: "positive" as const,
      icon: Clock,
    },
    {
      name: "Obłożenie",
      value: "85%",
      change: "+5%",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Przegląd najważniejszych informacji o salonie
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="overflow-hidden rounded-lg bg-white shadow"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stat.value}
                        </div>
                        <div
                          className={`ml-2 flex items-baseline text-sm font-semibold ${
                            stat.changeType === "positive"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {stat.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Najbliższe wizyty
          </h3>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Klient {item}
                  </p>
                  <p className="text-sm text-gray-500">
                    Strzyżenie damskie
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {10 + item}:00
                  </p>
                  <p className="text-sm text-gray-500">
                    Anna Nowak
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Popularne usługi
          </h3>
          <div className="space-y-3">
            {[
              { name: "Strzyżenie damskie", count: 45 },
              { name: "Koloryzacja", count: 32 },
              { name: "Manicure", count: 28 },
              { name: "Pedicure", count: 21 },
            ].map((service, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <p className="text-sm font-medium text-gray-900">
                  {service.name}
                </p>
                <p className="text-sm text-gray-500">
                  {service.count} wizyt
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard