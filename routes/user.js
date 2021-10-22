var express = require('express');
var router=express.Router()
var userHelpers = require('../helpers/userhelpers')
var fs = require('fs')
const {s3buckets} = require("../helpers/s3bucket");    //s3bucket
require('dotenv').config();
require('../public/javascripts/passport-setup')
const passport = require("passport");
const { route } = require('./employer');
router.use(passport.initialize())
router.use(passport.session())
const NodeGeocoder = require('node-geocoder');
const axios = require('axios');
const request = require('request');
const db = require('../config/connection')
const pdf = require('html-pdf');
// const expressLayouts = require('express-ejs-layouts');
const dynamicResume = require('../docs/dynamic-resume');;
const staticResume = require('../docs/static-resume');;
const options = {
    "height": "10.5in",        // allowed units: mm, cm, in, px
    "width": "8in",            // allowed units: mm, cm, in, pxI
};
const twilioconfig = require('../config/twilioconfig')
const client = require('twilio')(twilioconfig.accountsID,twilioconfig.authToken)





//verifylogin
const verifylogin=(req,res,next)=>{
    if(req.session.loggedinuser){
        next()
    }else{
        res.redirect('/loginuser')
    }
}


//candidate home page
router.get("/",async(req,res)=>{
    console.log(req.session.loggedinuser);
    //  res.render('user/index',{layout:'user/userlayout',logedinuser:req.session.loggedinuser})
    var jobcount =await userHelpers.findTotaljobsCount()

    console.log(jobcount);

     res.render('user/index-2',{layout:'user/userlayout3',logedinuser:req.session.loggedinuser,jobcount})
})

router.get('/login',(req,res)=>{
    res.render('user/login',{layout:'user/userlayout3',logedinuser:req.session.loggedinuser})
})

router.get('/register',(req,res)=>{
    res.render('user/register',{layout:'user/userlayout3',logedinuser:req.session.loggedinuser})
})


//user registration
router.post('/registerUser',(req,res)=>{
    userHelpers.registeruser(req.body).then(()=>{
        res.json({register:true})
    }).catch((dataexist)=>{
        if(dataexist.mobileandphonenumberexist){
            res.json(dataexist)
        }else if(dataexist.emailexist){
            res.json(dataexist)
        }else if(dataexist.mobileexist){
            res.json(dataexist)
        }
    })
})


//login user
router.post('/loginuser',(req,res)=>{
    userHelpers.loginUser(req.body).then((logedinuser)=>{
        req.session.loggedinuser=logedinuser;
        res.json({validUser: true })
    }).catch((invaliduser)=>{
        res.json(invaliduser)
    })
})

//logout user
router.get('/logout',(req,res)=>{
    console.log('am loging out');
    req.session.loggedinuser=false;
    res.redirect('/')
})

//otp login

//twilio mobile verification


router.post('/checkmobilenumber',(req,res)=>{
    console.log(req.body);
    userHelpers.checkPhonenumber(req.body).then((checkingphonenum)=>{
        console.log(checkingphonenum)
        req.session.mobilenum = req.body.phonenumber
        if (req.body.phonenumber) {
            client
            .verify
            .services(twilioconfig.serviceID)
            .verifications
            .create({
                to: `+91${req.body.phonenumber}`,
                channel: 'sms' 
            }).then(data => {
                // console.log(data)
                res.json({otpsend:true})
            }).catch(data =>{
                // console.log(data);
                res.send('error')
            })
         } else {
             console.log('something went wrong');
            res.status(400).send({
                message: "Wrong phone number :(",
                phonenumber: req.body.mobilenumber,
                data
            })
         }
    }).catch((dataexist)=>{
        console.log(dataexist)
        if(dataexist==false){
            res.json(dataexist)
        }
    })
})

//otp page

router.get('/otplogin',(req,res)=>{
    // res.render('user/otplogin',{layout:'employer1/employerlayout',logedemployer:req.session.loggedinemployer,registersession:req.session.registerdata})
    res.render('user/otplogin',{layout:'user/userlayout3'})
})


// Verify Endpoint  opt twilio

