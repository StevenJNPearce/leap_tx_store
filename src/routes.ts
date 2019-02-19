import { eTransactionController } from './controller/eTransactionController';

export const Routes = [
  {
    method: 'get',
    route: '/txfrom/:from/:offset/:limit',
    controller: eTransactionController,
    action: 'from'
  },
  {
    method: 'get',
    route: '/txto/:to/:offset/:limit',
    controller: eTransactionController,
    action: 'to'
  },
  {
    method: 'get',
    route: '/txcolor/:color/:offset/:limit',
    controller: eTransactionController,
    action: 'color'
  },
];
