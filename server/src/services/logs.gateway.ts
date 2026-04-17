import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable } from "@nestjs/common";

@Injectable()
@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class LogsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const deploymentId = client.handshake.query.deploymentId as string;
    if (deploymentId) {
      void client.join(deploymentId);
      console.log(
        `Client ${client.id} joined deployment room: ${deploymentId}`,
      );
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client ${client.id} disconnected.`);
  }

  broadcastLog(deploymentId: string, message: string) {
    if (this.server) {
      this.server
        .to(deploymentId)
        .emit("log", { message, timestamp: new Date() });
    }
  }
}
