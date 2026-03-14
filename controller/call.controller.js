

const {  validationResult } = require('express-validator');
const Call = require("../models/Call");
const Lead = require("../models/Lead");
const Activity = require("../models/Activity");
const mongoose = require('mongoose');



exports.Filtercall = async(req, res) =>{
    try {
        const filter = {};
        if(req.query.leadId){
            if(!mongoose.Types.ObjectId.isValid(req.query.leadId)){
                return res.status(400).json({
                    success: false,
                    message: "Invalid leadId format or ID not found"
                });
            }
            filter.lead = req.query.leadId;  
        }    
        if(req.user.role === 'rep') filter.loggedBy = req.user.id;

        const calls = await Call.find(filter).populate('loggedBy', 'name')
        .sort({callDate: -1});

        res.json({success: true, count: calls.length, data: calls});
    } catch (error) {
       res.status(500).json({success: false, message: err.message});
    }
}


const updateLeadContact = async(leadId) =>{
    return Lead.findByIdAndUpdate(leadId, {
        $inc:{contactAttempts: 1},
        lastContactDate: new Date()
    }, {new: true});
};


const logActivity = async(leadId, userId, branch, type, title, description, ipAddress) =>{
    return Activity.create({
        lead: leadId,
        user: userId,
        branch,
        type,
        title,
        description, 
        ipAddress
    });
};

exports.CreateCall = async(req, res)=>{
    try {
        const { leadId, type, direction, outcome, durationMinutes, callDate, summary, nextAction } = req.body;

        if(!leadId || !type){
            return res.status(400).json({success: false, message: 'leadId and type are required'});
        }

        const call = await Call.create({
            lead: leadId,
            loggedBy: req.user.id,
            type,
            direction,
            outcome,  
            durationMinutes,
            callDate,
            summary,
            nextAction
        });

        const usersprint = await Call.populate('loggedBy', 'name');
        console.log(usersprint);

        const lead = await updateLeadContact(leadId);

        await logActivity(
            leadId,
            req.user.id,
            lead?.branch,
            type.startsWith('WhatApp')? 'Call Outbound': 'Call',
            `${type} logged - ${outcome || 'Connected'}`,
            summary || '',
            req.ip
        );

        res.status(201).json({success:  true, data: call});
    } catch (error) {
        console.log("Error reating call:", error.message);
        return res.status(500).json({success: false, message: error.message});
    }
}


exports.deleteCall = async(req, res) =>{
    try {

        if(!mongoose.Types.ObjectId.isValid(req.params.id)){
            return res.status(400).json({success: false, message: "Invalid ID"});
        }
        const deletecall = await Call.findByIdAndDelete(req.params.id);

        if(!deletecall){
            return res.status(404).json({success: false, message: 'Call not found'});
        }

        res.json({deletecall})
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
        
    }
}



