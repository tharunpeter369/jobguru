const { response } = require('express');
var express=require('express');
var router = express.Router();
var employerHelpers = require('../helpers/employerhelpers')
var fs = require('fs')
const { ObjectId } = require("mongodb");

require('dotenv').config();

var geocoder = require('geocoder');
const axios = require('axios');

const publisher_key = 'pk_test_51JMWkSSHW3hy98feLGeV6iTkCQpKHyrACoXbhj4q1AYtZmYNsHhiop5ivgdyu1pryEBfeSzLfk9m9xssgn0f0GVL00dL1GqNaV'
const secret_key = 'sk_test_51JMWkSSHW3hy98feC1NkwTc6QEiWRK1yUg3jXPdrPKAKisPxPEXrXaCVmlXpqHs698eVG7OMf5ejiKnzSJPVxK3F00VtrKlPDF'

const twilioconfig = require('../config/twilioconfig')

const stripe = require("stripe")(secret_key)

const client = require('twilio')(twilioconfig.accountsID,twilioconfig.authToken)

const db = require('../config/connection')


var nodemailer = require('nodemailer');
const { UserInstance } = require('twilio/lib/rest/chat/v2/service/user');



//employer page
// router.get('/',(req,res)=>{
//     res.send("employer page")
// })



// router.get('/',(req,res)=>{
//     res.render('employer1/index')
// })


//user login middelware for checking
const verifylogin=(req,res,next)=>{
    if(req.session.loggedinemployer){
        next()
    }else{
        res.redirect('/employer')
    }
}


router.get('/',(req,res)=>{
    res.render('employer1/login',{layout:'employer1/employerlayout'})
})


//login
router.post('/',(req,res)=>{
    console.log(req.body);
    employerHelpers.login(req.body).then((logedemployer)=>{
        req.session.loggedinemployer=logedemployer;
        res.json({validUser: true })
    }).catch((invalidemployer)=>{
        console.log(invalidemployer)
        res.json(invalidemployer)
    })
})


router.get('/home',verifylogin,async(req,res)=>{
    var numofusers= await employerHelpers.dashboard()
    var lengthofuser = numofusers.length
    var addedjobslength = await employerHelpers.dashboardaddedjobs(req.session.loggedinemployer)


    res.render('employer1/employer-dashboard',{layout:'employer1/employerlayout',logedemployer:req.session.loggedinemployer,lengthofuser,addedjobslength,addedjobslength })
})


router.get('/registerEmployer',(req,res)=>{
    res.render('employer1/register',{layout:'employer1/employerlayout',logedemployer:req.session.loggedinemployer})
})



//twilio mobile verification
router.post('/registerEmployer',(req,res)=>{
    console.log(req.body);
    employerHelpers.checkEmailandPhonenumber(req.body).then(()=>{
        req.session.registerdata = req.body
        console.log('lllppp');
        console.log(req.body.mobilenumber);
        
        if (req.body.mobilenumber) {
            console.log('dsdsdsdsdsdsd');
            req.body.mobilenumber
            client
            .verify
            .services(twilioconfig.serviceID)
            .verifications
            .create({
                to: `+91${req.body.mobilenumber}`,
                channel: 'sms' 
            })
            .then(data => {
                res.json({register:true})
            }) 
         } else {
            res.status(400).send({
                message: "Wrong phone number :(",
                phonenumber: req.body.mobilenumber,
                data
            })
         }
    }).catch((dataexist)=>{
        console.log(dataexist)
        if(dataexist.mobileandphonenumberexist){
            res.json(dataexist)
        }else if(dataexist.emailexist){
            res.json(dataexist)
        }else if(dataexist.mobileexist){
            res.json(dataexist)
        }
    })


    // if (req.body.mobilenumber) {
    //     client
    //     .verify
    //     .services(twilioconfig.serviceID)
    //     .verifications
    //     .create({
    //         to: `+91${req.body.mobilenumber}`,
    //         channel: 'sms' 
    //     })
    //     .then(data => {
    //         // res.redirect('/otp')
    //         console.log('kkkkkkkkkkkkkkkkkkkkk');
    //         // res.render('employer1/otp',{layout:'employer1/employerlayout',logedemployer:req.session.loggedinemployer,mobilenumber:req.body.mobilenumber})
    //         res.status(200).send({
    //             message: "Verification is sent!!",
    //             phonenumber: req.body.mobilenumber,
    //             data
    //         })
    //     }) 
    //  } else {
    //     res.status(400).send({
    //         message: "Wrong phone number :(",
    //         phonenumber: req.body.mobilenumber,
    //         data
    //     })
    //  }

})

