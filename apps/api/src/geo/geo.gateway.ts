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
  handleSubscribe(
    client: Socket,
    payload: { orderId?: string; role?: string; partnerProfileId?: string },
  ) {
    if (payload?.orderId) {
      client.join(`order:${payload.orderId}`);
    }
    if (payload?.role === 'admin') {
      client.join('admin:fleet');
    }
    if (payload?.role === 'specialist') {
      client.join('specialists');
      if (payload.partnerProfileId) client.join(`partner:${payload.partnerProfileId}`);
    }
    return { subscribed: payload?.orderId, role: payload?.role };
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

  /** Новый заказ доступен в пуле — специалисты обновляют ленту (бэкенд фильтрует по matching). */
  emitFeedNew(data: Record<string, unknown>) {
    this.server?.to('specialists').emit('feed:new', data);
  }

  /** Заказ принят/исчез из пула — убрать из ленты остальных. */
  emitFeedTaken(orderId: string) {
    this.server?.to('specialists').emit('feed:taken', { orderId });
  }
}
