import React, { useState, useEffect } from "react";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { format, subDays, subMonths, subYears, isWithinInterval } from 'date-fns';

// Custom tooltip component for better visualization
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: ₹{entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Status distribution component
const StatusDistribution = ({ orders }) => {
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status]
  }));

  const COLORS = {
    'DELIVERED': '#4CAF50',
    'PROCESSING': '#2196F3',
    'SHIPPED': '#FF9800',
    'CANCELLED': '#F44336',
    'PENDING': '#9E9E9E'
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status Distribution</h3>
      <div className="h-[200px] mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [`${value} orders`, name]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {statusData.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[entry.name] }}></div>
              <span className="text-gray-700">{entry.name}</span>
            </div>
            <span className="text-gray-900 font-medium">{entry.value} orders</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Payment method distribution component
const PaymentMethodDistribution = ({ orders }) => {
  const paymentCounts = orders.reduce((acc, order) => {
    const method = order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod;
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});

  const paymentData = Object.entries(paymentCounts).map(([method, count]) => ({
    name: method,
    value: count
  }));

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={paymentData}
            margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={100}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => [`${value} orders`, 'Count']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
            />
            <Bar 
              dataKey="value" 
              fill="#8884d8"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="bg-white rounded-lg p-6 shadow-sm">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-64 bg-gray-200 rounded"></div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart controls skeleton */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="h-6 w-32 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
            <div className="h-10 w-40 bg-gray-200 rounded"></div>
          </div>
        </div>
        {/* Chart area skeleton */}
        <div className="h-[400px] bg-gray-100 rounded-lg"></div>
      </div>
    </div>

    {/* Distribution charts skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="h-[200px] bg-gray-100 rounded-lg mb-4"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="h-[200px] bg-gray-100 rounded-lg"></div>
      </div>
    </div>
  </div>
);

export default function RevenueOverview({ orders, isLoading = false }) {
  const [timeFilter, setTimeFilter] = useState('7days');
  const [revenueData, setRevenueData] = useState([]);
  const [viewType, setViewType] = useState('line');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  const calculateRevenueData = (orders, filter) => {
    let dataPoints = [];
    const now = new Date();

    // Generate data points
    switch (filter) {
      case '24hours':
        dataPoints = Array.from({ length: 24 }, (_, i) => {
          const date = new Date(now);
          date.setHours(now.getHours() - i);
          return format(date, 'HH:00');
        }).reverse();
        break;
      case '7days':
        dataPoints = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(now, i);
          return format(date, 'MMM dd');
        }).reverse();
        break;
      case '30days':
        dataPoints = Array.from({ length: 30 }, (_, i) => {
          const date = subDays(now, i);
          return format(date, 'MMM dd');
        }).reverse();
        break;
      case '12months':
        dataPoints = Array.from({ length: 12 }, (_, i) => {
          const date = subMonths(now, i);
          return format(date, 'MMM yyyy');
        }).reverse();
        break;
      case 'yearly':
        dataPoints = Array.from({ length: 5 }, (_, i) => {
          const date = subYears(now, i);
          return format(date, 'yyyy');
        }).reverse();
        break;
      default:
        dataPoints = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(now, i);
          return format(date, 'MMM dd');
        }).reverse();
    }

    const revenueByPeriod = dataPoints.map(point => {
      let periodRevenue = 0;
      let startDate, endDate;

      // Calculate date range for each point
      switch (filter) {
        case '24hours': {
          const hour = parseInt(point.split(':')[0]);
          startDate = new Date(now);
          startDate.setHours(hour, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(hour, 59, 59, 999);
          break;
        }
        case '7days':
        case '30days': {
          const [month, day] = point.split(' ');
          startDate = new Date(now.getFullYear(), new Date(Date.parse(month + " 1, 2000")).getMonth(), parseInt(day));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        }
        case '12months': {
          const [month, year] = point.split(' ');
          startDate = new Date(year, new Date(Date.parse(month + " 1, 2000")).getMonth(), 1);
          endDate = new Date(year, new Date(Date.parse(month + " 1, 2000")).getMonth() + 1, 0);
          break;
        }
        case 'yearly': {
          startDate = new Date(point, 0, 1);
          endDate = new Date(point, 11, 31);
          break;
        }
        default: {
          const [month, day] = point.split(' ');
          startDate = new Date(now.getFullYear(), new Date(Date.parse(month + " 1, 2000")).getMonth(), parseInt(day));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
        }
      }

      // Filter orders within the date range
      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return isWithinInterval(orderDate, { start: startDate, end: endDate });
      });

      periodRevenue = filteredOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

      return {
        date: point,
        revenue: periodRevenue,
        orders: filteredOrders.length
      };
    });

    return revenueByPeriod;
  };

  useEffect(() => {
    if (orders.length > 0) {
      const data = calculateRevenueData(orders, timeFilter);
      setRevenueData(data);
      
      // Calculate summary metrics
      const total = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      setTotalRevenue(total);
      setOrderCount(orders.length);
      setAverageOrderValue(total / orders.length);
    }
  }, [timeFilter, orders]);

  const getChartTitle = () => {
    switch(timeFilter) {
      case '24hours': return 'Revenue for the last 24 hours';
      case '7days': return 'Daily revenue for the last 7 days';
      case '30days': return 'Daily revenue for the last 30 days';
      case '12months': return 'Monthly revenue for the last 12 months';
      case 'yearly': return 'Yearly revenue for the last 5 years';
      default: return 'Revenue Overview';
    }
  };

  const renderChart = () => {
    switch(viewType) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                angle={timeFilter === '30days' ? 45 : 0}
                textAnchor={timeFilter === '30days' ? 'start' : 'middle'}
                height={timeFilter === '30days' ? 80 : 60}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                name="Revenue" 
                stroke="#8884d8" 
                fillOpacity={1}
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                angle={timeFilter === '30days' ? 45 : 0}
                textAnchor={timeFilter === '30days' ? 'start' : 'middle'}
                height={timeFilter === '30days' ? 80 : 60}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="revenue" 
                name="Revenue" 
                fill="#8884d8" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="orders" 
                name="Orders" 
                fill="#82ca9d" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
      default:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                angle={timeFilter === '30days' ? 45 : 0}
                textAnchor={timeFilter === '30days' ? 'start' : 'middle'}
                height={timeFilter === '30days' ? 80 : 60}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                name="Revenue" 
                stroke="#8884d8" 
                strokeWidth={3}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 8 }}
              />
              <Line 
                type="monotone" 
                dataKey="orders" 
                name="Orders" 
                stroke="#82ca9d" 
                strokeWidth={2}
                dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h1>
          <p className="text-gray-600">Track your business performance with real-time insights</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold text-indigo-600">₹</div>
              <div>
                <div className="text-sm text-gray-600">Total Revenue</div>
                <div className="text-xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold text-indigo-600">#</div>
              <div>
                <div className="text-sm text-gray-600">Total Orders</div>
                <div className="text-xl font-bold text-gray-900">{orderCount}</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold text-indigo-600">Avg</div>
              <div>
                <div className="text-sm text-gray-600">Average Order Value</div>
                <div className="text-xl font-bold text-gray-900">
                  ₹{averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Revenue Overview</h2>
              <p className="text-sm text-gray-600">{getChartTitle()}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex rounded-md shadow-sm">
                <button 
                  className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                    viewType === 'line' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border border-gray-300`}
                  onClick={() => setViewType('line')}
                >
                  Line
                </button>
                <button 
                  className={`px-4 py-2 text-sm font-medium ${
                    viewType === 'area' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border-t border-b border-gray-300`}
                  onClick={() => setViewType('area')}
                >
                  Area
                </button>
                <button 
                  className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                    viewType === 'bar' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border border-gray-300`}
                  onClick={() => setViewType('bar')}
                >
                  Bar
                </button>
              </div>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="24hours">Last 24 Hours</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="12months">Last 12 Months</option>
                <option value="yearly">Last 5 Years</option>
              </select>
            </div>
          </div>
          {renderChart()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="w-full">
          <StatusDistribution orders={orders} />
        </div>
        <div className="w-full">
          <PaymentMethodDistribution orders={orders} />
        </div>
      </div>
    </div>
  );
}