//otp page
router.get('/otp',(req,res)=>{
    res.render('employer1/otp',{layout:'employer1/employerlayout',logedemployer:req.session.loggedinemployer,registersession:req.session.registerdata})
  
})


// Verify Endpoint  opt twilio
router.post('/verify', (req, res) => {
    console.log(req.body);
    var codee =''+`${req.body.one}${req.body.two}${req.body.three}${req.body.four}`
    console.log(codee);
    if (req.body.phonenumber && codee.length === 4) {
        console.log('am in if condition');
        client
            .verify
            .services(twilioconfig.serviceID)
            .verificationChecks
            .create({
                to: `+91${req.body.phonenumber}`,
                code: codee
            })
            .then(data => {
                console.log(data)
                if (data.status === "approved") {
                    employerHelpers.registerEmployer(req.session.registerdata).then((response)=>{
                                console.log(response)
                                res.redirect('/employer')
                                // res.json({register:true})
                            }).catch((dataexist)=>{
                                console.log('am in catch')
                                console.log(dataexist)
                                res.redirect('/employer/registerEmployer')

                            })

                    // res.status(200).send({
                    //     message: "User is Verified!!",
                    //     data
                    // })
                }else if( data.valid === false){
                    data.valid === false
                    res.send('code node match')
                }
            }).catch(data=>{
                console.log(data);
                res.send('code node match')
            })
    } else {
        console.log('am in else condition')
        res.status(400).send({
            message: "Wrong phone number or code :(",
            phonenumber: req.body.phonenumber,
            data
        })
    }
})



// router.post('/registerEmployer',(req,res)=>{
//     // console.log(req.body);
//     employerHelpers.registerEmployer(req.body).then((response)=>{
//         console.log(response)
//         res.json({register:true})
//     }).catch((dataexist)=>{
//         console.log(dataexist)
//         if(dataexist.mobileandphonenumberexist){
//             res.json(dataexist)
//         }else if(dataexist.emailexist){
//             res.json(dataexist)
//         }else if(dataexist.mobileexist){
//             res.json(dataexist)
//         }
//     })
// })


//logout user
router.get('/logout',(req,res)=>{
    console.log('am loging out');
    req.session.loggedinemployer=false;
    res.redirect('/employer')
})


//postjob
router.get('/postjob',(req,res)=>{
    console.log(req.session.loggedinemployer);
    employerHelpers.findcompanyprofile(req.session.loggedinemployer).then(async(empprofile)=>{
        console.log(empprofile);
        // var finduserprofile =await employerHelpers.checkprofile(empprofile._id)
        if(typeof empprofile == 'undefined'){
            res.redirect('/employer/profile')
        }else{
            res.render('employer1/post-job',{layout:'employer1/employerlayout',logedemployer:req.session.loggedinemployer,empprofile})
        }
    })
})


//postjob
router.post('/postjob',(req,res)=>{
    console.log(req.body);
    console.log(req.session.loggedinemployer);
    employerHelpers.postjob(req.body,req.session.loggedinemployer).then((jobid)=>{
        if(req.files){
            let jobdoc=req.files.jobfile
            console.log(jobid);
            console.log(req.files.jobfile);
            jobdoc.mv('./public/jobdocs/'+jobid+'.pdf',(err,done)=>{
                if(!err){
                    if(req.body.jobid){
                        res.redirect(`/employer/editjob?jobid=${req.body.jobid}`)
        
                    }else{
                        res.redirect(`/employer/jobquestions?jobid=${jobid}`)
                    }
                //    res.redirect(`/employer/jobquestions?jobid=${jobid}`)
                }else{
                    res.send(err)
                    console.log(err);
                }
            })
            // console.log(jobid);
            // res.redirect('/employer/postjob')
            // res.redirect(`/employer/jobquestions?jobid=${jobid}`)
        }else{
            console.log(jobid);
            // res.redirect('/employer/postjob')
            if(req.body.jobid){
                res.redirect(`/employer/editjob?jobid=${req.body.jobid}`)

            }else{
                res.redirect(`/employer/jobquestions?jobid=${jobid}`)
            }
        }
        // console.log(jobid);
        // res.redirect('/employer/postjob')
    }).catch((nosubsciption)=>{
        // console.log(userexist)
        if(nosubsciption){
        res.redirect('/employer/subscription')
        }else{
            res.send('some error')
        }
      })
})

