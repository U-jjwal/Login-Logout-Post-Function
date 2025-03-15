const { name } = require('ejs');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
   useNewUrlParser: true,
   useUnifiedTopology: true
})
const postSchema = mongoose.Schema({
   user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
   },
   date: {
    type: Date,
    default: Date.now
   },
   content: String,
   likes: [
    { type: mongoose.Schema.Types.ObjectId, ref: "user"}
   ]
});

module.exports = mongoose.model('post', postSchema);