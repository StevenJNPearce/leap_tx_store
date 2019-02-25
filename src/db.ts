import { LeapTransaction } from 'leap-core';

function promiseCall(method: Function, params: any) {
  return new Promise((resolve, reject) => {
    method(params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// transform from key/value to list and back
function transform(data: any) {
  let attributes;
  if (Array.isArray(data)) {
    attributes = {};
    data.forEach((aPair) => {
      if (!attributes[aPair.Name]) {
        attributes[aPair.Name] = {};
      }
      attributes[aPair.Name] = aPair.Value;
    });
  } else {
    attributes = [];
    Object.keys(data).forEach((anAttributeName) => {
      data[anAttributeName].forEach((aValue) => {
        attributes.push({
          Name: anAttributeName,
          Value: aValue,
          Replace: true,
        });
      });
    });
  }
  return attributes;
}

export default class Db {

  constructor(private sdb: any, private sdbTableName: string) {}

  async addTransaction(tx: LeapTransaction) {
    return this.putAttributes({
      DomainName: this.sdbTableName,
      ItemName: tx.hash,
      Attributes: [
        { Name: 'hash', Value: tx.hash, Replace: true },
        { Name: 'from', Value: tx.from, Replace: true },
        { Name: 'color', Value: String(tx.color), Replace: true },
        { Name: 'to', Value: tx.to, Replace: true },
        { Name: 'blockNumber', Value: String(tx.blockNumber), Replace: true },
        { Name: 'json', Value: JSON.stringify(tx), Replace: true },
      ],
    });
  }

  async getTransactions({ from, to, color }: { from?: string; to?: string; color?: number }) {
    try {
      const conditions = [
        from && `\`from\` = "${from}"`,
        to && `\`to\` = "${to}"`,
        color && `\`color\` = "${color}"`,
      ].filter(a => a).join(' and ');
      const SelectExpression = `
        select \`json\` from \`${this.sdbTableName}\`
        where ${conditions}
      `.trim();

      const data = await this.select({
        SelectExpression,
      });

      return {
        transactions: data.Items.map(i => transform(i.Attributes)).map(rec => JSON.parse(rec.json)),
        NextToken: data.NextToken,
      };
    } catch (err) {
      throw new Error(`Error: ${err}`);
    }
  }

  async getLatestBlockNumber(): Promise<number> {
    try {
      const data = await this.select({
        SelectExpression: `select \`blockNumber\` from \`${this.sdbTableName}\` order by \`blockNumber\` desc limit 1`,
      });
      if (data.Items.length === 0) {
        return 0;
      }

      return transform(data.Items[0]).blockNumber;
    } catch (err) {
      throw new Error(`Error: ${err}`);
    }
  }

  putAttributes(params: any): any {
    return promiseCall(this.sdb.putAttributes, params);
  }

  select(params: any): any {
    return promiseCall(this.sdb.select, params);
  }

  getAttributes(params: any): any {
    return promiseCall(this.sdb.getAttributes, params);
  }

  deleteAttributes(params: any): any {
    return promiseCall(this.sdb.deleteAttributes, params);
  }

  createDomain(params: any): any {
    return promiseCall(this.sdb.createDomain, params);
  }

}
