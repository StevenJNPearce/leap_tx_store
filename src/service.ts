import Db from './db';
import { ExtendedWeb3, LeapTransaction } from 'leap-core';

export default class LeapTxService {
  constructor(private db: Db, private web3: ExtendedWeb3) {}

  async updateTransactions() {
    const fromBlock = await this.db.getLatestBlockNumber();
    const toBlock = await this.web3.eth.getBlockNumber();

    const txPromises = [];
    for (let i = fromBlock; i <= toBlock; i++) {
      const block = await this.web3.eth.getBlock(i, true);
      block.transactions.forEach(async (tx: LeapTransaction) => {
        txPromises.push(this.db.addTransaction(tx));
      });
    }

    await Promise.all(txPromises);
  }

  async getTransactions(params: { from?: string, to?: string, color?: number }) {
    return this.db.getTransactions(params);
  }
}