router.get('/profile',verifylogin,(req,res)=>{
        employerHelpers.showprofiledata(req.session.loggedinemployer).then((profiledispalydata)=>{
            console.log(profiledispalydata);
            if(profiledispalydata){
                res.render('employer1/company-profile',{layout:'employer1/employerlayout',logedemployer:req.session.loggedinemployer,profiledispalydata})
            }else{
                res.render('employer1/company-profile',{layout:'employer1/employerlayout',logedemployer:req.session.loggedinemployer})
            }
        }).catch((nofind)=>{
            if(nofind==false){
                res.render('employer1/company-profile',{layout:'employer1/employerlayout',logedemployer:req.session.loggedinemployer})
                // res.send('no data')
            }
        })
    
})

router.post('/profile',(req,res)=>{
    employerHelpers.profileupdate(req.body,req.session.loggedinemployer).then(()=>{
        res.redirect('/employer/profile')
    })
})


//image upload edit profile 
router.post('/imageupload',function(req,res){
    console.log(req.body.image)
    let id=req.session.loggedinemployer._id
    console.log(id)
    const path = ('./public/employprofile/'+id+'.png')
    const imgdata = req.body.image;
    const base64Data = imgdata.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    fs.writeFileSync(path, base64Data,  {encoding: 'base64'});

  })


  //listed job
  router.get('/managejob',verifylogin,function(req,res){
    if(!req.session.loggedinemployer){
        res.redirect('/employer')
    }else{
        employerHelpers.fetchpostedjob(req.session.loggedinemployer).then((listedjob)=>{
            res.render('employer1/manage-jobs',{layout:'employer1/employerlayout',logedemployer:req.session.loggedinemployer,listedjob})
        })
    }
  })



  //need to complete
//   router.get('/appliedcandidate',verifylogin,function(req,res){
//     console.log(req.query);
//     employerHelpers.getappliedusers(req.session.loggedinemployer,req.query).then((applieduserdetails)=>{
//         console.log(applieduserdetails);
//         if(applieduserdetails != false){
//         res.render('employer1/appliedcandidates',{layout:'employer1/employerlayout',logedemployer:req.session.loggedinemployer,applieduserdetails,jobid:req.query})
//         }else{
//             res.send('no data')
//         }
//     })
//   })


  //ajax
    //need to complete
    router.post('/appliedcandidate',verifylogin,function(req,res){
        console.log(req.body)
        employerHelpers.getappliedusers(req.session.loggedinemployer,req.body).then((applieduserdetails)=>{
            console.log('hellooo world');
            console.log(applieduserdetails);
            if(applieduserdetails != false){
                req.session.applieduserdetailstr=applieduserdetails
                res.json({applieduserdetails:true,jobid:req.body.jobid})
            // res.render('employer1/appliedcandidates',{layout:'employer1/employerlayout',logedemployer:req.session.loggedinemployer,applieduserdetails,jobid:req.query})
            }else{  
                // res.send('no data')
                res.json({applieduserdetails:false})
            }
        })
      })


    router.get('/appliedcandidatetrue',verifylogin,function(req,res){
        console.log('helloooo world');
        console.log(req.query);
        res.render('employer1/appliedcandidates',{layout:'employer1/employerlayout',logedemployer:req.session.loggedinemployer,applieduserdetails:req.session.applieduserdetailstr,jobid:req.query})
        req.session.applieduserdetailstr=false
  })


 //short listed candidate
  router.post('/shortlisted',verifylogin,function(req,res){
      console.log(req.body);
      employerHelpers.getshortlisted(req.body).then((users)=>{
          if(users){
              console.log(users)
              users.forEach(element => {

                  element.jobid = req.body.jobid
              });
              console.log(users);
              req.session.shortlistusr = users
              res.json({shortlist:true})
            // res.render('employer1/shortlisted',{layout:'employer1/employerlayout',users,logedemployer:req.session.loggedinemployer})
          }else{
              res.json({shortlist:false})
          }
      }).catch((elem)=>{
          if(elem){
            res.json({shortlist:false})
          }
      })
  })

  //ajax redirect
  router.get('/shortlistedredirect',verifylogin,function(req,res){
            res.render('employer1/shortlisted',{layout:'employer1/employerlayout',users:req.session.shortlistusr,logedemployer:req.session.loggedinemployer})
  })


