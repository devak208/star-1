import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { AuthRequest } from '../../middleware/AuthMiddleware/authMiddleware';

// Get all users with their details
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized - Admin access required' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
            isDefault: true
          }
        },
        orders: {
          select: {
            id: true,
            total: true,
            status: true,
            paymentMethod: true,
            createdAt: true,
            items: {
              select: {
                quantity: true,
                price: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    image: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5 // Get only last 5 orders for preview
        },
        _count: {
          select: {
            orders: true // Get total number of orders
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

// Get specific user details
export const getUserDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized - Admin access required' });
    }

    const userDetails = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
            isDefault: true,
            createdAt: true,
            updatedAt: true
          }
        },
        orders: {
          select: {
            id: true,
            total: true,
            shippingCost: true,
            status: true,
            paymentMethod: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
            items: {
              select: {
                id: true,
                quantity: true,
                price: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    image: true
                  }
                }
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
        },
        cart: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    image: true,
                    stock: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            orders: true,
            addresses: true
          }
        }
      }
    });

    if (!userDetails) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate some additional statistics
    const statistics = {
      totalOrders: userDetails._count.orders,
      totalAddresses: userDetails._count.addresses,
      totalSpent: userDetails.orders.reduce((sum, order) => sum + order.total, 0),
      averageOrderValue: userDetails.orders.length > 0 
        ? userDetails.orders.reduce((sum, order) => sum + order.total, 0) / userDetails.orders.length 
        : 0,
      lastOrderDate: userDetails.orders[0]?.createdAt || null
    };

    res.json({
      user: userDetails,
      statistics
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
}; 