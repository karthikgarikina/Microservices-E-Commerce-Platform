import {app} from './app'; app.listen(Number(process.env.PORT||3001),()=>console.log(JSON.stringify({level:'info',service:'auth-service',message:'listening',correlationId:'startup'})));
