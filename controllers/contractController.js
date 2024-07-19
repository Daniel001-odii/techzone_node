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

const axios = require('axios');

// const axios = require("axios");

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
            const job = await Job.findById(job_id);
            const user = await User.findById(user_id);
            const employer = await Employer.findById(req.employerId);
            
            const alreadyExisitngContract = await Contract.findOne({ user:user_id, job:job_id });
            if(alreadyExisitngContract){
                return res.status(400).json({ message: "You already sent the contract to this user"});
            } else {
                const newContract = new Contract({
                    budget: job.budget,
                    employer: req.employerId,
                    user: user_id,
                    job: job_id,
                });
                await newContract.save();

                
                

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
                return res.status(400).json({ message: "You already assigned the contract to this user"});
            } else {
                const newContract = new Contract({
                    employer: req.employerId,
                    user: user_id,
                    job: job_id,
                    type: "assigned",
                    budget: job.budget,
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
        const user = await User.findById(offer.user);
        const job = await Job.findById(offer.job);


        if(!offer){
            return res.status(404).json({ message: "Contract not found"});
        }

        if(offer.funded != true){
            return res.status(400).json({ message: "Sorry contract must be funded before being marked as complete"});
        }

        offer.status = "completed";
        offer.payment_status = "paid";
        await offer.save();
       

        // NOTIFY USER HERE >>>
        const newNotification = new Notification({
            receiver: "both",
            user: offer.user,
            employer: offer.employer,
            message: `Your contract is completed`,
            link_url: `contracts/${contract_id}`,
        });
        await newNotification.save();

        // SEND EMAIL & NOTIFY USER >>>
      
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


        // PAY TO USER WALLET...
        // SUBSTRACT APEXTEKS PLATFORM FEES OF 12.99%
        const APEX_PLATFORM_FEES = 12.99;
        // CREDIT THE REST TO USER'S WALLET...
        // save only 2 decimal places after the whole number..
        user.credits += (offer.budget - (offer.budget * APEX_PLATFORM_FEES)/100).toFixed(2);
        await user.save();


        res.status(200).json({ offer, message: "Contract completed successfuly"});

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
        await offer.save();
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
            rating,
            review,
        }
        // save to db..
        await contract.save();
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
        res.status(200).json({ message: "feedback sent successfully!", contract})

    }catch(error){
        console.log(error)
    }
};

// edit contract controller ...
exports.editContractBudget = async(req, res) => {
    try{
        const contract = await Contract.findById(req.params.contract_id);
        if(!contract){
            return res.status(404).json({ message: "contract not found!"});
        }

        const { budget } = req.body;

        if(contract.funded){
            return res.status(400).json({ message: "sorry contract budget cannot be altered after being funded!"})
        } else{
            contract.budget = budget;
            await contract.save();
        }

        res.status(201).json({ message: "contract budget updated!"});

    }catch(error){
        console.log("error updating contract budget: ", error);
        res.status(500).json({ message: "internal server error"});
    }
}



// 
// QOREPAY & PAYMENTS >>>>>>
//

/*

Each API endpoint in QorePay carries the prefix 
 https://gate.qorepay.com/api/v1/. For example, POST
 https://gate.qorepay.com/api/v1/purchases/.
 In every API request, your API key is used as a
 bearer token in the Authorization header. It should be included as follows:
 Authorization: Bearer YOUR_API_KEY...

*/

const paymentProvider = require('Qorepay').default;

paymentProvider.ApiClient.instance.basePath = process.env.QOREPAY_API_URL
paymentProvider.ApiClient.instance.token = process.env.QOREPAY_API_TOKEN

const qorepay_api_url = process.env.QOREPAY_API_URL

let apiInstance = new paymentProvider.PaymentApi();
let brandId = process.env.QOREPAY_BRAND_ID;

/* 

    this endpoint is supposed to return
    a checkout_url which should be sent to the client...
    this checkout_url will enable the said employer to make payments
    primarily using ATM CARD...


*/


//EMPLOYER FUND VIRTUAL WALLET...


