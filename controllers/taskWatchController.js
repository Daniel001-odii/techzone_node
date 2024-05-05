const Job = require('../models/jobModel');
const User = require('../models/userModel');
const Employer = require('../models/employerModel');
const Contract = require('../models/contractModel');
const Watch = require('../models/taskWatchModel');


// START WATCH
exports.startWatch = async (req, res) => {
    try {
        const contract = req.params.contract_id;
        const { activity_description } = req.body;

        if (!activity_description) {
            return res.status(400).json({ message: "Please provide an activity description" });
        }

        const today = new Date();
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        let time_tracking = await Watch.findOne({ contract, date });

        if (!time_tracking) {
            // If no time tracking record exists for today, create a new one
            time_tracking = new Watch({
                contract,
                date,
                time_stamp: { start_time: today, activity_description }
            });
        } else {
            // If a time tracking record exists for today, update it
            // time_tracking.time_stamp.push({ start_time: today, activity_description });
            time_tracking.time_stamp = { start_time: today, activity_description };
        }

        await time_tracking.save();

        res.status(200).json({ message: "Time watch started!", time_tracking });
    } catch (error) {
        console.log("Error starting time watch: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


// PAUSE WATCH
exports.pauseWatch = async (req, res) => {
    try {
        const contract = req.params.contract_id;
        const today = new Date();
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const watch = await Watch.findOne({ contract, date });
        watch.time_stamp.pause_time = today;
        await watch.save();

        res.status(200).json({ message: "watch paused!", watch });
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
        await watch.save();

        res.status(200).json({ message: "watch stopped!", watch });
    } catch (error) {
        console.log("Error stopping time watch: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

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
}

// GET WATCH FOR CURRENT DAY...
exports.getCurrentDayWatch = async (req, res) => {
    try{
        const contract = req.params.contract_id;

        const today = new Date();
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const watch = await Watch.findOne({ contract, date });

        if(!watch){
            const newWatch = new Watch({
                contract,
                date,
            });

            await newWatch.save();

            return res.status(200).json({ messsage: "new watch created!", newWatch });
        };

        res.status(200).json({ watch });
    } catch(error){
        res.status(500).json({ message: "internal server error"});
        console.log("error getting current day watch: ", error);
    }
}




exports.startWatch2 = async (req, res) => {
    try {
        const contract = req.params.contract_id;
        const { activity_description } = req.body;

        if (!activity_description) {
            return res.status(400).json({ message: "Please provide an activity description" });
        }

        const today = new Date();
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        let watch = await Watch.findOne({ contract });

        if (!watch) {
            const newWatch = new Watch({
                contract,
                date,
                time_stamp: [{ start_time: today, activity_description }]
            });

            await newWatch.save();

            return res.status(200).json({ message: "New watch started!", newWatch });
        }

        if (watch.date.toString() != date.toString()) {
            // If the watch date is different from the current date, push a new timestamp and return
            watch.date = date;
            watch.time_stamp.push({ start_time: today, activity_description });
            await watch.save();
            
        }

        // If the watch date is the same as the current date, do nothing

        console.log("Found watch date and today's date same?: ", watch.date.toString() == date.toString(), " watch: ", watch.date, "today: ", date);
        res.status(200).json({ message: "Time watch updated!", watch });
        // res.status(200).json({ message: "Time watch already started for today!", watch });
    } catch (error) {
        console.log("Error starting time watch: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}




// PAUSE WATCH


// STOP WATCH


// GET WATCH BY ID