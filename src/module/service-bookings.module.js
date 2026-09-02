const { getUnifiedBookings } = require("./unified-booking.module");
const { unifiedBookingSchema } = require("../config/unified-booking.schema");

const getServiceBookings = async ({ agentId, service, from, to, status, search }) => {
  const result = await getUnifiedBookings({
    agentId,
    service,
    from,
    to,
    status,
    search,
  });
  const grouped = Object.fromEntries(
    Object.keys(unifiedBookingSchema).map((name) => [name, []]),
  );
  for (const booking of result.data) grouped[booking.service_type].push(booking);
  return grouped;
};

module.exports = { getServiceBookings };
