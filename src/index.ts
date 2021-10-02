import App from './app'
import './config/env'

// env 정상작동 확인
if (!process.env.DATABASE_HOST) {
  console.log('env configuration required.');
} else {
  console.log(process.env.DATABASE_HOST);
  App.listen(process.env.WEB_PORT, () => {
    console.log('Connected');
  });
}