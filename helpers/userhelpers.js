const { Db } = require("mongodb")
const db = require('../config/connection')
const collection = require('../config/mongoCollections')
const { ObjectId } = require("mongodb");
const mongoCollections = require("../config/mongoCollections");
const bcrypt = require('bcrypt');
const { disable } = require("debug");
const saltRounds = 10;


module.exports={


    registeruser:(userregisterformdata)=>{
        console.log(userregisterformdata)
        return new Promise(async(resolve,reject)=>{
            let emailcheck = await db.get().collection(mongoCollections.USERREGISTER).findOne({userEmail:userregisterformdata.email})
            let mobilenumbercheck = await db.get().collection(mongoCollections.USERREGISTER).findOne({userPhonenumber:userregisterformdata.mobilenumber})
            // console.log(emailcheck);
            console.log(mobilenumbercheck)
            if(!emailcheck && !mobilenumbercheck){
                userregisterformdata.password=await bcrypt.hash(userregisterformdata.password, saltRounds)
                console.log(userregisterformdata.password)
                await db.get().collection(mongoCollections.USERREGISTER).insertOne({
                    userFirstname:userregisterformdata.firstname,
                    userLastname:userregisterformdata.lastname,
                    userEmail:userregisterformdata.email,
                    userPhonenumber:userregisterformdata.mobilenumber,
                    userPassword:userregisterformdata.password,
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

    loginUser:(loginformdata)=>{
        return new Promise(async(resolve,reject)=>{
            let emailcheck=await db.get().collection(mongoCollections.USERREGISTER).findOne({userEmail:loginformdata.email})
            console.log('hello am checking user');
            if(emailcheck){
                var passwordCheck=bcrypt.compareSync(loginformdata.password, emailcheck.userPassword);
                console.log(passwordCheck);
                if(passwordCheck){
                    resolve(emailcheck)
                }else{
                    reject({ivalidUser:true})
                }
            }else{
                reject({ivalidUser:true})
            }
        })
    },

    loginUserotp:(mobilenum)=>{
        console.log('checking');
        console.log(mobilenum)
        return new Promise(async(resolve,reject)=>{
            let mobilenumcheck=await db.get().collection(mongoCollections.USERREGISTER).findOne({userPhonenumber:mobilenum})
            console.log('hello am checking user');
            if(typeof mobilenumcheck != undefined){
                    resolve(mobilenumcheck)
            }else{
                reject({ivalidUser:true})
            }
        })
    },





 
    //oldmethod
    //brows job (get request)
    // fetchaddedjobs:(sessionuser)=>{
    //     return new Promise(async(resolve,reject)=>{
    //         if(sessionuser){
    //             var finduserappliedjobs= await db.get().collection(mongoCollections.APPLIEDJOBS).findOne({user_id:sessionuser._id})
    //             // console.log(finduserappliedjobs);
    //             // console.log(finduserappliedjobs.job_id);
    //             if(finduserappliedjobs){
    //                 let appliedjobs = await db.get().collection(mongoCollections.ADDEDJOBS).find({_id:{$in:finduserappliedjobs.job_id}}).toArray()
    //                 let fetchjobs=await db.get().collection(mongoCollections.ADDEDJOBS).find({_id:{$nin:finduserappliedjobs.job_id}}).toArray()
    //                 resolve({applied:appliedjobs,unaplied:fetchjobs})
    //             }else{
    //                 let fetchjobs=await db.get().collection(mongoCollections.ADDEDJOBS).find({}).toArray()
    //                 resolve({unaplied:fetchjobs})
    //             }
    //         }else{
    //             let fetchjobs=await db.get().collection(mongoCollections.ADDEDJOBS).find({}).toArray()
    //             // console.log(fetchjobs);
    //             resolve({unaplied:fetchjobs})
    //         }

    //     })
    // },



    //browsjob new metohod
    
    
    
    
    //new method
    fetchaddedjobs:(sessionuser)=>{
        return new Promise(async(resolve,reject)=>{
            if(sessionuser){
                var jobs = await db.get().collection(mongoCollections.ADDEDJOBS).find().toArray()
                resolve(jobs)
            }else{
                var jobs = await db.get().collection(mongoCollections.ADDEDJOBS).find().toArray()
                resolve(jobs)
            }
        })
    },




    showDtaiileofjob:(jobid)=>{
        // console.log(jobid);
        return new Promise(async(resolve,reject)=>{
            let jobdetail = await db.get().collection(mongoCollections.ADDEDJOBS).findOne({_id:ObjectId(jobid.jobid)})
            // console.log(jobdetail);
            var ski = jobdetail.skills.split(',')
            jobdetail.skill = ski
            resolve(jobdetail)
        })
    },

    updateResume(profiledata,sessionuser){
        // console.log(sessionuser);
        var userid = sessionuser._id
        profiledata.user_id=ObjectId(userid) 
        return new Promise(async(resolve,reject)=>{
            var checkforuserprofile= await db.get().collection(mongoCollections.USERPROFILE).findOne({user_id:ObjectId(sessionuser._id)})
            // profiledata.linkedin = 'https://'+profiledata.linkedin
            // console.log('hello worlddddddddddddddddd')
            // console.log(profiledata.linkedin);
            if(!checkforuserprofile){
               let createnewprofile = await db.get().collection(mongoCollections.USERPROFILE).insertOne(profiledata)
               console.log(createnewprofile);
               let addProfileIdintouserdetails = await db.get().collection(mongoCollections.USERREGISTER).updateOne({_id:ObjectId(userid)},{$set:{profile_id:createnewprofile.insertedId}},{upsert:true})
                resolve()
            }else{
                let userprofile= await db.get().collection(mongoCollections.USERPROFILE).updateOne({user_id:ObjectId(sessionuser._id)},{$set:profiledata},{upsert:true})
                resolve()
            }
        })
    },

    getprofiledetails:(usersession)=>{
        return new Promise(async(resolve,reject)=>{
            let getprofileuser = await db.get().collection(mongoCollections.USERPROFILE).findOne({user_id:ObjectId(usersession._id)})
            if(getprofileuser){
                resolve(getprofileuser)
            }else{
                resolve()
            }
        })
    },


    checkForprofile:(usersession)=>{
        return new Promise(async(resolve,reject)=>{
            checkingprofile= await db.get().collection(mongoCollections.USERPROFILE).findOne({user_id:ObjectId(usersession._id)})
            console.log(checkingprofile);
            if(checkingprofile){
                resolve(checkingprofile)
            }else{
                resolve(checkingprofile=false)
            }
        })
    },


    applyingjob:(usersession,jobesid)=>{
        return new Promise(async(resolve,reject)=>{
            finduserexist = await db.get().collection(mongoCollections.APPLIEDJOBS).findOne({user_id:usersession._id})
            if(finduserexist) {
                var applyjob = await db.get().collection(mongoCollections.APPLIEDJOBS).updateOne({user_id:usersession._id},{$push:{job_id:ObjectId(jobesid.jobid)}})
                addingusertojobid = await db.get().collection(mongoCollections.ADDEDJOBS).updateOne({_id:ObjectId(jobesid.jobid)},{$push:{applied_users:ObjectId(usersession._id)}},{upsert:true})
                resolve()
            }else{
                var applyjob = await db.get().collection(mongoCollections.APPLIEDJOBS).insertOne({
                    user_id:usersession._id, 
                    job_id:[ObjectId(jobesid.jobid)]
                })
                addingusertojobid = await db.get().collection(mongoCollections.ADDEDJOBS).updateOne({_id:ObjectId(jobesid.jobid)},{$push:{applied_users:ObjectId(usersession._id)}},{upsert:true})
                resolve()
            }
        })
    },


    // getfilterjob:(usersession,filterquery)=>{
    //     return new Promise(async(resolve,reject)=>{
    //         // console.log(filterquery);
    //         var jobtypee = ''
    //         if(filterquery.jobtype){
    //             var jobtypee = filterquery.jobtype
    //         }
    //         if(filterquery){
    //             if(jobtypee != '' && filterquery.category!=' '){
    //                 var filterdata = await db.get().collection(mongoCollections.ADDEDJOBS).find({jobtype:{$in:jobtypee},category:filterquery.category}).toArray()
    //                 resolve(filterdata)
    //                 // console.log(filterdata);
    //             }else if(filterquery.category == ' ' && jobtypee != "") {
    //                 var filterdata = await db.get().collection(mongoCollections.ADDEDJOBS).find({jobtype:{$in:jobtypee}}).toArray()
    //                 resolve(filterdata)
    //                 // console.log(filterdata);
    //             }else if(filterquery.category != ' ' && jobtypee == ""){
    //                 console.log('hiiiiiiiiiiiiiiiii');
    //                 var filterdata = await db.get().collection(mongoCollections.ADDEDJOBS).find({category:filterquery.category}).toArray()
    //                 console.log(filterdata);
    //                 resolve(filterdata)
    //             }
    //         }else{
    //             resolve()
    //         }

    //     })
    // },




    getfilterjob:(usersession,query)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(query);
            console.log(query.searchdata);

            var search ={}
            if(query.searchdata != '' ){
               var job = {$regex : query.searchdata, '$options' : '$i'}
               search.jobTitle = job
            }
            if(query.jobtype ){
                if(query.jobtype != ''){ 
                    var jobty = {$in : query.jobtype}
                    // var job =query.jobtype
                    search.jobtype= jobty
                }
            }

            if(query.category != ' '){
                var categ = query.category
                search.category =categ
            }


              var searchresult = await db.get().collection(mongoCollections.ADDEDJOBS).find(search).toArray()
            //   var searchdata = await db.get().collection(mongoCollections.ADDEDJOBS).find({jobTitle:{$regex : searchFiled.search, '$options' : '$i'}}).toArray()
            // var filterdata = await db.get().collection(mongoCollections.ADDEDJOBS).find({jobtype:{$in:jobtypee},category:filterquery.category}).toArray()

              resolve(searchresult)
        //    })
            
        })
    },



    searchFiled:(usersession,searchFiled)=>{
        // console.log(searchFiled.search);
        return new Promise(async(resolve,reject)=>{
            var searchdata = await db.get().collection(mongoCollections.ADDEDJOBS).find({jobTitle:{$regex : searchFiled.search, '$options' : '$i'}}).toArray()
            // console.log(searchdata)
            resolve(searchdata)
        })
    },

    getemployerprofile:(usersession,employerid)=>{
        console.log(employerid)
        return new Promise(async(resolve,reject)=>{
            var employerprofile = await db.get().collection(mongoCollections.EMPLOYERPROFILE).findOne({employer_id:employerid.id})
            console.log(employerprofile);
            resolve(employerprofile)
        })
    },


    Homesearchjobs:(usersession,query)=>{
        return new Promise(async(resolve,reject)=>{
            if(Object.keys(query).length === 0 && query.constructor === Object){
                var searchresult = await db.get().collection(mongoCollections.ADDEDJOBS).find({}).toArray()
                resolve(searchresult)
            }else{
                var search ={}
                if(query.jobtitle != ''){
                   var job = {$regex : query.jobtitle, '$options' : '$i'}
                   search.jobTitle = job
                }
                if(query.category != ''){
                    var categ = query.category
                    search.category =categ
                }
                  var searchresult = await db.get().collection(mongoCollections.ADDEDJOBS).find(search).toArray()
                  resolve(searchresult)
            }
        })
    },


    findappliedjobs:(usersession)=>{
        console.log(usersession);
        return new Promise(async(resolve,reject)=>{
            if(usersession){
                var findappliedjobs = await db.get().collection(mongoCollections.APPLIEDJOBS).findOne({user_id:usersession._id})
                resolve(findappliedjobs)
            }else{
                resolve(false)
            }
        })

    },

    resumedataupdate:(querydata,usersession)=>{
        return new Promise(async(resolve,reject)=>{
            if(querydata){

                var userid = usersession._id
                querydata.userid = ObjectId(userid) 
                console.log(userid);
                console.log(querydata)
               
                if(querydata.basicinfo == "basicinfo"){
                    var insertprofile = await db.get().collection(mongoCollections.RESUMEDATA).updateOne({userid:ObjectId(usersession._id)},{$set:querydata},{upsert:true})
                    console.log(insertprofile);
                }


                if(querydata.coverletter == "coverletter"){
                    var insertprofile = await db.get().collection(mongoCollections.RESUMEDATA).updateOne({userid:ObjectId(usersession._id)},{$set:querydata},{upsert:true})
                    console.log(insertprofile);
                }
                if(querydata.education == 'education'){
                    var insertprofile = await db.get().collection(mongoCollections.RESUMEDATA).updateOne({userid:ObjectId(usersession._id)},{$push:{
                        education:{
                            eduId:ObjectId(),
                            educationTitle:querydata.educationTitle,
                            fromDateEdu:querydata.fromDateEdu,
                            toDateEdu:querydata.toDateEdu,
                            institutename:querydata.institutename,}
                    }
                    },{upsert:true})
                    console.log(insertprofile);
                
                }

                if(querydata.experaiance == 'experaiance'){
                    var insertprofile = await db.get().collection(mongoCollections.RESUMEDATA).updateOne({userid:ObjectId(usersession._id)},{$push:{
                        experaiance:{
                            expId:ObjectId(),
                            experiancecompany:querydata.experiancecompany,
                            fromDateExp:querydata.fromDateExp,
                            toDateExp:querydata.toDateExp,
                            position:querydata.position,
                            present:querydata.present
                        }
                    }
                    },{upsert:true})
                    console.log(insertprofile);
                }

                if(querydata.skills == 'skills'){
                    var insertprofile = await db.get().collection(mongoCollections.RESUMEDATA).updateOne({userid:ObjectId(usersession._id)},{$push:{
                        skills:{
                            skillId:ObjectId(),
                            skill:querydata.skill,
                            percentageskill:querydata.percentageskill,
                        }
                    }
                    },{upsert:true})
                    console.log(insertprofile);
                }

                if(querydata.award == 'award'){
                    var insertprofile = await db.get().collection(mongoCollections.RESUMEDATA).updateOne({userid:ObjectId(usersession._id)},{$push:{
                        award:{
                            awardId:ObjectId(),
                            awardname:querydata.awardname,
                            company:querydata.company,
                            awardDate:querydata.awardDate,

                        }
                    }
                    },{upsert:true})
                    console.log(insertprofile);
                }
            }

            var findall = await db.get().collection(mongoCollections.RESUMEDATA).findOne({userid:ObjectId(usersession._id)})
            resolve(findall)


        })

    },



    registerusergoogle:(googleregisterdetails)=>{
        console.log(googleregisterdetails)

        return new Promise(async(resolve,reject)=>{
            let emailcheck = await db.get().collection(mongoCollections.USERREGISTER).findOne({userEmail:googleregisterdetails.email})
            // console.log(emailcheck);
            if(!emailcheck){
                await db.get().collection(mongoCollections.USERREGISTER).insertOne({
                    userFirstname:googleregisterdetails.given_name,
                    userLastname:googleregisterdetails.family_name,
                    userEmail:googleregisterdetails.email,
                    googleauth:true
                    })
                let emailcheck = await db.get().collection(mongoCollections.USERREGISTER).findOne({userEmail:googleregisterdetails.email})
                resolve(emailcheck)
            }else{
                resolve(emailcheck)
            }
        })
    },






    findQuestions:(jobids)=>{
        return new Promise(async(resolve,reject)=>{
            var findjob = await db.get().collection(mongoCollections.ADDEDJOBS).findOne({_id:ObjectId(jobids.jobid)})
            // console.log('llllllooooooooppppppppppppppppppp');
            // var print = (findjob.questions).limit(2)
            // console.log(print)
            resolve(findjob)
        })
    },



    checkansswers:(jobidandans,usersession)=>{
        return new Promise(async(resolve,reject)=>{
            var check_ans = await db.get().collection(mongoCollections.ADDEDJOBS).findOne({_id:ObjectId(jobidandans.jobid)})
            var score=0
            check_ans.questions.forEach((element,index) => {
                if(element.answer == jobidandans[element.qid]){
                    console.log(true)
                    score++
                }
            });

            const query = { name: "Steve Lobsters", "items.type": "pizza" };
            const updateDocument = {
              $set: { "items.$.size": "extra large" }
            };

            var findupdatedcore = await db.get().collection(mongoCollections.ADDEDJOBS).findOne({_id:ObjectId(jobidandans.jobid),'scores.userid':ObjectId(usersession._id)})

            if(findupdatedcore){
                var updatescoreToAppliedjobs = await db.get().collection(mongoCollections.ADDEDJOBS).updateOne({_id:ObjectId(jobidandans.jobid),'scores.userid':ObjectId(usersession._id)},
                {$set:{
                    'scores.$.userscore':score
                }})

            }else{
                var updatescoreToAppliedjobs = await db.get().collection(mongoCollections.ADDEDJOBS).updateOne({_id:ObjectId(jobidandans.jobid)},
                {$push:{
                    scores:{
                        userid:ObjectId(usersession._id),
                        userscore:score
                        }
                }})
            }
            console.log(updatescoreToAppliedjobs);
            console.log(score);
            resolve(score)
        })
    },


        jobquestoncheck:(jobids)=>{
            console.log(jobids);
            return new Promise(async(resolve,reject)=>{
                var jobdetail = await db.get().collection(mongoCollections.ADDEDJOBS).findOne({_id:ObjectId(jobids)})
                if (jobdetail.questions){
                    if(jobdetail.questions.length!=0){
                        resolve(true)
                    }else{
                        resolve(false)
                    }
                }else{
                    resolve(false)
                }
                // console.log(jobdetail);
                // resolve(jobdetail)
            })

        },



        findemplistedAllJob:(empid)=>{
            return new Promise(async(resolve,reject)=>{
                var alljobofemployer = await db.get().collection(mongoCollections.ADDEDJOBS).find({employer_id:empid}).limit(5).toArray()
                console.log(alljobofemployer);
                resolve(alljobofemployer)
            })
        },


        checkPhonenumber:(phonenum)=>{
            return new Promise(async(resolve,reject)=>{
                var checkphone = await db.get().collection(mongoCollections.USERREGISTER).findOne({userPhonenumber:phonenum.phonenumber})
                // console.log(checkphone)
                if(typeof checkphone != 'undefined'){
                    resolve(checkphone)
                }else{
                    reject(false)
                }
            })

        },


        getMachanetestdata:(loggedinuser)=>{
            return new Promise(async(resolve,reject)=>{
                console.log('hello a machane test data')
                console.log(loggedinuser._id)
                // var machanetestdata = await db.get().collection(mongoCollections.MACHANETEST).find({'data.userid':loggedinuser._id}).toArray()

                var machanetestdata = await db.get().collection(mongoCollections.MACHANETEST).aggregate([
                    {
                        $match:{'data.userid':ObjectId(loggedinuser._id)}
                    },
                    {
                        $lookup:{
                            from:mongoCollections.ADDEDJOBS,
                            localField:'data.jobid',
                            foreignField:'_id',
                            as:'jobData'
                        }
                    },
                    {
                        $unwind:'$jobData'

                    }
                ]).toArray()

                console.log(machanetestdata);
                // console.log(machanetestdataaa);
                resolve(machanetestdata)
            })
        },



        getMachaneTestRequirement:(querydata)=>{
            return new Promise(async(resolve,reject)=>{
                var getdata = await db.get().collection(mongoCollections.MACHANETEST).findOne({_id:ObjectId(querydata._id)})
                // console.log(getdata);
                resolve(getdata)
            })
        },


        machneTestanser:(testsubmitiondata)=>{
            return new Promise(async(resolve,reject)=>{
                var submittest = await db.get().collection(mongoCollections.MACHANETEST).findOne({_id:ObjectId(testsubmitiondata.testid)})
                if(typeof submittest != 'undefined'){
                    var updateanswer = await db.get().collection(mongoCollections.MACHANETEST).updateOne({_id:ObjectId(testsubmitiondata.testid)},{$set:{answer:testsubmitiondata}},{upsert:true})
                    resolve(true)
                }else{
                    reject()
                }
                console.log(submittest)
            })
        },


        deleteTest(machanetestid){
            return new Promise(async(resolve,reject)=>{
                var deletetest = await db.get().collection(mongoCollections.MACHANETEST).deleteOne({_id:ObjectId(machanetestid.testid)})
                console.log(machanetestid)
                // console.log(deletetest)
                resolve(deletetest)
            })
        },



        findTotaljobsCount(){
            return new Promise(async(resolve,reject)=>{
                var jobscount = await db.get().collection(mongoCollections.ADDEDJOBS).find().toArray()
                resolve(jobscount.length)
            })
        }














}