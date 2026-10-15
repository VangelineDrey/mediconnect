const mongoose = require("mongoose");
const dns = require("dns");

const connectToDB = async () => {
  try {
    try { dns.setServers(["8.8.8.8", "8.8.4.4"]); } catch (e) {}
    await mongoose.connect(process.env.MONGO_DB);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error(`Could not connect to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectToDB;