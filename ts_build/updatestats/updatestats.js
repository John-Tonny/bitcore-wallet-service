#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var updatestats_1 = require("../lib/updatestats");
var config = require('../config');
var updateStatsScript = new updatestats_1.UpdateStats();
updateStatsScript.run(config, function (err) {
    if (err)
        throw err;
    console.log('Update stats script finished');
});
//# sourceMappingURL=updatestats.js.map