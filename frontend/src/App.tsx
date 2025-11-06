import AppRouter from './router/AppRouter'; 
import './index.css';

import { App as AntdApp } from 'antd';

function App() {
  return (
    <AntdApp>
      <AppRouter />
    </AntdApp>
  );
}

export default App