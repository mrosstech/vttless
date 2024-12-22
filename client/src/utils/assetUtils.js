import { api } from '../common/axiosPrivate.js';

export const uploadAsset = async (file, type, campaignId) => {
    try {
        // Get presigned URL
        const { data: { uploadUrl, assetId } } = await api.post(
            '/assets/upload-url',
            {
                fileName: file.name,
                fileType: file.type,
                type,
                campaignId
            }
        );

        // Upload file directly to S3
        await api.put(uploadUrl, file, {
            headers: {
                'Content-Type': file.type
            }
        });

        // Confirm upload
        const response = await api.post(
            '/assets/confirm-upload',
            { assetId }
        );

        return assetId;
    } catch (error) {
        // toast({
        //     title: "Upload failed",
        //     description: error.message,
        //     status: "error"
        // });
        throw error;
    }
};

export const loadAssetUrl = async (assetId) => {
    try {
        const { data: { downloadUrl } } = await api.get(
            `/assets/${assetId}/download-url`);
        return downloadUrl;
    } catch (error) {
        console.error('Error loading asset:', error);
        throw error;
    }
};
