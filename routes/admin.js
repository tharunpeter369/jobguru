var express = require('express');
const { Db } = require('mongodb');
const { findJobDetails } = require('../helpers/adminhelpers');
var router = express.Router();
var adminhelpers = require('../helpers/adminhelpers')

// router.get('/',(req,res)=>{
//     res.render('admin/dashboard')
//     // res.send('admin router')
// })

//user login middelware for checking
const verifylogin=(req,res,next)=>{
    if(req.session.adminlogged){
        next()
    }else{
        res.redirect('/admin')
    }
}



router.get('/',(req,res)=>{
    res.render('admin/my-account')
    // res.send('admin router')
})

router.post('/login',(req,res)=>{
    console.log(req.body)
    if(req.body.uername='tharun' && req.body.password==123){
        req.session.adminlogged = 'Tharun'
        res.redirect('/admin/dashboard')
    }
})

router.get('/logout',(req,res)=>{
    req.session.adminlogged = false
    res.redirect('/admin')
    // res.send('logout')
})

 //dashboard
router.get('/dashboard',verifylogin,async(req,res)=>{
    var totemployer = await adminhelpers.totemployer()
    if(!totemployer){
        totemployer=0;
    }
    var totaluser = await adminhelpers.totaluser()
    var totaljob = await adminhelpers.totaljob()
    res.render('admin/admin-dashboard',{layout:'admin/adminlayout1',adminlog:req.session.adminlogged,totemployer,totaluser,totaljob})
})


router.get('/manageusers',verifylogin,(req,res)=>{
    res.render('admin/dashboard-manage-applications',{layout:'admin/adminlayout',adminlog:req.session.adminlogged})
})


//employermanagement page
router.get('/employerManagement',verifylogin,(req,res)=>{
    adminhelpers.findemployregister().then((empregister)=>{
        // console.log(empregister);
        res.render('admin/employermanagement',{layout:'admin/adminlayout1',empregister,adminlog:req.session.adminlogged})
    })
    // res.render('admin/employermanagement',{layout:'admin/adminlayout1'})
})


//usermanagement page
router.get('/userManagement',verifylogin,(req,res)=>{
    adminhelpers.findUserregister().then((userregiser)=>{
        // console.log(userregiser)
        res.render('admin/usermanagement',{layout:'admin/adminlayout1',userregiser,adminlog:req.session.adminlogged})
    })
})


//listed job
router.get('/listedjob',verifylogin,(req,res)=>{
    adminhelpers.listedjobs().then((jobs)=>{
        res.render('admin/listedjobs',{layout:'admin/adminlayout1',jobs,adminlog:req.session.adminlogged})
    })
})


//employerprofile
router.get('/employerprofile',verifylogin,(req,res)=>{
    adminhelpers.findcompany(req.query).then((employerprofile)=>{
        res.render('admin/employerprofile',{layout:'admin/adminlayout1',employerprofile,adminlog:req.session.adminlogged})
    })
})


//usermanagement
router.get('/userprofile',verifylogin,(req,res)=>{
    console.log(req.query);
    adminhelpers.finduserprofile(req.query).then((userdata)=>{
        res.render('admin/userprofile',{layout:'admin/adminlayout1',userdata,adminlog:req.session.adminlogged})
    })
})



//job details
router.get('/jobInDetails',verifylogin,(req,res)=>{
    console.log(req.query)
    adminhelpers.findJobDetails(req.query).then((jobdetail)=>{
        res.render('admin/job-page',{layout:'admin/adminlayout1',jobdetail,adminlog:req.session.adminlogged})
    })
})

//admin home
router.get('/dummy',verifylogin,(req,res)=>{
    res.render('admin/add-resume')
})



router.post('/any',(req,res)=>{
    console.log(body);
})






module.exports = router;

