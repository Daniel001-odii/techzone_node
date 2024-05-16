const Job = require('../models/jobModel');
const User = require('../models/userModel');
const Employer = require('../models/employerModel');
const Contract = require('../models/contractModel');
const Application = require('../models/applicationModel');
const Notification = require('../models/notificationModel')
const notificationController = require('../controllers/notificationController');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const express = require("express");
const app = express();
const http = require('http');
const server = http.createServer(app);

const fs = require('fs');
const handlebars = require('handlebars');

const io = require("socket.io")(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

/*
* *
* CONFIGURE EMAIL
**
*/
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'danielsinterest@gmail.com',
      pass: 'qdjctvwagyujlqyg',
    },
  });


// controller to get all user contracts...
exports.getContracts = async(req, res) => {
    try{
        if(req.userId){
            const contracts = await Contract.find({ user:req.userId })
            .populate({
                path: "employer",
                select: "firstname lastname profile" // Specify the properties you want to populate
            })
            .populate({
                path: "job"
            });

            return res.status(200).json({ contracts });
        } else if(req.employerId){
            const contracts = await Contract.find({ employer:req.employerId })
            .populate({
                path: "user",
                select: "firstname lastname profile" // Specify the properties you want to populate
            })
            .populate({
                path: "employer",
                select: "firstname lastname profile" // Specify the properties you want to populate
            })
            .populate({
                path: "job"
            });

            return res.status(200).json({ contracts });
        }
        return res.status(404).json({ message: "You have no contracts yet"})
       
    }catch(error){
        console.log(error)
    }
}


const APP_CONTRACT_URL = '/in/contracts'
// SEND NOTIFICATIONS TO USER
// controller to create and send offer to user...
exports.sendContractOffer = async(req, res) =>{
    if(req.employerId){
        try{
            const {user_id, job_id} = req.params;
            
            const alreadyExisitngContract = await Contract.findOne({ user:user_id, job:job_id });
            if(alreadyExisitngContract){
                return res.status(200).json({ messsage: "You already sent the contract to this user"});
            } else {
                const newContract = new Contract({
                    employer: req.employerId,
                    user: user_id,
                    job: job_id,
                });
                await newContract.save();

                const job = await Job.findOne({ _id: newContract.job });
                const user = await User.findById(user_id);
                const employer = await Employer.findById(req.employerId);
                

                // NOTIFY USER HERE >>>
                const newNotification = new Notification({
                    receiver: "user",
                    user,
                    // employer: req.employerId,
                    message: `You received a contract offer for the job ${job.title}`,
                    link_url: `/contracts/${newContract._id}`,
                });
                await newNotification.save();
                
                // SEND EMAIL HERE >>>
                
                const mailOptions = {
                    from: 'danielsinterest@gmail.com',
                    to: user.email,
                    subject: 'Apex-tek Contract Offer',
                    html: `
                    <img src="https://tech-zone-navy.vercel.app/img/apex-tek-white.5a5f5fbb.svg">
                    <h1>You received an offer</h1>
                    <p style="background: #4F83D5; padding: 20px; color: white"> Good news, ${user.firstname} ${user.lastname} You received a contract offer from ${employer.profile.company_name} for the job ${job.title} </p>
                          <p>Login to accept the offer if you are convenient with the client's terms and begin working on the project as soon as possible</p>`
                  };
                
                  // SEND EMAILS HERE >>>
                // Emails sent are dependent on user's settings...
                if(user.settings.notifications.emails == true) {
                    
                  transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                      console.error('Error sending contract email:', error);
                      return res.status(500).json({ message: 'Failed to send contract email' });
                    }
                
                    console.log('contract email sent', info.response);
                  });

                }
                  res.status(200).json({ newContract, message: `You sent the contract offer to ${user.firstname} ${user.lastname}` });
            }
        }catch(error){
            console.log(error);
            res.status(500).json({ message: 'internal server error from sendContract' })
        }
    }else{
        return res.status(400).json({ message: "sorry only employers can send contracts.."})
    }
};