router.post('/verify', (req, res) => {
    console.log(req.body);
    var codee =''+`${req.body.one}${req.body.two}${req.body.three}${req.body.four}`
    console.log(codee);
    if (req.session.mobilenum  && codee.length === 4) {
        client
            .verify
            .services(twilioconfig.serviceID)
            .verificationChecks
            .create({
                to: `+91${req.session.mobilenum}`,
                code: codee
            })
            .then(data => {
                if (data.status === "approved") {
                    userHelpers.loginUserotp(req.session.mobilenum).then((logedinuser)=>{
                        req.session.loggedinuser=logedinuser;
                        res.json({validUser: true })
                        req.session.mobilenum=false
                    }).catch((invaliduser)=>{
                        res.json({validUser: false })
                    })
                }else if( data.valid === false){
                    res.json({validUser: false })
                    req.session.mobilenum=false
                }
            })
    } else {
        res.status(400).send({
            message: "Wrong phone number or code :(",
            phonenumber: req.body.phonenumber,
            data
        })
    }
})



//browsjobs
router.get('/browsejobs',(req,res)=>{
    console.log(req.query);
    userHelpers.fetchaddedjobs(req.session.loggedinuser).then((listedjo)=>{
        if(req.session.loggedinuser){
            listedjo.forEach((data)=>{
                if(data.applied_users){
                    data.applied_users.forEach((user)=>{
                        if(user == req.session.loggedinuser._id){
                            data.userapplied = true
                        }
                    })
                }
            })
        }
        const page =parseInt(req.query.next)
        console.log(parseInt(req.query.next));
        const limit =5
        const startIndex = (page-1)*limit
        const endIndex = page * limit 
        const listedjob = {}
        if(endIndex < listedjo.length){
            listedjob.next = {
                page:page+1,
                limit:limit,
            }
        }
        if(startIndex > 0){
            listedjob.prev = {
                page:page-1,
                limit:limit,
            }
        }
        listedjob.listedjobs = listedjo.slice(startIndex,endIndex)
        // res.json(result)
        // res.pagingatedResults = result
        res.render('user/dummy',{layout:'user/userlayout3',logedinuser:req.session.loggedinuser,listedjob})
        // res.render('user/dummy',{layout:'user/userlayout3',logedinuser:req.session.loggedinuser})
        // res.render('user/job-list-sidebar',{layout:'user/userlayout3',logedinuser:req.session.loggedinuser,listedjobs:listedjob.unaplied,aplliedjob:listedjob.applied})
    })
})



// function pagingatedResults(model){
//     return (req,res,next)=>{
//         const page =parseInt(req.query.page)
//         const limit =parseInt(req.query.limit) 
//         const startIndex = (page-1)*limit
//         const endIndex = page * limit 
//         const result = {}
//         if(endIndex < model.length){
//             result.next = {
//                 page:page+1,
//                 limit:limit,
//             }
//         }
//         if(startIndex > 0){
//             result.prev = {
//                 page:page-1,
//                 limit:limit,
//             }
//         }
//         result.result = model.slice(startIndex,endIndex)
//         // res.json(result)
//         res.pagingatedResults = result
//         next()
//     }
// }


//filterdata
router.get('/filterdata',(req,res)=>{
    console.log(req.query)
   
    console.log(req.query.next);
    if(!req.query.next){
        req.session.fromfileter = req.query   
    }else{
        req.session.fromfileter =req.query
    }
    userHelpers.getfilterjob(req.session.logedinuser,req.session.fromfileter).then((filterdat)=>{
        if(req.session.loggedinuser){
            filterdat.forEach((data)=>{
                if(data.applied_users){
                    data.applied_users.forEach((user)=>{
                        if(user == req.session.loggedinuser._id){
                            data.userapplied = true
                        }
                    })
                }
            })
        }
        
        req.query.next = req.query.next || 1
        page=parseInt(req.query.next)
        const limit =5
        const startIndex = (page-1)*limit
        const endIndex = page * limit 
        const filterdata = {}
        if(endIndex < filterdat.length){
            filterdata.next = {
                page:page+1,
                limit:limit,
            }
        }
        if(startIndex > 0){
            filterdata.prev = {
                page:page-1,
                limit:limit,
            }
        }
        filterdata.filterdat = filterdat.slice(startIndex,endIndex)
        console.log(filterdata);
        res.json(filterdata)
    })
})