// FREELANCER TO WITHDRAW AVAILABLE FUNDS...
const qPayConfig = {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.QOREPAY_API_TOKEN}`
    },
};


exports.getAllFundedContracts = async (req, res) => {
    try{
       const contracts = await Contract.find({ employer: req.employer, funded: true }).populate({
        path: "user",
        select: "firstname lastname" // Specify the properties you want to populate
    })
    .populate({
        path: "job",
        select: "title"
    });;
       const employer = req.employer;

       employer.total_spent = contracts.reduce((total, item) => total + (item.budget || 0), 0);
       
       res.status(200).json({ contracts, employer });

    }catch(error){
        console.log("error getting funded contracts: ", error);
        res.status(500).json({ error: 'An error occurred' });
    }
}


exports.fundContract = async (req, res) => {
    try {
        const contract_id = req.params.contract_id;
        const contract = await Contract.findById(contract_id).populate("employer user job");
        const employer = contract.employer;


        if(!contract){
            res.status(404).json({ message: "contract not found!"});
        };

        
        // mark contract as funded...
        // contract.funded = true;

        // set contract budget to job budget if not custom set...
        // contract.budget = contract.job.budget;

        // await contract.save();

        // SEND NOTIFICATION TO USER >>>
        // notify user that contract has been funded, user can start work...
        // also track taskwatch and notify users to avoid working on non-funded contracts...


        const options = {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              authorization: `Bearer ${process.env.QOREPAY_API_TOKEN}`
            },
            body: JSON.stringify({
              client: {
                  email: employer.email,
                  phone: employer.profile.phone,
                  legal_name: `${employer.firstname} ${employer.lastname}`,
                  full_name: `${employer.firstname} ${employer.lastname}`,
                  country: "Nigeria",
                  street_address: employer.profile.location.address,
                  city: employer.profile.location.city,
                  state: employer.profile.location.state,
                  zip_code: "+234",
              },
              purchase: {
                currency: 'NGN',
                products: [
                  {
                    name: contract.job.title,
                    quantity: 1,
                    price: `${contract.budget}00`
                    // price: `500`
                  }
                ],
              },
              brand_id: process.env.QOREPAY_BRAND_ID,
              failure_redirect: `${process.env.GOOGLE_CALLBACK}/contracts/${contract_id}/funding/failed`,
              success_redirect: `${process.env.GOOGLE_CALLBACK}/contracts/${contract_id}/funding/success`,
            }),
          };
        
          try {
            const response = await fetch('https://gate.qorepay.com/api/v1/purchases/', options);
            const jsonResponse = await response.json();

            // assign purchase_id gotten from qorepay response to contract for easy reference...
            contract.funding_id = jsonResponse.id;
            await contract.save();


            res.status(response.status).json(jsonResponse);

          } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'An error occurred' });
          }
    } catch (error) {
        console.log("error getting contract: ", error);
    }
};


// get a paritcular purchase status by ID.......
exports.getPurchaseById = async (req, res) => {
    try{
        const contract = await Contract.findById(req.params.contract_id);

        if(!contract){
            return res.status(404).json({ message:"requested contract was not found"});
        };

        const response = await axios.get(`https://gate.qorepay.com/api/v1/purchases/${contract.funding_id}/`, qPayConfig);
        // const jsonResponse = await response.json();

        // set contract funding status as true..
        if(response.data.status == "paid"){
            contract.funded = true;
            await contract.save();
        }
        // console.log("res: ", response)
        // res.status(response.status).json({ message: response.data, status: response.data.status });
        res.status(response.status).json({ status: response.data.status, contract });
    }catch(error){
        console.log("error getting purchase: ", error);
        res.status(500).json({ error: 'An error occurred' });
    }
};


// initiate payout into freelancer account...
/*
// QOREPAY PAYOUT FLOW......
https://www.qorepay.com/docs/payout#createPayout
Step 1: first create new payout and return <execution_url>
Step 2: Using <execution_url> from new payout created, get bank list and return payout_url
step 3: Using <payout_url> returned from step 2, 
	execute payout while providing details including... 
	[account number, bank_code, recipient_name]

step 4 (optional): get status of payout executed using payout_id
*/



