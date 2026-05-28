import fs from "fs";

const dbFile = "./src/data/db.json";

function loadDB() {
  if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, "{}");
  return JSON.parse(fs.readFileSync(dbFile));
}

function saveDB(db) {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

export default {
  prefix: "buycar",

  async executePrefix(message) {
    const db = loadDB();
    const user = message.author.id;

    if (!db[user]) db[user] = { money: 0, cars: 0 };

    const price = 3000;

    if (db[user].money < price)
      return message.reply("❌ ما عندكش فلوس");

    db[user].money -= price;
    db[user].cars += 1;

    saveDB(db);

    message.reply("🚗 شريت سيارة!");
  }
};
