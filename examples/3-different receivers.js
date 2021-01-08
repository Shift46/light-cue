//Two queues with different names
const { createSender, createReceiver } = require('../index');

const sleep = t => new Promise(r => setTimeout(r, t));

const sendToQueueFoo = createSender('foo');
const sendToQueueBar = createSender('bar');

createReceiver({
    runner: async ({ x, y }) => {
        console.log(`Thread "foo" got x: ${x}, y: ${y}`);

        sendToQueueBar({ x: x ^ y, y: x * y });

        console.log(`Finished "foo" ${x}, y: ${y}`);
    },
    
    name: 'foo'
});

createReceiver({
    runner: async ({ x, y }) => {
        console.log(`Thread "bar" got x: ${x}, y: ${y}`);

        await sleep(2000);
        
        console.log(`Magic number is ${x + ~y}`);
        
        console.log(`Finished "bar" ${x}, y: ${y}`);
    },

    name: 'bar'
});

sendToQueueFoo({ x: 10, y: 20 });
sendToQueueFoo({ x: 5, y: 13 });
sendToQueueBar({ x: 10, y: 5 });

