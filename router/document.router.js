
const { viewDocument, CreateDocument, DownloadDocument, UpdateDocument, DeleteDocument, CountDocument, Singleview , SingleDocument} = require("../controller/document.controller");
const { Auth } = require("../middleware/Auth");
const { Router } = require('express');
const router = Router();
const { body } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const multer = require("multer");
const fs = require('fs');
const path = require('path');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, {
      recursive: true
    });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.zip', '.txt', '.csv'];

    if (allowed.includes(path.extname(file.originalname).toLocaleLowerCase())) cb(null, true);
    else cb(new Error('File type not allowed'), false);
  }
});


router.get("/viewdocument", viewDocument);
router.get("/viewdocument/:id", SingleDocument);
router.post("/document", Auth,upload.single("file"), CreateDocument);
router.get("/download", Auth, DownloadDocument);
router.put("/:id", Auth, UpdateDocument);
router.delete("/:id", Auth, DeleteDocument);
router.get("/countdocument", Auth, CountDocument);

module.exports = router;