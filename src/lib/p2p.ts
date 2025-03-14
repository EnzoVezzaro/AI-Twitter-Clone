import Peer from 'peerjs';

// Create a new Peer instance
const peer = new Peer();
const connections: Map<string, Peer.DataConnection> = new Map(); // Store connections to all peers
let onDataReceivedCallback: ((data: any) => void) | null = null;

// The central peer ID (fixed for all peripheral peers to connect)
const centralPeerId: string = '234c0f7d-2f89-4870-aed7-35e1a90a41bb';

// Determine if this instance is the central hub
let isCentralHub: boolean = false;

// When the peer is ready
peer.on('open', (id) => {
  console.log('Peer opened with ID:', id);
  
  // Check if this is the central hub
  isCentralHub = (id === centralPeerId);
  
  if (isCentralHub) {
    console.log('Running as central hub peer');
    setupCentralPeer();
  } else {
    console.log('Running as peripheral peer');
    // Connect to central hub automatically if this is not the hub
    connectToCentralPeer();
  }
});

// Handle any errors with the peer connection
peer.on('error', (err) => {
  console.error('Peer connection error:', err);
  
  // If this is a "peer not found" error and we're trying to be the hub
  if (err.type === 'peer-unavailable' && err.message.includes(centralPeerId)) {
    console.log('Central hub not found. Attempting to initialize as the hub');
    // Try to create the hub with the fixed ID
    reinitializeAsCentralHub();
  }
});

// Reinitialize as the central hub with the fixed ID
function reinitializeAsCentralHub() {
  // Close the existing peer connection
  peer.destroy();
  
  // Create a new peer with the fixed central ID
  const newPeer = new Peer(centralPeerId);
  
  // Replace the global peer reference
  Object.assign(peer, newPeer);
  
  // Set up the new central peer
  newPeer.on('open', (id) => {
    console.log('Successfully initialized as central hub with ID:', id);
    isCentralHub = true;
    setupCentralPeer();
  });
  
  // Handle any errors with the new peer
  newPeer.on('error', (err) => {
    console.error('Failed to initialize as central hub:', err);
    
    // If the ID is already taken, then someone else is the hub
    if (err.type === 'unavailable-id') {
      console.log('Another peer is already acting as the central hub. Connecting as peripheral');
      // Try to connect as a peripheral peer
      connectToCentralPeer();
    }
  });
}

// Set up the central peer to accept incoming connections
function setupCentralPeer() {
  // Handle incoming connections to the hub
  peer.on('connection', (incomingConn) => {
    console.log('New incoming connection from peer:', incomingConn.peer);

    // Store the incoming connection in the connections map
    connections.set(incomingConn.peer, incomingConn);
    
    // Handle connection open event
    incomingConn.on('open', () => {
      console.log('Connection established with peer:', incomingConn.peer);
      
      // Notify all peers about the new connection
      const connectMsg = {
        type: 'system',
        action: 'peerJoined',
        peerId: incomingConn.peer,
        timestamp: Date.now(),
        message: 'New peer joined'
      };
      
      // Broadcast to all except the new peer
      broadcastUpdate(connectMsg, incomingConn.peer);
    });

    // Set up data listener for this incoming connection
    incomingConn.on('data', (data) => {
      console.log('Hub received data from peer', incomingConn.peer, ':', data);

      // Process received data
      processReceivedData(data, incomingConn.peer);
    });

    // Handle connection close event
    incomingConn.on('close', () => {
      console.log('Connection closed with peer:', incomingConn.peer);
      
      // Remove the closed connection
      connections.delete(incomingConn.peer);
      
      // Notify all peers about the disconnection
      const disconnectMsg = {
        type: 'system',
        action: 'peerLeft',
        peerId: incomingConn.peer,
        timestamp: Date.now()
      };
      
      broadcastUpdate(disconnectMsg);
    });

    // Handle connection error
    incomingConn.on('error', (err) => {
      console.error('Error with connection to peer', incomingConn.peer, ':', err);
      connections.delete(incomingConn.peer);
    });
  });

  console.log("Central hub is now listening for incoming connections.");
}

