const getHealthStatus = () => ({
  status: 'ok',
  service: 'agentportalcotrav-backend',
  timestamp: new Date().toISOString()
});

module.exports = {
  getHealthStatus
};
