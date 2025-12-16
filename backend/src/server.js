const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables *before* importing routes that depend on them
dotenv.config();

const mongoose = require('mongoose');
const propertyRoutes = require('./routes/propertyRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const offerRoutes = require('./routes/offerRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const rentRoutes = require('./routes/rentRoutes');
const agreementRoutes = require('./routes/agreementRoutes');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/home_app';

const CORS_ALLOW_ALL = String(process.env.CORS_ALLOW_ALL || '').toLowerCase() === 'true';
const envOrigins = String(process.env.CORS_ORIGINS || '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      const allowlist = [
        'http://localhost:8081',
        'http://127.0.0.1:8081',
        'http://localhost:19006',
        'http://127.0.0.1:19006',
      ];
      if (envOrigins.length) {
        allowlist.push(...envOrigins);
      }
      if (!origin) return callback(null, true);
      if (CORS_ALLOW_ALL) return callback(null, true);
      if (allowlist.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  }),
);
// Allow larger JSON bodies so base64-encoded photos can be sent from the app
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/properties', propertyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/rents', rentRoutes);
app.use('/api/agreements', agreementRoutes);

mongoose
  .connect(MONGODB_URI, {
    // options kept minimal for now; can be expanded if needed
  })
  .then(() => {
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);

    if (process.env.NODE_ENV === 'production') {
      console.error('MongoDB connection is required in production. Check MONGODB_URI on Render.');
      process.exit(1);
    }
  });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});
