
const {AddClient ,Filters, searchClients, FilterByStatus, GetClients} = require("../controller/addclient.controller");
const {Router} = require('express');
const router = Router();
const {check} = require("express-validator");
const {Auth} = require("../middleware/Auth");


router.get("/allclients",GetClients);
router.get("/getfilters", Filters);   
router.get("/searchClients", searchClients);
router.get("/getfilterstatus", FilterByStatus);
router.post("/addclient",Auth,AddClient);


module.exports = router;