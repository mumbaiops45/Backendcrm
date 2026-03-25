const {Router} = require('express');
const router = Router();
const {body} = require("express-validator");
const Lead = require("../models/Lead");
const {Auth} = require("../middleware/Auth");
const {CreateLead ,getTotal,RecentActivity, GetAlldata, Update, searchstate, singleLeads, searchLeads, Delete , getBant, getLeaderboard} = require("../controller/lead.controller");


router.get('/bants', getBant);


router.get("/allleads", GetAlldata);
router.get("/totalamount", getTotal);
router.get("/branch/search", searchstate);
router.get("/leaderboard",  getLeaderboard);
//leads/search?location=Mumbai
router.get("/leads/search", searchLeads);
router.get("/recent-activity", RecentActivity);

router.post("/create",
    [
        body("name", "Enter a correct name").isLength({ min: 3 }),
        body("businessName").optional({ checkFalsy: true }).isLength({ min: 2 }),
        body("businessType").optional({ checkFalsy: true }).isLength({ min: 2 }),
        body("phone").optional({ checkFalsy: true }).isMobilePhone("any"),
        body("email").optional({ checkFalsy: true }).isEmail(),
        body("location").optional({ checkFalsy: true }).isLength({ min: 2 }),
        body("branch").isIn(['Bangalore', 'Mumbai', 'Mysore']),
        body("stage").optional().isIn(['Lead Capture', 'Reachable', 'Qualified', 'Proposal Sent', 'Closed Won', 'Closed Lost']),
        body("priority").optional().isIn(['Hot', 'Warm', 'Cool']),
        body("source").optional().isIn(["WhatsApp", 'Website Form', 'Phone Call', "Referral", 'Social Media', 'Walk-in', 'Other']),
        body("dealValue").optional({ checkFalsy: true }).isNumeric()
    ],
    Auth, CreateLead
    
);


 
router.get("/leads/:id", Auth, singleLeads )

router.put("/update/:id", Auth,Update);


router.delete("/delete/:id", Auth,Delete)



module.exports = router;