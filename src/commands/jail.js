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
  prefix: "jail",

  async executePrefix(message, args) {
    const db = loadDB();
    const user = message.mentions.users.first();

    if (!user) return message.reply("❌ منشن شخص");

    const time = parseInt(args[1]) || 60;

    if (!db[user.id]) db[user.id] = {};

    db[user.id].jail = Date.now() + time * 1000;

    saveDB(db);

    message.reply(`🚔 تم سجن اللاعب لمدة ${time} ثانية`);
  }
};
