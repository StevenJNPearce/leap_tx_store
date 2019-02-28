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
        {
          Name: 'from',
          Value: String(tx.from || '').toLowerCase(),
          Replace: true
        },
        { Name: 'color', Value: String(tx.color || 0), Replace: true },
        { Name: 'to', Value: String(tx.to || '').toLowerCase(), Replace: true },
        {
          Name: 'blockNumber',
          Value: String(tx.blockNumber).padStart(10, '0'), // Need for sorting, simpledb compares values lexicographically
          Replace: true
        },
        { Name: 'json', Value: JSON.stringify(tx), Replace: true }
      ]
    });
  }

  getTransactions({ from, to, color }) {
    const addrConditions = [
      from !== undefined && `\`from\` = "${from.toLowerCase()}"`,
      to !== undefined && `\`to\` = "${to.toLowerCase()}"`
    ]
      .filter(a => a)
      .join(' or ');
    const conditions = [
      addrConditions && `(${addrConditions})`,
      color !== undefined && `\`color\` = "${color}"`,
      `\`blockNumber\` is not null`
    ]
      .filter(a => a)
      .join(' and ');
    const SelectExpression = `
      select \`json\` from \`${this.sdbTableName}\`
      where ${conditions} order by \`blockNumber\` desc limit 100
    `.trim();
    console.log(SelectExpression);

    return this.select({
      SelectExpression
    })
      .then(data => {
        return {
          transactions: (data.Items || [])
            .map(i => transform(i.Attributes))
            .map(rec => JSON.parse(rec.json)),
          NextToken: data.NextToken
        };
      })
      .catch(err => {
        throw new Error(`Error: ${err}`);
      });
  }

  getLatestBlockNumber() {
    return this.select({
      SelectExpression: `select * from \`${
        this.sdbTableName
      }\` where \`blockNumber\` is not null order by \`blockNumber\` DESC limit 1`
    })
      .then(data => {
        if (!data.Items || data.Items.length === 0) {
          return 0;
        }

        return Number(transform(data.Items[0].Attributes).blockNumber);
      })
      .catch(err => {
        throw new Error(`Error: ${err}`);
      });
  }

  putAttributes(params) {
    return promiseCall(this.sdb.putAttributes.bind(this.sdb), params);
  }

  select(params) {
    return promiseCall(this.sdb.select.bind(this.sdb), params);
  }

  getAttributes(params) {
    return promiseCall(this.sdb.getAttributes.bind(this.sdb), params);
  }

  deleteAttributes(params) {
    return promiseCall(this.sdb.deleteAttributes.bind(this.sdb), params);
  }

  createDomain(params) {
    return promiseCall(this.sdb.createDomain.bind(this.sdb), params);
  }
}
