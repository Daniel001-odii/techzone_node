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
        const contract_id = req.params.contract_id;
        const offer = await Contract.findOne({ user: req.userId, _id: contract_id});
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
        const contract_id = req.params.contract_id;
        const offer = await Contract.findOne({ user: req.userId , _id: contract_id });
        if(!offer){
            return res.status(404).json({ message: "Contract not found"});
        }
        offer.action = "declined";
        offer.status = "closed";
        await offer.save();
        return res.status(200).json({ offer, message: "You declined the offer"});

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
        return res.status(200).json({ offer, message: "Contract completed successfuly"});

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
        return res.status(200).json({ offer, message: "Contract paused successfuly"});

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
        if(!offer){
            return res.status(404).json({ message: "Contract not found"});
        }
        offer.status = "open";
        await offer.save();
        return res.status(200).json({ offer, message: "Contract resumed successfuly"});

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
        if(!offer){
            return res.status(404).json({ message: "Contract not found"});
        }
        offer.status = "closed";
        await offer.save();
        return res.status(200).json({ offer, message: "Contract closed successfuly"});

    }catch(error){
        console.log(error);
        res.status(500).json({ message: 'internal server error from close offer' })
    }
}

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

// controller to get all user completed contracts...
exports.getCompletedContracts = async(req, res) => {
    try{
        if(req.params.user_id){
            const contracts = await Contract.find({ user:req.params.user_id, action: "accepted", $or: [{ status: "completed" }, { status: "open" }] })
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
        } else {
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
        }

   

        
       
    }catch(error){
        console.log(error)
    }
}

// controller to get a particular contract by its ID...
exports.getContractById = async(req, res) => {
    try{
        const contract_id = req.params.contract_id;
        const contract = await Contract.findById(contract_id)
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
