// src/components/ProfilePhoto.jsx
import { useState } from 'react';
import {
    Box,
    Button,
    Image,
    VStack,
    useToast,
    Icon,
    Input
} from '@chakra-ui/react';
import { FaUser, FaUpload } from 'react-icons/fa';
import axios from 'axios';

const ProfilePhoto = ({ user }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const toast = useToast();

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast({
                    title: 'Invalid file type',
                    description: 'Please select an image file',
                    status: 'error',
                    duration: 3000,
                });
                return;
            }
            
            // Validate file size (e.g., 5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: 'File too large',
                    description: 'Please select an image under 5MB',
                    status: 'error',
                    duration: 3000,
                });
                return;
            }

            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const uploadPhoto = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        try {
            // First, get the presigned URL from your backend
            const { data: { uploadUrl, photoUrl } } = await axios.get(
                `${process.env.REACT_APP_BACKEND_BASE_URL}/images/profile-photo-upload`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            console.log('Presigned URL:', uploadUrl);
            // Upload the file directly to S3
            await axios.put(uploadUrl, selectedFile, {
                headers: {
                    'Content-Type': selectedFile.type
                }
            });

            // Update user profile with the new photo URL
            await axios.post(
                `${process.env.REACT_APP_BACKEND_BASE_URL}/images/update-profile-photo`,
                { photoUrl },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            toast({
                title: 'Success',
                description: 'Profile photo updated successfully',
                status: 'success',
                duration: 3000,
            });

        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to upload profile photo',
                status: 'error',
                duration: 3000,
            });
            console.error('Upload error:', error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <VStack spacing={4} align="center">
            <Box
                position="relative"
                width="150px"
                height="150px"
                borderRadius="full"
                overflow="hidden"
                border="2px solid"
                borderColor="orange.500"
            >
                {previewUrl || user.photoUrl ? (
                    <Image
                        src={previewUrl || user.photoUrl}
                        alt="Profile"
                        width="100%"
                        height="100%"
                        objectFit="cover"
                    />
                ) : (
                    <Icon
                        as={FaUser}
                        width="100%"
                        height="100%"
                        color="gray.400"
                        p={4}
                    />
                )}
            </Box>
            
            <Input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                display="none"
                id="file-upload"
            />
            <label htmlFor="file-upload">
                <Button
                    as="span"
                    leftIcon={<FaUpload />}
                    colorScheme="orange"
                    cursor="pointer"
                >
                    Select Photo
                </Button>
            </label>
            
            {selectedFile && (
                <Button
                    onClick={uploadPhoto}
                    isLoading={isUploading}
                    colorScheme="orange"
                    variant="solid"
                >
                    Upload Photo
                </Button>
            )}
        </VStack>
    );
};

export default ProfilePhoto;