// SEND NOTIFICATIONS TO USER
// controller to create and assgin offer to usert then wait for user response...
exports.assignJob = async(req, res) =>{
    if(req.employerId){
        try{

            const {user_id, job_id} = req.params;
            const user = await User.findById(user_id);

            const job = await Job.findById(job_id);
            const employer = await Employer.findById(job.employer)

            const alreadyExisitngContract = await Contract.findOne({ user:user_id, job:job_id });
            if(alreadyExisitngContract){
                return res.status(200).json({ messsage: "You already assigned the contract to this user"});
            } else {
                const newContract = new Contract({
                    employer: req.employerId,
                    user: user_id,
                    job: job_id,
                    type: "assigned",
                });
                await newContract.save();
               
                
                // NOTIFY USER HERE >>>
                const newNotification = new Notification({
                    receiver: "user",
                    user,
                    // employer: req.employerId,
                    message:  `You received a job assignment offer for the job ${job.title}`,
                    link_url: `/contracts/${newContract._id}`,
                });
                await newNotification.save();
                
                
                
               
                // SEND EMAIL HERE >>>
                const mailOptions = {
                    from: 'danielsinterest@gmail.com',
                    to: user.email,
                    subject: 'Apex-tek Contract Offer',
                    html: `<p>Good news, ${user.firstname} ${user.lastname} You received a job assignment offer from ${employer.profile.company_name} for the job ${job.title} </p>
                          <p>Login to accept the offer if you are convenient with the client's terms and begin working on the project as soon as possible</p>`
                  };
                
                  // SEND EMAILS HERE >>>
            // Emails sent are dependent on user's settings...
            if(user.settings.notifications.emails == true) {

                transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending contract email:', error);
                    return res.status(500).json({ message: 'Failed to send contract email' });
                }
                
                console.log('contract email sent', info.response);
                // res.status(200).json({ message: 'Password reset email sent' });
                });

            }

                res.status(200).json({ newContract, message: `You sent the contract offer to ${user.firstname} ${user.lastname}` });
            }
        }catch(error){
            console.log(error);
            res.status(500).json({ message: 'internal server error from sendContract' })
        }
    }else{
        return res.status(400).json({ message: "sorry only employers can assign contracts.."})
    }
};

// SEND NOTIFICATIONS TO EMPLOYER
// controller to allow users to accept a contract
exports.acceptOffer = async(req, res) => {
    try{
        const contract_id = req.params.contract_id;
        const offer = await Contract.findOne({ user: req.userId, _id: contract_id});

        const today = Date.now();

        if(!offer){
            return res.status(404).json({ message: "Contract not found"});
        }

        offer.action = "accepted";
        offer.action_date = today;
        await offer.save();
        res.status(200).json({ offer, message: "You accepted the offer"});

        // NOTIFY USER HERE >>>
        const newNotification = new Notification({
            receiver: "user",
            receiver: "user",
            user: offer.user,
            // employer: offer.employer,
            message: "Your contract started",
            link_url: `/contracts/${contract_id}`,
        });
        await newNotification.save();


    }catch(error){
        console.log(error);
        res.status(500).json({ message: 'internal server error from acceptOffer' });
    }
}

// SEND NOTIFICATIONS TO EMPLOYER
// controller to allow users to accept a contract
exports.declineOffer = async(req, res) => {
    try{
        const contract_id = req.params.contract_id;
        const offer = await Contract.findOne({ user: req.userId , _id: contract_id });
        const user = await User.findById(offer.user);
        const today = Date.now();
        
        if(!offer){
            return res.status(404).json({ message: "Contract not found"});
        }
        offer.action = "declined";
        offer.status = "closed";
        offer.action_date = today;
        await offer.save();
        res.status(200).json({ offer, message: "You declined the offer"});


        

        // NOTIFY USER HERE >>>
        const newNotification = new Notification({
            receiver: "user",
            user: offer.user,
            message: `${user.firstname} ${user.lastname} declined your contract offer`,
            link_url: `client/contracts/${contract_id}`,
        });
        await newNotification.save();

        

    }catch(error){
        console.log(error);
        res.status(500).json({ message: 'internal server error from declineOffer' })
    }
}

// SEND NOTIFICATIONS TO EMPLOYER
exports.markContractAsComplete = async(req, res) => {
    try{
        const contract_id = req.params.contract_id;
        const offer = await Contract.findOne({ _id: contract_id });
        if(!offer){
            return res.status(404).json({ message: "Contract not found"});
        }
        offer.status = "completed";
        await offer.save();
        res.status(200).json({ offer, message: "Contract completed successfuly"});

        // NOTIFY USER HERE >>>
        const newNotification = new Notification({
            receiver: "both",
            user: offer.user,
            employer: offer.employer,
            message: `Your contract is completed`,
            link_url: `contracts/${contract_id}`,
        });
        await newNotification.save();

        // SEND EMAIL TO USER >>>
        const user = await User.findById(offer.user);
        const job = await Job.findById(offer.job);
        const mailOptions = {
            from: 'danielsinterest@gmail.com',
            to: user.email,
            subject: 'Apex-tek Contract Completion',
            html: `<p>Hello ${user.firstname} ${user.lastname} the contract; for the job ${job.title}  you were working on was marked as complete by the employer</p>
                  <p>Your payout should be available any moment from now.</p>`
          };
        // SEND EMAILS HERE >>>
        // Emails sent are dependent on user's settings...
        if(user.settings.notifications.emails == true) {
          
            transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error('Error sending contract email:', error);
              return res.status(500).json({ message: 'Failed to send contract email' });
            }
        
            console.log('contract email sent', info.response);
          });

        }

    }catch(error){
        console.log(error);
        res.status(500).json({ message: 'internal server error from complete offer' })
    }
}


