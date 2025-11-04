// Returns a real Date or null (never throws)
function toDateOrNull(v) {
    if (!v) return null;
    if (v instanceof Date && !isNaN(v)) return v;
    if (typeof v === "number") {
      const d = new Date(v);
      return isNaN(d) ? null : d;
    }
    if (typeof v === "string") {
      const d = new Date(v);
      return isNaN(d) ? null : d;
    }
    return null;
  }
  
  function assertValidDateOrThrow(v, fieldName = "date") {
    const d = toDateOrNull(v);
    if (!d) throw new Error(`Invalid ${fieldName}: must be a valid date/time`);
    return d;
  }
  
  module.exports = { toDateOrNull, assertValidDateOrThrow };
  