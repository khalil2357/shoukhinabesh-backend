# Shoukhinabesh Backend API Documentation

**Base URL:** `http://localhost:3000/api` (Development)

**Authentication:** Bearer Token (JWT)

---

## 📋 Table of Contents

1. [Auth API](#auth-api)
2. [Users API](#users-api)
3. [Products API](#products-api)
4. [Categories API](#categories-api)
5. [Cart API](#cart-api)
6. [Orders API](#orders-api)
7. [Coupons API](#coupons-api)
8. [Reviews API](#reviews-api)
9. [Payments API](#payments-api)
10. [Upload API](#upload-api)
11. [Error Handling](#error-handling)

---

## Auth API

### Register
- **Route:** `POST /auth/register`
- **Auth:** None
- **Body:**
  - `name` (string, required)
  - `email` (string, required)
  - `password` (string, required, min 8 chars)
- **Response:** User object with tokens (accessToken, refreshToken)

### Login
- **Route:** `POST /auth/login`
- **Auth:** None
- **Body:**
  - `email` (string, required)
  - `password` (string, required)
- **Response:** User object with tokens (accessToken, refreshToken)

### Refresh Token
- **Route:** `POST /auth/refresh`
- **Auth:** None
- **Body:**
  - `refreshToken` (string, required)
- **Response:** New accessToken and refreshToken

### Logout
- **Route:** `POST /auth/logout`
- **Auth:** Required (Bearer Token)
- **Body:** None
- **Response:** Success message

### Forgot Password
- **Route:** `POST /auth/forgot-password`
- **Auth:** None
- **Body:**
  - `email` (string, required)
- **Response:** OTP sent to email

### Reset Password
- **Route:** `POST /auth/reset-password`
- **Auth:** None
- **Body:**
  - `email` (string, required)
  - `otp` (string, required)
  - `newPassword` (string, required, min 8 chars)
- **Response:** Password updated message

---

## Users API

### Get My Profile
- **Route:** `GET /users/me`
- **Auth:** Required
- **Response:** Current user object

### Update My Profile
- **Route:** `PATCH /users/me`
- **Auth:** Required
- **Body:**
  - `name` (string, optional)
  - `avatar` (URL, optional)
- **Response:** Updated user object

### Get All Users (Admin Only)
- **Route:** `GET /users?page=1&limit=20`
- **Auth:** Required (Admin)
- **Query:** `page`, `limit`
- **Response:** Paginated list of users

### Get User by ID (Admin Only)
- **Route:** `GET /users/:id`
- **Auth:** Required (Admin)
- **Response:** User object

### Update User Role (Admin Only)
- **Route:** `PATCH /users/:id/role`
- **Auth:** Required (Admin)
- **Body:**
  - `role` (enum: CUSTOMER, VENDOR, ADMIN)
- **Response:** Updated user object

### Toggle User Status (Admin Only)
- **Route:** `PATCH /users/:id/toggle-status`
- **Auth:** Required (Admin)
- **Response:** Updated user object

### Delete User (Admin Only)
- **Route:** `DELETE /users/:id`
- **Auth:** Required (Admin)
- **Response:** Success message

---

## Products API

### List All Products (Public)
- **Route:** `GET /products?search=&categoryId=&minPrice=&maxPrice=&page=1&limit=20&sortBy=createdAt&order=desc`
- **Auth:** None
- **Query:**
  - `search` (string, optional)
  - `categoryId` (string, optional)
  - `minPrice` (number, optional)
  - `maxPrice` (number, optional)
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
  - `sortBy` (string, default: createdAt)
  - `order` (asc/desc, default: desc)
- **Response:** Paginated products array

### Get Product by Slug (Public)
- **Route:** `GET /products/:slug`
- **Auth:** None
- **Response:** Full product object with reviews

### Get My Vendor Products
- **Route:** `GET /products/vendor/mine?page=1&limit=20`
- **Auth:** Required (Vendor, Admin)
- **Query:** `page`, `limit`
- **Response:** Paginated products array

### Create Product (Vendor, Admin)
- **Route:** `POST /products`
- **Auth:** Required (Vendor, Admin)
- **Body:**
  - `name` (string, required)
  - `description` (string, required)
  - `price` (number, required, min 0)
  - `stock` (number, required, min 0)
  - `categoryId` (string, required)
  - `images` (array of URLs, optional)
  - `isPublished` (boolean, optional, default: false)
- **Response:** Created product object

### Update Product
- **Route:** `PATCH /products/:id`
- **Auth:** Required (Vendor owner or Admin)
- **Body:** All fields optional (same as create)
- **Response:** Updated product object

### Delete Product (Admin Only)
- **Route:** `DELETE /products/:id`
- **Auth:** Required (Admin)
- **Response:** Success message

---

## Categories API

### List All Categories (Public)
- **Route:** `GET /categories`
- **Auth:** None
- **Response:** Array of all categories

### Get Category by ID (Public)
- **Route:** `GET /categories/:id`
- **Auth:** None
- **Response:** Category object with products

### Create Category (Admin Only)
- **Route:** `POST /categories`
- **Auth:** Required (Admin)
- **Body:**
  - `name` (string, required)
- **Response:** Created category object

### Update Category (Admin Only)
- **Route:** `PATCH /categories/:id`
- **Auth:** Required (Admin)
- **Body:**
  - `name` (string, optional)
- **Response:** Updated category object

### Delete Category (Admin Only)
- **Route:** `DELETE /categories/:id`
- **Auth:** Required (Admin)
- **Response:** Success message

---

## Cart API

### Get My Cart
- **Route:** `GET /cart`
- **Auth:** Required
- **Response:** Cart object with items array

### Add Item to Cart
- **Route:** `POST /cart/items`
- **Auth:** Required
- **Body:**
  - `productId` (string, required)
  - `quantity` (number, required, min 1)
- **Response:** Updated cart object

### Update Cart Item Quantity
- **Route:** `PATCH /cart/items/:itemId`
- **Auth:** Required
- **Body:**
  - `quantity` (number, required, min 1)
- **Response:** Updated cart object

### Remove Item from Cart
- **Route:** `DELETE /cart/items/:itemId`
- **Auth:** Required
- **Response:** Updated cart object

### Clear Cart
- **Route:** `DELETE /cart`
- **Auth:** Required
- **Response:** Success message

---

## Orders API

### Place Order
- **Route:** `POST /orders`
- **Auth:** Required (Customer, Vendor)
- **Body:**
  - `paymentMethod` (string, required, e.g., "stripe")
  - `shippingAddress` (string, optional)
  - `couponCode` (string, optional)
  - `notes` (string, optional)
- **Response:** Created order object with orderNumber

### Get My Orders
- **Route:** `GET /orders/me?page=1&limit=10`
- **Auth:** Required
- **Query:** `page`, `limit`
- **Response:** Paginated orders array

### Get All Orders (Admin Only)
- **Route:** `GET /orders?page=1&limit=20`
- **Auth:** Required (Admin)
- **Query:** `page`, `limit`
- **Response:** Paginated orders array

### Get Order by ID
- **Route:** `GET /orders/:id`
- **Auth:** Required
- **Response:** Full order object with items

### Update Order Status (Admin, Vendor)
- **Route:** `PATCH /orders/:id/status`
- **Auth:** Required (Admin, Vendor)
- **Body:**
  - `status` (enum: PLACED, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- **Response:** Updated order object

### Cancel Order
- **Route:** `POST /orders/:id/cancel`
- **Auth:** Required
- **Response:** Cancelled order object

---

## Coupons API

### Validate Coupon
- **Route:** `POST /coupons/validate`
- **Auth:** Required
- **Body:**
  - `code` (string, required)
  - `orderTotal` (number, required)
- **Response:** Coupon object with discount details

### List Coupons (Admin Only)
- **Route:** `GET /coupons?page=1&limit=20`
- **Auth:** Required (Admin)
- **Query:** `page`, `limit`
- **Response:** Paginated coupons array

### Get Coupon by ID (Admin Only)
- **Route:** `GET /coupons/:id`
- **Auth:** Required (Admin)
- **Response:** Coupon object

### Create Coupon (Admin Only)
- **Route:** `POST /coupons`
- **Auth:** Required (Admin)
- **Body:**
  - `code` (string, required)
  - `discountType` (enum: "percent" | "fixed", required)
  - `discountValue` (number, required, min 0)
  - `minOrder` (number, optional)
  - `usageLimit` (number, optional)
  - `validFrom` (ISO date, required)
  - `validTo` (ISO date, required)
- **Response:** Created coupon object

### Update Coupon (Admin Only)
- **Route:** `PATCH /coupons/:id`
- **Auth:** Required (Admin)
- **Body:**
  - `isActive` (boolean, optional)
  - `discountValue` (number, optional)
  - `validTo` (ISO date, optional)
- **Response:** Updated coupon object

### Delete Coupon (Admin Only)
- **Route:** `DELETE /coupons/:id`
- **Auth:** Required (Admin)
- **Response:** Success message

---

## Reviews API

### Get Product Reviews (Public)
- **Route:** `GET /reviews/product/:productId?page=1&limit=10`
- **Auth:** None
- **Query:** `page`, `limit`
- **Response:** Paginated reviews array

### Create Review
- **Route:** `POST /reviews`
- **Auth:** Required (Customer with delivered order)
- **Body:**
  - `productId` (string, required)
  - `rating` (number, required, 1-5)
  - `comment` (string, required)
- **Response:** Created review object

### Delete Review (Admin Only)
- **Route:** `DELETE /reviews/:id`
- **Auth:** Required (Admin)
- **Response:** Success message

---

## Payments API

### Create Stripe Payment Intent
- **Route:** `POST /payments/stripe/intent`
- **Auth:** Required (Customer, Vendor)
- **Body:**
  - `orderId` (string, required)
- **Response:** Stripe PaymentIntent object with clientSecret

### Stripe Webhook
- **Route:** `POST /payments/stripe/webhook`
- **Auth:** None
- **Headers:** `stripe-signature` (required, from Stripe)
- **Note:** Called by Stripe servers only
- **Response:** Success message

### Initialize SSLCommerz Payment
- **Route:** `POST /payments/sslcommerz/init`
- **Auth:** Required (Customer, Vendor)
- **Body:**
  - `orderId` (string, required)
- **Response:** SSLCommerz session data

### SSLCommerz Success Callback
- **Route:** `POST /payments/sslcommerz/success`
- **Auth:** None
- **Body:** SSLCommerz response object
- **Note:** Called by SSLCommerz redirect
- **Response:** Success message

### SSLCommerz Fail Callback
- **Route:** `POST /payments/sslcommerz/fail`
- **Auth:** None
- **Body:** SSLCommerz response object
- **Response:** Error message

### SSLCommerz Cancel Callback
- **Route:** `POST /payments/sslcommerz/cancel`
- **Auth:** None
- **Response:** Cancellation message

---

## Upload API

### Upload Image
- **Route:** `POST /upload/image`
- **Auth:** Required
- **Content-Type:** `multipart/form-data`
- **Form Data:**
  - `file` (File, required, max 5MB, types: jpeg, png, webp, jpg)
- **Response:**
  - `url` (string) - Cloudinary URL
  - `publicId` (string) - Cloudinary public ID
  - `width` (number)
  - `height` (number)
  - `format` (string)

---

## Error Handling

### Standard Error Response
```
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

### Authentication Headers
```
Authorization: Bearer <accessToken>
```

---

## User Roles & Permissions

| Role | Permissions |
|------|------------|
| **CUSTOMER** | View products, categories, reviews; manage own cart, orders; create reviews |
| **VENDOR** | All CUSTOMER permissions + create/update own products; view own products |
| **ADMIN** | Full access to all resources and operations |

---

## Response Objects

### User Object
- `id` (string)
- `name` (string)
- `email` (string)
- `role` (CUSTOMER, VENDOR, ADMIN)
- `avatar` (URL, nullable)
- `isActive` (boolean)
- `createdAt` (ISO date)
- `updatedAt` (ISO date)

### Product Object
- `id` (string)
- `name` (string)
- `slug` (string)
- `description` (string)
- `price` (number)
- `stock` (number)
- `images` (array)
- `categoryId` (string)
- `vendorId` (string)
- `isPublished` (boolean)
- `createdAt` (ISO date)
- `updatedAt` (ISO date)

### Order Object
- `id` (string)
- `orderNumber` (string)
- `customerId` (string)
- `total` (number)
- `status` (PLACED, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- `paymentStatus` (PENDING, PAID, FAILED, REFUNDED)
- `paymentMethod` (string)
- `shippingAddress` (string, nullable)
- `discount` (number, nullable)
- `notes` (string, nullable)
- `items` (array of OrderItems)
- `createdAt` (ISO date)
- `updatedAt` (ISO date)

### Cart Object
- `id` (string)
- `userId` (string)
- `items` (array of CartItems with product details)
- `createdAt` (ISO date)
- `updatedAt` (ISO date)

---

## Frontend Integration Guide

### Common Request/Response Patterns

#### Pagination Response
```json
{
  "data": [...],
  "page": 1,
  "limit": 20,
  "total": 150,
  "totalPages": 8
}
```

#### Login Response
```json
{
  "id": "user123",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "CUSTOMER",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "avatar": "https://..."
}
```

#### Product Response (List)
```json
{
  "id": "prod456",
  "name": "Laptop",
  "slug": "laptop-dell-xps",
  "price": 1200,
  "stock": 5,
  "images": ["https://..."],
  "isPublished": true
}
```

#### Cart Response
```json
{
  "id": "cart123",
  "userId": "user456",
  "items": [
    {
      "id": "item1",
      "product": {...full product object...},
      "quantity": 2
    }
  ],
  "total": 2400
}
```

### Workflow: Customer Checkout
1. **Get Cart** → `GET /cart`
2. **Validate Coupon** (if any) → `POST /coupons/validate`
3. **Place Order** → `POST /orders` (returns orderNumber)
4. **Create Payment Intent** → `POST /payments/stripe/intent` or `POST /payments/sslcommerz/init`
5. **Complete Payment** (redirect to provider)
6. **Clear Cart** → `DELETE /cart`

### Workflow: Vendor Product Management
1. **Get My Products** → `GET /products/vendor/mine`
2. **Create Product** → `POST /products` (upload images first via `POST /upload/image`)
3. **Publish Product** → `PATCH /products/:id` with `isPublished: true`
4. **Update Product** → `PATCH /products/:id`
5. **Delete Product** → `DELETE /products/:id`

### Best Practices for Frontend

1. **Token Management:** 
   - Store `accessToken` in memory/state (auto-clear on browser close)
   - Store `refreshToken` in HTTP-only, secure cookie
   - Refresh token 5 minutes before expiry

2. **Token Refresh:** 
   - Call `POST /auth/refresh` when accessToken expires
   - Implement interceptor to handle 401 responses
   - Retry original request after token refresh

3. **Pagination:** 
   - Always use pagination (default: page=1, limit=20)
   - Implement infinite scroll or pagination UI
   - Cache results when possible

4. **Error Handling:** 
   - Check status codes and show user-friendly messages
   - Handle 401/403 for re-authentication flow
   - Log errors to monitoring service

5. **Upload:** 
   - Validate file size (max 5MB) on client before upload
   - Show upload progress to user
   - Store Cloudinary URL in product/profile

6. **Cart:** 
   - Load cart on app initialization
   - Update cart total in real-time
   - Clear cart after successful payment

7. **Order Tracking:** 
   - Poll `GET /orders/me` every 30 seconds for status
   - Show status badges: PLACED → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
   - Show estimated delivery date

8. **Coupons:** 
   - Validate coupon code before checkout
   - Show discount amount and final total
   - Handle expired coupons

9. **Debouncing:** 
   - Debounce search queries (300-500ms)
   - Debounce product filter changes

10. **Caching:** 
    - Cache categories (rarely change)
    - Cache user profile (until logout)
    - Invalidate product cache when creating/updating

---

## Dashboard Features by Role

### CUSTOMER Dashboard

**Overview Section**
- Recent orders (last 5)
- Order status breakdown (graphs)
- Total spent (all time)
- Saved addresses

**Pages/Features**

1. **Home/Dashboard**
   - Quick stats: Total orders, Total spent, Active orders
   - Recent orders list with status
   - Recommended products based on browsing/purchases
   - API: `GET /orders/me?limit=5`, `GET /products`

2. **Product Browsing**
   - Search, filter by category, price range
   - Sort by: newest, price, popularity
   - Product cards with images, price, rating
   - Add to cart button
   - API: `GET /products?search=...&categoryId=...&minPrice=...&maxPrice=...&sortBy=...&order=...`

3. **Shopping Cart**
   - List cart items with quantity controls
   - Item subtotal and order total
   - Apply coupon code
   - Proceed to checkout button
   - API: `GET /cart`, `PATCH /cart/items/:itemId`, `DELETE /cart/items/:itemId`, `POST /coupons/validate`

4. **Checkout**
   - Order summary
   - Enter/select shipping address
   - Choose payment method (Stripe/SSLCommerz)
   - Apply coupon
   - Place order button
   - API: `POST /orders`, `POST /payments/stripe/intent`, `POST /payments/sslcommerz/init`

5. **Orders**
   - List all customer orders with pagination
   - Order status, date, total
   - Click to view order details
   - Cancel order button (if applicable)
   - Track shipment
   - API: `GET /orders/me?page=...&limit=...`, `GET /orders/:id`, `POST /orders/:id/cancel`

6. **Order Details**
   - Order number, date, status
   - Items list with price breakdown
   - Shipping address and tracking
   - Payment status
   - Review button for delivered items
   - API: `GET /orders/:id`, `POST /reviews`

7. **Reviews**
   - Create review for purchased products
   - Star rating and comment
   - View all product reviews
   - API: `POST /reviews`, `GET /reviews/product/:productId`

8. **Profile**
   - Name, email, avatar
   - Edit profile
   - Change password
   - View saved addresses
   - API: `GET /users/me`, `PATCH /users/me`

---

### VENDOR Dashboard

**Overview Section**
- Total products, Total sales (revenue)
- Orders to process (status breakdown)
- Active products, Out of stock items
- Quick action buttons

**Pages/Features**

1. **Dashboard/Home**
   - Sales metrics: Total revenue (this month/all time)
   - Orders pending, orders completed this month
   - Top 5 products by sales
   - Recent orders requiring action
   - Stock alerts (low stock items)
   - API: `GET /orders/me?page=1&limit=10`, `GET /products/vendor/mine?page=1&limit=5`

2. **Product Management**
   - List all vendor's products with pagination
   - Search, filter by: Published, Out of stock, Category
   - Sort by: Newest, Best selling, Low stock
   - Quick actions: Edit, Delete, Duplicate, Publish/Unpublish
   - Bulk actions: Delete, Publish, Unpublish
   - API: `GET /products/vendor/mine?page=...&limit=...`

3. **Create Product**
   - Product name, description, price, stock
   - Category dropdown
   - Multiple image upload (with preview)
   - Publish toggle (draft/published)
   - Save as draft or Publish directly
   - API: `POST /upload/image` (for each image), `POST /products`

4. **Edit Product**
   - Update all product fields
   - Change/add/remove images
   - Update stock quantity
   - Change publish status
   - Delete product
   - API: `PATCH /products/:id`, `POST /upload/image`

5. **Orders Received**
   - List orders containing vendor's products
   - Filter by status: PLACED, CONFIRMED, PROCESSING, SHIPPED, DELIVERED
   - Search by order number or customer name
   - Click to view order details
   - Update order status
   - Estimated fulfillment time
   - API: `GET /orders?page=...&limit=...`, `GET /orders/:id`, `PATCH /orders/:id/status`

6. **Order Details**
   - Vendor's items in the order
   - Shipping address
   - Update status to PROCESSING → SHIPPED
   - Add tracking number
   - View customer contact info
   - API: `GET /orders/:id`, `PATCH /orders/:id/status`

7. **Analytics** (Optional)
   - Sales graph (daily, weekly, monthly)
   - Top products
   - Customer demographics
   - Conversion rates
   - API: `GET /orders/me` with aggregation on frontend

8. **Profile**
   - Vendor name, email, avatar
   - Edit profile
   - Store information
   - Bank details (for payouts)
   - API: `GET /users/me`, `PATCH /users/me`

---

### ADMIN Dashboard

**Overview Section**
- Total users, Total products, Total orders, Total revenue
- Revenue graph (daily, weekly, monthly)
- Latest orders and new customers
- System health status

**Pages/Features**

1. **Dashboard/Home**
   - KPIs: Total revenue, Total orders, Total users, Active vendors
   - Revenue chart over time
   - Recent orders list
   - New customers this week
   - Best selling products
   - API: Aggregated data from `/orders`, `/products`, `/users`

2. **User Management**
   - List all users with pagination
   - Search by name, email
   - Filter by role: CUSTOMER, VENDOR, ADMIN
   - Filter by status: Active, Inactive
   - Sort by: Newest, Most spent
   - Actions: View, Edit, Toggle status, Delete
   - Bulk actions: Change role, Deactivate, Delete
   - API: `GET /users?page=...&limit=...`

3. **User Details**
   - User profile info
   - Total orders, Total spent
   - Orders list
   - Change role
   - Toggle active/inactive
   - Delete user
   - API: `GET /users/:id`, `PATCH /users/:id/role`, `PATCH /users/:id/toggle-status`, `DELETE /users/:id`

4. **Product Management**
   - List all products from all vendors
   - Search by name
   - Filter by: Category, Published status, Vendor
   - Sort by: Newest, Most popular
   - Actions: View, Edit, Publish/Unpublish, Delete
   - Admin can edit any vendor's product
   - API: `GET /products?page=...&limit=...`, `PATCH /products/:id`, `DELETE /products/:id`

5. **Category Management**
   - List all categories
   - Search categories
   - Create category (with name, icon/image)
   - Edit category
   - Delete category
   - Reorder categories
   - API: `GET /categories`, `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id`

6. **Orders Management**
   - List all orders from all customers
   - Search by order number
   - Filter by status, payment status, date range
   - Sort by: Newest, Highest value
   - View order details
   - Update order status
   - Update payment status
   - Manual refund processing
   - API: `GET /orders?page=...&limit=...`, `GET /orders/:id`, `PATCH /orders/:id/status`

7. **Coupon Management**
   - List all coupons
   - Search by code
   - Filter by: Active, Expired, Usage status
   - Create coupon (code, discount type, value, date range, usage limit)
   - Edit coupon (discount value, status, expiry date)
   - View coupon usage stats
   - Delete coupon
   - API: `GET /coupons?page=...&limit=...`, `POST /coupons`, `PATCH /coupons/:id`, `DELETE /coupons/:id`

8. **Reviews Management**
   - List all product reviews
   - Filter by rating (1-5 stars)
   - Search by product, reviewer
   - Delete inappropriate reviews
   - API: `GET /reviews` (need endpoint), `DELETE /reviews/:id`

9. **Analytics** (Required)
   - Revenue over time (graph)
   - Orders over time
   - User registration over time
   - Top products
   - Top vendors
   - Export data (CSV/PDF)
   - API: Aggregate `/orders`, `/products`, `/users`

10. **Settings** (Optional)
    - Website configuration
    - Payment gateway settings
    - Email templates
    - Notification settings
    - API: Depends on implementation

11. **Reports** (Optional)
    - Sales report
    - Customer report
    - Product report
    - Vendor payouts report
    - Export/download options
    - API: Custom endpoints or aggregation

---

## Frontend State Management Suggestions

### Store Structure (React/Redux, Zustand, etc.)

```
auth/
  - currentUser: User | null
  - accessToken: string | null
  - isLoading: boolean
  - error: string | null

products/
  - items: Product[]
  - currentProduct: Product | null
  - filters: { search, categoryId, minPrice, maxPrice, sortBy, order }
  - pagination: { page, limit, total }
  - isLoading: boolean

cart/
  - items: CartItem[]
  - total: number
  - isLoading: boolean

orders/
  - items: Order[]
  - currentOrder: Order | null
  - pagination: { page, limit, total }
  - isLoading: boolean

ui/
  - notification: { type, message }
  - isModalOpen: boolean
  - sidebarOpen: boolean
```

### Loading States
- Show skeleton loaders for product lists
- Disable buttons during API calls
- Show progress bar during file upload
- Display "Loading..." for paginated data

### Error Boundaries
- Wrap dashboard sections in error boundaries
- Show fallback UI for failed sections
- Log errors to monitoring service

---

**Last Updated:** May 2026
**Version:** 2.0
