

const {CreateProposal, searchProposals , addCollection, getDashboardStats, filterProposal , getWinLossSummary ,getMonthlyCollection} = require("../controller/proposal.controller");
const {Router} = require('express');
const router = Router();
const {check} = require("express-validator");
const {Auth} = require("../middleware/Auth");
  


router.post("/createproposal", Auth, CreateProposal);
router.get("/searchproposals",  searchProposals);  
router.get("/getdashboardss", getDashboardStats);  
router.post("/add-collection", Auth, addCollection);
router.get("/getmonthlycolection", getMonthlyCollection); 
router.get("/win-loss-summary", getWinLossSummary); 
router.get("/filterproposal", filterProposal);


module.exports = router;