import fs from "fs";

const dbFile = "./src/data/db.json";

function loadDB() {
  if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, "{}");
  return JSON.parse(fs.readFileSync(dbFile));
}

export default {
  prefix: "wanted",

  async executePrefix(message) {
    const db = loadDB();
    const user = message.author.id;

    if (!db[user]) db[user] = { wanted: 0 };

    message.reply(`⚠️ Wanted Level: ${db[user].wanted}`);
  }
};
