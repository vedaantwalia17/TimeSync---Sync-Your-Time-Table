(() => {
  const clean = (el) =>
    el ? el.innerText.trim().replace(/\s+/g, " ") : "";

  function findTimetableTable() {
    const tables = document.querySelectorAll("table");

    for (const t of tables) {
      const cols = t.querySelectorAll("tr:first-child td, tr:first-child th").length;
      const rows = t.querySelectorAll("tr").length;

      // Heuristic: timetable tables usually have >= 3 columns and >= 2 rows
      if (cols >= 3 && rows >= 2) {
        return t;
      }
    }

    return null;
  }

  function extractTable(table) {
    const rows = Array.from(table.querySelectorAll("tr"));

    const headerCells =
      rows[0].querySelectorAll("th,td");

    const header = Array.from(headerCells).map(clean);

    const data = rows.slice(1).map(r =>
      Array.from(r.querySelectorAll("td")).map(clean)
    );

    return { header, rows: data };
  }

  window.__SNU_TIMESYNC = {
    extract: () => {
      const table = findTimetableTable();
      if (!table) return { error: "No table found" };
      return extractTable(table);
    }
  };

  console.log("SNU TimeSync: Timetable extractor loaded.");
})();
