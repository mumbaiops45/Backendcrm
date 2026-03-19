
const Payment = require("../models/NewPayment");
const { validationResult } = require('express-validator');
const Client = require("../models/AddClient");


exports.getDashboardStats = async(req, res) =>{
  try {
    const clients = await Client.find({});
    const payments = await Payment.find({});

    const totalPipeline = clients.reduce((sum, client) =>{
      return sum + (client.totalValue || 0);
    }, 0);

    const totalReceived = payments.reduce((sum , payment) => {
      return sum + (payment.amountReceived || 0);
    }, 0);

    const outstanding = totalPipeline - totalReceived;

    const watching = clients.length;

    res.json({
      totalPipeline,
      totalReceived,
      outstanding,
      watching
    });

  } catch (error) { 
    console.error(error);
    res.status(500).json({message: "Internal Server Error"});
  }
};
 

exports.AllPayment = async(req, res) =>{
  try {
    const payments = await Payment.find({});
     return res.json({payments});
  } catch (error) {
    console.log(error.message);
    res.status(500).json({message: "Internal Server Error"});
  }
}




exports.CreatePayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dateReceived, invoiceNumber, client, project, amountReceived, paymentMode, tdsClient, remarks } = req.body;

    const received = Number(amountReceived);
    const tds = Number(tdsClient) || 0;

    
    if (tds > received) {
      return res.status(400).json({
        message: "TDS amount cannot be greater than the received amount"
      });
    }

    const newPayment = new Payment({
      dateReceived,
      invoiceNumber: invoiceNumber.trim(),
      client,
      project: project.trim(),
      amountReceived: received,
      paymentMode,
      tdsClient: tds,
      remarks: remarks?.trim() || '',
      createdBy: req.user.id
    });

    const savedPayment = await newPayment.save();

    res.status(201).json({
      paymentId: savedPayment._id,
      invoiceNumber: savedPayment.invoiceNumber,
      amountReceived: savedPayment.amountReceived
    });

  } catch (error) {
    console.error("Payment creation error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};