router.get('/jobInDetails',(req,res)=>{
    userHelpers.showDtaiileofjob(req.query).then(async(jobdetail)=>{
        req.session.testcompleted=true
        if(req.session.loggedinuser){
            if(jobdetail.applied_users){
                jobdetail.applied_users.forEach((user)=>{
                    if(user == req.session.loggedinuser._id){
                        jobdetail.userapplied = true
                    }
                })
            }
        }
        console.log(jobdetail);
       var questioncheck =await userHelpers.jobquestoncheck(jobdetail._id)
        res.render('user/job-page',{layout:'user/userlayout3',jobdetail,questioncheck,logedinuser:req.session.loggedinuser})
    })        
})



// show resume page or profile
router.get('/createresume',verifylogin,(req,res)=>{
    if(req.session.loggedinuser){
        userHelpers.getprofiledetails(req.session.loggedinuser).then((userprofiledata)=>{
            res.render('user/profile',{layout:'user/userlayout3',logedinuser:req.session.loggedinuser,userprofiledata})
        })
    }else{
        res.redirect('/login')
    }
})


//createresume
router.post('/createresume',(req,res)=>{
    console.log(req.files);
    // console.log(req.body);
    const userName = req.body.profilename;
    const lowercaseName = userName.toLowerCase();
    const noSpaceName = lowercaseName.replace(' ', '');
    const shortName = noSpaceName.slice(0, 10);
    console.log("short name: ", shortName);
    
    if (req.body) {
        themeOptions = {
            leftTextColor: "rgb(183, 217, 255)",
            leftBackgroundColor: 'rgb(0, 119, 89)',
            wholeBodyColor: ' rgb(rgb(139, 247, 205))',
            rightTextColor: 'rgb(0, 119, 89)'
        };
        req.body.userid=req.session.loggedinuser._id
        console.log(req.body);

        // HTML TO PDF CONVERTING   
        pdf.create(dynamicResume(req.body, themeOptions,), options).toFile('./public/resume/' + req.body.userid + "-resume.pdf", (error, response) => {
            if (error) throw Error("File is not created");
            // console.log(response.filename);
            // res.sendFile(response.filename);
        });
    }

    userHelpers.updateResume(req.body,req.session.loggedinuser).then(()=>{
        if(req.files){
            let image = req.files.image
            if(image){
                image.mv('./public/userprofile/'+req.session.loggedinuser._id+'.jpg',(err,done)=>{
                    if(err){f
                        console.log(err);
                    }else if(!req.files.resumefile){
                        res.redirect('/createresume')
                    }
                })
            }
            let resume= req.files.resumefile
            if(resume){
                resume.mv('./public/userresume/'+req.session.loggedinuser._id+".pdf",(err,done)=>{
                    if(err){
                        console.log(err)
                    }else{
                        res.redirect('/createresume')
                    }
                })
            }
        }else{
            res.redirect('/createresume')
        }
    })
})



// //image upload edit profile 
// router.post('/userimageupload',function(req,res){
//     console.log('jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj');
//     // console.log(req.body.image)
//     // let id=req.session.loggedinuser._id
//     var id=789
//     //  console.log(id)
//     const path = ('./public/userprofile/'+id+'.png')
//     const imgdata = req.body.image;
//     const base64Data = imgdata.replace(/^data:([A-Za-z-+/]+);base64,/, '');
//     console.log(base64Data);
//     console.log(path);
//     // console.log(base64Data);
//     fs.writeFileSync(path, base64Data,  {encoding: 'base64'});
//   })



//applyjob

router.get('/applyjob',(req,res)=>{
    console.log(req.query);
    if(req.query.from == 'jobdetail'){
        res.redirect(`/jobInDetails?jobid=${req.query.jobid}`)
    }
    if(!req.session.loggedinuser){
        res.redirect('/login')
    }else{
        userHelpers.checkForprofile(req.session.loggedinuser).then((checkresult)=>{
            if(checkresult==false){
                res.redirect('/createresume')
            }else{
                    // res.send('applying to job')
                    userHelpers.applyingjob(req.session.loggedinuser,req.query).then(()=>{
                        if(req.query.route == 'homesearch'){
                            res.redirect('/homesearch')

                        }else if(req.query.from == 'jobdetail'){
                            res.redirect(`/jobInDetails?jobid=${req.query.jobid}`)
                        }
                        else{
                            res.redirect('/browsejobs')
                        }
                })
            }
        })
    }
})



