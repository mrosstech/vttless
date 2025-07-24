import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    IconButton,
    Card,
    CardBody,
    useToast,
    Switch,
    FormControl,
    FormLabel
} from '@chakra-ui/react';
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash } from 'react-icons/fa';
import Peer from 'simple-peer';

// Polyfill for simple-peer Node.js dependencies
if (typeof window !== 'undefined') {
    // Process polyfill
    if (!window.process) {
        const process = require('process/browser.js');
        window.process = process;
        window.global = window.global || window;
    }
    
    // Buffer polyfill
    if (!window.Buffer) {
        const { Buffer } = require('buffer');
        window.Buffer = Buffer;
    }
    
    // Stream polyfills for readable-stream
    if (!window.setImmediate) {
        window.setImmediate = function(fn, ...args) {
            return setTimeout(() => fn.apply(null, args), 0);
        };
        window.clearImmediate = clearTimeout;
    }
    
}

const VideoChat = ({ socket, campaignId, userId, userName, campaign, isOpen, isRightSidebar = false, performanceState }) => {
    const [localStream, setLocalStream] = useState(null);
    const [peers, setPeers] = useState({});
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isInCall, setIsInCall] = useState(false);
    const localVideoRef = useRef(null);
    const peersRef = useRef({});
    const toast = useToast();

    // Initialize local media stream with adaptive quality
    const initializeLocalStream = useCallback(async () => {
        try {
            // Reduce video quality during heavy interactions
            const videoConstraints = performanceState?.isHeavyInteraction ? 
                { width: 160, height: 120, frameRate: 15 } : 
                { width: 320, height: 240, frameRate: 30 };
                
            const stream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
                audio: true
            });
            
            setLocalStream(stream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            toast({
                title: "Camera and microphone ready",
                status: "success",
                duration: 2000
            });
        } catch (error) {
            console.error('Error accessing media devices:', error);
            toast({
                title: "Media access denied",
                description: "Please allow camera and microphone access to use video chat",
                status: "error",
                duration: 5000
            });
        }
    }, [toast, performanceState]);

    // Create peer connection for new user with improved error handling
    const createPeer = useCallback((userToSignal, stream, isInitiator) => {
        console.log(`🔗 Creating peer connection: ${userId} ${isInitiator ? '→' : '←'} ${userToSignal}`);
        
        const peer = new Peer({
            initiator: isInitiator,
            trickle: true, // Enable trickle ICE for better connectivity
            stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        });

        peer.on('signal', signal => {
            const eventName = isInitiator ? 'webrtc-offer' : 'webrtc-answer';
            console.log(`📡 Sending ${eventName} from ${userId} to ${userToSignal}`);
            
            socket.emit(eventName, {
                campaignId,
                fromUserId: userId,
                toUserId: userToSignal,
                signal,
                userName: userName,
            });
        });

        peer.on('stream', remoteStream => {
            console.log(`🎥 Received stream from ${userToSignal}`);
            
            // Update both refs and state atomically
            const userName = peersRef.current[userToSignal]?.userName || 'Unknown';
            
            setPeers(prevPeers => ({
                ...prevPeers,
                [userToSignal]: {
                    ...prevPeers[userToSignal],
                    stream: remoteStream,
                    peer,
                    userName,
                    connected: true
                }
            }));
        });

        peer.on('connect', () => {
            console.log(`✅ Peer connected: ${userToSignal}`);
            setPeers(prevPeers => ({
                ...prevPeers,
                [userToSignal]: {
                    ...prevPeers[userToSignal],
                    connected: true
                }
            }));
        });

        peer.on('close', () => {
            console.log(`📴 Peer connection closed: ${userToSignal}`);
            setPeers(prevPeers => {
                const newPeers = { ...prevPeers };
                delete newPeers[userToSignal];
                return newPeers;
            });
            delete peersRef.current[userToSignal];
        });

        peer.on('error', error => {
            console.error(`❌ Peer connection error with ${userToSignal}:`, error);
            
            // Clean up failed connection
            setPeers(prevPeers => {
                const newPeers = { ...prevPeers };
                delete newPeers[userToSignal];
                return newPeers;
            });
            delete peersRef.current[userToSignal];
            
            toast({
                title: "Connection error",
                description: `Failed to connect to ${peersRef.current[userToSignal]?.userName || userToSignal}`,
                status: "error",
                duration: 3000
            });
        });

        return peer;
    }, [socket, campaignId, userId, userName, toast]);

    // Join video call with improved connection handling
    const joinCall = useCallback(async () => {
        console.log(`🚀 ${userName} (${userId}) attempting to join video call...`);
        
        try {
            let stream = localStream;
            
            // Initialize local stream if it doesn't exist
            if (!stream) {
                console.log('🎥 Initializing media stream...');
                const videoConstraints = performanceState?.isHeavyInteraction ? 
                    { width: 160, height: 120, frameRate: 15 } : 
                    { width: 320, height: 240, frameRate: 30 };
                    
                stream = await navigator.mediaDevices.getUserMedia({
                    video: videoConstraints,
                    audio: true
                });
                
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                console.log('✅ Media stream initialized');
                toast({
                    title: "Camera and microphone ready",
                    status: "success",
                    duration: 2000
                });
            }

            // Set in call state first
            setIsInCall(true);
            
            // Ensure socket is connected before emitting
            if (!socket.connected) {
                console.log('🔌 Connecting socket...');
                socket.connect();
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Socket connection timeout'));
                    }, 5000);
                    
                    if (socket.connected) {
                        clearTimeout(timeout);
                        resolve();
                    } else {
                        socket.on('connect', () => {
                            clearTimeout(timeout);
                            resolve();
                        });
                    }
                });
            }
            
            // Clear any existing peers before joining
            Object.values(peersRef.current).forEach(({ peer }) => {
                if (peer && !peer.destroyed) {
                    peer.destroy();
                }
            });
            peersRef.current = {};
            setPeers({});
            
            // Re-join campaign to ensure we're in the right room
            console.log(`🏠 Joining campaign room: ${campaignId}`);
            socket.emit('joinCampaign', campaignId);
            
            // Wait a bit for the join to complete, then announce video join
            setTimeout(() => {
                console.log(`📢 Announcing video join for ${userName}`);
                socket.emit('user-joined-video', {
                    campaignId,
                    userId,
                    userName
                });
            }, 100);

            toast({
                title: "Joined video call",
                status: "success",
                duration: 2000
            });
        } catch (error) {
            console.error('❌ Error joining call:', error);
            setIsInCall(false);
            toast({
                title: "Failed to join call",
                description: error.message || "Please allow camera and microphone access",
                status: "error",
                duration: 5000
            });
        }
    }, [localStream, socket, campaignId, userId, userName, toast, performanceState]);

    // Leave video call
    const leaveCall = useCallback(() => {
        try {
            // Close all peer connections safely
            Object.values(peersRef.current).forEach(({ peer }) => {
                if (peer) {
                    try {
                        // Remove all event listeners to prevent stream errors
                        peer.removeAllListeners();
                        peer.destroy();
                    } catch (error) {
                        console.warn('Error destroying peer:', error);
                        // Force cleanup even if destroy fails
                        try {
                            peer._destroy();
                        } catch (e) {
                            console.warn('Force destroy also failed:', e);
                        }
                    }
                }
            });

            // Stop local stream safely
            if (localStream) {
                try {
                    localStream.getTracks().forEach(track => {
                        try {
                            track.stop();
                        } catch (error) {
                            console.warn('Error stopping track:', error);
                        }
                    });
                } catch (error) {
                    console.warn('Error stopping streams:', error);
                }
                setLocalStream(null);
            }

            // Clear video element
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = null;
            }

            // Clear state
            setPeers({});
            peersRef.current = {};
            setIsInCall(false);

            // Emit leave event
            socket.emit('user-left-video', {
                campaignId,
                userId
            });

            toast({
                title: "Left video call",
                status: "info",
                duration: 2000
            });
        } catch (error) {
            console.error('Error leaving call:', error);
            // Force cleanup even if there are errors
            setPeers({});
            peersRef.current = {};
            setIsInCall(false);
            setLocalStream(null);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = null;
            }
            
            toast({
                title: "Left video call (with errors)",
                description: "Some cleanup errors occurred but call was ended",
                status: "warning",
                duration: 3000
            });
        }
    }, [localStream, socket, campaignId, userId, toast]);

    // Toggle video
    const toggleVideo = useCallback(() => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !isVideoEnabled;
                setIsVideoEnabled(!isVideoEnabled);
            }
        }
    }, [localStream, isVideoEnabled]);

    // Toggle audio
    const toggleAudio = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !isAudioEnabled;
                setIsAudioEnabled(!isAudioEnabled);
            }
        }
    }, [localStream, isAudioEnabled]);

    // Socket event listeners
    useEffect(() => {
        if (!socket || !isInCall) {
            return;
        }

        const handleUserJoinedVideo = ({ userId: joinedUserId, userName: joinedUserName }) => {
            console.log(`👤 User joined video: ${joinedUserName} (${joinedUserId})`);
            if (joinedUserId === userId) return; // Don't connect to self

            // Prevent duplicate connections
            if (peersRef.current[joinedUserId]) {
                console.log(`⚠️ Peer ${joinedUserId} already exists, skipping`);
                return;
            }

            if (localStream) {
                console.log(`🔄 Creating initiator connection to ${joinedUserName}`);
                const peer = createPeer(joinedUserId, localStream, true);
                peersRef.current[joinedUserId] = { peer, userName: joinedUserName };
                
                // Add to peers state immediately
                setPeers(prevPeers => ({
                    ...prevPeers,
                    [joinedUserId]: {
                        peer,
                        userName: joinedUserName,
                        stream: null,
                        connected: false
                    }
                }));
            } else {
                console.warn(`❌ No local stream available for connection to ${joinedUserName}`);
            }
        };

        const handleWebRTCOffer = ({ fromUserId, signal, userName: fromUserName }) => {
            console.log(`📩 Received WebRTC offer from ${fromUserName} (${fromUserId})`);
            if (fromUserId === userId) return; // Ignore own offers

            // Prevent duplicate connections and race conditions
            if (peersRef.current[fromUserId]) {
                console.log(`⚠️ Peer ${fromUserId} already exists, signaling existing peer`);
                try {
                    peersRef.current[fromUserId].peer.signal(signal);
                } catch (error) {
                    console.error(`❌ Error signaling existing peer ${fromUserId}:`, error);
                }
                return;
            }

            if (localStream) {
                console.log(`🔄 Creating receiver connection from ${fromUserName}`);
                const peer = createPeer(fromUserId, localStream, false);
                peersRef.current[fromUserId] = { peer, userName: fromUserName };
                
                // Add to peers state immediately
                setPeers(prevPeers => ({
                    ...prevPeers,
                    [fromUserId]: {
                        peer,
                        userName: fromUserName,
                        stream: null,
                        connected: false
                    }
                }));
                
                try {
                    peer.signal(signal);
                } catch (error) {
                    console.error(`❌ Error signaling new peer ${fromUserId}:`, error);
                    // Clean up failed peer
                    delete peersRef.current[fromUserId];
                    setPeers(prevPeers => {
                        const newPeers = { ...prevPeers };
                        delete newPeers[fromUserId];
                        return newPeers;
                    });
                }
            } else {
                console.warn(`❌ No local stream available for offer from ${fromUserName}`);
            }
        };

        const handleWebRTCAnswer = ({ fromUserId, signal }) => {
            console.log(`📨 Received WebRTC answer from ${fromUserId}`);
            
            if (peersRef.current[fromUserId]) {
                try {
                    peersRef.current[fromUserId].peer.signal(signal);
                } catch (error) {
                    console.error(`❌ Error processing answer from ${fromUserId}:`, error);
                }
            } else {
                console.warn(`⚠️ Received answer from unknown peer ${fromUserId}`);
            }
        };

        const handleWebRTCIceCandidate = ({ fromUserId, signal }) => {
            console.log(`🧊 Received ICE candidate from ${fromUserId}`);
            
            if (peersRef.current[fromUserId]) {
                try {
                    peersRef.current[fromUserId].peer.signal(signal);
                } catch (error) {
                    console.error(`❌ Error processing ICE candidate from ${fromUserId}:`, error);
                }
            } else {
                console.warn(`⚠️ Received ICE candidate from unknown peer ${fromUserId}`);
            }
        };

        const handleUserLeftVideo = ({ userId: leftUserId }) => {
            if (peersRef.current[leftUserId]) {
                peersRef.current[leftUserId].peer.destroy();
                delete peersRef.current[leftUserId];
                setPeers(prevPeers => {
                    const newPeers = { ...prevPeers };
                    delete newPeers[leftUserId];
                    return newPeers;
                });
            }
        };

        socket.on('user-joined-video', handleUserJoinedVideo);
        socket.on('webrtc-offer', handleWebRTCOffer);
        socket.on('webrtc-answer', handleWebRTCAnswer);
        socket.on('webrtc-ice-candidate', handleWebRTCIceCandidate);
        socket.on('user-left-video', handleUserLeftVideo);

        return () => {
            socket.off('user-joined-video', handleUserJoinedVideo);
            socket.off('webrtc-offer', handleWebRTCOffer);
            socket.off('webrtc-answer', handleWebRTCAnswer);
            socket.off('webrtc-ice-candidate', handleWebRTCIceCandidate);
            socket.off('user-left-video', handleUserLeftVideo);
        };
    }, [socket, isInCall, userId, localStream, createPeer]);

    // Update video element when local stream changes
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Dynamically adapt video quality based on performance state
    useEffect(() => {
        if (!localStream || !isInCall) return;

        const videoTrack = localStream.getVideoTracks()[0];
        if (!videoTrack) return;

        const adaptVideoQuality = async () => {
            try {
                // Apply constraints based on performance state
                if (performanceState?.isHeavyInteraction) {
                    // Reduce quality during heavy interactions
                    await videoTrack.applyConstraints({
                        width: { ideal: 160 },
                        height: { ideal: 120 },
                        frameRate: { ideal: 15 }
                    });
                } else {
                    // Restore normal quality when interactions end
                    await videoTrack.applyConstraints({
                        width: { ideal: 320 },
                        height: { ideal: 240 },
                        frameRate: { ideal: 30 }
                    });
                }
            } catch (error) {
                console.warn('Failed to adapt video quality:', error);
            }
        };

        const timeoutId = setTimeout(adaptVideoQuality, 100); // Debounce quality changes
        return () => clearTimeout(timeoutId);
    }, [performanceState, localStream, isInCall]);

    // Initialize on component mount
    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (isInCall) {
                leaveCall();
            }
        };
    }, [isInCall, leaveCall]);

    if (!isOpen) return null;

    // Get all campaign participants
    const allParticipants = campaign ? [
        { id: campaign.gm._id || campaign.gm, username: campaign.gm.username || 'GM', isGM: true },
        ...(campaign.players || [])
            .filter(player => {
                const playerId = player._id || player;
                const gmId = campaign.gm._id || campaign.gm;
                return playerId !== gmId; // Filter out GM from players list
            })
            .map(player => ({
                id: player._id || player,
                username: player.username || 'Player',
                isGM: false
            }))
    ] : [];

    const videoWindowHeight = isRightSidebar ? "140px" : "120px";
    const spacing = isRightSidebar ? 2 : 3;

    return (
        <VStack spacing={spacing} align="stretch">
            {/* Show individual video window for each campaign participant */}
            {allParticipants.map((participant) => {
                const isCurrentUser = participant.id === userId;
                const peerData = peers[participant.id];
                const hasActiveVideo = isCurrentUser ? localStream : peerData?.stream;
                
                return (
                    <Card key={participant.id} bg="gray.700" borderColor={isCurrentUser ? "orange.400" : "gray.600"}>
                        <CardBody p={3}>
                            <VStack spacing={2}>
                                <HStack spacing={2} w="100%" justify="space-between">
                                    <Text fontSize="xs" color="gray.300" fontWeight="medium" noOfLines={1}>
                                        {isCurrentUser ? `${participant.username} (You)` : participant.username}
                                        {participant.isGM && <Text as="span" color="orange.400" ml={1}>(GM)</Text>}
                                    </Text>
                                    {isCurrentUser && isInCall && (
                                        <HStack spacing={1}>
                                            <IconButton
                                                icon={isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
                                                colorScheme={isVideoEnabled ? "blue" : "red"}
                                                onClick={toggleVideo}
                                                size="xs"
                                                aria-label="Toggle video"
                                            />
                                            <IconButton
                                                icon={isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
                                                colorScheme={isAudioEnabled ? "blue" : "red"}
                                                onClick={toggleAudio}
                                                size="xs"
                                                aria-label="Toggle audio"
                                            />
                                        </HStack>
                                    )}
                                </HStack>
                                
                                <Box
                                    bg="gray.800"
                                    borderRadius="md"
                                    overflow="hidden"
                                    w="100%"
                                    h={videoWindowHeight}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    border={isCurrentUser && isInCall ? "2px solid" : "1px solid"}
                                    borderColor={isCurrentUser && isInCall ? "orange.400" : "gray.600"}
                                >
                                    {hasActiveVideo ? (
                                        isCurrentUser ? (
                                            <video
                                                ref={localVideoRef}
                                                autoPlay
                                                muted
                                                playsInline
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    transform: 'scaleX(-1)'
                                                }}
                                            />
                                        ) : (
                                            <video
                                                autoPlay
                                                playsInline
                                                ref={el => {
                                                    if (el && peerData?.stream) {
                                                        el.srcObject = peerData.stream;
                                                    }
                                                }}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        )
                                    ) : (
                                        <VStack spacing={1}>
                                            <Box
                                                w={8}
                                                h={8}
                                                borderRadius="full"
                                                bg={participant.isGM ? "orange.400" : "gray.500"}
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="center"
                                            >
                                                <Text color="white" fontSize="sm" fontWeight="bold">
                                                    {participant.username.charAt(0).toUpperCase()}
                                                </Text>
                                            </Box>
                                            <Text color="gray.500" fontSize="xs" textAlign="center">
                                                {isCurrentUser && !isInCall ? "Not in call" : 
                                                 isCurrentUser ? "No video" : 
                                                 peerData ? (peerData.connected ? "Connected (no video)" : "Connecting...") : "Offline"}
                                            </Text>
                                        </VStack>
                                    )}
                                </Box>
                            </VStack>
                        </CardBody>
                    </Card>
                );
            })}

            {/* Controls */}
            <Card bg="gray.700" borderColor="gray.600" mt={4}>
                <CardBody p={3}>
                    <VStack spacing={3}>
                        {/* Join/Leave Call Button */}
                        {!isInCall ? (
                            <Button
                                colorScheme="green"
                                onClick={joinCall}
                                w="full"
                                size="sm"
                                leftIcon={<FaVideo />}
                            >
                                Join Video Call
                            </Button>
                        ) : (
                            <Button
                                colorScheme="red"
                                onClick={leaveCall}
                                w="full"
                                size="sm"
                                leftIcon={<FaPhoneSlash />}
                            >
                                Leave Call
                            </Button>
                        )}

                        {/* Status Info */}
                        <Box bg="gray.600" p={2} borderRadius="md" w="full">
                            <Text fontSize="xs" color="gray.400" mb={1}>
                                Status:
                            </Text>
                            <Text fontSize="xs" color="white">
                                {isInCall ? `In call with ${Object.keys(peers).length} other(s)` : 'Not in call'}
                            </Text>
                            <Text fontSize="xs" color="gray.400" mt={1}>
                                Campaign: {allParticipants.length} participant(s)
                            </Text>
                        </Box>
                    </VStack>
                </CardBody>
            </Card>
        </VStack>
    );
};

export default memo(VideoChat, (prevProps, nextProps) => {
    // Only re-render if essential props change
    return (
        prevProps.isOpen === nextProps.isOpen &&
        prevProps.campaignId === nextProps.campaignId &&
        prevProps.userId === nextProps.userId &&
        prevProps.performanceState?.isHeavyInteraction === nextProps.performanceState?.isHeavyInteraction &&
        prevProps.performanceState?.interactionType === nextProps.performanceState?.interactionType
    );
});