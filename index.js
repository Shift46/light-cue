const virtualQueue = {};
const default_name = 'default_queue';
const modules = [];

global.virtualQueue = virtualQueue;

const createSender = (name = default_name) => (...task) => {
    initializeQueueIfEmpty(name);
    
    const queue = virtualQueue[name];
    
    queue.queue.push(task);

    processModules('add_task', { name, task });
    
    const receiver = queue.receivers.find(v => !v.busy);

    if (!receiver) {
        return;
    }

    const immediateTask = grabTask(name);

    if (!immediateTask) {
        return;
    }
    
    run(receiver, immediateTask);
};

const createTimeSender = ({ time, interval, name = default_name }) => {
    const sender = createSender(name);

    const date = typeof time === 'number' ? new Date(time) : time;
    
    let startTime = date.getTime() - Date.now();
    
    if (interval) {
        const delta = (date.getTime() - Date.now()) % 864E5;
        
        startTime = delta < 0 ? 864E5 + delta : delta;
    }
    
    setTimeout(() => {
        if (interval) {
            const timer = setInterval(() => sender(new Date()), interval);

            return {
                kill: () => clearInterval(timer)
            };
        }

        sender(new Date());
    }, startTime);
};

const processModules = (type, data) => modules.forEach(mod => mod.handler({ type, queues: virtualQueue, data, module: mod.name, ...(type === 'add_module' &&  mod.name === data.name && { init: true }) }));

const run = (receiver, task) => {
    receiver.busy = true;
    receiver.task = task;
    
    process.nextTick(() => {
        processModules('grab', {receiver, task});

        if (receiver.ack) {
            receiver.run(...task, receiver.ackFunction);

            return
        }

        if (receiver.run.constructor.name === "AsyncFunction") {
            receiver.run(...task, receiver.ack).then(receiver.ackFunction);

            return
        }

        receiver.run(...task, receiver.ack);
        receiver.ackFunction();
    });
};

const grabTask = name => {
    initializeQueueIfEmpty(name);
    
    return virtualQueue[name].queue.shift();
};

const initializeQueueIfEmpty = (name) => {
    if (!virtualQueue[name]) {
        virtualQueue[name] = {
            queue: [],
            receivers: []
        };
    }
};

const createReceiver = ({ name = default_name, runner, count = 1, ack = false }) => {
    initializeQueueIfEmpty(name);

    processModules('receiver_add', { name, runner, count, ack });
    
    const queue = virtualQueue[name];
    
    for (let i = 0; i < count; i++) {
        const ackFunction = () => {
            receiver.busy = false;
            receiver.task = null;

            processModules('ack', { receiver });

            const task = grabTask(name);

            if (task) {
                run(receiver, task);
            }
        };

        const receiver = {
            instance: i,
            run: runner,
            busy: false,
            task: null,
            queue: name,
            ackFunction,
            ack
        };

        queue.receivers.push(receiver);

        const task = grabTask(name);

        if (task) {
            run(receiver, task);
        }
    }
    
    return {
        add: createSender(name)
    }
};

const use = module => {
    const newModule = typeof module === 'function' ? { name: `module_${Date.now()}_${modules.length}`, handler: module } : module;
    
    modules.push(newModule);
    
    if (typeof newModule.init === 'function') {
        newModule.init({ queues: virtualQueue })
    }

    processModules('add_module', newModule);
};


module.exports = { createReceiver, createSender, createTimeSender, oneDay: 864E5, use };
