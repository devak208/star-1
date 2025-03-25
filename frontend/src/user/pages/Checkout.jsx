"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useUser } from "../../context/UserContext"
import authService from "../../user/services/authService"
import orderService from "../../user/services/orderService"

export default function Checkout() {
  const { cart, clearCart, isAuthenticated } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [activeStep, setActiveStep] = useState("shipping")
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const navigate = useNavigate()

  // Form states
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
  })

  const [paymentMethod, setPaymentMethod] = useState("COD")
  const [orderNotes, setOrderNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?redirect=checkout")
      return
    }

    const fetchUserProfile = async () => {
      try {
        setIsLoading(true)
        const userData = await authService.getCurrentUser()
        setAddresses(userData.addresses || [])
        
        // Set default address if available
        const defaultAddress = userData.addresses?.find(addr => addr.isDefault)
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id)
          setShippingInfo(defaultAddress)
        }
      } catch (err) {
        console.error("Error fetching user profile:", err)
        setError("Failed to load user profile")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [isAuthenticated, navigate])

  // Redirect if cart is empty
  useEffect(() => {
    if (!isLoading && (!cart?.items || cart.items.length === 0)) {
      navigate("/cart")
    }
  }, [cart, isLoading, navigate])

  const handleAddressSelect = (address) => {
    setSelectedAddressId(address.id)
    setShippingInfo(address)
    setShowNewAddressForm(false)
  }

  const handleShippingSubmit = async (e) => {
    e.preventDefault()
    try {
      setIsSavingAddress(true)
      // Save new address if it's a new one
      if (showNewAddressForm) {
        const response = await authService.addAddress(shippingInfo)
        setAddresses([...addresses, response])
        setSelectedAddressId(response.id)
      }

      setActiveStep("payment")
    } catch (err) {
      console.error("Error saving shipping info:", err)
      setError("Failed to save shipping information")
    } finally {
      setIsSavingAddress(false)
    }
  }

  const handlePaymentSubmit = (e) => {
    e.preventDefault()
    setActiveStep("review")
  }

  const handlePlaceOrder = async () => {
    try {
      setIsSubmitting(true)
      setError("")

      if (!cart?.items || cart.items.length === 0) {
        setError("Your cart is empty")
        return
      }

      if (!selectedAddressId) {
        setError("Please select or add a shipping address")
        return
      }

      // Get the shipping cost
      const shippingCost = calculateShipping()

      // Create order object
      const orderData = {
        addressId: selectedAddressId,
        items: cart.items.map(item => ({
          productId: item.product?.id || item.id,
          quantity: item.quantity,
          price: Number(item.product?.price || item.price)
        })),
        total: calculateSubtotal() + shippingCost,
        shippingCost: shippingCost,
        shippingAddress: shippingInfo,
        paymentMethod,
        notes: orderNotes
      }

      // Create order using orderService
      const response = await orderService.createOrder(orderData)

      // Clear cart and redirect to success page
      clearCart()
      navigate("/order-success", {
        state: {
          orderId: response.id,
          orderData: response,
        },
      })
    } catch (err) {
      console.error("Error placing order:", err)
      setError("Failed to place your order. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateSubtotal = () => {
    if (cart?.total) {
      return cart.total;
    }
    
    return cart?.items?.reduce((total, item) => {
      const price = Number(item.product?.price || item.price || 0);
      const quantity = Number(item.quantity || 0);
      return total + (price * quantity);
    }, 0) || 0;
  }

  const calculateShipping = () => {
    const subtotal = calculateSubtotal()
    // Free shipping over ₹500, otherwise ₹50
    return subtotal > 500 ? 0 : 50
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-medium mb-4">Your cart is empty</h2>
          <button
            onClick={() => navigate("/products")}
            className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-medium mb-6">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Checkout Steps */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 py-4 px-6 text-center font-medium ${
                  activeStep === "shipping" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-500"
                }`}
                onClick={() => activeStep !== "shipping" && setActiveStep("shipping")}
              >
                1. Shipping
              </button>
              <button
                className={`flex-1 py-4 px-6 text-center font-medium ${
                  activeStep === "payment" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-500"
                }`}
                onClick={() => activeStep !== "payment" && activeStep !== "shipping" && setActiveStep("payment")}
                disabled={activeStep === "shipping"}
              >
                2. Payment
              </button>
              <button
                className={`flex-1 py-4 px-6 text-center font-medium ${
                  activeStep === "review" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-500"
                }`}
                onClick={() => activeStep === "review" && setActiveStep("review")}
                disabled={activeStep === "shipping" || activeStep === "payment"}
              >
                3. Review
              </button>
            </div>

            {/* Shipping Information */}
            {activeStep === "shipping" && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h2>

                {/* Saved Addresses */}
                {addresses.length > 0 && !showNewAddressForm && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Saved Addresses</h3>
                    <div className="space-y-3">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className={`p-4 border rounded-lg cursor-pointer ${
                            selectedAddressId === address.id
                              ? "border-gray-900 bg-gray-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => handleAddressSelect(address)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{address.fullName}</p>
                              <p className="text-sm text-gray-500">{address.phone}</p>
                              <p className="text-sm text-gray-500">
                                {address.address}, {address.city}, {address.state} {address.zipCode}
                              </p>
                              <p className="text-sm text-gray-500">{address.country}</p>
                            </div>
                            {address.isDefault && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Address Form */}
                {showNewAddressForm && (
                  <form onSubmit={handleShippingSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          value={shippingInfo.fullName}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, fullName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          value={shippingInfo.phone}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <input
                          type="text"
                          id="address"
                          value={shippingInfo.address}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          id="city"
                          value={shippingInfo.city}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                          State / Province
                        </label>
                        <input
                          type="text"
                          id="state"
                          value={shippingInfo.state}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP / Postal Code
                        </label>
                        <input
                          type="text"
                          id="zipCode"
                          value={shippingInfo.zipCode}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, zipCode: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          id="country"
                          value={shippingInfo.country}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-between mt-6">
                      <button
                        type="button"
                        onClick={() => setShowNewAddressForm(false)}
                        className="px-4 py-2 text-gray-700 hover:text-gray-900"
                        disabled={isSavingAddress}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingAddress}
                        className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 flex items-center space-x-2"
                      >
                        {isSavingAddress ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          "Save Address"
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Add New Address Button */}
                {!showNewAddressForm && (
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowNewAddressForm(true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Add New Address
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Payment Method */}
            {activeStep === "payment" && (
              <form onSubmit={handlePaymentSubmit} className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="cod"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300"
                    />
                    <label htmlFor="cod" className="ml-3 block text-sm font-medium text-gray-700">
                      Cash on Delivery
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="online"
                      name="paymentMethod"
                      value="ONLINE"
                      checked={paymentMethod === "ONLINE"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300"
                    />
                    <label htmlFor="online" className="ml-3 block text-sm font-medium text-gray-700">
                      Online Payment
                    </label>
                  </div>
                </div>
              </form>
            )}

            {/* Order Review */}
            {activeStep === "review" && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Order Review</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Order Items</h3>
                    <div className="mt-2 space-y-2">
                      {cart.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.product?.name || item.name}</p>
                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            ₹{(Number(item.product?.price || item.price) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Shipping Information</h3>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>{shippingInfo.fullName}</p>
                      <p>{shippingInfo.address}</p>
                      <p>
                        {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}
                      </p>
                      <p>{shippingInfo.country}</p>
                      <p>Phone: {shippingInfo.phone}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Payment Method</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Order Notes</h3>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      rows="3"
                      placeholder="Add any special instructions for your order..."
                    />
                  </div>

{/*                   <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-sm">
                      <p className="text-gray-500">Subtotal</p>
                      <p className="font-medium text-gray-900">₹{calculateSubtotal().toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <p className="text-gray-500">Shipping</p>
                      <p className="font-medium text-gray-900">₹{calculateShipping().toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between text-base mt-2">
                      <p className="font-medium text-gray-900">Total</p>
                      <p className="font-medium text-gray-900">₹{calculateTotal().toFixed(2)}</p>
                    </div>
                  </div> */}
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
                    <p>{error}</p>
                  </div>
                )}

                {/* <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Placing Order..." : "Place Ordertr"}
                  </button>
                </div> */}
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.product?.name || item.name}</p>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    ₹{(Number(item.product?.price || item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <p className="text-gray-500">Subtotal</p>
                  <p className="font-medium text-gray-900">₹{calculateSubtotal().toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <p className="text-gray-500">Shipping</p>
                  <p className="font-medium text-gray-900">₹{calculateShipping().toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-base mt-2">
                  <p className="font-medium text-gray-900">Total</p>
                  <p className="font-medium text-gray-900">₹{calculateTotal().toFixed(2)}</p>
                </div>
              </div>
              
              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                {activeStep === "shipping" && (
                  <button
                    onClick={() => selectedAddressId && setActiveStep("payment")}
                    disabled={!selectedAddressId}
                    className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${
                      selectedAddressId ? "bg-gray-900 hover:bg-gray-800" : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Proceed to Payment
                  </button>
                )}
                
                {activeStep === "payment" && (
                  <button
                    onClick={handlePaymentSubmit}
                    className="w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
                  >
                    Continue to Review
                  </button>
                )}
                
                {activeStep === "review" && (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Placing Order..." : "Place Order"}
                  </button>
                )}
                
                {activeStep === "shipping" && !selectedAddressId && (
                  <p className="mt-2 text-xs text-center text-red-500">
                    Please select an address to continue
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

