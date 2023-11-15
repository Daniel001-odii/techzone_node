
// configuring stripe for payments...
const stripe = require('stripe')(require('../config').stripe.secretKey);




exports.createContract = async (req, res) => {
    const { contractBudget, employerId, userId } = req.body;
    // ... i saw the code below online from medium.......
    let paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
            number: '4545454545454545',
            exp_month: 2022,
            exp_year: 2024,
            cvc: '314',
        },
    });


    try {
      const paymentIntent = await stripe.paymentIntents.create({
        payment_method: paymentMethod.id,
        amount: contractBudget * 100, // Amount in cents
        currency: 'usd',
        description: 'Techzone Contract payment',
        payment_method_types: ['card'],
      });

      // Send the client secret to the front-end to complete the payment
      res.json({ clientSecret: paymentIntent });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }


  exports.releaseFunds = async (req, res) => {
    const { contractId, userId } = req.body;

  // Your business logic to distribute funds, deduct platform fee, etc.

  // Transfer funds to the user's Stripe account
  const transfer = await stripe.transfers.create({
    amount: amountToUser * 100, // Amount in cents
    currency: 'usd',
    destination: 'user-stripe-account-id',
  });

  // Handle the response and update the contract status
  // You can also handle disputes, refunds, and other scenarios here

  res.json({ message: 'Funds released successfully' });
  }