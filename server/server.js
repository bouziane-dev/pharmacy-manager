//! Uncomment the lines with this comment tag "//" and leave the rest as they are

const mongoose = require("mongoose");
const express = require("express");

const app = express();

// require("dotenv").config();

//* Configuring CORS
// const allowedOrigin = "http://localhost:3000"; //? Allowed origin (frontend URL)
// const allowedMethods = ["POST"]; //? Allowed methods

// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", allowedOrigin);
//   res.header("Access-Control-Allow-Methods", allowedMethods.join(", ")); //? Join methods into a comma-separated string if > 1 method
//   res.header("Access-Control-Allow-Headers", "Content-Type"); //? Allow Content-Type
//   next();
// });

//* Calling routes
//const exampleRoutes = require("./routes/example.js");

//* Middleware
// app.use(express.json()); //? This allows us to access the req data from the req handler

//* Using routes
//app.use("/api/examples", exampleRoutes);

//* Print the request type and path
// app.use((req) => {
//   console.log(req.path, req.method);
//   next();
// });

// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     app.listen(process.env.PORT, () => {
//       console.log("listening on port 5000");
//     });
//   })
//   .catch((error) => {
//     console.log(error);
//   });

const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

//module.exports = mongoose; //? Export the mongoose connection for use in other files
