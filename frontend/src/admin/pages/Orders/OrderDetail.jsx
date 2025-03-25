import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Package, MapPin, Calendar, CreditCard, ArrowLeft, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.204.156:5000';

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const config = {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        };

        const response = await axios.get(`${apiUrl}/api/orders/admin/${id}`, config);
        setOrder(response.data);
      } catch (error) {
        console.error('Error fetching order details:', error);
        setError(error.response?.data?.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, apiUrl]);

  const handleStatusChange = async (newStatus) => {
    setSelectedStatus(newStatus);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    try {
      setUpdateLoading(true);
      setUpdateError(null);
      const config = {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      await axios.patch(`${apiUrl}/api/orders/admin/${id}/status`, { status: selectedStatus }, config);
      const updatedOrder = await axios.get(`${apiUrl}/api/orders/admin/${id}`, config);
      setOrder(updatedOrder.data);
      setUpdateSuccess(true);
      setTimeout(() => {
        setShowStatusModal(false);
        setUpdateSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error updating order status:', error);
      setUpdateError(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'border-yellow-500 bg-yellow-50';
      case 'processing':
        return 'border-blue-500 bg-blue-50';
      case 'shipped':
        return 'border-purple-500 bg-purple-50';
      case 'delivered':
        return 'border-green-500 bg-green-50';
      case 'cancelled':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  const getImageUrl = (imageArray) => {
    if (!imageArray || !Array.isArray(imageArray) || imageArray.length === 0) {
      return '/placeholder.svg';
    }
    return `${apiUrl}/uploads/${imageArray[0]}`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error || 'Order not found'}
          </div>
          <div className="mt-4">
            <Link
              to="/admin/orders"
              className="inline-flex items-center text-gray-900 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to="/admin/orders"
            className="inline-flex items-center text-gray-900 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Order {order.id}
                </h1>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(order.createdAt)}
                  </div>
                  <div className="flex items-center">
                    <CreditCard className="w-4 h-4 mr-1" />
                    {order.paymentMethod}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`px-4 py-2 rounded-lg border-2 ${getStatusBadgeColor(order.status)}`}>
                  <span className="text-sm font-semibold">
                    Current Status: {order.status}
                  </span>
                </div>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-4 bg-white"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Status Update Modal */}
            {showStatusModal && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 max-w-md w-full mx-4 shadow-xl border border-gray-100">
                  {!updateSuccess ? (
                    <>
                      <div className="flex items-center justify-center mb-6">
                        <div className="bg-yellow-50 p-3 rounded-full">
                          <AlertTriangle className="w-12 h-12 text-yellow-500" />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-center mb-3">
                        Confirm Status Update
                      </h3>
                      <p className="text-gray-600 text-center mb-6">
                        Are you sure you want to change the order status from{' '}
                        <span className={`font-medium px-2 py-1 rounded ${getStatusBadgeColor(order.status)}`}>
                          {order.status}
                        </span>{' '}
                        to{' '}
                        <span className={`font-medium px-2 py-1 rounded ${getStatusBadgeColor(selectedStatus)}`}>
                          {selectedStatus}
                        </span>?
                      </p>
                      {updateError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
                          <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                          <p className="text-sm">{updateError}</p>
                        </div>
                      )}
                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={() => setShowStatusModal(false)}
                          className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                          disabled={updateLoading}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={confirmStatusUpdate}
                          className="px-6 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[120px] font-medium"
                          disabled={updateLoading}
                        >
                          {updateLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                              Updating...
                            </>
                          ) : (
                            'Confirm Update'
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="flex items-center justify-center mb-6">
                        <div className="bg-green-50 p-3 rounded-full">
                          <CheckCircle className="w-12 h-12 text-green-500" />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-green-600 mb-2">
                        Status Updated Successfully
                      </h3>
                      <p className="text-gray-600">
                        The order status has been updated to{' '}
                        <span className={`font-medium px-2 py-1 rounded ${getStatusBadgeColor(selectedStatus)}`}>
                          {selectedStatus}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={getImageUrl(item.product?.image)}
                        alt={item.product?.name}
                        className="h-full w-full object-cover object-center"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/placeholder.svg";
                        }}
                      />
                    </div>
                    <div className="ml-6 flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-base font-medium text-gray-900">{item.product?.name}</h3>
                          <p className="mt-1 text-sm text-gray-500">Quantity: {item.quantity}</p>
                          <p className="mt-1 text-sm text-gray-500">Price per unit: ₹{item.price}</p>
                        </div>
                        <p className="text-base font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 mr-2"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Customer Details
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-24">Name:</span>
                      <span className="text-sm text-gray-900">{order.user?.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-24">Email:</span>
                      <span className="text-sm text-gray-900">{order.user?.email}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-24">User ID:</span>
                      <span className="text-sm text-gray-900 font-mono text-xs">{order.userId}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-24">Phone:</span>
                      <span className="text-sm text-gray-900">{order.address?.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Shipping Address
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{order.address?.fullName}</span>
                    <br />
                    {order.address?.address}
                    <br />
                    {order.address?.city && order.address?.state && (
                      <>
                        {order.address.city}, {order.address.state} {order.address?.zipCode}
                      </>
                    )}
                    {order.address?.country && (
                      <>
                        <br />
                        {order.address.country}
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">₹{(Number(order.total) - Number(order.shippingCost)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping Cost</span>
                      <span className="text-gray-900">₹{Number(order.shippingCost).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <div className="flex justify-between text-base font-medium">
                        <span className="text-gray-900">Total</span>
                        <span className="text-gray-900">₹{Number(order.total).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Order Notes</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">{order.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrderDetail; 