//ajax

router.post('/applyjob',(req,res)=>{
    console.log('am apply job router')
    console.log(req.body);
    // if(req.query.from == 'jobdetail'){
    //     res.redirect(`/jobInDetails?jobid=${req.query.jobid}`)
    // }
    // res.json(true)
    if(!req.session.loggedinuser){

        res.json(false)
        // res.redirect('/login')
    }else{
        userHelpers.checkForprofile(req.session.loggedinuser).then((checkresult)=>{
            if(checkresult==false){
                console.log('chekresult is false');
                res.json(createresult = true)
                // res.redirect('/createresume')
                // res.json(false)
            }else{

                // res.json(true)
                    // res.send('applying to job')
                    userHelpers.applyingjob(req.session.loggedinuser,req.body).then(()=>{
 
                        res.json(true)
                        // if(req.query.route == 'homesearch'){
                        //     res.redirect('/homesearch')

                        // }else if(req.query.from == 'jobdetail'){
                        //     res.redirect(`/jobInDetails?jobid=${req.query.jobid}`)
                        // }
                        // else{
                        //     res.redirect('/browsejobs')
                        // }
                })
            }
        })
    }


})



//searchprofile
router.get('/searchprofile',(req,res)=>{
    console.log(req.query)
    userHelpers.searchFiled(req.session.loggedinuser,req.query).then((searchdata)=>{
        res.json(searchdata)
    })
})



//companyprofile
router.get('/companyprofile',(req,res)=>{
    userHelpers.getemployerprofile(req.session.loggedinuser,req.query).then(async(employerprofile)=>{
        var findemployerlistedjob = await userHelpers.findemplistedAllJob(employerprofile.employer_id)
        if(findemployerlistedjob){
            var positionlength = findemployerlistedjob.length
            console.log(positionlength);
        }
        res.render('user/single-company',{layout:'user/userlayout3',employerprofile,findemployerlistedjob,positionlength,logedinuser:req.session.loggedinuser})
    })
})



//search jobs home page
router.get('/homesearch',(req,res)=>{
    console.log(req.query)
    console.log(req.session.loggedinuser);
    userHelpers.Homesearchjobs(req.session.logedinuser,req.query).then(async(searchresult)=>{
      if(req.session.loggedinuser){
        searchresult.forEach((data)=>{
            if(data.applied_users){
              data.applied_users.forEach((user)=>{
                if(user == req.session.loggedinuser._id){
                   data.userapplied = true
                }
              })
            }
         })
      }
      console.log(searchresult)
        let userId = false
        if (req.session.loggedinuser) userId = req.session.loggedinuser._id;
        res.render('user/homesearchresult',{layout:'user/userlayout3',searchresult,userId,logedinuser:req.session.loggedinuser})
    })
    // res.send('hiiii')
})


//resume post
router.get('/resumecreation',verifylogin,(req,res)=>{
    console.log(req.query)
    userHelpers.resumedataupdate(req.query,req.session.loggedinuser).then((alldata)=>{
        res.render('user/candidate-dashboard-resume',{layout:'user/userlayout3',resume:alldata,logedinuser:req.session.loggedinuser})
    })
})



//upload
router.post('/upload',(req,res)=>{
    console.log(req.files);
    if(req.files){
        let image = req.files.file
        if(image){
            image.mv('./public/resumeProfile/'+req.session.loggedinuser._id+'.jpg',(err,done)=>{
                if(err){
                    console.log(err);
                }else{
                    res.redirect('/resumecreation')
                }
            })
        }
    }
})






  /* google authentication*/