//   router.get('/candidateprofile',function(req,res){
//     //   res.send('hellooooo')
//       res.render('employer1/single-candidates',{layout:'employer1/employerlayout'})
//   })

  router.get('/viewapplieduserprofile',verifylogin,function(req,res){
    // console.log(req.query);
    employerHelpers.individualprofile(req.query).then((userdata)=>{
        // var ski = jobdetail.skills.split(',')
        // jobdetail.skill = ski
        if(userdata.skills){
            var ski = userdata.skills.split(',')
            userdata.skill =ski
            console.log(userdata);
        }
        res.render('employer1/single-candidates',{layout:'employer1/employerlayout',logedemployer:req.session.loggedinemployer,userdata})
    })
  })





  router.get('/download-pdf', (req, res, next) => {
      console.log(req.query);
    // const filePath = __dirname + '/docs/static-resume.pdf';
    // const filePath = './public/resume/' + req.query.user_id + '-resume.pdf';
    const filePath = './public/resume/' + req.query.userid + "-resume.pdf";
    fs.lstat(filePath, (err, stats) => {
        if(err){
            // return console.log(err); //Handle error
            res.send('file not uploaded')

        }else{
            res.download(filePath);
        }
            
    });

});



  router.get('/showAllAppliedJobByUser',verifylogin,function(req,res){
      console.log(req.query)
      employerHelpers.findAllappliedJobByuser(req.query).then((userAppliedjobs)=>{
          res.render('employer1/useralljobs',{layout:'employer1/employerlayout',userAppliedjobs,logedemployer:req.session.loggedinemployer})
      })
  })


  router.get('/viewpdfresume',verifylogin,function(req,res){
      console.log(req.query);
    res.render('employer1/resumepdf',{layout:'employer1/employerlayout',user_id:req.query,logedemployer:req.session.loggedinemployer})
  })



    //resumeview
//   router.get('/resumeview',verifylogin,function(req,res){
//       console.log(req.query);
//       employerHelpers.showcreatedresume(req.query).then((resumedata)=>{
//           console.log('hello worlddddddddddd')
//           console.log(resumedata);
//         // res.render('employer1/resume',{layout:'employer1/emplayout3',resumedata,logedemployer:req.session.loggedinemployer})
//         if(typeof resumedata != 'undefined'){
//             res.render('employer1/resume',{layout:'employer1/emplayout3',resumedata,logedemployer:req.session.loggedinemployer})
//         }else{
//             res.send('resume data not updated')
//         }
//       })
//   })



      //resumeview
      router.post('/resumeview',verifylogin,function(req,res){
        console.log(req.body);
        employerHelpers.showcreatedresume(req.body).then((resumedata)=>{
            console.log(resumedata);
          // res.render('employer1/resume',{layout:'employer1/emplayout3',resumedata,logedemployer:req.session.loggedinemployer})
          if(typeof resumedata != 'undefined'){
              req.session.resumedata = resumedata
              res.json(resumedata =true)
            //   res.render('employer1/resume',{layout:'employer1/emplayout3',resumedata,logedemployer:req.session.loggedinemployer})
          }else{
              res.json(resumedata=false)
          }
        })
    })


