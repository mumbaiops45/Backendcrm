
const {Auth} = require("../middleware/Auth");
const {Router} = require('express');
const router = Router();
const { body } = require('express-validator');
const {Filtercall ,  CreateCall,deleteCall} = require("../controller/call.controller");

router.get("/calls", Auth,Filtercall);

router.post("/createcall", Auth,CreateCall);

router.delete("/deletecall/:id", Auth,deleteCall);

module.exports = router;