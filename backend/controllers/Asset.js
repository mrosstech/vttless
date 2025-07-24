// backend/controllers/Asset.js
const AWS = require('aws-sdk');
const Asset = require('../models/asset');

const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

exports.getUploadUrl = async (req, res) => {
    console.log('getUploadUrl called');
    try {
        const { fileName, fileType, assetType, campaignId } = req.body;
        
        const environment = process.env.NODE_ENV || 'development';
        const key = `${environment}/campaigns/${campaignId}/${assetType}/${Date.now()}-${fileName}`;
        
        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
            Expires: 60 // URL expires in 60 seconds
        };

        const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
        
        // Create a pending asset record
        const asset = new Asset({
            name: fileName,
            type: assetType,
            key: key, // Store the S3 key instead of the full URL
            campaign: campaignId,
            uploadedBy: req.user._id,
            status: 'pending' // Add status to track upload completion
        });

        await asset.save();

        res.json({
            uploadUrl,
            assetId: asset._id
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.confirmUpload = async (req, res) => {
    console.log('confirmUpload called');
    try {
        const { assetId } = req.body;
        
        const asset = await Asset.findById(assetId);
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        asset.status = 'active';
        await asset.save();

        res.json({ message: 'Upload confirmed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDownloadUrl = async (req, res) => {
    console.log('getDownloadUrl called');
    try {
        const { id: assetId } = req.params;
        
        const asset = await Asset.findById(assetId);
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: asset.key,
            Expires: 3600 // URL expires in 1 hour
        };

        const downloadUrl = await s3.getSignedUrlPromise('getObject', params);
        
        res.json({ downloadUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCampaignAssets = async (req, res) => {
    console.log('getCampaignAssets called');
    try {
        const { campaignId } = req.params;
        
        // Find all active assets for this campaign
        const assets = await Asset.find({
            campaign: campaignId,
            status: 'active'
        }).select('_id name type key campaign uploadedBy createdAt')
          .populate('uploadedBy', 'username')
          .sort({ createdAt: -1 });

        // Generate download URLs for all assets
        const assetsWithUrls = await Promise.all(
            assets.map(async (asset) => {
                try {
                    const params = {
                        Bucket: process.env.AWS_S3_BUCKET_NAME,
                        Key: asset.key,
                        Expires: 3600 // URL expires in 1 hour
                    };

                    const downloadUrl = await s3.getSignedUrlPromise('getObject', params);
                    
                    return {
                        _id: asset._id,
                        name: asset.name,
                        type: asset.type,
                        url: downloadUrl,
                        uploadedBy: asset.uploadedBy,
                        createdAt: asset.createdAt
                    };
                } catch (error) {
                    console.error(`Error generating URL for asset ${asset._id}:`, error);
                    return {
                        _id: asset._id,
                        name: asset.name,
                        type: asset.type,
                        url: null,
                        uploadedBy: asset.uploadedBy,
                        createdAt: asset.createdAt
                    };
                }
            })
        );

        res.json(assetsWithUrls);
    } catch (error) {
        console.error('Error fetching campaign assets:', error);
        res.status(500).json({ message: error.message });
    }
};