// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'; // 导入Gantt的CSS
import { store } from './store/store.js'; // 导入我们的 store
import { Provider } from 'react-redux';  // 导入 Provider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 用 Provider 包裹 App，并将 store 作为 prop 传入 */}
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);