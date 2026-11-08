import http from 'node:http';
import worker from '../dist/server/index.js';
const port=Number(process.argv[2]||8000);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid local port');
http.createServer(async(req,res)=>{
 try{
  const response=await worker.fetch(new Request('http://localhost:'+port+req.url,{method:req.method,headers:req.headers}));
  res.writeHead(response.status,Object.fromEntries(response.headers));
  if(response.body)for await(const chunk of response.body)res.write(chunk);res.end();
 }catch(_){res.writeHead(500,{'Content-Type':'text/plain'});res.end('No se pudo completar la consulta.');}
}).listen(port,'127.0.0.1',()=>process.stdout.write('Local: http://localhost:'+port+'\n'));
