function isNonEmptyValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function pruneEmpty(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    let val = v;
    if (Array.isArray(val)) {
      val = val
        .map((item) => (typeof item === 'object' ? pruneEmpty(item) : item))
        .filter(isNonEmptyValue);
    } else if (val && typeof val === 'object') {
      val = pruneEmpty(val);
    }
    if (isNonEmptyValue(val)) {
      if (Array.isArray(out)) out.push(val);
      else out[k] = val;
    }
  }
  return out;
}

module.exports = { pruneEmpty, isNonEmptyValue };


