import fs from "fs";

const dbPath = "./src/data/db.json";

export function loadDB() {
  try {
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify({}));
    }

    const data = fs.readFileSync(dbPath, "utf8");
    return JSON.parse(data || "{}");

  } catch (err) {
    console.log("DB ERROR FIXED → RESETTING FILE");
    fs.writeFileSync(dbPath, JSON.stringify({}));
    return {};
  }
}

export function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}