// SEND NOTIFICATIONS TO EMPLOYER
exports.pauseContract = async(req, res) => {
    try{
        const contract_id = req.params.contract_id;
        const offer = await Contract.findOne({ employer: req.employerId , _id: contract_id });
        if(!offer){
            return res.status(404).json({ message: "Contract not found"});
        }
        offer.status = "paused";
        await offer.save();
        res.status(200).json({ offer, message: "Contract paused successfuly"});
        
        // NOTIFY USER HERE >>>
        const newNotification = new Notification({
            receiver: "both",
            user: offer.user,
            employer: offer.employer,
            message: `Your contract is paused`,
            link_url: `contracts/${contract_id}`,
        });
        await newNotification.save();

        // SEND EMAIL TO USER >>>
        const user = await User.findById(offer.user);
        const job = await Job.findById(offer.job);

        const mailOptions = {
            from: 'danielsinterest@gmail.com',
            to: user.email,
            subject: 'Apex-tek Contract Activity',
            html: `<p>Hello, ${user.firstname} ${user.lastname} your contract for the job ${job.title} was paused by the employer. login to review your terms with the client.</p>`
          };
        // SEND EMAILS HERE >>>
        // Emails sent are dependent on user's settings...
        if(user.settings.notifications.emails == true) {
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error('Error sending contract email:', error);
              return res.status(500).json({ message: 'Failed to send contract email' });
            }
        
            console.log('contract email sent', info.response);
            // res.status(200).json({ message: 'Password reset email sent' });
          });
        }

    }catch(error){
        console.log(error);
        res.status(500).json({ message: 'internal server error from pause offer' })
    }
}

// SEND NOTIFICATIONS TO EMPLOYER
exports.resumeContract = async(req, res) => {
    try{
        const contract_id = req.params.contract_id;
        const offer = await Contract.findOne({ employer: req.employerId , _id: contract_id });
        const user = await User.findById(offer.user);
        const job = await Job.findById(offer.job);

        if(!offer){
            return res.status(404).json({ message: "Contract not found"});
        }
        offer.status = "open";
        await offer.save();
        res.status(200).json({ offer, message: "Contract resumed successfuly"});

        // NOTIFY USER HERE >>>
        const newNotification = new Notification({
            receiver: "both",
            user: offer.user,
            employer: offer.employer,
            message: `Your contract is resumed`,
            link_url: `contracts/${contract_id}`,
        });
        await newNotification.save();

       // SEND EMAILS HERE >>>
        // Emails sent are dependent on user's settings...
        if(user.settings.notifications.emails == true) {
       
            const mailOptions = {
                from: 'danielsinterest@gmail.com',
                to: user.email,
                subject: 'Apex-tek Contract Actvity',
                html: `<p>Hello, ${user.firstname} ${user.lastname} Your contract for the job ${job.title} was resumed by the employer </p>`
            };
            
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                console.error('Error sending contract email:', error);
                return res.status(500).json({ message: 'Failed to send contract email' });
                }
            
                console.log('contract email sent', info.response);
                // res.status(200).json({ message: 'Password reset email sent' });
            });

        }

    }catch(error){
        console.log(error);
        res.status(500).json({ message: 'internal server error from pause offer' })
    }
}

