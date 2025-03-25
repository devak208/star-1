export default function EmptyState({ title, description, icon, action }) {
    return (
      <div className="text-center py-12 bg-white border border-gray-100 rounded-lg">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">{icon}</div>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    )
  }
  
  