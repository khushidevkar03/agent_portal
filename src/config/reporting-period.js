// Current reporting scope requested by the business.
const APRIL_2026_START = "2026-04-01";

const getAprilToNowRange = () => ({
  start: APRIL_2026_START,
  end: new Date(),
});

const addAprilFilter = (where, params, column) => {
  const range = getAprilToNowRange();
  where.push(`b.${column} >= ? AND b.${column} < ?`);
  params.push(range.start, range.end);
};

module.exports = { APRIL_2026_START, getAprilToNowRange, addAprilFilter };
