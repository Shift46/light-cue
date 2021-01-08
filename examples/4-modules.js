//Just example. DO NOT USE.
const fs = require('fs');

let { use } = require('../index');

const createFileKeeper = filename => ({
    handler: ({type, queues, module, init}) => {
        if (init) {
            try {
                Object.assign(queues, Object.fromEntries(JSON.parse(fs.readFileSync(filename, 'utf8')).map(([name, val]) => [name, {
                    queue: val,
                    receivers: []
                }])))
            } catch (err) {
            }
        }

        if (['add_task', 'ack'].includes(type)) {
            fs.writeFileSync(filename, JSON.stringify(Object.entries(queues).map(([name, val]) => [name, [...val.receivers.map(v => v.task).filter(v => v), ...val.queue]])));
        }
    }
});

use(createFileKeeper('queue.json'));

require('./1-basic');

