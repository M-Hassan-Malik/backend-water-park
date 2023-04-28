const mongoose = require('mongoose');
const dbUrl = 'mongodb+srv://gokulast:pAss123@cluster0.lzcnv.mongodb.net/WaterPark';

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
}).then(() => console.log('Database connected!'))
    .catch(err => console.log('Error connecting database!', err));

module.exports = {
    User: require('./models/user'),
    Otp: require('./models/otp')
};