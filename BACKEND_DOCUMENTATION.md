# Backend Documentation - Franchise Management System

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Directory Structure](#directory-structure)
5. [Environment Configuration](#environment-configuration)
6. [Database Models](#database-models)
7. [API Endpoints](#api-endpoints)
8. [Authentication & Authorization](#authentication--authorization)
9. [Controllers](#controllers)
10. [Middleware](#middleware)
11. [Utilities](#utilities)
12. [Setup & Installation](#setup--installation)
13. [Running the Application](#running-the-application)

---

## Project Overview

This is a **Franchise Management System** backend built with Node.js and Express.js. The system manages multiple franchises, allows food ordering, bill generation, payment processing, and provides comprehensive analytics.

### Key Features
- 🔐 **Multi-role Authentication** (Super Admin & Franchise Admin)
- 🏢 **Franchise Management** - Create, manage, and monitor franchises
- 🍔 **Food Menu Management** - CRUD operations for food items
- 📝 **Bill & Order Management** - Generate and manage bills
- 💳 **Payment Integration** - Razorpay payment gateway integration
- 📊 **Analytics & Reporting** - Business insights and metrics
- 📧 **OTP Verification** - Email-based OTP for user verification

---

## Technology Stack

### Core Technologies
- **Runtime**: Node.js (ES Module syntax)
- **Framework**: Express.js v5.1.0
- **Database**: MongoDB (with Mongoose ODM v8.19.2)
- **Language**: JavaScript (ES6+)

### Key Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^5.1.0 | Web framework |
| `mongoose` | ^8.19.2 | MongoDB object modeling |
| `jsonwebtoken` | ^9.0.2 | JWT authentication |
| `bcryptjs` | ^3.0.2 | Password hashing |
| `cors` | ^2.8.5 | Cross-origin resource sharing |
| `cookie-parser` | ^1.4.7 | Cookie parsing middleware |
| `dotenv` | ^17.2.3 | Environment variable management |
| `nodemailer` | ^7.0.10 | Email sending (OTP) |
| `razorpay` | ^2.9.4 | Payment gateway integration |
| `multer` | ^2.0.2 | File upload handling |
| `pdfkit` | ^0.17.2 | PDF generation |
| `qrcode` | ^1.5.4 | QR code generation |
| `axios` | ^1.13.0 | HTTP client |

### Development Dependencies
- **nodemon** ^3.1.10 - Auto-restart during development

---

## Architecture

### MVC Architecture Pattern
The backend follows the **Model-View-Controller (MVC)** pattern:

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Routes    │ ──▶ Define API endpoints
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Middleware  │ ──▶ Authentication, Authorization, Error Handling
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controllers │ ──▶ Business logic
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Models    │ ──▶ Database schema & operations
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  MongoDB    │
└─────────────┘
```

### Request Flow
1. **Client Request** → **Routes** (endpoint mapping)
2. **Routes** → **Middleware** (authentication/authorization)
3. **Middleware** → **Controllers** (business logic)
4. **Controllers** → **Models** (database operations)
5. **Models** → **Database** (MongoDB)
6. **Response** flows back through the same chain

---

## Directory Structure

```
backend_1.0/
├── src/
│   ├── config/              # Configuration files
│   │   └── db.js           # MongoDB connection setup
│   │
│   ├── controllers/         # Business logic layer
│   │   ├── analytics.controller.js    # Analytics endpoints logic
│   │   ├── auth.controller.js         # Authentication logic
│   │   ├── food.controller.js         # Food management logic
│   │   └── order.controller.js        # Order/Bill management logic
│   │
│   ├── middleware/          # Custom middleware
│   │   └── auth.middleware.js         # JWT authentication & authorization
│   │
│   ├── models/              # Database schemas
│   │   ├── Analytics.js    # Analytics data model
│   │   ├── Food.js         # Food item model
│   │   ├── Franchise.js    # Franchise model
│   │   ├── Order.js        # Order/Bill model
│   │   ├── PaymentHistory.js  # Payment records model
│   │   └── user.js         # User model
│   │
│   ├── routes/              # API route definitions
│   │   ├── analytics.routes.js    # Analytics endpoints
│   │   ├── auth.routes.js         # Authentication endpoints
│   │   ├── food.routes.js         # Food management endpoints
│   │   └── orderBill.routes.js    # Bill/Order endpoints
│   │
│   ├── utils/               # Utility functions
│   │   ├── helper.js       # General helper functions
│   │   ├── otp.js          # OTP generation & sending
│   │   └── razorpay.js     # Razorpay integration utilities
│   │
│   ├── app.js              # Express app configuration
│   └── index.js            # Entry point - server startup
│
├── .env                    # Environment variables (not in version control)
├── .env.example            # Environment variables template
├── .gitignore
├── package.json
├── package-lock.json
└── activate-all-franchises.js  # Utility script
```

---

## Environment Configuration

### .env File Structure

Create a `.env` file in the root directory with the following variables:

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/franchise-db
# or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/dbname
DB_NAME=franchise_management_system

# JWT Secret (Use a strong, random string)
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters

# CORS Configuration (comma-separated origins)
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Email Configuration (for OTP functionality)
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=your_app_specific_password_here
# Note: For Gmail, use App Password, not regular password

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_key_here

# Server Configuration
PORT=5000
```

### Environment Variables Explained

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGODB_URI` | MongoDB connection string | ✅ Yes | - |
| `DB_NAME` | Database name | ❌ No | - |
| `JWT_SECRET` | Secret key for JWT signing | ✅ Yes | - |
| `CORS_ORIGIN` | Allowed frontend origins | ✅ Yes | http://localhost:5173 |
| `EMAIL_USER` | Email for sending OTPs | ✅ Yes | - |
| `EMAIL_PASSWORD` | Email app password | ✅ Yes | - |
| `RAZORPAY_KEY_ID` | Razorpay API key | ✅ Yes | - |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key | ✅ Yes | - |
| `PORT` | Server port number | ❌ No | 5000 |

---

## Database Models

### 1. User Model (`models/user.js`)

Stores user information for both Super Admin and Franchise Admins.

**Schema:**
```javascript
{
  name: String (required),
  email: String (required, unique, lowercase),
  password: String (required, hashed),
  mobileNo: String (required, unique),
  role: String (enum: ["SUPER_ADMIN", "FRANCHISE_ADMIN"]),
  franchiseId: ObjectId (ref: "Franchise"),
  isVerified: Boolean (default: false),
  isActive: Boolean (default: false),
  otp: String,
  otpExpiry: Date,
  refreshToken: String,
  timestamps: true (createdAt, updatedAt)
}
```

**Indexes:**
- `franchiseId` (ascending)

**Key Fields:**
- `role`: Determines user permissions (SUPER_ADMIN can manage all franchises)
- `franchiseId`: Links Franchise Admins to their franchise
- `isVerified`: OTP verification status
- `isActive`: Account active/inactive status

---

### 2. Franchise Model (`models/Franchise.js`)

Represents individual franchise locations.

**Schema:**
```javascript
{
  businessName: String (required),
  ownerName: String (required),
  email: String (required, unique, lowercase),
  phone: String (required),
  address: String (required),
  city: String (required),
  state: String (required),
  pincode: String (required),
  country: String (required),
  isActive: Boolean (default: false),
  createdBy: ObjectId (ref: "User"),
  timestamps: true
}
```

**Indexes:**
- `createdBy` (ascending)

**Business Logic:**
- Only SUPER_ADMIN can create franchises
- Each franchise can have one Franchise Admin user
- Franchise status can be toggled (active/inactive)

---

### 3. Food Model (`models/Food.js`)

Food menu items managed globally by Super Admin.

**Schema:**
```javascript
{
  name: String (required),
  description: String (required),
  category: String (enum: [
    'STARTERS', 'MAIN_COURSE', 'BEVERAGES', 
    'DESSERTS', 'SNACKS', 'CHAAT'
  ]),
  price: Number (required, min: 0),
  image: String (URL or path),
  isAvailable: Boolean (default: true),
  createdBy: ObjectId (ref: "User"),
  timestamps: true
}
```

**Indexes:**
- `name` (ascending)
- `category` (ascending)
- `isAvailable` (ascending)

**Features:**
- Global menu managed by SUPER_ADMIN
- Franchise Admins can toggle availability for their franchise
- Categorized menu items

---

### 4. Order/Bill Model (`models/Order.js`)

Order and billing system with payment tracking.

**Main Schema (OrderBill):**
```javascript
{
  billNumber: String (required, unique),
  orderType: String (enum: ["DINE_IN", "TAKEAWAY"]),
  subtotal: Number (required, min: 0),
  discount: Number (default: 0),
  totalAmount: Number (required, min: 0),
  paymentMethod: String (enum: ["CASH", "ONLINE", "RAZORPAY"]),
  paymentStatus: String (enum: ["PENDING", "COMPLETED", "FAILED"]),
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  customerDetails: {
    name: String,
    phone: String
  },
  paidAt: Date,
  generatedBy: ObjectId (ref: "User"),
  items: [OrderItemSchema],
  timestamps: true
}
```

**Sub-Schema (OrderItem):**
```javascript
{
  foodId: ObjectId (ref: "Food"),
  foodName: String,
  quantity: Number (min: 1),
  price: Number,
  subtotal: Number,
  specialInstructions: String,
  timestamps: true
}
```

**Indexes:**
- `billNumber` (descending)
- `paidAt` (descending)

---

### 5. Payment History Model (`models/PaymentHistory.js`)

Tracks all payment transactions.

**Schema:**
```javascript
{
  billId: ObjectId (ref: "OrderBill"),
  razorpayOrderId: String,
  razorpayPaymentId: String,
  amount: Number,
  status: String (enum: ["PENDING", "COMPLETED", "FAILED"]),
  paymentMethod: String,
  franchiseId: ObjectId (ref: "Franchise"),
  timestamps: true
}
```

---

### 6. Analytics Model (`models/Analytics.js`)

Stores analytics data for business insights.

**Schema:**
```javascript
{
  franchiseId: ObjectId (ref: "Franchise"),
  date: Date,
  revenue: Number,
  ordersCount: Number,
  popularItems: Array,
  timestamps: true
}
```

---

## API Endpoints

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/admin/ncb/register` | Public | Register Super Admin |
| POST | `/login` | Public | User login (both roles) |
| POST | `/logout` | Public | User logout |
| POST | `/generate-otp` | Public | Generate & send OTP to email |
| POST | `/verify-otp` | Public | Verify OTP and activate account |
| POST | `/create-franchise-user` | Super Admin | Create franchise with admin user |
| GET | `/profile` | Authenticated | Get logged-in user profile |
| GET | `/franchises` | Super Admin | Get all franchises |
| PUT | `/franchise/:franchiseId/toggle-status` | Super Admin | Activate/deactivate franchise |
| GET | `/franchise/:franchiseId/details` | Super Admin | Get franchise details |

#### Request/Response Examples

**1. Register Super Admin**
```http
POST /api/v1/auth/admin/ncb/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "admin@example.com",
  "password": "SecurePass123!",
  "mobileNo": "9876543210"
}

Response (201):
{
  "success": true,
  "message": "Admin registered successfully",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "admin@example.com",
    "role": "SUPER_ADMIN"
  }
}
```

**2. Login**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "admin@example.com",
    "role": "SUPER_ADMIN",
    "isVerified": true
  }
}
```

**3. Create Franchise with Admin**
```http
POST /api/v1/auth/create-franchise-user
Authorization: Bearer <token>
Content-Type: application/json

{
  "franchise": {
    "businessName": "Burger Hub Downtown",
    "ownerName": "Jane Smith",
    "email": "franchise1@example.com",
    "phone": "9988776655",
    "address": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  },
  "admin": {
    "name": "Jane Smith",
    "email": "jane@burgerhub.com",
    "password": "FranchisePass123!",
    "mobileNo": "9988776655"
  }
}

Response (201):
{
  "success": true,
  "message": "Franchise and admin created successfully",
  "franchise": {...},
  "admin": {...}
}
```

---

### Food Management Endpoints (`/api/v1/food`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/create-food` | Super Admin | Create new food item |
| GET | `/all-foods` | Both Roles | Get all food items |
| PUT | `/update-food/:id` | Super Admin | Update food item |
| DELETE | `/delete-food/:id` | Super Admin | Delete food item |
| PUT | `/toggle-food-availability/:id` | Both Roles | Toggle food availability |

#### Request Examples

**1. Create Food Item**
```http
POST /api/v1/food/create-food
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Paneer Tikka",
  "description": "Grilled cottage cheese with spices",
  "category": "STARTERS",
  "price": 250,
  "image": "https://example.com/paneer-tikka.jpg"
}

Response (201):
{
  "success": true,
  "message": "Food item created successfully",
  "data": {
    "_id": "...",
    "name": "Paneer Tikka",
    "category": "STARTERS",
    "price": 250,
    "isAvailable": true
  }
}
```

**2. Get All Foods**
```http
GET /api/v1/food/all-foods
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Paneer Tikka",
      "category": "STARTERS",
      "price": 250,
      "isAvailable": true
    },
    ...
  ]
}
```

---

### Bill Management Endpoints (`/api/v1/bill`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/create-bill` | Both Roles | Create new bill |
| PUT | `/update-bill/:id` | Both Roles | Update existing bill |
| DELETE | `/delete-bill/:id` | Both Roles | Delete bill |
| GET | `/all-bills` | Both Roles | Get all bills (filtered by franchise) |
| GET | `/bill/:id` | Both Roles | Get bill by ID |
| POST | `/pdf` | Both Roles | Get bill by number (for PDF) |
| GET | `/franchise/:franchiseId/bills` | Super Admin | Get bills for specific franchise |
| POST | `/create-razorpay-order/:billId` | Both Roles | Create Razorpay payment order |
| POST | `/verify-payment` | Both Roles | Verify Razorpay payment |
| GET | `/payment-history` | Both Roles | Get payment history |

#### Request Examples

**1. Create Bill**
```http
POST /api/v1/bill/create-bill
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderType": "DINE_IN",
  "items": [
    {
      "foodId": "food123",
      "foodName": "Paneer Tikka",
      "quantity": 2,
      "price": 250,
      "subtotal": 500
    }
  ],
  "subtotal": 500,
  "discount": 50,
  "totalAmount": 450,
  "paymentMethod": "CASH",
  "customerDetails": {
    "name": "Customer Name",
    "phone": "9876543210"
  }
}

Response (201):
{
  "success": true,
  "message": "Bill created successfully",
  "data": {
    "billNumber": "BILL-2024-0001",
    "totalAmount": 450,
    "paymentStatus": "COMPLETED"
  }
}
```

**2. Create Razorpay Order**
```http
POST /api/v1/bill/create-razorpay-order/bill123
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "orderId": "order_xxxxxxxxx",
  "amount": 45000,  // Amount in paise
  "currency": "INR"
}
```

---

### Analytics Endpoints (`/api/v1/analytics`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/dashboard-stats` | Both Roles | Get dashboard statistics |
| GET | `/revenue-trend` | Both Roles | Get revenue trend data |
| GET | `/top-items` | Both Roles | Get top-selling items |
| GET | `/franchise-comparison` | Super Admin | Compare franchise performance |

---

## Authentication & Authorization

### Authentication Flow

1. **User Registration** → Password hashed with bcrypt
2. **Email OTP Verification** → Account activated
3. **Login** → JWT token generated and sent to client
4. **Token Storage** → Client stores token (localStorage/cookies)
5. **Subsequent Requests** → Token sent in Authorization header
6. **Token Verification** → Middleware validates token

### JWT Token Structure

```javascript
{
  userId: "user_id_here",
  role: "SUPER_ADMIN" | "FRANCHISE_ADMIN",
  franchiseId: "franchise_id_if_applicable",
  iat: timestamp,
  exp: timestamp
}
```

### Middleware (`middleware/auth.middleware.js`)

**1. authenticate()**
- Validates JWT token from Authorization header
- Verifies token signature using JWT_SECRET
- Attaches user data to `req.user`
- Rejects unauthorized requests

**2. authorize(...roles)**
- Checks if authenticated user has required role
- Accepts multiple roles as arguments
- Example: `authorize("SUPER_ADMIN", "FRANCHISE_ADMIN")`

### Usage Example in Routes

```javascript
import { authenticate, authorize } from "../middleware/auth.middleware.js";

// Only Super Admin can access
router.post("/create-food", 
  authenticate, 
  authorize("SUPER_ADMIN"), 
  createFood
);

// Both roles can access
router.get("/all-foods", 
  authenticate, 
  authorize("SUPER_ADMIN", "FRANCHISE_ADMIN"), 
  getAllFoods
);
```

---

## Controllers

### 1. Auth Controller (`controllers/auth.controller.js`)

**Functions:**
- `register()` - Register super admin
- `login()` - User login with JWT generation
- `logout()` - Clear refresh token
- `generateOtp()` - Generate and email OTP
- `verifyOTP()` - Verify OTP and activate account
- `createFranchiseWithAdmin()` - Create franchise with admin user
- `getProfile()` - Get logged-in user profile
- `toggleFranchiseStatus()` - Activate/deactivate franchise
- `getAllFranchises()` - List all franchises
- `getFranchiseDetails()` - Get specific franchise details

---

### 2. Food Controller (`controllers/food.controller.js`)

**Functions:**
- `createFood()` - Create new food item (Super Admin only)
- `getAllFoods()` - Get all food items with optional filters
- `updateFood()` - Update food item details
- `deleteFood()` - Remove food item from menu
- `toggleFoodAvailability()` - Toggle food availability status

**Business Logic:**
- Super Admin manages the global menu
- Franchise Admin can only toggle availability
- Price validations and category enums enforced

---

### 3. Order Controller (`controllers/order.controller.js`)

**Functions:**
- `createDirectBill()` - Create new order/bill
- `updateBill()` - Modify existing bill
- `deleteBill()` - Remove bill record
- `getAllBills()` - Get bills (filtered by franchise for Franchise Admin)
- `getBillById()` - Get single bill details
- `getBillByNumber()` - Get bill by bill number (for PDF/printing)
- `getFranchiseBills()` - Get all bills for specific franchise
- `createRazorpayOrder()` - Initiate Razorpay payment
- `verifyRazorpayPayment()` - Verify Razorpay payment signature
- `getPaymentHistory()` - Get payment transaction history

**Payment Flow:**
1. Create bill with `paymentMethod: "RAZORPAY"`, `paymentStatus: "PENDING"`
2. Call `createRazorpayOrder()` to get Razorpay order ID
3. Frontend integrates Razorpay checkout
4. On payment success, call `verifyRazorpayPayment()`
5. Bill status updated to "COMPLETED"

---

### 4. Analytics Controller (`controllers/analytics.controller.js`)

**Functions:**
- `getDashboardStats()` - Get key metrics (revenue, orders, top items)
- `getRevenueTrend()` - Historical revenue data
- `getTopItems()` - Best-selling food items
- `getFranchiseComparison()` - Compare multiple franchises

**Metrics Provided:**
- Total revenue
- Total orders
- Average order value
- Popular items
- Revenue trends (daily/weekly/monthly)
- Franchise performance comparison

---

## Utilities

### 1. Helper Functions (`utils/helper.js`)

Common utility functions used across the application.

**Possible Functions:**
- Date formatting
- Bill number generation
- Data validation helpers
- Error handling utilities

---

### 2. OTP Utility (`utils/otp.js`)

**Functions:**
- `generateOTP()` - Generate random 6-digit OTP
- `sendOTPEmail()` - Send OTP via email using Nodemailer

**Configuration:**
```javascript
// Uses environment variables:
// EMAIL_USER - sender email
// EMAIL_PASSWORD - app password
```

**Email Service:**
- Uses Nodemailer with Gmail SMTP
- Sends HTML formatted emails
- OTP validity: typically 10-15 minutes

---

### 3. Razorpay Utility (`utils/razorpay.js`)

**Functions:**
- Razorpay instance initialization
- Payment signature verification
- Order creation helpers

**Configuration:**
```javascript
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
```

---

## Setup & Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (comes with Node.js)
- MongoDB (local installation or MongoDB Atlas account)
- Razorpay account (for payment integration)
- Gmail account with App Password (for OTP emails)

### Installation Steps

**1. Clone the Repository**
```bash
cd backend_1.0
```

**2. Install Dependencies**
```bash
npm install
```

**3. Configure Environment Variables**
```bash
# Copy the example file
copy .env.example .env

# Edit .env with your actual values
# Use your preferred text editor
```

**4. Set Up MongoDB**

**Option A: Local MongoDB**
```bash
# Make sure MongoDB service is running
# Connection string: mongodb://localhost:27017/franchise-db
```

**Option B: MongoDB Atlas (Cloud)**
```bash
# Create cluster at https://www.mongodb.com/cloud/atlas
# Get connection string
# Format: mongodb+srv://username:password@cluster.mongodb.net/dbname
```

**5. Configure Email (Gmail)**
```bash
# 1. Go to Google Account Settings
# 2. Security → 2-Step Verification (enable)
# 3. App Passwords → Generate password
# 4. Use generated password in EMAIL_PASSWORD
```

**6. Set Up Razorpay**
```bash
# 1. Sign up at https://razorpay.com/
# 2. Get API keys from Dashboard
# 3. Use Test keys for development
# 4. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env
```

---

## Running the Application

### Development Mode (with auto-restart)
```bash
npm run dev
```

**Output:**
```
Server is running on port http://localhost:5000
MongoDB connected successfully
```

### Production Mode
```bash
npm start
```

### Test API Health
```bash
# Using curl
curl http://localhost:5000/hello

# Using browser
# Navigate to: http://localhost:5000/hello
```

**Expected Response:**
```
hello world
```

---

## Common Operations

### Activate All Franchises (Utility Script)

The project includes a utility script to activate all franchises:

```bash
node activate-all-franchises.js
```

This script:
- Connects to MongoDB
- Sets `isActive: true` for all franchises
- Useful for bulk operations or testing

---

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (development only)"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Security Best Practices

### Implemented Security Measures
1. ✅ **Password Hashing** - bcrypt with salt rounds
2. ✅ **JWT Authentication** - Secure token-based auth
3. ✅ **CORS Configuration** - Restricted origins
4. ✅ **Input Validation** - Mongoose schema validation
5. ✅ **Environment Variables** - Sensitive data in .env
6. ✅ **Role-Based Access Control** - Authorization middleware

### Recommendations
- Use HTTPS in production
- Implement rate limiting (express-rate-limit)
- Add request logging (morgan)
- Implement database backup strategy
- Regular security audits with `npm audit`
- Keep dependencies updated

---

## Database Indexing

### Performance Optimization

Indexes are created on frequently queried fields:

**User Model:**
- `franchiseId` - Fast franchise user lookups

**Franchise Model:**
- `createdBy` - Track franchise creator

**Food Model:**
- `name`, `category`, `isAvailable` - Menu filtering

**OrderBill Model:**
- `billNumber` (descending) - Recent bills first
- `paidAt` (descending) - Payment history

---

## API Testing

### Using Thunder Client / Postman

**1. Import Environment Variables**
```json
{
  "base_url": "http://localhost:5000/api/v1",
  "token": "your_jwt_token_after_login"
}
```

**2. Test Workflow**
```
1. Register Super Admin → POST /auth/admin/ncb/register
2. Generate OTP → POST /auth/generate-otp
3. Verify OTP → POST /auth/verify-otp
4. Login → POST /auth/login (save token)
5. Create Franchise → POST /auth/create-franchise-user
6. Create Food → POST /food/create-food
7. Create Bill → POST /bill/create-bill
```

---

## Troubleshooting

### MongoDB Connection Issues
```
Error: MongooseServerSelectionError
```
**Solution:**
- Check MongoDB service is running
- Verify MONGODB_URI in .env
- Check network/firewall settings
- For Atlas: Whitelist your IP address

### JWT Token Errors
```
Error: Invalid token
```
**Solution:**
- Check JWT_SECRET is set in .env
- Verify token format in Authorization header
- Token might be expired (generate new one)

### Email OTP Not Sending
```
Error: Invalid login credentials
```
**Solution:**
- Use Gmail App Password, not regular password
- Enable 2-Step Verification in Google Account
- Check EMAIL_USER and EMAIL_PASSWORD in .env

### Razorpay Payment Fails
```
Error: Invalid key_id or key_secret
```
**Solution:**
- Verify Razorpay key_id and key_secret
- Use test keys for development
- Check Razorpay dashboard for API status

---

## Deployment Considerations

### Environment-Specific Configuration

**Development:**
- Use local MongoDB
- Razorpay test keys
- Set NODE_ENV=development

**Production:**
- Use MongoDB Atlas or managed database
- Razorpay live keys
- Set NODE_ENV=production
- Use process manager (PM2)
- Enable HTTPS
- Set up logging
- Configure monitoring

### PM2 Deployment Example
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/index.js --name franchise-api

# View logs
pm2 logs franchise-api

# Restart application
pm2 restart franchise-api
```

---

## API Response Standards

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]  // Optional validation errors array
}
```

---

## Future Enhancements

### Potential Features
- [ ] Real-time order notifications (WebSocket/Socket.io)
- [ ] Advanced analytics with charts
- [ ] Multi-language support
- [ ] Customer loyalty program
- [ ] Inventory management
- [ ] Email notifications for orders
- [ ] SMS integration
- [ ] Advanced reporting (PDF exports)
- [ ] API rate limiting
- [ ] Redis caching for performance
- [ ] GraphQL API option
- [ ] Automated testing (Jest/Mocha)

---

## Support & Contribution

### Getting Help
- Check this documentation
- Review .env.example for configuration
- Examine controller code for business logic
- Check model schemas for data structure

### Code Conventions
- Use ES6+ syntax (import/export)
- Follow async/await pattern
- Consistent error handling
- Meaningful variable names
- Add comments for complex logic

---

## Version History

### Version 1.0.0
- Initial release
- Core authentication system
- Franchise management
- Food menu management
- Bill and order system
- Razorpay payment integration
- Analytics dashboard
- OTP verification

---

## Contact & Resources

### Useful Links
- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Razorpay API Docs](https://razorpay.com/docs/api/)
- [JWT Introduction](https://jwt.io/introduction)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

**Last Updated:** January 2026
**Version:** 1.0.0
**Maintained By:** Development Team
