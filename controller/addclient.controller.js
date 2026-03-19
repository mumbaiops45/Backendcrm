
const AddClient = require("../models/AddClient");
const { validationResult } = require('express-validator');


exports.GetClients = async(req, res) =>{
    try {
        const AllClients = await AddClient.find({});
        return res.json({AllClients})
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({message: "Internal Server Error"});
    }
}

exports.Filters = async(req, res) =>{
  try {
    const {priority}  = req.query;

    if(!['HOT', 'WARM', 'WATCH', 'DONE'].includes(priority)) {
      return res.status(400).json({message: "Invalid priority value"});
    }

    const clients = await AddClient.find({
        priority: { $regex: new RegExp('^' + priority, 'i') }
    });

    res.status(200).json({clients});
  } catch (error) {
    console.log(error.message);
    res.status(500).json({message: "Internal Server Error"});
  }
}

exports.FilterByStatus = async(req, res) => {
    try {
        const {status} = req.query;

        const validStatuses = ['Pending', "Partial", 'Paid', 'Followed Up', 'Not Finalised', 'Declined'];
        if(!validStatuses.includes(status)){
            return res.status(400).json({message: 'Invalid status value'});
        }

        const clients = await AddClient.find({paymentStatus: status});

        res.status(200).json({clients});
    } catch (error) {
        console.log(error.message);
        res.status(500).json({message: 'Internal Server Error'});
    }
};

exports.searchClients = async (req, res) => {
  try {
    const { clientName, city, category, project } = req.query;

  
    let searchQuery = {};

    
    if (clientName) {
      searchQuery.clientName = { $regex: new RegExp(clientName, 'i') };  
    }

    if (city) {
      searchQuery.location = { $regex: new RegExp(city, 'i') }; 
    }

    if (category) {
      searchQuery.service = { $regex: new RegExp(category, 'i') };  
    }

    if (project) {
      searchQuery.project = { $regex: new RegExp(project, 'i') }; 
    }

    
    const clients = await AddClient.find(searchQuery);

   
    if (clients.length === 0) {
      return res.status(404).json({ message: 'No clients found with the given search criteria' });
    }

    
    res.status(200).json({ clients });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.AddClient =  async(req, res) =>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()});
        }

        const {clientName, contactPerson, location,service,description, totalValue, amountReceived, proposalDate,followUpDeadline, priority,paymentStatus, nextAction,lastFollowUpDate, notes} = req.body;


        const total = Number(totalValue);
        const received = Number(amountReceived);

        if(received > total){
            return res.status(400).jsin({message: "Amount received cannot be greater than the total value"});
        }

        const newClient = new AddClient({
            clientName,
            contactPerson,
            location, 
            service,
            description, 
            totalValue,
            amountReceived,
            proposalDate,
            followUpDeadline,
            priority,
            paymentStatus,
            nextAction,
            lastFollowUpDate,
            notes,
            createdBy: req.user.id
        });

        const savedClient = await newClient.save();
        res.status(201).json({savedClient});
    } catch (error) {
        console.log(error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}