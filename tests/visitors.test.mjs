import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import visitors from '../api/visitors.js';
const savedFetch = globalThis.fetch;
const savedEnv = { ...process.env };
afterEach(() => { globalThis.fetch = savedFetch; for (const key of Object.keys(process.env)) if (!(key in savedEnv)) delete process.env[key]; Object.assign(process.env, savedEnv); });
function res() { return { statusCode: 200, headers: {}, setHeader(k,v){this.headers[k.toLowerCase()]=v;return this;},status(n){this.statusCode=n;return this;},json(body){this.body=body;return this;} }; }
const id = 'f55c616a-2cf2-4b6d-82c7-66fa88a947ba';
const req = (body = {}, headers = {}) => ({ method:'POST', body, headers:{host:'jxxmalmusik.com',origin:'https://jxxmalmusik.com',...headers} });
function configured() { process.env.SUPABASE_URL='https://example.supabase.co'; process.env.SUPABASE_ANON_KEY='sb_publishable_test_only'; }

test('map stores a hashed browser identifier and coarse Vercel area, with no IP, city, email or exact coordinates', async()=>{
 configured(); let body;
 globalThis.fetch=async(url,options)=>{assert.equal(String(url),'https://example.supabase.co/rest/v1/rpc/jxxmal_place_audience_dot');body=JSON.parse(options.body);assert.equal(options.headers.apikey,'sb_publishable_test_only');assert.equal(options.headers.Authorization,undefined);return new Response(null,{status:204});};
 const result=res();await visitors(req({visitorId:id,locationSource:'approximate',email:'not-stored@example.com'},{'x-vercel-ip-latitude':'12.1165','x-vercel-ip-longitude':'-61.6790','x-vercel-ip-country':'GD','x-vercel-ip-city':'Private City','x-forwarded-for':'private ip'}),result);
 assert.deepEqual(body,{p_visitor_hash:createHash('sha256').update(id).digest('hex'),p_latitude:13,p_longitude:-61,p_country:'GD'});
 assert.deepEqual(result.body,{available:true,recorded:true,coordinates:[-61,13],approximate:true});assert.equal(result.headers['cache-control'],'private, no-store, max-age=0');assert.ok(!JSON.stringify(result.body).includes(id));
});
test('permission-based locations are rounded before storage and repeated browser updates use the same hash',async()=>{
 configured(); const writes=[];globalThis.fetch=async(_url,options)=>{writes.push(JSON.parse(options.body));return new Response(null,{status:204});};
 for(const point of [[-73.9857,40.7484],[180,90],[-180,-90],[0,0]]){const result=res();await visitors(req({visitorId:id,locationSource:'browser',longitude:point[0],latitude:point[1]}),result);assert.equal(result.statusCode,200);assert.ok(writes.at(-1).p_latitude % 2 !== 0);assert.ok(writes.at(-1).p_longitude % 2 !== 0);assert.ok(Math.abs(writes.at(-1).p_latitude)<90);assert.ok(Math.abs(writes.at(-1).p_longitude)<180);}
 assert.equal(new Set(writes.map(w=>w.p_visitor_hash)).size,1);
});
test('missing approximate headers produce no zero-coordinate visitor or database write',async()=>{
 configured();globalThis.fetch=()=>assert.fail('Must not write');const result=res();await visitors(req({visitorId:id,locationSource:'approximate'}),result);assert.deepEqual(result.body,{available:false,recorded:false,coordinates:null});
});
test('map rejects invalid coordinates, source, identifiers, oversized strings and cross-origin writes',async()=>{
 configured();globalThis.fetch=()=>assert.fail('Must not write');
 for(const body of [{visitorId:'bad',locationSource:'browser'},[],null,{visitorId:id,locationSource:'browser',latitude:91,longitude:0},{visitorId:id,locationSource:'browser',latitude:'12',longitude:0},{visitorId:id,locationSource:'unknown'},'{bad']){const result=res();await visitors(req(body),result);assert.ok(result.statusCode===400||result.body.recorded===false);assert.notEqual(result.body.recorded,true);}
 const large=res();await visitors(req('x'.repeat(1025)),large);assert.equal(large.statusCode,413);
 const origin=res();await visitors(req({visitorId:id,locationSource:'approximate'},{origin:'https://another.example'}),origin);assert.equal(origin.statusCode,403);
});
test('shared map returns aggregate dots without database identifiers or private fields',async()=>{
 configured();globalThis.fetch=async(url,options)=>{assert.equal(String(url),'https://example.supabase.co/rest/v1/rpc/jxxmal_audience_map');assert.equal(options.body,'{}');return Response.json([{latitude:13,longitude:-61,visitors:2,visitor_hash:'never-expose',country:'GD'},{latitude:41,longitude:-73,visitors:'3'}, {latitude:100,longitude:0,visitors:3}]);};
 const result=res();await visitors({method:'GET'},result);assert.deepEqual(result.body,{available:true,points:[{coordinates:[-61,13],visitors:2},{coordinates:[-73,41],visitors:3}],totalVisitors:5,approximate:true});assert.ok(!JSON.stringify(result.body).includes('never-expose'));assert.equal(result.headers['cache-control'],'private, no-store, max-age=0');
});
test('map failures remain unavailable without inventing saved visits or leaking upstream details',async()=>{
 configured();globalThis.fetch=async()=>Response.json({error:'private database endpoint failure'},{status:500});
 for(const request of [{method:'GET'},req({visitorId:id,locationSource:'browser',longitude:0,latitude:0})]){const result=res();await visitors(request,result);assert.equal(result.statusCode,503);assert.equal(result.body.available,false);assert.ok(!JSON.stringify(result.body).includes('private database'));}
 delete process.env.SUPABASE_ANON_KEY;globalThis.fetch=()=>assert.fail('Must not request');const empty=res();await visitors({method:'GET'},empty);assert.equal(empty.statusCode,503);
 const method=res();await visitors({method:'DELETE'},method);assert.equal(method.statusCode,405);
});
