import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/AuthMiddleware/authMiddleware';
import redis from "../config/redis";

// Admin: Get all orders
export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized - Admin access required' });
    }

    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        address: {
          select: {
            fullName: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            country: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json(orders);
  } catch (error) {
    console.error('Get all orders error:', error);
    return res.status(500).json({ error: 'Failed to get all orders' });
  }
};

// Admin: Get order by ID
export const getAdminOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized - Admin access required' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        address: {
          select: {
            fullName: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            country: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({ error: 'Failed to get order' });
  }
};

// Admin: Update order status
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized - Admin access required' });
    }

    // Validate status
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
        error: 'Invalid status',
        validStatuses
      });
    }

    // Use transaction to handle order status update and stock restoration if needed
    try {
      const order = await prisma.$transaction(async (tx) => {
        const currentOrder = await tx.order.findUnique({
          where: { id },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        });

        if (!currentOrder) {
          throw new Error('Order not found');
        }

        // If order is being cancelled and wasn't cancelled before, restore stock
        if (status === 'CANCELLED' && currentOrder.status !== 'CANCELLED') {
          await Promise.all(
            currentOrder.items.map(item =>
              tx.product.update({
                where: { id: item.productId },
                data: {
                  stock: {
                    increment: item.quantity
                  },
                  qty: {
                    increment: item.quantity
                  }
                }
              })
            )
          );

          // Invalidate product cache for updated products
          await Promise.all(
            currentOrder.items.map(item => 
              redis.del(`product_${item.productId}`)
            )
          );
        }

        return tx.order.update({
          where: { id },
          data: { status },
          include: {
            items: {
              include: {
                product: true
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            address: {
              select: {
                fullName: true,
                phone: true,
                address: true,
                city: true,
                state: true,
                zipCode: true,
                country: true
              }
            }
          }
        });
      });

      return res.json(order);
    } catch (error) {
      if (error.message === 'Order not found' || error.code === 'P2025') {
        return res.status(404).json({ error: 'Order not found' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ error: 'Failed to update order status' });
  }
};

// Create a new order
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { items, paymentMethod, total, shippingCost = 0, addressId, notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // First, check stock availability for all items
    const stockChecks = await Promise.all(
      items.map(async (item: any) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, stock: true }
        });

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`);
        }

        return { ...product, requestedQuantity: item.quantity };
      })
    );

    let order;
    // Use a transaction with increased timeout to ensure both order creation and stock update succeed or fail together
    try {
      order = await prisma.$transaction(async (tx) => {
        // Create the order first
        const newOrder = await tx.order.create({
      data: {
        userId,
        total,
            shippingCost,
            status: 'PENDING',
        paymentMethod,
            notes,
            addressId,
        items: {
              create: items.map((item: any) => ({
                productId: item.productId,
            quantity: item.quantity,
                price: item.price
              }))
            }
      },
      include: {
            items: {
              include: {
                product: true
              }
            },
            address: true
          }
        });

        // Batch update all products in a single query for better performance
        const updateQueries = items.map((item: any) =>
          tx.product.update({
            where: { id: item.productId },
        data: {
              stock: {
                decrement: item.quantity
              },
              qty: {
                decrement: item.quantity
              }
            }
          })
        );

        // Execute all product updates in parallel
        await Promise.all(updateQueries);

        // Clear user's cart
        await tx.cartItem.deleteMany({
          where: {
            cart: {
              userId
            }
          }
        });

        return newOrder;
      }, {
        timeout: 10000, // Increase timeout to 10 seconds
        maxWait: 15000  // Maximum time to wait for transaction to start
      });

      // After successful transaction, handle cache invalidation
      try {
        await Promise.all([
          ...items.map(item => redis.del(`product_${item.productId}`)),
          redis.del('all_products')
        ]);
      } catch (cacheError) {
        // Log cache error but don't fail the request
        console.warn('Cache invalidation error:', cacheError);
      }

    } catch (transactionError) {
      console.error('Transaction error:', transactionError);
      // Provide more specific error message based on the error type
      if (transactionError.code === 'P2028') {
        throw new Error('Order processing timed out. Please try again.');
      }
      throw new Error('Failed to process order transaction');
    }

    return res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    
    // Handle specific error messages
    if (error.message && (
      error.message.includes('not found') ||
      error.message.includes('Insufficient stock') ||
      error.message.includes('Failed to process order') ||
      error.message.includes('timed out')
    )) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Failed to create order' });
  }
};

// Get all orders for the current user
export const getUserOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        address: {
          select: {
            fullName: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            country: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ error: 'Failed to get orders' });
  }
};

// Get order details by ID
export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // If admin, allow access to any order. If regular user, only their orders
    const order = await prisma.order.findFirst({
      where: {
        id,
        ...(user.role !== 'ADMIN' ? { userId: user.id } : {})
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        address: {
          select: {
            fullName: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            country: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({ error: 'Failed to get order' });
  }
};

// Cancel an order
export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order belongs to user or user is admin
    if (order.userId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Check if order can be cancelled
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      return res.status(400).json({ error: `Order cannot be cancelled because it is ${order.status}` });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
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
          qty: {
            increment: item.quantity,
          }
        },
      });
      
      // Invalidate cache for this product
      await redis.del(`product_${item.productId}`);
    }

    return res.status(200).json({
      message: 'Order cancelled successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({ error: 'Failed to cancel order' });
  }
};

// Track order status
export const trackOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
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
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order belongs to user or user is admin
    if (order.userId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Generate tracking timeline based on status
    const timeline = [
      {
        status: 'PENDING',
        title: 'Order Placed',
        description: 'Your order has been received and is being processed.',
        date: order.createdAt,
        completed: true,
      },
      {
        status: 'PROCESSING',
        title: 'Processing',
        description: 'Your order is being prepared for shipping.',
        date: order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED' 
          ? order.updatedAt 
          : null,
        completed: order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED',
      },
      {
        status: 'SHIPPED',
        title: 'Shipped',
        description: 'Your order has been shipped and is on its way to you.',
        date: order.status === 'SHIPPED' || order.status === 'DELIVERED' ? order.updatedAt : null,
        completed: order.status === 'SHIPPED' || order.status === 'DELIVERED',
      },
      {
        status: 'DELIVERED',
        title: 'Delivered',
        description: 'Your order has been delivered successfully.',
        date: order.status === 'DELIVERED' ? order.updatedAt : null,
        completed: order.status === 'DELIVERED',
      },
    ];

    // If order is cancelled, add cancelled status
    if (order.status === 'CANCELLED') {
      timeline.push({
        status: 'CANCELLED',
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
    return res.status(500).json({ error: 'Failed to track order' });
  }
};