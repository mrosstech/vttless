// src/components/ProfilePhoto.jsx
import { useState, useEffect } from 'react';
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
import {useAuth} from '../providers/AuthProvider';
import axios from 'axios';

// Utility function to handle profile photo URL caching
const getProfilePhotoFromCache = () => {
    console.log("getProfilePhotoFromCache");
    const cached = localStorage.getItem('profilePhotoUrl');
    if (cached) {
      const { url, expiry } = JSON.parse(cached);
      if (expiry > Date.now()) {
        return url;
      }
      localStorage.removeItem('profilePhotoUrl'); // Clear expired cache
    }
    return null;
};

const ProfilePhoto = ({ user }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
    const toast = useToast();
    const myUser = useAuth();

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
    const fetchProfilePhoto = async () => {
        console.log("fetchProfilePhoto");
        try {
            // First check cache
            const cachedUrl = getProfilePhotoFromCache();
            if (cachedUrl) {
            setProfilePhotoUrl(cachedUrl);
            return;
            }
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_BASE_URL}/images/profile-photo-download-url`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
            });
            const { downloadUrl } = response.data;

            // Cache the URL with expiration (50 minutes to account for hour limit on the presigned URL)
            localStorage.setItem('profilePhotoUrl', JSON.stringify({ url: downloadUrl, expiry: Date.now() + 50 * 60 * 1000 }));
            setProfilePhotoUrl(downloadUrl);
        } catch (error) {
            console.error('Error fetching profile photo:', error);
        }
    };

    useEffect(() => {
        if (myUser) {
          fetchProfilePhoto();
        }
      }, [myUser]);

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
            // Clear the URL cache
            localStorage.removeItem('profilePhotoUrl');

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
                {previewUrl || profilePhotoUrl ? (
                    <Image
                        src={previewUrl || profilePhotoUrl}
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