// SEND NOTIFICATIONS TO EMPLOYER
exports.closeContract = async(req, res) => {
    try{
        const contract_id = req.params.contract_id;
        
        const offer = await Contract.findOne({ employer: req.employerId , _id: contract_id });
        const user = await User.findById(offer.user);
        const job = await Job.findById(offer.job);

        if(!offer){
            return res.status(404).json({ message: "Contract not found"});
        }
        offer.status = "closed";
        // await offer.save();
        res.status(200).json({ offer, message: "Contract closed successfuly"});

        // NOTIFY USER HERE >>>
        const newNotification = new Notification({
            receiver: "both",
            user: offer.user,
            employer: offer.employer,
            message: `Your contract ${job.title} was closed by the employer`,
            link_url: `contracts/${contract_id}`,
        });
        // await newNotification.save();

        // SEND EMAILS HERE >>>
        // Emails sent are dependent on user's settings...
        if(user.settings.notifications.emails == true) {

            const mailOptions = {
                from: 'danielsinterest@gmail.com',
                to: user.email,
                subject: 'Apex-tek Contract Activity',
                html: `<p>Hello, ${user.firstname} ${user.lastname} Your contract for the job ${job.title} was closed by the employer</p>`
            };
            
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                console.error('Error sending contract email:', error);
                return res.status(500).json({ message: 'Failed to send contract email' });
                }
            
                console.log('contract email sent', info.response);
                // res.status(200).json({ message: 'Password reset email sent' });
            });

        }

    }catch(error){
        console.log(error);
        res.status(500).json({ message: 'internal server error from close offer' })
    }
}


// controller to get all user completed contracts...
exports.getCompletedContracts = async(req, res) => {
    // console.log("parameters from completed contracts: ", req.params);
    if(!mongoose.Types.ObjectId.isValid(req.params.user_id)){
        return res.status(404).json({ message: 'User or employer not found' });
      }

    try{
        if(req.params.user_id){
            // const contracts = await Contract.find({ user:req.params.user_id, action: "accepted", $or: [{ status: "completed" }, { status: "open" }] })
            const contracts = await Contract.find({ user:req.params.user_id, status: "completed"})
        .populate({
            path: "user",
            select: "firstname lastname profile" // Specify the properties you want to populate
        })
        .populate({
            path: "employer",
            select: "firstname lastname profile" // Specify the properties you want to populate
        })
        .populate({
            path: "job"
        });
        return res.status(200).json({ contracts }); 
        } 
        /*
        else {
            console.log(req.params)
            const contracts = await Contract.find({ user:req.userId, action: "accepted", $or: [{ status: "completed" }, { status: "open" }] })
            .populate({
                path: "user",
                select: "firstname lastname profile" // Specify the properties you want to populate
            })
            .populate({
                path: "employer",
                select: "firstname lastname profile" // Specify the properties you want to populate
            })
            .populate({
                path: "job"
            });
            return res.status(200).json({ contracts });
        }*/   
       
    }catch(error){
        console.log(error)
    }
}

// controller to get a particular contract by its ID...
exports.getContractById = async(req, res) => {
    try{
        const contract_id = req.params.contract_id;
        if (!mongoose.Types.ObjectId.isValid(contract_id)) {
            return res.status(404).json({ message: 'contract not found' });
          }
        const contract = await Contract.findById(contract_id)
        .populate({
            path: "user",
            select: "firstname lastname profile rating created" // Specify the properties you want to populate
        })
        .populate({
            path: "employer",
            select: "firstname lastname profile rating created" // Specify the properties you want to populate
        })
        .populate({
            path: "job"
        });
    
        if(!contract){
            return res.status(404).json({ message: "The requested contract was not found"});
        }
        return res.status(200).json({ contract })
    }catch(error){
        console.log(error)
    }
}

// controller to send contract feedback and review...
exports.sendUserFeedback = async(req, res) => {
    try{

        const contract_id = req.params.contract_id;
        const { rating, review } = req.body;
    
        const contract = await Contract.findOne({ _id:contract_id, status: "completed"});
        if(!contract){
            return res.status(404).json({ message: "The requested contract was not found"});
        }
    
        // update feedback field
        contract.employer_feedback = {
            rating: rating,
            review: review,
        }
        // save to db..
        await contract.save();
        // update employer rating on employer object..
        const employer  = await Employer.findById(contract.employer);
        employer.ratings.push(rating);
        await employer.save();

    
        return res.status(200).json({ message: "feedback sent successfully!"})


    }catch(error){
        console.log(error)
    }
};

// controller to send contract feedback and review...
exports.sendEmployerFeedback = async(req, res) => {
    try{

        const contract_id = req.params.contract_id;
        const { rating, review } = req.body;
    
        const contract = await Contract.findOne({ _id:contract_id, status: "completed"});
        if(!contract){
            return res.status(404).json({ message: "The requested contract was not found"});
        }

        contract.user_feedback = {
            rating,
            review
        }
        await contract.save();
        const user  = await User.findById(contract.user);
        user.ratings.push(rating);
        await user.save();


        res.status(200).json({ message: "feedback sent successfully!", contract})

    }catch(error){
        console.log(error)
    }
};



// 
// TASK WATCH CONTROLLER.....
// 

