import { Route } from 'mobx-router';
import React from 'react';
import GovernanceEvents from '../components/GovernanceEvents';
import { RootStore } from '../mobx/store';

const routes = {
  home: new Route<RootStore>({
    path: '/',
    component: <GovernanceEvents />,
  }),
};

export default routes;
