import * as express from 'express';
import * as cors from 'cors';
import * as morgan from 'morgan';
import * as path from 'path';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import 'colors';

import passport from './config/passport';
import bannerRoutes from './routes/bannerRoutes';
import categoryRoutes from './routes/categoryRoutes';
import productRoutes from './routes/productRoutes';
import authRoutes from './routes/auth/authRoutes';
import userRoutes from './routes/auth/userRoutes';
import OrderRoutes from "./routes/OrderRoutes"
import CartRoutes from "./routes/CartRoutes"
import addressRoutes from './routes/addressRoutes';
import adminUserRoutes from './routes/admin/adminUserRoutes';

const app = express();

// Middleware to log request body
app.use((req, res, next) => {
  console.log(`📩 Incoming Request: ${req.method} ${req.url}`.cyan);
  console.log(`🔹 Request Body:`, req.body);
  next();
});

// Middleware to log response body
app.use((req, res, next) => {
  const oldSend = res.send;

  res.send = function (data) {
    console.log(`📤 Outgoing Response for ${req.method} ${req.url}`.green);
    console.log(`🔸 Response Body:`, data);
    return oldSend.apply(res, arguments);
  };

  next();
});

// Set up CORS options to allow requests from your frontend URL
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://10.81.255.156:5173',
  credentials: true,
  methods: ["GET,HEAD,PUT,PATCH,POST,DELETE"],
  optionsSuccessStatus: 204,
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
};

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Use cookie-parser middleware to parse cookies from the client
app.use(cookieParser());

// Parse URL-encoded bodies and JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Custom middleware to log cookies and headers
app.use((req, res, next) => {
  console.log('📩 Incoming Request Headers:', req.headers);
  console.log('🍪 Incoming Cookies:', req.cookies);
  next();
});

// Set up session middleware for Passport login sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Initialize Passport and enable session support
app.use(passport.initialize());
app.use(passport.session());

// Custom response headers for local development
app.use((req, res, next) => {
  // Log all cookies for debugging
  console.log("Incoming cookies:", req.cookies);
  
  // Add additional headers for CORS
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://192.168.147.81:5173');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.header('Access-Control-Expose-Headers', 'Set-Cookie');
  next();
});

app.use(morgan(":method :url :status :res[content-length] - :response-time ms"));

// Serve static files from the uploads folder
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API Routes
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/api/cart", CartRoutes);
app.use("/api/orders", OrderRoutes);
app.use('/user/addresses', addressRoutes);
app.use('/api/admin', adminUserRoutes);

// Global Error Handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Error:", { message: err.message, stack: err.stack });
  res.status(500).json({ message: "Internal Server Error", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("🚀 Server started on".blue, `PORT ${PORT}`.yellow));