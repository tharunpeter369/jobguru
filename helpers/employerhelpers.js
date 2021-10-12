const { Db } = require("mongodb")
const db = require('../config/connection')
const collection = require('../config/mongoCollections')
const { ObjectId } = require("mongodb");
const mongoCollections = require("../config/mongoCollections");
const bcrypt = require('bcrypt');
const { query, response } = require("express");
const saltRounds = 10;
var geocoder = require('geocoder');
const axios = require('axios');
const { finduserprofile } = require("./adminhelpers");


module.exports={

    registerEmployer:(employerregisterformdata)=>{
        console.log(employerregisterformdata)
        return new Promise(async(resolve,reject)=>{
            let emailcheck = await db.get().collection(mongoCollections.EMPLOYEREGISTER).findOne({employerEmail:employerregisterformdata.email})
            let mobilenumbercheck = await db.get().collection(mongoCollections.EMPLOYEREGISTER).findOne({employerPhonenumber:employerregisterformdata.mobilenumber})
            // console.log(emailcheck);
            console.log(mobilenumbercheck)
            if(!emailcheck && !mobilenumbercheck){
                employerregisterformdata.password=await bcrypt.hash(employerregisterformdata.password, saltRounds)
                console.log(employerregisterformdata.password)
                await db.get().collection(mongoCollections.EMPLOYEREGISTER).insertOne({
                    employerFirstname:employerregisterformdata.firstname,
                    employerEmail:employerregisterformdata.email,
                    employerPhonenumber:employerregisterformdata.mobilenumber,
                    employerPassword:employerregisterformdata.password,
                    })
                resolve()
            }else{
                if(emailcheck && mobilenumbercheck){
                    reject({mobileandphonenumberexist:true})
                    console.log('both mobile and email exist')
                }else if(emailcheck){
                    reject({emailexist:true})
                    console.log('email exist');
                }else if(mobilenumbercheck){
                    reject({mobileexist:true})
                    console.log('mobile number exist')
                }
            }

        })
    },

    checkEmailandPhonenumber:(employerregisterformdata)=>{
        return new Promise(async(resolve,reject)=>{
            let emailcheck = await db.get().collection(mongoCollections.EMPLOYEREGISTER).findOne({employerEmail:employerregisterformdata.email})
            let mobilenumbercheck = await db.get().collection(mongoCollections.EMPLOYEREGISTER).findOne({employerPhonenumber:employerregisterformdata.mobilenumber})
            // console.log(emailcheck);
            console.log(mobilenumbercheck)
            console.log(emailcheck)
            if(typeof emailcheck== 'undefined' && typeof mobilenumbercheck == 'undefined'){
                console.log('am resolveing.................');
                resolve()
            }else{
                console.log('helloooo');
                if(emailcheck && mobilenumbercheck){
                    reject({mobileandphonenumberexist:true})
                    console.log('both mobile and email exist')
                }else if(emailcheck){
                    reject({emailexist:true})
                    console.log('email exist');
                }else if(mobilenumbercheck){
                    reject({mobileexist:true})
                    console.log('mobile number exist')
                }
            }
        })
    },


    login:(loginformdata)=>{
        return new Promise(async(resolve,reject)=>{
            let emailcheck=await db.get().collection(mongoCollections.EMPLOYEREGISTER).findOne({employerEmail:loginformdata.email})
            if(emailcheck){
                var passwordCheck=bcrypt.compareSync(loginformdata.password, emailcheck.employerPassword);
                console.log(passwordCheck);
                if(passwordCheck){
                    resolve(emailcheck)
                }else{
                    reject({invalidemployer:true})
                }
            }else{
                reject({invalidemployer:true})
            }
        })
    },


    postjob:(jobdetails,employer)=>{
        var employerid = employer._id
        var date = new Date()
        jobdetails.employer_id =employerid 
        jobdetails.date = date
        return new Promise(async(resolve,reject)=>{

            //geolocation cordinates
            var locatincordinates = null
             geocode()
             function geocode(){
              axios.get('https://api.opencagedata.com/geocode/v1/json',{
                  params:{
                      q: jobdetails.Location,
                      key:'2cdd5d15ffef4445a03e03f5c6cce625'
                  }
              }).then(async(response)=>{
                  // console.log(response);
                  console.log(response.data.results[0].geometry)
                  locatincordinates = response.data.results[0].geometry
                  jobdetails.cordinates = locatincordinates
                  // console.log(response.data.results[0].geometry.location.lng)



                    // findplan
            var findplan = await db.get().collection(mongoCollections.EMPLOYEREGISTER).findOne({_id: ObjectId(employerid)})
            console.log(findplan);
            // update count if count zero cant add
            if(findplan){
                if (findplan.count > 0){
                    //update count --
                    var updatecount = await db.get().collection(mongoCollections.EMPLOYEREGISTER).updateOne({_id:ObjectId(employerid)},{$inc:{count:-1}})
                     // set visibility date according to plan
                    if(findplan.subscriptioin == 'base'){
                        var visiblitydate = new Date();
                        visiblitydate.setDate(date.getDate() + 10);
                        visiblitydate.setHours(23);
                        visiblitydate.setMinutes(59);
                        visiblitydate.setSeconds(59);
                    }else if(findplan.subscriptioin == 'gold'){
                        var visiblitydate = new Date();
                        visiblitydate.setDate(date.getDate() + 30);
                        visiblitydate.setHours(23);
                        visiblitydate.setMinutes(59);
                    }else if(findplan.subscriptioin == 'platinum'){
                        var visiblitydate = new Date();
                        visiblitydate.setDate(date.getDate() + 50);
                        visiblitydate.setHours(23);
                        visiblitydate.setMinutes(59);
                        visiblitydate.setSeconds(59);
                    }
                    jobdetails.visiblityupto =visiblitydate
                    if(jobdetails.jobid){
                        let insertedjob=await db.get().collection(mongoCollections.ADDEDJOBS).updateOne({_id:ObjectId(jobdetails.jobid)},{$set:jobdetails})
                        console.log(insertedjob)
                        if(insertedjob.acknowledged == true){
                            resolve(jobdetails.jobid)
                        }
                    }else{
                        let insertedjob=await db.get().collection(mongoCollections.ADDEDJOBS).insertOne(jobdetails)
                        // let insertedjob=await db.get().collection(mongoCollections.ADDEDJOBS).updateOne(jobdetails)
                        insetedjobid=insertedjob.insertedId.toString()
                        console.log(insetedjobid);
                        resolve(insetedjobid)
                    }
                }else{
                    //please upgrade
                    reject(nosubsciption=true)
                }
            }else{
                //please upgrade
                reject(nosubsciption=true)
            }
              })
            }
        })
    },



    checkprofile:(empprofileid)=>{
        return new Promise(async(resolve,reject)=>{
            findempprofile = await db.get().collection(mongoCollections.EMPLOYERPROFILE).findOne({employer_id:empprofileid})
            if(finduserprofile){
                resolve(finduserprofile)
            }else{
                resolve(false)
            }
        })
    },


    profileupdate:(profiledetails,employer)=>{
        // console.log(profiledetails);
        var employerid = employer._id
        profiledetails.employer_id = employerid
        return new Promise(async(resolve,reject)=>{
            // profiledetails.linkedin='https://'+profiledetails.linkedin
            findEmployerexist =await db.get().collection(mongoCollections.EMPLOYERPROFILE).findOne({employer_id:employerid})
            console.log(findEmployerexist);
            if(!findEmployerexist){
                let updateprofiledata = await db.get().collection(mongoCollections.EMPLOYERPROFILE).insertOne(profiledetails) 
                
            }else{
                let updateprofiledata = await db.get().collection(mongoCollections.EMPLOYERPROFILE).updateOne({employer_id:employerid},{$set:profiledetails},{upsert: true})
            }
            resolve()
        })
    },

    showprofiledata:(employersessiondata)=>{
        return new Promise(async(resolve,reject)=>{
            let displaycompnayprofile = await db.get().collection(mongoCollections.EMPLOYERPROFILE).findOne({employer_id:employersessiondata._id})
            console.log(displaycompnayprofile);
            if(typeof displaycompnayprofile !='undefined'){
                resolve(displaycompnayprofile)
            }else{
                reject(false)
            }
           
        })
    },


    fetchpostedjob:(employersessiondata)=>{
        return new Promise(async(resolve,reject)=>{
            let getpostedjobs= await db.get().collection(mongoCollections.ADDEDJOBS).find({employer_id:employersessiondata._id}).toArray()
            console.log(getpostedjobs);
            resolve(getpostedjobs)
        })
    },


// vfffffffffffffffffffff
    getappliedusers:(employersessiondata,job_id)=>{
        // console.log(job_id)
        return new Promise(async(resolve,reject)=>{
            let applieduser = await db.get().collection(mongoCollections.ADDEDJOBS).findOne({_id:ObjectId(job_id.jobid)})
            // console.log(applieduser );
            if(typeof applieduser != "undefined" && applieduser.applied_users ){
                getuserdetails = await db.get().collection(mongoCollections.USERPROFILE).find({user_id:{$in:(applieduser.applied_users)}}).toArray()
                var acceptedjob =await db.get().collection(mongoCollections.ACCEPTEDJOB).findOne({job_id:job_id.jobid})
                getuserdetails.forEach(async element => {
                    if(acceptedjob.user_id.toString().includes(element.user_id.toString())){
                        element.accepted=true
                    }
                });
                // console.log('aggregateeeee');
                // console.log(getuserdetails);
            //     var dataa =await db.get().collection(mongoCollections.ADDEDJOBS).aggregate([{$match:{
            //         _id:ObjectId(job_id.jobid)
            //     }},
            //     {
            //         $unwind:'$applied_users'
            //     },
            //     {
            //         $lookup:{
            //             from: 'userRegister' ,
            //             localField: 'applied_users',
            //             foreignField: '_id',
            //             as: 'userdata'
            //         }
            //     },{$unwind:"$userdata"},
            //     {
            //         $project:{
            //             userdata:1,
            //             _id:0
            //         }
            //     }
            // ]).toArray()
                // console.log(getuserdetails);
                if(getuserdetails.length !=0){
                    getuserdetails.forEach(element => {    
                        if(applieduser.scores){
                            applieduser.scores.forEach(elem =>{
                                // console.log(elem.userid);
                                // console.log(element.user_id);
                                // element.scoreeeee = 3
                                if(elem.userid.toString() == element.user_id.toString()){
                                    element.score = elem.userscore
                                }
                            })
                        } 
                    });
                    resolve(getuserdetails)
                }else{
                    resolve(false)
                }
            }else{
                resolve(false)
            }
        })
    },

    

    getshortlisted:(jobids)=>{
        return new Promise(async(resolve,reject)=>{
            let shortlist = await db.get().collection(mongoCollections.ACCEPTEDJOB).findOne({job_id:jobids.jobid})
            console.log(shortlist);
            // console.log(shortlist.user_id);
            if(typeof shortlist != 'undefined'){
                let finduser = await db.get().collection(mongoCollections.USERPROFILE).find({user_id:{$in:shortlist.user_id}}).toArray()
                resolve(finduser)
            }else{
                reject(true)
            }
        })
    },


    individualprofile:(profileid)=>{
        return new Promise(async(resolve,reject)=>{
            let getuser = await db.get().collection(mongoCollections.USERPROFILE).findOne({_id:ObjectId(profileid.userid)})
            resolve(getuser)
        })
    },


    findAllappliedJobByuser:(Userid)=>{
        return new Promise(async(resolve,reject)=>{
            let getallappliedjob = await db.get().collection(mongoCollections.APPLIEDJOBS).findOne({user_id:Userid.userid})
            console.log(getallappliedjob);
            let findallappliedjobdetails = await db.get().collection(mongoCollections.ADDEDJOBS).find({_id:{$in:getallappliedjob.job_id}}).toArray()
            console.log(findallappliedjobdetails);
            resolve(findallappliedjobdetails)
        })
    },

    findcompanyprofile:(employersession)=>{
        return new Promise(async(resolve,reject)=>{
            let employerprofile = await db.get().collection(mongoCollections.EMPLOYERPROFILE).findOne({employer_id:employersession._id})
            // console.log(employerprofile);
            resolve(employerprofile)
        })
    },

    showcreatedresume:(query)=>{
        console.log(query);
        return new Promise(async(resolve,reject)=>{
            let createdresumedetail = await db.get().collection(mongoCollections.RESUMEDATA).findOne({userid:ObjectId(query.userid)})
            resolve(createdresumedetail)
        })
    },


    pushQuestions:(questionsdata)=>{
        var qi_d=ObjectId()
        console.log(qi_d);
        questionsdata.qid=qi_d
        return new Promise(async(resolve,reject)=>{
            let pushquestion = await db.get().collection(mongoCollections.ADDEDJOBS).updateOne({_id:ObjectId(questionsdata.jobid)},{$push:{questions:questionsdata}})
            resolve()
        })

    },

    subscriptiondone:(plan,employersession)=>{
        console.log(plan);
        return new Promise(async(resolve,reject)=>{
            if(plan == 'base'){
               var number = 1
               var date = new Date();
               date.setDate(date.getDate() + 30);
               date.setHours(23);
               date.setMinutes(59);
               date.setSeconds(59);
               console.log(date);
            }else if(plan == 'gold'){
               var number = 12
               var date = new Date();
                date.setDate(date.getDate() + 30);
                date.setHours(23);
                date.setMinutes(59);
                date.setSeconds(59);
                console.log(date);

            }else if(plan == 'platinum'){
               var number = 20
               var date = new Date();
               date.setDate(date.getDate() + 30);
               date.setHours(23);
               date.setMinutes(59);
               date.setSeconds(59);
               console.log(date);
            }
            var subscription = await db.get().collection(mongoCollections.EMPLOYEREGISTER).updateOne({_id:ObjectId(employersession._id)},
            {$set:{count:number,subscriptioin:plan,expirydate:date}},{upsert:true})
            resolve()
        })
    },



    acceptedjob:(jobidadnempid,empdeta)=>{
        console.log(jobidadnempid);
        console.log(empdeta._id);
        return new Promise(async(resolve,reject)=>{
            var acceptedjob = await db.get().collection(mongoCollections.ACCEPTEDJOB).findOne({job_id:jobidadnempid.jobid,user_id:{$in:[jobidadnempid.userid]},empid:empdeta._id})
            console.log(acceptedjob);
            if(typeof acceptedjob == 'undefined'){
            var acceptedjob = await db.get().collection(mongoCollections.ACCEPTEDJOB).updateOne({job_id:jobidadnempid.jobid,empid:empdeta._id},{$push:{user_id:ObjectId(jobidadnempid.userid)}},{upsert:true}) 
            }
            resolve()
        })
    },


    dashboard:()=>{
        return new Promise(async(resolve,reject)=>{
            var totaluser = await db.get().collection(mongoCollections.USERREGISTER).find().toArray()
            resolve(totaluser)
        })
    },

    dashboardaddedjobs:(empsession)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(empsession);
            var addedjobs = await db.get().collection(mongoCollections.ADDEDJOBS).find({employer_id:empsession._id}).toArray()
            // console.log(addedjobs.length);
            if(addedjobs){
                resolve(addedjobs.length)
            }else{
                resolve(0)
            }
            
        })
    },


    editjob:(jobid,empsession)=>{
        return new Promise(async(resolve,reject)=>{
            var addedjobs = await db.get().collection(mongoCollections.ADDEDJOBS).findOne({_id:ObjectId(jobid.jobid)})
            // console.log(addedjobs);
            resolve(addedjobs)
        })
    },


    getuserdetailsformachanetest:(body)=>{
        return new Promise(async(resolve,reject)=>{
            var getuserdetails = await db.get().collection(mongoCollections.USERREGISTER).findOne({_id:ObjectId(body.userid)})
            // console.log(getuserdetails)
            resolve(getuserdetails)
        })
    },


    updatemachanetest:(data)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(data);
            // var checkuserandjob = await db.get().collection(mongoCollections.MACHANETEST).findOne({jobid:ObjectId(data.jobid),userid:ObjectId(data.userid)})
            var checkuserandjob = await db.get().collection(mongoCollections.MACHANETEST).findOne({'data.jobid':ObjectId(data.jobid),'data.userid':ObjectId(data.userid)})
            console.log(checkuserandjob);
            data.empid = ObjectId(data.empid)
            data.jobid=ObjectId(data.jobid)
            data.userid = ObjectId(data.userid)
            if(typeof checkuserandjob == 'undefined'){
                var machetestdata = await db.get().collection(mongoCollections.MACHANETEST).insertOne({data})
                resolve()
            }else{
                var updatetest = await db.get().collection(mongoCollections.MACHANETEST).updateOne({'data.jobid':ObjectId(data.jobid),'data.userid':ObjectId(data.userid)},{$set:{data}})
                console.log(updatetest);
                resolve()
            }

        })
    },


    getUserTestAnswer:(useridJobid)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(useridJobid)
            var getanswer = await db.get().collection(mongoCollections.MACHANETEST).findOne({'data.userid':ObjectId(useridJobid.userid) ,'data.jobid':ObjectId(useridJobid.jobid)})
            console.log(getanswer);
            if(typeof getanswer != 'undefined'){
                resolve(getanswer)
            }else{
                resolve(false)
            }      
         })
    }








    




}