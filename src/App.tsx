import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import AboutPage from './pages/AboutPage';
import DashboardPage from './pages/DashboardPage';
import InputPage from './pages/OpeningInputPage';

export default function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/opening/:id">
          <InputPage />
        </Route>
        <Route path="/about">
          <AboutPage />
        </Route>
        <Route path="/">
          <DashboardPage />
        </Route>
      </Switch>
    </BrowserRouter>
  );
}
