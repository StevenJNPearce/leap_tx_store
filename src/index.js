const Web3 = require('web3');
import AWS from 'aws-sdk';
import { helpers } from 'leap-core';

import Db from './db';
import LeapTxService from './service';

const simpleDB = new AWS.SimpleDB();

export const handler = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false; // eslint-disable-line no-param-reassign
  try {
    const { from, to, color } = event;
    const path = (event.context || {})['resource-path'] || '';
    const db = new Db(simpleDB, process.env.TABLE_NAME);
    const web3 = helpers.extendWeb3(
      new Web3(new Web3.providers.HttpProvider(process.env.LEAP_NODE))
    );
    const txService = new LeapTxService(db, web3);

    if (path) {
      const routes = {
        from: () => txService.getTransactions({ from }),
        to: () => txService.getTransactions({ to }),
        color: () => txService.getTransactions({ color: Number(color) })
      };

      if (routes[path]) {
        routes[path]().then(result => {
          callback(null, result);
        });
      }
    } else {
      txService.updateTransactions().then(result => {
        callback(null, result);
      });
    }
  } catch (err) {
    callback(err);
  }
};
