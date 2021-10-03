import socketIO, { Socket, Server } from 'socket.io';

import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({credentials: true}));

export const serverSocket = (httpServer: any) => {
    const io = new Server(httpServer, {
        cors: {credentials: true}
    });

    io.on('connection', connectHanelder);
};

function connectHanelder(socket:Socket) {
    socket.on('class', data => {
        socket.join(data);
    });

    socket.on('outing', data => {
        socket.to(data.classNum).emit("userOut", data);
    });
    socket.on('comeback', data => {
        socket.to(data.classNum).emit("userComeback", data);
    });
}