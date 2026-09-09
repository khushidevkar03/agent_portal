const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const db = require('./config/env');
const healthRoutes = require('./routes/health.routes');
const agentRoutes = require('./routes/agent.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const recentActivityRoutes = require('./routes/recent-activity.routes');
const clientListingRoutes = require('./routes/client-listing.routes');
const unifiedBookingRoutes = require('./routes/unified-booking.routes');
const filteredReportRoutes = require('./routes/filtered-report.routes');
const companyBookingsRoutes = require('./routes/company-bookings.routes');
const serviceBookingsRoutes = require('./routes/service-bookings.routes');
const billingRoutes = require('./routes/billing.routes');
const paymentDataRoutes = require('./routes/payment-data.routes');
const serviceSpecificBookingsRoutes = require('./routes/service-specific-bookings.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
  abortOnLimit: true,
  abortOnLimit: true,
  responseOnLimit: 'File size limit has been reached',
}));

app.post('/', (req, res) => {
  res.json({ message: 'AgentPortal Cotrav API is running' });
});

app.post('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 AS test');
    res.json({ success: true, message: 'MySQL connected successfully', data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
  }
});

app.use('/api/health', healthRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/agent/dashboard', dashboardRoutes);
app.use('/api/agent/analytics', analyticsRoutes);
app.use('/api/agent/recent-activity', recentActivityRoutes);
app.use('/api/agent/clients', clientListingRoutes);
app.use('/api/agent/unified-bookings', unifiedBookingRoutes);
app.use('/api/agent/report', filteredReportRoutes);
app.use('/api/agent/company-bookings', companyBookingsRoutes);
app.use('/api/agent/service-bookings', serviceBookingsRoutes);
app.use('/api/agent/billing', billingRoutes);
app.use('/api/agent/payment-data', paymentDataRoutes);
app.use('/api/agent', serviceSpecificBookingsRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
