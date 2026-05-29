const supabase = require("./database");

async function createUser(userId) {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (!data) {
    await supabase.from("users").insert([
      {
        id: userId,
        money: 0,
        bank: 0,
        job: "unemployed",
        inventory: [],
        daily: 0,
        rank: "user"
      }
    ]);
  }
}

module.exports = { createUser };
