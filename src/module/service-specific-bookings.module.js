const { getUnifiedBookings } = require("./unified-booking.module");

const getServiceSpecificBookings = async ({ service, agentId, from, to, status, search }) => {
  const result = await getUnifiedBookings({
    service,
    agentId,
    from,
    to,
    status,
    search,
  });
  return result.data;
};

module.exports = { getServiceSpecificBookings };
