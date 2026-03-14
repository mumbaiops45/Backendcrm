
const {GetActivity,Recent,RecentLast20Days , CreateActivity} = require("../controller/activity.controller");
const {Auth} = require("../middleware/Auth");
const {Router} = require('express');
const router = Router();
const { body } = require('express-validator');

router.get("/get", Auth,GetActivity );    
router.get("/getrecent",Recent );

router.get("/last20day", RecentLast20Days );

router.post("/createactivity", [
  body("lead").optional().isMongoId().withMessage("Lead must be a valid Mongo ID"),
  body("type")
    .notEmpty()
    .withMessage("Type is required")
    .isIn(["Call", "WhatsApp", "Email", "Document", "Deal Lost", "Lead Created", "Follow-up", "Meeting", "In-Person", "SMS"]).withMessage("Invalid activity type"),

  body("description").notEmpty()
    .withMessage("Description is required")
    .isString()
    .withMessage("Description must be a string"),

  body("direction").optional()
    .isIn(["Inbound", "Outbound"])
    .withMessage("Direction must be Inbound or Outbound"),

  body("metadata")
    .optional()
    .isObject()
    .withMessage("Metadata must be an object")
],Auth, CreateActivity);




module.exports = router;