const mongoose = require ('mongoose');
const Schema = mongoose.Schema;

const quizSchema = new Schema (
  {
    quizCode: Number,
    title: String,
    description: String,
    questions: Array,
    songs: Array,
    users: Array,
    isFinished: {
      type: Boolean,
      default: false
    } 
  },
  {
    timestamps: true
  }
)

const Quiz = mongoose.model('Quiz', quizSchema);
module.exports= Quiz;
