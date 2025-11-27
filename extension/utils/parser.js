// Minimal parser because extractor already structures everything

const Parser = {
  parse(extracted) {
    if (!extracted || !extracted.entries) return [];
    return extracted.entries.map(e => ({
      day: e.day,
      course: e.course,
      type: e.type,
      start: e.start,
      end: e.end,
      location: e.location
    }));
  }
};

if (typeof module !== "undefined") {
  module.exports = Parser;
}
