const {Router} = require('express');
const {Register, loginUser} = require("../controller/user.controller");

const router = Router();
const {body} = require("express-validator");


router.post("/register", [
    body("name", "Enter a name").isLength({ min: 4 }),
    body("email", "Enter a correct email").isEmail(),
    body("password", "Enter a strong password").isLength({ min: 6 })
], Register);


router.post(
  "/login",
  [
    body("email", "Enter a valid Email").isEmail(),
    body("password", "Enter a valid password").exists(),
  ], loginUser
);




module.exports = router;