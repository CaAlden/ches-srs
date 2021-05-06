import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import AboutPage from './AboutPage';
import DashboardPage from './DashboardPage';
import InputPage from './OpeningInputPage';

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