// Connect to the central peer (hub) from a peripheral peer
export function connectToCentralPeer(): Peer.DataConnection | null {
  // Don't try to connect if we are the central hub or already connected
  if (isCentralHub || connections.has(centralPeerId)) {
    console.log('Already operating as central hub or connected to it');
    return connections.get(centralPeerId) || null;
  }

  console.log(`Connecting to central peer with ID ${centralPeerId}`);
  const conn = peer.connect(centralPeerId, {
    reliable: true
  });

  // Store the connection immediately
  connections.set(centralPeerId, conn);

  // Handle the open event
  conn.on('open', () => {
    console.log('Connected to central hub:', centralPeerId);
    
    // Send a connection initialization message
    const initMsg = {
      type: 'system',
      action: 'initialize',
      peerId: peer.id,
      timestamp: Date.now()
    };
    
    sendData(conn, initMsg);
  });

  // Handle incoming data
  conn.on('data', (data) => {
    console.log('Received data from central hub:', data);
    
    // Process received data
    processReceivedData(data);
  });

  // Handle connection close
  conn.on('close', () => {
    console.log('Connection to central hub closed');
    connections.delete(centralPeerId);
    
    // Try to reconnect after a delay
    setTimeout(() => {
      console.log('Attempting to reconnect to central hub...');
      connectToCentralPeer();
    }, 3000);
  });

  // Handle connection error
  conn.on('error', (error) => {
    console.error('Connection error with central hub:', error);
    connections.delete(centralPeerId);
  });

  return conn;
}

// Process received data and handle system messages
function processReceivedData(data: any, senderId?: string): void {
  // If the data is a string that looks like JSON, parse it
  let parsedData = data;
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      // Keep original data if not valid JSON
    }
  }
  
  // If this is the hub, broadcast the message to all other peers
  if (isCentralHub && senderId) {
    broadcastUpdate(parsedData, senderId);
  }

  // Call the registered callback if it exists
  if (onDataReceivedCallback) {
    onDataReceivedCallback(parsedData);
  }
}

// Send data to a connected peer
export function sendData(conn: Peer.DataConnection, data: any): void {
  // Check if the connection is open before sending data
  if (conn && conn.open) {
    console.log('Sending data:', data);
    
    // If data is an object, stringify it
    const messageToSend = typeof data === 'object' ? JSON.stringify(data) : data;
    
    conn.send(messageToSend);
  } else {
    console.error('Cannot send data. Connection is not open or invalid.');
  }
}

// Send data to the central hub (for peripheral peers)
export function sendToCentralHub(data: any): void {
  const hubConn = connections.get(centralPeerId);
  if (hubConn) {
    sendData(hubConn, data);
  } else {
    console.error('No connection to central hub. Attempting to reconnect...');
    connectToCentralPeer();
  }
}

// Broadcast data to all connected peers (excluding the sender)
export function broadcastUpdate(data: any, excludePeerId?: string): void {
  console.log('Broadcasting to all peers:', data);

  // If this is not the hub, send to the hub which will handle broadcasting
  if (!isCentralHub) {
    sendToCentralHub(data);
    return;
  }

  // Iterate over all connections and send the message
  connections.forEach((conn, peerId) => {
    // Skip the excluded peer (usually the sender)
    if (excludePeerId && peerId === excludePeerId) {
      return;
    }
    
    if (conn.open) {
      console.log('Broadcasting to peer:', peerId);
      sendData(conn, data);
    } else {
      console.log(`Connection to peer ${peerId} is not open. Removing.`);
      connections.delete(peerId);
    }
  });
}

// Function to set the callback for received data
export function onDataReceived(callback: (data: any) => void): void {
  onDataReceivedCallback = callback;
}

// Function to get current number of connections
export function getConnectionCount(): number {
  return connections.size;
}

// Function to get list of connected peer IDs
export function getConnectedPeers(): string[] {
  return Array.from(connections.keys());
}

// Export the peer object for advanced usage
export const peerInstance = peer;