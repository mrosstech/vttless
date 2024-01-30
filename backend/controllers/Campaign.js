const { Campaign } = require('../models');
const passport = require('passport');

exports.list = async (req, res, next) => {
    res.send({message: "campaign lists not implemented"});
}

exports.add = async (req, res, next) => {
    res.send({message: "add a new campaign not implemented"});
}

exports.delete = async (req, res, next) => {
    res.send({message: "delete campaign not implemented"});
}

exports.update = async (req, res, next) => {
    res.send({message: "update campaign not implemented"});
}