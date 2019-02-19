const Web3 = require('web3');
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { helpers, LeapTransaction, Tx, TxJSON } from 'leap-core';
import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { Block } from 'web3/eth/types';
import { eTransaction } from './entity/eTransaction';
import { Routes } from './routes';

const config = require('../config.json');

type PlasmaTransaction = LeapTransaction & TxJSON;

type PlasmaBlock = Block & {
  transactions: PlasmaTransaction[];
} & TxJSON;

createConnection()
  .then(async connection => {
    // create express app
    const app = express();
    app.use(bodyParser.json());

    // register express routes from defined application routes
    Routes.forEach(route => {
      app[route.method](
        route.route,
        (req: express.Request, res: express.Response, next: Function) => {
          const result = new route.controller()[route.action](req, res, next);
          if (result instanceof Promise) {
            result.then(result =>
              result !== null && result !== undefined
                ? res.send(result)
                : undefined
            );
          } else if (result !== null && result !== undefined) {
            res.json(result);
          }
        }
      );
    });

    // start express server
    app.listen(3000);

    // setup web3
    const web3 = helpers.extendWeb3(new Web3(config.leapNode));

    const getdbTip = async () => {
      const res = await connection
        .createQueryBuilder()
        .select('MAX(blockNumber)')
        .from(eTransaction, 'tx')
        .execute();
      return Object.values<number>(res[0])[0] === null
        ? 0
        : Object.values<number>(res[0])[0];
    };

    let lock = false;
    async function getTransactions() {
      if (lock) {
        return;
      }
      lock = true;
      try {
        const fromBlock = await getdbTip();
        const toBlock = await web3.eth.getBlockNumber();
        for (let i = fromBlock; i <= toBlock; i++) {
          const block = await web3.eth.getBlock(i, true);
          block.transactions.forEach(async tx => {
            const plasmaTx = {
              ...tx,
              ...Tx.fromRaw((tx as any).raw).toJSON()
            } as PlasmaTransaction;
            console.log(plasmaTx);
            await connection.manager.save(
              connection.manager.create(eTransaction, {
                hash: plasmaTx.hash,
                from: plasmaTx.from.toLowerCase(),
                to: plasmaTx.to.toLowerCase(),
                color: plasmaTx.color,
                blockNumber: plasmaTx.blockNumber
              })
            );
          });
        }
      } catch (e) {
        console.log(e);
      } finally {
        lock = false;
      }
    }
    setInterval(getTransactions, 15000);
  })
  .catch(error => console.log(error));
