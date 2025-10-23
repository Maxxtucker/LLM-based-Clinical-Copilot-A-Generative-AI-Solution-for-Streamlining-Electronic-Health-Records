// very simple keywords → pipeline id
const MAP = [
    { id: "weeklyVitals",  when: /trend|time series|weekly|month|over time/i },
    { id: "cohortsVitals", when: /cohort|gender|age|group/i }
  ];
  
  function plan(prompt) {
    const found = MAP.find(m => m.when.test(prompt || ""));
    return found?.id || "weeklyVitals";
  }
module.exports = { plan };

