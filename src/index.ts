const Web3 = require('web3');
import * as AWS from 'aws-sdk';
import { helpers } from 'leap-core';

import Db from './db';
import LeapTxService from './service';

const simpleDB = new AWS.SimpleDB();

type Event = { context: any, from: string, to: string, color: string };
export const handler = (event: Event, context: any, callback: Function) => {
  context.callbackWaitsForEmptyEventLoop = false; // eslint-disable-line no-param-reassign
  try {
    const { from, to, color } = event;
    const path = (event.context || {})['resource-path'] || '';
    const db = new Db(simpleDB, process.env.TABLE_NAME);
    const web3 = helpers.extendWeb3(new Web3(process.env.LEAP_NODE));
    const txService = new LeapTxService(db, web3);

    if (path) {
      const routes = {
        'from': () => txService.getTransactions({ from }),
        'to': () => txService.getTransactions({ to }),
        'color': () => txService.getTransactions({ color: Number(color) }),
      };

      if (routes[path]) {
        routes[path]();
      }
    } else {
      txService.updateTransactions();
    }
  } catch (err) {
    callback(err);
  }
};
