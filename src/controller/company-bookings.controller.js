const { getCompanyBookings } = require("../module/company-bookings.module");

const companyBookings = async (req, res, next) => {
  try {
    const rawAdminId = req.body.admin_id;
    const adminId = rawAdminId ? Number.parseInt(rawAdminId, 10) : undefined;
    const companyName = req.body.company_name ? String(req.body.company_name).trim() : undefined;
    const page = Math.max(1, Number.parseInt(req.body.page, 10) || 1);
    const requestedLimit = Number.parseInt(req.body.limit, 10);
    const allowedLimits = [10, 25, 50, 100];
    const limit = requestedLimit || 10;
    if ((!adminId || adminId <= 0) && !companyName) {
      return res.status(400).json({ success: false, message: "Pass a valid admin_id or company_name" });
    }
    if (rawAdminId && (!Number.isInteger(adminId) || adminId <= 0)) {
      return res.status(400).json({ success: false, message: "admin_id must be a positive integer" });
    }
    if (!allowedLimits.includes(limit)) {
      return res.status(400).json({
        success: false,
        message: "limit must be one of: 10, 25, 50, 100",
      });
    }
    const result = await getCompanyBookings({ adminId, companyName, page, limit });
    if (!result.company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }
    res.json({
      success: true,
      company: { admin_id: result.company.id, company_name: result.company.companyName },
      totalBookings: result.totalBookings,
      page,
      limit,
      totalPages: Math.ceil(result.totalBookings / limit),
      bookingCount: result.bookings.length,
      data: result.bookings,
    });
  } catch (error) { next(error); }
};

module.exports = { companyBookings };
