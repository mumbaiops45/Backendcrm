
const {Router} = require('express');
const router = Router();
const Lead = require("../models/Lead");
const {body} = require("express-validator");
const {Auth} = require("../middleware/Auth");
const {GetBranch , GetBranchFunnel, Performance , Monthly, Source, Duration, Projection} = require("../controller/report.controller");



router.get("/branch123", Auth, GetBranch);
router.get("/branch", Auth, GetBranchFunnel);
router.get("/performance", Auth, Performance );
router.get("/monthly", Auth, Monthly)
router.get("/source", Auth,Source);
router.get("/stageduration", Auth, Duration);
router.get("/projection", Auth, Projection);




module.exports = router;