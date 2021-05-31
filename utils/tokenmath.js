const BigDecimal = require('js-big-decimal');

// always round down at 8 decimals
const round = (value) => parseFloat(
  BigDecimal.round(value, 8, BigDecimal.RoundingModes.DOWN),
);

module.exports = {
  round,
};
