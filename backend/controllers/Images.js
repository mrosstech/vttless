const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const User = require('../models/user');
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const awsRegion = process.env.AWS_REGION;
const s3Client = new S3Client({
    profile: 'spigotprofile',
});

exports.getProfilePhotoUploadUrl = async (req, res) => {
    console.log("Getting profile photo upload URL")
    try {
        const userId = req.user._id;
        const fileExtension = '.jpeg'; // You might want to make this dynamic based on file type
        const fileName = `${userId}/profile/${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
        console.log("File name: ", fileName)
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `profiles/${fileName}`,
            ContentType: 'image/jpeg', // Make this dynamic based on file type
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        const photoUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/profiles/${fileName}`;
        console.log("Photo URL: " + photoUrl)
        console.log("Upload URL: " + uploadUrl)
        res.json({
            uploadUrl,
            photoUrl
        });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
};

exports.updateProfilePhoto = async (req, res) => {
    console.log("Updating profile photo")
    try {
        const { photoUrl } = req.body;
        const userId = req.user._id;

        // Update user's profile photo URL in database
        await User.findByIdAndUpdate(userId, { photoUrl });

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating profile photo:', error);
        res.status(500).json({ error: 'Failed to update profile photo' });
    }
};