const Document = require("../models/Document");
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const multer = require("multer");
const path = require('path');
const User = require("../models/User");
const mongoose = require('mongoose');


exports.viewDocument = async (req, res) => {
  try {
    let { leadId, docType, branch, dealValue, page = 1, limit = 50 } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 50;

    const filter = { isDeleted: false };
    if (leadId) filter.lead = leadId;
    if (docType) filter.docType = docType;
    if (branch) filter.branch = branch;
    if (dealValue) filter.dealValue = dealValue; 

    const total = await Document.countDocuments(filter);
    const docs = await Document.find(filter)
      .populate('lead', 'clientName businessName branch dealValue') 
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const formattedDocs = docs.map(doc => {
      const docObj = doc.toObject();
      docObj.dealValue = docObj.lead?.dealValue || null;
      return docObj;
    });

    res.json({success: true, total, count: formattedDocs.length, data: formattedDocs});
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.SingleDocument = async (req, res) => {
  try {

    const { id } = req.params;

    const doc = await Document.findById(id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    const filePath = path.join(__dirname, doc.filePath);

    res.sendFile(filePath);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}




exports.Singleview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid documnet ID"
      });
    }

    const doc = await Document.findOne({ _id: id, isDeleted: false })
      .populate('lead', 'clientName businessName branch')
      .populate('uploadedBy', 'name');

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Documnet not found"
      });
    }

    return res.json({
      success: true,
      data: doc
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}


exports.CreateDocument =  async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const { leadId, docType, description, documentDate, branch, invoiceAmount } = req.body;

    const doc = await Document.create({
      lead: leadId || undefined,
      uploadedBy: req.user.id,
      branch: branch || req.user.branch,
      docType: docType || "Other",

      docDate: documentDate ? new Date(documentDate) : new Date(),

      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      extension: path.extname(req.file.originalname),

      description: description || "",
      amount: invoiceAmount ? parseFloat(invoiceAmount) : undefined
    });

    res.status(201).json({
      success: true,
      data: doc
    });

  } catch (error) {

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}


exports.DownloadDocument =  async (req, res) => {
  try {
    const { docId, leadId, uploadedBy } = req.query;

    let doc;


    if (docId) {
      if (!mongoose.Types.ObjectId.isValid(docId)) {
        return res.status(400).json({ success: false, message: 'Invalid docId' });
      }
      doc = await Document.findById(docId);
    }

    else if (leadId) {
      if (!mongoose.Types.ObjectId.isValid(leadId)) {
        return res.status(400).json({ success: false, message: 'Invalid leadId' });
      }
      doc = await Document.findOne({ lead: leadId, isDeleted: false }).sort({ createdAt: -1 });
    }

    else if (uploadedBy) {
      if (!mongoose.Types.ObjectId.isValid(uploadedBy)) {
        return res.status(400).json({ success: false, message: 'Invalid uploadedBy ID' });
      }
      doc = await Document.findOne({ uploadedBy, isDeleted: false }).sort({ createdAt: -1 });
    }
    else {
      return res.status(400).json({ success: false, message: 'Please provide docId, leadId, or uploadedBy' });
    }


    if (!doc || doc.isDeleted) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }


    const filePath = path.resolve(doc.filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }
    return res.download(filePath, doc.fileName);

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}


exports.UpdateDocument = async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid document ID' });
    }

    const { name, description, docType, documentDate, invoiceAmount, invoiceNumber, isPaid } = req.body;

    const updateData = {};
    if (name !== undefined) {
      updateData.name = name;
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (docType !== undefined) {
      updateData.docType = docType;
    }

    if (documentDate !== undefined) {
      updateData.documentDate = documentDate;
    }

    if (invoiceAmount !== undefined) {
      updateData.invoiceAmount = invoiceAmount;
    }

    if (invoiceNumber !== undefined) {
      updateData.invoiceNumber = invoiceNumber;
    }

    if (isPaid !== undefined) {
      updateData.isPaid = isPaid;
    }

    const doc = await Document.findByIdAndUpdate(req.params.id, updateData, {
      new: true, runValidators: true
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    return res.json({ success: true, data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}


exports.DeleteDocument =  async(req, res) =>{
  try {
    const doc = await Document.findByIdAndDelete(req.params.id,
    
  );

    if(!doc){
      return  res.status(404).json({success:false, message: 'Document Not Found'});
    }

      res.json({success: true, message: "Document deleted"});
    
  } catch (error) {
    return res.status(500).json({success: false,
      message: error.message
    });
  }
}


exports.CountDocument =  async(req, res) =>{
  try {
    const filter = { isDeleted: false };
    const stats = await Document.aggregate([
      {$match: filter},
      {$group: {_id: '$docType', count: {$sum:1},
      totalSize: {$sum: '$fileSize'}
    }}
    ]);

    const total = await Document.countDocuments(filter);
    const totalSize = await Document.aggregate([
      {$match: filter},
      {$group: {_id: null, size: {$sum: '$fileSize'}}}
    ]);

    res.json({success: true, data: {byType: stats, total, totalSize: totalSize[0]?.size || 0}});
  } catch (error) {
    return res.status(500).json({success: false, message: err.message});
  }
}