//  resumeview
//   router.get('/resumeview',verifylogin,function(req,res){
//             res.render('employer1/resume',{layout:'employer1/emplayout3',resumedata:req.session.resumedata,logedemployer:req.session.loggedinemployer})
//             // req.session.resumedata =false
//   })

  //  resumeview
  router.get('/resumeview',verifylogin,function(req,res){
               res.render('employer1/resume',{layout:'employer1/emplayout3',resumedata:req.session.resumedata,logedemployer:req.session.loggedinemployer})
    // req.session.resumedata =false
})


  router.get('/jobquestions',verifylogin,function(req,res){
      console.log(req.query);
      res.render('employer1/jobquestions',{layout:'employer1/emplayout3',job:req.query})
  })


  router.post('/jobquestions',function(req,res){
      console.log(req.body)
      employerHelpers.pushQuestions(req.body).then(()=>{
          res.redirect(`/employer/jobquestions?jobid=${req.body.jobid}`)
      })
  })


  //****subscriotion
  router.get('/subscription',verifylogin,function(req,res){
    //   res.render('employer1/dummy',{publisherkey:publisher_key})
      res.render('employer1/subscription',{layout:'employer1/emplayout3',publisherkey:publisher_key,logedemployer:req.session.loggedinemployer})
  })


  // routes
