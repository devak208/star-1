import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Calendar, CreditCard, Download, FileText, Table } from 'lucide-react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [downloadFormat, setDownloadFormat] = useState('pdf');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.204.156:5000';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const config = {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.get(`${apiUrl}/api/orders/admin/all`, config);
      console.log('Admin Orders response:', response.data);
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const filteredOrders = selectedStatus === 'all'
    ? orders
    : orders.filter(order => order.status?.toLowerCase() === selectedStatus.toLowerCase());

  const handleDownload = () => {
    if (selectedOrders.length === 0) {
      alert('Please select at least one order to download');
      return;
    }

    if (downloadFormat === 'excel') {
      downloadExcel();
    } else {
      downloadPDF();
    }
  };

  const downloadExcel = () => {
    try {
      // Get the full order objects for selected orders
      const selectedOrderData = orders.filter(order => selectedOrders.includes(order.id));
      
      const worksheet = XLSX.utils.json_to_sheet(selectedOrderData.map(order => ({
        'Order ID': order.id || 'N/A',
        'Customer Name': order.user?.name || 'Anonymous',
        'Customer Email': order.user?.email || 'N/A',
        'Order Date': formatDate(order.createdAt),
        'Payment Method': order.paymentMethod || 'N/A',
        'Total Amount': order.total ? `₹${Number(order.total).toFixed(2)}` : '₹0.00',
        'Status': order.status || 'N/A',
        'Shipping Address': order.shippingAddress ? 
          `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}` : 
          'N/A'
      })));

      // Set column widths
      const colWidths = [
        { wch: 15 }, // Order ID
        { wch: 20 }, // Customer Name
        { wch: 30 }, // Customer Email
        { wch: 15 }, // Order Date
        { wch: 15 }, // Payment Method
        { wch: 15 }, // Total Amount
        { wch: 15 }, // Status
        { wch: 50 }  // Shipping Address
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
      XLSX.writeFile(workbook, `orders_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Error generating Excel file. Please try again.');
    }
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add company header
      doc.setFontSize(20);
      doc.text('Orders Report', 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), 'MMM d, yyyy HH:mm')}`, 14, 22);
      
      // Add filter information
      doc.setFontSize(12);
      doc.text(`Status Filter: ${selectedStatus === 'all' ? 'All Orders' : selectedStatus}`, 14, 30);
      doc.text(`Total Orders: ${selectedOrders.length}`, 14, 37);

      // Get the full order objects for selected orders
      const selectedOrderData = orders.filter(order => selectedOrders.includes(order.id));

      // Create table with safe data handling
      const tableData = selectedOrderData.map(order => [
        order.id ? order.id.substring(0, 8) + '...' : 'N/A',
        order.user?.name || 'Anonymous',
        formatDate(order.createdAt),
        order.paymentMethod || 'N/A',
        order.total ? `₹${Number(order.total).toFixed(2)}` : '₹0.00',
        order.status || 'N/A'
      ]);

      // Use the correct method for autoTable
      if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          startY: 45,
          head: [['Order ID', 'Customer', 'Date', 'Payment', 'Total', 'Status']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 40 },
            2: { cellWidth: 30 },
            3: { cellWidth: 30 },
            4: { cellWidth: 25 },
            5: { cellWidth: 25 }
          }
        });
      } else {
        // Fallback to basic table if autoTable is not available
        let y = 45;
        const lineHeight = 7;
        
        // Headers
        doc.setFontSize(10);
        doc.setFillColor(41, 128, 185);
        doc.setTextColor(255);
        doc.rect(14, y, 170, 10, 'F');
        doc.text('Order ID', 20, y + 7);
        doc.text('Customer', 60, y + 7);
        doc.text('Date', 100, y + 7);
        doc.text('Payment', 130, y + 7);
        doc.text('Total', 160, y + 7);
        
        // Data
        y += 15;
        doc.setTextColor(0);
        tableData.forEach(row => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(row[0], 20, y);
          doc.text(row[1], 60, y);
          doc.text(row[2], 100, y);
          doc.text(row[3], 130, y);
          doc.text(row[4], 160, y);
          y += lineHeight;
        });
      }

      doc.save(`orders_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF file. Please try again.');
    }
  };

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const selectAllOrders = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
            <p className="mt-2 text-sm text-gray-600">Manage and track all your orders in one place</p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-4"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Download Controls */}
        <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSelecting(!isSelecting)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  isSelecting 
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isSelecting ? 'Cancel Selection' : 'Select Orders'}
              </button>
              {isSelecting && (
                <button
                  onClick={selectAllOrders}
                  className="px-4 py-2 rounded-md font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {selectedOrders.length === filteredOrders.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
            {isSelecting && selectedOrders.length > 0 && (
              <div className="flex items-center space-x-4">
                <select
                  value={downloadFormat}
                  onChange={(e) => setDownloadFormat(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-4"
                >
                  <option value="pdf">PDF Format</option>
                  <option value="excel">Excel Format</option>
                </select>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-md font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download {selectedOrders.length} Orders
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            {orders.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {isSelecting && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Select
                      </th>
                    )}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      {isSelecting && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => toggleOrderSelection(order.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id ? order.id.substring(0, 8) + '...' : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.user?.name || 'Anonymous'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(order.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <CreditCard className="w-4 h-4 mr-1" />
                          {order.paymentMethod || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{order.total ? Number(order.total).toFixed(2) : '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status || 'N/A'}
                        </span>
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
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center text-gray-500">
                No orders found. Orders will appear here when customers make purchases.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders; 