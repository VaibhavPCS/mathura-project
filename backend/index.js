import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import routes from './routes/index.js';
// import taskRoutes from './routes/task-routes.js';

dotenv.config();

const app = express();

// Updated CORS configuration for production
app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://127.0.0.1:5173',
        'https://mathura-backend-kjn9ibd12-vaibhavsahay-3118s-projects.vercel.app',
        // Add your frontend domain here when deployed
        process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'workspace-id'], 
    credentials: true
}));

// Handle preflight requests
app.options('*', cors());

app.use(morgan('dev'));

// Improved MongoDB connection for serverless
let isConnected = false;

const connectToDatabase = async () => {
    if (isConnected) {
        return;
    }
    
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            bufferCommands: false,
        });
        isConnected = true;
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};

// Connect to database on startup
connectToDatabase().catch(console.error);

app.use(express.json());

app.get('/', async (req, res) => {
    try {
        await connectToDatabase();
        res.status(200).json({ message: 'Welcome to PMS API' });
    } catch (error) {
        res.status(500).json({ message: 'Database connection failed' });
    }
});

app.use("/api-v1", routes);

app.use('/uploads', express.static('uploads'));

app.use((err,req,res,next) => {
    console.log(err.stack);
    res.status(500).json({ message: "Internal Server Error"});
})

app.use ((req,res) => {
     res.status(404).json({ message: "Not Found"});
})

// Export the app for Vercel serverless functions
export default app;
    