//paymenet
  router.post('/payment', function(req, res){ 
      console.log(req.body)
    // Moreover you can take more details from user 
    // like Address, Name, etc from form 
    stripe.customers.create({ 
        email: req.body.stripeEmail, 
        source: req.body.stripeToken, 
        name: 'Gautam Sharma', 
        address: { 
            line1: 'TC 9/4 Old MES colony', 
            postal_code: '110092', 
            city: 'New Delhi', 
            state: 'Delhi', 
            country: 'India', 
        } 
    }) 
    .then((customer) => { 
        return stripe.charges.create({ 
            amount: req.body.price*100,    
            description: req.body.plan, 
            currency: 'inr', 
            customer: customer.id 
        }); 
    }) 
    .then((charge) => { 
        // console.log(req.body.plan);
        // console.log(charge);
        employerHelpers.subscriptiondone(req.body.plan,req.session.loggedinemployer).then(()=>{
            res.redirect('/employer/postjob')
        })
        // res.send(charge) // If no error occurs 
    }) 
    .catch((err) => { 
        res.send(err)    // If some error occurs 
    }); 


    }) 


    //paymenet
  router.post('/payment', function(req, res){ 
    console.log(req.body)
  // Moreover you can take more details from user 
  // like Address, Name, etc from form 
  stripe.customers.create({ 
      email: req.body.stripeEmail, 
      source: req.body.stripeToken, 
      name: 'Gautam Sharma', 
      address: { 
          line1: 'TC 9/4 Old MES colony', 
          postal_code: '110092', 
          city: 'New Delhi', 
          state: 'Delhi', 
          country: 'India', 
      } 
  }) 
  .then((customer) => { 
      return stripe.charges.create({ 
          amount: 500*100,    
          description:'base', 
          currency: 'inr', 
          customer: customer.id 
      }); 
  }) 
  .then((charge) => { 
      // console.log(req.body.plan);
      // console.log(charge);
      employerHelpers.subscriptiondone('base',req.session.loggedinemployer).then(()=>{
          res.redirect('/employer/postjob')
      })
      // res.send(charge) // If no error occurs 
  }) 
  .catch((err) => { 
      res.send(err)    // If some error occurs 
  }); 


  }) 




    //paymenet 1
     router.post('/payment1', function(req, res){ 
        console.log(req.body)
      // Moreover you can take more details from user 
      // like Address, Name, etc from form 
      stripe.customers.create({ 
          email: req.body.stripeEmail, 
          source: req.body.stripeToken, 
          name: 'Gautam Sharma', 
          address: { 
              line1: 'TC 9/4 Old MES colony', 
              postal_code: '110092', 
              city: 'New Delhi', 
              state: 'Delhi', 
              country: 'India', 
          } 
      }) 
      .then((customer) => { 
          return stripe.charges.create({ 
              amount: 4000*100,    
              description: 'gold', 
              currency: 'inr', 
              customer: customer.id 
          }); 
      }) 
      .then((charge) => { 
          // console.log(req.body.plan);
          // console.log(charge);
          employerHelpers.subscriptiondone('gold',req.session.loggedinemployer).then(()=>{
              res.redirect('/employer/postjob')
          })
          // res.send(charge) // If no error occurs 
      }) 
      .catch((err) => { 
          res.send(err)    // If some error occurs 
      }); 
      }) 



     //paymenet 2
     router.post('/payment2', function(req, res){ 
                console.log(req.body)
              // Moreover you can take more details from user 
              // like Address, Name, etc from form 
              stripe.customers.create({ 
                  email: req.body.stripeEmail, 
                  source: req.body.stripeToken, 
                  name: 'Gautam Sharma', 
                  address: { 
                      line1: 'TC 9/4 Old MES colony', 
                      postal_code: '110092', 
                      city: 'New Delhi', 
                      state: 'Delhi', 
                      country: 'India', 
                  } 
              }) 
              .then((customer) => { 
                  return stripe.charges.create({ 
                      amount: 10000*100,    
                      description: 'platinum', 
                      currency: 'inr', 
                      customer: customer.id 
                  }); 
              }) 
              .then((charge) => { 
                  // console.log(req.body.plan);
                  // console.log(charge);
                  employerHelpers.subscriptiondone('platinum',req.session.loggedinemployer).then(()=>{
                      res.redirect('/employer/postjob')
                  })
                  // res.send(charge) // If no error occurs 
              }) 
              .catch((err) => { 
                  res.send(err)    // If some error occurs 
              }); 
            
            
        }) 

    router.get('/acceptjob',function(req,res){
        console.log(req.query);
        employerHelpers.acceptedjob(req.query,req.session.loggedinemployer).then(()=>{
            res.redirect('/employer/managejob')
        })
    })


    router.get('/editjob',verifylogin,function(req,res){
        console.log(req.query);
        employerHelpers.editjob(req.query,req.loggedinemployer).then(async(addedjob)=>{
           var empprofile= await employerHelpers.findcompanyprofile(req.session.loggedinemployer)
           console.log(empprofile);
           console.log(addedjob)
            if(typeof addedjob != 'undefined'){
                res.render('employer1/post-job-edit',{layout:'employer1/employerlayout',logedemployer:req.session.loggedinemployer,empprofile,addedjob})
            }
        })
    })


    router.get('/machanetest',verifylogin,function(req,res){
        console.log(req.query)
        employerHelpers.getUserTestAnswer(req.query).then((testanswer)=>{
            res.render('employer1/machane_test',{layout:'employer1/employerlayout',user:req.query,logedemployer:req.session.loggedinemployer,testanswer})
        })
    })


    router.post('/machanetest',function(req,res){
        // console.log('hello world');
        // console.log(req.body)
        // console.log(req.files);
        // if(req.files){
        //     employerHelpers.updatemachanetest(req.body)
        // }
        employerHelpers.getuserdetailsformachanetest(req.body).then(async(userdata)=>{
            if(req.files){
                var storedatabase= await employerHelpers.updatemachanetest(req.body)
                let machanetestfile=req.files.testfile
                machanetestfile.mv('./public/machanetest/'+req.body.userid+req.body.jobid+'.pdf',(err,done)=>{
                    if(err){
                        res.send(err)
                        console.log(err);
                    }
                })
                // console.log(jobid);
                // res.redirect('/employer/postjob')
                // res.redirect(`/employer/jobquestions?jobid=${jobid}`)
            }

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user:'tharuntestemail@gmail.com',
                pass:'9544335325.tharun'
            }
          });

          var mailOptions = {
            from: 'compassengineer369@gmail.com',
            to: 'tharunpeter369@gmail.com',
            subject: 'machane test from jobgury',
            text: req.body.descripton,
            attachments: [
                {
                    filename: req.files.name,
                    path: './public/machanetest/'+req.body.userid+req.body.jobid+'.pdf'
                    
                }
            ]
          };
          

          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
              res.redirect(`/employer/machanetest?userid=${req.body.userid}&jobid=${req.body.jobid}`)
            }
          });


        })

    })


    router.get('/downloadMachaneTestanswer-pdf',(req,res)=>{
        console.log(req.query)
        const filePath = './public/machanetestanswer/' + req.query.machanetestid +".zip";
        fs.lstat(filePath, (err, stats) => {
            if(err){
                // return console.log(err); //Handle error
                res.send('file not uploaded')
            }else{
                res.download(filePath);
            }
        });
    }
    )

    



module.exports = router;