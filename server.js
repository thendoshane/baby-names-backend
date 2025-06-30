require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const PORT = 5501;

// Configure CORS
const corsOptions = {
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
};
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Database connection setup
// To be sent to the env
const uri = "mongodb+srv://Thendo:7bN0pMeUQZKYYOWN@thendo.zgrrvqv.mongodb.net/baby_names?retryWrites=true&w=majority&appName=Thendo";
const DB_NAME = 'baby_names';
const COLLECTION_NAME = 'users';

// Create MongoClient with proper configuration
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 30000, // 30 seconds timeout
  socketTimeoutMS: 45000, // 45 seconds timeout
});

let db, usersCollection;

// Connect to MongoDB
async function connectDB() {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await client.connect();
    console.log("✅ Connected to MongoDB");
    db = client.db(DB_NAME);
    usersCollection = db.collection(COLLECTION_NAME);
    
    // Verify connection and collection
    const count = await usersCollection.countDocuments();
    console.log(`📊 Found ${count} users in the collection`);
    
    return true;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    return false;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = db ? 'connected' : 'disconnected';
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    database: dbStatus
  });
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    console.log(`🔑 Login attempt for: ${email}`);
    
    // Use the persistent connection
    const user = await usersCollection.findOne({ 
      email: email.trim(), 
      password: password.trim() 
    });
    
    if (user) {
      console.log(`✅ Login successful for: ${email}`);
      res.json({ 
        success: true,
        message: 'Login successful',
        user: {
          fname: user.fname,
          lname: user.lname,
          email: user.email
        }
      });
    } else {
      console.log(`❌ Login failed for: ${email}`);
      res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Start server and connect to DB
connectDB().then((connected) => {
  if (connected) {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🔍 Health check: http://localhost:${PORT}/health`);
      //console.log(`👤 Test with: email: Siphumathendoshane@gmail.com, password: thendos`);
    });
  } else {
    console.log("🛑 Server cannot start without database connection");
    process.exit(1);
  }
});