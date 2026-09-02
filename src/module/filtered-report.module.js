const { getUnifiedBookings } = require("./unified-booking.module");

const money = (value) => Number(Number(value || 0).toFixed(2));

const dateOnly = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const startOfMonth = (year, month) => new Date(year, month, 1);

const getPeriod = (period, from, to) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start;
  let end;
  switch (period) {
    case "today":
      start = today; end = new Date(today.getTime() + 86400000); break;
    case "this_week":
      start = new Date(today); start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      end = new Date(start); end.setDate(start.getDate() + 7); break;
    case "this_month":
      start = startOfMonth(today.getFullYear(), today.getMonth()); end = startOfMonth(today.getFullYear(), today.getMonth() + 1); break;
    case "last_month":
      start = startOfMonth(today.getFullYear(), today.getMonth() - 1); end = startOfMonth(today.getFullYear(), today.getMonth()); break;
    case "this_quarter": {
      const quarterMonth = Math.floor(((today.getMonth() + 9) % 12) / 3) * 3 + 3;
      const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
      start = startOfMonth(year, quarterMonth); end = startOfMonth(year, quarterMonth + 3); break;
    }
    case "this_financial_year":
      start = startOfMonth(today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1, 3);
      end = startOfMonth(today.getMonth() >= 3 ? today.getFullYear() + 1 : today.getFullYear(), 3); break;
    case "last_financial_year":
      start = startOfMonth(today.getMonth() >= 3 ? today.getFullYear() - 1 : today.getFullYear() - 2, 3);
      end = startOfMonth(today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1, 3); break;
    case "custom":
      if (!from || !to) return { error: "from and to are required for custom period" };
      return { from, to };
    default:
      return { from: undefined, to: undefined };
  }
  return { from: dateOnly(start), to: dateOnly(new Date(end.getTime() - 86400000)) };
};

const getFilteredReport = async (filters) => {
  const bookings = (await getUnifiedBookings(filters)).data;
  const serviceWise = {};
  const clientWise = {};
  const monthlyTrend = {};
  const bookingStatusDistribution = {};
  for (const row of bookings) {
    const amount = Number(row.final_amount || 0);
    const client = row.client_name || `Client ${row.client_id}`;
    const month = row.booking_date ? new Date(row.booking_date).toISOString().slice(0, 7) : "unknown";
    const status = row.booking_status == null || row.booking_status === "" ? "unknown" : String(row.booking_status);
    for (const [map, key] of [[serviceWise, row.service_type], [clientWise, client], [monthlyTrend, month], [bookingStatusDistribution, status]]) {
      if (!map[key]) map[key] = { bookingCount: 0, spend: 0 };
      map[key].bookingCount += 1;
      map[key].spend += amount;
    }
  }
  const format = (map) => Object.fromEntries(Object.entries(map).map(([key, value]) => [key, { bookingCount: value.bookingCount, spend: money(value.spend) }]));
  const formattedClients = format(clientWise);
  return {
    filters: {
      period: filters.period || "all",
      from: filters.from || null,
      to: filters.to || null,
      dateBasis: filters.dateBasis,
      clientIds: filters.clientIds || [],
      service: filters.service || "all",
      status: filters.status || "all",
      search: filters.search || null,
    },
    serviceWise: format(serviceWise),
    clientWise: formattedClients,
    monthlyTrend: format(monthlyTrend),
    topClientsBySpend: Object.entries(formattedClients).map(([clientName, value]) => ({ clientName, ...value })).sort((a, b) => b.spend - a.spend),
    bookingStatusDistribution: format(bookingStatusDistribution),
    bookings,
  };
};

module.exports = { getPeriod, getFilteredReport };
