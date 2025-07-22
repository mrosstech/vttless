import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    
    // Debug: Verify polyfills are working
    console.log('Polyfill check:', {
        hasProcess: !!window.process,
        hasBuffer: !!window.Buffer,
        hasNextTick: !!window.process?.nextTick,
        hasSetImmediate: !!window.setImmediate
    });
}

const VideoChat = ({ socket, campaignId, userId, userName, campaign, isOpen, isRightSidebar = false }) => {
    const [localStream, setLocalStream] = useState(null);
    const [peers, setPeers] = useState({});
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isInCall, setIsInCall] = useState(false);
    const localVideoRef = useRef(null);
    const peersRef = useRef({});
    const toast = useToast();

    // Initialize local media stream
    const initializeLocalStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240 },
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
    }, [toast]);

    // Create peer connection for new user
    const createPeer = useCallback((userToSignal, stream, isInitiator) => {
        console.log('Creating peer connection:', { userToSignal, isInitiator, hasStream: !!stream });
        if (stream) {
            console.log('Stream tracks for peer creation:', stream.getTracks());
        }
        
        const peer = new Peer({
            initiator: isInitiator,
            trickle: false,
            stream,
        });

        peer.on('signal', signal => {
            const eventName = isInitiator ? 'webrtc-offer' : 'webrtc-answer';
            socket.emit(eventName, {
                campaignId,
                fromUserId: userId,
                toUserId: userToSignal,
                signal,
                userName: userName, // Include userName in signal
            });
        });

        peer.on('stream', remoteStream => {
            console.log('Received remote stream from:', userToSignal, 'Stream tracks:', remoteStream.getTracks());
            setPeers(prevPeers => ({
                ...prevPeers,
                [userToSignal]: {
                    ...prevPeers[userToSignal],
                    stream: remoteStream,
                    peer,
                    userName: peersRef.current[userToSignal]?.userName || 'Unknown'
                }
            }));
        });

        peer.on('error', error => {
            console.error('Peer connection error:', error);
            toast({
                title: "Connection error",
                description: `Failed to connect to peer: ${error.message}`,
                status: "error",
                duration: 3000
            });
        });

        return peer;
    }, [socket, campaignId, userId, toast]);

    // Join video call
    const joinCall = useCallback(async () => {
        try {
            let stream = localStream;
            
            // Initialize local stream if it doesn't exist
            if (!stream) {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240 },
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
            }

            // Now join the call with the stream
            setIsInCall(true);
            
            console.log('Emitting user-joined-video event:', { campaignId, userId, userName });
            console.log('Local stream tracks:', stream.getTracks());
            console.log('Socket connected:', socket.connected, 'Socket ID:', socket.id);
            
            // Ensure socket is connected before emitting
            if (!socket.connected) {
                console.warn('Socket not connected, waiting...');
                socket.connect();
                await new Promise(resolve => {
                    if (socket.connected) {
                        resolve();
                    } else {
                        socket.on('connect', resolve);
                    }
                });
                console.log('Socket now connected:', socket.id);
            }
            
            // Re-join campaign to ensure we're in the right room
            socket.emit('joinCampaign', campaignId);
            
            socket.emit('user-joined-video', {
                campaignId,
                userId,
                userName
            });

            toast({
                title: "Joined video call",
                status: "success",
                duration: 2000
            });
        } catch (error) {
            console.error('Error joining call:', error);
            toast({
                title: "Failed to join call",
                description: "Please allow camera and microphone access",
                status: "error",
                duration: 5000
            });
        }
    }, [localStream, socket, campaignId, userId, userName, toast]);

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
            console.log('Socket event listeners not set up:', { hasSocket: !!socket, isInCall });
            return;
        }
        
        console.log('Setting up socket event listeners for campaign:', campaignId);

        // Test socket connectivity by emitting a test event
        socket.emit('test-event', { campaignId, userId, message: 'Testing socket connectivity' });

        // Debug: Log all socket events
        const originalEmit = socket.emit;
        const originalOn = socket.on;
        
        // Override emit to log outgoing events
        socket.emit = (...args) => {
            if (args[0].includes('webrtc') || args[0].includes('video')) {
                console.log('SOCKET EMIT:', args[0], args[1]);
            }
            return originalEmit.apply(socket, args);
        };

        const handleUserJoinedVideo = ({ userId: joinedUserId, userName: joinedUserName }) => {
            console.log('Received user-joined-video event:', { joinedUserId, joinedUserName, currentUserId: userId });
            if (joinedUserId === userId) return; // Don't connect to self

            if (!peersRef.current[joinedUserId] && localStream) {
                console.log('Creating peer connection for:', joinedUserId);
                const peer = createPeer(joinedUserId, localStream, true);
                peersRef.current[joinedUserId] = { peer, userName: joinedUserName };
                
                // Add to peers state immediately
                setPeers(prevPeers => ({
                    ...prevPeers,
                    [joinedUserId]: {
                        peer,
                        userName: joinedUserName,
                        stream: null // Will be set when stream arrives
                    }
                }));
            }
        };

        const handleWebRTCOffer = ({ fromUserId, signal, userName: fromUserName }) => {
            console.log('Received WebRTC offer from:', fromUserId, 'userName:', fromUserName);
            if (fromUserId === userId) return; // Ignore own offers

            if (!peersRef.current[fromUserId] && localStream) {
                console.log('Creating peer for incoming offer from:', fromUserId);
                const peer = createPeer(fromUserId, localStream, false);
                peersRef.current[fromUserId] = { peer, userName: fromUserName };
                
                // Add to peers state immediately
                setPeers(prevPeers => ({
                    ...prevPeers,
                    [fromUserId]: {
                        peer,
                        userName: fromUserName,
                        stream: null // Will be set when stream arrives
                    }
                }));
                
                peer.signal(signal);
            }
        };

        const handleWebRTCAnswer = ({ fromUserId, signal }) => {
            console.log('Received WebRTC answer from:', fromUserId);
            if (peersRef.current[fromUserId]) {
                peersRef.current[fromUserId].peer.signal(signal);
            } else {
                console.warn('No peer found for answer from:', fromUserId);
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
        socket.on('user-left-video', handleUserLeftVideo);

        return () => {
            // Restore original socket methods
            socket.emit = originalEmit;
            socket.on = originalOn;
            
            socket.off('user-joined-video', handleUserJoinedVideo);
            socket.off('webrtc-offer', handleWebRTCOffer);
            socket.off('webrtc-answer', handleWebRTCAnswer);
            socket.off('user-left-video', handleUserLeftVideo);
        };
    }, [socket, isInCall, userId, localStream, createPeer]);

    // Update video element when local stream changes
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

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
                                                 peerData ? "Connecting..." : "Offline"}
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

export default VideoChat;