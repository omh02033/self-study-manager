import App from './app';
import './config/env';
import { serverSocket } from './socket';

// env 정상작동 확인
if (!process.env.DATABASE_HOST) {
  console.log('env configuration required.');
} else {
  console.log(process.env.DATABASE_HOST);
  const httpServer = App.listen(process.env.WEB_PORT, () => {
    console.log('Connected');
  });
  serverSocket(httpServer);
}