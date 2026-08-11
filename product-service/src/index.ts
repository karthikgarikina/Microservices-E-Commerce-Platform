import {app} from './app';app.listen(Number(process.env.PORT||3002),()=>console.log(JSON.stringify({level:'info',service:'product-service',message:'listening',correlationId:'startup'})));
