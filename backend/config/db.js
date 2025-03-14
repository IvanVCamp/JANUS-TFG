const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/credenciales', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Base de datos MongoDB conectada');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
