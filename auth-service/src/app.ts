import express from 'express';
import jwt from 'jsonwebtoken';

const secret = () => process.env.JWT_SECRET || 'development-jwt-secret-change-me';
const users = new Map<string, {id:string;email:string;name:string;role:'USER'|'ADMIN'}>();
users.set('admin@example.com', { id:'seeded-admin', email:'admin@example.com', name:'Administrator', role:'ADMIN' });
export const app = express();
app.use(express.json());
app.use((req,res,next) => { const correlationId=req.header('X-Request-ID') || crypto.randomUUID(); res.setHeader('X-Request-ID',correlationId); console.log(JSON.stringify({level:'info',service:'auth-service',message:req.method+' '+req.path,correlationId})); next(); });
app.get('/health', (_req,res) => res.json({status:'ok',service:'auth-service'}));
app.post('/auth/token', (req,res) => {
  const {email,name,provider,providerId}=req.body || {};
  if (!email || !name || !provider || !providerId) return res.status(400).json({error:'email, name, provider and providerId are required'});
  let user=users.get(email); if(!user){ user={id:crypto.randomUUID(),email,name,role:'USER'}; users.set(email,user); }
  const accessToken=jwt.sign({sub:user.id,email:user.email,role:user.role},secret(),{expiresIn:'1h'});
  res.json({accessToken});
});
app.post('/auth/validate', (req,res) => { try { const claims=jwt.verify(req.body?.token,secret()); res.json({valid:true,claims}); } catch { res.status(401).json({valid:false}); } });
