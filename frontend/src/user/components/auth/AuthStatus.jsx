"use client"

import { Fragment } from "react"
import { Link } from "react-router-dom"
import { Menu, Transition } from "@headlessui/react"
import { useUser } from "../../context/UserContext"

export default function AuthStatus() {
  const { isAuthenticated, user, logout } = useUser()

  const handleLogout = () => {
    logout()
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center space-x-4">
        <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-gray-800">
          Sign in
        </Link>
        <Link
          to="/register"
          className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md"
        >
          Sign up
        </Link>
      </div>
    )
  }

  return (
    <Menu as="div" className="relative ml-3">
      <div>
        <Menu.Button className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-800">
          <span className="mr-2">{user.name}</span>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <Menu.Item>
            {({ active }) => (
              <Link to="/profile" className={`${active ? "bg-gray-100" : ""} block px-4 py-2 text-sm text-gray-700`}>
                Your Profile
              </Link>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <Link to="/orders" className={`${active ? "bg-gray-100" : ""} block px-4 py-2 text-sm text-gray-700`}>
                Your Orders
              </Link>
            )}
          </Menu.Item>
          {user.role === "admin" && (
            <Menu.Item>
              {({ active }) => (
                <Link to="/admin" className={`${active ? "bg-gray-100" : ""} block px-4 py-2 text-sm text-gray-700`}>
                  Admin Dashboard
                </Link>
              )}
            </Menu.Item>
          )}
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handleLogout}
                className={`${active ? "bg-gray-100" : ""} block w-full text-left px-4 py-2 text-sm text-gray-700`}
              >
                Sign out
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

