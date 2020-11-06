const express = require("express");
const router = express.Router();

const Goal = require("../models/goals");

const passport = require("passport");

const customErrors = require("../../lib/custom_errors");

const handle404 = customErrors.handle404;

const requireOwnership = customErrors.requireOwnership;

const removeBlanks = require("../../lib/remove_blank_fields");

const requireToken = passport.authenticate("bearer", { session: false });

//Get All Goals
router.get("/goals", (req, res, next) => {
  Goal.find()
    .populate("owner")
    .then((goal) => res.json({ goal }))
    .catch(next);
});
//Get one goal
router.get("/goals/:id", (req, res, next) => {
  const id = req.params.id;
  Goal.findById(id)
    .populate("owner")
    .then(handle404)
    .then((goal) => res.json({ goal }))
    .catch(next);
});

//Create Goal
router.post("/goals", requireToken, (req, res, next) => {
  req.body.goal.owner = req.user.id;
  const goalData = req.body.goal;

  console.log("Goal data is:", goalData);
  Goal.create(goalData)
    .then((goal) => res.status(201).json({ goal }))
    .catch(next);
});

//Update
router.patch("/goals/:id", requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.goal.owner;

  Goal.findById(req.params.id)
    .then(handle404)
    .then((goal) => {
      // pass the `req` object and the Mongoose record to `requireOwnership`
      // it will throw an error if the current user isn't the owner
      requireOwnership(req, goal);
      console.log("routes goal:", goal);

      // pass the result of Mongoose's `.update` to the next `.then`
      return goal.updateOne(req.body.goal);
    })
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next);
});

//Delete Goal
router.delete("/goals/:id", (req, res, next) => {
  Goal.findById(req.params.id)
    .then(handle404)
    .then((goal) => {
      requireOwnership(req, goal);
      goal.deleteOne();
    })
    .then(() => res.sendStatus(204))
    .catch(next);
});
module.exports = router;
