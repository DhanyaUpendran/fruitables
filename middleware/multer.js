const path = require('path');
const multer = require('multer');

// Set storage engine 
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname,'../public/img'));
    },
    filename: function(req, file, cb) {
        
        const originalName = file.originalname;
        cb(null, originalName);
        console.log(originalName);
    }
});


// Check file type function
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

const upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
}).single('image');

module.exports = upload;
