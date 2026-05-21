import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/tracking',
})
export class GeoGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    client.emit('connected', { ok: true });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { orderId?: string; role?: string }) {
    if (payload?.orderId) {
      client.join(`order:${payload.orderId}`);
    }
    if (payload?.role === 'admin') {
      client.join('admin:fleet');
    }
    return { subscribed: payload?.orderId };
  }

  emitOrderTracking(orderId: string, data: Record<string, unknown>) {
    this.server?.to(`order:${orderId}`).emit('tracking:update', { orderId, ...data });
  }

  emitOrderStatus(orderId: string, data: Record<string, unknown>) {
    this.server?.to(`order:${orderId}`).emit('order:status', { orderId, ...data });
  }

  emitFleetUpdate(data: Record<string, unknown>) {
    this.server?.to('admin:fleet').emit('fleet:update', data);
  }
}
