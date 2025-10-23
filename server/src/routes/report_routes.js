const express = require("express");
const router = express.Router();
const Checkup = require("../models/Checkup");
const { Types } = require("mongoose");

// 1) time series (weekly) across all patients
router.get("/trends/vitals", async (req, res) => {
  try {
    const { from, to, bucket = "week" } = req.query;
    const match = {};
    if (from || to) match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to)   match.date.$lte = new Date(to);

    const dateTrunc = bucket === "month" ? { $dateTrunc: { date: "$date", unit: "month" } }
                  : bucket === "day"   ? { $dateTrunc: { date: "$date", unit: "day" } }
                                        : { $dateTrunc: { date: "$date", unit: "week" } };

    const pipeline = [
      { $match: match },
      { $project: {
          bucket: dateTrunc,
          hr: "$vitals.heart_rate",
          sys: "$vitals.bp_sys",
          dia: "$vitals.bp_dia",
          temp: "$vitals.temperature_c",
          w: "$vitals.weight",
          h: "$vitals.height"
      }},
      { $group: {
          _id: "$bucket",
          heart_rate_avg: { $avg: "$hr" },
          bp_sys_avg:     { $avg: "$sys" },
          bp_dia_avg:     { $avg: "$dia" },
          temp_avg_c:     { $avg: "$temp" },
          weight_avg:     { $avg: "$w" },
          count:          { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ];

    const data = await Checkup.aggregate(pipeline);
    res.json({ bucket, data });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// 2) cohort snapshot (e.g., by gender or age band)
router.get("/cohorts/vitals", async (req, res) => {
  try {
    // join to patients for demographics
    const pipeline = [
      { $lookup: {
          from: "patients",
          localField: "patient_id",
          foreignField: "_id",
          as: "p"
      }},
      { $unwind: "$p" },
      // compute age
      { $addFields: {
          age: { $dateDiff: { startDate: "$p.date_of_birth", endDate: "$date", unit: "year" } },
          gender: "$p.gender"
      }},
      // band age
      { $addFields: {
          age_band: {
            $switch: {
              branches: [
                { case: { $lt: ["$age", 18] }, then: "<18" },
                { case: { $and: [ { $gte: ["$age",18] }, { $lt: ["$age",40] } ] }, then: "18-39" },
                { case: { $and: [ { $gte: ["$age",40] }, { $lt: ["$age",65] } ] }, then: "40-64" },
              ],
              default: "65+"
            }
          }
      }},
      { $group: {
          _id: { gender: "$gender", age_band: "$age_band" },
          count: { $sum: 1 },
          bp_sys_avg: { $avg: "$vitals.bp_sys" },
          bp_dia_avg: { $avg: "$vitals.bp_dia" },
          heart_rate_avg: { $avg: "$vitals.heart_rate" },
          temp_avg_c: { $avg: "$vitals.temperature_c" },
          weight_avg: { $avg: "$vitals.weight" }
      }},
      { $sort: { "_id.gender": 1, "_id.age_band": 1 } }
    ];
    const data = await Checkup.aggregate(pipeline);
    res.json({ data });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
