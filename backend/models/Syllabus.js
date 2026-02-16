const mongoose = require("mongoose");

const syllabusSchema = new mongoose.Schema({
  faculty_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  course_code: String,
  course_title: String,
  semester: String,
  academic_year: String,
  file_path: String,
  status: {
    type: String,
    default: "FOR_REVIEW"
  },
  current_stage: {
    type: String,
    default: "DEPT_HEAD"
  },
  ai_compliance_score: Number
}, { timestamps: true });

module.exports = mongoose.model("Syllabus", syllabusSchema);
