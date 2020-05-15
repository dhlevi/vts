let queue  = [];
let offset = 0;

let Queue = function()
{
};

Queue.prototype.getLength = function()
{
    return (queue.length - offset);
};

Queue.prototype.isEmpty = function()
{
    return (queue.length == 0);
};

Queue.prototype.enqueue = function(item)
{
    queue.push(item);
};

Queue.prototype.dequeue = function()
{
    if (queue.length === 0) return undefined;

    // store the item at the front of the queue
    var item = queue[offset];

    // increment the offset and remove the free space if necessary
    if (++ offset * 2 >= queue.length)
    {
        queue  = queue.slice(offset);
        offset = 0;
    }

    // return the dequeued item
    return item;
};

Queue.prototype.peek = function()
{
    return (queue.length > 0 ? queue[offset] : undefined);
};

module.exports = Queue;