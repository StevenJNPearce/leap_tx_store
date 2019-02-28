function promiseCall(method, params) {
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
function transform(data) {
  let attributes;
  if (Array.isArray(data)) {
    attributes = {};
    data.forEach(aPair => {
      if (!attributes[aPair.Name]) {
        attributes[aPair.Name] = {};
      }
      attributes[aPair.Name] = aPair.Value;
    });
  } else {
    attributes = [];
    Object.keys(data).forEach(anAttributeName => {
      data[anAttributeName].forEach(aValue => {
        attributes.push({
          Name: anAttributeName,
          Value: aValue,
          Replace: true
        });
      });
    });
  }
  return attributes;
}

export default class Db {
  constructor(sdb, sdbTableName) {
    this.sdb = sdb;
    this.sdbTableName = sdbTableName;
  }

  addTransaction(tx) {
    return this.putAttributes({
      DomainName: this.sdbTableName,
      ItemName: tx.hash,
      Attributes: [
        { Name: 'hash', Value: tx.hash, Replace: true },
        { Name: 'from', Value: tx.from, Replace: true },
        { Name: 'color', Value: String(tx.color), Replace: true },
        { Name: 'to', Value: tx.to, Replace: true },
        { Name: 'blockNumber', Value: String(tx.blockNumber), Replace: true },
        { Name: 'json', Value: JSON.stringify(tx), Replace: true }
      ]
    });
  }

  getTransactions({ from, to, color }) {
    const conditions = [
      from && `\`from\` = "${from}"`,
      to && `\`to\` = "${to}"`,
      color && `\`color\` = "${color}"`
    ]
      .filter(a => a)
      .join(' and ');
    const SelectExpression = `
      select \`json\` from \`${this.sdbTableName}\`
      where ${conditions}
    `.trim();

    return this.select({
      SelectExpression
    })
      .then(data => {
        return {
          transactions: data.Items.map(i => transform(i.Attributes)).map(rec =>
            JSON.parse(rec.json)
          ),
          NextToken: data.NextToken
        };
      })
      .catch(err => {
        throw new Error(`Error: ${err}`);
      });
  }

  getLatestBlockNumber() {
    return this.select({
      SelectExpression: `select \`blockNumber\` from \`${
        this.sdbTableName
      }\` order by \`blockNumber\` desc limit 1`
    })
      .then(data => {
        if (data.Items.length === 0) {
          return 0;
        }

        return transform(data.Items[0]).blockNumber;
      })
      .catch(err => {
        throw new Error(`Error: ${err}`);
      });
  }

  putAttributes(params) {
    return promiseCall(this.sdb.putAttributes, params);
  }

  select(params) {
    return promiseCall(this.sdb.select, params);
  }

  getAttributes(params) {
    return promiseCall(this.sdb.getAttributes, params);
  }

  deleteAttributes(params) {
    return promiseCall(this.sdb.deleteAttributes, params);
  }

  createDomain(params) {
    return promiseCall(this.sdb.createDomain, params);
  }
}
