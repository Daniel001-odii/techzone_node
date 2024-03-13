exports.login = async (req, res) => {
    console.log("login detected...")
    try {
        const { email, password } = req.body;

        Promise.all([
            User.findOne({ email }).exec(),
            Employer.findOne({ email }).exec(),
        ])
        .then(([user, employer]) => {
            if (!user && !employer) {
                return res.status(404).send({ message: "User with email not found" });
            }

            // Determine user's role
            const role = user ? 'user' : 'employer';

            // Compare password
            const isValidPassword = user
                ? bcrypt.compareSync(password, user.password)
                : bcrypt.compareSync(password, employer.password);

            if (!isValidPassword) {
                return res.status(401).send({ message: "Invalid username or password" });
            }

            // Assign user/employer id to response and generate token
            const userId = user ? user.id : employer.id;
            const token = jwt.sign({ id: userId, role }, process.env.API_SECRET, { expiresIn: '1d' });

            // Send a response
            const response = {
                user: {
                    id: userId,
                    email: email,
                    role: role,
                },
                message: "Login Successful",
                accessToken: token,
            };

            res.status(200).send(response);
        })
        .catch((err) => {
            res.status(500).send({ message: err });
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Login failed" });
    }
};