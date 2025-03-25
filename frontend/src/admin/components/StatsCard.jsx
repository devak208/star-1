export default function StatsCard({ title, value, icon, change, changeType }) {
    return (
      <div className="bg-white overflow-hidden shadow-sm rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">{icon}</div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">{value}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
        {change && (
          <div className={`bg-gray-50 px-5 py-3 ${changeType === "increase" ? "text-green-600" : "text-red-600"}`}>
            <div className="text-sm flex items-center">
              {changeType === "increase" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 mr-1"
                >
                  <path d="m18 15-6-6-6 6" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 mr-1"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              )}
              <span>{change} from last period</span>
            </div>
          </div>
        )}
      </div>
    )
  }
  
  