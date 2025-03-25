import { Router } from 'express';
import { authenticateUser, AuthRequest } from '../middleware/AuthMiddleware/authMiddleware';
import { prisma } from '../config/db';
import { Response } from 'express';
import redis from "../config/redis";

const router = Router();

// Admin Routes - Place these first to avoid conflicts with other routes
// Get all orders (admin only)
router.get('/admin/all', authenticateUser, async (req: AuthRequest, res: Response) => {
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

    res.json(orders);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Failed to get all orders' });
  }
});

// Get single order by ID (admin only)
router.get('/admin/:id', authenticateUser, async (req: AuthRequest, res: Response) => {
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

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// Update order status (admin only)
router.patch('/admin/:id/status', authenticateUser, async (req: AuthRequest, res: Response) => {
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

    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    if (error.message === 'Order not found' || error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Regular user routes
// Create new order
router.post('/', authenticateUser, async (req: AuthRequest, res: Response) => {
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
        maxWait: 15000 // Maximum time to wait for transaction to start
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

    res.status(201).json(order);
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
    
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get all orders for the current user
router.get('/', authenticateUser, async (req: AuthRequest, res: Response) => {
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
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Get single order by ID
router.get('/:id', authenticateUser, async (req: AuthRequest, res: Response) => {
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

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

export default router;