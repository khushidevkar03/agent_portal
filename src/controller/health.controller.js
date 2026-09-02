const { getHealthStatus } = require('../module/health.module');

const getHealth = (req, res) => {
  res.status(200).json(getHealthStatus());
};

module.exports = {
  getHealth
};
