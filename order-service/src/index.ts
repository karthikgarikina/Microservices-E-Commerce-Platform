import {app}from'./app';app.listen(Number(process.env.PORT||3003),()=>console.log(JSON.stringify({level:'info',service:'order-service',message:'listening',correlationId:'startup'})));
