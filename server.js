require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5501;

// CORS Config
const corsOptions = {
  origin: [
    'https://baby-names-frontend.vercel.app',   // your frontend on Vercel
    'http://localhost:5500',                    // local testing
    'http://127.0.0.1:5500'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
};
app.use(cors(corsOptions));
app.use(express.json());

// Database Setup
const uri = process.env.MONGO_URI || "mongodb+srv://fallback_user:pass@cluster.mongodb.net/mydb";
const DB_NAME = 'baby_names';
const COLLECTION_NAME = 'users';

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
});

let db, usersCollection;

async function connectDB() {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await client.connect();
    db = client.db(DB_NAME);
    usersCollection = db.collection(COLLECTION_NAME);
    const count = await usersCollection.countDocuments();
    console.log(`✅ MongoDB connected — ${count} users found`);
    return true;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    return false;
  }
}

// Health Check
app.get('/health', (req, res) => {
  const dbStatus = db ? 'connected' : 'disconnected';
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    database: dbStatus
  });
});

// Login Endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  try {
    const user = await usersCollection.findOne({ 
      email: email.trim(), 
      password: password.trim()
    });

    if (user) {
      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          fname: user.fname,
          lname: user.lname,
          email: user.email
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (err) {
    console.error('❌ DB error during login:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Start Server
connectDB().then((connected) => {
  if (connected) {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } else {
    console.log("🛑 Server cannot start without database connection");
    process.exit(1);
  }
});
