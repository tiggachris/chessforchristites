import mqtt from 'mqtt';

const connectMqtt = mqtt.connect || (mqtt.default && mqtt.default.connect) || mqtt;

const BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt'
];

export class ChessNetwork {
  constructor() {
    this.client = null;
    this.roomCode = null;
    this.clientId = 'user_' + Math.random().toString(36).substring(2, 9);
    this.isHost = false;
    this.playerColor = null; // 'w' or 'b'
    this.opponentId = null;
    this.opponentName = null;
    this.isConnected = false;
    this.isOpponentPresent = false;

    // Callbacks
    this.callbacks = {
      onConnected: () => {},
      onOpponentJoined: () => {},
      onOpponentLeft: () => {},
      onGameSync: () => {},
      onMove: () => {},
      onChat: () => {},
      onUndoRequest: () => {},
      onUndoResponse: () => {},
      onTimeSync: () => {},
      onResign: () => {},
      onDrawOffer: () => {},
      onDrawResponse: () => {},
      onError: () => {}
    };

    this.heartbeatInterval = null;
  }

  setCallback(event, fn) {
    if (this.callbacks[event] !== undefined) {
      this.callbacks[event] = fn;
    }
  }

  createRoom(timeControl, hostColorChoice = 'random') {
    this.roomCode = this._generateRoomCode();
    this.isHost = true;

    if (hostColorChoice === 'random') {
      this.playerColor = Math.random() < 0.5 ? 'w' : 'b';
    } else {
      this.playerColor = hostColorChoice;
    }

    this.timeControl = timeControl;
    this._connect();
    return this.roomCode;
  }

  joinRoom(roomCode) {
    this.roomCode = roomCode.trim().toUpperCase();
    this.isHost = false;
    this._connect();
  }

  _generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  _connect(brokerIndex = 0) {
    if (this.client) {
      try { this.client.end(true); } catch {}
    }

    const brokerUrl = BROKERS[brokerIndex % BROKERS.length];
    console.log(`Connecting to room broker: ${brokerUrl}`);

    const client = connectMqtt(brokerUrl, {
      clientId: this.clientId,
      clean: true,
      connectTimeout: 7000,
      reconnectPeriod: 3000
    });

    this.client = client;
    const topic = `ag_chess_room/${this.roomCode}`;

    client.on('connect', () => {
      console.log('Connected to broker topic:', topic);
      this.isConnected = true;
      this.callbacks.onConnected(this.roomCode);

      client.subscribe(topic, { qos: 1 }, (err) => {
        if (!err) {
          if (!this.isHost) {
            // Guest announces presence
            this._send({
              type: 'GUEST_JOINED',
              senderId: this.clientId,
              name: 'Friend'
            });
          }
        }
      });

      this._startHeartbeat();
    });

    client.on('message', (t, message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.senderId === this.clientId) return; // Ignore own messages
        this._handleIncomingMessage(data);
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    });

    client.on('error', (err) => {
      console.warn('MQTT error, trying fallback:', err);
      if (brokerIndex < BROKERS.length - 1) {
        this._connect(brokerIndex + 1);
      } else {
        this.callbacks.onError('Network connection error. Trying to reconnect...');
      }
    });
  }

  _startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.roomCode) {
        this._send({
          type: 'PING',
          senderId: this.clientId
        });
      }
    }, 5000);
  }

  _send(payload) {
    if (!this.client || !this.client.connected || !this.roomCode) return;
    const topic = `ag_chess_room/${this.roomCode}`;
    payload.senderId = this.clientId;
    payload.timestamp = Date.now();
    this.client.publish(topic, JSON.stringify(payload), { qos: 1 });
  }

  _handleIncomingMessage(data) {
    switch (data.type) {
      case 'GUEST_JOINED':
        if (this.isHost) {
          this.opponentId = data.senderId;
          this.opponentName = data.name || 'Friend';
          this.isOpponentPresent = true;

          // Host replies with game configuration and guest's assigned color
          const guestColor = this.playerColor === 'w' ? 'b' : 'w';
          this._send({
            type: 'GAME_SYNC',
            hostColor: this.playerColor,
            guestColor: guestColor,
            timeControl: this.timeControl,
            hostName: 'Host'
          });

          this.callbacks.onOpponentJoined({
            id: data.senderId,
            name: this.opponentName,
            color: guestColor
          });
        }
        break;

      case 'GAME_SYNC':
        if (!this.isHost) {
          this.opponentId = data.senderId;
          this.opponentName = data.hostName || 'Host';
          this.playerColor = data.guestColor;
          this.timeControl = data.timeControl;
          this.isOpponentPresent = true;

          this.callbacks.onGameSync({
            playerColor: this.playerColor,
            opponentColor: data.hostColor,
            timeControl: data.timeControl,
            opponentName: this.opponentName
          });
        }
        break;

      case 'MOVE':
        this.callbacks.onMove(data);
        break;

      case 'CHAT':
        this.callbacks.onChat(data);
        break;

      case 'UNDO_REQUEST':
        this.callbacks.onUndoRequest(data);
        break;

      case 'UNDO_RESPONSE':
        this.callbacks.onUndoResponse(data.accepted);
        break;

      case 'TIME_SYNC':
        this.callbacks.onTimeSync(data);
        break;

      case 'RESIGN':
        this.callbacks.onResign(data.color);
        break;

      case 'DRAW_OFFER':
        this.callbacks.onDrawOffer(data.color);
        break;

      case 'DRAW_RESPONSE':
        this.callbacks.onDrawResponse(data.accepted);
        break;

      case 'LEAVE':
        this.isOpponentPresent = false;
        this.callbacks.onOpponentLeft();
        break;

      case 'PING':
        if (!this.isOpponentPresent && data.senderId !== this.clientId) {
          this.isOpponentPresent = true;
          this.callbacks.onOpponentJoined({ id: data.senderId, name: 'Friend' });
        }
        break;
    }
  }

  sendMove(from, to, promotion, timeRemaining, fen) {
    this._send({
      type: 'MOVE',
      from,
      to,
      promotion,
      timeRemaining,
      fen
    });
  }

  sendChat(text, senderName) {
    this._send({
      type: 'CHAT',
      text,
      senderName
    });
  }

  sendUndoRequest() {
    this._send({
      type: 'UNDO_REQUEST',
      color: this.playerColor
    });
  }

  sendUndoResponse(accepted) {
    this._send({
      type: 'UNDO_RESPONSE',
      accepted
    });
  }

  sendTimeSync(whiteTime, blackTime) {
    this._send({
      type: 'TIME_SYNC',
      whiteTime,
      blackTime
    });
  }

  sendResign() {
    this._send({
      type: 'RESIGN',
      color: this.playerColor
    });
  }

  sendDrawOffer() {
    this._send({
      type: 'DRAW_OFFER',
      color: this.playerColor
    });
  }

  sendDrawResponse(accepted) {
    this._send({
      type: 'DRAW_RESPONSE',
      accepted
    });
  }

  disconnect() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.client) {
      try {
        this._send({ type: 'LEAVE' });
        this.client.end(true);
      } catch {}
      this.client = null;
    }
    this.isConnected = false;
    this.isOpponentPresent = false;
    this.roomCode = null;
  }
}
