const express = require("express");
const router = express.Router();
const { listUsers, updateUser, deleteUser } = require("../controllers/usersController");

router.get("/", listUsers);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
