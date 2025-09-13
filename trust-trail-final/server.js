const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto-js');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { initialLedgerData, studentFees, initialUsers } = require('./dummy-data');

const app = express();
const PORT = 3001;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// --- FILE UPLOAD SETUP ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- MONGODB CONNECTION ---
mongoose.connect('mongodb://localhost:27017/trustTrailFinalDB')
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- DATABASE SCHEMAS ---
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true }
});

const transactionSchema = new mongoose.Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    type: { type: String, enum: ['income', 'budget', 'expense'], required: true },
    timestamp: { type: Date, default: Date.now },
    previousHash: { type: String, required: true },
    currentHash: { type: String, required: true },
    proofFilename: { type: String },
    proofFileHash: { type: String },
    anomalyThreshold: { type: Number },
    feedback: [{ user: String, comment: String, timestamp: Date }]
});

const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// --- AUTHENTICATION MIDDLEWARE ---
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'College Admin') return res.status(403).json({ message: 'Access forbidden. Admins only.' });
    next();
};


// --- HELPER FUNCTIONS ---
const calculateHash = (data) => crypto.SHA256(JSON.stringify(data)).toString();

// --- API ENDPOINTS ---

// AUTH
app.post('/api/auth/register', async (req, res) => {
    try {
        let user = await User.findOne({ email: req.body.email });
        if (user) return res.status(400).json({ message: 'User already registered.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        user = new User({
            email: req.body.email,
            password: hashedPassword,
            role: req.body.role,
        });
        await user.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration.', error });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(400).json({ message: 'Invalid email or password.' });

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) return res.status(400).json({ message: 'Invalid email or password.' });

        const token = jwt.sign({ _id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET);
        res.header('x-auth-token', token).json({ token, role: user.role, email: user.email });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login.', error });
    }
});

// TRANSACTIONS
app.get('/api/transactions', authMiddleware, async (req, res) => {
    try {
        const ledger = await Transaction.find().sort({ timestamp: 'asc' });
        res.status(200).json({ ledger, studentInfo: { count: studentFees.length, totalFees: studentFees.reduce((sum, fee) => sum + fee.amount, 0) } });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transactions', error });
    }
});

app.post('/api/transactions', [authMiddleware, adminMiddleware], upload.single('proof'), async (req, res) => {
    try {
        const { from, to, amount, description, type } = req.body;
        const proofFile = req.file;

        let proofFileHash = null, proofFilename = null;

        if (proofFile) {
             proofFileHash = crypto.SHA256(proofFile.buffer.toString()).toString();
             proofFilename = `${Date.now()}-${proofFile.originalname.replace(/\s/g, '_')}`;
             fs.writeFileSync(path.join(uploadsDir, proofFilename), proofFile.buffer);
        }

        const lastBlock = await Transaction.findOne().sort({ timestamp: 'desc' });
        const previousHash = lastBlock ? lastBlock.currentHash : '0';

        const newBlockData = { from, to, amount: parseFloat(amount), description, type, timestamp: new Date(), previousHash, proofFilename, proofFileHash, feedback: [], anomalyThreshold: type === 'budget' ? parseFloat(amount) * 1.05 : undefined };
        const currentHash = calculateHash(newBlockData);
        
        const newTransaction = new Transaction({ ...newBlockData, currentHash });
        await newTransaction.save();
        res.status(201).json(newTransaction);
    } catch (error) {
        res.status(500).json({ message: 'Error creating transaction', error: error.message });
    }
});

// --- SERVER INITIALIZATION ---
const startServer = async () => {
    try {
        // Data is no longer cleared or reseeded on every server start.
    } catch (err) {
        console.error("Error during server initialization:", err);
    }

    app.listen(PORT, () => {
        console.log(`✅ Backend server is running at http://localhost:${PORT}`);
        console.log(`🚀 Your application frontend is available at http://localhost:${PORT}`);
    });
};

startServer();

