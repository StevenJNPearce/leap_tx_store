const Web3 = require('web3');
import AWS from 'aws-sdk';
import { helpers } from 'leap-core';

import Db from './db';
import LeapTxService from './service';

const simpleDB = new AWS.SimpleDB();

export const handler = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false; // eslint-disable-line no-param-reassign
  try {
    const { from, to, color, nextToken } = event;
    const path = (event.context || {})['resource-path'] || '';
    const db = new Db(simpleDB, process.env.TABLE_NAME);
    const web3 = helpers.extendWeb3(
      new Web3(new Web3.providers.HttpProvider(process.env.LEAP_NODE))
    );
    const txService = new LeapTxService(db, web3);

    if (path) {
      console.log('routes', path);
      const routes = {
        '/transactions': () =>
          txService.getTransactions({ from, to, color }, nextToken)
      };

      if (routes[path]) {
        routes[path]().then(result => {
          callback(null, result);
        });
      }
    } else {
      console.log('updateTransactions', process.env.BATCH_SIZE);
      txService
        .updateTransactions(
          process.env.BATCH_SIZE && Number(process.env.BATCH_SIZE)
        )
        .then(result => {
          callback(null, result);
        });
    }
  } catch (err) {
    callback(err);
  }
};
