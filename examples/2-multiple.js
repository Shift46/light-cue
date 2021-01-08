//Basic queue with 1 receiver and 3 "threads" (excellent for requests)
const { createSender, createReceiver } = require('../index');

const addToQueue = (x = 0) => {
    for (let i = x; i < 5 + x; i++) {
        send(i);
    }
};

const sleep = t => new Promise(r => setTimeout(r, t));

const send = createSender();

addToQueue();

createReceiver({
    runner: async task => {
        console.log(`Thread got ${task}`);

        await sleep(Math.ceil(Math.random() * 3 + 2) * 1000);

        console.log('Finished ' + task)
    },
    
    count: 3 //Few threads with same logic
});

addToQueue(5);
