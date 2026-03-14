const User = require("../models/User");
var jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {  validationResult } = require("express-validator");

const JWT_SECRETE = "NNCMumbai@1232!"

exports.Register = async (req, res) => {
    try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array() });
    }

    let user = await User.findOne({ email: req.body.email });
    if (user) {
        return res.status(409).send("Enter a unique email");
    }

    const salt = await bcrypt.genSalt(10);
    const hashpass = await bcrypt.hash(req.body.password, salt);

    user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: hashpass
    });

    const data = {
        user: {
            id: user.id, role: user.role
        }
    }
    const Authtoken = jwt.sign(data, JWT_SECRETE);
    res.json({ Authtoken })

    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");
    }

}

exports.loginUser =  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    try {
      const user = await User.findOne({ email });
      console.log("email", user.email)
      console.log("password", user.password);
      if (!user) {
        return res
          .status(400)
          .json({ error: "Please try to login with correct credentials12" });
      }
       if (!user.role) {
            user.role = 'rep'; // Set default role
            await user.save();
            console.log(`Fixed role for user ${user.email} to rep`);
        }

      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return res
          .status(400)
          .json({ error: "Please try to login with correct credentials" });
      }

      const data = { user: { id: user.id ,  role: user.role} };
      const Authtoken = jwt.sign(data, JWT_SECRETE);
      res.json({ Authtoken,user: {
                id: user.id,
                email: user.email,
                role: user.role,
                branch: user.branch
            } });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  }