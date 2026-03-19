
const {CreatePayment , AllPayment, getDashboardStats} = require("../controller/payment.controller");
const {Router} = require('express');
const router = Router();
const {check} = require("express-validator");
const {Auth} = require("../middleware/Auth");


router.get("/payments", AllPayment);

router.get("/getdashboards", getDashboardStats);

router.post("/createpayment",
   Auth, [
    check('invoiceNumber', 'Invoice number is required').notEmpty(),
    check('client', 'Client is required').notEmpty(),
    check('project', 'Project is required').notEmpty(),
    check('amountReceived', 'Amount must be a number').isFloat({ min: 0 }),
    check('paymentMode', 'Payment mode is required').isIn(["NEFT","RTGS","UPI","Cheque","Cash","IMPS","Wire"])
  ], CreatePayment);


module.exports = router;