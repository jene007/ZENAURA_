const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Connect DB (optional)
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err.message));
} else {
  console.warn('MONGO_URI not set. Starting server without DB connection (for dev only).');
}

// start scheduled jobs (cron)
try {
  require('./cron/scheduler');
} catch (err) {
  console.warn('Cron scheduler not started:', err.message);
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
