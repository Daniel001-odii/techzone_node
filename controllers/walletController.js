const Wallet = require("../models/walletModel");
const User = require("../models/userModel");


// get user wallet
exports.getUserWallet = async(req, res) => {
    try{
        const wallet = await Wallet.findOne({ user: req.user_id });
        if(!wallet){
            return res.status(404).json({ message: "user walet not found"});
        }

        res.status(200).json({ wallet });

    }catch(error){
        console.log("error getting user wallet: ", error);
        res.status(500).json({ message: "internal server error"});
    }
}

// USER WALLET ROUTE WILL BE IN USER 
// withdrawfunds to user wallet

// 