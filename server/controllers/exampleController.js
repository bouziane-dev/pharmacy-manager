const Model = require("../models/exampleModel");
const mongoose = require("mongoose");

const get_function = (req, res) => {
  //? This is where you'd typically fetch data from a database
  const products = [
    { id: 1, name: "Product A", price: 100 },
    { id: 2, name: "Product B", price: 200 },
  ];

  res.json(products);
};

module.exports = {
  get_function,
};
