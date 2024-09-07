const Wallet = require("../models/walletModel");
const User = require("../models/userModel");



// get user wallet
exports.getUserWallet = async(req, res) => {
    try{
        const wallet = await Wallet.findOne({ user: req.userId });
        if(!wallet){
            const newWallet = new Wallet({
                user: req.userId,
            })
            await newWallet.save();
            return res.status(201).json({ message: "created new user wallet", newWallet });
        }

        res.status(200).json({ wallet });

    }catch(error){
        console.log("error getting user wallet: ", error);
        res.status(500).json({ message: "internal server error"});
    }
}


exports.getWalletTransactions = async (req, res) => {
    try{
        const wallet = await Wallet.findOne({ user: req.userId });
        if(!wallet){
            return res.status(404).json({ message: "user wallet not found"});
        };
        const transactions = wallet.transactions;

        res.status(200).json({ transactions });
    }catch(error){
        console.log("error getting user wallet transactions: ", error);
        res.status(500).json({ message: "internal server error"});
    }
}
// USER WALLET ROUTE WILL BE IN USER 
// withdrawfunds to user wallet

// 