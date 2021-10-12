var aws = require("aws-sdk");
var multer = require("multer");
var multerS3 = require("multer-s3");
const BUCKET_NAME = "s3bucketjobportal"


var s3 = new aws.S3({
  accessKeyId: "",
  secretAccessKey: "",
  region: "ap-south-1",
  Bucket: BUCKET_NAME
});


var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: BUCKET_NAME,
    acl: "public-read",
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
    //   let fileType = file.mimetype.split("/")[1]
    //   cb(null, `${req.session.loggedinuser._id}.${fileType}`);
    // var fullPath = 'firstpart/secondpart/'+ newFileName;
      cb(null, `userprofile/${req.session.loggedinuser._id}.jpeg`);
    //   cb(null, `${req.session.loggedinuser._id}${Date.now()}.${fileType}`);
    },
  }),
});


// key: function(request, file, ab_callback) {
//     var newFileName = Date.now() + "-" + file.originalname;
//     var fullPath = 'firstpart/secondpart/'+ newFileName;
//     ab_callback(null, fullPath);
// },


exports.s3buckets = (req, res, next) => {
  const uploadS3 = upload.array("photo", 1);
  uploadS3(req, res, async (err) => {
    if (err) console.log('This is an error you have encountered'+err);
    next();
  });
};


exports.imageDelete = (fileName)=>{
  const params = {
    Bucket: BUCKET_NAME,       
    Key: fileName         
  }
    return new Promise((resolve, reject) => {
        s3.createBucket({
            Bucket: BUCKET_NAME
        }, function () {
            s3.deleteObject(params, function (err, data) {
                if (err) reject(err)
                else resolve(true)
            });
        });
    });
};




