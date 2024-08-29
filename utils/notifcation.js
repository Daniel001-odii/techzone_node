const { getIo } = require('./socket');
const notificationModel = require('../models/notificationModel');


async function notify(message, type, user, employer, link_url){
    try{
        const newNotification = new notificationModel({
           message,
           type,
           user,
           employer,
           link_url
        });

        await newNotification.save();
        
        if(user){
            console.log("sent notification for user: ", user);
        } else if(employer){
            console.log("sent notification for employer: ", employer);   
        }
       
        const io = getIo();
         // Emit the notification to a specific room corresponding to the user ID
        if(user){
            io.to(`user_${user}`).emit(`notification_${user}`, { message });
        } else if(employer){
            io.to(`user_${employer}`).emit(`notification_${employer}`, { message });   
        }
        
    }catch(error){
        throw error
        console.log("error sending notification: ", error);
    }
}

module.exports = { notify };
