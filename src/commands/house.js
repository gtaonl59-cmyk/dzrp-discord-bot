import fs from "fs";

const dbFile = "./src/data/economy.json";

function loadDB() {
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(dbFile));
}

function saveDB(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

export default {
  prefix: "buyhouse",

  async executePrefix(message, args) {
    const db = loadDB();
    const user = message.author.id;

    const price = 5000;

    if (!db[user]) db[user] = { money: 0, houses: 0 };

    if (db[user].money < price) {
      return message.reply("❌ ما عندكش فلوس كافية لشراء بيت");
    }

    db[user].money -= price;
    db[user].houses += 1;

    saveDB(db);

    message.reply("🏠 مبروك شريت بيت جديد!");
  },
};
