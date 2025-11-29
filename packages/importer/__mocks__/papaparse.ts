// Manual mock for papaparse to work correctly in Jest with ESM imports
const papaparse = require("papaparse");
module.exports = papaparse;
module.exports.default = papaparse;
