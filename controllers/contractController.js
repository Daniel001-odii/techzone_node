const Job = require('../models/jobModel');
const User = require('../models/userModel');
const Employer = require('../models/employerModel');
const Contract = require('../models/contractModel');
const Application = require('../models/applicationModel');

// SEND NOTIFICATIONS TO USER
// controller to create and send offer to user...
exports.sendContractOffer = async(req, res) =>{
    if(req.employerId){
        try{
            const {user_id, job_id} = req.params;
            const user = await User.findById(user_id);
    
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
                return res.status(200).json({ newContract, message: `You sent the contract offer to ${user.firstname} ${user.lastname}` });
            }
        }catch(error){
            console.log(error);
            res.status(500).json({ message: 'internal server error from sendContract' })
        }
    }else{
        return res.status(400).json({ message: "sorry only employers can send contracts.."})
    }
};

// SEND NOTIFICATIONS TO EMPLOYER
// controller to allow users to accept a contract
exports.acceptOffer = async(req, res) => {
    try{
        const job_id = req.params.job_id;
        const offer = await Contract.findOne({ user: req.userId, job: job_id});
        if(!offer){
            return res.status(404).json({ message: "Contract not found"});
        }

        offer.action = "accepted";
        await offer.save();
        return res.status(200).json({ offer, message: "You accepted the offer"})

    }catch(error){
        console.log(error);
        res.status(500).json({ message: 'internal server error from acceptOffer' });
    }
}

// SEND NOTIFICATIONS TO EMPLOYER
// controller to allow users to accept a contract
exports.declineOffer = async(req, res) => {
    try{
        const job_id = req.params.job_id;
        const offer = await Contract.findOne({ user: req.userId , job: job_id });
        if(!offer){
            return res.status(404).json({ message: "Contract not found"});
        }
        offer.action = "declined";
        await offer.save();
        return res.status(200).json({ offer, message: "You declined the offer"});

    }catch(error){
        console.log(error);
        res.status(500).json({ message: 'internal server error from declineOffer' })
    }
}

// controller to get all user contracts...
exports.getContracts = async(req, res) => {
    try{
        if(req.userId){
            const contracts = await Contract.find({ user:req.userId });
            return res.status(200).json({ contracts });
        } else if(req.employerId){
            const contracts = await Contract.find({ user:req.employerId });
            return res.status(200).json({ contracts });
        }
        return res.status(404).json({ message: "You have no contracts yet"})
       
    }catch(error){
        console.log(error)
    }
}
