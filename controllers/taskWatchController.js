const Job = require('../models/jobModel');
const User = require('../models/userModel');
const Employer = require('../models/employerModel');
const Contract = require('../models/contractModel');
const Notification = require('../models/notificationModel');
const Watch = require('../models/taskWatchModel');

// SEND NOTIFICATION TO EMPLOYER >>>>
// START WATCH
exports.startWatch = async (req, res) => {
    try {
        let contract = req.params.contract_id;
        const contract_obj = await Contract.findById(contract);
        const { activity_description } = req.body;

        if (!activity_description) {
            return res.status(400).json({ message: "Please provide an activity description" });
        }

        const today = new Date();
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        let watch = await Watch.findOne({ contract, date });

        if(contract_obj && contract_obj.status == 'closed'){
            return res.status(400).json({ message: "You can't clock in, this contract has been closed!" });
        } else if(contract_obj && contract_obj.status == 'completed'){
            return res.status(400).json({ message: "You can't clock in, this contract is already completed" });
        } else if(contract_obj && contract_obj.status == 'paused'){
            return res.status(400).json({ message: "You can't clock in, this contract has been paused!" });
        }else {
            if (!watch) {
                // If no time tracking record exists for today, create a new one
                watch = new Watch({
                    contract,
                    date,
                    status: "active",
                    time_stamp: { clock_in_time: today, activity_description, duration: 0 }
                });
            } else {
                // If a time tracking record exists for today, update it
                watch.time_stamp = { clock_in_time: today, activity_description, duration: 0 };
                watch.status = "active";
            }
        };

         // alert employer about user clock-in...
         const mainContract = await Contract.findById(contract);
         const employer = await Employer.findById(mainContract.employer);
         const user = await User.findById(mainContract.user);
         const job = await Job.findById(mainContract.job);
         // NOTIFY USER HERE >>>
         const newNotification = new Notification({
             receiver: "employer",
             employer,
             type: 'contract',
             // employer: req.employerId,
             message:  `Your hired freelancer ${user.firstname} ${user.lastname} clocked-in for the contract: ${job.title}`,
             link_url: `/contracts/${contract}`,
         });
         await newNotification.save();

       

        await watch.save();

        res.status(200).json({ message: "Time watch started!", watch });
    } catch (error) {
        console.log("Error starting time watch: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


// PAUSE WATCH
// toggles watch status from paused and active...
exports.pauseAndResumeWatch = async (req, res) => {
    try {
        const contract = req.params.contract_id;
        const today = new Date();
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const watch = await Watch.findOne({ contract, date });

        if(!watch){
            return res.status(400).json({ success: false, message: "you have to clock in first!"});
        }

        if(watch.status == 'active'){

            // add the pause time...
            watch.time_stamp.stop_time = today;

            // set watch status
            watch.status = 'paused';

            if(watch.time_stamp.start_time){
                // set duration...
                watch.time_stamp.duration += Math.abs(today - watch.time_stamp.start_time) / 1000; 
            } else {
                // set duration...
                watch.time_stamp.duration += Math.abs(today - watch.time_stamp.clock_in_time) / 1000; 
            }

           

            // save to DB...
            await watch.save();
            return res.status(200).json({ message: "watch paused!", watch });

        } else if(watch.status == 'paused'){

            // add the resume time...
            watch.time_stamp.start_time = today;

            // watch.time_stamp.resume_times = today;
            watch.status = 'active'

             // set duration...
             watch.time_stamp.duration += Math.abs(today - watch.time_stamp.start_time) / 1000; 

            // save to DB
            await watch.save()

            return res.status(200).json({ message: "watch resumed!", watch });
        } else {
            return res.status(500).json({ message: "you already clocked out today!"});
        }

        
    } catch (error) {
        console.log("Error pausing time watch: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


// STOP WATCH
exports.stopWatch = async (req, res) => {
    try {
        const contract = req.params.contract_id;
        const today = new Date();
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const watch = await Watch.findOne({ contract, date });
        watch.time_stamp.stop_time = today;

        if(watch.status == 'paused'){
            watch.status = "stopped";
            await watch.save();
            return res.status(200).json({ message: "watch stopped!", watch });

        } else if(watch.status == 'active'){
            // add the pause time...
            watch.time_stamp.stop_time = today;

            // set watch status
            watch.status = 'stopped';

            if(watch.time_stamp.start_time){
                // set duration...
                watch.time_stamp.duration += Math.abs(today - watch.time_stamp.start_time) / 1000; 
            } else {
                // set duration...
                watch.time_stamp.duration += Math.abs(today - watch.time_stamp.clock_in_time) / 1000; 
            }

            await watch.save();

            return res.status(200).json({ message: "watch stopped!", watch });

        }
    } catch (error) {
        console.log("Error stopping time watch: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



// GET ALL  WATCH FOR A PARTICULAR CONTRACT...
exports.getWatch = async (req, res) => {
    try {
        const contract = req.params.contract_id;

        const watch_list = await Watch.find({ contract });

        if(!watch_list){
            return res.status(404).json({ message: "no watch found for this contract"});
        }

        res.status(200).json({ watch_list });

    } catch(error){
        console.log("error getting watch list for contract: ", error);
        res.status(500).json({ message: "internal server error"});
    }
};



// GET WATCH FOR CURRENT DAY...
exports.getCurrentDayWatch = async (req, res) => {
    try{
        const contract = req.params.contract_id;

        const today = new Date();
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const watch = await Watch.findOne({ contract, date });

        if(!watch){
            // const newWatch = new Watch({
            //     contract,
            //     date,
            // });

            // await newWatch.save();

            // return res.status(200).json({ messsage: "new watch created!", newWatch });
            return res.status(201).json({ messsage: "no watch found for today"});
        };

        res.status(200).json({ watch });
    } catch(error){
        res.status(500).json({ message: "internal server error"});
        console.log("error getting current day watch: ", error);
    }
}


// SEND NOTIFICATION TO USER******
// EMPLOYER APPROVE WATCH TIMESTAMP
exports.approveTimestamp = async (req, res) => {
    try{

        const employer = await Employer.findById(req.employerId);
        const watch = await Watch.findById(req.params.watch_id);
        const contract = await Contract.findById(watch.contract);
        
        if(employer && contract.employer.toString() === employer._id.toString()){
            watch.time_stamp.action = "approved";
            await watch.save();
            return res.status(200).json({ message: "watch approved!", watch });
        } else {
            res.status(400).json({ message: "you are not permitted to perform this operation"})
        }
    }catch(error){
        console.log("error approving time: ", error);
        res.status(500).json({ message: "internal server error"});
    }
}


// SEND NOTIFICATION USER******

// EMPLOYER DECLINE WATCH TIMESTAMP
exports.declineTimestamp = async (req, res) => {
    try{

        const employer = await Employer.findById(req.employerId);
        const watch = await Watch.findById(req.params.watch_id);
        const contract = await Contract.findById(watch.contract);
        
        if(employer && contract.employer.toString() === employer._id.toString()){
            watch.time_stamp.action = "declined";
            await watch.save();
            return res.status(200).json({ message: "watch declined!", watch });
        } else {
            res.status(400).json({ message: "you are not permitted to perform this operation"})
        }
    }catch(error){
        console.log("error declining time: ", error);
        res.status(500).json({ message: "internal server error"});
    }
}




// Calculate duration of an activity
const calculateDuration = (activity) => {
    const { startTime, stopTime, pauseTime } = activity;
    let duration = Math.abs(stopTime - startTime) / 1000; // Duration in seconds
    if (pauseTime) {
        duration -= Math.abs(pauseTime - startTime) / 1000; // Subtract paused time
    }
    return duration;
};

// Sum up total time tracked for each day
const calculateTotalTimeForDay = (activities) => {
    let totalTime = 0;
    for (const activity of activities) {
        totalTime += calculateDuration(activity);
    }
    return totalTime;
};


