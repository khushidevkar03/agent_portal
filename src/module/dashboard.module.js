const { getAnalytics } = require("./analytics.module");

const toNumber = (value) => Number(value || 0);
const money = (value) => Number(toNumber(value).toFixed(2));

const getDashboard = async (agentId) => {
  const analytics = await getAnalytics(agentId, {}, { includeDashboardData: true });
  const clients = analytics.clientDirectory;
  const data = {
    totalReferredClients: clients.length,
    referredClients: clients.map((client) => ({
      adminId: client.id,
      clientName: client.clientName || `Client ${client.id}`,
    })),
    activeReferredClients: clients.filter((client) => Number(client.isActive) === 1).length,
    totalBookings: 0,
    totalSpend: 0,
    // confirmedBookings: 0,
    // cancelledBookings: 0,
    currentMonthBookings: 0,
    currentMonthSpend: 0,
  };
  data.serviceWise = Object.entries(analytics.dashboardWise).map(([service, row]) => ({
    service,
    bookingCount: toNumber(row.totalBookings),
    spend: money(row.totalSpend),
  }));
  data.clientWise = analytics.clientWise;
  data.monthWise = analytics.monthlyTrend;
  data.billing = analytics.billing;
  for (const row of Object.values(analytics.dashboardWise)) {
    data.totalBookings += toNumber(row.totalBookings);
    data.totalSpend += toNumber(row.totalSpend);
    // data.confirmedBookings += toNumber(row.confirmedBookings);
    // data.cancelledBookings += toNumber(row.cancelledBookings);
    data.currentMonthBookings += toNumber(row.currentMonthBookings);
    data.currentMonthSpend += toNumber(row.currentMonthSpend);
  }
  data.totalSpend = money(data.totalSpend);
  data.currentMonthSpend = money(data.currentMonthSpend);
  return data;
};

module.exports = { getDashboard };
