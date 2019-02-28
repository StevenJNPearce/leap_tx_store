function getBlockNumber(web3) {
  return new Promise((resolve, reject) => {
    web3.eth.getBlockNumber((err, blockNumber) => {
      if (err) {
        reject(err);
      } else {
        resolve(blockNumber);
      }
    });
  });
}

function getBlock(web3, blockNumber, includeTransactions) {
  return new Promise((resolve, reject) => {
    web3.eth.getBlock(blockNumber, includeTransactions, (err, block) => {
      if (err) {
        reject(err);
      } else {
        resolve(block);
      }
    });
  });
}

export default class LeapTxService {
  constructor(db, web3) {
    this.db = db;
    this.web3 = web3;
  }

  updateTransactions() {
    return Promise.all([
      this.db.getLatestBlockNumber(),
      getBlockNumber(this.web3)
    ]).then(([fromBlock, toBlock]) => {
      const blockPromises = [];
      for (let i = fromBlock; i <= toBlock; i++) {
        blockPromises.push(
          getBlock(this.web3, i, true).then(block => {
            return Promise.all(
              block.transactions.map(tx => this.db.addTransaction(tx))
            );
          })
        );
      }

      return Promise.all(blockPromises);
    });
  }

  getTransactions(params) {
    return this.db.getTransactions(params);
  }
}
