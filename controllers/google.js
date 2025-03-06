// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// dotenv.config()

// const generateAccessToken = (user) => {
//     return jwt.sign({ id: user._id, email: user.email }, process.env.ACCESS_TOKEN, { expiresIn: "6h" })
// }

// const generateRefreshToken = (user) => {
//     return jwt.sign({ id: user._id, email: user.email }, process.env.REFRESH_TOKEN, { expiresIn: "7d" })
// }


// const googleAuthCallback = async (req, res) => {
//     try {
//         const user = req.user;
//         if (!user) {
//             return res.status(401).json({ error: true, message: "Not authorized" });
//         }
//         const accessToken = generateAccessToken(user);
//         const refreshToken = generateRefreshToken(user);

//         console.log("Access Token:", accessToken);
//         console.log("Refresh Token:", refreshToken);
//         const cookieObj = {
//             httpOnly: true,
//             secure: true,
//             sameSite: "none",
//             maxAge: 6 * 60 * 60 * 1000
//         }
//         res.cookie("accessToken", cookieObj, accessToken);

//         res.cookie("refreshToken", cookieObj, refreshToken);

//         return res.redirect(`${process.env.CLIENT_URL}/dashboard`);


//     } catch (error) {
//         console.error("Google Auth Error:", error);
//         res.status(500).json({ error: true, message: "Authentication error" });
//     }
// };

// const loginSuccess = (req, res) => {
//     if (!req.user) {
//         return res.status(200).json({
//             error: true,
//             message: "User not authenticated",
//             user: null,
//             accessToken: null
//         });
//     }

//     const accessToken = generateAccessToken(req.user);

//     res.status(200).json({
//         success: true,
//         message: "Login successful",
//         user: req.user,
//         accessToken: accessToken
//     });
// };
// ;

// const refreshAccessToken = async (req, res) => {
//     try {
//         const refreshToken = req.cookies.refreshToken;
//         if (!refreshToken) {
//             return res.status(401).json({ error: true, message: "Unauthorized" });
//         }

//         // Verify Refresh Token
//         jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
//             if (err) {
//                 return res.status(403).json({ error: true, message: "Invalid refresh token" });
//             }

//             // Generate New Access Token
//             const newAccessToken = generateAccessToken({ _id: decoded.id, email: decoded.email });

//             res.cookie("accessToken", newAccessToken, {
//                 httpOnly: true,
//                 secure: process.env.NODE_ENV === "production",
//                 sameSite: "none",
//                 path: "/",
//                 maxAge: 6 * 60 * 60 * 1000, // 6 hours
//             });

//             res.status(200).json({ error: false, accessToken: newAccessToken });
//         });
//     } catch (error) {
//         res.status(500).json({ error: true, message: "Token refresh failed" });
//     }
// };

// const logoutUser = (req, res) => {
//     try {
//         console.log("Logging out user...");

//         // Destroy session if using express-session
//         if (req.session) {
//             req.session.destroy((err) => {
//                 if (err) {
//                     console.error("Session Destroy Error:", err);
//                     return res.status(500).json({ error: true, message: "Logout failed" });
//                 }
//             });
//         }

//         // Clear cookies
//         res.clearCookie("connect.sid", {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === "production",
//             sameSite: "None",
//             path: "/"
//         });

//         res.cookie("accessToken", "", { expires: new Date(0), path: "/" });
//         res.cookie("refreshToken", "", { expires: new Date(0), path: "/" });

//         console.log("Cookies cleared, session destroyed.");

//         return res.json({ success: true, message: "Logged out successfully" });
//     } catch (error) {
//         console.error("Logout Error:", error);
//         res.status(500).json({ error: true, message: "Logout failed" });
//     }
// };




// const logoutGoogleUser = (req, res, next) => {
//     try {
//         console.log("Logging out Google user...");

//         req.logout((err) => {
//             if (err) {
//                 console.error("Logout Error:", err);
//                 return next(err);
//             }

//             // Clear session cookie
//             res.clearCookie("connect.sid", {
//                 httpOnly: true,
//                 secure: process.env.NODE_ENV === "production" ? true : false,
//                 sameSite: "None",
//                 path: "/",
//             });

//             return res.json({ success: true, message: "Google Logged out successfully" });
//         });
//     } catch (error) {
//         console.error("Google Logout Error:", error);
//         res.status(500).json({ error: true, message: "Google Logout failed" });
//     }
// };


// export { googleAuthCallback, loginSuccess, refreshAccessToken, logoutUser, logoutGoogleUser };


import jwt from "jsonwebtoken";
    const { JWTKEY } = process.env;
    const generateAccessToken = (user) => {
        return jwt.sign({ _id: user._id, email: user.email }, JWTKEY, {
            expiresIn: "6h",
        });
    };
  
  const generateRefreshToken = (user) => {
    return jwt.sign({  _id: user._id, email: user.email }, process.env.REFRESH_TOKEN, {
      expiresIn: "7d",
    });
  };
  //Google OAuth authentication complete hone ke baad user ka session create karta hai, cookies set karta hai, aur dashboard pe redirect karta hai.
  const googleAuthCallback = async (req, res) => {
    try {
      //google sy authenticate user ka data mily ga re.user sy
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: true, message: "Not authorized" });
      }
  
    


    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    


    const cookieObj = {
      secure: process.env.NODE_ENV === "production",//
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 6 * 60 * 60 * 1000, //6hours
  };

          
    res.cookie("accessToken", accessToken, { ...cookieObj });
    res.cookie("refreshToken", refreshToken, { ...cookieObj });
          
       //user data store in cookie
        const userData = {
            token: accessToken, 
            provider: "google", 
            _id: user._id,
            name: user.name,
            email: user.email,
            chatBots: user.chatBots || [], 
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            __v: user.__v,
          };
          //store in browser cookie 
          res.cookie("userData", JSON.stringify(userData), { ...cookieObj });
       //after complete authentication redirect dashbaord page
      return res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    } catch (error) {
      console.error("Google Auth Error:", error);
      res.status(500).json({ error: true, message: "Authentication error" });
    }
  };
  
  //Ye function frontend se user ka authentication check karne ke liye hai
  const loginSuccess = (req, res) => {
    //ye eek Express route handler hai jo frontend ke useEffect se call hoga.
    //req.user check if user login or not 
    if (!req.user) {
      return res.status(403).json({
        error: true,
        message: "User not authenticated",
        user: null,
        accessToken: null,
      });
    }
  
  
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: req.user,
    });
  };
  
  export { googleAuthCallback, loginSuccess };