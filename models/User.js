const mongoose = require ('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema (
  {
    spotifyId: String,
    accessToken: String,
    refreshToken: String,
    expiresIn: String,
    displayName: String,
    isAdmin: false 
  },
  {
    timestamps: true
  }
)

const User = mongoose.model('User', userSchema);
module.exports= User;