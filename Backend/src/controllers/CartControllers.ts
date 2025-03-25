import type { Request, Response } from "express"
import { prisma } from "../config/db"

// Get user's cart with items
export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id

    // Find or create cart for the user
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          items: {},
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      })
    }

    // Calculate total price
    const total = cart.items.reduce((sum, item) => {
      return sum + item.product.price * item.quantity
    }, 0)

    res.json({
      cart,
      total,
    })
  } catch (error) {
    console.error("Error fetching cart:", error)
    res.status(500).json({ error: "Failed to fetch cart" })
  }
}

// Add item to cart
export const addToCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const { productId, quantity = 1 } = req.body

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" })
    }

    // Validate product exists and has enough stock
    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
    })

    if (!product) {
      return res.status(404).json({ error: "Product not found" })
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: "Not enough stock available" })
    }

    // Find or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      })
    }

    // Check if item already exists in cart
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: Number(productId),
        },
      },
    })

    if (existingCartItem) {
      // Update quantity if item already exists
      const updatedCartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + Number(quantity) },
        include: { product: true },
      })

      return res.json({
        message: "Cart updated successfully",
        item: updatedCartItem,
      })
    } else {
      // Add new item to cart
      const newCartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: Number(productId),
          quantity: Number(quantity),
        },
        include: { product: true },
      })

      return res.status(201).json({
        message: "Item added to cart",
        item: newCartItem,
      })
    }
  } catch (error) {
    console.error("Error adding to cart:", error)
    res.status(500).json({ error: "Failed to add item to cart" })
  }
}

// Update cart item quantity
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const { cartItemId } = req.params
    const { quantity } = req.body

    if (!cartItemId || quantity === undefined) {
      return res.status(400).json({ error: "Cart item ID and quantity are required" })
    }

    // Update the cart item
    const updatedCartItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: Number(quantity) },
      include: { product: true },
    })

    // Fetch the complete updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // Calculate total
    const total = updatedCart.items.reduce((sum, item) => {
      return sum + item.product.price * item.quantity
    }, 0)

    // Return both the updated item and the complete cart
    res.json({
      message: "Cart updated successfully",
      cart: updatedCart,
      total,
    })
  } catch (error) {
    console.error("Error updating cart item:", error)
    res.status(500).json({ error: "Failed to update cart item" })
  }
}

// Remove item from cart
export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const { cartItemId } = req.params

    if (!cartItemId) {
      return res.status(400).json({ error: "Cart item ID is required" })
    }

    // Verify the cart item belongs to the user's cart
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    })

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" })
    }

    if (cartItem.cart.userId !== userId) {
      return res.status(403).json({ error: "Not authorized to remove this cart item" })
    }

    // Delete the cart item
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    })

    // Fetch the updated cart data
    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // Calculate total price
    const total = updatedCart.items.reduce((sum, item) => {
      return sum + item.product.price * item.quantity
    }, 0)

    res.json({
      message: "Item removed from cart",
      cart: updatedCart,
      total,
    })
  } catch (error) {
    console.error("Error removing from cart:", error)
    res.status(500).json({ error: "Failed to remove item from cart" })
  }
}

// Clear cart
export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id

    // Find user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
    })

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" })
    }

    // Delete all items in the cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    })

    res.json({
      message: "Cart cleared successfully",
    })
  } catch (error) {
    console.error("Error clearing cart:", error)
    res.status(500).json({ error: "Failed to clear cart" })
  }
}