//googlesuccess 
router.get('/googlesuccess',(req,res)=>{
    console.log(req.user)
    userHelpers.registerusergoogle(req.user).then((logedinuser)=>{
        req.session.loggedinuser=logedinuser;
        res.redirect('/')
    })

  })
  
  
  //googel login failed
  router.get('/failed',(req,res)=>{
    res.send('failed')
  })
  
  
  //googel log in get request
  router.get('/google',passport.authenticate('google',{scope:['profile','email']}))
  

  //googel log in authentication
  router.get('/google/callback',passport.authenticate('google',{failureRedirect:'/failed'}),(req,res)=>{
    res.redirect('/googlesuccess')
  })


// multichooice question 
  router.get('/MCQtest',verifylogin,(req,res)=>{
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    if(req.session.testcompleted==true){
        userHelpers.findQuestions(req.query).then((jobdetailquesion)=>{
            if(jobdetailquesion.questions){
              res.render('user/jobquestionsuser',{layout:'user/userlayout3',jobdetailquesion,logedinuser:req.session.loggedinuser})
            }
        })
    }
  })

  router.post('/MCQtest',(req,res)=>{
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    userHelpers.checkansswers(req.body,req.session.loggedinuser).then((mcqscore)=>{
        req.session.testcompleted=false
        res.render('user/mcqresultpage',{layout:'user/userlayout3',mcqscore,logedinuser:req.session.loggedinuser})
    })
})

 /* dont delete this shit */

// router.post("/s3buck",  (req, res) => {

//     console.log(req.body);
//     let image1 = req.body.file;
//     const path1 = `./public/resumeProfile/001.jpg`; 
//     const base64Data1 = image1.replace(/^data:([A-Za-z-+/]+);base64,/, '');
//     fs.writeFileSync(path1, base64Data1, {
//         encoding: 'base64'
//     });
// })


// ,s3bucket

    router.get('/s3buck',(req,res)=>{
        res.render('user/imageform')
    })

    router.post(`/s3buck`,s3buckets,(req, res) => {
        // let tagId = req.session.admin.userId;
        console.log('hello world...')
        console.log(req.body);
        console.log(req.files);
        console.log(req.body.files);
        let formData = req.body;
    });


    router.get('/machanetestdata',verifylogin,(req,res)=>{
        userHelpers.getMachanetestdata(req.session.loggedinuser).then((machanetestdata)=>{
            res.render('user/machanetestuser',{layout:'user/userlayout4',machanetestdata,logedinuser:req.session.loggedinuser})
        })
    })


    router.get('/downloadMachaneTest-pdf',(req,res)=>{
        console.log(req.query)
        console.log(req.query.userid+req.query.jobid)

        const filePath = './public/machanetest/' + req.query.userid+req.query.jobid +".pdf";
        fs.lstat(filePath, (err, stats) => {
            if(err){
                // return console.log(err); //Handle error
                res.send('file not uploaded')
            }else{
                res.download(filePath);
            }
        });
    })


    router.get('/submitmachanetest',verifylogin,(req,res)=>{
        console.log(req.query)
        userHelpers.getMachaneTestRequirement(req.query).then((machaneTestData)=>{

            if(machaneTestData.data.githublink=='on'){
                machaneTestData.githublink=true
            }else{
                machaneTestData.githublink=false
            }
            if(machaneTestData.data.file=='on'){
                machaneTestData.file=true
            }else{
                machaneTestData.file=false
            }
            if(machaneTestData.data.hostedlink=='on'){
                machaneTestData.hostedlink=true
            }else{
                machaneTestData.hostedlink=false
            }
            console.log(machaneTestData)
             res.render('user/machane_testuser',{layout:'user/userlayout4',machaneTestData,logedinuser:req.session.loggedinuser})
        })
       
    })

    router.post('/submitmachanetest',(req,res)=>{
        console.log(req.body)
        console.log(req.files)
        userHelpers.machneTestanser(req.body).then(()=>{
            if(req.files){
                req.files.answerfile.mv('./public/machanetestanswer/'+req.body.testid+".zip",(err,done)=>{
                    if(err){
                        console.log(err)
                    }else{
                        res.redirect('/')
                    }
                })
            }else{
                res.send('something went wrong')
            }

        })

    })


    router.get('/deletetest',(req,res)=>{
        console.log(req.query)
        userHelpers.deleteTest(req.query).then((deletedata)=>{
            res.redirect('/machanetestdata')
        })
    })



module.exports=router;
