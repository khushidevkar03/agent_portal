const { getClientListing } = require("../module/client-listing.module");

const clientListing = async (req, res, next) => {
  try {
    const agentId = Number.parseInt(req.query.agent_id, 10);
    if (!Number.isInteger(agentId) || agentId <= 0) {
      return res.status(400).json({ success: false, message: "A valid agent_id is required" });
    }
    const data = await getClientListing(agentId);
    res.json({ success: true, ClientCount: data.length, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { clientListing };
