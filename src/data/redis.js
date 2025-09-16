import { createClient } from 'redis';

const client = createClient({
    username: 'default',
    password: 'JL63vPaF77y1yvdvBzGzX3W3PAZIs1wH',
    socket: {
        host: 'redis-14199.crce181.sa-east-1-2.ec2.redns.redis-cloud.com',
        port: 14199
    }
});

client.on('error', err => console.log('Redis Client Error', err));

await client.connect();

await client.set('foo', 'bar');
const result = await client.get('foo');
console.log(result)  // >>> bar



