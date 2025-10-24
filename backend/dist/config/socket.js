let io;
export const initializeSocket = (socketServer) => {
    io = socketServer;
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);
        // Join voting room for real-time updates
        socket.on('join-voting', (data) => {
            socket.join('voting-room');
            console.log(`👤 ${socket.id} joined voting room`);
        });
        // Join results room for live results
        socket.on('join-results', (data) => {
            socket.join('results-room');
            console.log(`📊 ${socket.id} joined results room`);
        });
        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });
};
export const emitVoteUpdate = async (postId, candidateId) => {
    try {
        // Emit to voting room for real-time status updates
        io.to('voting-room').emit('vote-cast', {
            postId,
            candidateId,
            timestamp: new Date().toISOString()
        });
        // Emit to results room for live results updates
        io.to('results-room').emit('results-update', {
            postId,
            candidateId,
            timestamp: new Date().toISOString()
        });
        console.log(`📡 Emitted vote update for post ${postId}, candidate ${candidateId}`);
    }
    catch (error) {
        console.error('❌ Error emitting vote update:', error);
    }
};
export const emitSystemStatus = (status, message) => {
    try {
        io.emit('system-status', {
            status,
            message,
            timestamp: new Date().toISOString()
        });
        console.log(`📡 Emitted system status: ${status}`);
    }
    catch (error) {
        console.error('❌ Error emitting system status:', error);
    }
};
export const emitElectionResults = (results) => {
    try {
        io.to('results-room').emit('election-results', {
            results,
            timestamp: new Date().toISOString()
        });
        console.log('📡 Emitted election results update');
    }
    catch (error) {
        console.error('❌ Error emitting election results:', error);
    }
};
export const getConnectedClients = () => {
    return io.sockets.sockets.size;
};
export const getRoomClients = (room) => {
    const roomSockets = io.sockets.adapter.rooms.get(room);
    return roomSockets ? Array.from(roomSockets) : [];
};
