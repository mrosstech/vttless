import { HttpRequest } from "@aws-sdk/protocol-http";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { parseURL } from "@aws-sdk/url-parser";
import { Sha256 } from "@aws-crypto/hash-node";
import { Hash } from "@aws-sdk/hash-node";
import { formatURL } from "@aws-sdk/util-format-url";


exports.addProfile = async (req, res, next) => {
    try {
        const {user} = req;
        const friends = await Friend.find({ $and: [ {"requestee": user._id}, {"confirmed": false} ] } );
        res.status(200).send(friends);
    } catch (err) {
        console.log(err);
        res.status(500).send({error: "Error getting unconfirmed friend requests"});
    }
}