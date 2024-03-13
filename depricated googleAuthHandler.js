// HANDLE USER LOGIN WITH GOOGLE...
exports.googleAuthHandler = async (req, res) => {
    try{
      const { googleId, email, firstname, lastname, picture } = req.body;
  
      const existingUser = await User.findOne({ googleId });
  
      // IF GOOGLE USER IS ALREADY EXISITNG....
      if(existingUser){
         // Generate JWT token for authentication
      const token = jwt.sign({ googleId:googleId }, process.env.API_SECRET, { expiresIn: '1d' });
  
      // Respond with the token and user information
      res.status(200).json({
        message: 'Sign-in successful',
        token,
        user: {
          firstname: firstname,
          lastname: lastname,
          email: email,
          googleId: googleId
        }
      });
      }
      // IF GOOGLE USER NOT EXISTING......
      else{
  
        const newUser = new User({
          googleId: googleId,
          email: email,
          firstname: firstname,
          lastname: lastname,
          provider: "google",
          avatar_url: picture,
        });
  
        await newUser.save();
  
        res.status(200).json({
          message: "user registered successfully",
          newUser
        });
         // Log in the new user
        console.log('New user logged in:', newUser);
      }
  
    }
    catch(error){
      console.error(error)
    }
  };
