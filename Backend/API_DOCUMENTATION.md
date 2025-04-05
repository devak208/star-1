# Star E-Commerce API Documentation

This document provides comprehensive documentation for the Star E-Commerce API, focusing on the Order Management System. It includes details on endpoints, required permissions, request formats, and example responses for both regular users and administrators.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All routes require authentication using JWT tokens. The tokens are stored in HTTP-only cookies when you log in.

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Log in with email and password |
| POST | `/auth/register` | Register a new user |
| GET | `/auth/logout` | Log out and clear cookies |
| GET | `/auth/current-user` | Get current user information |

## Order Management

### User Endpoints

These endpoints are available to all authenticated users.

#### Create Order

**Endpoint:** `POST /orders`

**Description:** Create a new order with items from cart

**Request Body:**
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "price": 29.99
    },
    {
      "productId": 3,
      "quantity": 1,
      "price": 49.99
    }
  ],
  "paymentMethod": "CARD",
  "total": 109.97,
  "shippingCost": 5.00,
  "addressId": "address_uuid_here",
  "notes": "Please leave package at the front door"
}
```

**Response (201 Created):**
```json
{
  "id": "order_uuid_here",
  "userId": "user_uuid_here",
  "total": 109.97,
  "shippingCost": 5.00,
  "status": "PENDING",
  "paymentMethod": "CARD",
  "notes": "Please leave package at the front door",
  "addressId": "address_uuid_here",
  "createdAt": "2023-08-16T12:30:45.123Z",
  "updatedAt": "2023-08-16T12:30:45.123Z",
  "items": [
    {
      "id": "item_uuid_here",
      "productId": 1,
      "quantity": 2,
      "price": 29.99,
      "product": {
        "id": 1,
        "name": "Product 1",
        "description": "Product description",
        "price": 29.99,
        "image": ["image_url_1", "image_url_2"]
      }
    },
    {
      "id": "item_uuid_here_2",
      "productId": 3,
      "quantity": 1,
      "price": 49.99,
      "product": {
        "id": 3,
        "name": "Product 3",
        "description": "Product description",
        "price": 49.99,
        "image": ["image_url_1"]
      }
    }
  ],
  "address": {
    "fullName": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields or insufficient stock
- `401 Unauthorized`: User not authenticated

#### Get User Orders

**Endpoint:** `GET /orders`

**Description:** Get all orders for the current user

**Response (200 OK):**
```json
[
  {
    "id": "order_uuid_here",
    "userId": "user_uuid_here",
    "total": 109.97,
    "shippingCost": 5.00,
    "status": "PENDING",
    "paymentMethod": "CARD",
    "createdAt": "2023-08-16T12:30:45.123Z",
    "updatedAt": "2023-08-16T12:30:45.123Z",
    "items": [
      {
        "id": "item_uuid_here",
        "productId": 1,
        "quantity": 2,
        "price": 29.99,
        "product": {
          "id": 1,
          "name": "Product 1",
          "image": ["image_url_1"]
        }
      }
    ],
    "address": {
      "fullName": "John Doe",
      "phone": "+1234567890",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  }
]
```

**Error Responses:**
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Server error

#### Get Order Details

**Endpoint:** `GET /orders/:id`

**Description:** Get details for a specific order

**URL Parameters:**
- `id`: The UUID of the order

**Response (200 OK):**
```json
{
  "id": "order_uuid_here",
  "userId": "user_uuid_here",
  "total": 109.97,
  "shippingCost": 5.00,
  "status": "PENDING",
  "paymentMethod": "CARD",
  "notes": "Please leave package at the front door",
  "createdAt": "2023-08-16T12:30:45.123Z",
  "updatedAt": "2023-08-16T12:30:45.123Z",
  "items": [
    {
      "id": "item_uuid_here",
      "productId": 1,
      "quantity": 2,
      "price": 29.99,
      "product": {
        "id": 1,
        "name": "Product 1",
        "description": "Product description",
        "price": 29.99,
        "image": ["image_url_1"]
      }
    }
  ],
  "user": {
    "id": "user_uuid_here",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "address": {
    "fullName": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Order not found

#### Track Order

**Endpoint:** `GET /orders/:id/track`

**Description:** Get tracking information for a specific order

**URL Parameters:**
- `id`: The UUID of the order

**Response (200 OK):**
```json
{
  "id": "order_uuid_here",
  "status": "SHIPPED",
  "trackingNumber": "TRACK123456789",
  "timeline": [
    {
      "status": "PENDING",
      "title": "Order Placed",
      "description": "Your order has been received and is being processed.",
      "date": "2023-08-16T12:30:45.123Z",
      "completed": true
    },
    {
      "status": "PROCESSING",
      "title": "Processing",
      "description": "Your order is being prepared for shipping.",
      "date": "2023-08-16T14:20:30.123Z",
      "completed": true
    },
    {
      "status": "SHIPPED",
      "title": "Shipped",
      "description": "Your order has been shipped and is on its way to you.",
      "date": "2023-08-17T09:45:15.123Z",
      "completed": true
    },
    {
      "status": "DELIVERED",
      "title": "Delivered",
      "description": "Your order has been delivered successfully.",
      "date": null,
      "completed": false
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Order not found

#### Cancel Order

**Endpoint:** `PATCH /orders/:id/cancel`

**Description:** Cancel a pending order

**URL Parameters:**
- `id`: The UUID of the order

**Response (200 OK):**
```json
{
  "message": "Order cancelled successfully",
  "order": {
    "id": "order_uuid_here",
    "status": "CANCELLED",
    "updatedAt": "2023-08-16T15:45:30.123Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Order cannot be cancelled (already delivered or cancelled)
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: Order belongs to another user
- `404 Not Found`: Order not found

### Admin Endpoints

These endpoints are only available to users with the ADMIN role.

#### Get All Orders (Admin)

**Endpoint:** `GET /orders/admin/all`

**Description:** Get all orders in the system (admin only)

**Response (200 OK):**
```json
[
  {
    "id": "order_uuid_here",
    "userId": "user_uuid_here",
    "total": 109.97,
    "shippingCost": 5.00,
    "status": "PENDING",
    "paymentMethod": "CARD",
    "createdAt": "2023-08-16T12:30:45.123Z",
    "updatedAt": "2023-08-16T12:30:45.123Z",
    "items": [
      {
        "id": "item_uuid_here",
        "productId": 1,
        "quantity": 2,
        "price": 29.99,
        "product": {
          "id": 1,
          "name": "Product 1",
          "description": "Product description",
          "price": 29.99,
          "image": ["image_url_1"]
        }
      }
    ],
    "user": {
      "id": "user_uuid_here",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "address": {
      "fullName": "John Doe",
      "phone": "+1234567890",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  }
]
```

**Error Responses:**
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User is not an admin

#### Get Order Details (Admin)

**Endpoint:** `GET /orders/admin/:id`

**Description:** Get detailed information for a specific order (admin only)

**URL Parameters:**
- `id`: The UUID of the order

**Response (200 OK):**
```json
{
  "id": "order_uuid_here",
  "userId": "user_uuid_here",
  "total": 109.97,
  "shippingCost": 5.00,
  "status": "PENDING",
  "paymentMethod": "CARD",
  "notes": "Please leave package at the front door",
  "createdAt": "2023-08-16T12:30:45.123Z",
  "updatedAt": "2023-08-16T12:30:45.123Z",
  "items": [
    {
      "id": "item_uuid_here",
      "productId": 1,
      "quantity": 2,
      "price": 29.99,
      "product": {
        "id": 1,
        "name": "Product 1",
        "description": "Product description",
        "price": 29.99,
        "image": ["image_url_1"]
      }
    }
  ],
  "user": {
    "id": "user_uuid_here",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "address": {
    "fullName": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User is not an admin
- `404 Not Found`: Order not found

#### Update Order Status (Admin)

**Endpoint:** `PATCH /orders/admin/:id/status`

**Description:** Update the status of an order (admin only)

**URL Parameters:**
- `id`: The UUID of the order

**Request Body:**
```json
{
  "status": "SHIPPED"
}
```

**Valid Statuses:**
- `PENDING`
- `PROCESSING`
- `SHIPPED`
- `DELIVERED`
- `CANCELLED`

**Response (200 OK):**
```json
{
  "id": "order_uuid_here",
  "userId": "user_uuid_here",
  "status": "SHIPPED",
  "updatedAt": "2023-08-17T09:45:15.123Z",
  "items": [
    {
      "id": "item_uuid_here",
      "productId": 1,
      "quantity": 2,
      "price": 29.99,
      "product": {
        "id": 1,
        "name": "Product 1",
        "description": "Product description",
        "price": 29.99,
        "image": ["image_url_1"]
      }
    }
  ],
  "user": {
    "id": "user_uuid_here",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "address": {
    "fullName": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid status
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User is not an admin
- `404 Not Found`: Order not found

## Testing in Postman

### Setting Up Postman

1. Create a new collection named "Star E-Commerce API"
2. Configure environment variables:
   - `BASE_URL`: http://localhost:5000/api

### Authentication

1. First, create and send a login request:
   - Method: POST
   - URL: {{BASE_URL}}/auth/login
   - Body (raw JSON):
   ```json
   {
     "email": "your-email@example.com",
     "password": "your-password"
   }
   ```

2. The server will set the necessary cookies automatically.

### Regular User Testing

#### Create an Order

- Method: POST
- URL: {{BASE_URL}}/orders
- Body (raw JSON):
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "price": 29.99
    }
  ],
  "paymentMethod": "CARD",
  "total": 59.98,
  "shippingCost": 5.00,
  "addressId": "address_uuid_here",
  "notes": "Please leave package at the front door"
}
```

#### View User Orders

- Method: GET
- URL: {{BASE_URL}}/orders

#### View Order Details

- Method: GET
- URL: {{BASE_URL}}/orders/:id
- Replace `:id` with an actual order ID

#### Track Order

- Method: GET
- URL: {{BASE_URL}}/orders/:id/track
- Replace `:id` with an actual order ID

#### Cancel Order

- Method: PATCH
- URL: {{BASE_URL}}/orders/:id/cancel
- Replace `:id` with an actual order ID

### Admin Testing

To test admin endpoints, you need to be logged in as an admin user.

#### Get All Orders (Admin)

- Method: GET
- URL: {{BASE_URL}}/orders/admin/all

#### Get Order Details (Admin)

- Method: GET
- URL: {{BASE_URL}}/orders/admin/:id
- Replace `:id` with an actual order ID

#### Update Order Status (Admin)

- Method: PATCH
- URL: {{BASE_URL}}/orders/admin/:id/status
- Replace `:id` with an actual order ID
- Body (raw JSON):
```json
{
  "status": "SHIPPED"
}
```

## Data Models

### Order Status

The order can have the following statuses:

- `PENDING`: Order has been created but not yet processed
- `PROCESSING`: Order is being prepared for shipping
- `SHIPPED`: Order has been shipped and is on its way
- `DELIVERED`: Order has been delivered to the customer
- `CANCELLED`: Order has been cancelled

### Payment Methods

Available payment methods:

- `CARD`: Credit or debit card
- `PAYPAL`: PayPal
- `COD`: Cash on delivery

## Business Rules

1. Users can only view and manage their own orders
2. Admins can view and manage all orders
3. Orders can only be cancelled if they are not already delivered or cancelled
4. When an order is cancelled, the product stock is restored
5. When a new order is created, the stock is checked and then reduced accordingly
6. A transaction timeout of 10 seconds is set for order creation to avoid long locks
7. After creating an order, the user's cart is cleared automatically
8. Product cache is invalidated when stock changes due to orders 