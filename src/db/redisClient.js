import { createClient } from 'redis';

const client = createClient({
    username: 'default',
    password: 'k4L4Iv4CW0PP6z4sISOEQusSYjc8fYmi',
    socket: {
        host: 'redis-11739.crce181.sa-east-1-2.ec2.redns.redis-cloud.com',
        port: 11739
    }
});

client.on('error', err => console.log('Redis Client Error', err));

await client.connect();

await client.set('foo', 'bar');
const result = await client.get('foo');
console.log(result)  // >>> bar
