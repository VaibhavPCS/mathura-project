import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import routes from './routes/index.js';
// import taskRoutes from './routes/task-routes.js';

dotenv.config();

const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'workspace-id'], 
    credentials: true
}));

// Handle preflight requests
app.options('*', cors());

app.use(morgan('dev'));

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected'))
.catch((err) => console.log(err));

app.use(express.json());

const PORT = process.env.PORT || 5000; 

app.get('/', async (req, res) => {
    res.status(200).json({ message: 'Welcome to PMS API' });
})

app.use("/api-v1", routes);

app.use('/uploads', express.static('uploads'));

app.use((err,req,res,next) => {
    console.log(err.stack);
    res.status(500).json({ message: "Internal Server Error"});
})

app.use ((req,res) => {
     res.status(404).json({ message: "Not Found"});
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
    