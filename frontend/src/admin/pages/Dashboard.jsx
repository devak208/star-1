"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import PageHeader from "../components/PageHeader";
import StatsCard from "../components/StatsCard";
import RevenueOverview from "../components/RevenueOverview";
import { FaIndianRupeeSign } from "react-icons/fa6";
import axios from "axios";

// Loading skeleton components
const StatCardSkeleton = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-3">
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
        <div className="h-8 w-32 bg-gray-200 rounded"></div>
      </div>
      <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
    </div>
  </div>
);

const TableRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 w-24 bg-gray-200 rounded"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 w-32 bg-gray-200 rounded"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 w-20 bg-gray-200 rounded"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 w-24 bg-gray-200 rounded"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 w-28 bg-gray-200 rounded"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-8 w-24 bg-gray-200 rounded"></div>
    </td>
  </tr>
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.147.217:5000';

        const config = {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        };

        // Fetch all data in parallel
        const [productsRes, categoriesRes, ordersRes] = await Promise.all([
          axios.get(`${apiUrl}/api/products`, config),
          axios.get(`${apiUrl}/api/categories`, config),
          axios.get(`${apiUrl}/api/orders/admin/all`, config)
        ]);

        const products = productsRes.data || [];
        const categories = categoriesRes.data || [];
        const fetchedOrders = ordersRes.data || [];

        // Calculate total revenue
        const totalRevenue = fetchedOrders.reduce(
          (sum, order) => sum + Number(order.total || 0),
          0
        );

        setStats({
          totalProducts: products.length,
          totalCategories: categories.length,
          totalOrders: fetchedOrders.length,
          totalRevenue: totalRevenue,
        });

        // Format recent orders
        const recentOrdersFormatted = fetchedOrders.slice(0, 5).map(order => ({
          id: order.id,
          customer: order.user?.name || 'Anonymous',
          total: Number(order.total || 0),
          status: order.status || 'PENDING',
          date: new Date(order.createdAt).toLocaleDateString(),
          items: order.items?.length || 0
        }));

        setOrders(fetchedOrders);
        setRecentOrders(recentOrdersFormatted);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        if (error.response?.status === 403) {
          window.location.href = '/login';
        }
        setRecentOrders([]);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
        description="Overview of your store's performance"
      />

      {/* Stats Cards */}
{/*       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </>
        ) : (
          <>
            <StatsCard
              title="Total Products"
              value={stats.totalProducts}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6 text-gray-700"
                >
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              }
              change={stats.totalProducts > 0 ? "+" : "0%"}
              changeType="increase"
            />
            <StatsCard
              title="Total Categories"
              value={stats.totalCategories}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6 text-gray-700"
                >
                  <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                  <path d="M7 7h.01" />
                </svg>
              }
              change={stats.totalCategories > 0 ? "+" : "0%"}
              changeType="increase"
            />
            <StatsCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6 text-gray-700"
                >
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
              }
              change={stats.totalOrders > 0 ? "+" : "0%"}
              changeType="increase"
            />
           
            <StatsCard
              title="Total Revenue"
              value={`₹${stats.totalRevenue.toFixed(2)}`}
              icon={<FaIndianRupeeSign className="w-6 h-6 text-gray-700" />}
              change={stats.totalRevenue > 0 ? "+" : "0%"}
              changeType="increase"
            />
          </>
        )}
      </div> */}

      <div className="grid grid-cols-1 gap-6">
        {/* Revenue Overview */}
        <div className="col-span-1">
          <RevenueOverview orders={orders} isLoading={isLoading} />
        </div>

        {/* Recent Orders */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <TableRowSkeleton key={i} />
                    ))}
                  </>
                ) : recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.customer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.status === "DELIVERED"
                              ? "bg-green-100 text-green-800"
                              : order.status === "PROCESSING"
                              ? "bg-yellow-100 text-yellow-800"
                              : order.status === "SHIPPED"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "CANCELLED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md font-medium inline-flex items-center transition-colors"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No orders found. Orders will appear here when customers make purchases.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
            <Link
              to="/admin/orders"
              className="text-sm font-medium text-gray-900 hover:text-gray-700"
            >
              View all orders
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