exports.fetchAllBankLists = async (req, res) => {
    try{
        // create new payout with user details...
        let data = JSON.stringify({
            "client": {
              "email": "testuser@mail.com",
              "phone": "+2340000000000"
            },
            "payment": {
              "amount": 500, //5 naira, 00 is the kobo/cent value
              "currency": "NGN",
              "description": "test."
            },
            "sender_name": "John Doe",
            "brand_id": `${process.env.QOREPAY_BRAND_ID}`,
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://gate.qorepay.com/api/v1/payouts/',
            headers: { 
              'Content-Type': 'application/json', 
              authorization: `Bearer ${process.env.QOREPAY_API_TOKEN}`
            },
            data: data
        };

        const response = await axios.request(config);
        console.log("new payout created...");

        // get and store exec_url...
        const execution_url = response.data.execution_url;

        // get bank list...
        const result = await getBankList(execution_url);
        console.log("bansklist has been sent to client...")

        res.status(201).json({ result });

    }catch(error){
        console.log("error fetching banklist: ", error.response);
        res.status(500).json({ message: "internal server error"});
    }
}

exports.withdrawFunds = async (req, res) => {
    try {
        const user = req.user;
        const { amount } = req.body;
        const description = "New withdrawal";
        const account_number = user.settings.bank.account_number;
        const bank_code = user.settings.bank.sort_code;
        const recipient_name = `${user.firstname} ${user.lastname}`;

        /*
        console.log(
            "user: ", 
            user, 
            "amount :", 
            amount, 
            "description: ", 
            description, 
            "account_number: ", 
            account_number,
            "bank_code: ",
            bank_code,
            "recipient_name: ",
            recipient_name
        )*/

        // check if user is performing a legal action of withdrawing only available funds in account balance..
        // if possible add time delays for withdrawal probation incase of account hijack...
        // check also if its weekend first before allowing withdrawal here...
        // also minus withdrawn funds from user's available funds..
        // send notification, email alerts to user upon successufl withrawal...
        if(amount > user.credits){
            return res.status(400).json({ message: "not enough funds available"});
        } else {
            // substract withdrawal from available balance...
            user.credits = user.credits - amount;
            await user.save();

            // returns execution url successully...
            const execution_url = await createNewPayout(user.email, user.profile.phone, amount, description, recipient_name);

            // return payout url using exec_url...
            // return payout url successfully...
            const payout_url = await getBankList(execution_url);

            // complete final payout process..
            const result = await completePayout(payout_url, account_number, bank_code, recipient_name);
            res.status(201).json({ message: `${recipient_name} requested payout amount of NGN${amount}`, result });
        }
    } catch (error) {
        console.error("Error in the payout process:", error);
        res.status(500).json({ message: "internal server error"});
    }
}

// Function to create a new payout
async function createNewPayout(email, phone, amount, description, sender_name) {
    let data = JSON.stringify({
      "client": {
        "email": `${email}`,
        "phone": `${phone}`
      },
      "payment": {
        "amount": `${amount}00`, //5 naira, 00 is the kobo/cent value
        "currency": "NGN",
        "description": `${description}`
      },
      "sender_name": `${sender_name}`,
      "brand_id": `${process.env.QOREPAY_BRAND_ID}`,
    });
  
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://gate.qorepay.com/api/v1/payouts/',
      headers: { 
        'Content-Type': 'application/json', 
        authorization: `Bearer ${process.env.QOREPAY_API_TOKEN}`
      },
      data: data
    };
  
    try {
      const response = await axios.request(config);
      console.log("Payout created:", JSON.stringify(response.data));
      return response.data.execution_url; // Extract execution_url from the response
    } catch (error) {
      console.error("Error creating payout:", error);
      throw error;
    }
};
  

// Function to get the bank list from the execution_url
async function getBankList(execution_url) {
    try {
        const response = await axios.post(execution_url);
        const payout_url = response.data.payout_url;
        return payout_url;

    } catch (error) {
        console.error("Error getting bank list:", error);
        throw error;
    }
};
  

// Function to complete the payout
async function completePayout(payout_url, account_number, bank_code, recipient_name) {
    let payoutData = JSON.stringify({
        "account_number": `${account_number}`,
        "bank_code": `${bank_code}`,
        "recipient_name": `${recipient_name}`,
    });

    let payoutConfig = {
        method: 'post',
        maxBodyLength: Infinity,
        url: payout_url,
        headers: { 
        'Content-Type': 'application/json', 
        authorization: `Bearer ${process.env.QOREPAY_API_TOKEN}`
        },
        data: payoutData
    };

    try {
        const response = await axios.request(payoutConfig);
        console.log("Payout completed:", JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error("Error completing payout:", error);
        throw error;
    }
};
  

/*
// Main function to orchestrate the entire process
async function main(req, res) {
    try {
        const execution_url = await createNewPayout();
        const payout_url = await getBankList(execution_url);
        await completePayout(payout_url, account_number, bank_code, recipient_name,{
            "account_number": '8156074667',
            "bank_code": "305",
            "recipient_name": "Chibuikem Daniel"
        });
    } catch (error) {
        console.error("Error in the payout process:", error);
    }
};

// Function to create a new payout
async function createNewPayout() {
    let data = JSON.stringify({
      "client": {
        "email": "xenithheight@gmail.com",
        "phone": "+2348181927251"
      },
      "payment": {
        "amount": 500, //5 naira, 00 is the kobo/cent value
        "currency": "NGN",
        "description": "Your test product."
      },
      "sender_name": "Odii Daniel",
      "brand_id": `${process.env.QOREPAY_BRAND_ID}`,
    });
  
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://gate.qorepay.com/api/v1/payouts/',
      headers: { 
        'Content-Type': 'application/json', 
        authorization: `Bearer ${process.env.QOREPAY_API_TOKEN}`
      },
      data: data
    };
  
    try {
      const response = await axios.request(config);
      console.log("Payout created:", JSON.stringify(response.data));
      return response.data.execution_url; // Extract execution_url from the response
    } catch (error) {
      console.error("Error creating payout:", error);
      throw error;
    }
};
*/
