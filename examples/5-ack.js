//Basic queue with 1 receiver
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
    //May be a promise or not
    runner: (task, ack) => {
        console.log(`Thread got ${task}`);

        sleep(Math.ceil(Math.random() * 3 + 2) * 1000)
            .then(() => {
                console.log(`Finished ${task}`);
                
                ack();
            });

    },
    
    ack: true
});

addToQueue(5);
