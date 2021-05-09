import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import AboutPage from './pages/AboutPage';
import DashboardPage from './pages/DashboardPage';
import InputPage from './pages/OpeningInputPage';
import StudyPage from './pages/StudyPage';

export default function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/opening/:id">
          <InputPage />
        </Route>
        <Route path="/study/:id">
          <StudyPage />
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
