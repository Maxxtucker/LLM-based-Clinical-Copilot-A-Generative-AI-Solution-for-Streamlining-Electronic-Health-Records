const express = require("express");
const router = express.Router();
const fetch = require("node-fetch"); // Node 18 has global fetch; use if available.

router.get("/preview", async (req, res) => {
  const base = `${req.protocol}://${req.get("host")}`;
  const url  = `${base}/api/reports/trends/vitals?bucket=week`;
  const r = await fetch(url); const json = await r.json();

  const series = json.data.map(x => ({
    _id: new Date(x._id).toISOString().slice(0,10),
    heart_rate_avg: Math.round((x.heart_rate_avg ?? 0)*10)/10,
    bp_sys_avg: Math.round((x.bp_sys_avg ?? 0)*10)/10,
    bp_dia_avg: Math.round((x.bp_dia_avg ?? 0)*10)/10,
    temp_avg_c: Math.round((x.temp_avg_c ?? 0)*10)/10,
    count: x.count
  }));

  const kpis = {
    total_checkups: series.reduce((a,b)=>a+b.count,0),
    heart_rate_avg: Math.round((series.reduce((a,b)=>a+(b.heart_rate_avg||0),0)/Math.max(series.length,1))*10)/10,
    bp_sys_avg: Math.round((series.reduce((a,b)=>a+(b.bp_sys_avg||0),0)/Math.max(series.length,1))*10)/10,
    bp_dia_avg: Math.round((series.reduce((a,b)=>a+(b.bp_dia_avg||0),0)/Math.max(series.length,1))*10)/10,
    temp_avg_c: Math.round((series.reduce((a,b)=>a+(b.temp_avg_c||0),0)/Math.max(series.length,1))*10)/10,
  };

  res.render("report", {
    layout: false,
    title: "Population Vitals Report",
    bucket: json.bucket,
    kpis,
    series
  });
});

module.exports = router;
