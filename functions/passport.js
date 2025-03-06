

// import passport from "passport";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// import dotenv from "dotenv";
// import Google from "../models/google.js";

// dotenv.config();


// passport.use(
//     new GoogleStrategy(
//         {
//             clientID: process.env.CLIENT_ID,
//             clientSecret: process.env.CLIENT_SECRET,
//             callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
//             scope: ["profile", "email"],
//         },
//         async (accessToken, refreshToken, profile, done) => {
//             try {
//                 let user = await Google.findOne({ google_id: profile.id });

//                 if (!user) {
//                     user = new Google({
//                         google_id: profile.id,
//                         name: profile.displayName,
//                         email: profile.emails[0].value,
//                         photo: profile.photos[0].value,
//                         provider: profile.provider,
//                     });

//                     await user.save();
//                 }

//                 return done(null, user);
//             } catch (error) {
//                 console.error("Google Authentication Error:", error);
//                 return done(error, null);
//             }
//         }
//     )
// );


// passport.serializeUser((user, done) => {
//     done(null, user.id);
// });


// passport.deserializeUser(async (id, done) => {
//     try {
//         const user = await Google.findById(id);
//         done(null, user);
//     } catch (error) {
//         done(error, null);
//     }
// });

// export default passport;




import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import User from "../models/User.js";





passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // console.log("Google Profile:", profile); // Log the profile data
  
          let user = await User.findOne({ email: profile.emails[0].value });
  
          if (!user) {
            // console.log("Creating new user..."); // Log when creating a new user
            user = new User({
              google_id: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              photo: profile.photos[0].value,
              provider: "google",
            });
  
            await user.save();
            // console.log("User saved successfully:", user); // Log the saved user
          } else if (!user.google_id) {
            // console.log("Updating existing user with Google ID..."); // Log when updating an existing user
            user.google_id = profile.id;
            user.provider = "google";
            await user.save();
            // console.log("User updated successfully:", user); // Log the updated user
          }
  
          return done(null, user);
        } catch (error) {
          console.error("Google Authentication Error:", error);
          return done(error, null);
        }
      }
    )
  );
  
// user login karta hai to uski id session mein store hoti hai.
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // user wapas aaye to id ke zariye database se user ka pura data fetch hota hai
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

export default passport;



// Jab user Google login button click karega, usko Google ke login page pe bhej diya jaye ga.
// Google authentication hone ke baad user backend ke /google/callback route pe wapas aaye ga.
// Backend Google se user ka data fetch kar ke cookies me save karega aur frontend ke /dashboard page pe bhej dega.
// Frontend user ka data fetch kar ke usko local storage me save karega aur display karega.



