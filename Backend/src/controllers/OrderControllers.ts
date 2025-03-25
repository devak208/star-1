import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types/auth';

const prisma = new PrismaClient();

// Create a new order
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { shippingInfo, paymentMethod, orderNotes } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!shippingInfo || !paymentMethod) {
      return res.status(400).json({ message: 'Shipping information and payment method are required' });
    }

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate order total
    const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + shipping;

    // Check stock availability
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${item.product.name}. Available: ${item.product.stock}`,
        });
      }
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        total,
        paymentMethod,
        shippingAddress: shippingInfo,
        orderNotes: orderNotes || '',
        status: 'pending',
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
        items: {
          create: cart.items.map((item) => ({
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            image: item.product.image.length > 0 ? item.product.image[0] : null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Update product stock
    for (const item of cart.items) {
      await prisma.product.update({
        where: { id: item.product.id },
        data: {
          stock: item.product.stock - item.quantity,
        },
      });
    }

    // Clear cart after successful order
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    return res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order.id,
        total: order.total,
        status: order.status,
        paymentMethod: order.paymentMethod,
        shippingInfo,
        items: order.items,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ message: 'Failed to create order' });
  }
};

// Get all orders for the current user
export const getUserOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Format orders for response
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      date: order.createdAt,
      status: order.status,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      trackingNumber: order.trackingNumber,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
    }));

    return res.status(200).json(formattedOrders);
  } catch (error) {
    console.error('Error getting user orders:', error);
    return res.status(500).json({ message: 'Failed to get orders' });
  }
};

// Get order details by ID
export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user or user is admin
    if (order.userId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: order.userId },
      select: {
        name: true,
        email: true,
        phone: true,
      },
    });

    return res.status(200).json({
      id: order.id,
      date: order.createdAt,
      status: order.status,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      shippingAddress: order.shippingAddress,
      orderNotes: order.orderNotes,
      trackingNumber: order.trackingNumber,
      items: order.items,
      user: user,
    });
  } catch (error) {
    console.error('Error getting order details:', error);
    return res.status(500).json({ message: 'Failed to get order details' });
  }
};

// Cancel an order
export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user or user is admin
    if (order.userId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Check if order can be cancelled
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({ message: `Order cannot be cancelled because it is ${order.status}` });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'cancelled',
      },
    });

    // Restore product stock
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    return res.status(200).json({
      message: 'Order cancelled successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({ message: 'Failed to cancel order' });
  }
};

// Track order status
export const trackOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        trackingNumber: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user or user is admin
    if (order.userId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Generate tracking timeline based on status
    const timeline = [
      {
        status: 'pending',
        title: 'Order Placed',
        description: 'Your order has been received and is being processed.',
        date: order.createdAt,
        completed: true,
      },
      {
        status: 'processing',
        title: 'Processing',
        description: 'Your order is being prepared for shipping.',
        date: order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' 
          ? order.updatedAt 
          : null,
        completed: order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered',
      },
      {
        status: 'shipped',
        title: 'Shipped',
        description: 'Your order has been shipped and is on its way to you.',
        date: order.status === 'shipped' || order.status === 'delivered' ? order.updatedAt : null,
        completed: order.status === 'shipped' || order.status === 'delivered',
      },
      {
        status: 'delivered',
        title: 'Delivered',
        description: 'Your order has been delivered successfully.',
        date: order.status === 'delivered' ? order.updatedAt : null,
        completed: order.status === 'delivered',
      },
    ];

    // If order is cancelled, add cancelled status
    if (order.status === 'cancelled') {
      timeline.push({
        status: 'cancelled',
        title: 'Cancelled',
        description: 'Your order has been cancelled.',
        date: order.updatedAt,
        completed: true,
      });
    }

    return res.status(200).json({
      id: order.id,
      status: order.status,
      trackingNumber: order.trackingNumber,
      timeline,
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    return res.status(500).json({ message: 'Failed to track order' });
  }
};

// Admin: Update order status
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber } = req.body;

    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // If changing to cancelled and order is not already cancelled, restore stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        trackingNumber: trackingNumber || order.trackingNumber,
      },
    });

    return res.status(200).json({
      message: 'Order status updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ message: 'Failed to update order status' });
  }
};