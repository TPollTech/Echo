"use strict";

const buildOrder = require("./build-order.json");
module.exports = Object.freeze(buildOrder.map((entry) => Object.freeze({ ...entry })));
