// SNU ERP WEEKLY TIMETABLE EXTRACTOR
// Converts column-based weekly grid → array of class objects

(() => {
  function cleanText(str) {
    return str.replace(/\s+/g, " ").trim();
  }

  function parseCellClasses(cellText) {
    // Each class is separated by HR or blank line
    const parts = cellText.split(/-{5,}|<hr[^>]*>/i).join("\n").split("\n");

    // Flatten lines, filter empties
    const lines = parts.map(p => cleanText(p)).filter(l => l);

    // Group into chunks of 4 lines (Course, Type, Time Range, Location)
    const classes = [];
    for (let i = 0; i < lines.length; i += 4) {
      const courseLine = lines[i] || "";
      const typeLine = lines[i + 1] || "";
      const timeLine = lines[i + 2] || "";
      const locLine = lines[i + 3] || "";

      // Parse time
      const tm = timeLine.match(/(\d{1,2}:\d{2}\s*[APMapm]{2})\s*-\s*(\d{1,2}:\d{2}\s*[APMapm]{2})/);

      classes.push({
        course: courseLine.replace(/^[A-Z]+\s+/, "").trim(),   // remove department prefix
        rawCourse: courseLine.trim(),
        type: typeLine.trim(),
        start: tm ? tm[1] : "",
        end: tm ? tm[2] : "",
        location: locLine.trim()
      });
    }

    return classes;
  }

  function extractWeeklyTimetable() {
    const table = document.querySelector("table tbody");
    if (!table) return { error: "Weekly table not found" };

    const rows = Array.from(table.querySelectorAll("tr"));
    if (rows.length === 0) return { error: "No rows found" };

    // HEADER: Day names in <th>
    const headerCells = rows[0].querySelectorAll("th");
    const header = Array.from(headerCells).map(h => cleanText(h.innerText.split("\n")[0]));

    // Day columns (Monday..Sunday)
    const days = header.slice(1); // remove "Time"

    const result = [];

    // Iterate rows after header
    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r].querySelectorAll("td");

      const timeCell = cells[0]?.innerText || "";
      const timeRangeStartMatch = timeCell.match(/(\d{1,2}:\d{2}[APMapm]{2})/);
      const slotTime = timeRangeStartMatch ? cleanText(timeRangeStartMatch[1]) : "";

      // Iterate each day column
      for (let c = 1; c < cells.length; c++) {
        const cell = cells[c];
        if (!cell || !cell.innerHTML.trim() || cell.innerHTML.includes("&nbsp;")) continue;

        // Extract text inside spans <span class="SSSTEXTWEEKLY">
        const raw = cell.innerHTML
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<hr[^>]*>/gi, "\n-----\n")
          .replace(/<[^>]+>/g, "")
          .trim();

        const classes = parseCellClasses(raw);

        for (const cls of classes) {
          result.push({
            day: days[c - 1],
            course: cls.course,
            type: cls.type,
            start: cls.start,
            end: cls.end,
            location: cls.location
          });
        }
      }
    }

    return { entries: result };
  }

  window.__TIMESYNC = {
    extract() {
      try {
        return extractWeeklyTimetable();
      } catch (e) {
        return { error: e.message };
      }
    }
  };

  console.log("TimeSync extractor Loaded");
})();
