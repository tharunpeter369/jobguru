const { Db } = require("mongodb")
const db = require('../config/connection')
const collection = require('../config/mongoCollections')
const { ObjectId } = require("mongodb");
const mongoCollections = require("../config/mongoCollections");
const bcrypt = require('bcrypt');
const { query } = require("express");



module.exports={

    findemployregister:()=>{
        return new Promise(async(resolve,reject)=>{
            var employerRegister= await db.get().collection(mongoCollections.EMPLOYEREGISTER).find().toArray()
            resolve(employerRegister)
        })
    },


    findUserregister:()=>{
        return new Promise(async(resolve,reject)=>{
            var userdata = await db.get().collection(mongoCollections.USERREGISTER).find().toArray()
            resolve(userdata)
        })
    },


    listedjobs:()=>{
        return new Promise(async(resolve,reject)=>{
            var listedjobs = await db.get().collection(mongoCollections.ADDEDJOBS).find().toArray()
            resolve(listedjobs)
        })
    },


    findcompany:(employid)=>{
        return new Promise(async(resolve,reject)=>{
            var profile = await db.get().collection(mongoCollections.EMPLOYERPROFILE).findOne({employer_id:employid.empid})
            // console.log(profile);
            resolve(profile)
        })
    },


    finduserprofile:(users_id)=>{
        return new Promise(async(resolve,reject)=>{
            var userprofile = await db.get().collection(mongoCollections.USERPROFILE).findOne({user_id:ObjectId(users_id.userid)})
            console.log(userprofile);
            resolve(userprofile)
        })
    },

    findJobDetails:(jobids)=>{
        return new Promise(async(resolve,reject)=>{
            var jobdetail = await db.get().collection(mongoCollections.ADDEDJOBS).findOne({_id:ObjectId(jobids.jobid)})
            console.log(jobdetail);
            resolve(jobdetail)
        })
    },

    totemployer:()=>{
        return new Promise(async(resolve,reject)=>{
            var total = await db.get().collection(mongoCollections.EMPLOYEREGISTER).find().toArray()
            resolve(total.length)
        })
    },


    totaluser:()=>{
        return new Promise(async(resolve,reject)=>{
            var totuser = await db.get().collection(mongoCollections.USERPROFILE).find().toArray()
            if(totuser){
                resolve(totuser.length)
            }else{
                resolve(0)
            }
        })
    },


   

    totaljob:()=>{
        return new Promise(async(resolve,reject)=>{
            var totjob = await db.get().collection(mongoCollections.ADDEDJOBS).find().toArray()
            if(totjob){
                resolve(totjob.length)
            }else{
                resolve(0)
            }
        })
    },


    


    
}